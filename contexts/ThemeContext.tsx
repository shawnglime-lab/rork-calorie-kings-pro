import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface Theme {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ColorScheme;
}

export interface ColorScheme {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  
  background: string;
  surface: string;
  card: string;
  
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  success: string;
  warning: string;
  error: string;
  info: string;
  
  border: string;
  borderLight: string;
  
  protein: string;
  carbs: string;
  fats: string;
  water: string;
  
  overlay: string;
  shadow: string;
}

const lightColors: ColorScheme = {
  primary: "#00C27A",
  primaryDark: "#00DDAF",
  secondary: "#2D7DFF",
  accent: "#F59E0B",
  
  background: "#F5F7FB",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  
  success: "#00C27A",
  warning: "#F59E0B",
  error: "#FF4D67",
  info: "#2D7DFF",
  
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  
  protein: "#FF4D67",
  carbs: "#2D7DFF",
  fats: "#F59E0B",
  water: "#06B6D4",
  
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(15, 35, 80, 0.08)",
};

const darkColors: ColorScheme = {
  primary: "#00C27A",
  primaryDark: "#00DDAF",
  secondary: "#2D7DFF",
  accent: "#F59E0B",
  
  background: "#060814",
  surface: "#101321",
  card: "#101321",
  
  text: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  
  success: "#00C27A",
  warning: "#F59E0B",
  error: "#FF4D67",
  info: "#2D7DFF",
  
  border: "#374151",
  borderLight: "#1F2937",
  
  protein: "#FF4D67",
  carbs: "#2D7DFF",
  fats: "#F59E0B",
  water: "#22D3EE",
  
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.6)",
};

const DEFAULT_MODE: ThemeMode = "dark";

export const [ThemeContext, useTheme] = createContextHook(() => {
  const queryClient = useQueryClient();
  const systemColorScheme = useColorScheme();

  const modeQuery = useQuery({
    queryKey: ["themeMode"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("themeMode");
        if (!stored || stored === "undefined" || stored === "null") return DEFAULT_MODE;
        if (stored === "system" || stored === "light" || stored === "dark") {
          return stored as ThemeMode;
        }
        return DEFAULT_MODE;
      } catch (error) {
        console.error("Error loading theme mode:", error);
        await AsyncStorage.removeItem("themeMode");
        return DEFAULT_MODE;
      }
    },
  });

  const { mutate: mutateUpdateMode } = useMutation({
    mutationFn: async (mode: ThemeMode) => {
      await AsyncStorage.setItem("themeMode", mode);
      return mode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themeMode"] });
    },
  });

  const mode = useMemo<ThemeMode>(() => modeQuery.data || DEFAULT_MODE, [modeQuery.data]);

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    return "dark";
  }, []);

  const colors = useMemo<ColorScheme>(() => {
    return resolvedTheme === "dark" ? darkColors : lightColors;
  }, [resolvedTheme]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    mutateUpdateMode(newMode);
  }, [mutateUpdateMode]);

  const theme = useMemo<Theme>(() => ({
    mode,
    resolvedTheme,
    colors,
  }), [mode, resolvedTheme, colors]);

  return useMemo(
    () => ({
      theme,
      setThemeMode,
      isLoading: modeQuery.isLoading,
    }),
    [theme, setThemeMode, modeQuery.isLoading]
  );
});
