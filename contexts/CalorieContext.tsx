import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { FoodItem, DailyLog, UserGoals, WaterEntry } from "@/types/food";
import { useSavedFoods } from "@/contexts/SavedFoodsContext";

const DEFAULT_GOALS: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  water: 64,
  useAutoWaterGoal: false,
};

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export const [CalorieContext, useCalorieTracker] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { addToRecent } = useSavedFoods();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("goals");
        if (!stored || stored === "undefined" || stored === "null") return DEFAULT_GOALS;
        const parsed = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null) return DEFAULT_GOALS;
        return parsed;
      } catch (error) {
        console.error("Error loading goals:", error);
        await AsyncStorage.removeItem("goals");
        return DEFAULT_GOALS;
      }
    },
  });

  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("logs");
        if (!stored || stored === "undefined" || stored === "null") return {};
        const parsed = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
        return parsed;
      } catch (error) {
        console.error("Error loading logs:", error);
        await AsyncStorage.removeItem("logs");
        return {};
      }
    },
  });

  const { mutate: mutateUpdateLogs } = useMutation({
    mutationFn: async (logs: Record<string, DailyLog>) => {
      await AsyncStorage.setItem("logs", JSON.stringify(logs));
      return logs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });

  const { mutate: mutateUpdateGoals } = useMutation({
    mutationFn: async (goals: UserGoals) => {
      await AsyncStorage.setItem("goals", JSON.stringify(goals));
      return goals;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const goals = goalsQuery.data || DEFAULT_GOALS;
  const logs = useMemo(() => logsQuery.data || {}, [logsQuery.data]);
  const todayLog = useMemo(() => {
    const log = logs[selectedDate] || { date: selectedDate, foods: [], water: 0, waterEntries: [] };
    
    if (log.waterEntries && log.waterEntries.length > 0) {
      const calculatedWater = log.waterEntries.reduce((sum: number, entry: WaterEntry) => sum + entry.ounces, 0);
      return { ...log, water: calculatedWater };
    }
    
    return { ...log, water: 0, waterEntries: [] };
  }, [logs, selectedDate]);

  const totals = useMemo(() => {
    return todayLog.foods.reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, food: FoodItem) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayLog.foods]);

  const addFood = useCallback((food: FoodItem) => {
    const newLogs = {
      ...logs,
      [selectedDate]: {
        date: selectedDate,
        foods: [...todayLog.foods, { ...food, timestamp: Date.now() }],
        water: todayLog.water,
        waterEntries: todayLog.waterEntries || [],
      },
    };
    mutateUpdateLogs(newLogs);
    addToRecent(food);
  }, [logs, selectedDate, todayLog, mutateUpdateLogs, addToRecent]);

  const addFoods = useCallback((foods: FoodItem[]) => {
    const timestamp = Date.now();
    const newFoods = foods.map(food => ({ ...food, timestamp }));
    const newLogs = {
      ...logs,
      [selectedDate]: {
        date: selectedDate,
        foods: [...todayLog.foods, ...newFoods],
        water: todayLog.water,
        waterEntries: todayLog.waterEntries || [],
      },
    };
    mutateUpdateLogs(newLogs);
    foods.forEach(food => addToRecent(food));
  }, [logs, selectedDate, todayLog, mutateUpdateLogs, addToRecent]);

  const removeFood = useCallback((foodId: string) => {
    const newLogs = {
      ...logs,
      [selectedDate]: {
        ...todayLog,
        foods: todayLog.foods.filter((f: FoodItem) => f.id !== foodId),
      },
    };
    mutateUpdateLogs(newLogs);
  }, [logs, selectedDate, todayLog, mutateUpdateLogs]);

  const addWater = useCallback((ounces: number) => {
    const newEntry: WaterEntry = {
      id: Math.random().toString(36).substring(7),
      ounces,
      timestamp: Date.now(),
    };
    const updatedEntries = [...(todayLog.waterEntries || []), newEntry];
    const newWaterTotal = updatedEntries.reduce((sum: number, entry: WaterEntry) => sum + entry.ounces, 0);
    
    const newLogs = {
      ...logs,
      [selectedDate]: {
        ...todayLog,
        water: newWaterTotal,
        waterEntries: updatedEntries,
      },
    };
    mutateUpdateLogs(newLogs);
  }, [logs, selectedDate, todayLog, mutateUpdateLogs]);

  const removeWater = useCallback((entryId: string) => {
    const entry = todayLog.waterEntries?.find((e: WaterEntry) => e.id === entryId);
    if (!entry) return;

    const updatedEntries = (todayLog.waterEntries || []).filter((e: WaterEntry) => e.id !== entryId);
    const newWaterTotal = updatedEntries.reduce((sum: number, entry: WaterEntry) => sum + entry.ounces, 0);

    const newLogs = {
      ...logs,
      [selectedDate]: {
        ...todayLog,
        water: newWaterTotal,
        waterEntries: updatedEntries,
      },
    };
    mutateUpdateLogs(newLogs);
  }, [logs, selectedDate, todayLog, mutateUpdateLogs]);

  const setWater = useCallback((amount: number) => {
    const newLogs = {
      ...logs,
      [selectedDate]: {
        ...todayLog,
        water: amount,
        waterEntries: [],
      },
    };
    mutateUpdateLogs(newLogs);
  }, [logs, selectedDate, todayLog, mutateUpdateLogs]);

  const updateGoals = useCallback((newGoals: UserGoals) => {
    mutateUpdateGoals(newGoals);
  }, [mutateUpdateGoals]);

  const updateFood = useCallback((updatedFood: FoodItem) => {
    const newLogs = {
      ...logs,
      [selectedDate]: {
        ...todayLog,
        foods: todayLog.foods.map((f: FoodItem) => f.id === updatedFood.id ? updatedFood : f),
      },
    };
    mutateUpdateLogs(newLogs);
  }, [logs, selectedDate, todayLog, mutateUpdateLogs]);

  return useMemo(
    () => ({
      goals,
      todayLog,
      totals,
      addFood,
      addFoods,
      updateFood,
      removeFood,
      addWater,
      removeWater,
      setWater,
      updateGoals,
      selectedDate,
      setSelectedDate,
      logs,
      isLoading: goalsQuery.isLoading || logsQuery.isLoading,
    }),
    [
      goals,
      todayLog,
      totals,
      addFood,
      addFoods,
      updateFood,
      removeFood,
      addWater,
      removeWater,
      setWater,
      updateGoals,
      selectedDate,
      setSelectedDate,
      logs,
      goalsQuery.isLoading,
      logsQuery.isLoading,
    ]
  );
});
