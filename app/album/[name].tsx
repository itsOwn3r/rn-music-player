import LoadingScreen from "@/components/LoadingScreen";
import QueueControls from "@/components/QueueControls";
import TracksList from "@/components/TracksList";
import { unknownTrackImageUri } from "@/constants/images";
import formatDuration from "@/tools/formatDuration";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Album, Song } from "@/types/types";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AlbumScreen = () => {
  const { name } = useLocalSearchParams<{ name: string }>();
  const getAlbum = usePlayerStore((s) => s.getAlbum);
  const [fetchedSongs, setFetchedSongs] = useState<Song[] | null>(null);

  const router = useRouter();

  const albumName = name.replaceAll("+", " ");

  useEffect(() => {
    (async () => {
      const songs = await getAlbum(albumName);
      setFetchedSongs(songs);
    })();
  }, [getAlbum, albumName]);

  if (!fetchedSongs) {
    return <LoadingScreen />;
  }

  const album: Album = {
    id: "love-for-sale-deluxe",
    name: fetchedSongs[0].title || "Song Name",
    artistId: "tony-gaga",
    artistName: fetchedSongs[0].artist || "Artist Name",
    coverArt:
      fetchedSongs[0].coverArt ??
      "file:///data/user/0/com.lori.app/files/albumArt/default.jpg",
    songs: fetchedSongs,
    releaseDate: 1633046400000, // Dummy timestamp (Oct 1, 2021)
    duration: fetchedSongs.reduce((a, s) => a + (s.duration ?? 0), 0),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 z-50">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Album</Text>
        <TouchableOpacity>
          <MaterialIcons name="share" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 size-full flex items-center">
        <View className="px-3 mt-8 pb-8 size-full">
          <TracksList
            scrollEnabled={true}
            hideQueueControls={false}
            ListHeaderComponentStyle={styles.playlistHeaderContainer}
            isInPlaylist={false}
            playlistId={album.id}
            tracks={album.songs}
            contentContainerStyle={{ paddingBottom: 25 }}
            ListHeaderComponent={
              <View className="items-center mt-6 w-full hf">
                <Image
                  source={{
                    uri: album.coverArt ?? unknownTrackImageUri,
                  }}
                  className="w-64 h-64 rounded-2xl shadow-2xl"
                />

                <View className="px-6 pt-6 w-full">
                  <Text
                    numberOfLines={1}
                    className="text-white text-3xl font-extrabold text-center"
                  >
                    {album.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-gray-300 text-lg text-center mt-1"
                  >
                    {album.artistName}
                  </Text>
                  <Text className="text-gray-500 text-sm text-center mt-1">
                    {new Date(album.releaseDate).getFullYear()} •{" "}
                    {formatDuration(album.duration)}
                  </Text>
                </View>
                <View className="justify-center items-center w-full mt-4">
                  <QueueControls tracks={album.songs} />
                </View>
              </View>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AlbumScreen;

const styles = StyleSheet.create({
  playlistHeaderContainer: {
    flex: 1,
    marginBottom: 22,
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
