import coverImage from "@/assets/placeholder2.jpg";
import formatDuration from "@/tools/formatDuration";
import { Song } from "@/types/types";
import { Entypo } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import NeumorphicButton from "./NeumorphicButton";

interface Props {
  files: Song[];
  setTabSelected: React.Dispatch<React.SetStateAction<"list" | "playing">>;
  playSong: (number: number) => void;
  setCurrentSongIndex: React.Dispatch<React.SetStateAction<number>>;
  currentSong: Song | null;
}

const MusicList = ({
  files,
  setTabSelected,
  playSong,
  setCurrentSongIndex,
  currentSong,
}: Props) => {
  // console.log(files);

  const selectPlayingSong = (songIndex: number) => {
    if (songIndex === currentSong?.index) {
      setTabSelected("playing");
    } else {
      console.log("song indx", songIndex);
      playSong(songIndex);
      setTabSelected("playing");
    }
  };

  return (
    <View className="h-screen">
      <Text className="text-center mt-3 text-white font-semibold text-sm">
        <Text>{currentSong?.artist || "Artist"}</Text>{" "}
        <Entypo name="dot-single" size={18} color="white" />{" "}
        <Text>{currentSong?.title || "Title"}</Text>
      </Text>
      <View className="my-16">
        <View className="flex items-center flex-row justify-between px-7">
          <NeumorphicButton
            icon="heart"
            style="p-4 bg-gray-700"
            onPress={() => {}}
          />
          <View
            className={`rounded-full border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-700`}
          >
            <Image
              source={
                currentSong?.coverArt
                  ? { uri: currentSong.coverArt }
                  : coverImage
              }
              alt="Cover Image"
              className="rounded-full shadow-lg shadow-black size-52"
              width={250}
              height={250}
            />
          </View>
          <NeumorphicButton
            icon="ellipsis-horizontal"
            style="p-4 bg-gray-700"
            onPress={() => setTabSelected("playing")}
          />
        </View>
      </View>

      <ScrollView>
        <View className="px-4 w-full">
          {files.map((music, i) => (
            <TouchableOpacity
              onPress={() => selectPlayingSong(music.index)}
              key={music.uri ?? `${music.filename}-${i}`}
              className={`flex-row justify-between items-center px-4 py-5 rounded-2xl ${currentSong?.index === music.index ? "bg-black" : "bg-transparent"}`}
            >
              <View className="flex-1">
                <Text className="text-white text-xl">{music.title}</Text>
                <View className="justify-between flex-row items-center">
                  <Text className="text-gray-300 text-sm">{music.artist}</Text>
                  <Text className="text-gray-400 text-sm mr-4">
                    {formatDuration(music.duration) || "0:00"}
                  </Text>
                </View>
              </View>
              <NeumorphicButton
                icon={currentSong?.index === music.index ? "pause" : "play"}
                style={`p-2 ${currentSong?.index === music.index ? "bg-orange-700" : "bg-gray-800"}`}
                onPress={() => selectPlayingSong(music.index)}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default MusicList;
