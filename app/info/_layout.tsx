import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const SongInfoLayout = () => {
  return (
    <View className="flex-1 bg-[#000]">
      <Stack>
        <Stack.Screen name="[id]" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
};

export default SongInfoLayout;
