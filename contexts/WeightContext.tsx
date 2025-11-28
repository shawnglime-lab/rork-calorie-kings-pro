import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { WeightEntry, WeightGoal, WeightStats, ForecastData, ProgressPhoto } from "@/types/weight";

const DEFAULT_WEIGHT_GOAL: WeightGoal = {
  targetWeight: 0,
  startWeight: 0,
  startDate: new Date().toISOString().split("T")[0],
  goalType: "maintain",
  activityLevel: "moderate",
  poundsPerWeek: 0,
  useCustomMacros: false,
};

function calculateBMR(weight: number, height: number = 70, age: number = 30, isMale: boolean = true): number {
  if (isMale) {
    return 10 * weight * 0.453592 + 6.25 * height * 2.54 - 5 * age + 5;
  } else {
    return 10 * weight * 0.453592 + 6.25 * height * 2.54 - 5 * age - 161;
  }
}

function calculateTDEE(bmr: number, activityLevel: WeightGoal["activityLevel"]): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return bmr * multipliers[activityLevel];
}

function calculateMovingAverage(entries: WeightEntry[], days: number = 7): number {
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const recent = sorted.slice(0, days);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, entry) => sum + entry.weight, 0) / recent.length;
}

function calculateTrendWeight(entries: WeightEntry[]): number {
  if (entries.length < 2) return entries[0]?.weight || 0;
  
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const last14 = sorted.slice(-14);
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  const n = last14.length;
  
  last14.forEach((entry, i) => {
    sumX += i;
    sumY += entry.weight;
    sumXY += i * entry.weight;
    sumX2 += i * i;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return intercept + slope * (n - 1);
}

export function calculateRecommendedMacros(
  currentWeight: number,
  height: number,
  age: number,
  isMale: boolean,
  activityLevel: WeightGoal["activityLevel"],
  goalType: WeightGoal["goalType"],
  poundsPerWeek: number
): { calories: number; protein: number; carbs: number; fat: number } {
  const bmr = calculateBMR(currentWeight, height, age, isMale);
  const tdee = calculateTDEE(bmr, activityLevel);
  
  const caloriesPerPound = 3500;
  const weeklyCalorieChange = poundsPerWeek * caloriesPerPound;
  const dailyCalorieChange = weeklyCalorieChange / 7;
  
  let targetCalories = tdee;
  if (goalType === "lose") {
    targetCalories = tdee - dailyCalorieChange;
  } else if (goalType === "gain") {
    targetCalories = tdee + dailyCalorieChange;
  }
  
  targetCalories = Math.round(Math.max(1200, targetCalories));
  
  const proteinGramsPerPound = 0.8;
  const protein = Math.round(currentWeight * proteinGramsPerPound);
  
  const proteinCalories = protein * 4;
  const fatPercentage = 0.25;
  const fatCalories = targetCalories * fatPercentage;
  const fat = Math.round(fatCalories / 9);
  
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbs = Math.round(carbCalories / 4);
  
  return {
    calories: targetCalories,
    protein,
    carbs: Math.max(0, carbs),
    fat,
  };
}

export const [WeightContext, useWeightTracker] = createContextHook(() => {
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ["weightEntries"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("weightEntries");
        if (!stored || stored === "undefined" || stored === "null") return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed;
      } catch (error) {
        console.error("Error loading weight entries:", error);
        await AsyncStorage.removeItem("weightEntries");
        return [];
      }
    },
  });

  const goalQuery = useQuery({
    queryKey: ["weightGoal"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("weightGoal");
        if (!stored || stored === "undefined" || stored === "null") return DEFAULT_WEIGHT_GOAL;
        const parsed = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null) return DEFAULT_WEIGHT_GOAL;
        
        const migratedGoal = {
          ...DEFAULT_WEIGHT_GOAL,
          ...parsed,
          poundsPerWeek: parsed.poundsPerWeek ?? (parsed.goalType === "lose" ? 1 : (parsed.goalType === "gain" ? 0.5 : 0)),
          useCustomMacros: parsed.useCustomMacros ?? false,
        };
        
        return migratedGoal;
      } catch (error) {
        console.error("Error loading weight goal:", error);
        await AsyncStorage.removeItem("weightGoal");
        return DEFAULT_WEIGHT_GOAL;
      }
    },
  });

  const profileQuery = useQuery({
    queryKey: ["weightProfile"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("weightProfile");
        if (!stored || stored === "undefined" || stored === "null") return { height: 70, age: 30, isMale: true, weight: 0 };
        const parsed = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null) return { height: 70, age: 30, isMale: true, weight: 0 };
        return parsed;
      } catch (error) {
        console.error("Error loading weight profile:", error);
        await AsyncStorage.removeItem("weightProfile");
        return { height: 70, age: 30, isMale: true, weight: 0 };
      }
    },
  });

  const photosQuery = useQuery({
    queryKey: ["progressPhotos"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("progressPhotos");
        if (!stored || stored === "undefined" || stored === "null") return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed;
      } catch (error) {
        console.error("Error loading progress photos:", error);
        await AsyncStorage.removeItem("progressPhotos");
        return [];
      }
    },
  });

  const { mutate: mutateUpdateEntries } = useMutation({
    mutationFn: async (entries: WeightEntry[]) => {
      await AsyncStorage.setItem("weightEntries", JSON.stringify(entries));
      return entries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightEntries"] });
    },
  });

  const { mutate: mutateUpdateGoal } = useMutation({
    mutationFn: async (goal: WeightGoal) => {
      await AsyncStorage.setItem("weightGoal", JSON.stringify(goal));
      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightGoal"] });
    },
  });

  const { mutate: mutateUpdateProfile } = useMutation({
    mutationFn: async (profile: { height: number; age: number; isMale: boolean }) => {
      await AsyncStorage.setItem("weightProfile", JSON.stringify(profile));
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightProfile"] });
    },
  });

  const { mutate: mutateUpdatePhotos } = useMutation({
    mutationFn: async (photos: ProgressPhoto[]) => {
      await AsyncStorage.setItem("progressPhotos", JSON.stringify(photos));
      return photos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressPhotos"] });
    },
  });

  const entries = useMemo<WeightEntry[]>(() => entriesQuery.data || [], [entriesQuery.data]);
  const goal = useMemo<WeightGoal>(() => goalQuery.data || DEFAULT_WEIGHT_GOAL, [goalQuery.data]);
  const profile = useMemo(() => profileQuery.data || { height: 70, age: 30, isMale: true, weight: 0 }, [profileQuery.data]);
  const photos = useMemo<ProgressPhoto[]>(() => photosQuery.data || [], [photosQuery.data]);

  const stats = useMemo<WeightStats>(() => {
    if (entries.length === 0) {
      return {
        currentWeight: goal.startWeight || 0,
        startWeight: goal.startWeight || 0,
        goalWeight: goal.targetWeight || 0,
        totalChange: 0,
        weeklyChange: 0,
        averageWeight: goal.startWeight || 0,
        trendWeight: goal.startWeight || 0,
        daysTracking: 0,
      };
    }

    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    const currentWeight = sorted[0].weight;
    const averageWeight = calculateMovingAverage(entries, 7);
    const trendWeight = calculateTrendWeight(entries);

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    const entriesLastWeek = recentEntries.filter(e => e.timestamp >= oneWeekAgo);
    
    let weeklyChange = 0;
    if (entriesLastWeek.length >= 2) {
      const sortedByTime = entriesLastWeek.sort((a, b) => a.timestamp - b.timestamp);
      weeklyChange = sortedByTime[sortedByTime.length - 1].weight - sortedByTime[0].weight;
    } else if (recentEntries.length >= 2) {
      weeklyChange = recentEntries[0].weight - recentEntries[1].weight;
    }

    const startWeight = goal.startWeight || sorted[sorted.length - 1].weight;
    const totalChange = currentWeight - startWeight;

    const firstEntry = sorted[sorted.length - 1];
    const daysTracking = Math.floor((Date.now() - firstEntry.timestamp) / (1000 * 60 * 60 * 24));

    return {
      currentWeight,
      startWeight,
      goalWeight: goal.targetWeight,
      totalChange,
      weeklyChange,
      averageWeight,
      trendWeight,
      daysTracking,
    };
  }, [entries, goal]);

  const forecast = useCallback((dailyCalories: number): ForecastData => {
    const currentWeight = stats.currentWeight || 0;
    const targetWeight = goal.targetWeight || 0;
    
    const currentBmr = calculateBMR(currentWeight, profile.height, profile.age, profile.isMale);
    const activityMultiplier = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    }[goal.activityLevel];
    const currentTdee = currentBmr * activityMultiplier;
    const dailyDeficit = currentTdee - dailyCalories;

    const caloriesPerPound = 3500;
    const weeklyLossLBS = (dailyDeficit * 7) / caloriesPerPound;

    let estimatedWeeksToGoal = 0;
    const weightDifference = targetWeight - currentWeight;
    
    console.log('[Forecast] Current weight:', currentWeight);
    console.log('[Forecast] Target weight:', targetWeight);
    console.log('[Forecast] Weight difference:', weightDifference);
    console.log('[Forecast] Daily calories:', dailyCalories);
    console.log('[Forecast] Current BMR:', currentBmr);
    console.log('[Forecast] Activity multiplier:', activityMultiplier);
    console.log('[Forecast] Current TDEE:', currentTdee);
    console.log('[Forecast] Daily deficit:', dailyDeficit);
    console.log('[Forecast] Weekly loss (lbs):', weeklyLossLBS);
    
    if (currentWeight === 0 || targetWeight === 0) {
      estimatedWeeksToGoal = 0;
    } else if (Math.abs(weightDifference) < 0.1) {
      estimatedWeeksToGoal = 0;
    } else if (Math.abs(weeklyLossLBS) < 0.01) {
      estimatedWeeksToGoal = Number.POSITIVE_INFINITY;
    } else {
      let simulatedWeight = currentWeight;
      let weeks = 0;
      const maxWeeks = 520;
      const isLosingWeight = weightDifference < 0;
      
      console.log('[Forecast] Starting simulation, isLosingWeight:', isLosingWeight);
      
      while (weeks < maxWeeks) {
        const weekBmr = calculateBMR(simulatedWeight, profile.height, profile.age, profile.isMale);
        const weekTdee = weekBmr * activityMultiplier;
        const weekDailyDeficit = weekTdee - dailyCalories;
        const weeklyWeightChange = (weekDailyDeficit * 7) / caloriesPerPound;
        
        simulatedWeight -= weeklyWeightChange;
        weeks++;
        
        if (isLosingWeight) {
          if (simulatedWeight <= targetWeight) {
            estimatedWeeksToGoal = weeks;
            console.log('[Forecast] Goal reached at week', weeks, 'weight:', simulatedWeight);
            break;
          }
        } else {
          if (simulatedWeight >= targetWeight) {
            estimatedWeeksToGoal = weeks;
            console.log('[Forecast] Goal reached at week', weeks, 'weight:', simulatedWeight);
            break;
          }
        }
        
        if (weeks % 10 === 0) {
          console.log('[Forecast] Week', weeks, 'simulated weight:', simulatedWeight);
        }
      }
      
      if (weeks >= maxWeeks) {
        console.log('[Forecast] Max weeks reached, goal not achievable');
        estimatedWeeksToGoal = Number.POSITIVE_INFINITY;
      }
    }

    const today = new Date();
    const goalDate = Number.isFinite(estimatedWeeksToGoal) && estimatedWeeksToGoal > 0
      ? new Date(today.getTime() + estimatedWeeksToGoal * 7 * 24 * 60 * 60 * 1000)
      : today;
    const estimatedGoalDate = goalDate.toISOString().split("T")[0];

    let status: ForecastData["status"] = "maintaining";
    if (goal.goalType === "lose") {
      if (weeklyLossLBS >= 0.5 && weeklyLossLBS <= 2) status = "on_track";
      else if (weeklyLossLBS > 2) status = "ahead";
      else if (weeklyLossLBS < 0.5) status = "behind";
    } else if (goal.goalType === "gain") {
      if (weeklyLossLBS <= -0.5 && weeklyLossLBS >= -2) status = "on_track";
      else if (weeklyLossLBS < -2) status = "ahead";
      else if (weeklyLossLBS > -0.5) status = "behind";
    } else {
      if (Math.abs(weeklyLossLBS) <= 0.2) status = "on_track";
      else if (Math.abs(weeklyLossLBS) <= 0.5) status = "behind";
    }

    return {
      estimatedWeeksToGoal: Number.isFinite(estimatedWeeksToGoal) && estimatedWeeksToGoal > 0 ? estimatedWeeksToGoal : 0,
      estimatedGoalDate,
      currentDeficitOrSurplus: dailyDeficit,
      expectedWeeklyChange: -weeklyLossLBS,
      status,
      projectedDailyCalories: dailyCalories,
      bmr: currentBmr,
      tdee: currentTdee,
    };
  }, [stats, goal, profile]);

  const addWeightEntry = useCallback((weight: number, date?: string) => {
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: date || new Date().toISOString().split("T")[0],
      weight,
      timestamp: Date.now(),
    };
    mutateUpdateEntries([...entries, entry]);
  }, [entries, mutateUpdateEntries]);

  const removeWeightEntry = useCallback((id: string) => {
    mutateUpdateEntries(entries.filter(e => e.id !== id));
  }, [entries, mutateUpdateEntries]);

  const updateWeightEntry = useCallback((id: string, newWeight: number, newDate?: string) => {
    mutateUpdateEntries(
      entries.map(e => e.id === id ? { ...e, weight: newWeight, ...(newDate && { date: newDate }) } : e)
    );
  }, [entries, mutateUpdateEntries]);

  const setStartWeight = useCallback((weight: number) => {
    mutateUpdateGoal({ ...goal, startWeight: weight });
  }, [goal, mutateUpdateGoal]);

  const updateWeightGoal = useCallback((newGoal: Partial<WeightGoal>) => {
    mutateUpdateGoal({ ...goal, ...newGoal });
  }, [goal, mutateUpdateGoal]);

  const updateProfile = useCallback((newProfile: Partial<typeof profile>) => {
    mutateUpdateProfile({ ...profile, ...newProfile });
  }, [profile, mutateUpdateProfile]);

  const updateStartWeightAndDate = useCallback((startWeight: number, startDate: string) => {
    mutateUpdateGoal({ ...goal, startWeight, startDate });
  }, [goal, mutateUpdateGoal]);

  const addPhoto = useCallback((label: "before" | "after", uri: string, weightAtTime?: number) => {
    const photo: ProgressPhoto = {
      id: Date.now().toString(),
      label,
      uri,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      weightAtTime,
    };
    mutateUpdatePhotos([...photos, photo]);
  }, [photos, mutateUpdatePhotos]);

  const removePhoto = useCallback((id: string) => {
    mutateUpdatePhotos(photos.filter(p => p.id !== id));
  }, [photos, mutateUpdatePhotos]);

  const replacePhoto = useCallback((label: "before" | "after", uri: string, weightAtTime?: number) => {
    const filteredPhotos = photos.filter(p => p.label !== label);
    const photo: ProgressPhoto = {
      id: Date.now().toString(),
      label,
      uri,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      weightAtTime,
    };
    mutateUpdatePhotos([...filteredPhotos, photo]);
  }, [photos, mutateUpdatePhotos]);

  const updatePhotoDate = useCallback((id: string, newDate: string) => {
    mutateUpdatePhotos(
      photos.map(p => p.id === id ? { ...p, date: newDate } : p)
    );
  }, [photos, mutateUpdatePhotos]);

  const updatePhotoWeight = useCallback((id: string, newWeight: number) => {
    mutateUpdatePhotos(
      photos.map(p => p.id === id ? { ...p, weightAtTime: newWeight } : p)
    );
  }, [photos, mutateUpdatePhotos]);

  return useMemo(
    () => ({
      entries,
      goal,
      profile,
      photos,
      stats,
      forecast,
      addWeightEntry,
      removeWeightEntry,
      updateWeightEntry,
      updateWeightGoal,
      setStartWeight,
      updateProfile,
      addPhoto,
      removePhoto,
      replacePhoto,
      updatePhotoDate,
      updatePhotoWeight,
      updateStartWeightAndDate,
      isLoading: entriesQuery.isLoading || goalQuery.isLoading,
    }),
    [
      entries,
      goal,
      profile,
      photos,
      stats,
      forecast,
      addWeightEntry,
      removeWeightEntry,
      updateWeightEntry,
      updateWeightGoal,
      setStartWeight,
      updateProfile,
      addPhoto,
      removePhoto,
      replacePhoto,
      updatePhotoDate,
      updatePhotoWeight,
      updateStartWeightAndDate,
      entriesQuery.isLoading,
      goalQuery.isLoading,
    ]
  );
});
