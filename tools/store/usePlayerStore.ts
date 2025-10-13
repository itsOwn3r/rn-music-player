import { songs as staticSongs } from "@/assets/data/playlists";
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
import { Playlist, Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import uuid from "react-native-uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

if (!(global as any).Buffer) {
  (global as any).Buffer = Buffer;
}
let _lastQueueAdvance = 0;
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

  showLyrics: boolean;

  repeat: "off" | "all" | "one";

  // engine binding + progress
  bindEngine: (engine: AudioEngine) => void;
  setProgress: (position: number, duration: number) => void;

  // actions
  pickFolder: () => Promise<void>;
  playFile: (file: Song, duration?: number) => Promise<void>;
  playSong: (
    index: number,
    backwardOrForward?: "backward" | "forward",
    isRandom?: boolean,
    contextQueue?: Song[]
  ) => Promise<void>;
  playSongWithUri: (
    uri: string,
    backwardOrForward?: "backward" | "forward",
    isRandom?: boolean,
    contextQueue?: Song[]
  ) => Promise<void>;
  playSongGeneric: (
    song: Song,
    options?: {
      contextQueue?: Song[];
      fromUserAction?: boolean;
    }
  ) => Promise<void>;
  playPauseMusic: () => Promise<void>;
  setIsPlaying: (val: boolean) => void;
  handleChangeSongPosition: (pos: number) => void;
  handlebackwardPosition: () => void;
  handleForwardPosition: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleShowLyrics: () => void;
  volume: number;
  setVolume: (val: number) => void;
  favorites: string[]; // store song IDs
  toggleFavorite: (uri: string) => void;
  isFavorite: (uri: string) => boolean;
  queue: Song[]; // songs queued up
  queueContext?: "playlist" | "search" | "library" | "custom" | null;
  playbackPosition?: number;
  addToQueue: (songs: Song[]) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  playAnotherSongInQueue: (
    type: "next" | "previous",
    method?: "button" | "update"
  ) => Promise<void>;
  setFiles: (files: Song[]) => void;
  setLyrics: (uri: string, lyrics: string, syncedLyrics?: string) => void;
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      engine: null,

      files: [],
      currentSong: null,
      currentSongIndex: -1,
      isPlaying: false,
      queue: [],
      queueContext: null,
      playbackPosition: 0,
      position: 0,
      duration: 1,
      isLoading: true,
      shuffle: false,
      showLyrics: false,
      repeat: "off",
      volume: 1,

      bindEngine: (engine) => set({ engine }),
      setFiles: (files) => {
        const prevFiles = get().files;

        // Merge with persisted lyrics/syncedLyrics if available
        const mergedFiles = files.map((f) => {
          const existing = prevFiles.find((pf) => pf.uri === f.uri);
          const staticMatch = staticSongs.find((s) => s.uri === f.uri);

          return {
            ...f,
            ...(staticMatch ?? {}), // merge static info if available
            ...(existing
              ? {
                  lyrics: existing.lyrics ?? null,
                  syncedLyrics: existing.syncedLyrics ?? null,
                }
              : {}),
          };
        });

        set({ files: mergedFiles });
      },

      setProgress: (position, duration) =>
        set({ position, duration: duration }),

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

            // Check in static songs
            const existing = staticSongs.find((s) => s.uri === uri);

            if (existing) {
              // Use cached/static song, enforce correct index
              return { ...existing, index };
            }

            // Otherwise create a lightweight placeholder
            return {
              id: uri,
              uri,
              filename: fileNameFromSafUri(uri) ?? filename,
              title:
                displayNameFromSafUri(uri) ??
                filename.replace(/\.[a-z0-9]+$/i, ""),
              artist: null,
              album: null,
              coverArt: null,
              index,
              comment: null,
              date: null,
              duration: 0,
              year: null,
              lyrics: null,
              syncedLyrics: null,
            };
          });

          // const sortedList = lightweightList.sort((a, b) =>
          //   a.date > b.date
          // );

          const sortedList = lightweightList.sort(
            (a, b) => (a?.date ?? 0) - (b?.date ?? 0)
          );

          // Merge persisted lyrics/syncedLyrics into the freshly scanned list
          const existingFiles = get().files ?? [];

          const mergedList: Song[] = sortedList.map((song) => {
            const existing = existingFiles.find((f) => f.uri === song.uri);
            const staticMatch = staticSongs.find((s) => s.uri === song.uri);

            return {
              ...song,
              ...(staticMatch ?? {}), // keep static metadata if present
              // preserve previously-saved lyrics if available, otherwise keep whatever came from the scan (or null)
              lyrics: existing?.lyrics ?? song.lyrics ?? null,
              syncedLyrics: existing?.syncedLyrics ?? song.syncedLyrics ?? null,
            };
          });

          set({ files: mergedList, isLoading: false });

          const lastSong = await AsyncStorage.getItem("song");
          if (lastSong) {
            const lastSongObject: Song = JSON.parse(lastSong);
            set({
              currentSongIndex: lastSongObject.index,
              currentSong: lastSongObject,
            });
          } else {
            set({ currentSongIndex: 0, currentSong: sortedList[0] });
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
              const modificationTime =
                info.exists && "modificationTime" in info
                  ? info.modificationTime
                  : undefined;

              const cached =
                (modificationTime !== undefined &&
                  (await getCachedMetadata(song.uri, modificationTime))) ||
                (await getCachedMetadataLoose(song.uri));

              if (cached) {
                set((prev) => ({
                  files: prev.files.map((f) =>
                    f.uri === song.uri
                      ? {
                          ...f,
                          ...cached,
                          index: idx,
                          lyrics: f.lyrics ?? cached.lyrics ?? null,
                          syncedLyrics:
                            f.syncedLyrics ?? cached.syncedLyrics ?? null,
                        }
                      : f
                  ),
                }));
                fetched.add(song.uri);
                return;
              }

              // Force read metadata if not cached
              const tags = await readTagsForContentUri(song.uri, cacheDir);

              const merged: Song = { ...song, ...tags, index: idx };

              if (modificationTime) {
                await setCachedMetadata(song.uri, modificationTime, merged);
              } else {
                await setCachedMetadataLoose(song.uri, merged);
              }

              set((prev) => ({
                files: prev.files.map((f) =>
                  f.uri === song.uri
                    ? {
                        ...f,
                        ...tags,
                        index: idx,
                        lyrics: f.lyrics ?? tags.lyrics ?? null,
                        syncedLyrics:
                          f.syncedLyrics ?? tags.syncedLyrics ?? null,
                      }
                    : f
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
        await engine.seekTo(0);
        await engine.play();

        set({
          isPlaying: true,
          currentSong: file,
          currentSongIndex: file.index,
          duration: duration ?? engine.duration,
          position: 0,
        });
      },

      playSong: async (
        index: number,
        backwardOrForward?: "backward" | "forward",
        isRandom?: boolean,
        contextQueue?: Song[]
      ) => {
        const engine = get().engine;
        if (!engine) return;

        const { files, currentSongIndex, position, repeat } = get();
        if (!files.length) return;
        if (contextQueue && contextQueue.length) {
          set({ queue: contextQueue, queueContext: "custom" });
        }

        console.log("indxxxx ", index);

        // const selectedIndex = index < 0 ? 0 : index;

        const findSong = files.find((item) => {
          if (item.index === index) {
            const newItem = { ...item, index };

            return newItem;
          }
          return false;
        });

        console.log("findSong.indx ", findSong?.index);
        const selectedIndex =
          typeof findSong?.index === "number" && findSong.index >= 0
            ? findSong.index
            : 0;
        console.log("selectedIndex ", selectedIndex);

        if (
          selectedIndex === 0 &&
          currentSongIndex > selectedIndex &&
          repeat === "off"
        ) {
          engine.pause();
          set({ currentSongIndex: 0, isPlaying: false, currentSong: files[0] });
        } else if (selectedIndex >= files.length) {
          await get().playFile(files[0]);
          set({ currentSongIndex: 0, currentSong: files[0] });
        } else if (
          (currentSongIndex - 1 === selectedIndex ||
            (isRandom && backwardOrForward === "backward")) &&
          position >= 5
        ) {
          await engine.seekTo(0);
          set({ position: 0 });
        } else if (currentSongIndex === selectedIndex) {
          await engine.play(); // resume
          set({ isPlaying: true });
        } else {
          console.log("selectedIndex ", selectedIndex);
          console.log("files[selectedIndex]", files[selectedIndex]);
          console.log("findSong.index", findSong?.index);
          await get().playFile(files[selectedIndex]);
          set({
            currentSongIndex: selectedIndex,
            currentSong: files[selectedIndex],
          });
        }
      },
      playSongWithUri: async (
        uri: string,
        backwardOrForward?: "backward" | "forward",
        isRandom?: boolean,
        contextQueue?: Song[]
      ) => {
        const engine = get().engine;
        if (!engine) return;

        const { files, currentSongIndex, position } = get();
        if (!files.length) return;

        if (contextQueue && contextQueue.length) {
          set({ queue: contextQueue, queueContext: "custom" });
        }

        const findSong = files.find((item, index) => {
          if (item.uri === uri) {
            // Create a copy of the item to avoid modifying the original array
            const newItem = { ...item, index };

            // Return the new object with the added index
            return newItem;
          }
          return false; // Important: Return false to continue the search if not found
        });
        // console.log(findSong);

        const selectedIndex =
          typeof findSong?.index === "number" && findSong.index >= 0
            ? findSong.index
            : 0;

        if (selectedIndex >= files.length || !findSong) {
          await get().playFile(files[0]);
          set({ currentSongIndex: 0, currentSong: files[0] });
        } else if (
          (currentSongIndex - 1 === selectedIndex ||
            (isRandom && backwardOrForward === "backward")) &&
          position >= 5
        ) {
          await engine.seekTo(0);
          set({ position: 0 });
        } else if (currentSongIndex === selectedIndex) {
          await engine.play(); // resume
          set({ isPlaying: true });
        } else {
          await get().playFile(findSong);
          // console.log("selectedIndex ", selectedIndex);
          // console.log("files[selectedIndex]", files[selectedIndex]);
          // console.log("findSong.index", findSong.index);
          set({
            currentSongIndex: selectedIndex,
            currentSong: findSong,
          });
        }
      },

      // playSongGeneric: async (song, opts = {}) => {
      playSongGeneric: async (
        song: Song,
        opts?: {
          contextQueue?: Song[];
          direction?: "forward" | "backward";
        }
      ) => {
        const { engine, currentSong } = get();
        if (!engine) return;

        if (opts?.contextQueue) {
          set({ queue: opts.contextQueue });
        }

        // --- ④ Same song -> resume
        if (currentSong?.uri === song.uri) {
          await engine.play();
          set({ isPlaying: true });
          return;
        }

        // --- ⑤ Normal case: play new song
        await get().playFile(song);
        set({ currentSong: song, isPlaying: true, position: 0 });
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

      handlebackwardPosition: () => {
        const { engine, position } = get();
        if (!engine) return;
        const newPosition = position - 5 > 0 ? position - 5 : 0;
        engine.seekTo(newPosition);
        set({ position: newPosition });
      },

      handleForwardPosition: () => {
        const { engine, position, duration } = get();
        if (!engine) return;
        const newPosition = position + 5 < duration ? position + 5 : position;
        engine.seekTo(newPosition);
        set({ position: newPosition });
      },
      toggleShuffle: () =>
        set((state) => {
          const newShuffle = !state.shuffle;
          // AsyncStorage.setItem("shuffle", JSON.stringify(newShuffle));
          set((s) => ({ shuffle: !s.shuffle }));
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
      toggleShowLyrics: () =>
        set((state) => {
          const newState = !state.showLyrics;
          set((s) => ({ showLyrics: !s.showLyrics }));
          return { showLyrics: newState };
        }),
      favorites: [],
      toggleFavorite: (uri) =>
        set((s) => {
          const exists = s.favorites.includes(uri);
          return {
            favorites: exists
              ? s.favorites.filter((id) => id !== uri)
              : [...s.favorites, uri],
          };
        }),
      isFavorite: (uri) => {
        return get().favorites.includes(uri);
      },

      addToQueue: (songs) =>
        set((state) => {
          const isArray = Array.isArray(songs);
          let newSongs: Song[] = isArray ? songs : [songs];

          // Shuffle if enabled
          if (state.shuffle) {
            newSongs = newSongs
              .map((s) => ({ ...s })) // clone
              .sort(() => Math.random() - 0.5); // quick shuffle
            // OR if you install lodash: lodashShuffle(newSongs)
          }

          // For repeat = "one": just repeat the currentSong, ignore queue additions
          if (state.repeat === "one") {
            return state;
          }

          return {
            queue: [...state.queue, ...newSongs],
          };
        }),
      removeFromQueue: (songId) =>
        set((state) => ({
          queue: state.queue.filter((s) => s.id !== songId),
        })),

      clearQueue: () => set({ queue: [] }),

      playAnotherSongInQueue: async (
        type: "next" | "previous",
        method?: "button" | "update"
      ) => {
        const {
          queue,
          playFile,
          repeat,
          engine,
          setIsPlaying,
          currentSong,
          position,
          shuffle,
        } = get();

        if (!queue.length) return;

        // Guard against auto-advance firing too early
        if (method === "update" && position < 10) return;

        // Debounce multiple "update" triggers
        const now = Date.now();
        if (method === "update" && now - _lastQueueAdvance < 800) {
          console.log("What");
          return;
        }
        _lastQueueAdvance = now;

        // Handle repeat-one
        if (repeat === "one") {
          engine?.seekTo(0);
          engine?.play();
          setIsPlaying(true);
          return;
        }

        // Find where currentSongIndex sits inside the queue
        const songIndexInQueue = queue.findIndex(
          (song) => song.uri === currentSong?.uri
        );

        let nextIndex =
          songIndexInQueue === -1
            ? type === "next"
              ? 0
              : queue.length - 1
            : type === "next"
              ? songIndexInQueue + 1
              : songIndexInQueue - 1;

        // Handle overflow/underflow
        if (nextIndex >= queue.length) {
          if (repeat === "all") {
            nextIndex = 0;
          } else {
            nextIndex = 0;
            engine?.pause();
            setIsPlaying(false);
            engine?.replace({ uri: queue[nextIndex].uri });
            const nextSong = queue[nextIndex];
            set({
              position: 0,
              duration: engine?.duration ?? nextSong.duration,
              currentSong: nextSong,
              currentSongIndex: nextSong.index, // keep in sync with global files list
            });
            return;
          }
        } else if (nextIndex < 0) {
          if (repeat === "all") {
            nextIndex = queue.length - 1;
          } else {
            engine?.pause();
            setIsPlaying(false);
            return;
          }
        }

        if (shuffle) {
          nextIndex = Math.floor(Math.random() * queue.length);
        }

        const nextSong = queue[nextIndex];
        if (!nextSong) return;

        await playFile(nextSong);

        set({
          currentSong: nextSong,
          currentSongIndex: nextSong.index, // keep in sync with global files list
        });

        await new Promise((r) => setTimeout(r, 350)); // let engine settle
      },
      // rehydrateSettings: async () => {
      //   try {
      //     const [savedRepeat, savedShuffle, savedVolume, savedFavorites] =
      //       await Promise.all([
      //         AsyncStorage.getItem("repeat"),
      //         AsyncStorage.getItem("shuffle"),
      //         AsyncStorage.getItem("volume"),
      //         AsyncStorage.getItem("favorites"),
      //       ]);
      //     if (savedRepeat) {
      //       set({ repeat: savedRepeat as PlayerStore["repeat"] });
      //     }
      //     if (savedShuffle) {
      //       set({ shuffle: JSON.parse(savedShuffle) });
      //     }
      //     if (savedVolume) {
      //       const vol = JSON.parse(savedVolume);
      //       set({ volume: vol });
      //       const engine = get().engine;
      //       if (engine && "setVolume" in engine) {
      //         (engine as any).setVolume(vol);
      //       }
      //     }
      //     if (savedFavorites) {
      //       set({ favorites: JSON.parse(savedFavorites) });
      //     }
      //     const { files } = get();
      //     if (files.length) {
      //       const mergedFiles = files.map((f) => {
      //         const match = staticSongs.find((s) => s.uri === f.uri);
      //         return match ? { ...f, ...match } : f;
      //       });
      //       set({ files: mergedFiles });
      //     }
      //   } catch (err) {
      //     console.warn("Failed to rehydrate player settings:", err);
      //   }
      // },
      setVolume: (val: number) => {
        // AsyncStorage.setItem("volume", JSON.stringify(val));
        set({ volume: val });
        const engine = get().engine;
        if (engine && "setVolume" in engine) {
          // expo-audio engine has setVolume
          (engine as any).setVolume(val);
        }
      },
      setLyrics: (uri: string, lyrics: string, syncedLyrics?: string) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.uri === uri
              ? {
                  ...f,
                  lyrics,
                  ...(syncedLyrics ? { syncedLyrics } : {}), // 👈 only add if defined
                }
              : f
          ),
        })),
    }),
    {
      name: "player-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentSong: s.currentSong,
        currentSongIndex: s.currentSongIndex,
        queue: s.queue,
        queueContext: s.queueContext,
        playbackPosition: s.playbackPosition,
        repeat: s.repeat,
        shuffle: s.shuffle,
        showLyrics: s.showLyrics,
        favorites: s.favorites,
        volume: s.volume,
        files: s.files,
        position: s.position,
        duration: s.duration,
      }),
      onRehydrateStorage: () => (state) => {
        console.log(
          "🎵 PlayerStore rehydrated with queue:",
          state?.queue?.length ?? 0
        );
      },
    }
  )
);

