import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
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
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const AnimatedButton = ({
  label,
  onPress,
  color,
}: {
  label: string;
  color: "green" | "cyan";
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
    shadowRadius: 30 * glow.value,
  }));

  const bgColor = color === "green" ? "bg-green-600" : "bg-cyan-600";
  const shadowColor =
    color === "green" ? "shadow-green-400/60" : "shadow-cyan-400/60";

  return (
    <TouchableWithoutFeedback
      onPressIn={() => (scale.value = withTiming(0.96, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      onPress={onPress}
    >
      <Animated.View
        className={`py-4 rounded-2xl items-center shadow-lg ${bgColor} ${shadowColor}`}
        style={animatedStyle}
      >
        <Text className="text-white text-base font-semibold tracking-wide">
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const AddLyricsScreen = () => {
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
    <View className="flex-1 bg-black">
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
        <View className="mt-8 px-8 space-y-4">
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
    </View>
  );
};

export default AddLyricsScreen;
