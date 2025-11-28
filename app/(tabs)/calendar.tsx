import React, { useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, Modal, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Flame, Clock, Droplets, Edit2, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { type Fast, type LastFast } from "@/contexts/FastingContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SCREEN_WIDTH = Dimensions.get("window").width;
// Calculate day width based on container padding (16*2=32) and card padding (12*2=24)
// Total horizontal padding = 56
const DAY_WIDTH = (SCREEN_WIDTH - 56) / 7;

interface DayCellEntry {
  date: Date | null;
}

interface FastingStorage {
  currentFast: Fast | null;
  history: Fast[];
  lastFast: LastFast | null;
}

const FASTING_DEFAULT: FastingStorage = {
  currentFast: null,
  history: [],
  lastFast: null,
};

function getDaysInMonth(year: number, month: number): DayCellEntry[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: DayCellEntry[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i) });
  }

  const remainder = days.length % 7;
  const placeholdersToAdd = remainder === 0 ? 0 : 7 - remainder;
  for (let i = 0; i < placeholdersToAdd; i++) {
    days.push({ date: null });
  }

  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function areDatesEqual(date1: Date, date2: Date): boolean {
  return formatDateKey(date1) === formatDateKey(date2);
}

export default function CalendarScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMetric, setEditingMetric] = useState<"calories" | "water" | "fasting" | null>(null);
  const [editValue, setEditValue] = useState("");

  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("logs");
        if (!stored) return {};
        return JSON.parse(stored);
      } catch (error) {
        console.error("Error loading logs:", error);
        return {};
      }
    },
  });

  const fastingQuery = useQuery<FastingStorage>({
    queryKey: ["fasting"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("fasting");
        if (!stored) return FASTING_DEFAULT;
        const parsed = JSON.parse(stored) as Partial<FastingStorage> | null;
        return {
          currentFast: (parsed?.currentFast as Fast | null) ?? null,
          history: Array.isArray(parsed?.history) ? (parsed?.history as Fast[]) : [],
          lastFast: (parsed?.lastFast as LastFast | null) ?? null,
        };
      } catch (error) {
        console.error("Error loading fasting data:", error);
        return FASTING_DEFAULT;
      }
    },
  });

  const logs = logsQuery.data || {};
  const fastingData = fastingQuery.data || FASTING_DEFAULT;
  const fastsForCalendar = useMemo<Fast[]>(() => {
    const historyList = Array.isArray(fastingData.history) ? fastingData.history : [];
    return fastingData.currentFast ? [fastingData.currentFast, ...historyList] : historyList;
  }, [fastingData.currentFast, fastingData.history]);

  const { mutate: mutateUpdateLogs } = useMutation({
    mutationFn: async (newLogs: typeof logs) => {
      await AsyncStorage.setItem("logs", JSON.stringify(newLogs));
      return newLogs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });

  const { mutate: mutateUpdateFasting } = useMutation<FastingStorage, unknown, FastingStorage>({
    mutationFn: async (newData: FastingStorage) => {
      await AsyncStorage.setItem("fasting", JSON.stringify(newData));
      return newData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fasting"] });
    },
  });

  const days = useMemo<DayCellEntry[]>(() => {
    return getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  useEffect(() => {
    if (
      selectedDate.getMonth() !== currentMonth.getMonth() ||
      selectedDate.getFullYear() !== currentMonth.getFullYear()
    ) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    }
  }, [currentMonth, selectedDate]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getCaloriesForDate = (date: Date): number => {
    const dateKey = formatDateKey(date);
    const log = logs[dateKey];
    if (!log || !log.foods) return 0;
    return log.foods.reduce((sum: number, food: any) => sum + food.calories, 0);
  };

  const getWaterForDate = (date: Date): number => {
    const dateKey = formatDateKey(date);
    const log = logs[dateKey];
    if (!log) return 0;
    if (Array.isArray(log.waterEntries) && log.waterEntries.length > 0) {
      return log.waterEntries.reduce((sum: number, entry: { ounces: number }) => sum + entry.ounces, 0);
    }
    if (typeof log.water === "number") {
      return log.water;
    }
    return 0;
  };

  const getFastingTimeForDate = (date: Date): string => {
    const dateStart = new Date(date).setHours(0, 0, 0, 0);
    const dateEnd = new Date(date).setHours(23, 59, 59, 999);

    const fastsForDay = fastsForCalendar.filter((fast: Fast) => {
      const fastStart = fast.startTime;
      const fastEnd = fast.endTime || Date.now();
      return (
        (fastStart >= dateStart && fastStart <= dateEnd) ||
        (fastEnd >= dateStart && fastEnd <= dateEnd) ||
        (fastStart <= dateStart && fastEnd >= dateEnd)
      );
    });

    if (fastsForDay.length === 0) return "0h";

    let totalDuration = 0;
    fastsForDay.forEach((fast: any) => {
      const fastStart = Math.max(fast.startTime, dateStart);
      const fastEnd = Math.min(fast.endTime || Date.now(), dateEnd);
      totalDuration += fastEnd - fastStart;
    });

    const hours = Math.floor(totalDuration / (1000 * 60 * 60));
    const minutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const selectedDateCalories = getCaloriesForDate(selectedDate);
  const selectedDateFasting = getFastingTimeForDate(selectedDate);
  const selectedDateWater = getWaterForDate(selectedDate);

  const isToday = (date: Date): boolean => {
    return areDatesEqual(date, new Date());
  };

  const openEditModal = (metric: "calories" | "water" | "fasting") => {
    setEditingMetric(metric);
    if (metric === "calories") {
      setEditValue(selectedDateCalories.toString());
    } else if (metric === "water") {
      setEditValue(selectedDateWater.toString());
    } else if (metric === "fasting") {
      const hours = Math.floor(parseInt(selectedDateFasting.replace(/[^0-9]/g, "")) || 0);
      setEditValue(hours.toString());
    }
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    const dateKey = formatDateKey(selectedDate);
    const value = parseFloat(editValue);

    if (isNaN(value) || value < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number");
      return;
    }

    if (editingMetric === "calories") {
      const existingLog = logs[dateKey] || { date: dateKey, foods: [], waterEntries: [] };
      const difference = value - selectedDateCalories;

      if (existingLog.foods.length > 0) {
        const adjustedFoods = existingLog.foods.map((food: any, index: number) => {
          if (index === 0) {
            return { ...food, calories: Math.max(0, food.calories + difference) };
          }
          return food;
        });
        mutateUpdateLogs({
          ...logs,
          [dateKey]: { ...existingLog, foods: adjustedFoods },
        });
      } else {
        mutateUpdateLogs({
          ...logs,
          [dateKey]: {
            ...existingLog,
            foods: [
              {
                id: Date.now().toString(),
                name: "Manual Entry",
                calories: value,
                protein: 0,
                carbs: 0,
                fat: 0,
                servingSize: "serving",
                servingAmount: "1",
                timestamp: Date.now(),
              },
            ],
          },
        });
      }
    } else if (editingMetric === "water") {
      const existingLog = logs[dateKey] || { date: dateKey, foods: [], waterEntries: [] };
      mutateUpdateLogs({
        ...logs,
        [dateKey]: {
          ...existingLog,
          water: value,
          waterEntries: [
            {
              id: Date.now().toString(),
              ounces: value,
              timestamp: Date.now(),
            },
          ],
        },
      });
    } else if (editingMetric === "fasting") {
      const hours = value;
      const dateStart = new Date(selectedDate).setHours(0, 0, 0, 0);
      const fastStart = dateStart;
      const fastEnd = dateStart + hours * 60 * 60 * 1000;

      const newFast = {
        id: Date.now().toString(),
        startTime: fastStart,
        endTime: fastEnd,
        status: "completed" as const,
      };

      const otherFasts = fastingData.history.filter((fast: Fast) => {
        const fastDate = new Date(fast.startTime).toISOString().split("T")[0];
        return fastDate !== dateKey;
      });

      mutateUpdateFasting({
        ...fastingData,
        history: [newFast, ...otherFasts],
      });
    }

    setEditModalVisible(false);
    setEditingMetric(null);
    setEditValue("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}
      testID="calendar-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}
        testID="calendar-header">
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track nutrition, fasting, and water</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.combinedCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} testID="calendar-combined-card">
          {/* Top Row: Month Nav & Selected Date */}
          <View style={styles.calendarTopSection}>
             <View style={styles.monthHeader}>
              <TouchableOpacity onPress={goToPreviousMonth} style={[styles.monthButton, { backgroundColor: colors.surface }]} testID="calendar-prev-month">
                <ChevronLeft color={colors.text} size={20} />
              </TouchableOpacity>

              <Text style={[styles.monthTitle, { color: colors.text }]}>{formatMonthYear(currentMonth)}</Text>

              <TouchableOpacity onPress={goToNextMonth} style={[styles.monthButton, { backgroundColor: colors.surface }]} testID="calendar-next-month">
                <ChevronRight color={colors.text} size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.todayBadge, { backgroundColor: colors.primary + "20" }]} testID="calendar-today-pill">
               <Text style={[styles.todayBadgeText, { color: colors.primary }]}>
                  {isToday(selectedDate) ? "Today" : selectedDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
               </Text>
            </View>
          </View>

          {/* Selected Date Title - Moved here */}
          <View style={styles.selectedDateContainer}>
            <Text style={[styles.selectedDateTitle, { color: colors.text }]}
              testID="calendar-day-title">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
             <TouchableOpacity
              onPress={() => openEditModal("calories")}
              style={[styles.statBoxCompact, { backgroundColor: colors.surface }]}
              testID="stat-calories-compact">
              <View style={[styles.statIconSmall, { backgroundColor: colors.primary + "20" }]}>
                <Flame color={colors.primary} size={14} />
              </View>
              <View>
                 <Text style={[styles.statValueSmall, { color: colors.text }]}>{selectedDateCalories}</Text>
                 <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>Cal</Text>
              </View>
              <Edit2 size={10} color={colors.textTertiary} style={styles.editIconSmall} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openEditModal("fasting")}
              style={[styles.statBoxCompact, { backgroundColor: colors.surface }]}
              testID="stat-fasting-compact">
              <View style={[styles.statIconSmall, { backgroundColor: colors.success + "20" }]}>
                <Clock color={colors.success} size={14} />
              </View>
              <View>
                <Text style={[styles.statValueSmall, { color: colors.text }]}>{selectedDateFasting}</Text>
                <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>Fast</Text>
              </View>
              <Edit2 size={10} color={colors.textTertiary} style={styles.editIconSmall} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openEditModal("water")}
              style={[styles.statBoxCompact, { backgroundColor: colors.surface }]}
              testID="stat-water-compact">
              <View style={[styles.statIconSmall, { backgroundColor: colors.water + "20" }]}>
                <Droplets color={colors.water} size={14} />
              </View>
              <View>
                <Text style={[styles.statValueSmall, { color: colors.text }]}>{selectedDateWater}</Text>
                <Text style={[styles.statLabelSmall, { color: colors.textSecondary }]}>Water</Text>
              </View>
              <Edit2 size={10} color={colors.textTertiary} style={styles.editIconSmall} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGridContainer}>
            <View style={styles.weekDays}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <View key={index} style={[styles.weekDay, { width: DAY_WIDTH }]} testID={`calendar-weekday-${index}`}>
                  <Text style={[styles.weekDayText, { color: colors.textTertiary }]}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((dayEntry, index) => {
                if (!dayEntry.date) {
                  return (
                    <View
                      key={`placeholder-${index}`}
                      style={[styles.dayCell, styles.placeholderCell, { width: DAY_WIDTH }]}
                    />
                  );
                }

                const dateKey = formatDateKey(dayEntry.date);
                const calories = getCaloriesForDate(dayEntry.date);
                const water = getWaterForDate(dayEntry.date);
                const fastingTime = getFastingTimeForDate(dayEntry.date);
                const isSelected = areDatesEqual(dayEntry.date, selectedDate);
                const isTodayDate = isToday(dayEntry.date);

                return (
                  <TouchableOpacity
                    key={dateKey}
                    testID={`calendar-day-${dateKey}`}
                    style={[
                      styles.dayCell,
                      { width: DAY_WIDTH, backgroundColor: colors.surface },
                      isSelected && { backgroundColor: colors.primary },
                      isTodayDate && !isSelected && { borderColor: colors.primary, borderWidth: 1.5 },
                    ]}
                    onPress={() => setSelectedDate(dayEntry.date as Date)}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: isSelected ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {dayEntry.date.getDate()}
                    </Text>

                    <View style={styles.dayMetrics}>
                      {calories > 0 && (
                        <View style={[styles.dotMetric, { backgroundColor: isSelected ? "#FFFFFF" : colors.primary }]} />
                      )}
                      {water > 0 && (
                        <View style={[styles.dotMetric, { backgroundColor: isSelected ? "#FFFFFF" : colors.water }]} />
                      )}
                      {fastingTime !== "0h" && (
                        <View style={[styles.dotMetric, { backgroundColor: isSelected ? "#FFFFFF" : colors.success }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}> 
                Edit {editingMetric === "calories" ? "Calories" : editingMetric === "water" ? "Water" : "Fasting Hours"}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              placeholder={editingMetric === "calories" ? "Enter calories" : editingMetric === "water" ? "Enter ounces" : "Enter hours"}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  combinedCard: {
    padding: 12,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  calendarTopSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  monthButton: {
    padding: 8,
    borderRadius: 999,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  selectedDateContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBoxCompact: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative" as const,
  },
  statIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  statLabelSmall: {
    fontSize: 10,
  },
  editIconSmall: {
    position: "absolute" as const,
    top: 4,
    right: 4,
  },
  calendarGridContainer: {
    marginTop: 4,
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekDay: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    aspectRatio: 0.8,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  placeholderCell: {
    backgroundColor: "transparent",
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  dayMetrics: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
    justifyContent: "center",
    height: 6,
  },
  dotMetric: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
