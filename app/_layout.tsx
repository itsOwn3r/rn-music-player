import { useSetupTrackPlayer } from "@/hooks/useSetupTrackPlayer";
import { SplashScreen, Stack } from "expo-router";
import React, { useCallback } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

// SplashScreen.preventAutoHideAsync();

export default function Layout() {
  console.log("Hellpo awsd aws");
  const handleTrackPlayerLoaded = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);
  useSetupTrackPlayer({ onLoad: handleTrackPlayerLoaded });
  console.log("Hellpo");
  return (
    <SafeAreaProvider>
      {/* <SafeAreaView style={{ flex: 1 }}> */}
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, headerTitleAlign: "center" }}
        />
      </Stack>
      <StatusBar barStyle={"default"} />
    </SafeAreaProvider>
  );
}
