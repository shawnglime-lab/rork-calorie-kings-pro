import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HelpCircle,
  Home,
  PlusCircle,
  Camera,
  MessageSquare,
  Barcode,
  Database,
  Edit3,
  Scale,
  CalendarDays,
  History,
  User,
  Utensils,
  Droplets,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  steps?: string[];
}

export default function GuideScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");

  const guideSections: GuideSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <HelpCircle size={24} color={colors.primary} />,
      content:
        "Welcome to your calorie tracking app! This guide will help you understand how to use all the features.",
      steps: [
        "Set up your profile and goals in the Profile tab",
        "Log your current weight in the Weight tab",
        "Start logging your meals using the + button",
        "Track your progress on the Home screen",
      ],
    },
    {
      id: "plus-button",
      title: "Quick Actions (+) Button",
      icon: <PlusCircle size={24} color={colors.primary} />,
      content:
        "The + button at the bottom center gives you quick access to all major features. Tap it to open the Quick Actions menu.",
      steps: [
        "Tap the + button to open the menu",
        "Select any action to navigate to that feature",
        "Tap outside the menu or tap + again to close it",
      ],
    },
    {
      id: "logging-food",
      title: "Logging Food",
      icon: <Utensils size={24} color={colors.primary} />,
      content:
        "There are multiple ways to log your food. Choose the method that works best for you.",
      steps: [
        "Photo Mode: Take a picture of your meal for AI analysis",
        "Describe Your Meal: Type what you ate in natural language",
        "Scan Barcode: Scan packaged food barcodes",
        "Manual Entry: Enter nutrition info manually",
      ],
    },
    {
      id: "photo-mode",
      title: "Photo Mode (AI Food Recognition)",
      icon: <Camera size={24} color={colors.primary} />,
      content:
        "Use your camera to instantly log meals. The AI will analyze the photo and estimate calories and macros.",
      steps: [
        "Tap 'Log Food' in the Quick Actions menu",
        "Select 'Photo Mode'",
        "Take a photo of your meal",
        "Review the AI-estimated nutrition info",
        "Adjust servings if needed",
        "Tap 'Log Food' to save",
      ],
    },
    {
      id: "describe-meal",
      title: "Describe Your Meal (AI Assistant)",
      icon: <MessageSquare size={24} color={colors.primary} />,
      content:
        "Type what you ate in natural language and let AI calculate the nutrition for you.",
      steps: [
        "Tap 'Log Food' in Quick Actions",
        "Select 'Describe Your Meal'",
        "Type your meal (e.g., 'grilled chicken breast with rice and broccoli')",
        "Send the message to the AI",
        "Review the estimated nutrition breakdown",
        "Extract and save the food items",
      ],
    },
    {
      id: "barcode-scan",
      title: "Barcode Scanner",
      icon: <Barcode size={24} color={colors.primary} />,
      content: "Scan barcodes on packaged foods for quick and accurate logging.",
      steps: [
        "Tap 'Log Food' in Quick Actions",
        "Select 'Scan Barcode'",
        "Point your camera at the barcode",
        "Wait for the scan to complete",
        "Review and confirm the nutrition info",
      ],
    },
    {
      id: "barcode-database",
      title: "Barcode Data Source",
      icon: <Database size={24} color={colors.primary} />,
      content:
        "Use GS1's Verified by GS1 registry and GDSN feeds for the world's largest, most accurate barcode repository—it's populated directly by the brands who own each GTIN.",
      steps: [
        "Join your local GS1 Member Organization to obtain credentials and a company prefix",
        "Request API access to Verified by GS1 to search global GTIN records with brand-authorized attributes",
        "Pull extended product data via GDSN or Data Hub, then cache results for your scanner",
        "Sync updates regularly so discontinued or corrected GTINs stay accurate",
      ],
    },
    {
      id: "manual-entry",
      title: "Manual Food Entry",
      icon: <Edit3 size={24} color={colors.primary} />,
      content:
        "Enter nutrition information manually when you know the exact values.",
      steps: [
        "Tap 'Log Food' in Quick Actions",
        "Select 'Manual Entry'",
        "Enter the food name",
        "Fill in calories, protein, carbs, and fat",
        "Set the serving size",
        "Tap 'Add Food' to save",
      ],
    },
    {
      id: "home-screen",
      title: "Home Screen Overview",
      icon: <Home size={24} color={colors.primary} />,
      content:
        "Your home screen shows your daily progress at a glance. The semi-circle progress bar displays your calorie intake.",
      steps: [
        "Semi-circle bar: Shows calories consumed vs. goal",
        "Bar fills from left to right as you eat",
        "Turns red if you exceed your calorie goal",
        "Macro breakdown: Shows protein, carbs, and fat",
        "Water tracker: Log water intake throughout the day",
        "Fasting timer: Start/stop intermittent fasting (if enabled)",
        "Step counter: View daily steps (if enabled)",
      ],
    },
    {
      id: "editing-servings",
      title: "Adjusting Servings",
      icon: <Edit3 size={24} color={colors.primary} />,
      content: "You can adjust the serving size of any logged food item.",
      steps: [
        "Go to the Home screen",
        "Scroll down to 'Today's Foods'",
        "Find the food item you want to adjust",
        "Tap the serving input field",
        "Enter the new serving amount",
        "The nutrition values will update automatically",
      ],
    },
    {
      id: "water-tracking",
      title: "Water Tracking",
      icon: <Droplets size={24} color={colors.primary} />,
      content: "Stay hydrated by tracking your daily water intake.",
      steps: [
        "Scroll to the Water section on the Home screen",
        "Tap one of the quick-add buttons (8oz, 16oz, 24oz)",
        "Or tap 'Custom' to enter a specific amount",
        "View your progress toward your daily water goal",
        "Tap the X on any entry to remove it",
      ],
    },
    {
      id: "weight-tracking",
      title: "Weight Tracking",
      icon: <Scale size={24} color={colors.primary} />,
      content: "Monitor your weight progress over time with entries and optional progress photos.",
      steps: [
        "Go to the Weight tab from Quick Actions",
        "Tap 'Add Weight Entry'",
        "Enter your current weight",
        "View your starting weight, current weight, and change",
        "Track trends with regular weigh-ins",
        "Add progress photos to visualize your journey (optional)",
        "Toggle progress photos visibility in Settings > Display",
        "Progress photos display side-by-side with no cropping needed",
      ],
    },
    {
      id: "fasting",
      title: "Intermittent Fasting",
      icon: <Activity size={24} color={colors.primary} />,
      content: "Track your fasting periods for intermittent fasting protocols.",
      steps: [
        "Enable fasting in Settings if not already enabled",
        "On the Home screen, find the Fasting Timer",
        "Tap 'Start Fast' when you begin fasting",
        "The timer will count up showing your fasting duration",
        "Tap 'End Fast' when you break your fast",
        "View your fasting history",
      ],
    },
    {
      id: "calendar",
      title: "Calendar View",
      icon: <CalendarDays size={24} color={colors.primary} />,
      content: "Review and edit your nutrition, fasting, and water data for any date. All your tracking metrics are in one place.",
      steps: [
        "Open Quick Actions and tap 'Calendar'",
        "Use the arrows to navigate between months",
        "Tap any date to select it and view details",
        "See colored dots on dates with logged data (calories, water, fasting)",
        "View calories, fasting time, and water for the selected date",
        "Tap any metric box to edit that day's values",
        "The calendar is locked to vertical orientation for better viewing",
      ],
    },
    {
      id: "history",
      title: "History & Trends",
      icon: <History size={24} color={colors.primary} />,
      content: "View your complete food logging history and trends.",
      steps: [
        "Open Quick Actions and tap 'History'",
        "Browse all your logged meals chronologically",
        "See which days you hit your goals",
        "Identify patterns in your eating habits",
      ],
    },
    {
      id: "profile",
      title: "Profile & Goals",
      icon: <User size={24} color={colors.primary} />,
      content:
        "Set your personal information and nutrition goals for accurate tracking.",
      steps: [
        "Open Quick Actions and tap 'Profile & Goals'",
        "Enter your sex, height, age, and weight",
        "Set your activity level",
        "Adjust your daily calorie and macro goals",
        "Tap 'Save Goals' to apply changes",
      ],
    },
    {
      id: "settings",
      title: "Settings & Display",
      icon: <User size={24} color={colors.primary} />,
      content:
        "Customize which features appear on your Home screen and manage your data.",
      steps: [
        "Open Quick Actions and tap 'Settings'",
        "Toggle Step Counter on/off to show or hide it on Home",
        "Toggle Fasting Timer on/off to show or hide it on Home",
        "Toggle Progress Photos on/off to show or hide them on Weight screen",
        "Access the User Guide from Help & Support section",
        "Clear all app data if needed (cannot be undone)",
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>User Guide</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Learn how to use every feature
          </Text>
        </View>

        <View style={styles.content}>
          {guideSections.map((section) => {
            const isExpanded = expandedSection === section.id;
            return (
              <View
                key={section.id}
                style={[
                  styles.sectionCard,
                  { backgroundColor: colors.card, shadowColor: colors.shadow },
                ]}
              >
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(section.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <View
                      style={[
                        styles.sectionIcon,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      {section.icon}
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {section.title}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.sectionContent}>
                    <Text
                      style={[styles.sectionDescription, { color: colors.textSecondary }]}
                    >
                      {section.content}
                    </Text>
                    {section.steps && section.steps.length > 0 && (
                      <View style={styles.stepsList}>
                        {section.steps.map((step, index) => (
                          <View key={index} style={styles.stepItem}>
                            <View
                              style={[
                                styles.stepNumber,
                                { backgroundColor: colors.primary },
                              ]}
                            >
                              <Text style={styles.stepNumberText}>
                                {index + 1}
                              </Text>
                            </View>
                            <Text style={[styles.stepText, { color: colors.text }]}>
                              {step}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <View
            style={[
              styles.footerCard,
              { backgroundColor: colors.card, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.footerTitle, { color: colors.text }]}>
              Need More Help?
            </Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              If you have questions or need assistance, feel free to explore the app
              and experiment with different features. All your data is saved locally on
              your device.
            </Text>
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
  sectionCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footerCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
