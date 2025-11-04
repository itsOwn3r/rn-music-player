// tools/syncFolder.ts
import { Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import uuid from "react-native-uuid";
import { toast } from "sonner-native";
import { addSong, getAllSongs, removeSong } from "./db";
import { displayNameFromSafUri, fileNameFromSafUri } from "./fileNameFromSAF";
import { ensureCacheDir, looksLikeAudio } from "./fileUtils";
import { readTagsForContentUri } from "./metadata";
import { usePlayerStore } from "./store/usePlayerStore";

export async function syncFolder() {
  usePlayerStore.setState({ isLoading: true });
  try {
    let directoryUri = await AsyncStorage.getItem("musicDirectoryUri");
    if (!directoryUri) {
      const perm =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted || !perm.directoryUri) {
        toast.error("Permition not granted!");
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
      return;
    }

    const existingFiles = await getAllSongs();
    const existingUris = new Set(existingFiles.map((s) => s.uri));

    // 🗩 NEW: detect removed songs
    const removedSongs = existingFiles.filter(
      (s) => !audioUris.includes(s.uri)
    );
    if (removedSongs.length > 0) {
      console.log(
        `🗑️ Found ${removedSongs.length} removed songs — deleting...`
      );
      for (const song of removedSongs) {
        try {
          if (!song.id) {
            console.warn("Skipping delete, missing id for:", song);
          } else {
            await removeSong(song.id);
            console.log(`🗑️ Deleted: ${song.title ?? song.filename}`);
          }
          usePlayerStore.setState((prev) => ({
            files: prev.files.filter((f) => f.uri !== song.uri),
          }));
        } catch (err) {
          console.warn("Failed to delete song:", song.uri, err);
        }
      }
    }

    // 🆕 Only process new songs
    const newUris = audioUris.filter((uri) => !existingUris.has(uri));
    if (newUris.length === 0) {
      console.log("✅ No new songs to sync — folder is up to date");
      return;
    }

    console.log(
      `🎧 Found ${newUris.length} new songs — syncing full metadata...`
    );

    const cacheDir = await ensureCacheDir();

    // Create lightweight placeholders (same as pickFolder)
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
        index,
        comment: null,
        date: new Date().getTime(),
        duration: 0,
        year: null,
        lyrics: null,
        syncedLyrics: null,
      };
    });

    // Sort like in pickFolder
    const sortedList = lightweightList.sort(
      (a, b) => (a?.date ?? 0) - (b?.date ?? 0)
    );

    // Merge with existing stored data (lyrics/syncedLyrics)
    const mergedList: Song[] = sortedList.map((song) => {
      const existing = existingFiles.find((f) => f.uri === song.uri);
      return {
        ...song,
        lyrics: existing?.lyrics ?? song.lyrics ?? null,
        syncedLyrics: existing?.syncedLyrics ?? song.syncedLyrics ?? null,
      };
    });

    const lastSong = await AsyncStorage.getItem("song");
    if (lastSong) {
      const lastSongObject: Song = JSON.parse(lastSong);
      usePlayerStore.setState({
        currentSongIndex: lastSongObject.index,
        currentSong: lastSongObject,
      });
    }

    const inflight = new Set<string>();
    const fetched = new Set<string>();

    const fetchOne = async (song: Song, idx: number) => {
      if (fetched.has(song.uri) || inflight.has(song.uri)) return;
      inflight.add(song.uri);
      try {
        const tags = await readTagsForContentUri(song.uri, cacheDir);
        const merged: Song = { ...song, ...tags, index: idx };

        usePlayerStore.setState((prev) => ({
          files: prev.files.map((f) =>
            f.uri === song.uri
              ? {
                  ...f,
                  ...tags,
                  index: idx,
                  lyrics: f.lyrics ?? tags.lyrics ?? null,
                  syncedLyrics: f.syncedLyrics ?? tags.syncedLyrics ?? null,
                }
              : f
          ),
        }));

        await addSong(merged);
        fetched.add(song.uri);
      } catch (err) {
        console.warn("Metadata parse failed:", err);
      } finally {
        inflight.delete(song.uri);
      }
    };

    const runPool = async (list: Song[], concurrency: number) => {
      let i = 0;
      const workers = Array.from({ length: concurrency }).map(async () => {
        while (i < list.length) {
          const item = list[i++];
          await fetchOne(item, item.index);
        }
      });
      await Promise.all(workers);
    };

    const firstChunk = mergedList.slice(0, 40);
    const rest = mergedList.slice(40);

    await Promise.all([runPool(firstChunk, 4), runPool(rest, 2)]);

    console.log(`✅ Folder sync completed for ${mergedList.length} songs`);
  } catch (err) {
    console.error("❌ Error syncing folder:", err);
  } finally {
    const baseSongs = await getAllSongs();
    usePlayerStore.setState({ files: baseSongs });
    usePlayerStore.setState({ isLoading: false });
  }
}
