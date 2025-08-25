import * as FileSystem from "expo-file-system";

export const AUDIO_EXT = [".mp3"];

export function looksLikeAudio(uri: string) {
  const lower = uri.toLowerCase();
  return AUDIO_EXT.some((ext) => lower.endsWith(ext));
}

export function getFilenameFromAnyUri(uri: string): string {
  const decoded = decodeURIComponent(uri);
  const m = decoded.match(/([^/]+?\.[a-z0-9]+)(\?|#|$)/i);
  if (m) return m[1];
  return `track.mp3`;
}

export async function ensureCacheDir(sub = "music-scan"): Promise<string> {
  const dir = `${FileSystem.cacheDirectory}${sub}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists)
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

export async function copyContentToCache(
  contentUri: string,
  cacheDir: string,
  preferredName?: string
): Promise<string> {
  const filename = preferredName ?? getFilenameFromAnyUri(contentUri);
  const dest = `${cacheDir}${filename}`;
  const exists = await FileSystem.getInfoAsync(dest);
  if (exists.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
  await FileSystem.copyAsync({ from: contentUri, to: dest });
  return dest;
}
