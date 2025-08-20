import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { GestureResponderEvent, TouchableOpacity, View } from "react-native";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: (event: GestureResponderEvent) => void;
  style?: string;
}

const NeumorphicButton = ({
  icon,
  onPress,
  style = "p-6 bg-gray-600",
}: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-transparent rounded-full border-2 border-[#2a2d2fcd] shadow-inner shadow-gray-800`}
    >
      <View className={`${style} rounded-full border border-gray-700`}>
        <View>
          <Ionicons
            name={icon}
            size={24}
            color="#353030f4"
            className="absolute left-0.5 top-0.5"
          />
          <Ionicons name={icon} size={24} color="#ccc" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NeumorphicButton;
