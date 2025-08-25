import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";

const ALBUM_ART_DIR = FileSystem.documentDirectory + "albumArt/";

async function saveCoverArtIfNeeded(
  coverData: Uint8Array,
  album: string
): Promise<string | null> {
  try {
    await FileSystem.makeDirectoryAsync(ALBUM_ART_DIR, { intermediates: true });

    // Stable filename: hash of album name (or fallback)
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      album || Date.now().toString()
    );
    const filePath = ALBUM_ART_DIR + `${hash}.jpg`;

    // ✅ Check if file already exists
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists && fileInfo.size > 0) {
      return filePath;
    }

    // Convert cover art to base64
    const base64Data = Buffer.from(coverData).toString("base64");

    // ✅ Write new file
    await FileSystem.writeAsStringAsync(filePath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Double-check file was written
    const writtenFile = await FileSystem.getInfoAsync(filePath);
    if (writtenFile.exists && writtenFile.size > 0) {
      return filePath;
    } else {
      console.warn("Cover art save failed, file empty:", filePath);
      return null;
    }
  } catch (err) {
    console.warn("Failed to save cover art", err);
    return null;
  }
}

export default saveCoverArtIfNeeded;
