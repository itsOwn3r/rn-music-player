import { StackScreenWithSearchBar } from "@/constants/layouts";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const SongInfoLayout = () => {
  return (
    <View className="flex-1 bg-[#000]">
      <Stack>
        <Stack.Screen
          name="[id]"
          options={{
            ...(StackScreenWithSearchBar ?? {}),
            headerShown: true,
            title: "Song Info",
            headerTitleAlign: "center",

            headerStyle: {
              backgroundColor: "#66000000",
            },
            headerLargeStyle: {
              backgroundColor: "#66000000",
            },
          }}
        />
      </Stack>
    </View>
  );
};

export default SongInfoLayout;
