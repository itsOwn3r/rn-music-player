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
  const volume = usePlayerStore((s) => s.volume);
  const playSong = usePlayerStore((s) => s.playSong);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const queue = usePlayerStore((s) => s.queue);
  const playAnotherSongInQueue = usePlayerStore(
    (s) => s.playAnotherSongInQueue
  );

  // store these refs
  const lastEngineUpdate = useRef<number>(0);
  const lastEngineTime = useRef<number>(0);

  const pickFolder = usePlayerStore((s) => s.pickFolder);
  //const isLoading = usePlayerStore((s) => s.isLoading);

  useEffect(() => {
    pickFolder();
  }, []);

  const frameRef = useRef<number | null>(null);

  const rehydrateSettings = usePlayerStore((s) => s.rehydrateSettings);

  useEffect(() => {
    engine.volume = volume;
  }, [engine, volume]);

  useEffect(() => {
    rehydrateSettings();
  }, [rehydrateSettings]);

  // Bind engine once it’s available
  useEffect(() => {
    bindEngine(engine);
  }, [engine, bindEngine]);

  const advancingRef = useRef(false);

  useEffect(() => {
    const update = async () => {
      if (status.isLoaded) {
        let smoothTime = status.currentTime;

        // --- Smooth progress ---
        // Only stop interpolating if we're at/after duration or explicitly paused
        const shouldInterpolate =
          status.duration &&
          status.currentTime < status.duration - 0.25 &&
          (status.playing || !advancingRef.current);

        if (shouldInterpolate) {
          if (status.currentTime !== lastEngineTime.current) {
            lastEngineTime.current = status.currentTime;
            lastEngineUpdate.current = Date.now();
          }
          const elapsed = (Date.now() - lastEngineUpdate.current) / 1000;
          smoothTime = lastEngineTime.current + elapsed;
        }

        // Clamp so it never overshoots
        if (status.duration) {
          smoothTime = Math.min(smoothTime, status.duration);
        }

        setProgress(smoothTime, status.duration || 1);

        // --- End-of-track handling ---
        if (
          !advancingRef.current &&
          status.duration &&
          status.currentTime >= status.duration - 0.25
        ) {
          advancingRef.current = true; // lock

          try {
            if (repeat === "one") {
              await engine.seekTo(0);
              await engine.play();
            } else if (queue.length > 0) {
              await playAnotherSongInQueue("next", "update");
            } else if (shuffle) {
              const randomIndex = Math.floor(Math.random() * files.length);
              await playSong(randomIndex);
            } else if (repeat === "all" && !shuffle) {
              const nextIndex =
                currentSongIndex + 1 >= files.length ? 0 : currentSongIndex + 1;
              await playSong(nextIndex);
            } else if (repeat === "all" && shuffle) {
              const randomIndex = Math.floor(Math.random() * files.length);
              await playSong(randomIndex);
            } else {
              // repeat = off
              if (currentSongIndex + 1 < files.length) {
                await playSong(currentSongIndex + 1);
              } else {
                engine.pause();
                setIsPlaying(false);
              }
            }
          } finally {
            // give engine a short time to settle before allowing another advance
            setTimeout(() => {
              advancingRef.current = false;
            }, 700);
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
    queue.length,
    playAnotherSongInQueue,
  ]);

  return null;
  // if (isLoading) return <LoadingScreen />;
}
