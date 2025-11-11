import coverImage from "@/assets/placeholder2.jpg";
import { AnimatedButton } from "@/components/AnimatedButton";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditSyncedLyricsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSongInfo } = usePlayerStore();

  const [song, setSong] = useState<any>(null);
  const [unSyncedLyrics, setUnSyncedLyrics] = useState<
    { index: number; time: number; text: string }[]
  >([]);
  const [lines, setLines] = useState<
    { index: number; time: number; text: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      if (!id) return;

      const info = await getSongInfo(id);
      setSong(info);

      if (info?.syncedLyrics) {
        // Parse synced lyrics (LRC format)
        const parsed = info.syncedLyrics
          .split("\n")
          .filter(Boolean)
          .map((line: string, index: number) => {
            const match = line.match(/\[(\d+):(\d+)\.(\d+)\]\s*(.*)/);
            if (!match) return { index, time: 0, text: line.trim() || " " };
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const centiseconds = parseInt(match[3], 10);
            const time = minutes * 60 + seconds + centiseconds / 100;
            const text = match[4];
            return { index, time, text };
          });

        setLines(parsed);
        if (info?.lyrics) {
          // fallback to unsynced plain lyrics
          const fallback = info.lyrics
            .split("\n")
            .filter(Boolean)
            .map((text, index) => ({ index, time: 0, text }));
          setUnSyncedLyrics(fallback);
        }
      } else if (info?.lyrics) {
        // fallback to unsynced plain lyrics
        const fallback = info.lyrics
          .split("\n")
          .filter(Boolean)
          .map((text, index) => ({ index, time: 0, text }));
        setLines(fallback);
      }
    })();
  }, [getSongInfo, id]);

  const handleChangeText = (index: number, newText: string) => {
    setLines((prev) =>
      prev.map((l) => (l.index === index ? { ...l, text: newText } : l))
    );
  };

  const handleSave = async () => {
    if (!id || !lines.length) return;
    try {
      const formatted = lines
        .map(({ time, text }) => {
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          const centiseconds = Math.floor((time % 1) * 100);
          return `[${String(minutes).padStart(2, "0")}:${String(
            seconds
          ).padStart(
            2,
            "0"
          )}.${String(centiseconds).padStart(2, "0")}] ${text}`;
        })
        .join("\n");

      await usePlayerStore.getState().updateSongSyncedLyrics(id, formatted);
      router.back();
    } catch (err) {
      console.error("Error saving synced lyrics:", err);
    }
  };

  const handleCopyLines = () => {
    console.log("Holla");
    const holder = [];

    for (let i = 0; i < unSyncedLyrics.length; i++) {
      lines[i].text = unSyncedLyrics[i].text;
      holder.push(lines[i]);
    }
    console.log(holder[0]);
    setLines(holder);
  };

  if (!song)
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Edit Synced Lyrics</Text>
        <TouchableOpacity onPress={handleSave}>
          <FontAwesome6 name="check" size={26} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Cover Art */}
      <View className="mt-6 items-center">
        <Image
          source={song.coverArt ? { uri: song.coverArt } : (coverImage as any)}
          className="w-64 h-64 rounded-2xl border border-neutral-800 shadow-lg shadow-black"
          resizeMode="cover"
        />
        <Text className="text-white text-xl font-semibold mt-4">
          {song.title || "Unknown Title"}
        </Text>
        <Text className="text-gray-400">{song.artist || "Unknown Artist"}</Text>
      </View>
      <View className="w-full px-8 gap-y-4 mt-8 z-50">
        <AnimatedButton
          color="green"
          label="Edit UnSync Lyrics"
          onPress={() =>
            router.push({
              pathname: "/lyrics/edit/[id]",
              params: { id: song.id },
            })
          }
        />
        <AnimatedButton
          color="cyan"
          label="Copy Line From UnSynced"
          onPress={() => handleCopyLines()}
        />
      </View>
      {/* Editable Lines */}
      <ScrollView
        className="flex-1 mt-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line, index) => (
          <View
            key={index}
            className="mx-6 my-2 px-4 py-3 rounded-2xl bg-neutral-800/60 border border-neutral-700"
          >
            <Text className="text-gray-400 mb-2 text-sm">
              {`[${String(Math.floor(line.time / 60)).padStart(2, "0")}:${String(
                Math.floor(line.time % 60)
              ).padStart(2, "0")}.${String(
                Math.floor((line.time % 1) * 100)
              ).padStart(2, "0")}]`}
            </Text>
            <TextInput
              multiline
              value={line.text}
              onChangeText={(t) => handleChangeText(index, t)}
              placeholder="Edit line..."
              placeholderTextColor="#777"
              className="text-white text-base"
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
