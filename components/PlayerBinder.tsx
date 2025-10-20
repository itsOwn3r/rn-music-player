import { getAllSongs } from "@/tools/db";
import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { syncFolder } from "@/tools/syncFolder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export default function PlayerBinder() {
  const engine = useAudioPlayer();
  const status = useAudioPlayerStatus(engine);

  const bindEngine = usePlayerStore((s) => s.bindEngine);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const currentSongIndex = usePlayerStore((s) => s.currentSongIndex);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const volume = usePlayerStore((s) => s.volume);
  const playSong = usePlayerStore((s) => s.playSong);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const isPlaying = usePlayerStore((s) => s.isPlaying); // <-- new
  const queue = usePlayerStore((s) => s.queue);
  const playAnotherSongInQueue = usePlayerStore(
    (s) => s.playAnotherSongInQueue
  );

  // store these refs
  const lastEngineUpdate = useRef<number>(0);
  const lastEngineTime = useRef<number>(0);

  const pickFolder = usePlayerStore((s) => s.pickFolder);
  //const isLoading = usePlayerStore((s) => s.isLoading);

  // useEffect(() => {
  //   pickFolder();
  // }, []);

  useEffect(() => {
    let appStateSubscription: any;

    const initialize = async () => {
      try {
        // Load existing songs from SQLite
        const songs = await getAllSongs();
        const folderUri = await AsyncStorage.getItem("musicDirectoryUri");

        if (folderUri) {
          // ✅ Folder exists: auto-sync
          console.log("🎵 Folder found, auto-syncing...");
          await syncFolder();
        } else if (songs.length === 0) {
          // ✅ First-time setup: pick a folder
          console.log("📂 No folder selected, picking folder...");
          await pickFolder();
        } else {
          console.log(`🎵 Loaded ${songs.length} songs from SQLite`);
          // Optional: silently sync existing folder if needed
          await syncFolder();
        }

        // ✅ Auto-sync on app resume
        appStateSubscription = AppState.addEventListener(
          "change",
          async (state) => {
            if (state === "active" && folderUri) {
              console.log("🔄 App resumed, syncing folder...");
              await syncFolder();
            }
          }
        );
      } catch (err) {
        console.error("❌ Error initializing player:", err);
      }
    };

    initialize();

    return () => {
      appStateSubscription?.remove?.();
    };
  }, []);

  const frameRef = useRef<number | null>(null);

  // const rehydrateSettings = usePlayerStore((s) => s.rehydrateSettings);

  useEffect(() => {
    engine.volume = volume;
  }, [engine, volume]);

  // useEffect(() => {
  //   rehydrateSettings();
  // }, [rehydrateSettings]);

  // Bind engine once it’s available
  useEffect(() => {
    bindEngine(engine);
  }, [engine, bindEngine]);

  const advancingRef = useRef(false);
  const lastReported = useRef(0);
  useEffect(() => {
    const update = async () => {
      if (status.isLoaded && isPlaying) {
        // --- Smooth progress (only while actually playing) ---
        let smoothTime = status.currentTime;

        // Only interpolate while both engine reports playing and the store says playing,
        // and while not in the middle of an auto-advance.
        if (
          status.playing &&
          isPlaying &&
          status.duration &&
          !advancingRef.current
        ) {
          // Initialize refs if unset (avoid giant elapsed time)
          if (lastEngineUpdate.current === 0) {
            lastEngineUpdate.current = Date.now();
            lastEngineTime.current = status.currentTime;
          }

          // Update only when engine time actually changes
          if (status.currentTime !== lastEngineTime.current) {
            lastEngineTime.current = status.currentTime;
            lastEngineUpdate.current = Date.now();
          }

          const elapsed = Math.max(
            0,
            (Date.now() - lastEngineUpdate.current) / 1000
          );
          smoothTime = lastEngineTime.current + elapsed;
        } else {
          smoothTime = status.currentTime;
        }

        // Clamp and avoid jitter backwards
        if (status.duration) {
          smoothTime = Math.min(smoothTime, status.duration);
          // never go behind engine's reported time
          smoothTime = Math.max(smoothTime, status.currentTime);
        }

        if (Math.abs(smoothTime - lastReported.current) > 0.04) {
          lastReported.current = smoothTime;
          setProgress(smoothTime, status.duration || 1);
        }

        // --- End-of-track handling ---
        // Only auto-advance if the store believes playback is active (prevents advancing while paused)
        if (
          !advancingRef.current &&
          status.duration &&
          isPlaying &&
          status.currentTime >= status.duration - 0.25
        ) {
          advancingRef.current = true; // lock

          try {
            if (repeat === "one") {
              await engine.seekTo(0);
              await engine.play();
            } else if (queue.length > 0) {
              await playAnotherSongInQueue("next", "update");
            } else {
              console.log("Wronged");
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
    currentSongIndex,
    playSong,
    engine,
    setIsPlaying,
    queue.length,
    playAnotherSongInQueue,
    isPlaying, // <-- include this so pause/play changes immediately affect logic
  ]);

  return null;
  // if (isLoading) return <LoadingScreen />;
}
