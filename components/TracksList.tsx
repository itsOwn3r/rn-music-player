import React from "react";
import { FlatList, FlatListProps, View } from "react-native";
import { Track } from "react-native-track-player";
import TracksListItem from "./TracksListItem";

export type TracksListProps = Partial<FlatListProps<Track>> & {
  tracks: Track[];
};

const ItemDivider = () => (
  <View className="opacity-30 border-[#9ca3af88] border my-[5px] ml-[0px]" />
);

const TracksList = ({ ...FlatListProps }: TracksListProps) => {
  const searchData = FlatListProps.extraData;

  if (searchData?.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-neutral-800 px-4 py-2 rounded-lg justify-center">
          <View className="flex-row" style={{ columnGap: 10 }}>
            <View>
              <TracksListItem
                track={{
                  title: "No results found",
                  artist: "Try a different search term",
                  image: null,
                }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 size-full"
      data={searchData ? searchData : FlatListProps.tracks}
      ItemSeparatorComponent={ItemDivider}
      renderItem={({ item: track }) => <TracksListItem track={track} />}
      {...FlatListProps}
    />
  );
};

export default TracksList;
