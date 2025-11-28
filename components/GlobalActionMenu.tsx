import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Animated,
  PanResponder,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  Camera,
  Scale,
  CalendarDays,
  User,
  Home,
  History,
  Settings,
  Bookmark,
} from "lucide-react-native";
import colors from "@/constants/colors";

const menuTheme = {
  base: "#030712",
  elevated: "#050C1A",
  card: "#0F172A",
  icon: "#17233D",
  border: "rgba(148, 163, 184, 0.18)",
  handle: "rgba(148, 163, 184, 0.55)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
};

const bottomInsetPadding = Platform.OS === "ios" ? 36 : 26;
const openEasing = Easing.bezier(0.16, 0.84, 0.38, 1);


export interface ActionTile {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface GlobalActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (destination: string) => void;
}

export default function GlobalActionMenu({
  visible,
  onClose,
  onNavigate,
}: GlobalActionMenuProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const closeWithAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 220,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setModalVisible(false);
        onClose();
        requestAnimationFrame(() => {
          panY.setValue(0);
          slideAnim.setValue(600);
          fadeAnim.setValue(0);
        });
      }
    });
  }, [slideAnim, fadeAnim, panY, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(panY, {
              toValue: 600,
              duration: 220,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]).start(({ finished }) => {
            if (finished) {
              setModalVisible(false);
              onClose();
              requestAnimationFrame(() => {
                panY.setValue(0);
                slideAnim.setValue(600);
                fadeAnim.setValue(0);
              });
            }
          });
        } else {
          Animated.timing(panY, {
            toValue: 0,
            duration: 180,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && !modalVisible) {
      panY.setValue(0);
      slideAnim.setValue(600);
      fadeAnim.setValue(0);
      setModalVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 260,
              easing: openEasing,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 220,
              easing: openEasing,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    } else if (!visible && modalVisible) {
      closeWithAnimation();
    }
  }, [visible, modalVisible, slideAnim, fadeAnim, panY, closeWithAnimation]);

  const tiles: ActionTile[] = [
    {
      id: "home",
      title: "Home",
      subtitle: "Back to home screen",
      icon: <Home size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("home");
      },
    },
    {
      id: "log-food",
      title: "Log Food",
      subtitle: "Photo, describe, scan, or manual entry",
      icon: <Camera size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("add");
      },
    },
    {
      id: "saved-foods",
      title: "Saved Foods",
      subtitle: "Quick add from your favorites",
      icon: <Bookmark size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("saved-foods");
      },
    },
    {
      id: "weight",
      title: "Weight Tracking",
      subtitle: "Track your weight",
      icon: <Scale size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("weight");
      },
    },
    {
      id: "history",
      title: "History",
      subtitle: "View past entries",
      icon: <History size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("history");
      },
    },
    {
      id: "calendar",
      title: "Calendar",
      subtitle: "View past days",
      icon: <CalendarDays size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("calendar");
      },
    },
    {
      id: "profile",
      title: "Profile & Goals",
      subtitle: "Edit goals & info",
      icon: <User size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("profile");
      },
    },
    {
      id: "settings",
      title: "Settings",
      subtitle: "App preferences & data",
      icon: <Settings size={24} color={colors.primary} />,
      onPress: () => {
        onNavigate("settings");
      },
    },
  ];

  const handleBackdropPress = useCallback(() => {
    closeWithAnimation();
  }, [closeWithAnimation]);

  const renderTile = useCallback((tile: ActionTile) => {
    return (
      <Pressable
        key={tile.id}
        style={({ pressed }) => [
          styles.tile,
          pressed && styles.tilePressed,
        ]}
        onPress={tile.onPress}
        accessibilityRole="button"
        accessibilityLabel={`${tile.title}. ${tile.subtitle}`}
        testID={`global-action-menu-tile-${tile.id}`}
      >
        <View style={styles.tileIconContainer}>{tile.icon}</View>
        <View style={styles.tileTextContainer}>
          <Text style={styles.tileTitle}>{tile.title}</Text>
          <Text style={styles.tileSubtitle} numberOfLines={2}>
            {tile.subtitle}
          </Text>
        </View>
      </Pressable>
    );
  }, []);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={closeWithAnimation}
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.backdrop, { opacity: fadeAnim }]}
        pointerEvents={modalVisible ? "auto" : "none"}
        testID="global-action-menu-backdrop"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark">
            <View style={styles.backdropOverlay} />
          </BlurView>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.menuContainer,
          { 
            transform: [
              { translateY: Animated.add(slideAnim, panY) }
            ] 
          },
        ]}
        pointerEvents="box-none"
        testID="global-action-menu"
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.menuContent}>
            <View 
              style={styles.menuHeader}
              {...panResponder.panHandlers}
            >
              <View style={styles.handle} />
              <Text style={styles.menuTitle}>Quick Actions</Text>
            </View>

            <View style={styles.tilesSection} testID="global-action-menu-grid">
              <View style={styles.tilesContainer}>
                <View style={styles.tilesGrid}>
                  {tiles.map((tile) => renderTile(tile))}
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.85)",
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.4)",
  },
  menuContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "80%",
    backgroundColor: menuTheme.base,
  },
  menuContent: {
    backgroundColor: menuTheme.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: bottomInsetPadding,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    borderTopWidth: 1,
    borderColor: menuTheme.border,
  },
  menuHeader: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: menuTheme.border,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: menuTheme.handle,
    borderRadius: 999,
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: menuTheme.textPrimary,
  },
  tilesSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  tilesContainer: {
    borderRadius: 22,
    backgroundColor: menuTheme.base,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: menuTheme.border,
  },
  tilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 12,
    justifyContent: "space-between",
  },
  tile: {
    width: "47%",
    backgroundColor: menuTheme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: menuTheme.border,
    minHeight: 112,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tilePressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "#0B1220",
  },
  tileIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: menuTheme.icon,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileTextContainer: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: menuTheme.textPrimary,
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 12,
    color: menuTheme.textSecondary,
    lineHeight: 17,
  },
});
