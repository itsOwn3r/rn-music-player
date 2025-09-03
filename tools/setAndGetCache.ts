import { Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX_STRICT = "songMetadata:mtime:";
const CACHE_PREFIX_LOOSE = "songMetadata:uri:";

// Strict cache (uses modificationTime when available)
export async function getCachedMetadata(
  uri: string,
  modificationTime?: number
): Promise<Song | null> {
  if (!modificationTime) return null;
  const key = `${CACHE_PREFIX_STRICT}${uri}:${modificationTime}`;
  const cached = await AsyncStorage.getItem(key);
  return cached ? (JSON.parse(cached) as Song) : null;
}

export async function setCachedMetadata(
  uri: string,
  modificationTime: number,
  data: Song
) {
  const key = `${CACHE_PREFIX_STRICT}${uri}:${modificationTime}`;
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// Loose cache (keyed only by URI – use when modTime is unavailable)
export async function getCachedMetadataLoose(
  uri: string
): Promise<Song | null> {
  const key = `${CACHE_PREFIX_LOOSE}${uri}`;
  const cached = await AsyncStorage.getItem(key);
  return cached ? (JSON.parse(cached) as Song) : null;
}

export async function setCachedMetadataLoose(uri: string, data: Song) {
  const key = `${CACHE_PREFIX_LOOSE}${uri}`;
  await AsyncStorage.setItem(key, JSON.stringify(data));
}
