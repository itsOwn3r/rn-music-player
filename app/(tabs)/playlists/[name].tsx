import LoadingScreen from "@/components/LoadingScreen";
import { PlaylistTracksList } from "@/components/PlaylistTracksList";
import { usePlaylistStore } from "@/tools/store/usePlayerStore";
import { Playlist } from "@/types/types";
import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const PlaylistScreen = () => {
  const { name: playlistId } = useLocalSearchParams<{ name: string }>();
  const getPlaylists = usePlaylistStore((s) => s.playlists);
  const getSpeceficSystemPlaylist = usePlaylistStore(
    (s) => s.getSpeceficSystemPlaylist
  );

  const router = useRouter();

  const [playlist, setPlaylist] = useState<Playlist | null | undefined>(
    undefined
  );

  // Always update playlist when playlists or route changes
  useEffect(() => {
    let mounted = true;

    const updatePlaylist = async () => {
      if (playlistId === "most-played" || playlistId === "recent") {
        const p = await getSpeceficSystemPlaylist(playlistId);
        // console.log("p  ", p);
        if (p) {
          const firstCover = p.songs?.[0]?.coverArt;
          p.coverArt = (firstCover ?? p.coverArt ?? "") as string;
        }
        if (mounted) setPlaylist(p ?? null);
      } else {
        const found = getPlaylists.find((p) => p.id === playlistId) ?? null;
        if (mounted) setPlaylist(found);
      }
    };

    updatePlaylist();

    return () => {
      mounted = false;
    };
  }, [playlistId, getPlaylists, getSpeceficSystemPlaylist]);

  if (playlist === undefined) {
    return <LoadingScreen />;
  }

  if (!playlist) {
    console.warn(`Playlist ${playlistId} was not found!`);
    toast.warning(`Playlist ${playlistId} was not found!`);
    return <Redirect href={"/(tabs)/playlists"} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-black px-1" pointerEvents="box-none">
      <View
        className="flex-row items-center justify-between px-5 py-3 z-50"
        style={{ elevation: 10 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={26} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">{playlist.name}</Text>
        <TouchableOpacity>
          <MaterialIcons name="share" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <PlaylistTracksList playlist={playlist} playlistName={playlist.name} />
    </SafeAreaView>
  );
};

export default PlaylistScreen;
