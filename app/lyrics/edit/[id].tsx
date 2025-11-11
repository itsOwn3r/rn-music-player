import { AnimatedButton } from "@/components/AnimatedButton";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditLyricsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getSongInfo = usePlayerStore((s) => s.getSongInfo);
  const updateLyrics = usePlayerStore((s) => s.setLyrics);

  const [song, setSong] = useState<Song | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const info = await getSongInfo(id);
      setSong(info);
      if (info?.lyrics) setLyrics(info.lyrics);
      setLoading(false);
    })();
  }, [getSongInfo, id]);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setLyrics(text);
  };

  const handleSave = async () => {
    if (!song) return;
    await updateLyrics(song.id!, lyrics);
    router.back();
  };

  if (loading)
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );

  if (!song)
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-gray-400 text-lg">Song not found</Text>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-black b z-50" pointerEvents="box-none">
      {/* Header */}
      <View
        className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-3 z-50"
        style={{ elevation: 10 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Edit Lyrics</Text>
        <TouchableOpacity onPress={handleSave}>
          <FontAwesome6 name="check" size={26} color="#22c55e" />
        </TouchableOpacity>
      </View>
      {/* Background blur */}
      {song.coverArt && (
        <Image
          source={{ uri: song.coverArt }}
          blurRadius={30}
          className="absolute w-full h-full"
        />
      )}
      <BlurView intensity={80} tint="dark" className="absolute w-full h-full" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="items-center mt-12">
          {song.coverArt ? (
            <Image
              source={{ uri: song.coverArt }}
              className="w-40 h-40 rounded-2xl shadow-2xl"
            />
          ) : (
            <View className="w-40 h-40 bg-neutral-800 rounded-2xl items-center justify-center">
              <Text className="text-gray-500">🎵</Text>
            </View>
          )}
          <Text className="text-white text-2xl font-bold mt-4">
            {song.title || "Unknown Title"}
          </Text>
          <Text className="text-gray-400 text-base mt-1">
            {song.artist || "Unknown Artist"}
          </Text>
        </View>

        {/* Lyrics Input */}
        <View className="mx-5 mt-8">
          <BlurView
            intensity={60}
            tint="dark"
            className="rounded-2xl overflow-hidden"
          >
            <TextInput
              multiline
              value={lyrics}
              onChangeText={setLyrics}
              placeholder="Type or paste lyrics here..."
              placeholderTextColor="#888"
              textAlignVertical="top"
              className="text-white text-base p-4 h-[300px]"
            />
          </BlurView>
        </View>

        {/* Buttons */}
        <View className="px-8 space-y-4 gap-y-4 mt-12">
          <AnimatedButton
            color="green"
            label="💾 Save Lyrics"
            onPress={handleSave}
          />
          <AnimatedButton
            color="cyan"
            label="📋 Paste from Clipboard"
            onPress={handlePaste}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditLyricsScreen;
