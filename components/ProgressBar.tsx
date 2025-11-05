import formatDuration from "@/tools/formatDuration";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import Slider from "@react-native-community/slider";
import axios from "axios";
import React from "react";
import { Text, View } from "react-native";
import { useProgress } from "react-native-track-player";
import { toast } from "sonner-native";

const ProgressBar = React.memo(() => {
  const handleChangeSongPosition = usePlayerStore(
    (s) => s.handleChangeSongPosition
  );
  const { position, duration } = useProgress();

  const handlePosition = async (position: number) => {
    try {
      const response = await axios.post(
        "http://192.168.1.108:3001/api/music/position",
        { position }
      );

      if (response.data.success) {
        toast.success(`New Position: ${Number(Math.ceil(position * 100))}`);
      } else {
      }
      handleChangeSongPosition(position);
    } catch (error) {
      toast.error(`"Change Position failed: ", ${error}`);
    }
  };

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
        onSlidingComplete={(val) => handlePosition(val)}
        minimumTrackTintColor="#e17645"
        maximumTrackTintColor="#4a4a4a"
        thumbTintColor="#e17645"
      />
    </>
  );
});

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
