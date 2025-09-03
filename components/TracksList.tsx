import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { router } from "expo-router";
import React from "react";
import { FlatList, FlatListProps, View } from "react-native";
import TracksListItem from "./TracksListItem";

export type TracksListProps = Partial<FlatListProps<Song>> & {
  tracks: Song[];
};

const ItemDivider = () => (
  <View className="opacity-30 border-[#9ca3af88] border my-[5px] ml-[0px]" />
);

const TracksList = ({ tracks, ...rest }: TracksListProps) => {
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSongIndex = usePlayerStore((s) => s.currentSongIndex);

  const handlePlaySong = async (index: number) => {
    await playSong(index);
    router.push("/Playing"); // navigate to Playing screen
  };

  if (!tracks || tracks.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-neutral-800 px-4 py-2 rounded-lg justify-center">
          <TracksListItem
            index={0}
            handlePlaySong={() => {}}
            track={{
              title: "No results found",
              artist: "Try a different search term",
              coverArt: null,
              uri: "",
              filename: "",
              album: "",
              index: 0,
              duration: 0,
            }}
            isActive={false}
          />
        </View>
      </View>
    );
  }

  console.log("tracks ", tracks);

  return (
    <FlatList
      className="flex-1 size-full"
      data={tracks} // ✅ always tracks
      keyExtractor={(item) => item.id ?? item.uri} // ✅ stable keys
      ItemSeparatorComponent={ItemDivider}
      renderItem={({ item: track, index }) => (
        <TracksListItem
          index={index}
          track={track}
          handlePlaySong={() => handlePlaySong(index)}
          isActive={index === currentSongIndex} // boolean only
        />
      )}
      {...rest}
    />
  );
};

export default TracksList;
