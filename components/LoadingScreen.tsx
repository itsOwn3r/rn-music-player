import React from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const LoadingScreen = () => {
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const dotPosition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(dotPosition, {
        toValue: 1,
        duration: 3000, // Adjust for dot speed
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const dotX = dotPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [54 - 8, 54 - 8], // Radius - dotRadius to position correctly
  });

  const dotY = dotPosition.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1], // Define key points for circular motion
    outputRange: [-54 + 8, -8, 54 - 8, -8, -54 + 8], // Radius - dotRadius.  Top, Right, Bottom, Left
  });

  return (
    <View className="flex-1 bg-[#121212] justify-center items-center">
      {/* Glowing Circle */}
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ rotate: spin }],
          },
        ]}
        className="w-32 h-32 rounded-full border-4 border-[#29abe2] shadow-lg shadow-[#29abe2]/50 relative"
      >
        {/* White Dot */}
        <Animated.View
          style={{
            position: "absolute",
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "white",
            top: 54 - 8, // Centers vertically
            left: 54 - 8, // Centers horizontally.
            transform: [{ translateX: dotX }, { translateY: dotY }],
          }}
        />
      </Animated.View>

      {/* Text with neumorphism effect */}
      <Text className="text-3xl font-bold text-white mt-8 shadow-md">
        Loading Music...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    // Additional styles if needed.  For example:
    // borderColor: '#29abe2',
    // borderWidth: 4,
    // borderRadius: 64,
    // width: 128,
    // height: 128
  },
});

export default LoadingScreen;
