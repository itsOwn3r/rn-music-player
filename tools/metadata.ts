import type { Song } from "@/types/types";
import * as FileSystem from "expo-file-system";
import { parseBlob, parseBuffer } from "music-metadata-browser";
import uuid from "react-native-uuid";
import { copyContentToCache, getFilenameFromAnyUri } from "./fileUtils";
import saveCoverArtIfNeeded from "./saveCoverArtIfNeeded";

const INITIAL_CHUNK_SIZE = 256 * 1024; // 256 KB is sufficient for >95% of ID3 tags + first audio frame

export async function readTagsForContentUri(
  uri: string,
  cacheDir?: string
): Promise<Song> {
  let fileUriToCleanup: string | null = null;
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    if (!fileInfo.exists) throw new Error("File not found");

    const modificationTime =
      (fileInfo as { modificationTime?: number }).modificationTime ??
      Date.now() / 1000;
    const timestamp = modificationTime * 1000;
    const fileSize = (fileInfo as { size?: number }).size ?? 0;
    const filename = getFilenameFromAnyUri(uri);

    let common: any = {};
    let format: any = {};

    let parsedSuccessfully = false;

    // 1️⃣ FAST PATH: Direct in-memory chunk read (no disk copying)
    try {
      const initialChunk = Math.min(fileSize || INITIAL_CHUNK_SIZE, INITIAL_CHUNK_SIZE);
      const base64Chunk = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: initialChunk,
      });

      let buffer = Buffer.from(base64Chunk, "base64");

      // Check if file starts with ID3v2 header: 'I' (0x49), 'D' (0x44), '3' (0x33)
      if (
        buffer.length >= 10 &&
        buffer[0] === 0x49 &&
        buffer[1] === 0x44 &&
        buffer[2] === 0x33
      ) {
        const tagSize =
          ((buffer[6] & 0x7f) << 21) |
          ((buffer[7] & 0x7f) << 14) |
          ((buffer[8] & 0x7f) << 7) |
          (buffer[9] & 0x7f);
        const hasFooter = (buffer[5] & 0x10) !== 0;
        const fullTagSize = 10 + tagSize + (hasFooter ? 10 : 0);
        // Include extra 8KB for first MPEG audio frames to parse duration from Xing/Info header
        const neededLength = Math.min(
          fileSize || fullTagSize + 8192,
          fullTagSize + 8192
        );

        // If tag is larger than our initial chunk, read the complete tag
        if (neededLength > buffer.length && neededLength <= 5 * 1024 * 1024) {
          const fullBase64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
            position: 0,
            length: neededLength,
          });
          buffer = Buffer.from(fullBase64, "base64");
        }
      }

      const metadata = await parseBuffer(
        buffer,
        { mimeType: "audio/mpeg" },
        { skipPostHeaders: true }
      );

      common = metadata.common || {};
      format = metadata.format || {};

      // If ID3v2 had no title, try ID3v1 at the end of the file (last 128 bytes)
      if (!common.title && fileSize > 128) {
        try {
          const id3v1Base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
            position: fileSize - 128,
            length: 128,
          });
          const v1Buf = Buffer.from(id3v1Base64, "base64");
          if (
            v1Buf.length === 128 &&
            v1Buf.subarray(0, 3).toString("latin1") === "TAG"
          ) {
            const v1Title = v1Buf
              .subarray(3, 33)
              .toString("latin1")
              .replace(/\0+$/, "")
              .trim();
            const v1Artist = v1Buf
              .subarray(33, 63)
              .toString("latin1")
              .replace(/\0+$/, "")
              .trim();
            const v1Album = v1Buf
              .subarray(63, 93)
              .toString("latin1")
              .replace(/\0+$/, "")
              .trim();
            const v1Year = v1Buf
              .subarray(93, 97)
              .toString("latin1")
              .replace(/\0+$/, "")
              .trim();

            if (v1Title && !common.title) common.title = v1Title;
            if (v1Artist && !common.artist) common.artist = v1Artist;
            if (v1Album && !common.album) common.album = v1Album;
            if (v1Year && !common.year)
              common.year = parseInt(v1Year, 10) || undefined;
          }
        } catch {
          // Non-critical: ignore ID3v1 failure
        }
      }

      parsedSuccessfully = true;
    } catch (fastPathErr) {
      console.warn("Direct chunk read failed, falling back to copy:", fastPathErr);
    }

    // 2️⃣ FALLBACK PATH: Copy to cache & parseBlob (only used if direct read fails)
    if (!parsedSuccessfully) {
      const actualCacheDir = cacheDir || `${FileSystem.cacheDirectory}music-scan/`;
      fileUriToCleanup = await copyContentToCache(uri, actualCacheDir, filename);
      const blob = await fetch(fileUriToCleanup).then((res) => res.blob());
      const metadata = await parseBlob(blob);
      common = metadata.common || {};
      format = metadata.format || {};
    }

    const sizeInMB = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) : 0;

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
      coverArt: coverPath,
      filename,
      uri,
      index: 0,
      size: Number(sizeInMB),
      date: timestamp,
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
    if (fileUriToCleanup) {
      try {
        await FileSystem.deleteAsync(fileUriToCleanup, { idempotent: true });
      } catch (cleanupErr) {
        console.warn("Cleanup failed for:", fileUriToCleanup, cleanupErr);
      }
    }
  }
}
