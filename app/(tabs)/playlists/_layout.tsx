import { StackScreenWithSearchBar } from "@/constants/layouts";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

const PlaylistsScreenLayout = () => {
  return (
    <View className="flex-1 bg-[#000]">
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            ...(StackScreenWithSearchBar ?? {}),
            headerTitle: "Playlists",
            headerTitleAlign: "center",
          }}
        />
        <Stack.Screen
          name="[name]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="create"
          options={{
            ...(StackScreenWithSearchBar ?? {}),
            headerTitle: "Create New Playlist",
            // headerStyle:{s},
            headerTitleStyle: {
              color: "#fff",
              fontSize: 22,
            },
            headerTitleAlign: "center",
          }}
        />
      </Stack>
    </View>
  );
};

export default PlaylistsScreenLayout;
