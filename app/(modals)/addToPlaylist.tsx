import DismissPlayerSymbol from "@/components/DismissPlayerSymbol";
import LoadingScreen from "@/components/LoadingScreen";
import PlaylistsList from "@/components/PlaylistsList";
import { usePlayerStore, usePlaylistStore } from "@/tools/store/usePlayerStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AddToPlaylist() {
  const { trackUri } = useLocalSearchParams<{ trackUri: string }>();
  // const isLoading = usePlayerStore((s) => s.isLoading);
  const isLoading = usePlaylistStore((s) => s.isLoading);
  const setIsLoading = usePlaylistStore((s) => s.setIsLoading);

  const loadPlaylists = usePlaylistStore((s) => s.loadPlaylists);

  useFocusEffect(
    useCallback(() => {
      const fetchPlaylists = async () => {
        try {
          setIsLoading(true);
          await loadPlaylists("user");
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPlaylists();
    }, [loadPlaylists, setIsLoading])
  );

  const getPlaylists = usePlaylistStore((s) => s.playlists);
  const addTrackToPlaylist = usePlaylistStore((s) => s.addTrackToPlaylist);

  const files = usePlayerStore((s) => s.files);

  const track = files.filter(
    (item) => decodeURIComponent(item.uri) === trackUri
  );

  const [search, setSearch] = useState("");

  const filteredPlaylists = useMemo(() => {
    if (search.trim() === "") return getPlaylists;
    const lowerSearch = search.toLowerCase();
    return getPlaylists.filter(
      (t) =>
        t?.name?.toLowerCase().includes(lowerSearch) ||
        t?.description?.toLowerCase().includes(lowerSearch)
    );
  }, [getPlaylists, search]);

  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(0);
  const router = useRouter();

  // Background fade style
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: 1 - translateY.value / SCREEN_HEIGHT,
  }));

  // Card movement style
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!track) {
    return null;
  }

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

  const onPlaylistPress = async (playlistId: string) => {
    addTrackToPlaylist(playlistId, track[0].id || "");
    router.dismiss();
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView
      className="flex-1 h-screen overflow-y-scroll"
      style={{
        paddingBottom: insets.bottom === 0 ? 10 : insets.bottom - 20,
        // paddingTop: insets.top === 0 ? 30 : insets.top,
        elevation: 2,
      }}
    >
      <Animated.View
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          backgroundStyle,
        ]}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View
          className="size-full flex-1 overflow-y-scroll"
          style={[
            {
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.9)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflowY: "scroll",
            },
            cardStyle,
          ]}
        >
          <View className="items-center my-8">
            <DismissPlayerSymbol />
          </View>
          <View className="absolute left-0 right-0 bg-neutral-900 px-4 pb-2 z-10 mt-16">
            <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
              <TextInput
                className="text-white text-base flex-1 py-2"
                placeholder="Search in Playlists"
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity
                  className="pl-2 py-2"
                  onPress={() => setSearch("")}
                >
                  <Ionicons name="close" color="red" size={20} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity className="pl-2 py-2">
                  <Ionicons name="search" color="#fff" size={20} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View className="flex-1 h-screen flex flex-row">
            <PlaylistsList
              playlists={filteredPlaylists}
              onPlaylistPress={onPlaylistPress}
              scrollEnabled={true}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}
