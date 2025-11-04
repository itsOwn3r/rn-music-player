import { usePlayerStore, usePlaylistStore } from "@/tools/store/usePlayerStore";
import { syncFolder } from "@/tools/syncFolder";
import { useEffect } from "react";
import { AppState } from "react-native";
import TrackPlayer from "react-native-track-player";

export default function PlayerBinder() {
  const volume = usePlayerStore((s) => s.volume);

  const loadPlaylists = usePlaylistStore((s) => s.loadPlaylists);

  useEffect(() => {
    let appStateSubscription: any;

    const initialize = async () => {
      try {
        // const folderUri = await AsyncStorage.getItem("musicDirectoryUri");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await syncFolder();

        await loadPlaylists("all");

        // ✅ Auto-sync on app resume
        appStateSubscription = AppState.addEventListener(
          "change",
          async (state) => {
            if (state === "active") {
              console.log("🔄 App resumed, syncing folder...");
              await new Promise((resolve) => setTimeout(resolve, 1000));
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
  }, [loadPlaylists]);

  useEffect(() => {
    (async () => {
      await TrackPlayer.setVolume(volume);
    })();
  }, [volume]);

  return null;
}
