import React from "react";
import { Pressable, StyleSheet, Animated, View } from "react-native";
import { Plus, ChevronDown } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloatingActionButtonProps {
  isOpen: boolean;
  onPress: () => void;
}

export default function FloatingActionButton({
  isOpen,
  onPress,
}: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = theme.colors;
  const rotateValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(rotateValue, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? "Close menu" : "Open menu"}
        testID="floating-action-button"
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              styles.innerButton,
              pressed && styles.pressed,
              { transform: [{ rotate }] },
            ]}
          >
            {isOpen ? (
              <ChevronDown size={28} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Plus size={28} color="#FFFFFF" strokeWidth={3} />
            )}
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    backgroundColor: "transparent",
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  innerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
