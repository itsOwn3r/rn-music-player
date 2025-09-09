import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DismissPlayerSymbol = () => {
  const { top } = useSafeAreaInsets();
  return (
    <View
      style={{ top: top + 8 }}
      className="absolute left-0 right-0 flex-row justify-center"
    >
      <View
        accessible={false}
        className="w-16 h-2 rounded-lg bg-white opacity-80"
      />
    </View>
  );
};

export default DismissPlayerSymbol;
