import { fetchLyrics } from "@/tools/fetchLyrics";
import { usePlayerStore, usePlaylistStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { useRouter } from "expo-router";
import React, { PropsWithChildren, useState } from "react";
import {
  ActionSheetIOS,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

type TrackShortcutsMenuProps = PropsWithChildren<{
  track: Song;
  isInPlaylist: boolean;
  playlistId?: string;
}>;

const TrackShortcutsMenu = ({
  track,
  children,
  isInPlaylist,
  playlistId,
}: TrackShortcutsMenuProps) => {
  const router = useRouter();
  const toggleFavorite = usePlaylistStore((s) => s.toggleFavorite);
  const removeTrackFromPlaylist = usePlaylistStore(
    (s) => s.removeTrackFromPlaylist
  );
  const isFavorite = usePlaylistStore((s) => s.isFavorite(track.uri));

  const setLyrics = usePlayerStore((s) => s.setLyrics);

  const [visible, setVisible] = useState(false);

  const doToggleFavorite = () => {
    toggleFavorite(track.id || "");
    setVisible(false);
  };

  const doAddToPlaylist = () => {
    setVisible(false);
    router.push({
      pathname: "/(modals)/addToPlaylist",
      params: { trackUri: track.uri },
    });
  };

  const handleActionIndex = (index: number) => {
    if (index === 0) doToggleFavorite();
    else if (index === 1) doAddToPlaylist();
  };

  const removeFromPlaylist = () => {
    if (!playlistId) return;
    removeTrackFromPlaylist(playlistId, track.id || "");
  };

  const goToAlbum = () => {
    if (!track.album) {
      toast.error("Sorry! There is no Album");
      return;
    }
    router.push({
      pathname: "/album/[name]",
      params: { name: track.album },
    });
    setVisible(false);
  };

  const openMenu = () => {
    if (Platform.OS === "ios") {
      const favoriteLabel = isFavorite
        ? "Remove from Favorites"
        : "Add to Favorites";
      const options = [favoriteLabel, "Add to playlist", "Cancel"];
      const cancelButtonIndex = 2;
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        handleActionIndex
      );
    } else {
      setVisible(true);
    }
  };

  return (
    <>
      <Pressable onPress={openMenu}>{children}</Pressable>

      {/* Fancy dark modal menu for Android / Expo Go */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="bg-black/60 justify-end size-full"
          onPress={() => setVisible(false)}
        >
          <View
            className="bg-[#1c1c1e] rounded-t-2xl shadow-lg justify-end"
            style={{ justifyContent: "flex-end", paddingBottom: 20 }}
          >
            <TouchableOpacity
              className="px-5 py-4 border-b border-white/10"
              onPress={() => fetchLyrics(track, setLyrics)}
            >
              <Text className="text-base text-gray-100">⬇ Fetch Lyrics</Text>
            </TouchableOpacity>

            {track.album && (
              <TouchableOpacity
                className="px-5 py-4 border-b border-white/10"
                onPress={goToAlbum}
              >
                <Text className="text-base text-gray-100">🎶 Show Album</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="px-5 py-4 border-b border-white/10"
              onPress={doAddToPlaylist}
            >
              <Text className="text-base text-gray-100">
                ➕ Add to Playlist
              </Text>
            </TouchableOpacity>

            {isInPlaylist && (
              <TouchableOpacity
                className="px-5 py-4 border-b border-white/10"
                onPress={removeFromPlaylist}
              >
                <Text className="text-base text-gray-100">
                  ❌ Remove from Playlist
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="px-5 py-4 border-b border-white/10"
              onPress={doToggleFavorite}
            >
              <Text className="text-base text-gray-100">
                {isFavorite ? "★ Remove from Favorites" : "☆ Add to Favorites"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-4 mt-1 border-t border-white/20"
              onPress={() => setVisible(false)}
            >
              <Text className="text-base text-red-500 font-semibold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default TrackShortcutsMenu;
