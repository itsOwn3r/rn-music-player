import PlayerBinder from "@/components/PlayerBinder";
import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function Layout() {
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
              animation: "slide_from_bottom", // smoother exit
            }}
          />
        </Stack>
        <StatusBar barStyle={"dark-content"} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
