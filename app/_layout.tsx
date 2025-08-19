import React from "react";
import { Text, View } from "react-native";
import "../global.css";

export default function Layout() {
  return (
    <View style={{ backgroundColor: "#000", flex: 1 }}>
      <Text style={{ backgroundColor: "#000", color: "#fff" }}>Layout</Text>
      <Text className="text-xl font-bold text-red-500">
        Welcome to Nativewind!
      </Text>
    </View>
  );
}
