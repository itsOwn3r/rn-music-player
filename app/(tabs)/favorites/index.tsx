import TracksList from "@/components/TracksList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React from "react";
import { View } from "react-native";

const FavoritesScreen = () => {
  const files = usePlayerStore((s) => s.files);
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View className="flex-1 bg-[#000]">
      <View className="pb-40 size-full">
        <TracksList
          tracks={files}
          contentContainerStyle={{
            paddingBottom: tabBarHeight,
          }}
        />
      </View>
    </View>
  );
};

export default FavoritesScreen;
