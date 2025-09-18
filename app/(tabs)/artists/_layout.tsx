import { StackScreenWithSearchBar } from "@/constants/layouts";
import { Stack } from "expo-router";
import React from "react";

const ArtistsScreenLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...(StackScreenWithSearchBar ?? {}),
          headerTitle: "Artists",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="[name]"
        options={({ route }: { route: { params?: { name?: string } } }) => ({
          ...(StackScreenWithSearchBar ?? {}),
          headerTitle: route?.params?.name ?? "Artist",
          headerTitleAlign: "center",
        })}
      />
    </Stack>
  );
};

export default ArtistsScreenLayout;
