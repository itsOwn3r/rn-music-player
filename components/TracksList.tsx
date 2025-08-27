import library from "@/assets/data/library.json";
import React from "react";
import { FlatList, FlatListProps, View } from "react-native";
import TracksListItem from "./TracksListItem";

export type TracksListProps = Partial<FlatListProps<unknown>>;

const ItemDivider = () => (
  <View className="opacity-30 border-[#9ca3af88] border my-[5px] ml-[0px]" />
);

const TracksList = ({ ...FlatListProps }: TracksListProps) => {
  return (
    <FlatList
      className="flex-1 size-full"
      data={library}
      ItemSeparatorComponent={ItemDivider}
      renderItem={({ item: track }) => (
        <TracksListItem
          track={{
            ...track,
            image: track.artwork,
          }}
        />
      )}
      {...FlatListProps}
    />
  );
};

export default TracksList;
