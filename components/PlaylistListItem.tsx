import { unknownTrackImageUri } from "@/constants/images";
import { Playlist } from "@/types/types";
import { AntDesign } from "@expo/vector-icons";
import {
  Image,
  Text,
  TouchableHighlight,
  TouchableHighlightProps,
  View,
} from "react-native";

type PlaylistListItemProps = {
  playlist: Playlist;
} & TouchableHighlightProps;

export const PlaylistListItem = ({
  playlist,
  ...props
}: PlaylistListItemProps) => {
  const songCount = playlist.songs?.length ?? 0;
  const duration = playlist.duration
    ? `${Math.floor(playlist.duration / 60)} min`
    : "0 min";

  return (
    <TouchableHighlight activeOpacity={0.8} {...props}>
      <View className="flex-row items-center pr-[90px] gap-x-3.5 flex-1 w-full">
        {/* Artwork */}
        <Image
          source={{ uri: playlist.coverArt ?? unknownTrackImageUri }}
          className="w-[70px] h-[70px] rounded-lg"
        />

        {/* Details */}
        <View className="flex w-full flex-row pr-4 items-center">
          {/* Name + Arrow */}
          <View className="flex-col items-start justify-between w-full">
            <Text
              numberOfLines={1}
              className="text-white text-lg font-semibold max-w-[80%]"
            >
              {playlist.name}
            </Text>

            {/* Description */}
            {playlist.description ? (
              <Text
                numberOfLines={1}
                className="text-gray-400 text-sm mt-0.5 max-w-[95%]"
              >
                {playlist.description}
              </Text>
            ) : null}

            {/* Duration + Song count */}
            {!["downloads", "recent", "most-played"].includes(playlist.id) && (
              <Text className="text-gray-500 text-xs mt-0.5">
                {songCount} song{songCount !== 1 ? "s" : ""} • {duration}
              </Text>
            )}
          </View>
          <View>
            <AntDesign
              name="right"
              size={16}
              color={"#fff"}
              style={{ opacity: 0.5 }}
            />
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};
