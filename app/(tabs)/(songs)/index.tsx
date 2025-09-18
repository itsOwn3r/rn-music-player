import React from "react";

import MusicList from "@/components/MusicList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";

export default function SongsScreen() {
  const currentSong = usePlayerStore((s) => s.currentSong);

  return <MusicList currentSong={currentSong} />;
}
