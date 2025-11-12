import { unknownTrackImageUri } from "@/constants/images";
import { Song } from "@/types/types";
import { Entypo } from "@expo/vector-icons";
import React, { memo } from "react";
import { Image, Text, TouchableHighlight, View } from "react-native";
import TrackShortcutsMenu from "./TrackShortcutsMenu";

export type TrackListItemProps = {
  handlePlaySong: (track: Song) => void | Promise<void>;
  track: Song;
  isActive: boolean;
  isInPlaylist: boolean;
  index: number;
  playlistId?: string;
};

const TracksListItem = memo(
  ({
    track,
    handlePlaySong,
    isActive,
    index,
    isInPlaylist,
    playlistId,
  }: TrackListItemProps) => {
    // const isActiveTrack = track?.index === currentSongIndex;
    return (
      <TouchableHighlight
        className="px-4 py-2"
        onPress={() => {
          handlePlaySong(track);
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
            <View className="w-[95%]">
              <Text
                numberOfLines={1}
                className={`max-w-[90%] font-semibold text-base ${isActive ? "text-[#fc3c44]" : "text-white"}`}
              >
                {track.title ? track.title : "Unknown Title"}
              </Text>
              <View className="flex justify-between flex-row items-center">
                <Text
                  numberOfLines={1}
                  className="text-[#9ca3af] text-sm mt-1 "
                >
                  {track.artist ? track.artist : "Unknown Artist"}
                </Text>
              </View>
            </View>
            <View className="flex items-center flex-row gap-x-2 -ml-1">
              <Text className="text-xs rounded-full px-1 justify-center items-center text-center bg-slate-700 ">
                {index + 1}
              </Text>
              <View className="flex flex-1 justify-between items-center flex-row">
                <TrackShortcutsMenu
                  track={track}
                  isInPlaylist={isInPlaylist}
                  playlistId={playlistId}
                >
                  <Entypo name="dots-three-horizontal" size={18} color="#fff" />
                </TrackShortcutsMenu>
              </View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
);

TracksListItem.displayName = "TracksListItem";

export default TracksListItem;
