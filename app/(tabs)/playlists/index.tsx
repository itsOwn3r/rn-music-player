import { playlists } from "@/assets/data/playlists";
import PlaylistsList from "@/components/PlaylistsList";
import { Playlist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const PlaylistScreen = () => {
  const router = useRouter();

  const getPlaylists: Playlist[] = playlists;

  const [search, setSearch] = useState("");

  const filteredPlaylists = useMemo(() => {
    if (search.trim() === "") return getPlaylists;
    const lowerSearch = search.toLowerCase();
    return getPlaylists.filter(
      (t) =>
        t?.name?.toLowerCase().includes(lowerSearch) ||
        t?.description?.toLowerCase().includes(lowerSearch)
    );
  }, [getPlaylists, search]);

  const handlePlaylistPress = (playlistId: string) => {
    router.push({
      pathname: "/playlists/[name]",
      params: { name: playlistId },
    });
  };
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-[#000]"
      style={{ paddingBottom: insets.bottom + 140, elevation: 8 }}
    >
      <View className="absolute left-0 right-0 bg-neutral-900 px-4 pb-2 z-10">
        <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
          <TextInput
            className="text-white text-base flex-1 py-2"
            placeholder="Search in Playlists"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity
              className="pl-2 py-2"
              onPress={() => setSearch("")}
            >
              <Ionicons name="close" color="red" size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="pl-2 py-2">
              <Ionicons name="search" color="#fff" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <PlaylistsList
        playlists={filteredPlaylists}
        onPlaylistPress={handlePlaylistPress}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
};

export default PlaylistScreen;
