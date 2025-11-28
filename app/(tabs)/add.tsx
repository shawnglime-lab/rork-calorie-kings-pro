import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, MessageSquare, Plus, X, Search, ImageIcon, Check, Trash2, Edit2, Package, Bookmark } from "lucide-react-native";
import { router } from "expo-router";
import { useCalorieTracker } from "@/contexts/CalorieContext";
import { FoodItem } from "@/types/food";
import { useTheme } from "@/contexts/ThemeContext";
import { useSavedFoods } from "@/contexts/SavedFoodsContext";

import { generateText } from "@rork-ai/toolkit-sdk";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

interface DetectedFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  grams: number;
  selected: boolean;
}

export default function AddScreen() {
  const { addFood, addFoods } = useCalorieTracker();
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const [modalType, setModalType] = useState<"ai" | "manual" | "nutrition" | "scanner" | "photo" | "saved" | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Food</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Choose how you want to log this meal</Text>
        </View>

        <View style={styles.optionsGrid}>
          <TouchableOpacity
            style={[styles.optionCardCompact, styles.optionCardPrimary, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
            onPress={() => setModalType("photo")}
            activeOpacity={0.8}
          >
            <View style={styles.optionIconPrimary}>
              <ImageIcon color="#FFFFFF" size={32} />
            </View>
            <View style={styles.optionContentPrimary}>
              <Text style={styles.optionTitlePrimary}>Photo Mode</Text>
              <Text style={styles.optionDescPrimary}>
                Snap your meal and let us estimate calories & macros
              </Text>
            </View>
            <View style={styles.recommendedPill}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCardCompact, styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => setModalType("ai")}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.primary }]}>
              <MessageSquare color="#FFFFFF" size={28} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>AI Assistant</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Describe your meal (even multiple items) and add them instantly</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCardCompact, styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => setModalType("scanner")}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.secondary }]}>
              <Camera color="#FFFFFF" size={28} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Barcode Scanner</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Scan packaged foods</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCardCompact, styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => setModalType("nutrition")}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.success }]}>
              <Package color="#FFFFFF" size={28} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Nutrition Label</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Scan nutrition facts label</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCardCompact, styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => setModalType("saved")}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.warning }]}>
              <Bookmark color="#FFFFFF" size={28} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Saved Foods</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Quick add from favorites</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCardCompact, styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.shadow, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setModalType("manual")}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.textTertiary }]}>
              <Plus color="#FFFFFF" size={28} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Quick Add</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Enter calories directly</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {modalType === "ai" && (
        <AIModal visible={modalType === "ai"} onClose={() => setModalType(null)} onAddFood={(food) => { addFood(food); router.replace("/(tabs)/index"); }} onAddFoods={(foods) => { addFoods(foods); router.replace("/(tabs)/index"); }} />
      )}
      {modalType === "scanner" && (
        <ScannerModal visible={modalType === "scanner"} onClose={() => setModalType(null)} onAddFood={(food) => { addFood(food); router.replace("/(tabs)/index"); }} />
      )}
      {modalType === "photo" && (
        <PhotoModal visible={modalType === "photo"} onClose={() => setModalType(null)} onAddFood={(food) => { addFood(food); router.replace("/(tabs)/index"); }} onAddFoods={(foods) => { addFoods(foods); router.replace("/(tabs)/index"); }} />
      )}
      {modalType === "manual" && (
        <QuickAddModal visible={modalType === "manual"} onClose={() => setModalType(null)} onAddFood={(food) => { addFood(food); router.replace("/(tabs)/index"); }} />
      )}
      {modalType === "nutrition" && (
        <NutritionLabelModal visible={modalType === "nutrition"} onClose={() => setModalType(null)} onAddFood={(food) => { addFood(food); router.replace("/(tabs)/index"); }} />
      )}
      {modalType === "saved" && (
        <SavedFoodsModal visible={modalType === "saved"} onClose={() => setModalType(null)} onAddFood={(food) => { addFood(food); router.replace("/(tabs)/index"); }} />
      )}
    </View>
  );
}

