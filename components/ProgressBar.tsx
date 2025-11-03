import formatDuration from "@/tools/formatDuration";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import Slider from "@react-native-community/slider";
import React from "react";
import { Text, View } from "react-native";

const ProgressBar = React.memo(() => {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const handleChangeSongPosition = usePlayerStore(
    (s) => s.handleChangeSongPosition
  );
  return (
    <>
      <View className="flex-row justify-between px-7 mt-4">
        <Text className="text-gray-400">{formatDuration(position)}</Text>
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
});

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
