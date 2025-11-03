import { StackScreenWithSearchBar } from "@/constants/layouts";
import { Stack } from "expo-router";
import React from "react";

const ArtistsScreenLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...(StackScreenWithSearchBar || {}),
          headerTitle: "Artists",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen name="[name]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ArtistsScreenLayout;
