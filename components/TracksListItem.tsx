import { unknownTrackImageUri } from "@/constants/images";
import { useColors } from "@/constants/tokens";
import { Song } from "@/types/types";
import { Entypo } from "@expo/vector-icons";
import React, { memo } from "react";
import { Image, Text, TouchableHighlight, View } from "react-native";

export type TrackListItemProps = {
  handlePlaySong: (index: number) => void | Promise<void>;
  track: Song;
  isActive: boolean;
  index: number;
};

const TracksListItem = memo(
  ({ track, handlePlaySong, isActive, index }: TrackListItemProps) => {
    // const isActiveTrack = track?.index === currentSongIndex;
    return (
      <TouchableHighlight
        className="px-4 py-2"
        onPress={() => {
          handlePlaySong(index);
        }}
      >
        <View className=" flex-row items-center pr-5" style={{ columnGap: 15 }}>
          <View>
            <Image
              source={{
                uri: track.coverArt ?? unknownTrackImageUri,
              }}
              style={{ width: 50, height: 50 }}
              className={`rounded-lg w-12 h-12 ${isActive ? "opacity-60" : "opacity-100"}`}
            />
          </View>

          <View className="flex flex-1 justify-between items-center flex-row">
            <View className="w-full">
              <Text
                numberOfLines={1}
                className={`max-w-[90%] font-semibold text-base ${isActive ? "text-[#fc3c44]" : "text-white"}`}
              >
                {track.title ? track.title : "Unknown Title"}
              </Text>
              <Text numberOfLines={1} className="text-[#9ca3af] text-sm mt-1">
                {track.artist ? track.artist : "Unknown Artist"}
              </Text>
            </View>

            <Entypo
              name="dots-three-horizontal"
              size={18}
              color={useColors().icon}
            />
          </View>
        </View>
      </TouchableHighlight>
    );
  }
);

TracksListItem.displayName = "TracksListItem";

export default TracksListItem;
