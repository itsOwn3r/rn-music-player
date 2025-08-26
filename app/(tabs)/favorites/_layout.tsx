import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const FavoritesScreenLayout = () => {
  return (
    <View className="flex-1 bg-[#000]">
      <Stack>
        <Stack.Screen name="index" options={{ headerTitle: "Favorites" }} />
      </Stack>
    </View>
  );
};

export default FavoritesScreenLayout;
