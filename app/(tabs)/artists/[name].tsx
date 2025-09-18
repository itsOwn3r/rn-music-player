import ArtistTrackList from "@/components/ArtistTrackList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Artist } from "@/types/types";
import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import { processMusicData } from ".";

const ArtistDetailScreen = () => {
  const { name: artistName } = useLocalSearchParams<{ name: string }>();

  const files = usePlayerStore((s) => s.files);

  const uniqueArtists: Artist[] = processMusicData(files);

  const findArtist = uniqueArtists.find((artist) =>
    artist.name.toLowerCase().includes(artistName.toLowerCase())
  );

  if (!findArtist) {
    console.warn(`Artist ${artistName} not found!`);

    return <Redirect href={"/(tabs)/artists"} />;
  }

  return (
    <View className="flex-1 bg-black px-6">
      <ArtistTrackList artist={findArtist} />
    </View>
  );
};

export default ArtistDetailScreen;
