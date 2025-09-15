import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useCallback, useState } from "react";
import { TouchableOpacity, View } from "react-native";

const PlayerVolumeBar = () => {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);

  const [tempVolume, setTempVolume] = useState(volume);

  React.useEffect(() => {
    setTempVolume(volume);
  }, [volume]);

  const handleVolumeChange = useCallback(
    (type: "increase" | "decrease") => {
      let newVolume = volume;

      if (type === "increase") {
        newVolume = Math.min(1, volume + 0.05);
      } else {
        newVolume = Math.max(0.0009, volume - 0.05);
      }

      setVolume(newVolume);
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
          value={tempVolume}
          onValueChange={(val) => setTempVolume(val)}
          onSlidingComplete={(val) => setVolume(val)}
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
