import TracksList from "@/components/TracksList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React from "react";
import { Text, View } from "react-native";

const FavoritesScreen = () => {
  const files = usePlayerStore((s) => s.files);

  const favorites = usePlayerStore((s) => s.favorites);

  const favoriteIds = favorites.map((item) => item.id);

  const favoriteSongs = files.filter((song) => favoriteIds.includes(song.id));

  const tabBarHeight = useBottomTabBarHeight();

  if (favoriteSongs.length === 0) {
    return (
      <View
        style={{ paddingBottom: tabBarHeight }}
        className="flex-1 items-center justify-center bg-black px-6"
      >
        <Ionicons name="heart-outline" size={92} color="#666" />
        <Text className="text-neutral-400 text-xl font-semibold mt-4">
          No favorites yet
        </Text>
        <Text className="text-neutral-500 text-base mt-2 text-center">
          Tap the <Ionicons name="heart" size={14} color="red" /> on any track
          to add it here.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#000]">
      <View className="pb-40 size-full">
        <TracksList
          tracks={favoriteSongs}
          contentContainerStyle={{
            paddingBottom: tabBarHeight,
          }}
        />
      </View>
    </View>
  );
};

export default FavoritesScreen;
