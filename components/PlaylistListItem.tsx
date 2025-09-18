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
  return (
    <TouchableHighlight activeOpacity={0.8} {...props}>
      <View className="flex-row items-center pr-[90px] gap-x-3.5">
        {/* Artwork */}
        <Image
          source={{ uri: playlist.coverArts[0] }}
          className="w-[70px] h-[70px] rounded-lg"
        />

        {/* Name + Arrow */}
        <View className="flex-row items-center justify-between w-full">
          <Text
            numberOfLines={1}
            className="text-white text-lg font-semibold max-w-[80%]"
          >
            {playlist.name}
          </Text>

          <AntDesign
            name="right"
            size={16}
            color={"#fff"}
            className="opacity-50"
          />
        </View>
      </View>
    </TouchableHighlight>
  );
};
