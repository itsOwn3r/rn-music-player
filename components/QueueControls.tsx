import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import TrackPlayer from "react-native-track-player";

const QueueControls = ({ tracks }: { tracks: Song[] }) => {
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const playSongGeneric = usePlayerStore((s) => s.playSongGeneric);
  const handleShuffle = async () => {
    clearQueue();
    const randomIndex = Math.floor(Math.random() * tracks.length);
    // await playAnotherSongInQueue("next", "update");
    await playSongGeneric(tracks[randomIndex], {
      contextQueue: tracks,
    });
  };

  const handlePlay = async () => {
    clearQueue();
    await playSongGeneric(tracks[0], {
      contextQueue: tracks,
    });
    await TrackPlayer.play();
  };

  return (
    <View className="flex flex-row items-center justify-center gap-x-8 w-full mb-2 ">
      {/* Play button */}
      <View className="w-1/3">
        <TouchableOpacity onPress={handlePlay}>
          <View
            className={
              "p-3 bg-[rgba(47,47,47,0.5)] rounded-lg flex-row justify-center items-center gap-x-2 w-full"
            }
          >
            <FontAwesome6 name="play" size={24} color="#fff" />

            <Text className="text-white font-semibold text-lg text-center">
              Play
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Shuffle button */}
      <View className="w-1/3">
        <TouchableOpacity
          onPress={handleShuffle}
          activeOpacity={0.8}
          className="p-3 bg-[rgba(47,47,47,0.5)] rounded-lg flex-row justify-center items-center gap-x-2"
        >
          <Ionicons name="shuffle" size={22} color="#fff" />
          <Text className="text-white font-semibold text-lg text-center">
            Shuffle
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QueueControls;
