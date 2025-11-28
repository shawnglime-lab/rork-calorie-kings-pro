import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenOrientation from "expo-screen-orientation";
import { Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { CalorieContext } from "@/contexts/CalorieContext";
import { WeightContext } from "@/contexts/WeightContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { FastingContext } from "@/contexts/FastingContext";
import { SettingsContext } from "@/contexts/SettingsContext";
import { ActionMenuContext } from "@/contexts/ActionMenuContext";
import { SavedFoodsContext } from "@/contexts/SavedFoodsContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        for (const key of keys) {
          try {
            const value = await AsyncStorage.getItem(key);
            if (value) {
              JSON.parse(value);
            }
          } catch (error) {
            console.error(`Corrupted data found for key ${key}, removing...`, error);
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error("Error checking AsyncStorage:", error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
        SplashScreen.hideAsync();
      }
    };
    initApp();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      console.log("Orientation lock not supported on web, skipping");
      return;
    }

    let isMounted = true;

    const lockOrientation = async () => {
      if (!isMounted) {
        return;
      }
      try {
        console.log("Locking orientation to portrait");
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch (error) {
        console.error("Failed to lock orientation", error);
      }
    };

    lockOrientation();

    const orientationListener = ScreenOrientation.addOrientationChangeListener((event) => {
      const currentOrientation = event.orientationInfo.orientation;
      if (
        currentOrientation !== ScreenOrientation.Orientation.PORTRAIT_UP &&
        currentOrientation !== ScreenOrientation.Orientation.PORTRAIT_DOWN
      ) {
        console.log("Re-locking orientation after change");
        lockOrientation();
      }
    });

    return () => {
      isMounted = false;
      ScreenOrientation.removeOrientationChangeListener(orientationListener);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext>
        <SettingsContext>
          <SavedFoodsContext>
            <CalorieContext>
              <WeightContext>
                <FastingContext>
                  <ActionMenuContext>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      {isReady ? (
                        <RootLayoutNav />
                      ) : (
                        <View style={styles.initialSplashContainer} testID="initial-header-splash">
                          <Image
                            source={{
                              uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0ge9n2w41sbvz03g1ce8k",
                            }}
                            style={styles.initialSplashLogo}
                            contentFit="contain"
                          />
                        </View>
                      )}
                    </GestureHandlerRootView>
                  </ActionMenuContext>
                </FastingContext>
              </WeightContext>
            </CalorieContext>
          </SavedFoodsContext>
        </SettingsContext>
      </ThemeContext>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  initialSplashContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  initialSplashLogo: {
    width: 320,
    height: 120,
  },
});
