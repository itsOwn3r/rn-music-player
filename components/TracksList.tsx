// components/TracksList.tsx

import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { useRouter } from "expo-router";
// ✨ 1. Import React
import React, { RefObject } from "react";
import { FlatListProps, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import QueueControls from "./QueueControls";
import TracksListItem from "./TracksListItem";

export type TracksListProps = Partial<FlatListProps<Song>> & {
  tracks: Song[];
  hideQueueControls?: boolean;
  isInPlaylist?: boolean;
  isInQueue?: boolean;
  search?: string;
  playlistId?: string;
  ref?: RefObject<FlatList<Song> | null>;
};

const ItemDivider = () => (
  <View className="opacity-30 border-[#9ca3af88] border my-[5px] ml-[0px]" />
);

// ✨ 2. Wrap the component in React.forwardRef
const TracksList = React.forwardRef<FlatList<Song>, TracksListProps>(
  (
    {
      tracks,
      hideQueueControls,
      search,
      isInPlaylist,
      playlistId,
      isInQueue,
      ...rest
    },
    ref
  ) => {
    const router = useRouter();
    const playSongGeneric = usePlayerStore((s) => s.playSongGeneric);
    const currentSong = usePlayerStore((s) => s.currentSong);

    const handlePlaySong = async (track: Song) => {
      const contextQueue = tracks;
      await playSongGeneric(track, { contextQueue });

      if (isInQueue) {
        router.back();
      } else {
        router.navigate("/Playing");
      }
    };

    if (!tracks || tracks.length === 0) {
      // ... (no changes in this block)
    }

    return (
      <FlatList
        // ✨ 3. Pass the ref to the FlatList
        ref={ref}
        className="flex-1 size-full"
        data={tracks}
        keyExtractor={(item) => item.id ?? item.uri}
        ItemSeparatorComponent={ItemDivider}
        scrollEnabled={true}
        ListHeaderComponent={
          !hideQueueControls ? <QueueControls tracks={tracks} /> : null
        }
        renderItem={({ item: track, index }) => (
          <TracksListItem
            index={index}
            track={track}
            handlePlaySong={handlePlaySong}
            playlistId={playlistId}
            isInPlaylist={isInPlaylist || false}
            isActive={track.uri === currentSong?.uri}
          />
        )}
        {...rest}
      />
    );
  }
);
TracksList.displayName = "TracksList";

export default TracksList;
