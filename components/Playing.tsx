import coverImage from "@/assets/placeholder2.jpg";
import formatDuration from "@/tools/formatDuration";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";
import TextTicker from "react-native-text-ticker";
import NeumorphicButton from "./NeumorphicButton";

const Playing = () => {
  const router = useRouter();

  const {
    currentSong,
    currentSongIndex,
    isPlaying,
    duration,
    position,
    playPauseMusic,
    playSong,
    handleChangeSongPosition,
  } = usePlayerStore();

  // For Calling:
  // <SafeAreaView>
  //   <Playing />
  // </SafeAreaView>

  return (
    <View className="h-screen bg-black">
      {/* Header */}
      <View className="flex-row justify-between items-center mx-4 mt-7">
        <NeumorphicButton
          icon="arrow-back"
          onPress={() => router.back()} // go back to Songs tab
          style="bg-gray-700 p-4"
        />
        <Text className="text-center text-white font-semibold text-sm uppercase">
          Playing Now
        </Text>
        <NeumorphicButton
          icon="menu"
          onPress={() => router.back()} // same as back for now
          style="bg-gray-700 p-4"
        />
      </View>

      {/* Cover Art */}
      <View
        className={`items-center mt-14 rounded-full border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-700 mx-auto size-96`}
      >
        <Image
          source={
            currentSong?.coverArt ? { uri: currentSong.coverArt } : coverImage
          }
          alt="Cover Image"
          className="rounded-full shadow-lg shadow-black size-full"
          width={250}
          height={250}
        />
      </View>

      {/* Song Info */}
      <View className="mt-14 w-full flex justify-center relative items-center">
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

      {/* Time Labels */}
      <View className="flex-row justify-between px-7 mt-16">
        <Text className="text-gray-400">{formatDuration(position)}</Text>
        <Text className="text-gray-400">{formatDuration(duration)}</Text>
      </View>
      {/* Progress Bar */}
      <View className="w-full flex justify-center text-center items-center mb-4 px-7">
        <View className="w-[95%]">
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={(value) => handleChangeSongPosition(value)}
            minimumTrackTintColor="#e17645"
            maximumTrackTintColor="#4a4a4a"
            thumbTintColor="#e17645"
          />
        </View>
      </View>

      {/* Controls */}
      <View className="flex flex-row justify-evenly mx-7 items-center">
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
    </View>
  );
};

export default Playing;
