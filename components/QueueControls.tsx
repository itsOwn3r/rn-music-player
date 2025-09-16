import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { PlayPauseButton } from "./PlayerControls";

const QueueControls = ({ tracks }: { tracks: Song[] }) => {
  const playSong = usePlayerStore((s) => s.playSong);

  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    playSong(randomIndex);
  };
  return (
    <View className="flex flex-row items-center justify-center gap-x-8 w-full mt-3 mb-2">
      {/* Play button */}
      <View className="w-1/3">
        <PlayPauseButton iconSize={22} text="Play Or Pause" />
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
