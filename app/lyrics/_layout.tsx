import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const SongInfoLayout = () => {
  return (
    <View className="flex-1 bg-[#000]">
      <Stack>
        <Stack.Screen
          name="edit/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sync/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
};

export default SongInfoLayout;
