export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  timestamp: number;
}

export interface WeightGoal {
  targetWeight: number;
  startWeight: number;
  startDate: string;
  goalType: "lose" | "gain" | "maintain";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  poundsPerWeek: number;
  useCustomMacros: boolean;
  macroMode: "standard" | "muscle_conservation";
}

export interface WeightStats {
  currentWeight: number;
  startWeight: number;
  goalWeight: number;
  totalChange: number;
  weeklyChange: number;
  averageWeight: number;
  trendWeight: number;
  daysTracking: number;
}

export interface ForecastData {
  estimatedWeeksToGoal: number;
  estimatedGoalDate: string;
  currentDeficitOrSurplus: number;
  expectedWeeklyChange: number;
  status: "on_track" | "ahead" | "behind" | "maintaining";
  projectedDailyCalories: number;
  bmr: number;
  tdee: number;
}

export interface ProgressPhoto {
  id: string;
  label: "before" | "after";
  uri: string;
  date: string;
  timestamp: number;
  weightAtTime?: number;
}
