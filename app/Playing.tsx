import coverImage from "@/assets/placeholder2.jpg";
import DismissPlayerSymbol from "@/components/DismissPlayerSymbol";
import {
  PlayPauseButton,
  RepeatHandler,
  ShuffleHandler,
  SkipToLastButton,
  SkipToNextButton,
} from "@/components/PlayerControls";
import PlayerVolumeBar from "@/components/PlayerVolumeBar";
import ProgressBar from "@/components/ProgressBar";
import SyncedLyrics from "@/components/SyncedLyrics";
import { getSong } from "@/tools/db";
import { fetchLyrics } from "@/tools/fetchLyrics";
import { usePlayerStore, usePlaylistStore } from "@/tools/store/usePlayerStore";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
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

  const toggleFavorite = usePlaylistStore((s) => s.toggleFavorite);

  const setLyrics = usePlayerStore((s) => s.setLyrics);

  const toggleShowLyrics = usePlayerStore((s) => s.toggleShowLyrics);

  const showLyrics = usePlayerStore((s) => s.showLyrics);
  const downloadFile = usePlayerStore((s) => s.downloadFile);

  const currentSong = usePlayerStore((s) => s.currentSong);

  const addToPlaylist = () => {
    router.push({
      pathname: "/(modals)/addToPlaylist",
      params: { trackUri: currentSong?.uri },
    });
  };

  const handleDownload = async (id: string, remoteUrl: string) => {
    if (!id || !remoteUrl) {
      console.warn("Not enought details to download the song!");
    }
    await downloadFile(id, remoteUrl);
  };

  const isFavorite = usePlaylistStore((s) =>
    s.isFavorite(currentSong?.id || "")
  );

  const handleFetchingLyrics = async () => {
    const lyrics = await fetchLyrics(currentSong, setLyrics);
    // router.reload();
    const updated = await getSong(currentSong?.id || "");
    if (!updated) return;

    // Update the files array and the currentSong reference in the store in one atomic update
    usePlayerStore.setState((prev: any) => {
      const files = prev.files ?? [];
      const newFiles = files.map((f: any) =>
        f.id === updated.id ? updated : f
      );
      return {
        files: newFiles,
        currentSong:
          prev.currentSong?.id === updated.id ? updated : prev.currentSong,
      };
    });
  };

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
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: "rgba(0,0,0,1)",
            },
            backgroundStyle,
          ]}
        />
      </Animated.View>

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
          <View className="mt-20">
            <View
              className={` relative items-start rounded-lg border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-700 mx-auto size-96`}
            >
              <TouchableOpacity
                onPress={toggleShowLyrics}
                className="size-full"
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
              </TouchableOpacity>
              {showLyrics &&
                (currentSong?.lyrics ? (
                  <TouchableOpacity
                    className="absolute inset-0 z-50 bg-black/70"
                    onPress={toggleShowLyrics}
                  >
                    <SyncedLyrics
                      lrc={
                        currentSong?.syncedLyrics
                          ? currentSong.syncedLyrics
                          : currentSong?.lyrics || ""
                      }
                    />
                  </TouchableOpacity>
                ) : (
                  <View className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <Text className="text-white text-2xl">No Lyrics :(</Text>
                    <TouchableOpacity
                      onPress={() => handleFetchingLyrics()}
                      activeOpacity={0.8}
                      className="size-14 rounded-full bg-[#74b808] border border-[#2b2b2b] justify-center items-center mt-4"
                      // style={{ opacity: isActive === false ? 0.5 : 1 }}
                    >
                      <MaterialIcons name="download" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>

            {/* Song Info */}
            <View className="mb-4 mt-8 flex flex-row justify-center items-center z-50 w-full relative bg--500">
              <TouchableOpacity
                onPress={() => toggleFavorite(currentSong?.id || "")}
                className="text-white size-12 items-center flex justify-center absolute left-4"
              >
                <FontAwesome
                  color="red"
                  name={isFavorite ? "heart" : "heart-o"}
                  size={24}
                />
              </TouchableOpacity>
              <View className="flex justify-center relative items-center px-[15%]">
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
              <TouchableOpacity
                onPress={addToPlaylist}
                activeOpacity={0.8}
                className="size-12 rounded-full justify-center items-center absolute right-4"
              >
                <MaterialIcons name="playlist-add" size={30} color="#fff" />
              </TouchableOpacity>
            </View>

            <View className="flex justify-between w-full flex-row px-5">
              <TouchableOpacity
                onPress={() => router.push("/Queue")}
                className="size-12 items-center flex justify-center text-[#b8b8b8]"
              >
                <FontAwesome name="list-ol" color="#b8b8b8" size={24} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {}}
                className="text-white size-12 items-center flex justify-center"
              >
                <MaterialIcons color="white" name="timeline" size={24} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  handleDownload(currentSong?.id || "", currentSong?.uri || "")
                }
                className="text-white size-12 items-center flex justify-center"
              >
                <FontAwesome color="white" name="download" size={24} />
              </TouchableOpacity>
            </View>

            {/* Time Labels */}

            <ProgressBar />
          </View>
          {/* Controls */}
          <View className="w-full flex flex-row justify-evenly items-center mt-4">
            <View className="flex-row items-center justify-center">
              <ShuffleHandler iconSize={21} />
            </View>

            <View className="flex-row items-center justify-center">
              <SkipToLastButton iconSize={30} />
            </View>

            <View className="flex-row items-center justify-center">
              <PlayPauseButton iconSize={30} />
            </View>

            <View className="flex-row items-center justify-center">
              <SkipToNextButton iconSize={30} />
            </View>

            <View className="flex-row items-center justify-center">
              <RepeatHandler
                iconSize={21}
                classNames="flex flex-row justify-center items-center"
              />
            </View>
          </View>
          <PlayerVolumeBar />
          {/* <PlayerFooter currentSong={currentSong} /> */}
        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}
