import { unknownTrackImageUri } from "@/constants/images";
import React from "react";
import { Image, Text, TouchableHighlight, View } from "react-native";
import { Track } from "react-native-track-player";

export type TrackListItemProps = {
  track:
    | Track
    | {
        title: "No results found";
        artist: "Try a different search term";
        image: null;
      };
};

const TracksListItem = ({ track }: TrackListItemProps) => {
  const isActiveTrack = false;
  return (
    <TouchableHighlight className="px-4 py-2">
      <View className=" flex-row items-center pr-5" style={{ columnGap: 15 }}>
        <View>
          <Image
            source={{
              uri: track.image ?? unknownTrackImageUri,
            }}
            style={{ width: 50, height: 50 }}
            className={`rounded-lg w-12 h-12 ${isActiveTrack ? "opacity-60" : "opacity-100"}`}
          />
        </View>

        <View className="w-full">
          <Text
            numberOfLines={1}
            className={`max-w-[90%] font-semibold text-base ${isActiveTrack ? "text-[#fc3c44]" : "text-white"}`}
          >
            {track.title ? track.title : "Unknown Title"}
          </Text>
          <Text numberOfLines={1} className="text-[#9ca3af] text-sm mt-1">
            {track.artist ? track.artist : "Unknown Artist"}
          </Text>
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default TracksListItem;
