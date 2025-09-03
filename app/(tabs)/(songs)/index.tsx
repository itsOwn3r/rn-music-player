import React, { useEffect } from "react";

import LoadingScreen from "@/components/LoadingScreen";
import MusicList from "@/components/MusicList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";

export default function SongsScreen() {
  const files = usePlayerStore((s) => s.files);
  const pickFolder = usePlayerStore((s) => s.pickFolder);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const currentSong = usePlayerStore((s) => s.currentSong);

  useEffect(() => {
    pickFolder();
  }, []);

  if (isLoading) return <LoadingScreen />;

  return <MusicList files={files} currentSong={currentSong} />;
}
