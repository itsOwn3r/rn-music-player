import TracksList from "@/components/TracksList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Animated, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  currentSong: Song | null;
}

const MusicList = ({ currentSong }: Props) => {
  const files = usePlayerStore((s) => s.files);

  const [search, setSearch] = useState("");

  // Filtered tracks based on search
  const filteredTracks = useMemo(() => {
    if (search.trim() === "") return files;
    const lowerSearch = search.toLowerCase();
    return files.filter(
      (t) =>
        t.title?.toLowerCase().includes(lowerSearch) ||
        (t.artist && t.artist.toLowerCase().includes(lowerSearch))
    );
  }, [files, search]);

  // Animated value for header effects
  // const scrollY = useRef(new Animated.Value(0)).current;

  // Safe area insets
  const insets = useSafeAreaInsets();

  // Track scroll offset
  // const scrollOffset = useRef(0);

  // Store scroll offset on scroll
  // const handleScroll = Animated.event(
  //   [{ nativeEvent: { contentOffset: { y: scrollY } } }],
  //   {
  //     useNativeDriver: true,
  //     listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
  //       scrollOffset.current = event.nativeEvent.contentOffset.y;
  //     },
  //   }
  // );

  // Optimize Animated FlatList rendering
  // const AnimatedTracksList = Animated.createAnimatedComponent(TracksList);

  return (
    <View className="flex-1 bg-black">
      {/* Search Bar */}
      <Animated.View
        className="absolute left-0 right-0 bg-neutral-900 px-4 pb-2 z-10"
        style={{ paddingTop: insets.top, elevation: 8 }}
      >
        <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
          <TextInput
            className="text-white text-base flex-1 py-2"
            placeholder="Find in songs"
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
      </Animated.View>

      {/* Tracks List */}
      <TracksList
        tracks={filteredTracks} // ✅ full list OR filtered
        extraData={currentSong?.id} // ✅ force re-render only when playing song changes
        contentContainerStyle={{
          paddingTop: 72,
          paddingBottom: 128,
        }}
        scrollEventThrottle={16}
        // onScroll={handleScroll}
        removeClippedSubviews
        initialNumToRender={12}
        windowSize={11}
      />
    </View>
  );
};

export default MusicList;
