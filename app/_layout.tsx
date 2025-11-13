import PlayerBinder from "@/components/PlayerBinder";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { I18nManager, StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initDB } from "@/tools/db";
import { setupPlayer } from "@/tools/services/trackPlayerService";
import { usePlayerStore, usePlaylistStore } from "@/tools/store/usePlayerStore";
import TrackPlayer from "react-native-track-player";
import { toast, Toaster } from "sonner-native";
import "../global.css";

import playbackService from "@/service";

TrackPlayer.registerPlaybackService(() => playbackService);

export default function Layout() {
  const loadLibrary = usePlayerStore((s) => s.loadLibrary);
  const loadFavorites = usePlaylistStore((s) => s.loadFavorites);

  useEffect(() => {
    async function initialize() {
      try {
        await initDB();
      } catch (error) {
        console.error("Error initializing database:", error);
        toast.error(`Error initializing database: ${error}`);
        // Handle the error appropriately (e.g., display an error message)
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      (async () => {
        await loadLibrary();
        await loadFavorites();
      })();
    });
  }, [loadFavorites, loadLibrary]);

  useEffect(() => {
    setupPlayer();

    return () => {
      TrackPlayer.reset();
    };
  }, []);

  if (I18nManager.isRTL) {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  }

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

          <Stack.Screen
            name="edit"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="album"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="notification.click"
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
