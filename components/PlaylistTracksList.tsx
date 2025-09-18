import { useMemo, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Playlist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueueControls from "./QueueControls";
import TracksList from "./TracksList";

export const PlaylistTracksList = ({ playlist }: { playlist: Playlist }) => {
  const [search, setSearch] = useState("");

  const filteredPlaylistSongs = useMemo(() => {
    if (search.trim() === "") return playlist.songs;
    const lowerSearch = search.toLowerCase();
    return playlist.songs.filter(
      (t) =>
        t?.title?.toLowerCase().includes(lowerSearch) ||
        t?.artist?.toLowerCase().includes(lowerSearch) ||
        t?.album?.toLowerCase().includes(lowerSearch)
    );
  }, [playlist.songs, search]);
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1"
      style={{
        // paddingBottom: insets.bottom + 150,
        marginBottom: insets.bottom === 0 ? 150 : insets.bottom + 90,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 10,
        elevation: 4,
        flex: 1,
      }}
    >
      <View className="absolute left-0 right-0 bg-neutral-900 px-4 pb-2 z-10">
        <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
          <TextInput
            className="text-white text-base flex-1 py-2"
            placeholder="Search in Songs in this Playlist"
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
        // id={generateTracksListId(playlist.name, search)}
        scrollEnabled={true}
        hideQueueControls={true}
        ListHeaderComponentStyle={styles.playlistHeaderContainer}
        ListHeaderComponent={
          <View>
            <View style={styles.artworkImageContainer}>
              <Image
                source={{
                  uri: playlist.coverArts[0],
                }}
                style={styles.artworkImage}
              />
            </View>

            <Text numberOfLines={1} style={styles.playlistNameText}>
              {playlist.name}
            </Text>

            <Text
              numberOfLines={1}
              className="text-sm mb-3 text-white font-bold text-center"
            >
              By {playlist.userName}
            </Text>

            {search.length === 0 && <QueueControls tracks={playlist.songs} />}
          </View>
        }
        tracks={filteredPlaylistSongs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  playlistHeaderContainer: {
    flex: 1,
    marginBottom: 32,
  },
  artworkImageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    height: 300,
    marginTop: 50,
  },
  artworkImage: {
    width: "85%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 12,
  },
  playlistNameText: {
    color: "#fff",
    marginTop: 22,
    marginBottom: 6,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
  },
});
