import { usePlayerStore } from "@/tools/store/usePlayerStore";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef } from "react";

export default function PlayerBinder() {
  const engine = useAudioPlayer();
  const status = useAudioPlayerStatus(engine);

  const bindEngine = usePlayerStore((s) => s.bindEngine);
  const setProgress = usePlayerStore((s) => s.setProgress);

  const frameRef = useRef<number | null>(null);

  // Bind engine once it’s available
  useEffect(() => {
    bindEngine(engine);
  }, [engine, bindEngine]);

  // Smooth progress updater
  useEffect(() => {
    const update = () => {
      if (status.isLoaded) {
        setProgress(status.currentTime, status.duration || 1);
      }
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [status, setProgress]);

  return null;
}