export const usePlaylistStore = create(
  persist<{
    playlists: Playlist[];
    addPlaylist: (name: string, description?: string) => void;
    removePlaylist: (id: string) => void;
    addTrackToPlaylist: (playlistId: string, track: Song) => void;
    removeTrackFromPlaylist: (playlistId: string, track: Song) => void;
  }>(
    (set) => ({
      playlists: [],
      addPlaylist: (name, description) =>
        set((s) => ({
          playlists: [
            ...s.playlists,
            {
              id: uuid.v4().toString(),
              name,
              songs: [],
              duration: 0,
              description: description,
              songsLength: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),
      removePlaylist: (id) =>
        set((s) => ({
          playlists: s.playlists.filter((p) => p.id !== id),
        })),
      addTrackToPlaylist: (id, track) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id
              ? {
                  ...p,
                  songs: [...p.songs, track.uri],
                  duration: p.duration + track.duration,
                  songsLength: p.songsLength + 1,
                  updatedAt: Date.now(),
                  coverArt:
                    p.songsLength === 0
                      ? track.coverArt
                        ? track.coverArt
                        : undefined
                      : undefined,
                }
              : p
          ),
        })),
      removeTrackFromPlaylist: (id, track) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id
              ? {
                  ...p,
                  songs: p.songs.filter((u) => u !== track.uri),
                  duration: p.duration - track.duration,
                  songsLength: p.songsLength - 1,
                  updatedAt: Date.now(),
                }
              : p
          ),
        })),
    }),
    {
      name: "playlist-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
