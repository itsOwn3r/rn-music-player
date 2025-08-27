import { StackScreenWithSearchBar } from "@/constants/layouts";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const FavoritesScreenLayout = () => {
  return (
    <View className="flex-1 bg-[#000]">
      <Stack>
        <Stack.Screen
          name="index"
          options={{ ...StackScreenWithSearchBar, headerTitle: "Favorites" }}
        />
      </Stack>
    </View>
  );
};

export default FavoritesScreenLayout;
