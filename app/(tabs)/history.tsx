import React, { useRef, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, PanResponder, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Trash2, Clock } from "lucide-react-native";
import { useCalorieTracker } from "@/contexts/CalorieContext";
import { useFasting, type Fast } from "@/contexts/FastingContext";
import { useTheme } from "@/contexts/ThemeContext";

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
          if (gestureState.dx < -50) {
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

export default function HistoryScreen() {
  const { todayLog, removeFood, addFood } = useCalorieTracker();
  const { history, deleteFast, getCompletedFastDuration } = useFasting();
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [undoFood, setUndoFood] = useState<{ id: string; name: string; servingAmount: number; servingSize: string; calories: number; protein: number; carbs: number; fat: number; timestamp?: number; source?: "database" | "ai" | "user" | "fast-food" | "barcode"; brand?: string; barcode?: string; confidence?: number } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  React.useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          if (openItemId) {
            setOpenItemId(null);
          }
        }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>History</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>View your daily logs</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.todayCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Clock color={colors.primary} size={24} />
              <Text style={[styles.todayTitle, { color: colors.text }]}>Fasting History</Text>
            </View>
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock color={colors.textTertiary} size={40} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No fasting sessions logged</Text>
              </View>
            ) : (
              <View style={styles.foodsList}>
                {history.slice(0, 10).map((fast: Fast, index: number) => (
                  <SwipeToDelete
                    key={`${fast.id}-${index}`}
                    onDelete={() => deleteFast(fast.id)}
                    colors={colors}
                    itemId={fast.id}
                    openItemId={openItemId}
                    setOpenItemId={setOpenItemId}
                  >
                    <View style={[styles.foodItem, { borderBottomColor: colors.borderLight }]}>
                      <View style={styles.foodLeft}>
                        <Text style={[styles.foodName, { color: colors.text }]}>Fast Completed</Text>
                        <Text style={[styles.foodDetails, { color: colors.textSecondary }]}>  
                          {new Date(fast.startTime).toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                          })} - {fast.endTime ? new Date(fast.endTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit"
                          }) : "In Progress"}
                        </Text>
                      </View>
                      <View style={styles.foodRight}>
                        <Text style={[styles.foodCalories, { color: colors.primary }]}>{getCompletedFastDuration(fast)}</Text>
                      </View>
                    </View>
                  </SwipeToDelete>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.todayCard, { backgroundColor: colors.card, shadowColor: colors.shadow, marginTop: 16 }]}>
            <View style={styles.sectionHeader}>
              <Calendar color={colors.primary} size={24} />
              <Text style={[styles.todayTitle, { color: colors.text }]}>Today&apos;s Foods</Text>
            </View>
            {todayLog.foods.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar color={colors.textTertiary} size={40} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No foods logged today</Text>
              </View>
            ) : (
              <View style={styles.foodsList}>
                {todayLog.foods.map((food: { id: string; name: string; servingAmount: number; servingSize: string; calories: number; protein: number; carbs: number; fat: number }, index: number) => (
                  <SwipeToDelete
                    key={`${food.id}-${index}`}
                    onDelete={() => handleRemoveFood(food)}
                    colors={colors}
                    itemId={food.id}
                    openItemId={openItemId}
                    setOpenItemId={setOpenItemId}
                  >
                    <View style={[styles.foodItem, { borderBottomColor: colors.borderLight }]}>
                      <View style={styles.foodLeft}>
                        <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                        <Text style={[styles.foodDetails, { color: colors.textSecondary }]}>
                          {food.servingAmount} {food.servingSize}
                        </Text>
                      </View>
                      <View style={styles.foodRight}>
                        <Text style={[styles.foodCalories, { color: colors.primary }]}>{food.calories} cal</Text>
                        <Text style={[styles.foodMacros, { color: colors.textTertiary }]}>
                          P: {Math.round(food.protein)}g | C: {Math.round(food.carbs)}g | F: {Math.round(food.fat)}g
                        </Text>
                      </View>
                    </View>
                  </SwipeToDelete>
                ))}
              </View>
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
        </View>
      </ScrollView>
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
  todayCard: {
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  },
  foodsList: {
    gap: 12,
  },
  foodItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  foodLeft: {
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 13,
  },
  foodRight: {
    gap: 4,
  },
  foodCalories: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  foodMacros: {
    fontSize: 12,
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
});
