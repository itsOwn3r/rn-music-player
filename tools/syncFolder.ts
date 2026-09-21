// tools/syncFolder.ts
import { Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import uuid from "react-native-uuid";
import { toast } from "sonner-native";
import { addSongsBatch, getAllSongs, removeSong } from "./db";
import { displayNameFromSafUri, fileNameFromSafUri } from "./fileNameFromSAF";
import { ensureCacheDir, looksLikeAudio } from "./fileUtils";
import { readTagsForContentUri } from "./metadata";
import { usePlayerStore } from "./store/usePlayerStore";

export async function syncFolder() {
  try {
    // 1️⃣ Instantly load already cached songs so the UI is immediately interactive
    const existingFiles = await getAllSongs();
    if (existingFiles.length > 0) {
      usePlayerStore.setState({ files: existingFiles, isLoading: false });
    } else {
      usePlayerStore.setState({ isLoading: true });
    }

    let directoryUri = await AsyncStorage.getItem("musicDirectoryUri");
    if (!directoryUri) {
      const perm =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted || !perm.directoryUri) {
        toast.error("Permission not granted!");
        usePlayerStore.setState({ isLoading: false });
        return null;
      }
      directoryUri = perm.directoryUri;
      await AsyncStorage.setItem("musicDirectoryUri", directoryUri);
    }

    const entries =
      await FileSystem.StorageAccessFramework.readDirectoryAsync(directoryUri);
    const audioUris = entries.filter(looksLikeAudio);
    if (audioUris.length === 0) {
      console.log("⚠️ No audio files found in folder");
      usePlayerStore.setState({ isLoading: false });
      return;
    }

    const existingUris = new Set(existingFiles.map((s) => s.uri));

    // 🗑️ Detect removed songs
    const removedSongs = existingFiles.filter(
      (s) => !audioUris.includes(s.uri)
    );
    if (removedSongs.length > 0) {
      console.log(
        `🗑️ Found ${removedSongs.length} removed songs — deleting...`
      );
      for (const song of removedSongs) {
        try {
          if (song.id) {
            await removeSong(song.id);
            console.log(`🗑️ Deleted: ${song.title ?? song.filename}`);
          }
        } catch (err) {
          console.warn("Failed to delete song:", song.uri, err);
        }
      }
      const removedSet = new Set(removedSongs.map((s) => s.uri));
      usePlayerStore.setState((prev) => ({
        files: prev.files.filter((f) => !removedSet.has(f.uri)),
      }));
    }

    // 🆕 Only process new songs
    const newUris = audioUris.filter((uri) => !existingUris.has(uri));
    if (newUris.length === 0) {
      console.log("✅ No new songs to sync — folder is up to date");
      usePlayerStore.setState({ isLoading: false });
      return;
    }

    console.log(
      `🎧 Found ${newUris.length} new songs — indexing metadata in parallel...`
    );

    const cacheDir = await ensureCacheDir();

    // Create lightweight placeholders with initial metadata
    const lightweightList: Song[] = newUris.map((uri, index) => {
      const filename = uri.split("/").pop() ?? "Unknown.mp3";
      return {
        id: uuid.v4().toString().slice(-8),
        uri,
        filename: fileNameFromSafUri(uri) ?? filename,
        title:
          displayNameFromSafUri(uri) ??
          decodeURIComponent(filename.replace(/\.[^/.]+$/, "")),
        artist: null,
        album: null,
        coverArt: null,
        index: existingFiles.length + index,
        comment: null,
        date: Date.now(),
        duration: 0,
        year: null,
        lyrics: null,
        syncedLyrics: null,
      };
    });

    const lastSong = await AsyncStorage.getItem("song");
    if (lastSong && !usePlayerStore.getState().currentSong) {
      const lastSongObject: Song = JSON.parse(lastSong);
      usePlayerStore.setState({
        currentSongIndex: lastSongObject.index,
        currentSong: lastSongObject,
      });
    }

    const CONCURRENCY = 3;
    const BATCH_SIZE = 15;
    let pendingBatch: Song[] = [];
    let processedCount = 0;

    const flushBatch = async () => {
      if (pendingBatch.length === 0) return;
      const batchToSave = [...pendingBatch];
      pendingBatch = [];
      await addSongsBatch(batchToSave);
      usePlayerStore.setState((prev) => ({
        files: [...prev.files, ...batchToSave],
      }));
    };

    let itemIndex = 0;
    const workers = Array.from({ length: CONCURRENCY }).map(async () => {
      while (itemIndex < lightweightList.length) {
        const item = lightweightList[itemIndex++];
        try {
          const tags = await readTagsForContentUri(item.uri, cacheDir);
          const completeSong: Song = {
            ...item,
            ...tags,
            index: item.index,
          };
          pendingBatch.push(completeSong);
          processedCount++;
          if (pendingBatch.length >= BATCH_SIZE) {
            await flushBatch();
          }
        } catch (err) {
          console.warn("Metadata parse failed for:", item.uri, err);
          pendingBatch.push(item);
          processedCount++;
          if (pendingBatch.length >= BATCH_SIZE) {
            await flushBatch();
          }
        }
      }
    });

    await Promise.all(workers);
    await flushBatch();

    console.log(`✅ Folder sync completed for ${newUris.length} new songs (${processedCount} processed)`);
  } catch (err) {
    console.error("❌ Error syncing folder:", err);
  } finally {
    const baseSongs = await getAllSongs();
    usePlayerStore.setState({ files: baseSongs, isLoading: false });
  }
}
