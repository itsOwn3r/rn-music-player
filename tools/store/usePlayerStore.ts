import {
  displayNameFromSafUri,
  fileNameFromSafUri,
} from "@/tools/fileNameFromSAF";
import { ensureCacheDir, looksLikeAudio } from "@/tools/fileUtils";
import { readTagsForContentUri } from "@/tools/metadata";
import saveSongMetadata from "@/tools/saveCurrnetSong";
import { Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { create } from "zustand";

if (!(global as any).Buffer) {
  (global as any).Buffer = Buffer;
}

// Shape of the engine we expect from expo-audio
type AudioEngine = {
  replace: (src: { uri: string }) => any;
  play: () => any;
  pause: () => any;
  seekTo: (pos: number) => any;
  isLoaded: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
};

type PlayerStore = {
  // engine instance is injected at runtime from a React component
  engine: AudioEngine | null;

  files: Song[];
  currentSong: Song | null;
  currentSongIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;

  // engine binding + progress
  bindEngine: (engine: AudioEngine) => void;
  setProgress: (position: number, duration: number) => void;

  // actions
  pickFolder: () => Promise<void>;
  playFile: (file: Song, duration?: number) => Promise<void>;
  playSong: (index: number) => Promise<void>;
  playPauseMusic: () => Promise<void>;
  handleChangeSongPosition: (pos: number) => void;
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  engine: null,

  files: [],
  currentSong: null,
  currentSongIndex: -1,
  isPlaying: false,
  position: 0,
  duration: 1,
  isLoading: true,

  bindEngine: (engine) => set({ engine }),
  setProgress: (position, duration) =>
    set({ position, duration: duration || 1 }),

  pickFolder: async () => {
    set({ isLoading: true });
    try {
      if (Platform.OS !== "android") {
        throw new Error("Folder picking is Android-only.");
      }

      let directoryUri = await AsyncStorage.getItem("musicDirectoryUri");
      if (!directoryUri) {
        const perm =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted || !perm.directoryUri)
          throw new Error("Permission not granted");
        directoryUri = perm.directoryUri;
        await AsyncStorage.setItem("musicDirectoryUri", directoryUri);
      }

      const entries =
        await FileSystem.StorageAccessFramework.readDirectoryAsync(
          directoryUri
        );
      const audioUris = entries.filter(looksLikeAudio);
      if (audioUris.length === 0) {
        set({ files: [], currentSongIndex: -1 });
        return;
      }

      const cacheDir = await ensureCacheDir();
      const lightweightList: Song[] = audioUris.map((uri, index) => {
        const filename = uri.split("/").pop() ?? "Unknown.mp3";
        return {
          id: uri,
          uri,
          filename: fileNameFromSafUri(uri) ?? filename,
          title:
            displayNameFromSafUri(uri) ?? filename.replace(/\.[a-z0-9]+$/i, ""),
          artist: null,
          album: null,
          coverArt: null,
          index,
          comment: null,
          date: null,
          duration: 0,
          year: null,
        };
      });

      const sortedList = lightweightList.sort((a, b) =>
        a.filename.localeCompare(b.filename)
      );
      set({ files: sortedList });

      const lastSong = await AsyncStorage.getItem("song");
      if (lastSong) {
        const lastSongObject: Song = JSON.parse(lastSong);
        set({
          currentSongIndex: lastSongObject.index,
          currentSong: lastSongObject,
        });
      } else {
        set({ currentSongIndex: 0 });
      }

      // background metadata
      const fetchMetadata = async (song: Song, idx: number) => {
        try {
          const tags = await readTagsForContentUri(song.uri, cacheDir);
          set((prev) => ({
            files: prev.files.map((f) =>
              f.uri === song.uri ? { ...f, ...tags, index: idx } : f
            ),
          }));
        } catch (err) {
          console.warn("Metadata parse failed:", err);
        }
      };
      for (const [idx, song] of sortedList.entries()) {
        await fetchMetadata(song, idx);
        await new Promise((res) => setTimeout(res, 50));
      }
    } catch (err) {
      console.error("pickFolder error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  playFile: async (file: Song, duration?: number) => {
    const engine = get().engine;
    if (!engine) return;

    await saveSongMetadata(file);
    await engine.replace({ uri: file.uri });
    await engine.play();

    set({
      isPlaying: true,
      currentSong: file,
      duration: duration ?? engine.duration ?? 1,
    });
  },

  playSong: async (index: number) => {
    const engine = get().engine;
    if (!engine) return;

    const { files, currentSongIndex, position } = get();
    if (!files.length) return;

    const selectedIndex = index < 0 ? 0 : index;

    if (currentSongIndex - 1 === selectedIndex && position >= 5) {
      await engine.seekTo(0);
      set({ position: 0 });
    } else if (currentSongIndex === selectedIndex) {
      await engine.play(); // resume
      set({ isPlaying: true });
    } else {
      await get().playFile(files[selectedIndex]);
      set({ currentSongIndex: selectedIndex });
    }
  },

  playPauseMusic: async () => {
    const engine = get().engine;
    if (!engine) return;

    if (engine.playing) {
      await engine.pause();
      set({ isPlaying: false });
    } else {
      await engine.play();
      set({ isPlaying: true });
    }
  },

  handleChangeSongPosition: (pos: number) => {
    const engine = get().engine;
    if (!engine) return;
    engine.seekTo(pos);
    set({ position: pos });
  },
}));
