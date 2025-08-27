import TracksList from "@/components/TracksList";
import React from "react";
import { View } from "react-native";

const SongsScreen = () => {
  return (
    <View className="flex-1 bg-[#000] text-white">
      {/* <ScrollView> */}
      <TracksList scrollEnabled />
      {/* </ScrollView> */}
    </View>
  );
};

export default SongsScreen;
