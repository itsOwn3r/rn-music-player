import {
  displayNameFromSafUri,
  fileNameFromSafUri,
} from "@/tools/fileNameFromSAF";
import { ensureCacheDir, looksLikeAudio } from "@/tools/fileUtils";
import { readTagsForContentUri } from "@/tools/metadata";
import saveSongMetadata from "@/tools/saveCurrnetSong";
import {
  getCachedMetadata,
  getCachedMetadataLoose,
  setCachedMetadata,
  setCachedMetadataLoose,
} from "@/tools/setAndGetCache";
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

  shuffle: boolean;

  repeat: "off" | "all" | "one";

  // engine binding + progress
  bindEngine: (engine: AudioEngine) => void;
  setProgress: (position: number, duration: number) => void;

  // actions
  pickFolder: () => Promise<void>;
  playFile: (file: Song, duration?: number) => Promise<void>;
  playSong: (index: number) => Promise<void>;
  playPauseMusic: () => Promise<void>;
  setIsPlaying: (val: boolean) => void;
  handleChangeSongPosition: (pos: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  volume: number;
  setVolume: (val: number) => void;
  rehydrateSettings: () => Promise<void>;
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
  shuffle: false,
  repeat: "off",
  volume: 1,

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
        set({ files: [], currentSongIndex: -1, isLoading: false });
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

      set({ files: sortedList, isLoading: false });

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

      const firstChunk = sortedList.slice(0, 40);
      const rest = sortedList.slice(40);

      const inflight = new Set<string>();
      const fetched = new Set<string>();

      const fetchOne = async (song: Song, idx: number) => {
        if (fetched.has(song.uri) || inflight.has(song.uri)) return;
        inflight.add(song.uri);
        try {
          const info = await FileSystem.getInfoAsync(song.uri as any);
          let modificationTime: number | undefined = undefined;
          if (info && (info as any).exists && "modificationTime" in info) {
            modificationTime = (info as any).modificationTime as
              | number
              | undefined;
          }

          if (modificationTime) {
            const cached = await getCachedMetadata(song.uri, modificationTime);
            if (cached) {
              set((prev) => ({
                files: prev.files.map((f) =>
                  f.uri === song.uri ? { ...f, ...cached, index: idx } : f
                ),
              }));
              fetched.add(song.uri);
              return;
            }
          } else {
            const cachedLoose = await getCachedMetadataLoose(song.uri);
            if (cachedLoose) {
              set((prev) => ({
                files: prev.files.map((f) =>
                  f.uri === song.uri ? { ...f, ...cachedLoose, index: idx } : f
                ),
              }));
              fetched.add(song.uri);
              return;
            }
          }

          const tags = await readTagsForContentUri(song.uri, cacheDir);

          const merged: Song = { ...song, ...tags, index: idx };

          if (modificationTime) {
            await setCachedMetadata(song.uri, modificationTime, merged);
          } else {
            await setCachedMetadataLoose(song.uri, merged);
          }

          set((prev) => ({
            files: prev.files.map((f) =>
              f.uri === song.uri ? { ...f, ...tags } : f
            ),
          }));
          fetched.add(song.uri);
        } catch (err) {
          console.warn("Metadata parse failed:", err);
        } finally {
          inflight.delete(song.uri);
        }
      };

      const runPool = (list: Song[], concurrency: number) => {
        let i = 0;
        const worker = async () => {
          while (i < list.length) {
            const item = list[i++];
            await fetchOne(item, item.index);
          }
        };

        Array.from({ length: concurrency }).forEach(() => {
          worker().catch((e) => console.warn("Metadata worker error:", e));
        });
      };

      runPool(firstChunk, 4);
      runPool(rest, 2);
    } catch (err) {
      console.error("pickFolder error:", err);
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

    if (selectedIndex >= files.length) {
      await get().playFile(files[0]);
      set({ currentSongIndex: 0 });
    } else if (currentSongIndex - 1 === selectedIndex && position >= 5) {
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
  setIsPlaying: (val: boolean) => set({ isPlaying: val }),

  handleChangeSongPosition: (pos: number) => {
    const engine = get().engine;
    if (!engine) return;
    engine.seekTo(pos);
    set({ position: pos });
  },
  toggleShuffle: () =>
    set((state) => {
      const newShuffle = !state.shuffle;
      AsyncStorage.setItem("shuffle", JSON.stringify(newShuffle));
      return { shuffle: newShuffle };
    }),
  toggleRepeat: () =>
    set((state) => {
      let next: PlayerStore["repeat"];
      if (state.repeat === "off") {
        next = "all";
      } else if (state.repeat === "all") {
        next = "one";
      } else {
        next = "off";
      }
      AsyncStorage.setItem("repeat", next);
      return { repeat: next };
    }),

  rehydrateSettings: async () => {
    try {
      const [savedRepeat, savedShuffle, savedVolume] = await Promise.all([
        AsyncStorage.getItem("repeat"),
        AsyncStorage.getItem("shuffle"),
        AsyncStorage.getItem("volume"),
      ]);

      if (savedRepeat) {
        set({ repeat: savedRepeat as PlayerStore["repeat"] });
      }
      if (savedShuffle) {
        set({ shuffle: JSON.parse(savedShuffle) });
      }
      if (savedVolume) {
        const vol = JSON.parse(savedVolume);
        set({ volume: vol });
        const engine = get().engine;
        if (engine && "setVolume" in engine) {
          (engine as any).setVolume(vol);
        }
      }
    } catch (err) {
      console.warn("Failed to rehydrate player settings:", err);
    }
  },
  setVolume: (val: number) => {
    AsyncStorage.setItem("volume", JSON.stringify(val));
    set({ volume: val });
    const engine = get().engine;
    if (engine && "setVolume" in engine) {
      // expo-audio engine has setVolume
      (engine as any).setVolume(val);
    }
  },
}));
