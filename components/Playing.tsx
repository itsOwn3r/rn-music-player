import coverImage from "@/assets/placeholder2.jpg";
import Slider from "@react-native-community/slider";
import React from "react";
import { Image, Text, View } from "react-native";
import NeumorphicButton from "./NeumorphicButton";

interface Props {
  setTabSelected: React.Dispatch<React.SetStateAction<"list" | "playing">>;
}

const Playing = ({ setTabSelected }: Props) => {
  return (
    <View className="h-screen">
      <View className="flex-row justify-between items-center mx-4 mt-7">
        <NeumorphicButton
          icon="arrow-back"
          onPress={() => setTabSelected("list")}
          style="bg-gray-700 p-4"
        />
        <Text className="text-center text-white font-semibold text-sm uppercase">
          Playing Now
        </Text>
        <NeumorphicButton
          icon="menu"
          onPress={() => {}}
          style="bg-gray-700 p-4"
        />
      </View>
      <View
        className={`items-center mt-14 rounded-full border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-700 mx-auto size-96`}
      >
        <Image
          source={coverImage}
          alt="Cover Image"
          className="rounded-full shadow-lg shadow-black size-full"
          width={250}
          height={250}
        />
      </View>

      <View className="mt-14">
        <Text className="text-center text-4xl text-white font-semibold mb-1">
          Songs Title
        </Text>
        <Text className="text-center text-sm text-gray-400 font-semibold mb-1">
          Song artist name
        </Text>
      </View>

      <View className="w-full flex justify-center text-center items-center mb-4 mt-14 px-7">
        <View className="w-[95%]">
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor="#e17645"
            maximumTrackTintColor="#4a4a4a"
            thumbTintColor="#e17645"
            onSlidingComplete={() => {}}
          />
        </View>
      </View>

      <View className="flex-row justify-between mt-2 px-7">
        <Text className="text-gray-400">1:24</Text>
        <Text className="text-gray-400">3:54</Text>
      </View>

      <View className="flex flex-row justify-evenly mx-7 items-center">
        <NeumorphicButton
          icon="play-skip-back"
          onPress={() => {}}
          style="bg-gray-700 p-4"
        />
        <NeumorphicButton
          icon="pause"
          onPress={() => {}}
          style="bg-orange-800 p-4"
        />
        <NeumorphicButton
          icon="play-skip-forward"
          onPress={() => {}}
          style="bg-gray-700 p-4"
        />
      </View>
    </View>
  );
};

export default Playing;
