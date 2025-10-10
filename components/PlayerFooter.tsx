import { Song } from "@/types/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { MaterialIcons } from "@expo/vector-icons";

const PlayerFooter = ({ currentSong }: { currentSong: Song | null }) => {
  const router = useRouter();

  const addToPlaylist = () => {
    router.push({
      pathname: "/(modals)/addToPlaylist",
      params: { trackUri: currentSong?.uri },
    });
  };

  const openLyrics = () => {
    // TODO toggle lyrics
  };

  // const openComments = () => {
  //   router.push({
  //     pathname: "/(modals)/comments",
  //     params: { trackUri: currentSong?.uri },
  //   });
  // };

  const openArtistPage = () => {
    if (currentSong?.artist)
      router.replace({
        pathname: "/(tabs)/artists/[name]",
        params: { name: currentSong.artist },
      });
  };

  const buttonData = [
    {
      icon: "playlist-add",
      label: "Playlist",
      onPress: addToPlaylist,
    },
    {
      icon: "lyrics",
      label: "Lyrics",
      onPress: openLyrics,
    },
    // {
    //   icon: "insert-comment",
    //   label: "Comments",
    //   onPress: openComments,
    // },
    {
      icon: "person-4",
      label: "Artist",
      onPress: openArtistPage,
    },
  ];
  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={FadeOut.duration(300)}
      className="w-full px-6"
    >
      {/* Neon gradient background */}
      <LinearGradient
        colors={["#0f0f0f", "#1a1a1a", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View className="flex-row justify-around items-center">
          {buttonData.map((btn, idx) => (
            <AnimatedButton key={idx} {...btn} />
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Reusable animated button component
const AnimatedButton = ({
  icon: Icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const [showLabel, setShowLabel] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: withTiming(glow.value, { duration: 150 }),
    shadowRadius: withTiming(glow.value * 12, { duration: 150 }),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 10, stiffness: 200 });
    glow.value = 1;
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8 });
    glow.value = 0;
  };

  const handleLongPress = () => {
    setShowLabel(true);
    setTimeout(() => setShowLabel(false), 1200);
  };

  return (
    <View className="items-center justify-center relative">
      <Animated.View
        style={[
          animatedStyle,
          {
            shadowColor: "#00FFFF",
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          activeOpacity={0.8}
          className="size-14 rounded-full bg-[#111] border border-[#2b2b2b] justify-center items-center"
        >
          <MaterialIcons name={Icon} size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Floating tooltip label */}
      {/* <View className="w-full flex justify-center items-center flex-1 relative"> */}
      {showLabel && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          className="absolute -top-8 px-0 text-center justify-center items-center w-full py-1 bg-[#00ffff33] rounded-xl border border-[#00ffff55]"
        >
          <View className="flex flex-col">
            <Text className="text-xs text-[#00ffff] font-semibold text-center ">
              {label}
            </Text>
          </View>
        </Animated.View>
      )}
      {/* </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    borderRadius: 22,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: "#2b2b2b",
    shadowColor: "#00FFFF",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});

export default PlayerFooter;
