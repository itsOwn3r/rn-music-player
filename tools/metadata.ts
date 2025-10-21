import type { Song } from "@/types/types";
import * as FileSystem from "expo-file-system";
import { parseBlob } from "music-metadata-browser";
import uuid from "react-native-uuid";
import { copyContentToCache, getFilenameFromAnyUri } from "./fileUtils";
import saveCoverArtIfNeeded from "./saveCoverArtIfNeeded";

export async function readTagsForContentUri(
  uri: string,
  cacheDir: string
): Promise<Song> {
  let fileUri: string | null = null;
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    if (!fileInfo.exists) throw new Error("File not found");
    // Expo gives modificationTime in seconds → convert to ms
    const modificationTime =
      (fileInfo as { modificationTime?: number }).modificationTime ??
      Date.now() / 1000;
    const timestamp = modificationTime * 1000;

    // 2️⃣ Parse metadata
    const filename = getFilenameFromAnyUri(uri);
    fileUri = await copyContentToCache(uri, cacheDir, filename); // file://...
    const blob = await fetch(fileUri).then((res) => res.blob());

    const metadata = await parseBlob(blob);
    const { common, format } = metadata;

    let coverPath: string | null = null;
    if (common.picture && common.picture.length > 0) {
      coverPath = await saveCoverArtIfNeeded(
        common.picture[0].data,
        common.album as string
      );
    }

    const songMetadata: Song = {
      title:
        common.title ?? decodeURIComponent(filename.replace(/\.[^/.]+$/, "")),
      artist: common.artist ?? null,
      album: common.album ?? null,
      year: common.year ? String(common.year) : null,
      comment: common.comment?.join(" ") || null,
      id: uuid.v4().toString().slice(-8),
      duration: format.duration ?? 0,
      coverArt: coverPath, // ✅ just file path
      filename,
      uri,
      index: 0,
      date: timestamp, // ✅ JS timestamp in ms
    };

    return songMetadata;
  } catch (err) {
    console.warn("Failed to read tags:", err);

    const filename = uri.split("/").pop() || "Unknown";

    return {
      title: decodeURIComponent(filename.replace(/\.[^/.]+$/, "")),
      artist: null,
      album: null,
      coverArt: null,
      year: null,
      comment: null,
      duration: 0,
      date: Date.now(),
      id: uuid.v4().toString().slice(-8),
      filename,
      index: -1,
      uri,
    };
  } finally {
    if (fileUri) {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupErr) {
        console.warn("Cleanup failed for:", fileUri, cleanupErr);
      }
    }
  }
}
