import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";

const ALBUM_ART_DIR = FileSystem.documentDirectory + "albumArt/";
const albumArtCache = new Map<string, string>();
let isDirCreated = false;

async function saveCoverArtIfNeeded(
  coverData: Uint8Array,
  album: string | null | undefined
): Promise<string | null> {
  try {
    const cacheKey = album && album.trim() ? album.trim() : null;
    if (cacheKey && albumArtCache.has(cacheKey)) {
      return albumArtCache.get(cacheKey)!;
    }

    if (!isDirCreated) {
      const dirInfo = await FileSystem.getInfoAsync(ALBUM_ART_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ALBUM_ART_DIR, { intermediates: true });
      }
      isDirCreated = true;
    }

    // Stable filename: hash of album name or cover art snippet
    const seed = cacheKey || Buffer.from(coverData.subarray(0, 1024)).toString("base64");
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      seed
    );
    const filePath = ALBUM_ART_DIR + `${hash}.jpg`;

    // Check if file already exists in cache or disk
    if (albumArtCache.has(filePath)) {
      if (cacheKey) albumArtCache.set(cacheKey, filePath);
      return filePath;
    }

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists && fileInfo.size > 0) {
      albumArtCache.set(filePath, filePath);
      if (cacheKey) albumArtCache.set(cacheKey, filePath);
      return filePath;
    }

    // Convert cover art to base64
    const base64Data = Buffer.from(coverData).toString("base64");

    // Write new file
    await FileSystem.writeAsStringAsync(filePath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    albumArtCache.set(filePath, filePath);
    if (cacheKey) albumArtCache.set(cacheKey, filePath);

    return filePath;
  } catch (err) {
    console.warn("Failed to save cover art", err);
    return null;
  }
}

export default saveCoverArtIfNeeded;
