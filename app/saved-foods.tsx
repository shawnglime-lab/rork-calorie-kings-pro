import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Search, Plus, Trash2, ChevronRight, X, Bookmark, Clock, Save } from "lucide-react-native";
import { useSavedFoods, SavedFoodItem } from "@/contexts/SavedFoodsContext";
import { useCalorieTracker } from "@/contexts/CalorieContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function SavedFoodsScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { 
    savedFoods, 
    recentFoods, 
    searchQuery, 
    setSearchQuery, 
    removeSavedFood, 
    deleteFromRecent,
    saveFood,
    markAsUsed, 
    getFoodItem 
  } = useSavedFoods();
  const { addFood } = useCalorieTracker();
  const [activeTab, setActiveTab] = useState<"saved" | "recent">("saved");
  const [selectedFood, setSelectedFood] = useState<SavedFoodItem | null>(null);
  const [servingAmount, setServingAmount] = useState("1");

  const handleAddFood = (food: SavedFoodItem) => {
    setSelectedFood(food);
    setServingAmount("1");
  };

  const confirmAddFood = () => {
    if (!selectedFood) return;
    const amount = parseFloat(servingAmount);
    if (isNaN(amount) || amount <= 0) return;

    const foodItem = getFoodItem(selectedFood);
    foodItem.servingAmount = amount;
    
    // Adjust nutrition based on serving amount
    if (amount !== 1) {
      foodItem.calories = Math.round(foodItem.calories * amount);
      foodItem.protein = foodItem.protein * amount;
      foodItem.carbs = foodItem.carbs * amount;
      foodItem.fat = foodItem.fat * amount;
    }

    addFood(foodItem);
    
    if (activeTab === "saved") {
      markAsUsed(selectedFood.id);
    }
    
    setSelectedFood(null);
    router.push("/");
  };

  const handleSaveRecent = (food: SavedFoodItem, e: any) => {
    e.stopPropagation();
    // Convert SavedFoodItem to FoodItem structure expected by saveFood
    const foodItem = getFoodItem(food);
    saveFood(foodItem);
    // Optional: Switch to saved tab or show toast?
    // For now just save it.
  };

  const activeList = activeTab === "saved" ? savedFoods : recentFoods;
  
  // Filter list based on search
  const filteredList = activeList.filter(food => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        food.name.toLowerCase().includes(query) ||
        (food.brand && food.brand.toLowerCase().includes(query))
      );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Saved Foods",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "saved" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("saved")}
        >
          <Text style={[styles.tabText, { color: activeTab === "saved" ? colors.primary : colors.textSecondary }]}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "recent" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("recent")}
        >
          <Text style={[styles.tabText, { color: activeTab === "recent" ? colors.primary : colors.textSecondary }]}>Recently Added</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search color={colors.textSecondary} size={20} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={activeTab === "saved" ? "Search saved foods..." : "Search recent history..."}
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            {activeTab === "saved" ? (
                <Bookmark color={colors.textTertiary} size={64} />
            ) : (
                <Clock color={colors.textTertiary} size={64} />
            )}
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === "saved" ? "No Saved Foods" : "No Recent Foods"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === "saved" 
                ? "Foods you add will appear here for quick access" 
                : "Foods you add to your log will appear here automatically"}
            </Text>
            {activeTab === "saved" && (
              <TouchableOpacity
                style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/add")}
                activeOpacity={0.7}
              >
                <Plus color="#FFFFFF" size={20} />
                <Text style={styles.addFirstButtonText}>Add Your First Food</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.foodsList}>
            {filteredList.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={[styles.foodCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
                onPress={() => handleAddFood(food)}
                activeOpacity={0.7}
              >
                <View style={styles.foodHeader}>
                  <View style={styles.foodInfo}>
                    <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
                    {food.brand && (
                      <Text style={[styles.foodBrand, { color: colors.textSecondary }]}>{food.brand}</Text>
                    )}
                    <Text style={[styles.foodServing, { color: colors.textTertiary }]}>
                      {food.servingSize}
                    </Text>
                  </View>
                  <View style={styles.foodActions}>
                    {activeTab === "recent" && (
                         <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => handleSaveRecent(food, e)}
                            activeOpacity={0.7}
                          >
                            <Save color={colors.primary} size={20} />
                          </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (activeTab === "saved") {
                            removeSavedFood(food.id);
                        } else {
                            deleteFromRecent(food.id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Trash2 color={colors.error} size={18} />
                    </TouchableOpacity>
                    <ChevronRight color={colors.textSecondary} size={20} />
                  </View>
                </View>

                <View style={[styles.nutritionRow, { borderTopColor: colors.borderLight }]}>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: colors.primary }]}>{food.calories}</Text>
                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>cal</Text>
                  </View>
                  <View style={[styles.nutritionDivider, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: colors.text }]}>{food.protein}</Text>
                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>protein</Text>
                  </View>
                  <View style={[styles.nutritionDivider, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: colors.text }]}>{food.carbs}</Text>
                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>carbs</Text>
                  </View>
                  <View style={[styles.nutritionDivider, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, { color: colors.text }]}>{food.fat}</Text>
                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>fat</Text>
                  </View>
                </View>

                {food.usageCount > 0 && activeTab === "saved" && (
                  <View style={styles.usageInfo}>
                    <Text style={[styles.usageText, { color: colors.textTertiary }]}>
                      Used {food.usageCount} {food.usageCount === 1 ? 'time' : 'times'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedFood !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFood(null)}
      >
        {selectedFood && (
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Food</Text>
                <TouchableOpacity onPress={() => setSelectedFood(null)}>
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={[styles.foodDetailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.modalFoodName, { color: colors.text }]}>{selectedFood.name}</Text>
                  {selectedFood.brand && (
                    <Text style={[styles.modalFoodBrand, { color: colors.textSecondary }]}>{selectedFood.brand}</Text>
                  )}
                  <Text style={[styles.modalFoodServing, { color: colors.textTertiary }]}>
                    Per {selectedFood.servingSize}: {selectedFood.calories} cal
                  </Text>
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Servings</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholderTextColor={colors.textTertiary}
                    value={servingAmount}
                    onChangeText={setServingAmount}
                    keyboardType="decimal-pad"
                    placeholder="1"
                  />
                  <Text style={[styles.servingHint, { color: colors.textSecondary }]}>
                    {parseFloat(servingAmount) > 0 ? 
                      `${Math.round(selectedFood.calories * parseFloat(servingAmount))} calories total` : 
                      'Enter serving amount'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={confirmAddFood}
                  disabled={!servingAmount || parseFloat(servingAmount) <= 0}
                >
                  <Text style={styles.modalButtonText}>Add to Log</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  addFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
  },
  addFirstButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  foodsList: {
    gap: 12,
  },
  foodCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  foodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  foodBrand: {
    fontSize: 13,
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 12,
  },
  foodActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  nutritionRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nutritionItem: {
    flex: 1,
    alignItems: "center",
  },
  nutritionDivider: {
    width: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  nutritionLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  usageInfo: {
    marginTop: 8,
  },
  usageText: {
    fontSize: 11,
    fontStyle: "italic",
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
    fontSize: 24,
    fontWeight: "700",
  },
  modalBody: {
    gap: 20,
  },
  foodDetailCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalFoodName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalFoodBrand: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalFoodServing: {
    fontSize: 13,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  servingHint: {
    fontSize: 13,
    marginTop: 8,
  },
  modalButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
