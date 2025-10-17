import { Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const saveSongMetadata = async (song: Song) => {
  try {
    const stored = await AsyncStorage.getItem("song");
    const lastSong = stored ? JSON.parse(stored) : null;

    if (lastSong) {
      const songObject = {
        id: song.id,
        index: song.index,
        title: song.title || song.filename,
        artist: song.artist || "Unknown",
        uri: song.uri,
        localUri: song.localUri,
        coverArt: song.coverArt || null,
        year: song.year,
        album: song.album || "",
        duration: song.duration,
        lyrics: song.lyrics,
        syncedLyrics: song.syncedLyrics,
        lastSong: {
          id: lastSong.id,
          index: lastSong.index,
          title: lastSong.title || lastSong.filename,
          artist: lastSong.artist || "Unknown",
          uri: lastSong.uri,
          localUri: lastSong.localUri,
          coverArt: lastSong.coverArt || null,
          year: lastSong.year,
          album: lastSong.album || "",
          duration: lastSong.duration,
          lyrics: lastSong.lyrics,
          syncedLyrics: lastSong.syncedLyrics,
        },
      };
      await AsyncStorage.setItem("song", JSON.stringify(songObject));
    } else {
      const songObject = {
        id: song.id,
        index: song.index,
        title: song.title || song.filename,
        artist: song.artist || "Unknown",
        uri: song.uri,
        localUri: song.localUri,
        coverArt: song.coverArt || null,
        year: song.year,
        album: song.album || "",
        duration: song.duration,
        lyrics: song.lyrics,
        syncedLyrics: song.syncedLyrics,
        lastSong: null,
      };
      await AsyncStorage.setItem("song", JSON.stringify(songObject));
    }
    return true;
  } catch (err) {
    console.warn("Error saving song metadata:", err);
    return false;
  }
};

export default saveSongMetadata;
