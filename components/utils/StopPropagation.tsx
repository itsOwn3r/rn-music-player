import React, { PropsWithChildren } from "react";
import { View } from "react-native";

const StopPropagation = ({ children }: PropsWithChildren) => {
  return (
    <View
      onStartShouldSetResponder={() => true}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {children}
    </View>
  );
};

export default StopPropagation;
