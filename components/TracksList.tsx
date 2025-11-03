// components/TracksList.tsx

import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  autoScrollToCurrent?: boolean;
};

const ItemDivider = () => (
  <View className="opacity-30 border-[#9ca3af88] border my-[5px] ml-[0px]" />
);

const TracksList = React.forwardRef<FlatList<Song>, TracksListProps>(
  (
    {
      tracks,
      hideQueueControls,
      search,
      isInPlaylist,
      playlistId,
      isInQueue,
      autoScrollToCurrent = true,
      ...rest
    },
    ref
  ) => {
    const router = useRouter();
    const playSongGeneric = usePlayerStore((s) => s.playSongGeneric);
    const currentSong = usePlayerStore((s) => s.currentSong);

    const internalRef = useRef<FlatList<Song>>(null);
    const listRef = (ref as RefObject<FlatList<Song>>) ?? internalRef;

    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const [scrollKey, setScrollKey] = useState(0);

    const scrollToCurrentSong = useCallback(
      (currentSongFromUseEffect?: Song | null) => {
        if (
          !autoScrollToCurrent ||
          !isLayoutReady ||
          !currentSong ||
          !tracks.length
        )
          return;

        const songIndex = tracks.findIndex(
          (track) =>
            track.uri ===
            (currentSongFromUseEffect
              ? currentSongFromUseEffect.uri
              : currentSong.uri)
        );
        if (songIndex === -1) return;

        const timer = setTimeout(() => {
          listRef.current?.scrollToIndex?.({
            index: songIndex,
            animated: true,
            viewPosition: 0.4,
          });
        }, 150);

        return () => clearTimeout(timer);
      },
      [autoScrollToCurrent, isLayoutReady, tracks]
    );

    const handleLayout = useCallback(() => {
      if (!isLayoutReady) setIsLayoutReady(true);
    }, [isLayoutReady]);

    useEffect(() => {
      scrollToCurrentSong(currentSong);
    }, [scrollKey, scrollToCurrentSong]);

    useFocusEffect(
      useCallback(() => {
        if (!autoScrollToCurrent) return;
        setScrollKey((k) => k + 1);
      }, [autoScrollToCurrent])
    );

    const handlePlaySong = async (track: Song) => {
      const contextQueue = tracks;
      await playSongGeneric(track, { contextQueue });

      if (isInQueue) {
        router.back();
      } else {
        router.navigate("/Playing");
      }
    };

    return (
      <FlatList
        ref={listRef}
        onLayout={handleLayout}
        className="flex-1 size-full"
        data={tracks}
        keyExtractor={(item) => item.id ?? item.uri}
        ItemSeparatorComponent={ItemDivider}
        scrollEnabled={true}
        ListHeaderComponent={
          !hideQueueControls ? <QueueControls tracks={tracks} /> : null
        }
        onScrollToIndexFailed={(info) => {
          console.warn("ScrollToIndex failed", info);
          setTimeout(() => {
            listRef.current?.scrollToIndex?.({
              index: info.index,
              animated: true,
              viewPosition: 0.4,
            });
          }, 500);
        }}
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
