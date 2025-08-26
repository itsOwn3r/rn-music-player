import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function Layout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
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
