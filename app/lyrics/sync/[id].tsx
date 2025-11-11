import coverImage from "@/assets/placeholder2.jpg";
import { PlayPauseButton } from "@/components/PlayerControls";
import formatDuration from "@/tools/formatDuration";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import TrackPlayer, { useProgress } from "react-native-track-player";

export default function SyncLyricsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getSongInfo } = usePlayerStore();

  const handleForwardPosition = usePlayerStore((s) => s.handleForwardPosition);
  const handlebackwardPosition = usePlayerStore(
    (s) => s.handlebackwardPosition
  );
  const handleChangeSongPosition = usePlayerStore(
    (s) => s.handleChangeSongPosition
  );

  const [song, setSong] = useState<any>(null);
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [synced, setSynced] = useState<
    { index: number; time: number; text: string }[]
  >([]);

  const scrollRef = useRef<React.ElementRef<typeof Animated.ScrollView> | null>(
    null
  );
  const scrollY = useSharedValue(0);

  useEffect(() => {
    (async () => {
      if (!id) return;

      const info = await getSongInfo(id);
      setSong(info);
      handleChangeSongPosition(0);

      if (info?.syncedLyrics) {
        // Parse LRC format into { index, time, text }
        const lines = info.syncedLyrics.split("\n").filter(Boolean);
        const parsedSynced = lines.map((line, index) => {
          const match = line.match(/\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
          if (!match) return { index, time: 0, text: line }; // fallback
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const centiseconds = parseInt(match[3], 10);
          const time = minutes * 60 + seconds + centiseconds / 100;
          const text = match[4];
          return { index, time, text };
        });

        // Set lyrics text only (for editing lines)
        setLyrics(parsedSynced.map((l) => l.text));

        // Set synced timestamps
        setSynced(parsedSynced);
      } else if (info?.lyrics) {
        // fallback: just plain lyrics
        setLyrics(info.lyrics.split("\n").filter(Boolean));
        setSynced([]); // no synced timestamps yet
      }
    })();
  }, [getSongInfo, handleChangeSongPosition, id]);

  const { position: currentTime } = useProgress(100);

  const handleTapLine = async (index: number) => {
    const text = lyrics[index];
    if (!text) return;

    // get current playback time from your store (currentTime is in seconds or ms depending on your app)
    // here I assume usePlayerStore gives currentTime in seconds (adjust if ms)
    const getProgress = await TrackPlayer.getProgress();
    const current = getProgress.position;

    setSynced((prev) => {
      // if there's already an entry for this index, replace it
      const existingIndex = prev.findIndex((p) => p.index === index);
      const newEntry = { index, time: current, text };

      if (existingIndex >= 0) {
        let copy = [...prev];
        copy[existingIndex] = newEntry;
        copy = copy.filter((c) => c.time <= current);
        return copy;
      } else {
        return [...prev, newEntry];
      }
    });
  };

  const handleSave = async () => {
    if (!id || !synced.length) return;

    try {
      // Sort by timestamp to ensure lyrics are in correct order
      const sorted = [...synced].sort((a, b) => a.time - b.time);

      // Convert to LRC format: [mm:ss.xx] Line
      const lrc = sorted
        .map(({ time, text }) => {
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          const centiseconds = Math.floor((time % 1) * 100); // 2 decimal places
          return `[${String(minutes).padStart(2, "0")}:${String(
            seconds
          ).padStart(
            2,
            "0"
          )}.${String(centiseconds).padStart(2, "0")}] ${text}`;
        })
        .join("\n");

      // Save to DB via player store
      await usePlayerStore.getState().updateSongSyncedLyrics(id, lrc);

      router.back();
    } catch (err) {
      console.error("Error saving synced lyrics:", err);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = withTiming(e.contentOffset.y);
    },
  });

  const handleSelectLine = (time?: number) => {
    if (!time) {
      return;
    }
    const newSynced = synced.filter((c) => c.time <= time);
    setSynced(newSynced);
    handleChangeSongPosition(time);
  };

  const { bottom } = useSafeAreaInsets();

  if (!song) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Sync Lyrics</Text>
        <TouchableOpacity onPress={handleSave} className="z-50">
          <FontAwesome6 name="check" size={26} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Cover Art */}
      <View className="mt-6 items-center">
        <View className="relative rounded-2xl overflow-hidden border border-neutral-800 shadow-lg shadow-black">
          <Image
            source={
              song.coverArt ? { uri: song.coverArt } : (coverImage as any)
            }
            className="w-64 h-64 rounded-2xl"
            resizeMode="cover"
          />
        </View>
        <Text className="text-white text-xl font-semibold mt-4">
          {song.title || "Unknown Title"}
        </Text>
        <Text className="text-gray-400">{song.artist || "Unknown Artist"}</Text>
      </View>

      {/* Lyrics */}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        className="flex-1 mt-6"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {lyrics.map((line, index) => {
          const syncedEntry = synced.find((e) => e.index === index);
          const syncedYet = !!syncedEntry;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleSelectLine(syncedEntry?.time)}
              className={`mx-6 my-2 py-3 px-3 rounded-2xl ${
                syncedYet
                  ? "bg-green-600/30 border border-green-500/50"
                  : "bg-neutral-800/40 border border-neutral-700"
              }`}
            >
              <View className="flex-row justify-between items-center">
                <Text
                  className={`text-base max-w-[90%] ${
                    syncedYet ? "text-green-300 font-semibold" : "text-gray-300"
                  }`}
                >
                  {line}
                </Text>

                {/* optional: show timestamp for this line if available */}
                {syncedEntry ? (
                  <Text className="text-sm text-green-200">
                    {formatDuration(syncedEntry.time)}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>

      {/* Floating Controls */}
      <View
        className="absolute left-0 right-0 py-6 bg-black/70 border-t border-neutral-800"
        style={{ bottom: bottom === 0 ? bottom : bottom - 20 }}
      >
        <View className="flex-row justify-center items-center space-x-6">
          {/* Play/Pause */}
          <View className="flex-row items-center justify-center">
            <TouchableOpacity
              onPress={() => handleSave()}
              activeOpacity={0.8}
              className="bg-green-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-green-500/50 right-7 absolute"
            >
              <MaterialIcons name="save" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center justify-center w-14">
            <TouchableOpacity
              className="flex-row justify-center items-center"
              onPress={() => handlebackwardPosition()}
            >
              <FontAwesome6 name="forward-step" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center justify-center w-14">
            <PlayPauseButton iconSize={30} />
          </View>
          <View className="flex-row items-center justify-center w-14">
            <TouchableOpacity
              className="flex-row justify-center items-center"
              onPress={() => handleForwardPosition()}
            >
              <FontAwesome6 name="forward-step" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Sync Button */}
          <TouchableOpacity
            onPress={() =>
              handleTapLine(
                synced.length < lyrics.length
                  ? synced.length
                  : synced.length === lyrics.length
                    ? 0
                    : lyrics.length - 1
              )
            }
            activeOpacity={0.8}
            className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-500/50 right-7 absolute"
          >
            <MaterialIcons name="timer" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text className="text-center text-gray-400 mt-3">
          {currentTime.toFixed(1)}s
        </Text>
      </View>
    </SafeAreaView>
  );
}
