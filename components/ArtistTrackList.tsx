import { unknownTrackImageUri } from "@/constants/images";
import { Artist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useMemo, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QueueControls from "./QueueControls";
import TracksList from "./TracksList";

const ArtistTrackList = ({ artist }: { artist: Artist }) => {
  const [search, setSearch] = useState("");

  // Filtered tracks based on search
  const filteredSongs = useMemo(() => {
    if (search.trim() === "") return artist.songs;
    const lowerSearch = search.toLowerCase();
    return artist.songs.filter(
      (t) =>
        t?.title?.toLowerCase().includes(lowerSearch) ||
        t?.album?.toLowerCase().includes(lowerSearch)
    );
  }, [artist.songs, search]);

  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View className="flex-1">
      <View className="absolute left-0 right-0 bg-neutral-900 pb-2 z-10 w-full">
        <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
          <TextInput
            className="text-white text-base flex-1 py-2"
            placeholder={`Search in ${artist.name}'s songs`}
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
      <TracksList
        id={artist.name}
        tracks={filteredSongs}
        extraData={artist?.name}
        ListHeaderComponentStyle={styles.artistHeaderContainer}
        contentContainerStyle={{
          paddingTop: 72,
          paddingBottom: tabBarHeight + 90,
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.artworkImageContainer}>
              <Image
                source={{ uri: artist.image ?? unknownTrackImageUri }}
                style={styles.artistImage}
              />
            </View>
            <Text numberOfLines={1} style={styles.artistNameText}>
              {artist.name}
            </Text>

            {search.length === 0 && <QueueControls tracks={filteredSongs} />}
          </View>
        }
        scrollEventThrottle={16}
        // onScroll={handleScroll}
        removeClippedSubviews
        initialNumToRender={12}
        windowSize={11}
        hideQueueControls={true}
      />
    </View>
  );
};

export default ArtistTrackList;

const styles = StyleSheet.create({
  artistHeaderContainer: {
    flex: 1,
    marginBottom: 32,
  },
  artworkImageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    height: 200,
  },
  artistImage: {
    width: "60%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 128,
  },
  artistNameText: {
    color: "#fff",
    marginTop: 22,
    marginBottom: 22,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
  },
});
