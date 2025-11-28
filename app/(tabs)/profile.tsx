import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Target, Save, Droplets, User } from "lucide-react-native";
import { useCalorieTracker } from "@/contexts/CalorieContext";
import { useWeightTracker, calculateRecommendedMacros } from "@/contexts/WeightContext";
import { useTheme } from "@/contexts/ThemeContext";


export default function ProfileScreen() {
  const { goals, updateGoals } = useCalorieTracker();
  const { stats, profile, goal, updateProfile, updateWeightGoal } = useWeightTracker();
  const { theme } = useTheme();

  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [goalType, setGoalType] = useState<"lose" | "gain" | "maintain">(goal.goalType);
  const [poundsPerWeek, setPoundsPerWeek] = useState(goal.poundsPerWeek.toString());
  const [useCustomMacros, setUseCustomMacros] = useState(goal.useCustomMacros);
  const [macroMode, setMacroMode] = useState<"standard" | "muscle_conservation">(goal.macroMode || "standard");
  
  const [calories, setCalories] = useState(goals.calories.toString());
  const [protein, setProtein] = useState(goals.protein.toString());
  const [carbs, setCarbs] = useState(goals.carbs.toString());
  const [fat, setFat] = useState(goals.fat.toString());
  const [water, setWater] = useState(goals.water.toString());
  const [useAutoWaterGoal, setUseAutoWaterGoal] = useState(goals.useAutoWaterGoal || false);

  const [heightFeet, setHeightFeet] = useState(Math.floor(profile.height / 12).toString());
  const [heightInches, setHeightInches] = useState((profile.height % 12).toString());
  const [age, setAge] = useState(profile.age.toString());
  const [isMale, setIsMale] = useState(profile.isMale);
  const [activityLevel, setActivityLevel] = useState<"sedentary" | "light" | "moderate" | "active" | "very_active">(goal.activityLevel);
  const [goalWeight, setGoalWeight] = useState(
    goal.targetWeight && goal.targetWeight > 0
      ? goal.targetWeight.toString()
      : stats.currentWeight && stats.currentWeight > 0
      ? stats.currentWeight.toFixed(1)
      : ""
  );

  const calculatedWaterGoal = useMemo(() => {
    const currentWeight = stats.currentWeight || 150;
    return Math.round(currentWeight * 0.5);
  }, [stats.currentWeight]);

  const recommendedMacros = useMemo(() => {
    if (!stats.currentWeight || stats.currentWeight === 0) {
      return { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    }
    const heightFeetNum = parseInt(heightFeet);
    const heightInchesNum = parseInt(heightInches);
    const heightNum = (heightFeetNum || 5) * 12 + (heightInchesNum || 10);
    const ageNum = parseInt(age) || 30;
    const poundsNum = parseFloat(poundsPerWeek) || 0;
    const goalWeightNum = parseFloat(goalWeight) || stats.currentWeight;
    
    return calculateRecommendedMacros(
      stats.currentWeight,
      heightNum,
      ageNum,
      isMale,
      activityLevel,
      goalType,
      poundsNum,
      macroMode,
      goalWeightNum
    );
  }, [stats.currentWeight, heightFeet, heightInches, age, isMale, activityLevel, goalType, poundsPerWeek, macroMode, goalWeight]);

  useEffect(() => {
    if (useAutoWaterGoal) {
      setWater(calculatedWaterGoal.toString());
    }
  }, [useAutoWaterGoal, calculatedWaterGoal]);

  useEffect(() => {
    if (!useCustomMacros) {
      setCalories(recommendedMacros.calories.toString());
      setProtein(recommendedMacros.protein.toString());
      setCarbs(recommendedMacros.carbs.toString());
      setFat(recommendedMacros.fat.toString());
    }
  }, [useCustomMacros, recommendedMacros]);

  const handleSave = () => {
    const heightFeetNum = parseInt(heightFeet);
    const heightInchesNum = parseInt(heightInches);
    const ageNum = parseInt(age);
    const currentWeight = stats.currentWeight;

    if (!heightFeetNum || heightFeetNum <= 0) {
      Alert.alert("Height Required", "Please enter a valid height in feet.");
      return;
    }
    if (isNaN(heightInchesNum) || heightInchesNum < 0 || heightInchesNum >= 12) {
      Alert.alert("Height Required", "Please enter valid inches (0-11).");
      return;
    }
    const heightNum = heightFeetNum * 12 + heightInchesNum;
    if (!ageNum || ageNum <= 0) {
      Alert.alert("Age Required", "Please enter a valid age.");
      return;
    }
    if (!currentWeight || currentWeight <= 0) {
      Alert.alert("Weight Required", "Please log your weight in the Weight tab first.");
      return;
    }

    updateProfile({
      height: heightNum,
      age: ageNum,
      isMale,
    });

    const targetWeightNum = parseFloat(goalWeight);
    if (!isNaN(targetWeightNum) && targetWeightNum > 0) {
      const poundsNum = parseFloat(poundsPerWeek);
      if (!isNaN(poundsNum) && poundsNum >= 0) {
        updateWeightGoal({
          activityLevel,
          targetWeight: targetWeightNum,
          goalType,
          poundsPerWeek: poundsNum,
          useCustomMacros,
          macroMode,
        });
      } else {
        updateWeightGoal({
          activityLevel,
          goalType,
          useCustomMacros,
          macroMode,
        });
      }
    } else {
      updateWeightGoal({
        activityLevel,
        goalType,
        useCustomMacros,
        macroMode,
      });
    }

    const waterGoal = useAutoWaterGoal ? calculatedWaterGoal : (parseInt(water) || 64);
    updateGoals({
      calories: parseInt(calories) || 2000,
      protein: parseInt(protein) || 150,
      carbs: parseInt(carbs) || 200,
      fat: parseInt(fat) || 65,
      water: waterGoal,
      useAutoWaterGoal,
    });

    Alert.alert("Success", "Your profile and goals have been updated!");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your daily goals</Text>
        </View>

        <View style={styles.content}>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <User color={colors.primary} size={24} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Personal Info</Text>
            </View>

            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Required for accurate TDEE calculation
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Sex</Text>
              <View style={styles.sexOptions}>
                <TouchableOpacity
                  style={[
                    styles.sexOption,
                    { backgroundColor: isMale ? colors.primary : colors.surface, borderColor: isMale ? colors.primary : colors.border },
                  ]}
                  onPress={() => setIsMale(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sexOptionText, { color: isMale ? "#FFFFFF" : colors.text }]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sexOption,
                    { backgroundColor: !isMale ? colors.primary : colors.surface, borderColor: !isMale ? colors.primary : colors.border },
                  ]}
                  onPress={() => setIsMale(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sexOptionText, { color: !isMale ? "#FFFFFF" : colors.text }]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Height</Text>
              <View style={styles.heightInputs}>
                <View style={styles.heightInputContainer}>
                  <TextInput
                    style={[styles.heightInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholderTextColor={colors.textTertiary}
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    keyboardType="numeric"
                    placeholder="5"
                    returnKeyType="next"
                  />
                  <Text style={[styles.heightInputLabel, { color: colors.textSecondary }]}>ft</Text>
                </View>
                <View style={styles.heightInputContainer}>
                  <TextInput
                    style={[styles.heightInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholderTextColor={colors.textTertiary}
                    value={heightInches}
                    onChangeText={setHeightInches}
                    keyboardType="numeric"
                    placeholder="10"
                    returnKeyType="next"
                  />
                  <Text style={[styles.heightInputLabel, { color: colors.textSecondary }]}>in</Text>
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Age (years)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholderTextColor={colors.textTertiary}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="30"
                returnKeyType="done"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Current Weight</Text>
              <View style={[styles.formInput, styles.readOnlyInput, { backgroundColor: colors.borderLight, borderColor: colors.border }]}>
                <Text style={[styles.readOnlyText, { color: colors.text }]}>
                  {stats.currentWeight > 0 ? `${stats.currentWeight.toFixed(1)} lbs` : "Not set - Add in Weight tab"}
                </Text>
              </View>
            </View>


            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Goal Weight</Text>
              <Text style={[styles.formHelperText, { color: colors.textSecondary }]}>
                Used to calculate your time until goal
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholderTextColor={colors.textTertiary}
                value={goalWeight}
                onChangeText={setGoalWeight}
                keyboardType="numeric"
                placeholder={stats.currentWeight > 0 ? stats.currentWeight.toFixed(1) : "180"}
                returnKeyType="done"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Activity Level</Text>
              <View style={styles.activityOptions}>
                <TouchableOpacity
                  style={[
                    styles.activityOption,
                    { backgroundColor: activityLevel === "sedentary" ? colors.primary : colors.surface, borderColor: activityLevel === "sedentary" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setActivityLevel("sedentary")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activityOptionText, { color: activityLevel === "sedentary" ? "#FFFFFF" : colors.text }]}>Sedentary</Text>
                  <Text style={[styles.activityOptionDesc, { color: activityLevel === "sedentary" ? "#FFFFFF" : colors.textSecondary }]}>Little/no exercise</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.activityOption,
                    { backgroundColor: activityLevel === "light" ? colors.primary : colors.surface, borderColor: activityLevel === "light" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setActivityLevel("light")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activityOptionText, { color: activityLevel === "light" ? "#FFFFFF" : colors.text }]}>Lightly Active</Text>
                  <Text style={[styles.activityOptionDesc, { color: activityLevel === "light" ? "#FFFFFF" : colors.textSecondary }]}>1-3 days/week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.activityOption,
                    { backgroundColor: activityLevel === "moderate" ? colors.primary : colors.surface, borderColor: activityLevel === "moderate" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setActivityLevel("moderate")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activityOptionText, { color: activityLevel === "moderate" ? "#FFFFFF" : colors.text }]}>Moderately Active</Text>
                  <Text style={[styles.activityOptionDesc, { color: activityLevel === "moderate" ? "#FFFFFF" : colors.textSecondary }]}>3-5 days/week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.activityOption,
                    { backgroundColor: activityLevel === "active" ? colors.primary : colors.surface, borderColor: activityLevel === "active" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setActivityLevel("active")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activityOptionText, { color: activityLevel === "active" ? "#FFFFFF" : colors.text }]}>Very Active</Text>
                  <Text style={[styles.activityOptionDesc, { color: activityLevel === "active" ? "#FFFFFF" : colors.textSecondary }]}>6-7 days/week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.activityOption,
                    { backgroundColor: activityLevel === "very_active" ? colors.primary : colors.surface, borderColor: activityLevel === "very_active" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setActivityLevel("very_active")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activityOptionText, { color: activityLevel === "very_active" ? "#FFFFFF" : colors.text }]}>Extra Active</Text>
                  <Text style={[styles.activityOptionDesc, { color: activityLevel === "very_active" ? "#FFFFFF" : colors.textSecondary }]}>Physical job + exercise</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <Target color={colors.primary} size={24} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Weight Goal</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Goal Type</Text>
              <View style={styles.goalTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.goalTypeOption,
                    { backgroundColor: goalType === "lose" ? colors.primary : colors.surface, borderColor: goalType === "lose" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setGoalType("lose")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.goalTypeText, { color: goalType === "lose" ? "#FFFFFF" : colors.text }]}>Lose</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeOption,
                    { backgroundColor: goalType === "maintain" ? colors.primary : colors.surface, borderColor: goalType === "maintain" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setGoalType("maintain")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.goalTypeText, { color: goalType === "maintain" ? "#FFFFFF" : colors.text }]}>Maintain</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.goalTypeOption,
                    { backgroundColor: goalType === "gain" ? colors.primary : colors.surface, borderColor: goalType === "gain" ? colors.primary : colors.border },
                  ]}
                  onPress={() => setGoalType("gain")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.goalTypeText, { color: goalType === "gain" ? "#FFFFFF" : colors.text }]}>Gain</Text>
                </TouchableOpacity>
              </View>
            </View>

            {goalType !== "maintain" && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Pounds per Week</Text>
                <Text style={[styles.formHelperText, { color: colors.textSecondary }]}>
                  {goalType === "lose" ? "Recommended: 0.5-2 lbs/week" : "Recommended: 0.25-1 lb/week"}
                </Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholderTextColor={colors.textTertiary}
                  value={poundsPerWeek}
                  onChangeText={setPoundsPerWeek}
                  keyboardType="decimal-pad"
                  placeholder={goalType === "lose" ? "1.0" : "0.5"}
                  returnKeyType="next"
                />
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.cardHeader}>
              <Target color={colors.primary} size={24} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Nutrition Goals</Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>Auto Calculate Macros</Text>
                <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                  {!useCustomMacros 
                    ? `Based on your weight goal (${recommendedMacros.calories} cal)`
                    : "Set your own custom macro targets"}
                </Text>
              </View>
              <Switch
                value={!useCustomMacros}
                onValueChange={(value) => setUseCustomMacros(!value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Calories</Text>
              <TextInput
                style={[
                  styles.formInput, 
                  { 
                    backgroundColor: !useCustomMacros ? colors.borderLight : colors.surface, 
                    color: !useCustomMacros ? colors.textTertiary : colors.text, 
                    borderColor: colors.border 
                  }
                ]}
                placeholderTextColor={colors.textTertiary}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="2000"
                returnKeyType="next"
                editable={useCustomMacros}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Protein (g)</Text>
              <TextInput
                style={[
                  styles.formInput, 
                  { 
                    backgroundColor: !useCustomMacros ? colors.borderLight : colors.surface, 
                    color: !useCustomMacros ? colors.textTertiary : colors.text, 
                    borderColor: colors.border 
                  }
                ]}
                placeholderTextColor={colors.textTertiary}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholder="150"
                returnKeyType="next"
                editable={useCustomMacros}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Carbs (g)</Text>
              <TextInput
                style={[
                  styles.formInput, 
                  { 
                    backgroundColor: !useCustomMacros ? colors.borderLight : colors.surface, 
                    color: !useCustomMacros ? colors.textTertiary : colors.text, 
                    borderColor: colors.border 
                  }
                ]}
                placeholderTextColor={colors.textTertiary}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholder="200"
                returnKeyType="next"
                editable={useCustomMacros}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Fat (g)</Text>
              <TextInput
                style={[
                  styles.formInput, 
                  { 
                    backgroundColor: !useCustomMacros ? colors.borderLight : colors.surface, 
                    color: !useCustomMacros ? colors.textTertiary : colors.text, 
                    borderColor: colors.border 
                  }
                ]}
                placeholderTextColor={colors.textTertiary}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                placeholder="65"
                returnKeyType="next"
                editable={useCustomMacros}
              />
            </View>

            {!useCustomMacros && (
              <View style={[styles.macroSettingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.macroSettingsTitle, { color: colors.text }]}>Macro Settings</Text>
                <Text style={[styles.macroSettingsDesc, { color: colors.textSecondary }]}>
                  Choose how to calculate your macros based on your goals
                </Text>

                <View style={styles.macroModeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.macroModeOption,
                      { 
                        backgroundColor: macroMode === "standard" ? colors.primary : colors.card, 
                        borderColor: macroMode === "standard" ? colors.primary : colors.border 
                      },
                    ]}
                    onPress={() => setMacroMode("standard")}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.macroModeTitle, { color: macroMode === "standard" ? "#FFFFFF" : colors.text }]}>Standard Split</Text>
                    <Text style={[styles.macroModeDesc, { color: macroMode === "standard" ? "#FFFFFF" : colors.textSecondary }]}>Balanced macros based on your calories (40% carbs, 30% protein, 30% fat)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.macroModeOption,
                      { 
                        backgroundColor: macroMode === "muscle_conservation" ? colors.primary : colors.card, 
                        borderColor: macroMode === "muscle_conservation" ? colors.primary : colors.border 
                      },
                    ]}
                    onPress={() => setMacroMode("muscle_conservation")}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.macroModeTitle, { color: macroMode === "muscle_conservation" ? "#FFFFFF" : colors.text }]}>Muscle Conservation</Text>
                    <Text style={[styles.macroModeDesc, { color: macroMode === "muscle_conservation" ? "#FFFFFF" : colors.textSecondary }]}>1g of protein per lb of your goal weight to help keep muscle while losing fat</Text>
                  </TouchableOpacity>
                </View>

                {macroMode === "muscle_conservation" && (!goalWeight || parseFloat(goalWeight) === 0) && (
                  <View style={[styles.warningBox, { backgroundColor: "#FFF3CD", borderColor: "#FFE5A1" }]}>
                    <Text style={[styles.warningText, { color: "#856404" }]}>Please set a goal weight above to calculate muscle conservation macros</Text>
                  </View>
                )}

                {macroMode === "muscle_conservation" && recommendedMacros.carbs === 0 && parseFloat(goalWeight) > 0 && (
                  <View style={[styles.warningBox, { backgroundColor: "#FFF3CD", borderColor: "#FFE5A1" }]}>
                    <Text style={[styles.warningText, { color: "#856404" }]}>Calories are too low for this macro setup. Consider raising calories or lowering protein.</Text>
                  </View>
                )}

                <View style={styles.macroDisplay}>
                  <View style={styles.macroDisplayRow}>
                    <Text style={[styles.macroDisplayLabel, { color: colors.textSecondary }]}>Protein:</Text>
                    <Text style={[styles.macroDisplayValue, { color: colors.text }]}>{recommendedMacros.protein}g</Text>
                  </View>
                  <View style={styles.macroDisplayRow}>
                    <Text style={[styles.macroDisplayLabel, { color: colors.textSecondary }]}>Carbs:</Text>
                    <Text style={[styles.macroDisplayValue, { color: colors.text }]}>{recommendedMacros.carbs}g</Text>
                  </View>
                  <View style={styles.macroDisplayRow}>
                    <Text style={[styles.macroDisplayLabel, { color: colors.textSecondary }]}>Fats:</Text>
                    <Text style={[styles.macroDisplayValue, { color: colors.text }]}>{recommendedMacros.fat}g</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: "transparent", marginBottom: 0 }]}>
              <View style={styles.cardHeader}>
                <Droplets color={colors.water} size={24} />
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: 16 }]}>Water Goal</Text>
              </View>
              
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Text style={[styles.formLabel, { color: colors.text, marginBottom: 4 }]}>Auto Water Goal</Text>
                  <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    {useAutoWaterGoal 
                      ? `Based on your weight (${stats.currentWeight || 150} lbs = ${calculatedWaterGoal} oz)`
                      : "Set a custom daily water target"}
                  </Text>
                </View>
                <Switch
                  value={useAutoWaterGoal}
                  onValueChange={setUseAutoWaterGoal}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Water Goal (oz)</Text>
                <TextInput
                  style={[
                    styles.formInput, 
                    { 
                      backgroundColor: useAutoWaterGoal ? colors.borderLight : colors.surface, 
                      color: useAutoWaterGoal ? colors.textTertiary : colors.text, 
                      borderColor: colors.border 
                    }
                  ]}
                  placeholderTextColor={colors.textTertiary}
                  value={water}
                  onChangeText={setWater}
                  keyboardType="numeric"
                  placeholder="64"
                  editable={!useAutoWaterGoal}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Save color="#FFFFFF" size={20} />
              <Text style={styles.saveButtonText}>Save Goals</Text>
            </TouchableOpacity>
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
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  themeOptionDesc: {
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: "row" as const,
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
  sexOptions: {
    flexDirection: "row" as const,
    gap: 12,
  },
  sexOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  sexOptionText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  readOnlyInput: {
    justifyContent: "center",
  },
  readOnlyText: {
    fontSize: 15,
  },
  activityOptions: {
    gap: 10,
  },
  activityOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityOptionText: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  activityOptionDesc: {
    fontSize: 12,
  },
  heightInputs: {
    flexDirection: "row" as const,
    gap: 12,
  },
  heightInputContainer: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 8,
  },
  heightInput: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  heightInputLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  formHelperText: {
    fontSize: 12,
    marginBottom: 6,
  },
  goalTypeOptions: {
    flexDirection: "row" as const,
    gap: 12,
  },
  goalTypeOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  goalTypeText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  macroSettingsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  macroSettingsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  macroSettingsDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  macroModeOptions: {
    gap: 12,
    marginBottom: 16,
  },
  macroModeOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  macroModeTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  macroModeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  macroDisplay: {
    gap: 10,
  },
  macroDisplayRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroDisplayLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  macroDisplayValue: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
