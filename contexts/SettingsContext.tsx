import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import {
  scheduleMealReminders,
  scheduleWeightReminder,
} from "@/utils/notifications";

export interface NotificationSettings {
  mealReminders: boolean;
  mealReminderTimes: string[];
  weightReminders: boolean;
  weightReminderTime: string;
  use24HourFormat: boolean;
}

export interface Settings {
  showSteps: boolean;
  showFasting: boolean;
  showProgressPics: boolean;
  stepGoal: number;
  notifications: NotificationSettings;
}

const DEFAULT_SETTINGS: Settings = {
  showSteps: true,
  showFasting: true,
  showProgressPics: true,
  stepGoal: 10000,
  notifications: {
    mealReminders: false,
    mealReminderTimes: ["08:00", "12:00", "18:00"],
    weightReminders: false,
    weightReminderTime: "08:00",
    use24HourFormat: false,
  },
};

export const [SettingsContext, useSettings] = createContextHook(() => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("settings");
        if (!stored || stored === "undefined" || stored === "null") return DEFAULT_SETTINGS;
        const parsed = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null) return DEFAULT_SETTINGS;
        
        const migratedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...(parsed.notifications || {}),
          },
        };
        
        return migratedSettings as Settings;
      } catch (error) {
        console.error("Error loading settings:", error);
        await AsyncStorage.removeItem("settings");
        return DEFAULT_SETTINGS;
      }
    },
  });

  const { mutate: mutateUpdateSettings } = useMutation({
    mutationFn: async (settings: Settings) => {
      await AsyncStorage.setItem("settings", JSON.stringify(settings));
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const settings = useMemo<Settings>(() => settingsQuery.data || DEFAULT_SETTINGS, [settingsQuery.data]);

  const updateSettings = useCallback(
    (newSettings: Partial<Settings>) => {
      const updated = { ...settings, ...newSettings };
      mutateUpdateSettings(updated);
    },
    [settings, mutateUpdateSettings]
  );

  useEffect(() => {
    const rescheduleNotifications = async () => {
      if (Platform.OS === "web" || !settings || settingsQuery.isLoading) {
        return;
      }

      try {
        if (settings.notifications.mealReminders) {
          console.log("Rescheduling meal reminders on app start");
          await scheduleMealReminders(settings.notifications.mealReminderTimes);
        }

        if (settings.notifications.weightReminders) {
          console.log("Rescheduling weight reminder on app start");
          await scheduleWeightReminder(settings.notifications.weightReminderTime);
        }
      } catch (error) {
        console.error("Error rescheduling notifications:", error);
      }
    };

    rescheduleNotifications();
  }, [settings, settingsQuery.isLoading]);

  return useMemo(
    () => ({
      settings,
      updateSettings,
      isLoading: settingsQuery.isLoading,
    }),
    [settings, updateSettings, settingsQuery.isLoading]
  );
});
