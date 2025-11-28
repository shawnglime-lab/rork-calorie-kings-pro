export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingAmount: number;
  source: "database" | "ai" | "user" | "fast-food" | "barcode";
  confidence?: number;
  brand?: string;
  barcode?: string;
  timestamp: number;
}

export interface WaterEntry {
  id: string;
  ounces: number;
  timestamp: number;
}

export interface DailyLog {
  date: string;
  foods: FoodItem[];
  water: number;
  waterEntries?: WaterEntry[];
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  useAutoWaterGoal?: boolean;
}

export interface FastFoodRestaurant {
  id: string;
  name: string;
  logo: string;
  categories: FastFoodCategory[];
}

export interface FastFoodCategory {
  name: string;
  items: FastFoodItem[];
}

export interface FastFoodItem {
  id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}
