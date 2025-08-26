import LayoutScreen from "@/components/LayoutScreen";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

export default function Layout() {
  return (
    <SafeAreaView>
      <LayoutScreen />
      <StatusBar barStyle={"light-content"} />
    </SafeAreaView>
  );
}
