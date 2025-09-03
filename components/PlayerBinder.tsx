import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { useAudioPlayer } from "expo-audio";
import { useEffect } from "react";

export default function PlayerBinder() {
  const engine = useAudioPlayer();
  const bindEngine = usePlayerStore((s) => s.bindEngine);
  const setProgress = usePlayerStore((s) => s.setProgress);

  // Bind engine once it’s available
  useEffect(() => {
    bindEngine(engine);
  }, [engine, bindEngine]);

  // Update progress on an interval (only affects Playing UI)
  useEffect(() => {
    const id = setInterval(() => {
      if (engine.isLoaded && engine.playing) {
        setProgress(engine.currentTime, engine.duration || 1);
      }
    }, 500);
    return () => clearInterval(id);
  }, [engine, setProgress]);

  return null;
}
