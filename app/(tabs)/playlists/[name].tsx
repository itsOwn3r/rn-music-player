import { playlists } from "@/assets/data/playlists";
import { PlaylistTracksList } from "@/components/PlaylistTracksList";

import { Redirect, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

const PlaylistScreen = () => {
  const { name: playlistName } = useLocalSearchParams<{ name: string }>();

  const playlist = playlists.find((playlist) => playlist.id === playlistName);

  if (!playlist) {
    console.warn(`Playlist ${playlistName} was not found!`);

    return <Redirect href={"/(tabs)/playlists"} />;
  }

  return (
    <View className="flex-1 bg-black px-1">
      <PlaylistTracksList playlist={playlist} />
    </View>
  );
};

export default PlaylistScreen;
