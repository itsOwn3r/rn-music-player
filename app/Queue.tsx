// app/Queue.tsx

import DismissPlayerSymbol from "@/components/DismissPlayerSymbol";
import TracksList from "@/components/TracksList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types"; // ✅ Import Song type
import { useRouter } from "expo-router";
// ✅ Import React hooks and FlatList type
import React, { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  FlatList,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
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
  const currentSong = usePlayerStore((s) => s.currentSong);
  const translateY = useSharedValue(0);

  // ✨ 1. Create a ref for the FlatList
  const flatListRef = useRef<FlatList<Song>>(null);

  // ✨ 2. Add a useEffect to scroll to the item
  useEffect(() => {
    if (!currentSong || !queue.length) return;

    const songIndex = queue.findIndex((track) => track.uri === currentSong.uri);

    // Only scroll if the song is found in the queue
    if (songIndex !== -1) {
      // Use a timeout to ensure the list has had time to render.
      // This is a common pattern in React Native to avoid race conditions.
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: songIndex,
          animated: true,
          viewPosition: 0.5, // 0.5 scrolls the item to the center
        });
      }, 250); // 250ms delay

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [currentSong, queue]); // Rerun if the song or queue changes

  // ... (panGesture and animated styles remain unchanged)
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
          overshootClamping: false,
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
              // ✨ 3. Pass the ref to the TracksList component
              ref={flatListRef}
              tracks={queue}
              isInQueue={true}
              contentContainerStyle={{
                paddingTop: 72,
                paddingBottom: 128,
              }}
              scrollEventThrottle={16}
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
