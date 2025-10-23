import LoadingScreen from "@/components/LoadingScreen";
import { PlaylistTracksList } from "@/components/PlaylistTracksList";
import { usePlaylistStore } from "@/tools/store/usePlayerStore";
import { Playlist } from "@/types/types";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

const PlaylistScreen = () => {
  const { name: playlistId } = useLocalSearchParams<{ name: string }>();
  const getPlaylists = usePlaylistStore((s) => s.playlists);
  const getSpeceficSystemPlaylist = usePlaylistStore(
    (s) => s.getSpeceficSystemPlaylist
  );

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
    return <Redirect href={"/(tabs)/playlists"} />;
  }

  return (
    <View className="flex-1 bg-black px-1">
      <PlaylistTracksList playlist={playlist} playlistName={playlist.name} />
    </View>
  );
};

export default PlaylistScreen;
