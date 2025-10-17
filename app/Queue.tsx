// app/Queue.tsx

import DismissPlayerSymbol from "@/components/DismissPlayerSymbol";
import TracksList from "@/components/TracksList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
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
  const router = useRouter();
  const queue = usePlayerStore((s) => s.queue);
  const translateY = useSharedValue(0);

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
        translateY.value = withSpring(0, {
          damping: 12,
          stiffness: 120,
          mass: 0.8,
        });
      }
    });

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: 1 - translateY.value / SCREEN_HEIGHT,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <SafeAreaView className="flex-1">
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(0,0,0,1)" },
          backgroundStyle,
        ]}
      />
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
              tracks={queue}
              isInQueue
              hideQueueControls
              autoScrollToCurrent
              contentContainerStyle={{ paddingTop: 72, paddingBottom: 128 }}
              scrollEventThrottle={16}
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
