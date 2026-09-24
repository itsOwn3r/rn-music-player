import { Song } from "@/types/types";
import { NativeModules, Platform } from "react-native";

const { MusicWidgetModule } = NativeModules;

/**
 * Updates the Android Home Screen Widget (JetAudio style)
 * with the current song info and playback state.
 */
export function updateMusicWidget(
  song?: Song | null,
  isPlaying: boolean = false
) {
  if (Platform.OS !== "android" || !MusicWidgetModule) {
    return;
  }

  try {
    const title = song?.title || null;
    const artist = song?.artist || null;
    const coverArt = song?.coverArt || null;

    MusicWidgetModule.updateWidget({
      title,
      artist,
      coverArt,
      isPlaying,
    });
  } catch (error) {
    console.warn("[MusicWidget] Failed to update widget:", error);
  }
}

export async function getMusicWidgetState(): Promise<{
  title?: string;
  artist?: string;
  coverArt?: string;
  isPlaying?: boolean;
} | null> {
  if (Platform.OS !== "android" || !MusicWidgetModule?.getWidgetState) {
    return null;
  }

  try {
    return await MusicWidgetModule.getWidgetState();
  } catch (error) {
    console.warn("[MusicWidget] Failed to get widget state:", error);
    return null;
  }
}
