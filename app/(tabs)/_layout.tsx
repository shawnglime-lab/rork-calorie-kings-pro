import { Tabs, useRouter } from "expo-router";
import { Home, PlusCircle, History, User, Scale, CalendarDays, Settings, HelpCircle } from "lucide-react-native";
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import FloatingActionButton from "@/components/FloatingActionButton";
import GlobalActionMenu from "@/components/GlobalActionMenu";
import { useActionMenu } from "@/contexts/ActionMenuContext";

export default function TabLayout() {
  const { isMenuOpen, toggleMenu, closeMenu } = useActionMenu();
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;

  const handleNavigate = useCallback(
    (destination: string) => {
      closeMenu();

      switch (destination) {
        case "home":
          router.push("/");
          break;
        case "add":
          router.push("/add");
          break;
        case "add-photo":
          router.push("/add");
          break;
        case "add-describe":
          router.push("/add");
          break;
        case "add-barcode":
          router.push("/add");
          break;
        case "add-manual":
          router.push("/add");
          break;
        case "weight":
          router.push("/weight");
          break;
        case "weight-add":
          router.push("/weight");
          break;
        case "weight-photos":
          router.push("/weight");
          break;
        case "history":
          router.push("/history");
          break;
        case "calendar":
          router.push("/calendar");
          break;
        case "profile":
          router.push("/profile");
          break;
        case "settings":
          router.push("/settings");
          break;
        case "saved-foods":
          router.push("/saved-foods");
          break;
        case "guide":
          router.push("/guide");
          break;
        default:
          break;
      }
    },
    [router, closeMenu]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            display: "none",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add Food",
            tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="weight"
          options={{
            title: "Weight",
            tabBarIcon: ({ color, size }) => <Scale color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="guide"
          options={{
            title: "Guide",
            tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size} />,
          }}
        />
      </Tabs>

      <FloatingActionButton isOpen={isMenuOpen} onPress={toggleMenu} />
      <GlobalActionMenu
        visible={isMenuOpen}
        onClose={closeMenu}
        onNavigate={handleNavigate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
