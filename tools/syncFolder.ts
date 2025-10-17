// tools/syncFolder.ts
import { Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import uuid from "react-native-uuid";
import { addSong, getAllSongs } from "./db";
import { usePlayerStore } from "./store/usePlayerStore";

const looksLikeAudio = (uri: string) =>
  uri.endsWith(".mp3") || uri.endsWith(".m4a") || uri.endsWith(".wav");

export async function syncFolder() {
  try {
    let directoryUri = await AsyncStorage.getItem("musicDirectoryUri");
    if (!directoryUri) {
      const perm =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted || !perm.directoryUri)
        throw new Error("Permission not granted");
      directoryUri = perm.directoryUri;
      await AsyncStorage.setItem("musicDirectoryUri", directoryUri);
    }

    const entries =
      await FileSystem.StorageAccessFramework.readDirectoryAsync(directoryUri);

    const existingSongs = await getAllSongs();
    const existingUris = new Set(existingSongs.map((s) => s.uri));

    const newAudioUris = entries.filter(looksLikeAudio);
    const newSongs: Song[] = [];

    for (const uri of newAudioUris) {
      if (existingUris.has(uri)) continue;

      const filename = uri.split("/").pop() ?? "Unknown.mp3";
      const title = filename.replace(/\.[^/.]+$/, "");

      const newSong: Song = {
        id: uuid.v4().toString().slice(-8),
        uri,
        filename,
        title,
        artist: null,
        album: null,
        coverArt: null,
        index: 0,
        duration: 0,
        size: 0,
        date: Date.now(),
        year: null,
        lyrics: null,
        syncedLyrics: null,
      };

      await addSong(newSong);
      newSongs.push(newSong);
    }

    const allSongs = await getAllSongs();
    usePlayerStore.setState({ files: allSongs });

    console.log(`✅ Synced folder: +${newSongs.length} new songs`);
  } catch (err) {
    console.error("❌ Error syncing folder:", err);
  }
}
