import { unknownTrackImageUri } from "@/constants/images";
import { Playlist } from "@/types/types";
import { useRouter } from "expo-router";
import React from "react";
import { Button, FlatList, Image, Text, View } from "react-native";
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
  const router = useRouter();
  return (
    <FlatList
      className="flex-1 size-full mt-16 overflow-y-scroll"
      style={{
        // paddingBottom: insets.bottom + 150,
        marginBottom: insets.bottom === 0 ? 150 : insets.bottom + 90,
        // paddingTop: insets.top,
        elevation: 4,
        flex: 1,
      }}
      data={playlists}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={true}
      ItemSeparatorComponent={ItemDivider}
      ListFooterComponent={ItemDivider}
      scrollEnabled={scrollEnabled === true}
      ListHeaderComponent={
        <View className="flex mt-2 mb-4 bg-transparent border-white rounded-lg border-hairline">
          <Button
            title="Create new Playlist"
            color="black"
            onPress={() => router.push("/playlists/create")}
          />
        </View>
      }
      ListEmptyComponent={
        <View className="my-6">
          <Image
            source={{ uri: unknownTrackImageUri }}
            className="size-[200px] self-center mt-10 opacity-30"
          />
          <Text className="text-center mt-5 text-white text-2xl">
            No playlist found!
          </Text>
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
