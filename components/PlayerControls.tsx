import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type PlayerButtonsProps = {
  classNames?: string;
  iconSize?: number;
};

export const PlayPauseButton = ({
  classNames,
  iconSize,
}: PlayerButtonsProps) => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playPauseMusic = usePlayerStore((s) => s.playPauseMusic);
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const engine = usePlayerStore((s) => s.engine);

  const handlePlayPause = async () => {
    if (!engine?.isLoaded && currentSong?.uri) {
      engine?.replace({ uri: currentSong.uri });
      engine?.seekTo(0);
      await playSong(currentSong?.index || 0);
    } else {
      await playPauseMusic();
    }
  };
  return (
    <TouchableOpacity onPress={handlePlayPause} className={classNames}>
      <View>
        <FontAwesome6
          name={isPlaying ? "pause" : "play"}
          size={iconSize}
          color="#fff"
        />
      </View>
    </TouchableOpacity>
  );
};

export const SkipToLastButton = ({
  classNames,
  iconSize,
}: PlayerButtonsProps) => {
  const currentSongIndex = usePlayerStore((s) => s.currentSongIndex);
  const playSong = usePlayerStore((s) => s.playSong);
  return (
    <TouchableOpacity
      onPress={() => playSong(currentSongIndex - 1)}
      className={classNames}
    >
      <FontAwesome6 name="backward-step" size={iconSize} color="#fff" />
    </TouchableOpacity>
  );
};

export const SkipToNextButton = ({
  classNames,
  iconSize,
}: PlayerButtonsProps) => {
  const currentSongIndex = usePlayerStore((s) => s.currentSongIndex);
  const playSong = usePlayerStore((s) => s.playSong);
  return (
    <TouchableOpacity
      onPress={() => playSong(currentSongIndex + 1)}
      className={classNames}
    >
      <FontAwesome6 name="forward-step" size={iconSize} color="#fff" />
    </TouchableOpacity>
  );
};

export const ShuffleHandler = ({
  classNames,
  iconSize,
}: PlayerButtonsProps) => {
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  return (
    <TouchableOpacity onPress={toggleShuffle} className={classNames}>
      <FontAwesome6
        name="shuffle"
        size={iconSize}
        color={shuffle ? "#fff" : "#666"}
      />
    </TouchableOpacity>
  );
};

export const RepeatHandler = ({ classNames, iconSize }: PlayerButtonsProps) => {
  const repeat = usePlayerStore((s) => s.repeat);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);

  return (
    <TouchableOpacity
      onPress={toggleRepeat}
      className={`relative ${classNames}`}
    >
      <FontAwesome6
        name="repeat"
        size={iconSize}
        color={repeat === "off" ? "#666" : "#fff"}
      />
      {repeat === "one" && (
        <View
          className="absolute bg-white rounded-full items-center justify-center"
          style={{
            width: 14,
            height: 14,
            top: "50%",
            left: "50%",
            transform: [{ translateX: -7 }, { translateY: -7 }], // centers the circle
          }}
        >
          <Text className="text-[10px] font-bold text-black">1</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
