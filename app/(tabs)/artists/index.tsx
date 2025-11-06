import LoadingScreen from "@/components/LoadingScreen";
import { unknownTrackImageUri } from "@/constants/images";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Artist, Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function processMusicData(musicArray: Song[]) {
  try {
    const artistsMap = new Map();

    musicArray.forEach((song) => {
      const artistName = song.artist?.toLowerCase();
      const artistImage = song.coverArt; // Use the song's cover art as the artist image
      const songData = {
        title: song.title,
        uri: song.uri,
        duration: song.duration,
        album: song.album,
        filename: song.filename,
        coverArt: song.coverArt,
        artist: song.artist,
      };

      if (artistsMap.has(artistName)) {
        // Artist already exists, update the songs array
        const existingArtist = artistsMap.get(artistName);
        existingArtist.songs.push(songData);
      } else {
        // Create a new artist entry
        artistsMap.set(artistName?.toLowerCase(), {
          name: artistName,
          image: artistImage,
          songs: [songData],
        });
      }
    });

    // Convert the map to an array
    const artistsArray = Array.from(artistsMap.values());
    return artistsArray;
  } catch (error) {
    console.log(error);
    return [];
  }
}

const ItemSeparatorComponent = () => {
  return <View className="opacity-30 border-[#9ca3af88] border my-[5px]" />;
};

const ArtistsScreen = () => {
  const files = usePlayerStore((s) => s.files);
  const isLoading = usePlayerStore((s) => s.isLoading);

  const uniqueArtists: Artist[] = processMusicData(files);

  const [search, setSearch] = useState("");

  const filteredArtists = useMemo(() => {
    if (search.trim() === "") return uniqueArtists;
    const lowerSearch = search.toLowerCase();
    return uniqueArtists.filter((t) =>
      t?.name?.toLowerCase().includes(lowerSearch)
    );
  }, [uniqueArtists, search]);

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-[#000]">
      <View className="absolute left-0 right-0 bg-neutral-900 px-4 pb-2 z-10">
        <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
          <TextInput
            className="text-white text-base flex-1 py-2"
            placeholder="Search in Artists"
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

      <ScrollView
        className="px-6 pt-16"
        contentInsetAdjustmentBehavior="automatic"
      >
        <FlatList
          data={filteredArtists}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
          scrollEnabled={false}
          ItemSeparatorComponent={ItemSeparatorComponent}
          ListFooterComponent={ItemSeparatorComponent}
          ListEmptyComponent={
            <View>
              <Text>No Artist Found!</Text>
            </View>
          }
          renderItem={({ item: artist }) => {
            return (
              <Link
                href={{
                  pathname: "/artists/[name]",
                  params: { name: artist.name },
                }}
                className="text-white"
                asChild
              >
                <TouchableHighlight activeOpacity={0.8}>
                  <View className="flex-row gap-x-[14px] items-center w-full">
                    <View className="flex-row gap-x-4 items-center">
                      <Image
                        source={{ uri: artist.image ?? unknownTrackImageUri }}
                        className="rounded-[32px] size-10"
                      />
                      <View className="flex-row gap-x-4 justify-between flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-white text-xl max-w-[80%]"
                        >
                          {artist.name}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="text-white text-base"
                        >
                          {artist.songs.length} songs
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableHighlight>
              </Link>
            );
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistsScreen;
