import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { unknownTrackImageUri } from "@/constants/images";
import { usePlayerStore, usePlaylistStore } from "@/tools/store/usePlayerStore";
import { Playlist } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueueControls from "./QueueControls";
import TracksList from "./TracksList";

export const PlaylistTracksList = ({
  playlist,
  playlistName,
}: {
  playlist: Playlist;
  playlistName: string;
}) => {
  const [search, setSearch] = useState("");
  const files = usePlayerStore((s) => s.files);

  let populatePlaylistSong = files.filter((song) =>
    playlist.songs.includes(song.uri)
  );

  if (playlistName === "most-played") {
    populatePlaylistSong = populatePlaylistSong.sort(
      (a, b) => (b.playCount ?? 0) - (a.playCount ?? 0)
    );
  }

  const filteredPlaylistSongs = useMemo(() => {
    if (search.trim() === "") return populatePlaylistSong;
    const lowerSearch = search.toLowerCase();
    return populatePlaylistSong.filter(
      (t) =>
        t?.title?.toLowerCase().includes(lowerSearch) ||
        t?.artist?.toLowerCase().includes(lowerSearch) ||
        t?.album?.toLowerCase().includes(lowerSearch)
    );
  }, [populatePlaylistSong, search]);

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const removePlaylist = usePlaylistStore((s) => s.removePlaylist);

  const handleDeletePlaylist = (playlistId: string) => {
    Alert.alert(
      "Delete Playlist",
      "Are you sure you want to delete this playlist?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removePlaylist(playlistId);
            router.back();
          },
        },
      ]
    );
  };

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
        isInPlaylist={true}
        playlistId={playlist.id}
        ListHeaderComponent={
          <View>
            <View style={styles.artworkImageContainer}>
              <Image
                source={{
                  uri: playlist.coverArt ?? unknownTrackImageUri,
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
              {playlist.userName && "By"} {playlist.userName}
            </Text>

            {search.length === 0 && (
              <QueueControls tracks={populatePlaylistSong} />
            )}
            <View className="w-full justify-center items-center">
              <TouchableOpacity
                onPress={() => handleDeletePlaylist(playlist.id)}
                activeOpacity={0.8}
                className="p-3 bg-[rgba(143,24,24,0.64)] rounded-lg flex-row justify-center items-center gap-x-2"
              >
                <Ionicons name="warning-sharp" size={22} color="#fff" />
                <Text className="text-white font-semibold text-lg text-center">
                  Delete playlist
                </Text>
              </TouchableOpacity>
            </View>
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
