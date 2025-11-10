import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const PlaylistsScreenLayout = () => {
  return (
    <View className="flex-1 bg-[#000]">
      <Stack>
        <Stack.Screen
          name="[name]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
};

export default PlaylistsScreenLayout;
