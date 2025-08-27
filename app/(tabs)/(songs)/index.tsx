import TracksList from "@/components/TracksList";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_MAX_HEIGHT = 50;
const HEADER_MIN_HEIGHT = 0;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const SongsScreen = () => {
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedY = Animated.diffClamp(scrollY, 0, HEADER_SCROLL_DISTANCE);

  const headerTranslateY = clampedY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        scrollY.stopAnimation();
        scrollY.setValue(0);
      }
    });
    return () => sub.remove();
  }, [scrollY]);

  // 👇 wrap your list component in Animated
  const AnimatedTracksList = Animated.createAnimatedComponent(TracksList);

  return (
    <View className="flex-1 bg-black">
      <Animated.View
        className="absolute left-0 right-0 bg-neutral-900 px-4 pb-2 z-10"
        style={{
          paddingTop: insets.top,
          transform: [{ translateY: headerTranslateY }],
          elevation: 8,
        }}
      >
        <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
          <TextInput
            className="text-white text-base flex-1 py-2"
            placeholder="Find in songs"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity className="pl-2 py-2">
            <Ionicons name="search" color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <AnimatedTracksList
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_MAX_HEIGHT + 12,
          paddingBottom: insets.bottom + 36,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        removeClippedSubviews
        initialNumToRender={12}
        windowSize={11}
        extraData={search}
      />
    </View>
  );
};

export default SongsScreen;
