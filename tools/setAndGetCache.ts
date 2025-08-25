import { Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "songMetadata:";

async function getCachedMetadata(
  uri: string,
  modificationTime?: number
): Promise<Song | null> {
  if (!modificationTime) return null;
  const key = `${CACHE_PREFIX}${uri}:${modificationTime}`;
  const cached = await AsyncStorage.getItem(key);
  return cached ? (JSON.parse(cached) as Song) : null;
}

async function setCachedMetadata(
  uri: string,
  modificationTime: number,
  data: Song
) {
  const key = `${CACHE_PREFIX}${uri}:${modificationTime}`;
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export { getCachedMetadata, setCachedMetadata };
