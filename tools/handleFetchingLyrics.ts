import { Song } from "@/types/types";
import { getSong } from "./db";
import { fetchLyrics } from "./fetchLyrics";
import { usePlayerStore } from "./store/usePlayerStore";

export const handleFetchingLyrics = async ({
  currentSong,
  setLyrics,
}: {
  currentSong: Song | null;
  setLyrics: (id: string, plainLyrics: string, syncedLyrics?: string) => void;
}) => {
  if (!currentSong) {
    return null;
  }
  const lyrics = await fetchLyrics(currentSong, setLyrics);
  // router.reload();
  const updated = await getSong(currentSong?.id || "");
  if (!updated) return;

  // Update the files array and the currentSong reference in the store in one atomic update
  usePlayerStore.setState((prev: any) => {
    const files = prev.files ?? [];
    const newFiles = files.map((f: any) => (f.id === updated.id ? updated : f));
    return {
      files: newFiles,
      currentSong:
        prev.currentSong?.id === updated.id ? updated : prev.currentSong,
    };
  });

  return lyrics;
};
