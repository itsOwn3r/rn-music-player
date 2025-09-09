import coverImage from "@/assets/placeholder2.jpg";
import DismissPlayerSymbol from "@/components/DismissPlayerSymbol";
import NeumorphicButton from "@/components/NeumorphicButton";
import PlayerVolumeBar from "@/components/PlayerVolumeBar";
import ProgressBar from "@/components/ProgressBar";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import TextTicker from "react-native-text-ticker";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PlayingScreen() {
  const router = useRouter();
  const translateY = useSharedValue(0);

  const isFavorite = false;
  const toggleFavorite = async () => {};

  const currentSong = usePlayerStore((s) => s.currentSong);
  const currentSongIndex = usePlayerStore((s) => s.currentSongIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const playPauseMusic = usePlayerStore((s) => s.playPauseMusic);
  const playSong = usePlayerStore((s) => s.playSong);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 150) {
        runOnJS(router.back)();
      } else {
        // Bouncy spring back
        translateY.value = withSpring(0, {
          damping: 12, // less damping = more oscillation
          stiffness: 120, // spring stiffness
          mass: 0.8, // affects bounciness
          overshootClamping: false, // allow it to "go past" and bounce
        });
      }
    });

  // Background fade style
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: 1 - translateY.value / SCREEN_HEIGHT,
  }));

  // Card movement style
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView className="flex-1 h-screen">
      {/* Background overlay */}
      <Animated.View
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,1)",
          },
          backgroundStyle,
        ]}
      />

      {/* Draggable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
            },
            cardStyle,
          ]}
        >
          <DismissPlayerSymbol />
          {/* Your player content goes here */}
          <View className="mt-16">
            <View
              className={`items-center rounded-lg border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-700 mx-auto size-96`}
            >
              <Image
                source={
                  currentSong?.coverArt
                    ? { uri: currentSong.coverArt }
                    : coverImage
                }
                alt="Cover Image"
                className="rounded-lg shadow-lg shadow-black size-full"
                width={250}
                height={250}
              />
            </View>

            {/* Song Info */}
            <View className="mt-10 mb-1 w-full flex justify-center relative items-center">
              {currentSong ? (
                <TextTicker
                  duration={11000}
                  loop
                  bounce
                  scroll
                  repeatSpacer={50}
                  className="text-2xl font-bold px-3 text-white"
                  marqueeDelay={2000}
                >
                  {currentSong.title}
                </TextTicker>
              ) : (
                "Song Title"
              )}
              <Text className="text-center text-base text-gray-400 font-semibold mb-1">
                {currentSong ? currentSong.artist : "Artist Name"}
              </Text>
            </View>

            <View className="flex justify-between w-full flex-row px-5">
              <TouchableOpacity
                onPress={() => router.back()}
                className="size-12 items-center flex justify-center text-[#b8b8b8]"
              >
                <FontAwesome name="list-ol" color="#b8b8b8" size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleFavorite}
                className="text-white size-12 items-center flex justify-center"
              >
                <FontAwesome
                  color="red"
                  name={isFavorite ? "heart" : "heart-o"}
                  size={24}
                />
              </TouchableOpacity>
            </View>

            {/* Time Labels */}

            <ProgressBar />
          </View>
          {/* Controls */}
          <View className="flex flex-row justify-evenly mx-7 items-center mt-2">
            <NeumorphicButton
              icon="play-skip-back"
              onPress={() => playSong(currentSongIndex - 1)}
              style="bg-gray-700 p-4"
            />
            <NeumorphicButton
              icon={isPlaying ? "pause" : "play"}
              onPress={playPauseMusic}
              style="bg-orange-800 p-4"
            />
            <NeumorphicButton
              icon="play-skip-forward"
              onPress={() => playSong(currentSongIndex + 1)}
              style="bg-gray-700 p-4"
            />
          </View>
          <PlayerVolumeBar />
        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}
