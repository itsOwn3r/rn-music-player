import { MusicType } from "@/data/musicTypes";
import React from "react";
import { Text, View } from "react-native";

interface Props {
  musicData: MusicType[];
  setTabSelected: React.Dispatch<React.SetStateAction<"list" | "playing">>;
}

const MusicList = ({ musicData, setTabSelected }: Props) => {
  return (
    <View className="flex h-screen items-center justify-center">
      <Text
        className="text-3xl font-semibold"
        onPress={() => setTabSelected("playing")}
      >
        Music List
      </Text>
    </View>
  );
};

export default MusicList;
