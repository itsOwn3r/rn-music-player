import { parseLRC } from "@/tools/parseLyrics";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Text } from "react-native";
import Animated, {
  scrollTo,
  useAnimatedRef,
  useDerivedValue,
} from "react-native-reanimated";

export default function SyncedLyrics({ lrc }: { lrc: string }) {
  const lyrics = parseLRC(lrc);
  const synced = lyrics.some((l) => l.time > 0);

  const handleChangeSongPosition = usePlayerStore(
    (s) => s.handleChangeSongPosition
  );
  const position = usePlayerStore((s) => s.position);

  const flatListRef = useAnimatedRef<FlatList<any>>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualScroll, setManualScroll] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!synced) return;
    const index = lyrics.findIndex(
      (line, i) =>
        position >= line.time &&
        (i === lyrics.length - 1 || position < lyrics[i + 1].time)
    );
    if (index === -1) setActiveIndex(0);
    else if (index !== activeIndex) setActiveIndex(index);
  }, [activeIndex, lyrics, position, synced]);

  useDerivedValue(() => {
    if (synced && !manualScroll && activeIndex > 0 && position > 0) {
      scrollTo(flatListRef, 0, activeIndex * 32, true);
    }
  }, [activeIndex, manualScroll, position, synced]);

  const handleUserScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    if (!manualScroll) setManualScroll(true);

    scrollTimeout.current = setTimeout(() => {
      setManualScroll(false);
    }, 5000) as unknown as NodeJS.Timeout;
  };

  return (
    <Animated.FlatList
      ref={flatListRef}
      data={lyrics}
      keyExtractor={(_, i) => i.toString()}
      scrollEnabled
      onScrollBeginDrag={handleUserScroll}
      onMomentumScrollEnd={handleUserScroll}
      renderItem={({ item, index }) => (
        <Text
          onPress={() => synced && handleChangeSongPosition(item.time)}
          className={`text-center text-lg ${
            synced && index === activeIndex
              ? "text-white font-bold"
              : "text-gray-400"
          }`}
          style={{ marginVertical: 4 }}
        >
          {item.text}
        </Text>
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 100 }}
    />
  );
}
