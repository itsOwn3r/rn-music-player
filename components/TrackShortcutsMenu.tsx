import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { Song } from "@/types/types";
import { MenuView } from "@react-native-menu/menu";
import { useRouter } from "expo-router";
import React, { PropsWithChildren } from "react";
import { match } from "ts-pattern";

type TrackShortcutsMenuProps = PropsWithChildren<{ track: Song }>;

const TrackShortcutsMenu = ({ track, children }: TrackShortcutsMenuProps) => {
  const router = useRouter();
  const isFavorite = track.isFavorite;

  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);

  const handlePressAction = (id: string) => {
    match(id)
      .with("add-to-favorites", async () => {
        toggleFavorite(track.uri);
      })
      .with("remove-from-favorite", async () => {
        toggleFavorite(track.uri);
      })
      .with("add-to-playlist", async () => {
        router.push({
          pathname: "(modals)/addToPlaylist",
          params: { trackURI: track.uri },
        });
      })
      .otherwise(() => {
        console.warn(`Unknown menu action ${id}`);
      });
  };

  return (
    <MenuView
      onPressAction={({ nativeEvent: { event } }) => handlePressAction(event)}
      actions={[
        {
          id: isFavorite ? "remove-from-favorite" : "add-to-favorites",
          title: isFavorite ? "Remove from Favorites" : "Add to Favorites",
          image: isFavorite ? "star.fill" : "star",
        },
        {
          id: "add-to-playlist",
          title: "Add to playlist",
          image: "plus",
        },
      ]}
    >
      {children}
    </MenuView>
  );
};

export default TrackShortcutsMenu;
