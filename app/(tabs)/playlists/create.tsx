import { unknownTrackImageUri } from "@/constants/images";
import { usePlaylistStore } from "@/tools/store/usePlayerStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
// import { usePlaylistStore } from "@/tools/store/usePlaylistStore";

const CreatePlaylist = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);

  const handleCreatePlaylist = () => {
    if (!name.trim()) return;
    addPlaylist(name.trim(), description);
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-black px-6"
      style={{
        paddingBottom: insets.bottom === 0 ? 16 : insets.bottom,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center"
      >
        {/* Title */}
        <Text className="text-3xl font-bold text-white mb-10 text-center">
          Create Playlist
        </Text>

        {/* Input field */}
        <View className="bg-neutral-900 rounded-2xl px-4 py-3 border border-neutral-800 mb-6">
          <TextInput
            className="text-white text-lg"
            placeholder="Playlist name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        {/* Input field */}
        <View className="bg-neutral-900 rounded-2xl px-4 py-3 border border-neutral-800 mb-6">
          <TextInput
            className="text-white text-lg"
            placeholder="Playlist Description"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Live Preview */}
        <View className="bg-neutral-900 rounded-2xl p-4 mb-8 border border-neutral-800">
          <View className="flex-row items-center">
            {/* Placeholder cover */}
            <Image
              source={{ uri: unknownTrackImageUri }}
              className="w-16 h-16 rounded-lg bg-neutral-800"
            />
            <View className="ml-4 flex-1">
              <Text
                className={`text-lg font-semibold ${
                  name.trim() ? "text-white" : "text-neutral-500"
                }`}
              >
                {name.trim() || "New Playlist"}
              </Text>
              <Text className="text-neutral-400 text-sm">
                0 songs • From You {description && ` • ${description}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Fancy button */}
        <TouchableOpacity
          disabled={!name.trim()}
          onPress={handleCreatePlaylist}
          activeOpacity={0.8}
          className={`rounded-2xl overflow-hidden shadow-lg ${
            !name.trim() ? "opacity-50" : ""
          }`}
        >
          <LinearGradient
            colors={["#7C3AED", "#4F46E5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 flex-row justify-center items-center"
          >
            <Ionicons name="pulse" size={22} color="white" className="mr-2" />
            <Text className="text-white text-lg font-semibold">
              Create Playlist
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePlaylist;
