import React from "react";

import LoadingScreen from "@/components/LoadingScreen";
import MusicList from "@/components/MusicList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";

export default function SongsScreen() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isLoading = usePlayerStore((s) => s.isLoading);

  if (isLoading) return <LoadingScreen />;
  return <MusicList currentSong={currentSong} />;
}
