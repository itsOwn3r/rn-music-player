import { parseLRC } from "@/tools/parseLyrics";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useProgress } from "react-native-track-player";
import { toast } from "sonner-native";

export default function SyncedLyrics({
  lrc,
  toggleShowLyrics,
}: {
  lrc: string;
  toggleShowLyrics: () => void;
}) {
  const lyrics = parseLRC(lrc);
  const synced = lyrics.some((l) => l.time > 0);
  const handleChangeSongPosition = usePlayerStore(
    (s) => s.handleChangeSongPosition
  );
  const { position } = useProgress(100);

  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualScroll, setManualScroll] = useState(false);
  const scrollTimeout = useRef<number | null>(null);

  // find current line based on position
  useEffect(() => {
    if (!synced) return;
    const index = lyrics.findIndex(
      (line, i) =>
        position >= line.time &&
        (i === lyrics.length - 1 || position < lyrics[i + 1].time)
    );
    if (index !== -1 && index !== activeIndex) setActiveIndex(index);
  }, [lyrics, position, synced]);

  // auto-scroll to active line
  useEffect(() => {
    if (!synced || manualScroll || !flatListRef.current) return;
    flatListRef.current.scrollToOffset({
      offset: activeIndex * 40, // adjust row height if needed
      animated: true,
    });
  }, [activeIndex, manualScroll, synced]);

  // handle manual scroll (disable auto-scroll temporarily)
  const handleUserScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    if (!manualScroll) setManualScroll(true);
    scrollTimeout.current = setTimeout(() => {
      setManualScroll(false);
    }, 5000);
  };

  const handlePosition = async (position: number) => {
    try {
      const response = await axios.post(
        "http://192.168.1.108:3001/api/music/position",
        { position }
      );

      if (response.data.success) {
        toast.success(`New Position: ${Number(Math.ceil(position * 100))}`);
      } else {
        toast.error(
          `Error in changing Position! message: ${response.data.message}`
        );
      }
      handleChangeSongPosition(position);
    } catch (error) {
      toast.error(`"Change Position failed: ", ${error}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={lyrics}
        keyExtractor={(_, i) => i.toString()}
        scrollEnabled
        onScrollBeginDrag={handleUserScroll}
        onMomentumScrollEnd={handleUserScroll}
        getItemLayout={(_, index) => ({
          length: 40,
          offset: 40 * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <Text
            onPress={() => synced && handlePosition(item.time)}
            onLongPress={toggleShowLyrics}
            className={`text-center text-lg mx-4 ${
              synced && index === activeIndex
                ? "text-white font-bold"
                : "text-gray-400"
            }`}
            style={{ marginVertical: 6 }}
          >
            {item.text}
          </Text>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 100,
          flexGrow: 1,
          justifyContent: "center",
        }}
      />
    </View>
  );
}
