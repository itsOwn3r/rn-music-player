import { unknownTrackImageUri } from "@/constants/images";
import { Playlist } from "@/types/types";
import React from "react";
import { FlatList, Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlaylistListItem } from "./PlaylistListItem";

const ItemDivider = () => (
  <View className="opacity-30 border-[#9ca3af88] border my-[5px] ml-[0px]" />
);

const PlaylistsList = ({
  playlists,
  onPlaylistPress: handlePlaylistPress,

  scrollEnabled,
  ...flatListProps
}: {
  playlists: Playlist[];
  onPlaylistPress: (playlistId: string) => void;
  scrollEnabled?: boolean;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <FlatList
      className="flex-1 size-full mt-10"
      style={{
        paddingBottom: insets.bottom + 90,
        marginTop: insets.top + 60,
        elevation: 12,
      }}
      data={playlists}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={ItemDivider}
      ListFooterComponent={ItemDivider}
      scrollEnabled
      ListEmptyComponent={
        <View>
          <Text className="text-center mt-5">No playlist found</Text>

          <Image
            source={{ uri: unknownTrackImageUri }}
            className="size-[200px] self-center mt-10 opacity-30"
          />
        </View>
      }
      // ListHeaderComponentStyle={{ margin: 0, padding: 0 }}
      renderItem={({ item: playlist }) => (
        <PlaylistListItem
          playlist={playlist}
          onPress={() => handlePlaylistPress(playlist.id)}
        />
      )}
      {...flatListProps}
    />
  );
};

export default PlaylistsList;
