import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type PlayerButtonsProps = {
  classNames?: string;
  iconSize?: number;
  text?: string;
};

const HOLD_THRESHOLD = 300;
const HOLD_INTERVAL = 200;

export const PlayPauseButton = ({
  classNames,
  iconSize = 30,
  text,
}: PlayerButtonsProps) => {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playPauseMusic = usePlayerStore((s) => s.playPauseMusic);
  const playSongGeneric = usePlayerStore((s) => s.playSongGeneric);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const engine = usePlayerStore((s) => s.engine);
  const position = usePlayerStore((s) => s.position);

  const handlePlayPause = async () => {
    if (!engine?.isLoaded && currentSong?.uri) {
      engine?.replace({ uri: currentSong.uri });
      engine?.seekTo(position ? position : 0);
      await playSongGeneric(currentSong);
    } else {
      await playPauseMusic();
    }
  };

  return (
    <TouchableOpacity onPress={handlePlayPause} className={classNames}>
      <View className="flex-row justify-center items-center">
        <FontAwesome6
          name={isPlaying ? "pause" : "play"}
          size={iconSize}
          color="#fff"
          style={{ width: iconSize, textAlign: "center" }}
        />
        {text && (
          <Text className="text-white font-semibold text-lg text-center ml-2">
            {isPlaying ? "Pause" : "Play"}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const SkipToLastButton = ({
  classNames,
  iconSize = 30,
}: PlayerButtonsProps) => {
  const playAnotherSongInQueue = usePlayerStore(
    (s) => s.playAnotherSongInQueue
  );
  const handlebackwardPosition = usePlayerStore(
    (s) => s.handlebackwardPosition
  );

  const startRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didStartHoldRef = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const onPressIn = () => {
    // record start time
    startRef.current = Date.now();
    didStartHoldRef.current = false;

    // schedule starting the repeated interval after the threshold
    holdTimeoutRef.current = setTimeout(() => {
      didStartHoldRef.current = true;
      intervalRef.current = setInterval(() => {
        handlebackwardPosition();
      }, HOLD_INTERVAL);
    }, HOLD_THRESHOLD);
  };

  const onPressOut = () => {
    const now = Date.now();
    const start = startRef.current ?? now;
    const duration = now - start;

    // clear any timers / intervals
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // if we started the hold behavior, treat as hold -> do nothing more
    if (didStartHoldRef.current) {
      didStartHoldRef.current = false;
      startRef.current = null;
      return;
    }

    // otherwise it's a tap (duration < threshold)
    if (duration < HOLD_THRESHOLD) {
      playAnotherSongInQueue("previous");
    }

    startRef.current = null;
  };

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      className={classNames}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-center items-center">
        <FontAwesome6 name="backward-step" size={iconSize} color="#fff" />
      </View>
    </TouchableOpacity>
  );
};

export const SkipToNextButton = ({
  classNames,
  iconSize = 30,
}: PlayerButtonsProps) => {
  const playAnotherSongInQueue = usePlayerStore(
    (s) => s.playAnotherSongInQueue
  );
  const handleForwardPosition = usePlayerStore((s) => s.handleForwardPosition);

  const startRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didStartHoldRef = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const onPressIn = () => {
    startRef.current = Date.now();
    didStartHoldRef.current = false;

    holdTimeoutRef.current = setTimeout(() => {
      didStartHoldRef.current = true;
      intervalRef.current = setInterval(() => {
        handleForwardPosition();
      }, HOLD_INTERVAL);
    }, HOLD_THRESHOLD);
  };

  const onPressOut = async () => {
    const now = Date.now();
    const start = startRef.current ?? now;
    const duration = now - start;

    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (didStartHoldRef.current) {
      didStartHoldRef.current = false;
      startRef.current = null;
      return;
    }

    if (duration < HOLD_THRESHOLD) {
      await playAnotherSongInQueue("next");
    }

    startRef.current = null;
  };

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      className={classNames}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-center items-center">
        <FontAwesome6 name="forward-step" size={iconSize} color="#fff" />
      </View>
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
        className="text-center"
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
        className="text-center"
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
