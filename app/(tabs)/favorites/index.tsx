import TracksList from "@/components/TracksList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import React from "react";
import { View } from "react-native";

const FavoritesScreen = () => {
  const files = usePlayerStore((s) => s.files);

  return (
    <View className="flex-1 bg-[#000]">
      <View className="pb-40 size-full">
        <TracksList tracks={files} />
      </View>
    </View>
  );
};

export default FavoritesScreen;
