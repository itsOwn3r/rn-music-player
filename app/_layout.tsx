import PlayerBinder from "@/components/PlayerBinder";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initDB } from "@/tools/db";
import { usePlayerStore, usePlaylistStore } from "@/tools/store/usePlayerStore";
import { Toaster } from "sonner-native";
import "../global.css";

export default function Layout() {
  const { loadLibrary } = usePlayerStore();
  const loadFavorites = usePlaylistStore((s) => s.loadFavorites);

  useEffect(() => {
    initDB()
      .then(() => console.log("✅ Database ready"))
      .catch((err) => console.error("❌ DB init error:", err));
    (async () => {
      await loadLibrary();
      await loadFavorites();
    })();
  }, [loadFavorites, loadLibrary]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PlayerBinder />
        {/* <SafeAreaView style={{ flex: 1 }}> */}
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, headerTitleAlign: "center" }}
          />
          <Stack.Screen
            name="Playing"
            options={{
              presentation: "transparentModal",
              gestureEnabled: true,
              gestureDirection: "vertical",
              animationDuration: 100,
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="Queue"
            options={{
              presentation: "transparentModal",
              gestureEnabled: true,
              gestureDirection: "vertical",
              animationDuration: 100,
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="(modals)/addToPlaylist"
            options={{
              presentation: "transparentModal",
              gestureEnabled: true,
              gestureDirection: "vertical",
              animationDuration: 100,
              headerShown: false,
              animation: "slide_from_bottom", // smoother exit
            }}
          />

          <Stack.Screen
            name="info"
            options={{ headerShown: false, headerTitleAlign: "center" }}
          />

          <Stack.Screen
            name="lyrics"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <StatusBar barStyle={"dark-content"} />
        <Toaster position="top-center" richColors />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
