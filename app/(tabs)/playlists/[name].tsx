import { PlaylistTracksList } from "@/components/PlaylistTracksList";
import { usePlaylistStore } from "@/tools/store/usePlayerStore";

import { Redirect, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

const PlaylistScreen = () => {
  const { name: playlistName } = useLocalSearchParams<{ name: string }>();
  const getPlaylists = usePlaylistStore((s) => s.playlists);

  const playlist = getPlaylists.find(
    (playlist) => playlist.id === playlistName
  );

  if (!playlist) {
    console.warn(`Playlist ${playlistName} was not found!`);

    return <Redirect href={"/(tabs)/playlists"} />;
  }

  return (
    <View className="flex-1 bg-black px-1">
      <PlaylistTracksList playlist={playlist} playlistName={playlist.name} />
    </View>
  );
};

export default PlaylistScreen;
