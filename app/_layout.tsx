import LayoutScreen from "@/components/LayoutScreen";
import React from "react";
import { StatusBar } from "react-native";
import "../global.css";

export default function Layout() {
  return (
    <>
      <LayoutScreen />
      <StatusBar barStyle={"light-content"} />
    </>
  );
}
