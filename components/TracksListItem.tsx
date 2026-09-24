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

function formatRelativeTime(timestamp?: number | null): string | null {
  if (!timestamp || timestamp <= 0) return null;
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

const TracksListItem = memo(
  ({
    track,
    handlePlaySong,
    isActive,
    index,
    isInPlaylist,
    playlistId,
  }: TrackListItemProps) => {
    const getSubtitle = () => {
      const artist = track.artist ? track.artist : "Unknown Artist";
      if (
        playlistId === "most-played" &&
        track.playCount &&
        track.playCount > 0
      ) {
        return `${artist} • ${track.playCount} play${track.playCount > 1 ? "s" : ""}`;
      }
      if (
        playlistId === "history" &&
        track.lastPlayedAt &&
        track.lastPlayedAt > 0
      ) {
        const rel = formatRelativeTime(track.lastPlayedAt);
        if (rel) return `${artist} • ${rel}`;
      }
      if (playlistId === "recent" && track.date && track.date > 0) {
        const rel = formatRelativeTime(track.date);
        if (rel) return `${artist} • Added ${rel}`;
      }
      return artist;
    };

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
                  {getSubtitle()}
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
