import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef } from "react";

export default function PlayerBinder() {
  const engine = useAudioPlayer();
  const status = useAudioPlayerStatus(engine);

  const bindEngine = usePlayerStore((s) => s.bindEngine);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const files = usePlayerStore((s) => s.files);
  const currentSongIndex = usePlayerStore((s) => s.currentSongIndex);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const playSong = usePlayerStore((s) => s.playSong);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const frameRef = useRef<number | null>(null);

  const rehydrateSettings = usePlayerStore((s) => s.rehydrateSettings);

  useEffect(() => {
    rehydrateSettings();
  }, [rehydrateSettings]);

  // Bind engine once it’s available
  useEffect(() => {
    bindEngine(engine);
  }, [engine, bindEngine]);

  // Smooth progress updater + end-of-track handling
  useEffect(() => {
    const update = () => {
      if (status.isLoaded) {
        setProgress(status.currentTime, status.duration || 1);

        // Song finished
        if (
          status.duration &&
          status.currentTime >= status.duration - 0.25 // allow small buffer
        ) {
          if (repeat === "one") {
            // restart current song
            engine.seekTo(0);
            engine.play();
          } else if (shuffle) {
            // pick random song
            const randomIndex = Math.floor(Math.random() * files.length);
            playSong(randomIndex);
          } else if (repeat === "all" && !shuffle) {
            // next song, wrap if needed
            const nextIndex =
              currentSongIndex + 1 >= files.length ? 0 : currentSongIndex + 1;
            playSong(nextIndex);
          } else if (repeat === "all" && shuffle) {
            const randomIndex = Math.floor(Math.random() * files.length);
            playSong(randomIndex);
          } else {
            // repeat = off, stop at the end
            if (currentSongIndex + 1 < files.length) {
              playSong(currentSongIndex + 1);
            } else {
              // reached the end
              engine.pause();
              setIsPlaying(false);
            }
          }
        }
      }

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [
    status,
    setProgress,
    repeat,
    shuffle,
    files,
    currentSongIndex,
    playSong,
    engine,
    setIsPlaying,
  ]);

  return null;
}
