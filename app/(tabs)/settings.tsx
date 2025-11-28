import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings as SettingsIcon,
  Bell,
  HelpCircle,
  Info,
  Trash2,
  Download,
  ChevronRight,
  Clock,
  Plus,
  X,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import TimePicker from "@/components/TimePicker";
import { formatTime } from "@/utils/time";
import {
  requestNotificationPermissions,
  scheduleMealReminders,
  scheduleWeightReminder,
  cancelMealReminders,
  cancelWeightReminder,
} from "@/utils/notifications";

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  
  const [isUpdatingMealReminders, setIsUpdatingMealReminders] = useState(false);
  const [isUpdatingWeightReminders, setIsUpdatingWeightReminders] = useState(false);
  const [showTimePickerFor, setShowTimePickerFor] = useState<{ type: "meal" | "weight"; index?: number } | null>(null);
  const [stepGoalInput, setStepGoalInput] = useState(settings.stepGoal.toString());

  const handleToggleMealReminders = async (value: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Notifications are not supported on web. Please use the mobile app.");
      return;
    }

    setIsUpdatingMealReminders(true);

    try {
      if (value) {
        const hasPermission = await requestNotificationPermissions();
        
        if (!hasPermission) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive meal reminders."
          );
          setIsUpdatingMealReminders(false);
          return;
        }

        await scheduleMealReminders(settings.notifications.mealReminderTimes);
        
        updateSettings({
          notifications: {
            ...settings.notifications,
            mealReminders: true,
          },
        });

        const formattedTimes = settings.notifications.mealReminderTimes
          .map(time => formatTime(time, settings.notifications.use24HourFormat))
          .join(", ");
        Alert.alert(
          "Reminders Enabled",
          `You'll receive meal reminders at ${formattedTimes}`
        );
      } else {
        await cancelMealReminders();
        
        updateSettings({
          notifications: {
            ...settings.notifications,
            mealReminders: false,
          },
        });

        Alert.alert("Reminders Disabled", "Meal reminders have been turned off.");
      }
    } catch (error) {
      console.error("Error toggling meal reminders:", error);
      Alert.alert("Error", "Failed to update meal reminders. Please try again.");
    } finally {
      setIsUpdatingMealReminders(false);
    }
  };

  const handleToggleWeightReminders = async (value: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Notifications are not supported on web. Please use the mobile app.");
      return;
    }

    setIsUpdatingWeightReminders(true);

    try {
      if (value) {
        const hasPermission = await requestNotificationPermissions();
        
        if (!hasPermission) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive weight reminders."
          );
          setIsUpdatingWeightReminders(false);
          return;
        }

        await scheduleWeightReminder(settings.notifications.weightReminderTime);
        
        updateSettings({
          notifications: {
            ...settings.notifications,
            weightReminders: true,
          },
        });

        Alert.alert(
          "Reminder Enabled",
          `You'll receive a daily weight reminder at ${formatTime(settings.notifications.weightReminderTime, settings.notifications.use24HourFormat)}`
        );
      } else {
        await cancelWeightReminder();
        
        updateSettings({
          notifications: {
            ...settings.notifications,
            weightReminders: false,
          },
        });

        Alert.alert("Reminder Disabled", "Weight reminders have been turned off.");
      }
    } catch (error) {
      console.error("Error toggling weight reminders:", error);
      Alert.alert("Error", "Failed to update weight reminders. Please try again.");
    } finally {
      setIsUpdatingWeightReminders(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete all your data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "All data has been cleared. Please restart the app.");
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Customize your app experience
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <SettingsIcon color={colors.primary} size={24} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Display</Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>
                  Step Counter
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Show daily step tracking on Home screen
                </Text>
              </View>
              <Switch
                value={settings.showSteps}
                onValueChange={(value) => updateSettings({ showSteps: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {settings.showSteps && (
              <View style={styles.stepGoalInputContainer}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Daily Step Goal</Text>
                <View style={styles.stepGoalInputRow}>
                  <TextInput
                    style={[styles.stepGoalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={stepGoalInput}
                    onChangeText={setStepGoalInput}
                    keyboardType="number-pad"
                    placeholder="10000"
                    placeholderTextColor={colors.textTertiary}
                    onBlur={() => {
                      const newGoal = parseInt(stepGoalInput);
                      if (!isNaN(newGoal) && newGoal > 0) {
                        updateSettings({ stepGoal: newGoal });
                      } else {
                        setStepGoalInput(settings.stepGoal.toString());
                        Alert.alert("Invalid Goal", "Please enter a valid step goal (minimum 1).");
                      }
                    }}
                    returnKeyType="done"
                  />
                  <Text style={[styles.stepGoalLabel, { color: colors.textSecondary }]}>steps</Text>
                </View>
              </View>
            )}

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>
                  Fasting Timer
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Show fasting clock on Home screen
                </Text>
              </View>
              <Switch
                value={settings.showFasting}
                onValueChange={(value) => updateSettings({ showFasting: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>
                  Progress Photos
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Show progress pictures on Weight screen
                </Text>
              </View>
              <Switch
                value={settings.showProgressPics}
                onValueChange={(value) => updateSettings({ showProgressPics: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <Bell color={colors.primary} size={24} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Notifications</Text>
            </View>

            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Manage notification preferences
            </Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>
                  24-Hour Format
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Use military time (e.g., 13:00 instead of 1:00 PM)
                </Text>
              </View>
              <Switch
                value={settings.notifications.use24HourFormat}
                onValueChange={(value) => {
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      use24HourFormat: value,
                    },
                  });
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>
                  Meal Reminders
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Get reminded to log your meals
                </Text>
              </View>
              <Switch
                value={settings.notifications.mealReminders}
                onValueChange={handleToggleMealReminders}
                disabled={isUpdatingMealReminders || Platform.OS === "web"}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {settings.notifications.mealReminderTimes.map((time, index) => (
              <View key={`meal-time-${index}`} style={styles.timeRow}>
                <View style={[styles.timeIconContainer, { backgroundColor: colors.surface }]}>
                  <Clock color={colors.primary} size={18} />
                </View>
                <TouchableOpacity
                  onPress={() => setShowTimePickerFor({ type: "meal", index })}
                  style={[styles.timeButton, { backgroundColor: colors.surface }]}
                  disabled={Platform.OS === "web"}
                >
                  <Text style={[styles.timeText, { color: colors.text }]}>
                    {formatTime(time, settings.notifications.use24HourFormat)}
                  </Text>
                </TouchableOpacity>
                {settings.notifications.mealReminderTimes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      const newTimes = settings.notifications.mealReminderTimes.filter((_, i) => i !== index);
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          mealReminderTimes: newTimes,
                        },
                      });
                      if (settings.notifications.mealReminders) {
                        scheduleMealReminders(newTimes);
                      }
                    }}
                    style={styles.deleteButton}
                  >
                    <X color={colors.error} size={20} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => {
                const newTimes = [...settings.notifications.mealReminderTimes, "12:00"];
                updateSettings({
                  notifications: {
                    ...settings.notifications,
                    mealReminderTimes: newTimes,
                  },
                });
                if (settings.notifications.mealReminders) {
                  scheduleMealReminders(newTimes);
                }
              }}
              style={[styles.addButton, { backgroundColor: colors.surface }]}
              disabled={Platform.OS === "web"}
            >
              <Plus color={colors.primary} size={20} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Meal Time</Text>
            </TouchableOpacity>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>
                  Weight Reminders
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  Get reminded to weigh yourself daily
                </Text>
              </View>
              <Switch
                value={settings.notifications.weightReminders}
                onValueChange={handleToggleWeightReminders}
                disabled={isUpdatingWeightReminders || Platform.OS === "web"}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.timeRow}>
              <View style={[styles.timeIconContainer, { backgroundColor: colors.surface }]}>
                <Clock color={colors.primary} size={18} />
              </View>
              <TouchableOpacity
                onPress={() => setShowTimePickerFor({ type: "weight" })}
                style={[styles.timeButton, { backgroundColor: colors.surface }]}
                disabled={Platform.OS === "web"}
              >
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {formatTime(settings.notifications.weightReminderTime, settings.notifications.use24HourFormat)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <HelpCircle color={colors.primary} size={24} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Help & Support</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/guide")}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <HelpCircle color={colors.primary} size={20} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                    User Guide
                  </Text>
                  <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                    Learn how to use the app
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.textTertiary} size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                Alert.alert(
                  "About",
                  "Calorie Tracker v1.0.0\n\nTrack your nutrition, weight, and fasting goals with ease.",
                  [{ text: "OK" }]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Info color={colors.primary} size={20} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                    About
                  </Text>
                  <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                    App version and info
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.textTertiary} size={20} />
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <Download color={colors.primary} size={24} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Data Management</Text>
            </View>

            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Clear your data
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton, { borderColor: colors.error }]}
              onPress={handleClearAllData}
              activeOpacity={0.7}
            >
              <Trash2 color={colors.error} size={20} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showTimePickerFor && (
        <TimePicker
          visible={true}
          initialTime={
            showTimePickerFor.type === "meal"
              ? settings.notifications.mealReminderTimes[showTimePickerFor.index!]
              : settings.notifications.weightReminderTime
          }
          title={showTimePickerFor.type === "meal" ? "Meal Reminder Time" : "Weight Reminder Time"}
          use24Hour={settings.notifications.use24HourFormat}
          onConfirm={(time) => {
            if (showTimePickerFor.type === "meal") {
              const newTimes = [...settings.notifications.mealReminderTimes];
              newTimes[showTimePickerFor.index!] = time;
              updateSettings({
                notifications: {
                  ...settings.notifications,
                  mealReminderTimes: newTimes,
                },
              });
              if (settings.notifications.mealReminders) {
                scheduleMealReminders(newTimes);
              }
            } else {
              updateSettings({
                notifications: {
                  ...settings.notifications,
                  weightReminderTime: time,
                },
              });
              if (settings.notifications.weightReminders) {
                scheduleWeightReminder(time);
              }
            }
            setShowTimePickerFor(null);
          }}
          onCancel={() => setShowTimePickerFor(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
  },
  content: {
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  toggleLabel: {
    flex: 1,
    marginRight: 12,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  dangerButton: {
    backgroundColor: "transparent",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  timeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepGoalInputContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  stepGoalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  stepGoalInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "600" as const,
    borderWidth: 1,
  },
  stepGoalLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
