import library from "@/assets/data/library.json";
import React from "react";
import { FlatList, FlatListProps } from "react-native";
import TracksListItem from "./TracksListItem";

export type TracksListProps = Partial<FlatListProps<unknown>>;

const TracksList = ({ ...FlatListProps }: TracksListProps) => {
  return (
    <FlatList
      className="flex-1 size-full"
      data={library}
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
