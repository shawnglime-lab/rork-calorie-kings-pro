import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { FoodItem } from "@/types/food";

export interface SavedFoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingAmount: number;
  brand?: string;
  barcode?: string;
  createdAt: number;
  lastUsed?: number;
  usageCount: number;
}

export const [SavedFoodsContext, useSavedFoods] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const savedFoodsQuery = useQuery({
    queryKey: ["savedFoods"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("savedFoods");
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed as SavedFoodItem[];
      } catch (error) {
        console.error("Error loading saved foods:", error);
        return [];
      }
    },
  });

  const { mutate: mutateSavedFoods } = useMutation({
    mutationFn: async (foods: SavedFoodItem[]) => {
      await AsyncStorage.setItem("savedFoods", JSON.stringify(foods));
      return foods;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFoods"] });
    },
  });

  const recentFoodsQuery = useQuery({
    queryKey: ["recentFoods"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("recentFoods");
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed as SavedFoodItem[];
      } catch (error) {
        console.error("Error loading recent foods:", error);
        return [];
      }
    },
  });

  const { mutate: mutateRecentFoods } = useMutation({
    mutationFn: async (foods: SavedFoodItem[]) => {
      await AsyncStorage.setItem("recentFoods", JSON.stringify(foods));
      return foods;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentFoods"] });
    },
  });

  const savedFoods = useMemo(() => savedFoodsQuery.data || [], [savedFoodsQuery.data]);
  const recentFoods = useMemo(() => recentFoodsQuery.data || [], [recentFoodsQuery.data]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return savedFoods;
    const query = searchQuery.toLowerCase();
    return savedFoods.filter(food => 
      food.name.toLowerCase().includes(query) ||
      (food.brand && food.brand.toLowerCase().includes(query))
    );
  }, [savedFoods, searchQuery]);

  const filteredRecentFoods = useMemo(() => {
    if (!searchQuery) return recentFoods;
    const query = searchQuery.toLowerCase();
    return recentFoods.filter(food => 
      food.name.toLowerCase().includes(query) ||
      (food.brand && food.brand.toLowerCase().includes(query))
    );
  }, [recentFoods, searchQuery]);

  const sortedFoods = useMemo(() => {
    return [...filteredFoods].sort((a, b) => {
      // Sort by usage count first, then by last used date
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return (b.lastUsed || b.createdAt) - (a.lastUsed || a.createdAt);
    });
  }, [filteredFoods]);

  const addToRecent = useCallback((food: FoodItem & { brand?: string; barcode?: string }) => {
    const newRecentFood: SavedFoodItem = {
      id: Math.random().toString(36).substring(7),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSize: food.servingSize,
      servingAmount: food.servingAmount,
      brand: food.brand,
      barcode: food.barcode,
      createdAt: Date.now(),
      usageCount: 1,
    };

    // Check if food already exists in recent
    // For recent foods, we might want to move it to top even if it exists
    const existingIndex = recentFoods.findIndex(f => 
      f.name === food.name && 
      f.brand === food.brand &&
      f.servingSize === food.servingSize
    );

    let updated = [...recentFoods];
    if (existingIndex !== -1) {
      updated.splice(existingIndex, 1);
    }
    
    updated.unshift(newRecentFood);
    
    // Limit to 50 items
    if (updated.length > 50) {
      updated = updated.slice(0, 50);
    }
    
    mutateRecentFoods(updated);
  }, [recentFoods, mutateRecentFoods]);

  const deleteFromRecent = useCallback((id: string) => {
    mutateRecentFoods(recentFoods.filter(food => food.id !== id));
  }, [recentFoods, mutateRecentFoods]);

  const saveFood = useCallback((food: FoodItem & { brand?: string; barcode?: string }) => {
    const newSavedFood: SavedFoodItem = {
      id: Math.random().toString(36).substring(7),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSize: food.servingSize,
      servingAmount: food.servingAmount,
      brand: food.brand,
      barcode: food.barcode,
      createdAt: Date.now(),
      usageCount: 0,
    };

    // Check if food already exists
    const existingIndex = savedFoods.findIndex(f => 
      f.name === food.name && 
      f.brand === food.brand &&
      f.servingSize === food.servingSize
    );

    if (existingIndex !== -1) {
      // Update existing food
      const updated = [...savedFoods];
      updated[existingIndex] = {
        ...updated[existingIndex],
        lastUsed: Date.now(),
        usageCount: updated[existingIndex].usageCount + 1,
      };
      mutateSavedFoods(updated);
    } else {
      // Add new food
      mutateSavedFoods([...savedFoods, newSavedFood]);
    }
  }, [savedFoods, mutateSavedFoods]);

  const markAsUsed = useCallback((id: string) => {
    const updated = savedFoods.map(food => 
      food.id === id 
        ? { ...food, lastUsed: Date.now(), usageCount: food.usageCount + 1 }
        : food
    );
    mutateSavedFoods(updated);
  }, [savedFoods, mutateSavedFoods]);

  const removeSavedFood = useCallback((id: string) => {
    mutateSavedFoods(savedFoods.filter(food => food.id !== id));
  }, [savedFoods, mutateSavedFoods]);

  const getFoodItem = useCallback((savedFood: SavedFoodItem): FoodItem => {
    return {
      id: Math.random().toString(36).substring(7),
      name: savedFood.name,
      calories: savedFood.calories,
      protein: savedFood.protein,
      carbs: savedFood.carbs,
      fat: savedFood.fat,
      servingSize: savedFood.servingSize,
      servingAmount: savedFood.servingAmount,
      source: "user",
      brand: savedFood.brand,
      barcode: savedFood.barcode,
      timestamp: Date.now(),
    };
  }, []);

  return useMemo(
    () => ({
      savedFoods: sortedFoods,
      recentFoods: filteredRecentFoods,
      searchQuery,
      setSearchQuery,
      saveFood,
      addToRecent,
      deleteFromRecent,
      markAsUsed,
      removeSavedFood,
      getFoodItem,
      isLoading: savedFoodsQuery.isLoading || recentFoodsQuery.isLoading,
    }),
    [sortedFoods, filteredRecentFoods, searchQuery, setSearchQuery, saveFood, addToRecent, deleteFromRecent, markAsUsed, removeSavedFood, getFoodItem, savedFoodsQuery.isLoading, recentFoodsQuery.isLoading]
  );
});