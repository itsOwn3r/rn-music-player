import DismissPlayerSymbol from "@/components/DismissPlayerSymbol";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Dimensions, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";
import React from "react";

import TracksList from "@/components/TracksList";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function QueueScreen() {
  const queue = usePlayerStore((s) => s.queue);
  const translateY = useSharedValue(0);
  const router = useRouter();

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 150) {
        runOnJS(router.back)();
      } else {
        // Bouncy spring back
        translateY.value = withSpring(0, {
          damping: 12, // less damping = more oscillation
          stiffness: 120, // spring stiffness
          mass: 0.8, // affects bounciness
          overshootClamping: false, // allow it to "go past" and bounce
        });
      }
    });

  // Background fade style
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: 1 - translateY.value / SCREEN_HEIGHT,
  }));

  // Card movement style
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView className="flex-1 h-screen">
      {/* Background overlay */}
      <Animated.View
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,1)",
          },
          backgroundStyle,
        ]}
      />

      {/* Draggable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
            },
            cardStyle,
          ]}
        >
          <View className="items-center my-8">
            <DismissPlayerSymbol />
          </View>
          {queue.length === 0 ? (
            <View className="flex-1 items-center justify-center bg-black">
              <Text className="text-white">Queue is empty</Text>
            </View>
          ) : (
            <TracksList
              tracks={queue} // ✅ full list OR filtered
              // extraData={currentSong?.id} // ✅ force re-render only when playing song changes
              contentContainerStyle={{
                paddingTop: 72,
                paddingBottom: 128,
              }}
              scrollEventThrottle={16}
              // onScroll={handleScroll}
              hideQueueControls
              removeClippedSubviews
              initialNumToRender={12}
              windowSize={11}
            />
          )}
        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}
