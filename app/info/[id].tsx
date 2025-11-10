import formatDuration from "@/tools/formatDuration";
import { handleFetchingLyrics } from "@/tools/handleFetchingLyrics";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
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
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedButton = ({
  label,
  disabled,
  color,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  color: "green" | "cyan";
  onPress?: () => void;
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.4);

  // subtle breathing glow effect
  React.useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
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

  const bgColor =
    color === "green"
      ? disabled
        ? "bg-gray-700"
        : "bg-green-600"
      : disabled
        ? "bg-gray-700"
        : "bg-cyan-600";

  const shadowColor =
    color === "green" ? "shadow-green-400/60" : "shadow-cyan-400/60";

  return (
    <TouchableWithoutFeedback
      onPressIn={() => (scale.value = withTiming(0.96, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      disabled={disabled}
      onPress={onPress ? onPress : undefined}
    >
      <Animated.View
        className={`py-4 rounded-2xl items-center shadow-lg ${bgColor} ${shadowColor}`}
        style={animatedStyle}
      >
        <Text
          className={`text-white text-base font-semibold tracking-wide ${
            disabled ? "opacity-70" : ""
          }`}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const SongInfoScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const setLyrics = usePlayerStore((s) => s.setLyrics);

  const getSongInfo = usePlayerStore((s) => s.getSongInfo);

  const router = useRouter();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        const info = await getSongInfo(id);
        if (mounted) setSong(info);
      } catch (err) {
        console.error("Error loading song info:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, getSongInfo]);

  const fetchingLyrics = async () => {
    const lyrics = await handleFetchingLyrics({ currentSong: song, setLyrics });
    if (lyrics) {
      const info = await getSongInfo(id);
      setSong(info);
    }
  };
  // console.log(song);
  // if (id === undefined) return <LoadingScreen />;

  if (!id) {
    console.warn(`Song with ${id} was not found!`);
    return <Redirect href={"/(tabs)/playlists"} />;
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!song) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-gray-400 text-lg">Song not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-5 pt-3 z-10">
        <TouchableOpacity className="z-50" onPress={() => router.back()}>
          <MaterialIcons
            className="z-50"
            name="arrow-back"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Song Info</Text>
        <View className="opacity-0">
          <Text>Go</Text>
        </View>
      </View>
      {/* Blurred background using coverArt */}
      {song.coverArt && (
        <Image
          source={{ uri: song.coverArt }}
          blurRadius={30}
          className="absolute w-full h-full"
        />
      )}
      <BlurView
        intensity={80}
        tint="dark"
        className="absolute w-full h-full"
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Cover Art */}
        <View className="items-center mt-16">
          {song.coverArt ? (
            <Image
              source={{ uri: song.coverArt }}
              className="w-60 h-60 rounded-2xl shadow-2xl"
            />
          ) : (
            <View className="w-60 h-60 rounded-2xl bg-neutral-800 items-center justify-center">
              <Ionicons name="disc" color="#666" size={48} />
            </View>
          )}
        </View>

        {/* Song Info */}
        <View className="px-6 pt-6">
          <Text
            numberOfLines={1}
            className="text-white text-2xl font-bold text-center"
          >
            {song.title || "Unknown Title"}
          </Text>
          <Text
            numberOfLines={1}
            className="text-gray-400 text-lg text-center mt-1"
          >
            {song.artist || "Unknown Artist"}
          </Text>

          <View className="flex-row justify-center mt-3 space-x-3">
            {song.album && (
              <Text className="text-gray-400 text-sm">🎵 {song.album}</Text>
            )}
            {song.year && (
              <Text className="text-gray-400 text-sm">📅 {song.year}</Text>
            )}
          </View>

          <View className="flex-col items-center mt-4 space-y-2">
            <View className="flex-row items-center space-x-2">
              <MaterialIcons name="timer" color="#aaa" size={18} />
              <Text className="text-gray-400 text-sm">
                {formatDuration(song.duration)}
              </Text>
            </View>
            <View className="flex-row items-center space-x-2">
              <Text className="text-gray-400 text-sm">
                ▶️ {song.playCount || 0} plays
              </Text>
            </View>
          </View>
        </View>

        {/* Fancy Animated Buttons */}
        <View className="mt-10 px-8 space-y-4 gap-y-4">
          <AnimatedButton
            color="green"
            label={!!song.lyrics ? "Edit Lyrics?" : "Add Lyrics"}
            onPress={() =>
              router.push({
                pathname: "/lyrics/edit/[id]",
                params: { id: song.id || "" },
              })
            }
          />

          <AnimatedButton
            color="cyan"
            disabled={!song.lyrics}
            label={
              song.lyrics
                ? song.syncedLyrics
                  ? "Edit Synced Lyrics"
                  : "Sync Lyrics"
                : "Fetch/Add Lyrics first"
            }
            onPress={() =>
              router.push({
                pathname: "/lyrics/sync/[id]",
                params: { id: song.id || "" },
              })
            }
          />

          <AnimatedButton
            color="green"
            label={
              !song.lyrics && !song.syncedLyrics
                ? "Fetch Lyrics"
                : "Re-Fetch Lyrics"
            }
            onPress={() => fetchingLyrics()}
          />

          <View className="border-cyan-600 border-1" />

          <AnimatedButton
            color="green"
            label="Edit Song"
            onPress={() =>
              router.push({
                pathname: "/edit/[id]",
                params: { id: song.id || "" },
              })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SongInfoScreen;