function AIModal({ visible, onClose, onAddFood, onAddFoods }: { visible: boolean; onClose: () => void; onAddFood: (food: FoodItem) => void; onAddFoods: (foods: FoodItem[]) => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string; id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedFoodItem[]>([]);
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = { role: "user", content: input, id: Math.random().toString() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setDetectedItems([]); // Clear previous items

    try {
      const systemPrompt = `You are a nutrition expert. When a user describes food (single or multiple items), analyze it.
1. First, provide a friendly, brief summary of the nutrition info in text.
2. Then, provide a STRICT JSON block at the very end with the detailed data for EACH item.

The JSON format must be:
\`\`\`json
{
  "items": [
    {
      "name": "Food Name",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "servingSize": "Amount"
    }
  ]
}
\`\`\`
Do not include any text after the JSON block. Be accurate with estimates.`;
      
      const conversationMessages = [
        ...messages
          .filter(m => m.role === "user" || m.role === "assistant")
          .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: input },
      ];
      
      const response = await generateText(systemPrompt + "\n\n" + conversationMessages.map(m => `${m.role}: ${m.content}`).join("\n"));

      let cleanResponse = response;
      let items: DetectedFoodItem[] = [];

      // Try to extract JSON block
      const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
      const match = response.match(jsonBlockRegex);

      if (match) {
        try {
          const json = JSON.parse(match[1]);
          if (json.items && Array.isArray(json.items)) {
             items = json.items.map((item: any) => ({
               name: item.name,
               calories: item.calories,
               protein: item.protein,
               carbs: item.carbs,
               fat: item.fat,
               servingSize: item.servingSize,
               grams: 100, // Default
               selected: true
             }));
          }
          cleanResponse = response.replace(match[0], "").trim();
        } catch (e) {
           console.error("JSON parse error", e);
        }
      } else {
        // Fallback: try to find just the JSON object
        const jsonRegex = /\{[\s\S]*"items"[\s\S]*\}/;
        const match2 = response.match(jsonRegex);
        if (match2) {
            try {
              const json = JSON.parse(match2[0]);
              if (json.items && Array.isArray(json.items)) {
                items = json.items.map((item: any) => ({
                  name: item.name,
                  calories: item.calories,
                  protein: item.protein,
                  carbs: item.carbs,
                  fat: item.fat,
                  servingSize: item.servingSize,
                  grams: 100,
                  selected: true
                }));
              }
              cleanResponse = response.replace(match2[0], "").trim();
            } catch (e) {
               console.error("JSON fallback parse error", e);
            }
        }
      }

      const aiMessage = { role: "assistant", content: cleanResponse, id: Math.random().toString() };
      setMessages(prev => [...prev, aiMessage]);

      if (items.length > 0) {
        setDetectedItems(items);
      }

    } catch (err) {
      console.error("AI Error", err);
      const errorMessage = { role: "system", content: "Sorry, I couldn't process that. Please try again.", id: Math.random().toString() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const { saveFood } = useSavedFoods();
  const [showSaveOption] = useState(false);

  const handleAddDetectedFoods = () => {
    if (detectedItems.length > 0) {
      const foodItems = detectedItems.map(item => ({
        id: Math.random().toString(36).substring(7),
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        servingSize: item.servingSize,
        servingAmount: 1,
        source: "ai" as const,
        confidence: 0.8,
        timestamp: Date.now(),
      }));
      
      onAddFoods(foodItems);
      
      if (showSaveOption) {
        foodItems.forEach(food => saveFood(food));
      }
      
      onClose();
      router.push("/");
    }
  };

  const totalCalories = detectedItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = detectedItems.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = detectedItems.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = detectedItems.reduce((sum, item) => sum + item.fat, 0);
  const names = detectedItems.map(i => i.name).join(", ");

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>AI Food Assistant</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.chatContainer} contentContainerStyle={[styles.chatContent, { paddingBottom: detectedItems.length > 0 ? 160 : 20 }]}>
          {messages.length === 0 && (
            <View style={styles.aiWelcome}>
              <MessageSquare color={colors.primary} size={48} />
              <Text style={[styles.aiWelcomeTitle, { color: colors.text }]}>Describe your food</Text>
              <Text style={[styles.aiWelcomeDesc, { color: colors.textSecondary }]}>
                Tell me what you ate (even multiple items!) and I&apos;ll calculate the nutrition info for you
              </Text>
            </View>
          )}
          {messages.map((m) => (
            <View key={m.id} style={m.role === "user" ? [styles.userMessage, { backgroundColor: colors.primary }] : m.role === "system" ? [styles.toolSuccess, { backgroundColor: colors.success }] : [styles.aiMessage, { backgroundColor: colors.card }]}>
              <Text style={m.role === "user" ? styles.userMessageText : m.role === "system" ? styles.toolSuccessText : [styles.aiMessageText, { color: colors.text }]}>
                {m.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        {detectedItems.length > 0 && (
          <View style={[styles.aiActionButtons, { paddingBottom: 10, backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={[styles.detectedFoodCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.detectedFoodTitle, { color: colors.text }]} numberOfLines={1}>
                {detectedItems.length > 1 ? "Combined Meal" : detectedItems[0].name}
              </Text>
              {detectedItems.length > 1 && (
                 <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }} numberOfLines={1}>
                   {names}
                 </Text>
              )}
              <View style={styles.detectedFoodNutrition}>
                <Text style={[styles.detectedFoodMacro, { color: colors.textSecondary }]}>{totalCalories} cal</Text>
                <Text style={[styles.detectedFoodMacro, { color: colors.textSecondary }]}>P: {totalProtein}g</Text>
                <Text style={[styles.detectedFoodMacro, { color: colors.textSecondary }]}>C: {totalCarbs}g</Text>
                <Text style={[styles.detectedFoodMacro, { color: colors.textSecondary }]}>F: {totalFat}g</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.aiAddButton, { backgroundColor: colors.primary }]} 
              onPress={handleAddDetectedFoods}
            >
              <Text style={styles.aiAddButtonText}>
                Add {detectedItems.length > 1 ? `All (${detectedItems.length})` : "to Log"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., 2 slices of pepperoni pizza and a coke"
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={handleSend} disabled={loading}>
            <Text style={styles.sendButtonText}>{loading ? "..." : "Send"}</Text>
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ScannerModal({ visible, onClose, onAddFood }: { visible: boolean; onClose: () => void; onAddFood: (food: FoodItem) => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const insets = useSafeAreaInsets();

  const handleBarcodeScanned = async (barcode: string) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const openFoodFactsUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
      const response = await fetch(openFoodFactsUrl);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const productName = product.product_name || "Unknown Product";
        const brand = product.brands || "";
        const nutriments = product.nutriments || {};
        const nutritionPer = product.nutrition_data_per as string | undefined;

        // Try to use serving size from the label, like "355 ml", "2 slices (56 g)"
        let servingSize = product.serving_size as string | undefined;

        if (!servingSize || !servingSize.trim()) {
          // Fallback if OpenFoodFacts doesn't give a nice serving string
          servingSize = nutritionPer === "serving" ? "1 serving" : "100 g";
        }

        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;

        if (nutritionPer === "serving") {
          // Use per-serving values when nutrition is defined per serving
          calories = Math.round(
            nutriments["energy-kcal_serving"] ??
              nutriments.energy_kcal_serving ??
              nutriments.energy_kcal ??
              nutriments["energy-kcal"] ??
              0
          );
          protein = Math.round(
            (nutriments.proteins_serving ?? nutriments.proteins_100g ?? 0)
          );
          carbs = Math.round(
            (nutriments.carbohydrates_serving ??
              nutriments.carbohydrates_100g ??
              0)
          );
          fat = Math.round(
            (nutriments.fat_serving ?? nutriments.fat_100g ?? 0)
          );
        } else {
          // Default: values are per 100g / 100ml – scale based on serving on label
          let factor = 1;

          // Try to pull the number from servingSize, like "355 ml", "250ml", "40 g"
          const match = servingSize.match(/([\d.,]+)/);
          const numericAmount = match
            ? parseFloat(match[1].replace(",", "."))
            : NaN;

          if (!isNaN(numericAmount) && numericAmount > 0) {
            if (/ml/i.test(servingSize)) {
              // e.g. 355 ml can of soda => 355 / 100
              factor = numericAmount / 100;
            } else if (/\bg\b/i.test(servingSize)) {
              // e.g. 40 g serving => 40 / 100
              factor = numericAmount / 100;
            }
          }

          const baseCalories =
            nutriments.energy_kcal_100g ??
            nutriments["energy-kcal_100g"] ??
            nutriments.energy_kcal ??
            nutriments["energy-kcal"] ??
            0;

          calories = Math.round(baseCalories * factor);
          protein = Math.round((nutriments.proteins_100g ?? 0) * factor);
          carbs = Math.round(
            (nutriments.carbohydrates_100g ?? 0) * factor
          );
          fat = Math.round((nutriments.fat_100g ?? 0) * factor);
        }

        if (calories > 0) {
          onAddFood({
            id: Math.random().toString(36).substring(7),
            name: brand ? `${brand} ${productName}` : productName,
            calories,
            protein,
            carbs,
            fat,
            servingSize,
            servingAmount: 1,
            source: "barcode",
            barcode: barcode,
            timestamp: Date.now(),
          });
          onClose();
          router.push("/");
          return;
        }
      }

      console.log("Product not found in Open Food Facts, trying AI");
      const aiResponse = await generateText(`Look up nutrition information for barcode: ${barcode}. If you have exact data, provide it. If not, return "NOT FOUND". Format your response as:\n\nProduct: [name]\nBrand: [brand or N/A]\nCalories: [number]\nProtein: [number]g\nCarbs: [number]g\nFat: [number]g\nServing: [serving description]\n\nOr if not found, just say "NOT FOUND"`);

      if (aiResponse.includes("NOT FOUND")) {
        setShowManualEntry(true);
      } else {
        const productMatch = aiResponse.match(/Product:\s*(.+)/i);
        const brandMatch = aiResponse.match(/Brand:\s*(.+)/i);
        const caloriesMatch = aiResponse.match(/Calories:\s*(\d+)/i);
        const proteinMatch = aiResponse.match(/Protein:\s*(\d+)/i);
        const carbsMatch = aiResponse.match(/Carbs:\s*(\d+)/i);
        const fatMatch = aiResponse.match(/Fat:\s*(\d+)/i);
        const servingMatch = aiResponse.match(/Serving:\s*(.+)/i);

        if (productMatch && caloriesMatch) {
          const brand = brandMatch && brandMatch[1].trim() !== "N/A" ? brandMatch[1].trim() : "";
          const productName = productMatch[1].trim();

          onAddFood({
            id: Math.random().toString(36).substring(7),
            name: brand ? `${brand} ${productName}` : productName,
            calories: parseInt(caloriesMatch[1]),
            protein: proteinMatch ? parseInt(proteinMatch[1]) : 0,
            carbs: carbsMatch ? parseInt(carbsMatch[1]) : 0,
            fat: fatMatch ? parseInt(fatMatch[1]) : 0,
            servingSize: servingMatch ? servingMatch[1].trim() : "1 serving",
            servingAmount: 1,
            source: "barcode",
            barcode: barcode,
            timestamp: Date.now(),
          });
          onClose();
          router.push("/");
        } else {
          setShowManualEntry(true);
        }
      }
    } catch (error) {
      console.error("Barcode scan error:", error);
      setShowManualEntry(true);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Camera Permission</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.comingSoon}>
            <Camera color={colors.textTertiary} size={64} />
            <Text style={[styles.comingSoonTitle, { color: colors.text }]}>Camera Access Required</Text>
            <Text style={[styles.comingSoonDesc, { color: colors.textSecondary }]}>
              We need camera permission to scan barcodes.
            </Text>
            <TouchableOpacity style={[styles.permissionButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (showManualEntry) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Item Not Found</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.notFoundContainer}>
            <Text style={styles.notFoundTitle}>Barcode not in database</Text>
            <Text style={styles.notFoundDesc}>
              We couldn&apos;t find this product. Try adding it manually using the Manual Entry option.
            </Text>
            <TouchableOpacity
              style={styles.tryAgainButton}
              onPress={() => {
                setShowManualEntry(false);
                setScanned(false);
              }}
            >
              <Text style={styles.tryAgainButtonText}>Scan Another Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tryAgainButton, { backgroundColor: colors.card, marginTop: 12, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => {
                setShowManualEntry(false);
                setScanned(false);
                onClose();
                router.push("/");
              }}
            >
              <Text style={[styles.tryAgainButtonText, { color: colors.text }]}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={(result) => {
            if (result.data) {
              handleBarcodeScanned(result.data);
            }
          }}
        >
          <View style={[styles.scannerOverlay, { paddingTop: insets.top }]}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity onPress={onClose} style={styles.scannerCloseButton}>
                <X color="#FFFFFF" size={28} />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerCenter}>
              <View style={styles.scannerFrame} />
              <Text style={styles.scannerText}>Point camera at barcode</Text>
            </View>

            <View style={[styles.scannerBottom, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={styles.manualBarcodeButton}
                onPress={() => setShowManualEntry(true)}
              >
                <Search color={colors.primary} size={20} />
                <Text style={styles.manualBarcodeText}>Enter Barcode Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Looking up product...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

function ReviewItem({ 
  item, 
  index, 
  onToggle, 
  onUpdateGrams, 
  onRemove 
}: { 
  item: DetectedFoodItem; 
  index: number; 
  onToggle: (index: number) => void; 
  onUpdateGrams: (index: number, grams: number) => void; 
  onRemove: (index: number) => void; 
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [editingGrams, setEditingGrams] = useState(false);
  const [gramsInput, setGramsInput] = useState(item.grams.toString());

  const handleSaveGrams = () => {
    const newGrams = parseFloat(gramsInput);
    if (!isNaN(newGrams) && newGrams > 0) {
      onUpdateGrams(index, newGrams);
    } else {
      setGramsInput(item.grams.toString());
    }
    setEditingGrams(false);
  };

  return (
    <View style={[styles.reviewItem, { backgroundColor: colors.card, borderColor: item.selected ? colors.primary : colors.borderLight, shadowColor: colors.shadow }]}>
      <TouchableOpacity 
        onPress={() => onToggle(index)} 
        style={styles.reviewItemCheckbox}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, { borderColor: colors.border }, item.selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          {item.selected && <Check color="#FFFFFF" size={16} />}
        </View>
      </TouchableOpacity>

      <View style={styles.reviewItemContent}>
        <View style={styles.reviewItemHeader}>
          <Text style={[styles.reviewItemName, { color: colors.text }]}>{item.name}</Text>
          <TouchableOpacity onPress={() => onRemove(index)} style={styles.reviewItemDelete}>
            <Trash2 color={colors.error} size={18} />
          </TouchableOpacity>
        </View>

        <View style={styles.reviewItemGrams}>
          {editingGrams ? (
            <View style={styles.gramsEditContainer}>
              <TextInput
                style={[styles.gramsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={gramsInput}
                onChangeText={setGramsInput}
                keyboardType="decimal-pad"
                autoFocus
                onSubmitEditing={handleSaveGrams}
                onBlur={handleSaveGrams}
              />
              <Text style={[styles.gramsUnit, { color: colors.textSecondary }]}>g</Text>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => setEditingGrams(true)} 
              style={styles.gramsDisplay}
              activeOpacity={0.7}
            >
              <Text style={[styles.gramsText, { color: colors.textSecondary }]}>
                {item.grams}g
              </Text>
              <Edit2 color={colors.textSecondary} size={14} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.reviewItemNutrition}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>{item.calories}</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>cal</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>{item.protein}g</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>{item.carbs}g</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.text }]}>{item.fat}g</Text>
            <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>fat</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function PhotoModal({ visible, onClose, onAddFood, onAddFoods }: { visible: boolean; onClose: () => void; onAddFood: (food: FoodItem) => void; onAddFoods: (foods: FoodItem[]) => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedFoodItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].base64);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    try {
      const prompt = `Analyze this food image and provide nutrition information for EACH food item visible. Format your response as a JSON array like this:

[
  {
    "name": "Grilled chicken breast",
    "grams": 120,
    "calories": 198,
    "protein": 36,
    "carbs": 0,
    "fat": 4
  },
  {
    "name": "White rice",
    "grams": 150,
    "calories": 195,
    "protein": 4,
    "carbs": 42,
    "fat": 1
  }
]

Return ONLY the JSON array, no additional text. Be as accurate as possible with portion estimates.`;
      
      const response = await generateText({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: `data:image/jpeg;base64,${base64}` },
            ],
          },
        ],
      });

      setResult(response);

      try {
        const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const items: DetectedFoodItem[] = parsed.map((item: {
            name: string;
            grams: number;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
          }) => ({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            servingSize: `${item.grams}g`,
            grams: item.grams,
            selected: true,
          }));
          
          if (items.length > 0) {
            setDetectedItems(items);
            setShowReview(true);
          } else {
            setResult("No food items detected. Please try again.");
          }
        } else {
          setResult("Could not parse analysis results. Please try again.");
        }
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setResult("Failed to parse analysis results. Please try again.");
      }
    } catch (error) {
      console.error("Photo analysis error:", error);
      setResult("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setResult("");
    setDetectedItems([]);
    setShowReview(false);
    setAnalyzing(false);
  };

  const handleAddSelected = () => {
    const selectedItems = detectedItems.filter(item => item.selected);
    const foodItems = selectedItems.map(item => ({
      id: Math.random().toString(36).substring(7),
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      servingSize: item.servingSize,
      servingAmount: 1,
      source: "ai" as const,
      confidence: 0.7,
      timestamp: Date.now(),
    }));
    onAddFoods(foodItems);
    handleReset();
    onClose();
    router.push("/");
  };

  const toggleItemSelection = (index: number) => {
    setDetectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItemGrams = (index: number, grams: number) => {
    setDetectedItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const caloriesPerGram = item.calories / item.grams;
      const proteinPerGram = item.protein / item.grams;
      const carbsPerGram = item.carbs / item.grams;
      const fatPerGram = item.fat / item.grams;
      return {
        ...item,
        grams,
        calories: Math.round(caloriesPerGram * grams),
        protein: Math.round(proteinPerGram * grams),
        carbs: Math.round(carbsPerGram * grams),
        fat: Math.round(fatPerGram * grams),
        servingSize: `${grams}g`,
      };
    }));
  };

  const removeItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

  if (showReview) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Review & Add</Text>
            <TouchableOpacity onPress={() => { handleReset(); onClose(); }} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.reviewContainer} contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={[styles.reviewSubtitle, { color: colors.textSecondary }]}>
              Select items to add to your log
            </Text>
            {detectedItems.map((item, index) => (
              <ReviewItem
                key={index}
                item={item}
                index={index}
                onToggle={toggleItemSelection}
                onUpdateGrams={updateItemGrams}
                onRemove={removeItem}
              />
            ))}
          </ScrollView>

          <View style={[styles.reviewFooter, { paddingBottom: insets.bottom + 20, backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.reviewCancelButton, { borderColor: colors.border, backgroundColor: colors.card }]} 
              onPress={() => { handleReset(); onClose(); }}
            >
              <Text style={[styles.reviewCancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.reviewAddButton, 
                { backgroundColor: detectedItems.some(item => item.selected) ? colors.primary : colors.borderLight }
              ]} 
              onPress={handleAddSelected}
              disabled={!detectedItems.some(item => item.selected)}
            >
              <Text style={styles.reviewAddText}>
                Add Selected ({detectedItems.filter(i => i.selected).length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Photo Analysis</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          {!imageUri ? (
            <View style={styles.photoPrompt}>
              <ImageIcon color={colors.textTertiary} size={64} />
              <Text style={[styles.photoPromptTitle, { color: colors.text }]}>Analyze Your Meal</Text>
              <Text style={[styles.photoPromptDesc, { color: colors.textSecondary }]}>
                Take a photo or choose from your gallery, and AI will estimate the nutrition info
              </Text>

              <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.primary }]} onPress={takePhoto}>
                <Camera color="#FFFFFF" size={20} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: colors.secondary, marginTop: 12 }]}
                onPress={pickImage}
              >
                <ImageIcon color="#FFFFFF" size={20} />
                <Text style={styles.photoButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoResult}>
              {analyzing ? (
                <View style={styles.analyzing}>
                  <Text style={[styles.analyzingText, { color: colors.text }]}>Analyzing your meal...</Text>
                </View>
              ) : result && !showReview ? (
                <View style={styles.resultContainer}>
                  <Text style={[styles.resultText, { color: colors.textSecondary }]}>{result}</Text>
                  <TouchableOpacity 
                    style={[styles.tryAgainButton, { backgroundColor: colors.primary, marginTop: 24 }]} 
                    onPress={handleReset}
                  >
                    <Text style={styles.tryAgainButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}


function NutritionLabelModal({ visible, onClose, onAddFood }: { visible: boolean; onClose: () => void; onAddFood: (food: FoodItem) => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [detectedFood, setDetectedFood] = useState<DetectedFoodItem | null>(null);
  const insets = useSafeAreaInsets();
  const { saveFood } = useSavedFoods();
  const [saveToFavorites, setSaveToFavorites] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].base64);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    try {
      const prompt = `Analyze this image of a nutrition facts label. Extract the nutrition information.
      If the food name is visible, use it. If not, suggest a generic name based on the label style or ingredients if visible, or just "Scanned Item".
      Format your response as a JSON object like this:
      {
        "name": "Product Name",
        "calories": 150,
        "protein": 10,
        "carbs": 20,
        "fat": 5,
        "servingSize": "1 cup (240ml)"
      }
      Return ONLY the JSON object.`;

      const response = await generateText({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: `data:image/jpeg;base64,${base64}` },
            ],
          },
        ],
      });

      setResult(response);

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setDetectedFood({
             name: parsed.name || "Scanned Item",
             calories: parsed.calories || 0,
             protein: parsed.protein || 0,
             carbs: parsed.carbs || 0,
             fat: parsed.fat || 0,
             servingSize: parsed.servingSize || "1 serving",
             grams: 100, // default
             selected: true
          });
        } else {
          setResult("Could not read nutrition label. Please try again.");
        }
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setResult("Failed to parse analysis results. Please try again.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setResult("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setResult("");
    setDetectedFood(null);
    setAnalyzing(false);
    setSaveToFavorites(false);
  };

  const handleAdd = () => {
    if (detectedFood) {
      const foodItem = {
        id: Math.random().toString(36).substring(7),
        name: detectedFood.name,
        calories: detectedFood.calories,
        protein: detectedFood.protein,
        carbs: detectedFood.carbs,
        fat: detectedFood.fat,
        servingSize: detectedFood.servingSize,
        servingAmount: 1,
        source: "ai" as const,
        confidence: 0.9,
        timestamp: Date.now(),
      };
      
      onAddFood(foodItem);
      
      if (saveToFavorites) {
        saveFood(foodItem);
      }
      
      handleReset();
      onClose();
      router.push("/");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Scan Nutrition Label</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          {!imageUri ? (
            <View style={styles.photoPrompt}>
              <Package color={colors.textTertiary} size={64} />
              <Text style={[styles.photoPromptTitle, { color: colors.text }]}>Scan Nutrition Facts</Text>
              <Text style={[styles.photoPromptDesc, { color: colors.textSecondary }]}>
                Take a clear photo of the nutrition facts label to automatically import data
              </Text>

              <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.primary }]} onPress={takePhoto}>
                <Camera color="#FFFFFF" size={20} />
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoButton, { backgroundColor: colors.secondary, marginTop: 12 }]}
                onPress={pickImage}
              >
                <ImageIcon color="#FFFFFF" size={20} />
                <Text style={styles.photoButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoResult}>
              {analyzing ? (
                <View style={styles.analyzing}>
                  <Text style={[styles.analyzingText, { color: colors.text }]}>Reading label...</Text>
                </View>
              ) : detectedFood ? (
                <View style={styles.resultContainer}>
                  <View style={[styles.detectedFoodCard, { backgroundColor: colors.card, marginBottom: 20 }]}>
                     <View style={styles.formGroup}>
                        <Text style={[styles.formLabel, { color: colors.text }]}>Food Name</Text>
                        <TextInput
                            style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={detectedFood.name}
                            onChangeText={(text) => setDetectedFood({...detectedFood, name: text})}
                        />
                     </View>

                     <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>Calories</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                value={detectedFood.calories.toString()}
                                keyboardType="numeric"
                                onChangeText={(text) => setDetectedFood({...detectedFood, calories: parseInt(text) || 0})}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>Serv. Size</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                value={detectedFood.servingSize}
                                onChangeText={(text) => setDetectedFood({...detectedFood, servingSize: text})}
                            />
                        </View>
                     </View>

                     <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>Protein</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                value={detectedFood.protein.toString()}
                                keyboardType="numeric"
                                onChangeText={(text) => setDetectedFood({...detectedFood, protein: parseInt(text) || 0})}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>Carbs</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                value={detectedFood.carbs.toString()}
                                keyboardType="numeric"
                                onChangeText={(text) => setDetectedFood({...detectedFood, carbs: parseInt(text) || 0})}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.formLabel, { color: colors.text }]}>Fat</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                value={detectedFood.fat.toString()}
                                keyboardType="numeric"
                                onChangeText={(text) => setDetectedFood({...detectedFood, fat: parseInt(text) || 0})}
                            />
                        </View>
                     </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} 
                    onPress={() => setSaveToFavorites(!saveToFavorites)}
                  >
                    <View style={[styles.checkbox, { borderColor: colors.primary, marginRight: 10 }, saveToFavorites && { backgroundColor: colors.primary }]}>
                        {saveToFavorites && <Check color="#FFFFFF" size={16} />}
                    </View>
                    <Text style={{ color: colors.text, fontSize: 16 }}>Save to saved foods</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.aiAddButton, { backgroundColor: colors.primary }]} 
                    onPress={handleAdd}
                  >
                    <Text style={styles.aiAddButtonText}>Add Food</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.tryAgainButton, { backgroundColor: colors.card, marginTop: 12, borderWidth: 1, borderColor: colors.border }]} 
                    onPress={handleReset}
                  >
                    <Text style={[styles.tryAgainButtonText, { color: colors.text }]}>Scan Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.resultContainer}>
                  <Text style={[styles.resultText, { color: colors.error }]}>{result}</Text>
                  <TouchableOpacity 
                    style={[styles.tryAgainButton, { backgroundColor: colors.primary, marginTop: 24 }]} 
                    onPress={handleReset}
                  >
                    <Text style={styles.tryAgainButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SavedFoodsModal({ visible, onClose, onAddFood }: { visible: boolean; onClose: () => void; onAddFood: (food: FoodItem) => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { savedFoods, searchQuery, setSearchQuery, markAsUsed, getFoodItem } = useSavedFoods();
  const insets = useSafeAreaInsets();

  const handleSelect = (savedItem: any) => {
    const foodItem = getFoodItem(savedItem);
    onAddFood(foodItem);
    markAsUsed(savedItem.id);
    onClose();
    router.push("/");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Saved Foods</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, paddingBottom: 10 }}>
           <View style={[styles.inputContainer, { borderTopWidth: 0, padding: 0, marginBottom: 10 }]}>
            <View style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderColor: colors.border }]}>
               <Search color={colors.textTertiary} size={20} />
               <TextInput
                 style={{ flex: 1, color: colors.text, fontSize: 16, padding: 0 }}
                 placeholder="Search saved foods..."
                 placeholderTextColor={colors.textTertiary}
                 value={searchQuery}
                 onChangeText={setSearchQuery}
               />
               {searchQuery.length > 0 && (
                 <TouchableOpacity onPress={() => setSearchQuery("")}>
                   <X color={colors.textTertiary} size={16} />
                 </TouchableOpacity>
               )}
            </View>
           </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
           {savedFoods.length === 0 ? (
             <View style={styles.comingSoon}>
               <Bookmark color={colors.textTertiary} size={64} />
               <Text style={[styles.comingSoonTitle, { color: colors.text }]}>No Saved Foods</Text>
               <Text style={[styles.comingSoonDesc, { color: colors.textSecondary }]}>
                 Foods you save will appear here for quick access.
               </Text>
             </View>
           ) : (
             savedFoods.map((item) => (
               <TouchableOpacity
                 key={item.id}
                 style={[styles.optionCard, { backgroundColor: colors.card, marginBottom: 12, padding: 16, shadowColor: colors.shadow }]}
                 onPress={() => handleSelect(item)}
               >
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flex: 1 }}>
                     <Text style={[styles.optionTitle, { fontSize: 16, marginBottom: 4, color: colors.text }]}>{item.name}</Text>
                     <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                       {item.calories} cal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                     </Text>
                   </View>
                   <Plus color={colors.primary} size={24} />
                 </View>
               </TouchableOpacity>
             ))
           )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function QuickAddModal({ visible, onClose, onAddFood }: { visible: boolean; onClose: () => void; onAddFood: (food: FoodItem) => void }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [name, setName] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [servingSize, setServingSize] = useState<string>("");
  const [showMacroEditor, setShowMacroEditor] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { saveFood } = useSavedFoods();
  const [saveToFavorites, setSaveToFavorites] = useState<boolean>(false);

  const toNumber = (value: string) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const proteinValue = toNumber(protein);
  const carbsValue = toNumber(carbs);
  const fatValue = toNumber(fat);
  const showMacroInputs = showMacroEditor || protein.trim().length > 0 || carbs.trim().length > 0 || fat.trim().length > 0;

  const handleAdd = () => {
    if (!calories) return;

    const foodItem = {
      id: Math.random().toString(36).substring(7),
      name: name.trim() || "Quick Add",
      calories: toNumber(calories),
      protein: proteinValue,
      carbs: carbsValue,
      fat: fatValue,
      servingSize: servingSize || "1 serving",
      servingAmount: 1,
      source: "user" as const,
      timestamp: Date.now(),
    };

    onAddFood(foodItem);
    
    if (saveToFavorites) {
      saveFood(foodItem);
    }

    onClose();
    router.push("/");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Quick Add</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Calories *</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              autoFocus
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Food Name (Optional)</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., Quick Add"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            testID="quick-add-macros-card"
          >
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrition split (optional)</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Track macros along with calories</Text>
              </View>
              <TouchableOpacity
                style={[styles.sectionActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowMacroEditor((prev) => !prev)}
                activeOpacity={0.7}
                testID="quick-add-toggle-macros"
              >
                <Text style={[styles.sectionActionText, { color: colors.text }]}>{showMacroInputs ? "Hide" : "Adjust"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.macrosSummaryRow}>
              {[
                { key: "protein", label: "Protein", value: `${proteinValue}g` },
                { key: "carbs", label: "Carbs", value: `${carbsValue}g` },
                { key: "fat", label: "Fat", value: `${fatValue}g` },
              ].map((macro) => (
                <View
                  key={macro.key}
                  style={[styles.macrosChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.macrosChipLabel, { color: colors.textSecondary }]}>{macro.label}</Text>
                  <Text style={[styles.macrosChipValue, { color: colors.text }]}>{macro.value}</Text>
                </View>
              ))}
            </View>

            {showMacroInputs && (
              <View style={styles.macrosInputRow}>
                <View style={styles.macrosInputGroup}>
                  <Text style={[styles.macrosInputLabel, { color: colors.text }]}>Protein (g)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                    testID="quick-add-protein-input"
                  />
                </View>
                <View style={styles.macrosInputGroup}>
                  <Text style={[styles.macrosInputLabel, { color: colors.text }]}>Carbs (g)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                    testID="quick-add-carbs-input"
                  />
                </View>
                <View style={styles.macrosInputGroup}>
                  <Text style={[styles.macrosInputLabel, { color: colors.text }]}>Fat (g)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                    testID="quick-add-fat-input"
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Serving Size</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 1 cup, 100g"
              placeholderTextColor={colors.textTertiary}
              value={servingSize}
              onChangeText={setServingSize}
            />
          </View>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} 
            onPress={() => setSaveToFavorites(!saveToFavorites)}
          >
            <View style={[styles.checkbox, { borderColor: colors.primary, marginRight: 10 }, saveToFavorites && { backgroundColor: colors.primary }]}>
                {saveToFavorites && <Check color="#FFFFFF" size={16} />}
            </View>
            <Text style={{ color: colors.text, fontSize: 16 }}>Save to saved foods</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.primary, shadowColor: colors.shadow },
              !calories && styles.addButtonDisabled,
            ]}
            onPress={handleAdd}
            disabled={!calories}
            activeOpacity={0.8}
            testID="quick-add-submit"
          >
            <Text style={styles.addButtonText}>Add Food</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  optionsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    flexWrap: "wrap" as const,
    justifyContent: "space-between",
  },
  optionCard: {
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  optionCardCompact: {
    width: "48%",
    minHeight: 90,
    marginBottom: 10,
  },
  optionCardPrimary: {
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: "relative" as const,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionIconPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
  },
  optionContentPrimary: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  optionTitlePrimary: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  optionDescPrimary: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
  },
  recommendedPill: {
    position: "absolute" as const,
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recommendedText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  closeButton: {
    padding: 4,
  },
  comingSoon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    marginTop: 20,
    marginBottom: 12,
  },
  comingSoonDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scannerHeader: {
    padding: 20,
    alignItems: "flex-end",
  },
  scannerCloseButton: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  scannerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  scannerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
    marginTop: 24,
  },
  scannerBottom: {
    padding: 20,
  },
  manualBarcodeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
  },
  manualBarcodeText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  loadingOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: 24,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  notFoundDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  tryAgainButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  tryAgainButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    gap: 12,
  },
  aiWelcome: {
    alignItems: "center",
    paddingVertical: 60,
  },
  aiWelcomeTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  aiWelcomeDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  userMessage: {
    padding: 16,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  userMessageText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
  aiMessage: {
    padding: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  aiMessageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  toolSuccess: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  toolSuccessText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  aiActionButtons: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  detectedFoodCard: {
    padding: 16,
    borderRadius: 12,
  },
  detectedFoodTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  detectedFoodNutrition: {
    flexDirection: "row",
    gap: 12,
  },
  detectedFoodMacro: {
    fontSize: 14,
  },
  aiAddButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  aiAddButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
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
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  macrosSummaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  macrosChip: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  macrosChipLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  macrosChipValue: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  macrosInputRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  macrosInputGroup: {
    flex: 1,
  },
  macrosInputLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginBottom: 6,
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  photoPrompt: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  photoPromptTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    marginTop: 20,
    marginBottom: 12,
  },
  photoPromptDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  photoResult: {
    padding: 20,
  },
  analyzing: {
    alignItems: "center",
    paddingVertical: 60,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  resultContainer: {
    paddingVertical: 20,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 24,
  },
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  reviewSubtitle: {
    fontSize: 15,
    marginBottom: 20,
  },
  reviewItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewItemCheckbox: {
    position: "absolute" as const,
    top: 16,
    left: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewItemContent: {
    marginLeft: 36,
  },
  reviewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewItemName: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
    marginRight: 8,
  },
  reviewItemDelete: {
    padding: 4,
  },
  reviewItemGrams: {
    marginBottom: 12,
  },
  gramsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gramsText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  gramsEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gramsInput: {
    width: 80,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  gramsUnit: {
    fontSize: 14,
  },
  reviewItemNutrition: {
    flexDirection: "row",
    gap: 16,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  nutritionLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  reviewFooter: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  reviewCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  reviewCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  reviewAddButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  reviewAddText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
