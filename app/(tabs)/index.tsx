import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  PanResponder,
  ScrollView,
  Alert,
} from "react-native";
import { wp, hp, scale, moderateScale, getResponsiveFontSize } from "@/utils/responsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Droplets, Flame, Plus, X, Trash2, Clock, Play, StopCircle, Footprints, Info, Edit3, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCalorieTracker } from "@/contexts/CalorieContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFasting } from "@/contexts/FastingContext";
import { useSettings } from "@/contexts/SettingsContext";

import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Pedometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";

function SwipeToDelete({
  children,
  onDelete,
  colors,
  itemId,
  openItemId,
  setOpenItemId,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  colors: { error: string; card: string };
  itemId: string;
  openItemId: string | null;
  setOpenItemId: (id: string | null) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (openItemId !== itemId) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  }, [openItemId, itemId, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        },
        onPanResponderGrant: () => {
          if (openItemId && openItemId !== itemId) {
            setOpenItemId(null);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(Math.max(gestureState.dx, -100));
          } else if (openItemId === itemId) {
            translateX.setValue(Math.max(gestureState.dx - 100, -100));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -80) {
            Animated.timing(translateX, {
              toValue: -100,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              setOpenItemId(itemId);
            });
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }).start(() => {
              if (openItemId === itemId) {
                setOpenItemId(null);
              }
            });
          }
        },
      }),
    [translateX, itemId, openItemId, setOpenItemId]
  );

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDelete();
      setOpenItemId(null);
    });
  };

  return (
    <View style={{ position: "relative" as const, overflow: "hidden" }}>
      <View style={{
        position: "absolute" as const,
        right: 0,
        top: 0,
        bottom: 0,
        width: 100,
        backgroundColor: colors.error,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 14,
      }}>
        <TouchableOpacity onPress={handleDelete} style={{ padding: 20 }}>
          <Trash2 color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          { transform: [{ translateX }], backgroundColor: colors.card },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function SemiCircleProgress({ progress, color, bgColor, children }: {
  progress: number;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  const rawProgress = Number.isFinite(progress) ? progress : 0;
  const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
  const isOverLimit = rawProgress > 1;
  const healthyColor = color || "#22C55E";
  const activeColor = isOverLimit ? "#EF4444" : healthyColor;
  const radius = 92;
  const strokeWidth = 16;
  const width = radius * 2 + strokeWidth;
  const height = radius + strokeWidth;
  const startX = strokeWidth / 2;
  const endX = width - strokeWidth / 2;
  const startY = radius + strokeWidth / 2;
  const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${startY}`;
  const arcLength = Math.PI * radius;
  const dashArray = `${arcLength} ${arcLength}`;
  const dashOffset = arcLength - clampedProgress * arcLength;

  return (
    <View style={{ width: "100%", alignItems: "center", marginTop: 16 }}>
      <View style={{ width, height }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path
            d={arcPath}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          {rawProgress > 0 && (
            <Path
              d={arcPath}
              stroke={activeColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset < 0 ? 0 : dashOffset}
            />
          )}
        </Svg>
      </View>
      <View style={{ alignItems: "center", marginTop: -60 }}>
        {children}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { goals, totals, todayLog, addWater, removeWater, removeFood, addFood, updateFood, logs, selectedDate } = useCalorieTracker();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { currentFast, lastFast, elapsedSeconds, startFast, endFast, formatDuration, isLastFastFromToday, clearLastFast } = useFasting();
  const { settings } = useSettings();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showWaterHistoryModal, setShowWaterHistoryModal] = useState(false);
  const [editingWaterEntry, setEditingWaterEntry] = useState<{ id: string; ounces: number } | null>(null);

  const [waterInput, setWaterInput] = useState("");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [undoFood, setUndoFood] = useState<{ id: string; name: string; servingAmount: number; servingSize: string; calories: number; protein: number; carbs: number; fat: number; timestamp?: number; source?: "database" | "ai" | "user" | "fast-food" | "barcode"; brand?: string; barcode?: string; confidence?: number } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pedometerBaselineRef = useRef<number>(0);
  const androidStepOffsetRef = useRef<number>(0);
  const [stepSource, setStepSource] = useState<"pedometer" | "demo">("demo");
  const [stepStatus, setStepStatus] = useState<"checking" | "ready" | "denied" | "unsupported">("checking");
  const [steps, setSteps] = useState<number>(0);
  const stepsGoal = settings.stepGoal;
  const [selectedFood, setSelectedFood] = useState<{ id: string; name: string; servingAmount: number; servingSize: string; calories: number; protein: number; carbs: number; fat: number; timestamp?: number; source?: "database" | "ai" | "user" | "fast-food" | "barcode"; brand?: string; barcode?: string; confidence?: number } | null>(null);
  const [editServingAmount, setEditServingAmount] = useState("");
  const [editName, setEditName] = useState("");

  const calculatedFoodValues = useMemo(() => {
    if (!selectedFood) return null;
    const newAmount = parseFloat(editServingAmount);
    if (isNaN(newAmount) || newAmount <= 0) return selectedFood;
    
    const ratio = newAmount / selectedFood.servingAmount;
    return {
      ...selectedFood,
      servingAmount: newAmount,
      calories: Math.round(selectedFood.calories * ratio),
      protein: selectedFood.protein * ratio,
      carbs: selectedFood.carbs * ratio,
      fat: selectedFood.fat * ratio,
    };
  }, [selectedFood, editServingAmount]);

  const caloriesProgress = goals.calories > 0 ? (totals.calories / goals.calories) : 0;
  const waterProgress = todayLog.water / goals.water;
  const caloriesRemaining = goals.calories - totals.calories;
  const isOverCalories = totals.calories > goals.calories;
  const caloriesOver = isOverCalories ? totals.calories - goals.calories : 0;
  const stepInfoMessage = useMemo(() => {
    if (stepSource === "pedometer") {
      return Platform.OS === "ios"
        ? "Live steps from Apple Health. Keep the app active for the freshest totals."
        : "Live steps from your device's motion sensors."
    }
    if (stepStatus === "denied") {
      return "Motion access denied. Enable Fitness permissions for Apple Health syncing."
    }
    if (stepStatus === "unsupported") {
      return Platform.OS === "web"
        ? "Web preview can't read Apple Health. Demo data shown."
        : "This device can't read Apple Health data. Demo data shown."
    }
    return "Demo mode: Simulated steps. Install a development build to unlock Apple Health."
  }, [stepSource, stepStatus]);



  const handleAddWater = (ounces: number) => {
    addWater(ounces);
    if (Platform.OS !== "web") {
      import("expo-haptics").then((Haptics) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }).catch(() => {});
    }
  };

  const handleSaveCustomWater = () => {
    const ounces = parseFloat(waterInput);
    if (!isNaN(ounces) && ounces > 0) {
      handleAddWater(ounces);
      setWaterInput("");
      setShowWaterModal(false);
      Keyboard.dismiss();
    }
  };

  const handleEditWaterEntry = useCallback((entry: { id: string; ounces: number }) => {
    setEditingWaterEntry(entry);
    setWaterInput(entry.ounces.toString());
  }, []);

  const handleSaveWaterEdit = useCallback(() => {
    if (!editingWaterEntry) return;
    const newOunces = parseFloat(waterInput);
    if (isNaN(newOunces) || newOunces <= 0) return;

    const updatedEntries = (todayLog.waterEntries || []).map((entry: { id: string; ounces: number; timestamp: number }) => 
      entry.id === editingWaterEntry.id ? { ...entry, ounces: newOunces } : entry
    );
    const newWaterTotal = updatedEntries.reduce((sum: number, entry: { ounces: number }) => sum + entry.ounces, 0);

    const newLogs = {
      ...logs,
      [selectedDate]: {
        ...todayLog,
        water: newWaterTotal,
        waterEntries: updatedEntries,
      },
    };

    AsyncStorage.setItem("logs", JSON.stringify(newLogs)).then(() => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      setEditingWaterEntry(null);
      setWaterInput("");
      if (Platform.OS !== "web") {
        import("expo-haptics").then((Haptics) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }).catch(() => {});
      }
    });
  }, [editingWaterEntry, waterInput, todayLog, logs, selectedDate, queryClient]);

  const handleRemoveFood = useCallback((food: { id: string; name: string; servingAmount: number; servingSize: string; calories: number; protein: number; carbs: number; fat: number; timestamp?: number; source?: "database" | "ai" | "user" | "fast-food" | "barcode"; brand?: string; barcode?: string; confidence?: number }) => {
    removeFood(food.id);
    setUndoFood(food);
    setOpenItemId(null);
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    undoTimeoutRef.current = setTimeout(() => {
      setUndoFood(null);
    }, 5000);
  }, [removeFood]);

  const handleUndo = useCallback(() => {
    if (undoFood) {
      const { id, ...foodWithoutId } = undoFood;
      const restoredFood = {
        ...foodWithoutId,
        id: Math.random().toString(36).substring(7),
        timestamp: undoFood.timestamp || Date.now(),
        source: (undoFood.source || "user") as "database" | "ai" | "user" | "fast-food" | "barcode",
      };
      addFood(restoredFood);
      setUndoFood(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    }
  }, [undoFood, addFood]);

  const handleFoodClick = useCallback((food: { id: string; name: string; servingAmount: number; servingSize: string; calories: number; protein: number; carbs: number; fat: number; timestamp?: number; source?: "database" | "ai" | "user" | "fast-food" | "barcode"; brand?: string; barcode?: string; confidence?: number }) => {
    setSelectedFood(food);
    setEditServingAmount(food.servingAmount.toString());
    setEditName(food.name);
  }, []);

  const handleSaveFoodEdit = useCallback(() => {
    if (!selectedFood) return;
    const newAmount = parseFloat(editServingAmount);
    if (isNaN(newAmount) || newAmount <= 0) return;

    const newName = editName.trim() || selectedFood.name;

    const originalCaloriesPerServing = selectedFood.calories / selectedFood.servingAmount;
    const originalProteinPerServing = selectedFood.protein / selectedFood.servingAmount;
    const originalCarbsPerServing = selectedFood.carbs / selectedFood.servingAmount;
    const originalFatPerServing = selectedFood.fat / selectedFood.servingAmount;

    const updatedFood = {
      ...selectedFood,
      name: newName,
      source: selectedFood.source || "user",
      timestamp: selectedFood.timestamp || Date.now(),
      servingAmount: newAmount,
      calories: Math.round(originalCaloriesPerServing * newAmount),
      protein: originalProteinPerServing * newAmount,
      carbs: originalCarbsPerServing * newAmount,
      fat: originalFatPerServing * newAmount,
    };

    updateFood(updatedFood);
    setSelectedFood(null);
    setEditServingAmount("");
    setEditName("");

    if (Platform.OS !== "web") {
      import("expo-haptics").then((Haptics) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }).catch(() => {});
    }
  }, [selectedFood, editServingAmount, editName, updateFood]);

  React.useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

    const initializePedometer = async () => {
      if (Platform.OS === "web") {
        console.log("[Steps] Web preview detected, staying in demo mode");
        setStepStatus("unsupported");
        setStepSource("demo");
        return;
      }

      try {
        setStepStatus("checking");
        const permission = await Pedometer.requestPermissionsAsync();
        console.log("[Steps] Permission:", permission);
        if (!isMounted) return;

        if (!permission.granted) {
          setStepStatus("denied");
          setStepSource("demo");
          return;
        }

        const available = await Pedometer.isAvailableAsync();
        console.log("[Steps] Sensor available:", available);
        if (!isMounted) return;

        if (!available) {
          setStepStatus("unsupported");
          setStepSource("demo");
          return;
        }

        setStepStatus("ready");
        setStepSource("pedometer");
        pedometerBaselineRef.current = 0;
        androidStepOffsetRef.current = 0;

        if (Platform.OS === "ios") {
          try {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const baseline = await Pedometer.getStepCountAsync(start, new Date());
            if (isMounted && baseline) {
              pedometerBaselineRef.current = baseline.steps;
              setSteps(baseline.steps);
            }
          } catch (baselineError) {
            console.log("[Steps] Baseline read failed", baselineError);
          }
        } else {
          setSteps(0);
        }

        subscription = Pedometer.watchStepCount((update) => {
          if (!isMounted) return;
          if (Platform.OS === "ios") {
            setSteps(pedometerBaselineRef.current + update.steps);
            return;
          }
          const increment = Math.max(update.steps - androidStepOffsetRef.current, 0);
          androidStepOffsetRef.current = update.steps;
          if (increment > 0) {
            setSteps((prev) => Math.max(0, prev + increment));
          }
        });
      } catch (error) {
        console.log("[Steps] Initialization error", error);
        if (!isMounted) return;
        setStepStatus("unsupported");
        setStepSource("demo");
      }
    };

    initializePedometer();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (stepSource !== "demo") {
      return;
    }

    const simulateSteps = () => {
      const baseSteps = Math.floor(Math.random() * 3000) + 2000;
      const hour = new Date().getHours();
      const progressMultiplier = Math.min(hour / 20, 1);
      const currentSteps = Math.floor(baseSteps * progressMultiplier);
      setSteps(currentSteps);
    };

    simulateSteps();
    const interval = setInterval(simulateSteps, 30000);

    return () => clearInterval(interval);
  }, [stepSource]);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Image
            source={{
              uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0ge9n2w41sbvz03g1ce8k"
            }}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>

        <ExpoLinearGradient
          colors={theme.resolvedTheme === "dark" ? ["#101321", "#060814"] : ["#FFFFFF", "#F5F7FF"]}
          style={[styles.heroCard, { shadowColor: colors.shadow }]}
        >
          <Text style={[styles.heroDateText, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>

          <SemiCircleProgress
            progress={caloriesProgress}
            color={colors.primary}
            bgColor={colors.borderLight}
          >
            <View style={styles.caloriesCenter}>
              <Text style={[styles.caloriesValue, { color: isOverCalories ? "#EF4444" : colors.text }]}>{totals.calories}</Text>
              <Text style={[styles.caloriesLabel, { color: colors.textSecondary }]}>Eaten</Text>
              {isOverCalories ? (
                <Text style={[styles.caloriesRemaining, { color: "#EF4444" }]}>
                  Over by {caloriesOver} cal
                </Text>
              ) : (
                <Text style={[styles.caloriesRemaining, { color: colors.textTertiary }]}>
                  {caloriesRemaining} left
                </Text>
              )}
            </View>
          </SemiCircleProgress>

          <View style={styles.macroChips}>
            <View style={[styles.macroChip, { backgroundColor: theme.resolvedTheme === "dark" ? "#1F2937" : "#F3F4F6" }]}>
              <View style={[styles.macroDot, { backgroundColor: colors.protein }]} />
              <Text style={[styles.macroChipLabel, { color: colors.text }]}>
                P {Math.round(totals.protein)}g
              </Text>
              <View style={[styles.macroBar, { backgroundColor: colors.borderLight }]}>
                <View style={[styles.macroBarFill, { backgroundColor: colors.protein, width: `${Math.min((totals.protein / goals.protein) * 100, 100)}%` }]} />
              </View>
            </View>

            <View style={[styles.macroChip, { backgroundColor: theme.resolvedTheme === "dark" ? "#1F2937" : "#F3F4F6" }]}>
              <View style={[styles.macroDot, { backgroundColor: colors.carbs }]} />
              <Text style={[styles.macroChipLabel, { color: colors.text }]}>
                C {Math.round(totals.carbs)}g
              </Text>
              <View style={[styles.macroBar, { backgroundColor: colors.borderLight }]}>
                <View style={[styles.macroBarFill, { backgroundColor: colors.carbs, width: `${Math.min((totals.carbs / goals.carbs) * 100, 100)}%` }]} />
              </View>
            </View>

            <View style={[styles.macroChip, { backgroundColor: theme.resolvedTheme === "dark" ? "#1F2937" : "#F3F4F6" }]}>
              <View style={[styles.macroDot, { backgroundColor: colors.fats }]} />
              <Text style={[styles.macroChipLabel, { color: colors.text }]}>
                F {Math.round(totals.fat)}g
              </Text>
              <View style={[styles.macroBar, { backgroundColor: colors.borderLight }]}>
                <View style={[styles.macroBarFill, { backgroundColor: colors.fats, width: `${Math.min((totals.fat / goals.fat) * 100, 100)}%` }]} />
              </View>
            </View>
          </View>
        </ExpoLinearGradient>

        <View style={styles.compactRow}>
        {settings.showFasting && (
          <View style={[styles.compactCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.fastingHeader}>
            <View style={styles.fastingTitleRow}>
              <Clock color={colors.primary} size={24} />
              <Text style={[styles.fastingTitle, { color: colors.text }]}>Fasting</Text>
            </View>
          </View>

          {!currentFast ? (
            <View style={styles.fastingNotActive}>
              <Text style={[styles.fastingStatus, { color: colors.textSecondary }]}>Not fasting</Text>
              <TouchableOpacity
                style={[styles.fastingButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  startFast();
                  if (Platform.OS !== "web") {
                    import("expo-haptics").then((Haptics) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    }).catch(() => {});
                  }
                }}
                activeOpacity={0.7}
              >
                <Play color="#FFFFFF" size={20} />
                <Text style={styles.fastingButtonText}>Start Fast</Text>
              </TouchableOpacity>
              {lastFast && isLastFastFromToday() && (
                <SwipeToDelete
                  itemId="last-fast"
                  onDelete={() => {
                    clearLastFast();
                    if (Platform.OS !== "web") {
                      import("expo-haptics").then((Haptics) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      }).catch(() => {});
                    }
                  }}
                  colors={colors}
                  openItemId={openItemId}
                  setOpenItemId={setOpenItemId}
                >
                  <View style={[styles.lastFastContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.lastFastLabel, { color: colors.textSecondary }]}>Last fast completed</Text>
                    <Text style={[styles.lastFastDuration, { color: colors.text }]}>
                      {formatDuration(Math.floor(lastFast.duration / 1000)).formatted}
                    </Text>
                  </View>
                </SwipeToDelete>
              )}
            </View>
          ) : (
            <View style={styles.fastingActive}>
              <View style={styles.fastingTimerContainer}>
                <Text style={[styles.fastingTimer, { color: colors.text }]}>
                  {formatDuration(elapsedSeconds).formatted}
                </Text>
                <Text style={[styles.fastingTimerLabel, { color: colors.textSecondary }]}>Fasting for</Text>
                <Text style={[styles.fastingStartedAt, { color: colors.textTertiary }]}>
                  Started at {new Date(currentFast.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.fastingEndButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  Alert.alert(
                    "End fast?",
                    "Are you sure you want to end your fast?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "End Fast",
                        style: "destructive",
                        onPress: () => {
                          endFast();
                          if (Platform.OS !== "web") {
                            import("expo-haptics").then((Haptics) => {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                            }).catch(() => {});
                          }
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <StopCircle color="#FFFFFF" size={20} />
                <Text style={styles.fastingButtonText}>End Fast</Text>
              </TouchableOpacity>
            </View>
          )}
          </View>
        )}

        {settings.showSteps && (
          <View style={[styles.compactCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} testID="steps-card">
          <View style={styles.stepsHeader}>
            <View style={styles.stepsTitleRow}>
              <Footprints color={colors.success} size={24} />
              <Text style={[styles.stepsTitle, { color: colors.text }]}>Steps</Text>
            </View>
            <View>
              <Text style={[styles.stepsValue, { color: colors.text }]} testID="steps-value">{steps.toLocaleString()}</Text>
            </View>
          </View>

          <View style={[styles.stepsInfoBanner, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="steps-info-banner">
            <Info color={colors.primary} size={18} />
            <Text style={[styles.stepsInfoText, { color: colors.textSecondary }]} testID="steps-info-text">
              {stepInfoMessage}
            </Text>
          </View>

          <View style={[styles.stepsBar, { backgroundColor: colors.borderLight }]}>
            <View
              style={[styles.stepsBarFill, { backgroundColor: colors.success, width: `${Math.min((steps / stepsGoal) * 100, 100)}%` }]}
            />
          </View>

          <View style={styles.stepsGoalRow}>
            <Text style={[styles.stepsGoalText, { color: colors.textSecondary }]}>Goal: {stepsGoal.toLocaleString()} · {Math.max(0, stepsGoal - steps).toLocaleString()} left</Text>
          </View>
          </View>
        )}
        </View>

        <View style={[styles.waterCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.waterHeader}>
            <View style={styles.waterTitleRow}>
              <Droplets color={colors.water} size={24} />
              <Text style={[styles.waterTitle, { color: colors.text }]}>Water</Text>
            </View>
            <TouchableOpacity 
              style={styles.waterProgressButton}
              onPress={() => setShowWaterHistoryModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.waterProgress, { color: colors.text }]}>
                {todayLog.water} / {goals.water} oz
              </Text>
              <ChevronRight color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          </View>

          <View style={[styles.waterBar, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                styles.waterBarFill,
                { backgroundColor: colors.water, width: `${Math.min(waterProgress * 100, 100)}%` },
              ]}
            />
          </View>

          <View style={styles.waterControls}>
            <TouchableOpacity
              style={[styles.waterSmallButton, { backgroundColor: colors.primary }]}
              onPress={() => handleAddWater(8)}
              activeOpacity={0.7}
            >
              <Text style={styles.waterButtonText}>+8</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.waterSmallButton, { backgroundColor: colors.primary }]}
              onPress={() => handleAddWater(12)}
              activeOpacity={0.7}
            >
              <Text style={styles.waterButtonText}>+12</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.waterSmallButton, { backgroundColor: colors.primary }]}
              onPress={() => handleAddWater(16)}
              activeOpacity={0.7}
            >
              <Text style={styles.waterButtonText}>+16</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.waterSmallButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setShowWaterModal(true)}
              activeOpacity={0.7}
            >
              <Plus color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.recentCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>Today&apos;s Foods</Text>
            <TouchableOpacity style={[styles.addFoodPill, { borderColor: colors.border }]} onPress={() => router.push("/add")} activeOpacity={0.7}>
              <Plus color={colors.primary} size={18} />
              <Text style={[styles.addFoodPillText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>

          {todayLog.foods.length === 0 ? (
            <View style={styles.emptyState}>
              <Flame color={colors.textTertiary} size={36} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No foods logged yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.foodListScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.foodList}>
                {todayLog.foods.slice().reverse().map((food: { id: string; name: string; servingAmount: number; servingSize: string; calories: number; protein: number; carbs: number; fat: number }, index: number) => (
                  <SwipeToDelete
                    key={`${food.id}-${index}`}
                    onDelete={() => handleRemoveFood(food)}
                    colors={colors}
                    itemId={food.id}
                    openItemId={openItemId}
                    setOpenItemId={setOpenItemId}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleFoodClick(food)}
                    >
                      <View style={[styles.foodItem, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                        <View style={[styles.foodAccent, { backgroundColor: colors.primary }]} />
                        <View style={styles.foodContent}>
                          <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                          <Text style={[styles.foodDetails, { color: colors.textSecondary }]}>
                            {food.servingAmount} {food.servingSize}
                          </Text>
                          <View style={styles.foodMacros}>
                            <Text style={[styles.foodMacroText, { color: colors.textTertiary }]}>
                              P {Math.round(food.protein)}g · C {Math.round(food.carbs)}g · F {Math.round(food.fat)}g
                            </Text>
                          </View>
                        </View>
                        <View style={styles.foodRight}>
                          <Text style={[styles.foodCalories, { color: colors.primary }]}>{food.calories}</Text>
                          <Text style={[styles.foodCaloriesLabel, { color: colors.textSecondary }]}>cal</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </SwipeToDelete>
                ))}
              </View>
            </ScrollView>
          )}

          {undoFood && (
            <Animated.View style={[styles.undoBanner, { backgroundColor: colors.primary }]}>
              <Text style={styles.undoText}>Food removed</Text>
              <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
                <Text style={styles.undoButtonText}>UNDO</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </View>

      <Modal
        visible={showWaterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWaterModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Add Water</Text>
                    <TouchableOpacity onPress={() => setShowWaterModal(false)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Ounces (oz)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={waterInput}
                      onChangeText={setWaterInput}
                      keyboardType="decimal-pad"
                      placeholder="12"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleSaveCustomWater}
                    />

                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveCustomWater}>
                      <Text style={styles.modalButtonText}>Add Water</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showWaterHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWaterHistoryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={() => setShowWaterHistoryModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Water History</Text>
                    <TouchableOpacity onPress={() => setShowWaterHistoryModal(false)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  {todayLog.waterEntries && todayLog.waterEntries.length > 0 ? (
                    <ScrollView style={styles.waterHistoryList} showsVerticalScrollIndicator={false}>
                      {todayLog.waterEntries.slice().reverse().map((entry: { id: string; ounces: number; timestamp: number }) => (
                        <SwipeToDelete
                          key={entry.id}
                          onDelete={() => {
                            removeWater(entry.id);
                            if (Platform.OS !== "web") {
                              import("expo-haptics").then((Haptics) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                              }).catch(() => {});
                            }
                          }}
                          colors={colors}
                          itemId={entry.id}
                          openItemId={openItemId}
                          setOpenItemId={setOpenItemId}
                        >
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              handleEditWaterEntry(entry);
                              setShowWaterHistoryModal(false);
                            }}
                          >
                            <View style={[styles.waterHistoryItem, { borderBottomColor: colors.borderLight }]}>
                              <View style={styles.waterHistoryItemLeft}>
                                <Droplets color={colors.water} size={20} />
                                <View style={styles.waterHistoryItemInfo}>
                                  <Text style={[styles.waterHistoryItemAmount, { color: colors.text }]}>
                                    {entry.ounces} oz
                                  </Text>
                                  <Text style={[styles.waterHistoryItemTime, { color: colors.textSecondary }]}>
                                    {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })}
                                  </Text>
                                </View>
                              </View>
                              <ChevronRight color={colors.textTertiary} size={20} />
                            </View>
                          </TouchableOpacity>
                        </SwipeToDelete>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyWaterHistory}>
                      <Droplets color={colors.textTertiary} size={48} />
                      <Text style={[styles.emptyWaterHistoryText, { color: colors.textSecondary }]}>
                        No water logged today
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={editingWaterEntry !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingWaterEntry(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={() => setEditingWaterEntry(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Water</Text>
                    <TouchableOpacity onPress={() => setEditingWaterEntry(null)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Ounces (oz)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={waterInput}
                      onChangeText={setWaterInput}
                      keyboardType="decimal-pad"
                      placeholder="12"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleSaveWaterEdit}
                    />

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                        onPress={handleSaveWaterEdit}
                      >
                        <Edit3 color="#FFFFFF" size={18} />
                        <Text style={styles.modalButtonTextWithIcon}>Update</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalButtonDelete, { backgroundColor: colors.error }]}
                        onPress={() => {
                          if (editingWaterEntry) {
                            removeWater(editingWaterEntry.id);
                            setEditingWaterEntry(null);
                            setWaterInput("");
                            if (Platform.OS !== "web") {
                              import("expo-haptics").then((Haptics) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                              }).catch(() => {});
                            }
                          }
                        }}
                      >
                        <Trash2 color="#FFFFFF" size={18} />
                        <Text style={styles.modalButtonTextWithIcon}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={selectedFood !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFood(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedFood(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Food</Text>
                    <TouchableOpacity onPress={() => setSelectedFood(null)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  {selectedFood && (
                    <View style={styles.foodDetailContainer}>
                      <View style={[styles.foodDetailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.foodDetailSectionTitle, { color: colors.textSecondary, marginBottom: 8 }]}>Food Name</Text>
                        <TextInput
                            style={[styles.foodDetailName, { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 4 }]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Food Name"
                            placeholderTextColor={colors.textTertiary}
                        />
                        {selectedFood.brand && (
                          <Text style={[styles.foodDetailBrand, { color: colors.textSecondary, marginTop: 8 }]} numberOfLines={1}>{selectedFood.brand}</Text>
                        )}
                      </View>

                      <View style={[styles.foodDetailSection, { borderColor: colors.borderLight }]}>
                        <Text style={[styles.foodDetailSectionTitle, { color: colors.textSecondary }]}>Serving</Text>
                        <View style={styles.servingEditRow}>
                          <View style={styles.servingInputContainer}>
                            <TextInput
                              style={[styles.servingInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                              value={editServingAmount}
                              onChangeText={setEditServingAmount}
                              keyboardType="decimal-pad"
                              placeholder="1"
                              placeholderTextColor={colors.textTertiary}
                            />
                            <Text style={[styles.servingUnit, { color: colors.text }]}>{selectedFood.servingSize}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.nutritionRow}>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Calories</Text>
                          <Text style={[styles.nutritionValue, { color: colors.primary }]}>
                            {calculatedFoodValues?.calories || selectedFood.calories}
                          </Text>
                        </View>
                        <View style={[styles.nutritionDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Protein</Text>
                          <Text style={[styles.nutritionValue, { color: colors.protein }]}>
                            {(calculatedFoodValues?.protein || selectedFood.protein).toFixed(1)}g
                          </Text>
                        </View>
                      </View>

                      <View style={styles.nutritionRow}>
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Carbs</Text>
                          <Text style={[styles.nutritionValue, { color: colors.carbs }]}>
                            {(calculatedFoodValues?.carbs || selectedFood.carbs).toFixed(1)}g
                          </Text>
                        </View>
                        <View style={[styles.nutritionDivider, { backgroundColor: colors.borderLight }]} />
                        <View style={styles.nutritionItem}>
                          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Fat</Text>
                          <Text style={[styles.nutritionValue, { color: colors.fats }]}>
                            {(calculatedFoodValues?.fat || selectedFood.fat).toFixed(1)}g
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                          onPress={handleSaveFoodEdit}
                        >
                          <Edit3 color="#FFFFFF" size={18} />
                          <Text style={styles.modalButtonTextWithIcon}>Update</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.modalButtonDelete, { backgroundColor: colors.error }]}
                          onPress={() => {
                            if (selectedFood) {
                              handleRemoveFood(selectedFood);
                              setSelectedFood(null);
                            }
                          }}
                        >
                          <Trash2 color="#FFFFFF" size={18} />
                          <Text style={styles.modalButtonTextWithIcon}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp(5),
    paddingBottom: 0,
    alignItems: "center" as const,
    gap: scale(8),
    marginTop: scale(2),
    zIndex: 10,
  },
  logoImage: {
    width: wp(95),
    height: hp(12),
    zIndex: 10,
    marginBottom: scale(-10),
  },
  dateText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  heroDateText: {
    fontSize: 12,
    fontWeight: "600" as const,
    position: "absolute" as const,
    top: 12,
    left: 12,
    zIndex: 1,
  },
  heroCard: {
    marginHorizontal: wp(4),
    marginBottom: 0,
    marginTop: scale(-52),
    padding: wp(5),
    paddingTop: wp(6.5),
    paddingBottom: wp(5),
    borderRadius: moderateScale(20),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: hp(32),
  },
  semiCircleContainer: {
    position: "relative",
    width: 200,
    height: 100,
    overflow: "hidden",
  },
  semiCircleBackground: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 16,
    top: 0,
    left: 0,
  },
  semiCircleFill: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 16,
    borderColor: "transparent",
    top: 0,
    left: 0,
    transform: [{ rotate: "-90deg" }],
  },
  caloriesCenter: {
    alignItems: "center",
  },
  caloriesValue: {
    fontSize: getResponsiveFontSize(36),
    fontWeight: "700" as const,
  },
  caloriesLabel: {
    fontSize: getResponsiveFontSize(13),
    marginTop: scale(2),
  },
  caloriesRemaining: {
    fontSize: getResponsiveFontSize(12),
    marginTop: scale(4),
  },
  macroChips: {
    flexDirection: "row",
    gap: wp(2),
    marginTop: scale(16),
    width: "100%",
  },
  macroChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1),
    borderRadius: moderateScale(999),
    gap: scale(6),
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroChipLabel: {
    fontSize: getResponsiveFontSize(11),
    fontWeight: "600" as const,
    flex: 1,
  },
  macroBar: {
    width: 30,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  compactRow: {
    flexDirection: "row",
    marginHorizontal: wp(4),
    marginBottom: hp(1.2),
    gap: wp(2.5),
  },
  compactCard: {
    flex: 1,
    padding: wp(3),
    borderRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fastingHeader: {
    marginBottom: 10,
  },
  fastingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fastingTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  fastingNotActive: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  fastingStatus: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  fastingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  fastingButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  fastingActive: {
    gap: 10,
  },
  fastingTimerContainer: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  fastingTimer: {
    fontSize: 24,
    fontWeight: "700" as const,
    fontVariant: ["tabular-nums"],
  },
  fastingTimerLabel: {
    fontSize: 10,
    fontWeight: "500" as const,
  },
  fastingStartedAt: {
    fontSize: 9,
    marginTop: 2,
  },
  fastingEndButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  lastFastContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  lastFastLabel: {
    fontSize: 10,
    fontWeight: "500" as const,
  },
  lastFastDuration: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontVariant: ["tabular-nums"],
  },
  waterCard: {
    marginHorizontal: wp(4),
    marginBottom: hp(1.2),
    padding: wp(3.5),
    borderRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  waterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  waterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waterTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  waterProgressButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waterProgress: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  waterBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  waterBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  waterControls: {
    flexDirection: "row",
    gap: 6,
  },
  waterSmallButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  waterButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  waterCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  waterCustomButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  recentCard: {
    marginHorizontal: wp(4),
    marginBottom: hp(1.2),
    padding: wp(3.5),
    borderRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    maxHeight: hp(35),
  },
  foodListScroll: {
    maxHeight: hp(27),
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  addFoodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  addFoodPillText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: "500" as const,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  foodList: {
    gap: 8,
  },
  foodItem: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingLeft: 16,
    borderRadius: 10,
    position: "relative" as const,
  },
  foodAccent: {
    position: "absolute" as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  foodContent: {
    flex: 1,
    paddingLeft: 0,
  },
  foodName: {
    fontSize: 13,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  foodDetails: {
    fontSize: 10,
    marginBottom: 4,
  },
  foodMacros: {
    flexDirection: "row",
  },
  foodMacroText: {
    fontSize: 9,
  },
  foodRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 12,
  },
  foodCalories: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  foodCaloriesLabel: {
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: "700" as const,
  },
  modalBody: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  input: {
    borderRadius: moderateScale(12),
    padding: wp(4),
    fontSize: getResponsiveFontSize(16),
    borderWidth: 1,
  },
  modalButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  waterHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  waterHistoryButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  waterHistoryList: {
    maxHeight: 400,
  },
  waterHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  waterHistoryItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  waterHistoryItemInfo: {
    flex: 1,
  },
  waterHistoryItemAmount: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  waterHistoryItemTime: {
    fontSize: 13,
  },
  waterHistoryItemDelete: {
    padding: 8,
  },
  emptyWaterHistory: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyWaterHistoryText: {
    fontSize: 16,
    fontWeight: "500" as const,
    marginTop: 16,
  },
  undoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  undoText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },

  stepsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  stepsValue: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  stepsInfoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  stepsInfoText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
  },
  stepsBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  stepsBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  stepsGoalRow: {
    alignItems: "center",
  },
  stepsGoalText: {
    fontSize: 9,
    fontWeight: "500" as const,
  },
  foodDetailContainer: {
    gap: 16,
  },
  foodDetailCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  foodDetailName: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  foodDetailBrand: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  foodDetailSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  foodDetailSectionTitle: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: "row",
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  nutritionDivider: {
    width: 1,
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalButtonDelete: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  servingEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  servingInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  servingInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "600" as const,
    borderWidth: 2,
  },
  servingUnit: {
    fontSize: 15,
    fontWeight: "500" as const,
  },

  modalButtonTextWithIcon: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
