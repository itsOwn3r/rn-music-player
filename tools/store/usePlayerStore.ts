import {
  addFavorite,
  addLyrics,
  addSong,
  addSongToPlaylist,
  createPlaylist,
  editSong,
  getAllPlaylists,
  getAllSongs,
  getFavoriteSongs,
  getSongInfoFromDB,
  getSpeceficSystemPlaylist,
  incrementPlayCountInDB,
  removeFavorite,
  removePlaylist,
  removeSongFromPlaylist,
  setLocalURI,
  updateSongSyncedLyrics,
} from "@/tools/db";
import saveSongMetadata from "@/tools/saveCurrnetSong";
import { Playlist, Song } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import TrackPlayer, { Event, State } from "react-native-track-player";
import uuid from "react-native-uuid";
import { toast } from "sonner-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { downloadSongWithSAF } from "../downloadManager";

if (!(global as any).Buffer) {
  (global as any).Buffer = Buffer;
}
let _lastQueueAdvance = 0;

type PlayerStore = {
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
  // Actions
  loadLibrary: () => Promise<void>;
  addFile: (song: Song) => Promise<void>;

  setProgress: (position: number, duration: number) => void;

  // actions
  // pickFolder: () => Promise<void>;
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

  queue: Song[]; // songs queued up
  queueContext?: "playlist" | "search" | "library" | "custom" | null;
  addToQueue: (songs: Song[]) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  playAnotherSongInQueue: (
    type: "next" | "previous",
    method?: "button" | "update"
  ) => Promise<void>;
  setFiles: (files: Song[]) => void;
  setAllFiles: (files: Song[]) => void;
  setLyrics: (id: string, lyrics: string, syncedLyrics?: string) => void;
  editSong: (
    id: string,
    title: string,
    artist: string,
    album?: string,
    year?: string
  ) => Promise<null | undefined>;

  updateFileLocalUri: (id: string | null | undefined, localUri: string) => void;
  downloadFile: (id: string, remoteUri: string) => void;
  incrementPlayCount: (id: string | null | undefined) => void;
  getSongInfo: (id: string) => Promise<Song | null>;
  updateSongSyncedLyrics: (id: string, syncedLyrics: string) => void;
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      files: [],
      currentSong: null,
      currentSongIndex: -1,
      isPlaying: false,
      queue: [],
      queueContext: null,
      position: 0,
      duration: 1,
      isLoading: false,
      shuffle: false,
      showLyrics: true,
      repeat: "off",
      volume: 1,
      setAllFiles: (files) => {
        // console.log(files);
        const mergedFiles = files.map((f) => {
          const id = uuid.v4().toString().slice(-8);
          console.log("ID: ", id);

          return {
            ...f,
            id,
          };
        });

        // console.log("Merggged ", mergedFiles);

        set({ files: mergedFiles });
      },
      loadLibrary: async () => {
        const songs = await getAllSongs();
        set({ files: songs });
      },
      setFiles: (files) => {
        const prevFiles = get().files;

        // Merge with persisted lyrics/syncedLyrics if available
        const mergedFiles = files.map((f) => {
          const existing = prevFiles.find((pf) => pf.uri === f.uri);

          return {
            ...f,
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

      addFile: async (song: Song) => {
        await addSong(song);
        const songs = await getAllSongs();
        set({ files: songs });
      },

      updateFileLocalUri: (id: string | null | undefined, localUri: any) =>
        set((s) => ({
          files: s.files.map((f) => (f.id === id ? { ...f, localUri } : f)),
        })),
      downloadFile: async (id: string, remoteUri) => {
        const file = get().files.find((f) => f.id === id);
        if (!file) return;

        const safeTitle =
          file.title?.replace(/[\\/:*?"<>|]/g, "_") || `song_${id}`;
        const localUri = await downloadSongWithSAF(
          remoteUri,
          `${safeTitle}.mp3`
        );

        if (localUri) {
          get().updateFileLocalUri(id, localUri);

          const { addTrackToPlaylist } = usePlaylistStore.getState();

          await setLocalURI(localUri, file.id || "");

          // Add the track (make sure it includes updated localUri)
          addTrackToPlaylist("downloads", file.id || "");
        }
      },

      setProgress: (position, duration) => set({ position, duration }),
      playFile: async (file: Song, duration?: number) => {
        const { incrementPlayCount } = get();

        await TrackPlayer.reset();

        await saveSongMetadata(file);
        const uri = file.localUri ?? file.uri;
        await TrackPlayer.add([
          {
            id: file.id,
            url: uri,
            title: file.title ?? "Unknown Title",
            artist: file.artist ?? "Unknown Artist",
            artwork: file.coverArt ?? undefined,
            duration: duration ?? undefined,
          },
          { id: "placeholder", url: uri, title: file.title },
        ]);

        // 🔹 Start playback
        await TrackPlayer.play();

        incrementPlayCount(file?.id);
        await incrementPlayCountInDB(file?.id);

        const trackDuration = duration ?? (await TrackPlayer.getDuration());

        set({
          isPlaying: true,
          currentSong: file,
          currentSongIndex: file.index,
          duration: trackDuration,
          position: 0,
        });
      },

      playSong: async (
        index: number,
        backwardOrForward?: "backward" | "forward",
        isRandom?: boolean,
        contextQueue?: Song[]
      ) => {
        const { files, currentSongIndex, position, repeat } = get();
        if (!files.length) return;
        if (contextQueue && contextQueue.length) {
          set({ queue: contextQueue, queueContext: "custom" });
        }

        // const selectedIndex = index < 0 ? 0 : index;

        const findSong = files.find((item) => {
          if (item.index === index) {
            const newItem = { ...item, index };

            return newItem;
          }
          return false;
        });

        const selectedIndex =
          typeof findSong?.index === "number" && findSong.index >= 0
            ? findSong.index
            : 0;

        if (
          selectedIndex === 0 &&
          currentSongIndex > selectedIndex &&
          repeat === "off"
        ) {
          await TrackPlayer.pause();
          set({ currentSongIndex: 0, isPlaying: false, currentSong: files[0] });
        } else if (selectedIndex >= files.length) {
          await get().playFile(files[0]);
          set({ currentSongIndex: 0, currentSong: files[0] });
        } else if (
          (currentSongIndex - 1 === selectedIndex ||
            (isRandom && backwardOrForward === "backward")) &&
          position >= 5
        ) {
          await TrackPlayer.seekTo(0);
          set({ position: 0 });
        } else if (currentSongIndex === selectedIndex) {
          await TrackPlayer.play();
          set({ isPlaying: true });
        } else {
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
          await TrackPlayer.seekTo(0);
          set({ position: 0 });
        } else if (currentSongIndex === selectedIndex) {
          await TrackPlayer.play();
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
        const { currentSong } = get();

        if (opts?.contextQueue) {
          // await TrackPlayer.setQueue(opts.contextQueue);
          set({ queue: opts.contextQueue });
        }

        // --- ④ Same song -> resume
        if (currentSong?.uri === song.uri) {
          await TrackPlayer.play();
          set({ isPlaying: true });
          return;
        }

        // --- ⑤ Normal case: play new song
        await get().playFile(song);
        set({ currentSong: song, isPlaying: true, position: 0 });
      },
      playPauseMusic: async () => {
        const { currentSong, position } = get();
        const state = await TrackPlayer.getPlaybackState();

        const getProgress = await TrackPlayer.getProgress();
        const playerPosition = getProgress.position;

        if (state.state === State.Stopped && currentSong) {
          await TrackPlayer.reset();
          const uri = currentSong.localUri ?? currentSong.uri;

          await TrackPlayer.add([
            {
              id: currentSong.id,
              url: uri,
              title: currentSong.title ?? "Unknown Title",
              artist: currentSong.artist ?? "Unknown Artist",
              artwork: currentSong.coverArt ?? undefined,
              duration: currentSong.duration ?? undefined,
            },
            { id: "placeholder", url: uri, title: currentSong.title },
          ]);
          set({
            currentSong: currentSong,
            isPlaying: true,
            position: position ?? playerPosition,
          });

          await TrackPlayer.seekTo(position ?? playerPosition);
          await TrackPlayer.play();
        } else if (state.state === State.Playing) {
          await TrackPlayer.pause();
          set({ isPlaying: false });
        } else {
          await TrackPlayer.play();
          set({ isPlaying: true });
        }
      },
      setIsPlaying: (val: boolean) => set({ isPlaying: val }),

      handleChangeSongPosition: async (pos: number) => {
        await TrackPlayer.seekTo(pos);
        set({ position: pos });
      },

      handlebackwardPosition: async () => {
        const { position } = get();
        const newPosition = position - 5 > 0 ? position - 5 : 0;
        await TrackPlayer.seekTo(newPosition);
        set({ position: newPosition });
      },

      handleForwardPosition: async () => {
        const { position, duration } = get();
        const newPosition = position + 5 < duration ? position + 5 : position;
        await TrackPlayer.seekTo(newPosition);
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
          setIsPlaying,
          currentSong,
          shuffle,
          incrementPlayCount,
        } = get();

        if (!queue.length) return;

        // Debounce multiple "update" triggers
        const now = Date.now();
        if (method === "update" && now - _lastQueueAdvance < 800) {
          console.log("What");
          return;
        }
        _lastQueueAdvance = now;

        // Handle repeat-one
        if (repeat === "one" && method === "update") {
          await TrackPlayer.seekTo(0);
          await TrackPlayer.play();
          setIsPlaying(true);
          incrementPlayCount(currentSong?.id);
          await incrementPlayCountInDB(currentSong?.id);
          return;
        }

        const getProgress = await TrackPlayer.getProgress();
        if (type === "previous" && getProgress.position > 5) {
          await TrackPlayer.seekTo(0);
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
            await TrackPlayer.pause();

            setIsPlaying(false);
            const nextTrack = queue[nextIndex];
            const uri = nextTrack.localUri ?? nextTrack.uri;

            await TrackPlayer.reset();
            await TrackPlayer.add([
              {
                id: nextTrack.id,
                url: uri,
                title: nextTrack.title ?? "Unknown Title",
                artist: nextTrack.artist ?? "Unknown Artist",
                artwork: nextTrack.coverArt ?? undefined,
                duration: nextTrack.duration ?? undefined,
              },
              { id: "placeholder", url: uri, title: nextTrack.title },
            ]);

            await TrackPlayer.pause();

            const nextSong = queue[nextIndex];
            set({
              position: 0,
              duration: nextSong.duration,
              currentSong: nextSong,
              currentSongIndex: nextSong.index, // keep in sync with global files list
              isPlaying: false,
            });
            return;
          }
        } else if (nextIndex < 0) {
          if (repeat === "all") {
            nextIndex = queue.length - 1;
          } else {
            await TrackPlayer.pause();
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

        await new Promise((r) => setTimeout(r, 350));
      },
      setVolume: async (val: number) => {
        // AsyncStorage.setItem("volume", JSON.stringify(val));
        await TrackPlayer.setVolume(val);
        set({ volume: val });
      },
      setLyrics: async (id: string, lyrics: string, syncedLyrics?: string) => {
        if (!id || (lyrics && syncedLyrics)) {
          return null;
        }

        const { currentSong } = get();

        await addLyrics(id, lyrics, syncedLyrics ? syncedLyrics : null);
        toast.success(`Lyrics added!`);

        if (currentSong?.id === id) {
          const mutatableCurrentSong = currentSong;
          mutatableCurrentSong.lyrics = lyrics;
          mutatableCurrentSong.syncedLyrics = syncedLyrics
            ? syncedLyrics
            : null;

          set(() => ({
            currentSong: mutatableCurrentSong,
          }));
        }

        set((state) => ({
          files: state.files.map((f) =>
            f.id === id
              ? {
                  ...f,
                  lyrics,
                  ...(syncedLyrics ? { syncedLyrics } : {}), // 👈 only add if defined
                }
              : f
          ),
        }));
      },
      editSong: async (
        id: string,
        title: string,
        artist: string,
        album?: string,
        year?: string
      ) => {
        if (!id || !title || !artist) {
          toast.error("You must ented the required fields: Title, Artist!");
          return null;
        }

        const { currentSong } = get();

        await editSong(id, title, artist, album, year);
        toast.success(`Song Edited!`);

        if (currentSong?.id === id) {
          const mutatableCurrentSong = currentSong;
          mutatableCurrentSong.title = title;
          mutatableCurrentSong.artist = artist;
          mutatableCurrentSong.album = album || "";
          mutatableCurrentSong.year = year;

          set(() => ({
            currentSong: mutatableCurrentSong,
          }));
        }

        set((state) => ({
          files: state.files.map((f) =>
            f.id === id
              ? {
                  ...f,
                  title,
                  artist,
                  album: album || " ",
                  year,
                }
              : f
          ),
        }));
      },
      incrementPlayCount: (id: string | null | undefined) => {
        if (!id) {
          return;
        }
        set((s) => ({
          files: s.files.map((song) =>
            song.id === id
              ? {
                  ...song,
                  playCount: (song.playCount || 0) + 1,
                  lastPlayedAt: Date.now(),
                }
              : song
          ),
        }));
      },
      getSongInfo: async (id: string) => {
        const songInfo = await getSongInfoFromDB(id);
        return songInfo;
      },
      updateSongSyncedLyrics: async (id: string, syncedLyrics: string) => {
        await updateSongSyncedLyrics(id, syncedLyrics);
        toast.success(`Synced Lyrics added!`);
      },
    }),
    {
      name: "player-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentSong: s.currentSong,
        currentSongIndex: s.currentSongIndex,
        queue: s.queue,
        queueContext: s.queueContext,
        repeat: s.repeat,
        shuffle: s.shuffle,
        showLyrics: s.showLyrics,
        volume: s.volume,
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

export const usePlaylistStore = create<{
  playlists: Playlist[];
  favorites: Song[]; // store song IDs
  isFavorite: (songId: string) => boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (songId: string) => Promise<void>;

  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  loadPlaylists: (type: "user" | "system" | "all") => Promise<void>;
  addPlaylist: (name: string, description?: string) => Promise<void>;
  removePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeTrackFromPlaylist: (
    playlistId: string,
    songId: string
  ) => Promise<void>;
  getSpeceficSystemPlaylist: (
    type: "recent" | "most-played"
  ) => Promise<Playlist | undefined>;
}>((set, get) => ({
  playlists: [],
  isLoading: false,
  favorites: [],

  toggleFavorite: async (songId) => {
    const isFav = get().favorites.some((f) => f.id === songId);
    if (isFav) {
      await removeFavorite(songId);
      toast.success(`Track Deleted from Favorites!`);
    } else {
      toast.success(`Track added to Favorites!`);
      await addFavorite(songId);
    }
    const updatedFavs = await getFavoriteSongs();
    set({ favorites: updatedFavs });
  },
  isFavorite: (songId) => {
    const isFav = get().favorites.some((f) => f.id === songId);
    return isFav;
  },

  // Load favorites
  loadFavorites: async () => {
    const favs = await getFavoriteSongs();
    set({ favorites: favs });
  },

  setIsLoading: async (state: boolean) => {
    set({ isLoading: state });
  },
  loadPlaylists: async (type: "user" | "system" | "all" = "all") => {
    usePlayerStore.setState({ isLoading: true });
    try {
      const playlists = await getAllPlaylists(type);
      set({ playlists });
    } catch (error) {
      console.error("Failed to load playlists:", error);
    } finally {
      usePlayerStore.setState({ isLoading: false });
    }
  },

  addPlaylist: async (name, description) => {
    await createPlaylist(name, description);
    await get().loadPlaylists("all");
    toast.success(`Playlists Created: ${name}`);
  },

  removePlaylist: async (id) => {
    await removePlaylist(id);
    await get().loadPlaylists("all");
    toast.success(`Playlists Deleted!`);
  },

  addTrackToPlaylist: async (playlistId, songId) => {
    const { favorites } = get();

    if (playlistId === "favorites") {
      if (!favorites.find((fav) => fav.id === songId)) {
        const mutatableFavorites = favorites;

        const getSongInfo = usePlayerStore.getState().getSongInfo;
        const song = await getSongInfo(songId);
        if (!song) {
          toast.error("Something went wrong! The song coundn't be found!");
          return;
        }
        mutatableFavorites.push(song);
        set(() => ({
          favorites: mutatableFavorites,
        }));
      }
    }

    await addSongToPlaylist(playlistId, songId);
    await get().loadPlaylists("all");
  },

  removeTrackFromPlaylist: async (playlistId, songId) => {
    await removeSongFromPlaylist(playlistId, songId);
    await get().loadPlaylists("all");
  },
  getSpeceficSystemPlaylist: async (type: "recent" | "most-played") => {
    const playlist = await getSpeceficSystemPlaylist(type);
    return playlist;
  },
}));

TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
  usePlayerStore.setState({ isPlaying: data.state === State.Playing });
});

TrackPlayer.addEventListener(
  Event.PlaybackProgressUpdated,
  ({ position, duration }) => {
    usePlayerStore.setState({ position, duration });
  }
);

TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
  await TrackPlayer.seekTo(position);
  usePlayerStore.setState({ position });
});

TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
  const { position, duration } = usePlayerStore.getState();
  await TrackPlayer.seekTo(Math.min(position + 10, duration));
});

TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
  const { position } = usePlayerStore.getState();
  await TrackPlayer.seekTo(Math.max(position - 10, 0));
});

TrackPlayer.addEventListener(Event.RemoteNext, async () => {
  usePlayerStore.getState().playAnotherSongInQueue("next");
});

TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
  usePlayerStore.getState().playAnotherSongInQueue("previous");
});

TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
  const queue = usePlayerStore.getState().queue;
  if (queue.length > 0)
    await usePlayerStore.getState().playAnotherSongInQueue("next", "update");
});
