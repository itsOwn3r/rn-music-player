import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import axios from "axios";
import React, { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

const PlayerVolumeBar = () => {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);

  const handleVolumeChange = useCallback(
    async (type: "increase" | "decrease", vol?: number) => {
      let newVolume = volume;

      if (vol) {
        newVolume = vol;
      } else if (type === "increase") {
        newVolume = Math.min(1, volume + 0.05);
      } else {
        newVolume = Math.max(0.0009, volume - 0.05);
      }

      setVolume(newVolume);
      try {
        const response = await axios.post(
          "http://192.168.1.108:3001/api/music/volume",
          { volume: Number(Math.ceil(newVolume * 100)) }
        );

        if (response.data.success) {
          toast.success(`New Volume: ${Number(Math.ceil(newVolume * 100))}`);
        } else {
          toast.error(
            `Error in changing volume! message: ${response.data.message}`
          );
        }
      } catch (error) {
        toast.error(`"Change Volume failed: ", ${error}`);
      }
    },
    [volume, setVolume]
  );

  return (
    <View className="w-full mt-6 justify-center items-center">
      <View className="w-8/12 flex-row items-center space-x-2">
        <TouchableOpacity onPress={() => handleVolumeChange("decrease")}>
          <Ionicons name="volume-low" size={20} color="#fff" />
        </TouchableOpacity>

        <Slider
          style={{ flex: 1, height: 40 }}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onSlidingComplete={(val) => handleVolumeChange("increase", val)}
          minimumTrackTintColor="#e17645"
          maximumTrackTintColor="#4a4a4a"
          thumbTintColor="#e17645"
        />

        <TouchableOpacity onPress={() => handleVolumeChange("increase")}>
          <Ionicons name="volume-high" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PlayerVolumeBar;
