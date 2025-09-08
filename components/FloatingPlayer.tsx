import coverImage from "@/assets/placeholder2.jpg";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TextTicker from "react-native-text-ticker";
import {
  PlayPauseButton,
  SkipToLastButton,
  SkipToNextButton,
} from "./PlayerControls";

const FloatingPlayer = () => {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const insets = useSafeAreaInsets();

  if (!currentSong) {
    return null;
  }

  return (
    <View
      //   style={{ bottom: insets.bottom }}
      className={`w-[97%] z-50 absolute px-2 right-2 left-2 bottom-[48px] flex flex-1 flex-row justify-between items-center bg-[#252525] rounded-xl`}
    >
      <View className="flex flex-1 w-full flex-row px-2 items-center h-24">
        <Pressable className="" onPress={() => router.push("/Playing")}>
          <Image
            source={
              currentSong?.coverArt ? { uri: currentSong.coverArt } : coverImage
            }
            alt="Cover Image"
            className="rounded-lg size-20"
            width={65}
            height={65}
          />
        </Pressable>

        <Pressable
          className="ml-1.5 h-24 flex justify-center max-w-[50%]"
          onPress={() => router.push("/Playing")}
        >
          <View className="flex-1 justify-center flex-col text-white">
            <TextTicker
              duration={11000}
              loop
              bounce
              scroll
              repeatSpacer={50}
              className="text-lg font-semibold pl-2 text-white"
              marqueeDelay={2000}
            >
              {currentSong.title}
            </TextTicker>
            <Text className="text-lg font-semibold pl-2 text-white">
              {currentSong.artist}
            </Text>
          </View>
        </Pressable>

        <View className="flex-row items-center gap-x-3 pl-4 h-24 w-[22%] max-w-[22%] right-0 absolute justify-end z-50">
          <SkipToLastButton iconSize={22} classNames="w-[24px]" />
          <PlayPauseButton iconSize={24} classNames="w-[24px]" />
          <SkipToNextButton iconSize={22} classNames="w-[24px]" />
        </View>
      </View>
    </View>
  );
};

export default FloatingPlayer;
