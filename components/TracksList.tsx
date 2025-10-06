import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, FlatListProps, View } from "react-native";
import QueueControls from "./QueueControls";
import TracksListItem from "./TracksListItem";

export type TracksListProps = Partial<FlatListProps<Song>> & {
  tracks: Song[];
  hideQueueControls?: boolean;
  isInPlaylist?: boolean;
  search?: string;
  playlistId?: string;
};

const ItemDivider = () => (
  <View className="opacity-30 border-[#9ca3af88] border my-[5px] ml-[0px]" />
);

const TracksList = ({
  tracks,
  hideQueueControls,
  search,
  isInPlaylist,
  playlistId,
  ...rest
}: TracksListProps) => {
  const router = useRouter();
  // const playSong = usePlayerStore((s) => s.playSong);
  const playSongWithUri = usePlayerStore((s) => s.playSongWithUri);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const handlePlaySong = async (track: Song) => {
    const contextQueue = tracks;

    await playSongWithUri(track.uri, undefined, false, contextQueue);

    router.navigate("/Playing");
  };

  if (!tracks || tracks.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-neutral-800 px-4 py-2 rounded-lg justify-center">
          <TracksListItem
            index={0}
            handlePlaySong={() => {}}
            isInPlaylist={false}
            playlistId={""}
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

  return (
    <FlatList
      className="flex-1 size-full"
      data={tracks}
      keyExtractor={(item) => item.id ?? item.uri}
      ItemSeparatorComponent={ItemDivider}
      ListHeaderComponent={
        !hideQueueControls ? <QueueControls tracks={tracks} /> : null
      }
      // ListHeaderComponentStyle={{ margin: 0, padding: 0 }}
      renderItem={({ item: track, index }) => (
        <TracksListItem
          index={index}
          track={track}
          handlePlaySong={handlePlaySong}
          playlistId={playlistId}
          isInPlaylist={isInPlaylist || false}
          isActive={track.uri === currentSong?.uri} // boolean only
        />
      )}
      {...rest}
    />
  );
};

export default TracksList;
