import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ScrollView,
  Alert,
  Linking,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import * as Haptics from "expo-haptics";
import {
  Plus,
  X,
  Trash2,
  Edit3,
  Camera,
  CalendarDays,
  Replace,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react-native";
import { useWeightTracker } from "@/contexts/WeightContext";
import { useCalorieTracker } from "@/contexts/CalorieContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import DatePicker from "@/components/DatePicker";

function calculateBMI(weightLbs: number, heightInches: number): number {
  if (heightInches <= 0 || weightLbs <= 0) return 0;
  return 703 * weightLbs / (heightInches * heightInches);
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "#EF4444" };
  if (bmi < 25) return { label: "Normal", color: "#10B981" };
  if (bmi < 30) return { label: "Overweight", color: "#F59E0B" };
  return { label: "Obese", color: "#EF4444" };
}

function convertToISO(mmddyyyy: string): string | null {
  if (mmddyyyy.length !== 10) return null;
  const parts = mmddyyyy.split("/");
  if (parts.length !== 3) return null;
  const [month, day, year] = parts.map(Number);
  if (!month || !day || !year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

function convertFromISO(iso: string): string {
  if (!iso || iso.length < 10) return "";
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

function formatDateInput(text: string): string {
  const digitsOnly = text.replace(/\D/g, "");
  let formatted = "";

  if (digitsOnly.length > 0) {
    formatted = digitsOnly.substring(0, 2);
    if (digitsOnly.length >= 3) {
      formatted += "/" + digitsOnly.substring(2, 4);
    }
    if (digitsOnly.length >= 5) {
      formatted += "/" + digitsOnly.substring(4, 8);
    }
  }

  return formatted;
}

function formatPhotoWeight(value?: number): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(1)} lbs`;
  }

  return null;
}

export default function WeightScreen() {
  const { entries, stats, goal, profile, forecast, addWeightEntry, updateWeightGoal, removeWeightEntry, updateWeightEntry, photos, addPhoto, replacePhoto, updateStartWeightAndDate, updatePhotoWeight } = useWeightTracker();
  const { goals: calorieGoals } = useCalorieTracker();
  const { theme } = useTheme();
  const { settings } = useSettings();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editDate, setEditDate] = useState("");
  const [targetWeight, setTargetWeight] = useState(goal.targetWeight.toString());
  const [goalType, setGoalType] = useState<"lose" | "gain" | "maintain">(goal.goalType);
  const [showStartWeightModal, setShowStartWeightModal] = useState(false);
  const [editStartWeight, setEditStartWeight] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<"edit" | "start">("edit");
  
  // Photo edit state
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<{ id: string; label: string; currentWeight: string } | null>(null);
  const [editPhotoWeightValue, setEditPhotoWeightValue] = useState("");
  
  // Photo viewer state
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [selectedPhotoLabel, setSelectedPhotoLabel] = useState<string>("");
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const initialDistance = useRef<number | null>(null);

  const bmi = calculateBMI(stats.currentWeight, profile.height);
  const bmiCategory = getBMICategory(bmi);
  const hasAllRequiredData = profile.height > 0 && profile.age > 0 && stats.currentWeight > 0;
  const forecastData = hasAllRequiredData ? forecast(calorieGoals.calories) : null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        scale.setOffset(lastScale.current);
        translateX.setOffset(lastTranslateX.current);
        translateY.setOffset(lastTranslateY.current);
        scale.setValue(0);
        translateX.setValue(0);
        translateY.setValue(0);
        
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          initialDistance.current = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
        } else {
          initialDistance.current = null;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2 && initialDistance.current) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const currentDistance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          const scaleChange = currentDistance / initialDistance.current;
          scale.setValue(scaleChange - 1);
        } else if (evt.nativeEvent.touches.length === 1) {
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        scale.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();
        
        lastScale.current = (scale as any)._value;
        lastTranslateX.current = (translateX as any)._value;
        lastTranslateY.current = (translateY as any)._value;
        initialDistance.current = null;
        
        if (lastScale.current < 1) {
          Animated.parallel([
            Animated.spring(scale, {
              toValue: 1,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(translateX, {
              toValue: 0,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start(() => {
            lastScale.current = 1;
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
          });
        }
      },
    })
  ).current;



  const handleOpenPhotoViewer = (uri: string, label: string, photoId: string) => {
    setSelectedPhotoUri(uri);
    setSelectedPhotoLabel(label);
    setSelectedPhotoId(photoId);
    setShowPhotoViewer(true);
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    initialDistance.current = null;
  };

  const handleClosePhotoViewer = () => {
    setShowPhotoViewer(false);
    setSelectedPhotoUri(null);
    setSelectedPhotoLabel("");
    setSelectedPhotoId(null);
  };

  const handleDoubleTap = () => {
    const isZoomed = lastScale.current > 1.1;
    const targetScale = isZoomed ? 1 : 2.5;
    
    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      lastScale.current = targetScale;
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;
    });
  };

  let lastTap = 0;
  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    }
    lastTap = now;
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);
    if (weight && weight > 0) {
      addWeightEntry(weight);
      setNewWeight("");
      setShowAddModal(false);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleSaveGoal = async () => {
    const target = parseFloat(targetWeight);
    if (target && target > 0) {
      updateWeightGoal({
        targetWeight: target,
        goalType,
        startWeight: goal.startWeight || stats.currentWeight || target,
      });
      setShowGoalModal(false);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    removeWeightEntry(id);
    setShowDeleteConfirm(false);
    setSelectedEntryId(null);
    
    if (Platform.OS !== "web") {
      const Haptics = await import("expo-haptics");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedEntryId) {
      const weight = parseFloat(editWeight);
      if (weight && weight > 0 && editDate) {
        const dateISO = convertToISO(editDate);
        if (dateISO) {
          updateWeightEntry(selectedEntryId, weight, dateISO);
          setShowEditModal(false);
          setSelectedEntryId(null);
          setEditWeight("");
          setEditDate("");
          
          if (Platform.OS !== "web") {
            const Haptics = await import("expo-haptics");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      }
    }
  };

  const handleAddPhoto = async (label: "before" | "after") => {
    console.log("[handleAddPhoto] Starting photo selection for:", label);

    try {
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("[handleAddPhoto] Permission status:", permission.status, "access:", permission.accessPrivileges);

      if (!permission.granted) {
        console.log("[handleAddPhoto] Permission denied");
        Alert.alert(
          "Permission needed",
          "Enable photo access in Settings to add progress pictures.",
          [
            { text: "Cancel", style: "cancel" },
            ...(Platform.OS !== "web"
              ? [
                  {
                    text: "Open Settings",
                    onPress: () => {
                      Linking.openSettings()
                        .then(() => {
                          console.log("[handleAddPhoto] Settings opened");
                        })
                        .catch((settingsError) => {
                          console.warn("[handleAddPhoto] Unable to open settings:", settingsError);
                        });
                    },
                  },
                ]
              : []),
          ]
        );
        return;
      }

      console.log("[handleAddPhoto] Launching image picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: Platform.OS === "web" ? 1 : 0.85,
        base64: Platform.OS === "web",
        exif: false,
      });
      console.log("[handleAddPhoto] Image picker result:", { canceled: result.canceled, assets: result.assets?.length });

      if (result.canceled || !result.assets?.length) {
        console.log("[handleAddPhoto] Selection canceled or empty");
        return;
      }

      const selectedAsset = result.assets[0];
      const mimeType = selectedAsset.mimeType || "image/jpeg";
      const assetUri =
        Platform.OS === "web" && selectedAsset.base64
          ? `data:${mimeType};base64,${selectedAsset.base64}`
          : selectedAsset.uri;

      if (!assetUri) {
        throw new Error("Missing image URI");
      }

      console.log("[handleAddPhoto] Image selected:", assetUri.substring(0, 60));
      const existingPhoto = photos.find((photo) => photo.label === label);
      if (existingPhoto) {
        console.log("[handleAddPhoto] Replacing existing photo");
        replacePhoto(label, assetUri, stats.currentWeight);
      } else {
        console.log("[handleAddPhoto] Adding new photo");
        addPhoto(label, assetUri, stats.currentWeight);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("[handleAddPhoto] Error:", error);
      Alert.alert("Photo error", "We couldn’t open your photo library. Please try again.");
    }
  };

  const beforePhoto = photos.find(p => p.label === "before");
  const afterPhoto = photos.find(p => p.label === "after");
  const beforePhotoWeightLabel = formatPhotoWeight(beforePhoto?.weightAtTime);
  const afterPhotoWeightLabel = formatPhotoWeight(afterPhoto?.weightAtTime);
  const hasStartWeight = stats.startWeight > 0;
  const weightDelta = hasStartWeight ? stats.startWeight - stats.currentWeight : 0;
  const displayStartWeight = hasStartWeight ? `${stats.startWeight.toFixed(1)} lbs` : "--";
  const formattedStartDate = goal.startDate
    ? new Date(goal.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Set your starting date";
  const latestEntry = entries.length ? [...entries].sort((a, b) => b.timestamp - a.timestamp)[0] : null;
  const displayCurrentWeight = stats.currentWeight > 0 ? `${stats.currentWeight.toFixed(1)} lbs` : "--";
  const currentWeightSubtitle = latestEntry
    ? `Logged ${new Date(latestEntry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "Log your first weigh-in";
  const displayWeightLost = hasStartWeight ? `${weightDelta >= 0 ? "" : "+"}${Math.abs(weightDelta).toFixed(1)} lbs` : "--";
  const weightLostStatus = !hasStartWeight ? "Add starting info to unlock loss tracking" : weightDelta >= 0 ? "since day one" : "above your start";
  const weightLostAccent = weightDelta >= 0 ? colors.success : colors.error;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={[styles.header, { flexDirection: "row" as const, justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Weight Tracking</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Plus color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, { flex: 1, paddingHorizontal: 20 }]} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row" as const, justifyContent: "space-between" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.weightLabel, { fontSize: 12, color: colors.textSecondary, marginBottom: 4 }]}>Current Weight</Text>
            <Text style={[styles.weightValue, { fontSize: 32, fontWeight: "700" as const, color: colors.text, marginBottom: 4 }]}>{stats.currentWeight.toFixed(1)} lbs</Text>
            <Text style={[styles.goalText, { fontSize: 12, color: colors.textSecondary }]}>
              Goal: {goal.targetWeight > 0 ? `${goal.targetWeight.toFixed(1)} lbs` : "Not set"}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setEditStartWeight(goal.startWeight.toString());
                const dateISO = goal.startDate || new Date().toISOString().split("T")[0];
                setEditStartDate(convertFromISO(dateISO));
                setShowStartWeightModal(true);
              }}
              style={{ marginTop: 6 }}
            >
              <Text style={[styles.editStartLink, { fontSize: 11, color: colors.primary, fontWeight: "600" as const }]}>Edit Start Weight & Date</Text>
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: "center", justifyContent: "center", marginLeft: 16 }}>
            <Text style={[styles.bmiValue, { fontSize: 28, fontWeight: "700" as const, color: colors.text }]}>{bmi > 0 ? bmi.toFixed(1) : "--"}</Text>
            <Text style={[styles.bmiLabel, { fontSize: 11, color: colors.textSecondary, marginBottom: 6 }]}>BMI</Text>
            {bmi > 0 && (
              <View style={[styles.bmiCategory, { backgroundColor: bmiCategory.color + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }]}>
                <Text style={[styles.bmiCategoryText, { fontSize: 11, fontWeight: "600" as const, color: bmiCategory.color }]}>{bmiCategory.label}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12 }]}>
          <Text style={[styles.chartTitle, { fontSize: 14, fontWeight: "600" as const, color: colors.text, marginBottom: 10 }]}>Journey Snapshot</Text>
          <View style={[styles.journeyRow, { marginBottom: 12 }]}>
            <View style={[styles.journeyPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.journeyLabel, { color: colors.textSecondary }]}>Starting Weight</Text>
              <Text style={[styles.journeyValue, { color: colors.text }]}>{displayStartWeight}</Text>
              <Text style={[styles.journeySubtext, { color: colors.textSecondary }]}>{formattedStartDate}</Text>
            </View>
            <View style={[styles.journeyPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.journeyLabel, { color: colors.textSecondary }]}>Weight Now</Text>
              <Text style={[styles.journeyValue, { color: colors.text }]}>{displayCurrentWeight}</Text>
              <Text style={[styles.journeySubtext, { color: colors.textSecondary }]}>{currentWeightSubtitle}</Text>
            </View>
          </View>
          <View style={styles.journeyRow}>
            <View style={[styles.journeyPill, { flex: 1, backgroundColor: weightLostAccent + "12", borderColor: weightLostAccent + "40" }]}>
              <Text style={[styles.journeyLabel, { color: colors.textSecondary }]}>Weight Lost</Text>
              <Text style={[styles.journeyValue, { color: weightLostAccent }]}>{displayWeightLost}</Text>
              <Text style={[styles.journeySubtext, { color: colors.textSecondary }]}>{weightLostStatus}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statsGrid, { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 10, marginBottom: 12 }]}>
          <View style={[styles.statTile, { backgroundColor: colors.card, borderRadius: 12, padding: 12, width: "48%" }]}>
            <Text style={[styles.statTileLabel, { fontSize: 11, color: colors.textSecondary, marginBottom: 4 }]}>Daily Deficit</Text>
            <Text style={[styles.statTileValue, { fontSize: 16, fontWeight: "600" as const, color: forecastData && forecastData.currentDeficitOrSurplus > 0 ? colors.error : colors.success }]}>
              {forecastData ? `${Math.abs(forecastData.currentDeficitOrSurplus).toFixed(0)} cal` : "--"}
            </Text>
          </View>

          <View style={[styles.statTile, { backgroundColor: colors.card, borderRadius: 12, padding: 12, width: "48%" }]}>
            <Text style={[styles.statTileLabel, { fontSize: 11, color: colors.textSecondary, marginBottom: 4 }]}>Your TDEE</Text>
            <Text style={[styles.statTileValue, { fontSize: 16, fontWeight: "600" as const, color: colors.text }]}>
              {forecastData ? `${forecastData.tdee.toFixed(0)} cal` : "--"}
            </Text>
          </View>

          <View style={[styles.statTile, { backgroundColor: colors.card, borderRadius: 12, padding: 12, width: "48%" }]}>
            <Text style={[styles.statTileLabel, { fontSize: 11, color: colors.textSecondary, marginBottom: 4 }]}>Weekly Change</Text>
            <Text style={[styles.statTileValue, { fontSize: 16, fontWeight: "600" as const, color: colors.text }]}>
              {forecastData ? `${forecastData.expectedWeeklyChange > 0 ? "+" : ""}${forecastData.expectedWeeklyChange.toFixed(1)} lbs` : "--"}
            </Text>
          </View>

          <View style={[styles.statTile, { backgroundColor: colors.card, borderRadius: 12, padding: 12, width: "48%" }]}>
            <Text style={[styles.statTileLabel, { fontSize: 11, color: colors.textSecondary, marginBottom: 4 }]}>Time to Goal</Text>
            <Text style={[styles.statTileValue, { fontSize: 16, fontWeight: "600" as const, color: colors.text }]}>
              {forecastData && forecastData.estimatedWeeksToGoal > 0 && isFinite(forecastData.estimatedWeeksToGoal)
                ? `${forecastData.estimatedWeeksToGoal.toFixed(0)} wks`
                : "--"}
            </Text>
          </View>
        </View>

        <View style={[styles.recentCard, { backgroundColor: colors.card, borderRadius: 16, padding: 14 }]}>
          <View style={[styles.recentHeader, { flexDirection: "row" as const, justifyContent: "space-between", alignItems: "center", marginBottom: 12 }]}>
            <Text style={[styles.recentTitle, { fontSize: 14, fontWeight: "600" as const, color: colors.text }]}>Recent Weigh-Ins</Text>
            <TouchableOpacity onPress={() => setShowGoalModal(true)}>
              <Text style={[styles.recentAction, { fontSize: 13, fontWeight: "600" as const, color: colors.primary }]}>Set Goal</Text>
            </TouchableOpacity>
          </View>
          {entries.length === 0 ? (
            <View style={[styles.emptyState, { paddingVertical: 20 }]}>
              <Text style={[styles.emptyText, { fontSize: 13, color: colors.textSecondary, textAlign: "center" as const }]}>No weigh-ins yet</Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {[...entries]
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 3)
                .map((entry, index) => {
                  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
                  const change = index < sortedEntries.length - 1
                    ? entry.weight - sortedEntries[index + 1].weight
                    : 0;
                  return (
                    <View key={entry.id} style={[styles.recentItem, { flexDirection: "row" as const, alignItems: "center", paddingVertical: 10, borderBottomWidth: index < 2 && entries.length > index + 1 ? 1 : 0, borderBottomColor: colors.borderLight }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.recentWeight, { fontSize: 15, fontWeight: "600" as const, color: colors.text }]}>{entry.weight.toFixed(1)} lbs</Text>
                        <Text style={[styles.recentDate, { fontSize: 12, color: colors.textSecondary, marginTop: 2 }]}>
                          {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                      </View>
                      {index < sortedEntries.length - 1 && (
                        <View style={[styles.recentChange, { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8, backgroundColor: change < 0 ? colors.success + "20" : colors.error + "20" }]}>
                          <Text style={[styles.recentChangeText, { fontSize: 12, fontWeight: "600" as const, color: change < 0 ? colors.success : colors.error }]}>
                            {change < 0 ? "▼" : "▲"} {Math.abs(change).toFixed(1)}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.recentActions, { flexDirection: "row" as const, gap: 6 }]}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedEntryId(entry.id);
                            setEditWeight(entry.weight.toString());
                            setEditDate(convertFromISO(entry.date));
                            setShowEditModal(true);
                          }}
                          style={[styles.recentActionButton, { padding: 6, borderRadius: 6, backgroundColor: colors.surface }]}
                        >
                          <Edit3 color={colors.primary} size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedEntryId(entry.id);
                            setShowDeleteConfirm(true);
                          }}
                          style={[styles.recentActionButton, { padding: 6, borderRadius: 6, backgroundColor: colors.surface }]}
                        >
                          <Trash2 color={colors.error} size={16} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
            </View>
          )}
        </View>

        {settings.showProgressPics && (
        <View style={[styles.photosCard, { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 12 }]}>
          <Text style={[styles.photosTitle, { fontSize: 14, fontWeight: "600" as const, color: colors.text, marginBottom: 12 }]}>Progress Photos</Text>
          <View style={[styles.photosGrid, { flexDirection: "row" as const, gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={[styles.photoBox, { aspectRatio: 0.75, borderRadius: 12, backgroundColor: colors.surface, overflow: "hidden" as const, borderWidth: 2, borderColor: beforePhoto ? colors.primary : colors.border, borderStyle: "dashed" as const }]}
                onPress={async () => {
                  if (beforePhoto) {
                    console.log("[Before Photo] Opening viewer");
                    handleOpenPhotoViewer(beforePhoto.uri, "BEFORE", beforePhoto.id);
                  } else {
                    console.log("[Before Photo] Adding photo");
                    await handleAddPhoto("before");
                  }
                }}
                activeOpacity={0.7}
                testID="before-progress-photo"
              >
                {beforePhoto ? (
                  <Image source={{ uri: beforePhoto.uri }} style={[styles.photoImage, { width: "100%", height: "100%" }]} resizeMode="cover" />
                ) : (
                  <View style={[styles.photoEmpty, { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 }]}>
                    <Camera color={colors.textSecondary} size={32} />
                    <Text style={[styles.photoEmptyText, { fontSize: 13, fontWeight: "600" as const, color: colors.textSecondary }]}>BEFORE</Text>
                    <Text style={[styles.photoEmptySubtext, { fontSize: 11, color: colors.textTertiary, textAlign: "center" as const }]}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={[styles.photoInfoBox, { backgroundColor: colors.surface, borderRadius: 8, padding: 10, marginTop: 8 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={[styles.photoLabel, { fontSize: 13, fontWeight: "700" as const, color: colors.text }]}>BEFORE</Text>
                    {beforePhotoWeightLabel && (
                      <Text style={[styles.photoWeight, { fontSize: 12, color: colors.textSecondary, marginTop: 2 }]}>{beforePhotoWeightLabel}</Text>
                    )}
                  </View>
                  {beforePhoto && (
                    <TouchableOpacity
                      onPress={() => {
                        setPhotoToEdit({
                          id: beforePhoto.id,
                          label: "Before",
                          currentWeight: beforePhoto.weightAtTime ? beforePhoto.weightAtTime.toString() : "",
                        });
                        setEditPhotoWeightValue(beforePhoto.weightAtTime ? beforePhoto.weightAtTime.toString() : "");
                        setShowPhotoEditModal(true);
                      }}
                      style={{ padding: 6, backgroundColor: colors.card, borderRadius: 6 }}
                    >
                      <Edit3 color={colors.primary} size={16} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={[styles.photoBox, { aspectRatio: 0.75, borderRadius: 12, backgroundColor: colors.surface, overflow: "hidden" as const, borderWidth: 2, borderColor: afterPhoto ? colors.success : colors.border, borderStyle: "dashed" as const }]}
                onPress={async () => {
                  if (afterPhoto) {
                    console.log("[After Photo] Opening viewer");
                    handleOpenPhotoViewer(afterPhoto.uri, "AFTER", afterPhoto.id);
                  } else {
                    console.log("[After Photo] Adding photo");
                    await handleAddPhoto("after");
                  }
                }}
                activeOpacity={0.7}
                testID="after-progress-photo"
              >
                {afterPhoto ? (
                  <Image source={{ uri: afterPhoto.uri }} style={[styles.photoImage, { width: "100%", height: "100%" }]} resizeMode="cover" />
                ) : (
                  <View style={[styles.photoEmpty, { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 }]}>
                    <Camera color={colors.textSecondary} size={32} />
                    <Text style={[styles.photoEmptyText, { fontSize: 13, fontWeight: "600" as const, color: colors.textSecondary }]}>AFTER</Text>
                    <Text style={[styles.photoEmptySubtext, { fontSize: 11, color: colors.textTertiary, textAlign: "center" as const }]}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={[styles.photoInfoBox, { backgroundColor: colors.surface, borderRadius: 8, padding: 10, marginTop: 8 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={[styles.photoLabel, { fontSize: 13, fontWeight: "700" as const, color: colors.text }]}>AFTER</Text>
                    {afterPhotoWeightLabel && (
                      <Text style={[styles.photoWeight, { fontSize: 12, color: colors.textSecondary, marginTop: 2 }]}>{afterPhotoWeightLabel}</Text>
                    )}
                  </View>
                  {afterPhoto && (
                    <TouchableOpacity
                      onPress={() => {
                        setPhotoToEdit({
                          id: afterPhoto.id,
                          label: "After",
                          currentWeight: afterPhoto.weightAtTime ? afterPhoto.weightAtTime.toString() : "",
                        });
                        setEditPhotoWeightValue(afterPhoto.weightAtTime ? afterPhoto.weightAtTime.toString() : "");
                        setShowPhotoEditModal(true);
                      }}
                      style={{ padding: 6, backgroundColor: colors.card, borderRadius: 6 }}
                    >
                      <Edit3 color={colors.primary} size={16} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
          {(beforePhoto || afterPhoto) && (
            <Text style={[styles.photosHint, { fontSize: 11, color: colors.textSecondary, marginTop: 10, textAlign: "center" as const }]}>Tap photos to view full size. Tap edit icon to update weight.</Text>
          )}
        </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Log Weight</Text>
                    <TouchableOpacity onPress={() => setShowAddModal(false)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Weight (lbs)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={newWeight}
                      onChangeText={setNewWeight}
                      keyboardType="decimal-pad"
                      placeholder="185.5"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleAddWeight}
                    />

                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                      onPress={handleAddWeight}
                      disabled={!newWeight || parseFloat(newWeight) <= 0}
                    >
                      <Text style={styles.modalButtonText}>Save Weight</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Set Weight Goal</Text>
                    <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Goal Type</Text>
                    <View style={styles.goalTypeButtons}>
                      <TouchableOpacity
                        style={[
                          styles.goalTypeButton,
                          { backgroundColor: goalType === "lose" ? colors.primary : colors.surface, borderColor: goalType === "lose" ? colors.primary : colors.border },
                        ]}
                        onPress={() => setGoalType("lose")}
                      >
                        <Text
                          style={[
                            styles.goalTypeText,
                            { color: goalType === "lose" ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          Lose Weight
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.goalTypeButton,
                          { backgroundColor: goalType === "gain" ? colors.primary : colors.surface, borderColor: goalType === "gain" ? colors.primary : colors.border },
                        ]}
                        onPress={() => setGoalType("gain")}
                      >
                        <Text
                          style={[
                            styles.goalTypeText,
                            { color: goalType === "gain" ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          Gain Weight
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.goalTypeButton,
                          { backgroundColor: goalType === "maintain" ? colors.primary : colors.surface, borderColor: goalType === "maintain" ? colors.primary : colors.border },
                        ]}
                        onPress={() => setGoalType("maintain")}
                      >
                        <Text
                          style={[
                            styles.goalTypeText,
                            { color: goalType === "maintain" ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          Maintain
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.inputLabel, { color: colors.text }]}>Target Weight (lbs)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={targetWeight}
                      onChangeText={setTargetWeight}
                      keyboardType="decimal-pad"
                      placeholder="185"
                      returnKeyType="done"
                      onSubmitEditing={handleSaveGoal}
                    />

                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveGoal}>
                      <Text style={styles.modalButtonText}>Save Goal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Weight</Text>
                    <TouchableOpacity onPress={() => setShowEditModal(false)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Weight (lbs)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={editWeight}
                      onChangeText={setEditWeight}
                      keyboardType="decimal-pad"
                      placeholder="185.5"
                      autoFocus
                      returnKeyType="next"
                    />

                    <Text style={[styles.inputLabel, { color: colors.text }]}>Date (MM/DD/YYYY)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={editDate}
                      onChangeText={(text) => setEditDate(formatDateInput(text))}
                      keyboardType="number-pad"
                      placeholder="MM/DD/YYYY"
                      maxLength={10}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveEdit}
                      testID="edit-weigh-in-date-input"
                    />

                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleSaveEdit}>
                      <Text style={styles.modalButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Delete Weigh-In?</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              This action cannot be undone. Your weight graph and timeline will update automatically.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButtonCancel, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setSelectedEntryId(null);
                }}
              >
                <Text style={[styles.confirmButtonCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButtonDelete, { backgroundColor: colors.error }]}
                onPress={() => selectedEntryId && handleDeleteEntry(selectedEntryId)}
              >
                <Text style={styles.confirmButtonDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStartWeightModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartWeightModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Starting Info</Text>
                    <TouchableOpacity onPress={() => setShowStartWeightModal(false)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Starting Weight (lbs)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={editStartWeight}
                      onChangeText={setEditStartWeight}
                      keyboardType="decimal-pad"
                      placeholder="185.5"
                      autoFocus
                      returnKeyType="next"
                    />

                    <Text style={[styles.inputLabel, { color: colors.text }]}>Starting Date (MM/DD/YYYY)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={editStartDate}
                      onChangeText={(text) => setEditStartDate(formatDateInput(text))}
                      keyboardType="number-pad"
                      placeholder="MM/DD/YYYY"
                      maxLength={10}
                      returnKeyType="done"
                      testID="start-date-input"
                    />

                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                      onPress={async () => {
                        const weight = parseFloat(editStartWeight);
                        if (weight && weight > 0 && editStartDate) {
                          const dateISO = convertToISO(editStartDate);
                          if (dateISO) {
                            updateStartWeightAndDate(weight, dateISO);
                            setShowStartWeightModal(false);
                            
                            if (Platform.OS !== "web") {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                          }
                        }
                      }}
                    >
                      <Text style={styles.modalButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showPhotoEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Photo Weight</Text>
                    <TouchableOpacity onPress={() => setShowPhotoEditModal(false)}>
                      <X color={colors.textSecondary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Weight for {photoToEdit?.label} Photo (lbs)
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      placeholderTextColor={colors.textTertiary}
                      value={editPhotoWeightValue}
                      onChangeText={setEditPhotoWeightValue}
                      keyboardType="decimal-pad"
                      placeholder="185.5"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={async () => {
                        const weight = parseFloat(editPhotoWeightValue);
                        if (photoToEdit && weight && weight > 0) {
                          updatePhotoWeight(photoToEdit.id, weight);
                          setShowPhotoEditModal(false);
                          if (Platform.OS !== "web") {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }
                        }
                      }}
                    />

                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                      onPress={async () => {
                        const weight = parseFloat(editPhotoWeightValue);
                        if (photoToEdit && weight && weight > 0) {
                          updatePhotoWeight(photoToEdit.id, weight);
                          setShowPhotoEditModal(false);
                          if (Platform.OS !== "web") {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          }
                        }
                      }}
                    >
                      <Text style={styles.modalButtonText}>Save Weight</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <DatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => {
          if (datePickerType === "edit") {
            setEditDate(date);
          } else {
            setEditStartDate(date);
          }
          setShowDatePicker(false);
        }}
        initialDate={datePickerType === "edit" ? editDate : editStartDate}
        title={datePickerType === "edit" ? "Select Date" : "Select Starting Date"}
      />

      <Modal
        visible={showPhotoViewer}
        transparent
        animationType="fade"
        onRequestClose={handleClosePhotoViewer}
      >
        <View style={[styles.photoViewerContainer, { backgroundColor: "rgba(0,0,0,0.95)" }]}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} {...panResponder.panHandlers}>
            <TouchableWithoutFeedback onPress={handleImagePress}>
              <Animated.Image
                source={{ uri: selectedPhotoUri || "" }}
                style={[
                  styles.photoViewerImage,
                  {
                    width: Dimensions.get("window").width,
                    height: Dimensions.get("window").height * 0.7,
                    transform: [
                      { scale },
                      { translateX },
                      { translateY },
                    ],
                  },
                ]}
                resizeMode="contain"
              />
            </TouchableWithoutFeedback>
          </View>
          
          <View style={[styles.photoViewerHeader, { position: "absolute" as const, top: 0, left: 0, right: 0, paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 10, zIndex: 1000 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.photoViewerTitle, { color: "#FFFFFF", fontSize: 18, fontWeight: "600" as const }]}>{selectedPhotoLabel}</Text>
              <TouchableOpacity
                onPress={handleClosePhotoViewer}
                style={[styles.photoViewerClose, { padding: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20 }]}
                activeOpacity={0.7}
              >
                <X color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[styles.photoViewerFooter, { position: "absolute" as const, bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 20, paddingHorizontal: 20, paddingTop: 20, zIndex: 1000 }]}>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12, justifyContent: "center" }}>
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }]}
                onPress={() => {
                  const currentScale = lastScale.current;
                  const newScale = Math.min(currentScale + 0.5, 5);
                  Animated.spring(scale, {
                    toValue: newScale,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                  }).start(() => {
                    lastScale.current = newScale;
                  });
                }}
                activeOpacity={0.7}
              >
                <ZoomIn color="#FFFFFF" size={18} />
                <Text style={[styles.photoActionText, { color: "#FFFFFF", fontSize: 14, fontWeight: "600" as const }]}>Zoom In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }]}
                onPress={() => {
                  const currentScale = lastScale.current;
                  const newScale = Math.max(currentScale - 0.5, 1);
                  Animated.parallel([
                    Animated.spring(scale, {
                      toValue: newScale,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                    newScale === 1 ? Animated.spring(translateX, {
                      toValue: 0,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }) : Animated.spring(translateX, {
                      toValue: lastTranslateX.current,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                    newScale === 1 ? Animated.spring(translateY, {
                      toValue: 0,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }) : Animated.spring(translateY, {
                      toValue: lastTranslateY.current,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    lastScale.current = newScale;
                    if (newScale === 1) {
                      lastTranslateX.current = 0;
                      lastTranslateY.current = 0;
                    }
                  });
                }}
                activeOpacity={0.7}
              >
                <ZoomOut color="#FFFFFF" size={18} />
                <Text style={[styles.photoActionText, { color: "#FFFFFF", fontSize: 14, fontWeight: "600" as const }]}>Zoom Out</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: "rgba(59,130,246,0.9)", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }]}
                onPress={async () => {
                  if (selectedPhotoId) {
                    const photo = photos.find(p => p.id === selectedPhotoId);
                    if (photo) {
                      await handleAddPhoto(photo.label);
                      handleClosePhotoViewer();
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                <Replace color="#FFFFFF" size={20} />
                <Text style={[styles.photoActionText, { color: "#FFFFFF", fontSize: 15, fontWeight: "600" as const }]}>Replace Photo</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }]}
                onPress={() => {
                  Animated.parallel([
                    Animated.spring(scale, {
                      toValue: 1,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                    Animated.spring(translateX, {
                      toValue: 0,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                    Animated.spring(translateY, {
                      toValue: 0,
                      friction: 7,
                      tension: 40,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    lastScale.current = 1;
                    lastTranslateX.current = 0;
                    lastTranslateY.current = 0;
                  });
                }}
                activeOpacity={0.7}
              >
                <RotateCcw color="#FFFFFF" size={18} />
                <Text style={[styles.photoActionText, { color: "#FFFFFF", fontSize: 14, fontWeight: "600" as const }]}>Reset View</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.photoViewerHint, { color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center" as const, marginTop: 12 }]}>
              Pinch to zoom • Drag to pan • Double tap to toggle zoom
            </Text>
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
  header: {},
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {},
  summaryCard: {},
  weightLabel: {},
  weightValue: {},
  goalText: {},
  bmiValue: {},
  bmiLabel: {},
  bmiCategory: {},
  bmiCategoryText: {},
  chartCard: {},
  chartTitle: {},
  chartPlaceholder: {},
  chartLine: {},
  chartDot: {},
  chartLabels: {},
  chartLabel: {},
  journeyRow: {
    flexDirection: "row",
    gap: 12,
  },
  journeyPill: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  journeyLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  journeyValue: {
    fontSize: 26,
    fontWeight: "700" as const,
    marginTop: 4,
  },
  journeySubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {},
  statTile: {},
  statTileLabel: {},
  statTileValue: {},
  recentCard: {},
  recentHeader: {},
  recentTitle: {},
  recentAction: {},
  recentList: {},
  recentItem: {},
  recentWeight: {},
  recentDate: {},
  recentChange: {},
  recentChangeText: {},
  recentActions: {},
  recentActionButton: {},
  emptyState: {},
  emptyText: {},
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
    fontSize: 24,
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
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  goalTypeButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  goalTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  goalTypeText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePickerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  inputHelp: {
    fontSize: 13,
    marginTop: -8,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmDialog: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  confirmButtonCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  confirmButtonDelete: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonDeleteText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  photosCard: {},
  photosTitle: {},
  photosGrid: {},
  photoBox: {},
  photoImage: {},
  photoOverlay: {},
  photoInfoBox: {},
  photoLabel: {},
  photoWeight: {},
  photoEmpty: {},
  photoEmptyText: {},
  photoEmptySubtext: {},
  photosHint: {},
  editStartLink: {},
  photoViewerContainer: {
    flex: 1,
  },
  photoViewerHeader: {},
  photoViewerTitle: {},
  photoViewerClose: {},
  photoViewerImage: {},
  photoViewerFooter: {},
  photoViewerHint: {},
  photoActionButton: {},
  photoActionText: {},
  imageEditorContainer: {
    flex: 1,
  },
  imageEditorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageEditorTitle: {},
  imagePreviewContainer: {},
  cropOverlay: {},
  editorControls: {},
  controlLabel: {},
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  controlText: {},
  controlButton: {},
  saveImageButton: {},
  saveImageButtonText: {},
  resetButton: {},
});
