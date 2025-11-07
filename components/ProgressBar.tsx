import formatDuration from "@/tools/formatDuration";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import Slider from "@react-native-community/slider";
import React from "react";
import { Text, View } from "react-native";
import { useProgress } from "react-native-track-player";

const ProgressBar = React.memo(
  ({ queueIndex }: { queueIndex: string | number }) => {
    const handleChangeSongPosition = usePlayerStore(
      (s) => s.handleChangeSongPosition
    );
    const { position, duration } = useProgress();

    return (
      <>
        <View className="flex-row justify-between px-7 mt-4 items-center">
          <Text className="text-gray-400">{formatDuration(position)}</Text>
          {queueIndex && queueIndex !== 0 ? (
            <Text className="text-gray-400 text-xs bg-slate-400/25 items-center rounded-full py-0.5 px-1">
              {queueIndex}
            </Text>
          ) : null}
          <Text className="text-gray-400">{formatDuration(duration)}</Text>
        </View>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={(val) => handleChangeSongPosition(val)}
          minimumTrackTintColor="#e17645"
          maximumTrackTintColor="#4a4a4a"
          thumbTintColor="#e17645"
        />
      </>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
