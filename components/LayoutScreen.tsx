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
import { useAudioPlayer } from "expo-audio";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, SafeAreaView, Text } from "react-native";
import MusicList from "./MusicList";
import Playing from "./Playing";

if (!(global as any).Buffer) {
  (global as any).Buffer = Buffer;
}

const LayoutScreen = () => {
  const [tabSelected, setTabSelected] = useState<"list" | "playing">("playing");
  const [song, setSong] = useState<Song | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1);
  const [files, setFiles] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const player = useAudioPlayer();

  const playFile = async (file: Song, duration?: number) => {
    if (!FileSystem.cacheDirectory) {
      throw new Error("Cache directory is not available.");
    }
    // const fileUri = FileSystem.cacheDirectory + uri.split("/").pop();

    // await FileSystem.StorageAccessFramework.copyAsync({
    //   from: uri,
    //   to: fileUri,
    // });

    // player.replace({ uri: fileUri });
    await saveSongMetadata(file);
    player.replace({ uri: file.uri });
    player.play();
    setIsPlaying(true);
    setSong(file);
    if (duration) {
      setDuration(duration);
    } else {
      setDuration(player.duration);
    }
    console.log("player.duration ", player.duration);
  };

  const pickFolder = useCallback(async () => {
    setIsLoading(true); // Start loading indicator

    try {
      if (Platform.OS !== "android") {
        throw new Error("Folder picking via SAF is Android-only.");
      }

      let directoryUri: string | null =
        await AsyncStorage.getItem("musicDirectoryUri");

      if (!directoryUri) {
        const perm =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted || !perm.directoryUri) {
          throw new Error("Permission not granted");
        }
        directoryUri = perm.directoryUri;
        await AsyncStorage.setItem("musicDirectoryUri", directoryUri);
      }

      const entries =
        await FileSystem.StorageAccessFramework.readDirectoryAsync(
          directoryUri
        );

      const audioUris = entries.filter(looksLikeAudio);
      if (audioUris.length === 0) {
        setFiles([]);
        setCurrentSongIndex(-1);
        return;
      }

      // Prepare cache dir
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

      setFiles(sortedList); // Set initial file list for immediate render

      const lastSong = await AsyncStorage.getItem("song");
      if (lastSong) {
        const lastSongObject: Song = JSON.parse(lastSong);
        await playFile(lastSongObject);
        setCurrentSongIndex(lastSongObject.index);
        setSong(lastSongObject);
      } else {
        await playFile(sortedList[0]);
        setCurrentSongIndex(0);
      }

      // Fetch metadata in background - RATE LIMITED
      const fetchMetadata = async (song: Song, idx: number) => {
        try {
          const tags = await readTagsForContentUri(song.uri, cacheDir);
          setFiles((prev) =>
            prev.map((f) =>
              f.uri === song.uri ? { ...f, ...tags, index: idx } : f
            )
          );
        } catch (err) {
          console.warn("Metadata parse failed:", err);
        }
      };

      const processMetadata = async () => {
        for (const [idx, song] of sortedList.entries()) {
          await fetchMetadata(song, idx);
          await new Promise((resolve) => setTimeout(resolve, 50)); // Rate limit - adjust as needed
        }
        setIsLoading(false); // Hide loading indicator after all metadata is processed
      };

      processMetadata();
    } catch (error) {
      console.error("Error picking folder:", error);
      // Handle error appropriately (e.g., display an error message)
      setIsLoading(false); // Ensure loading indicator is hidden on error
    } finally {
      setIsLoading(false); // Ensure loading indicator is hidden
    }
  }, []);

  // const currentSong = files[currentSongIndex];
  // console.log("First List Item ", currentSong);
  // console.log("Files ", files);

  // console.log("Player ", player);

  // console.log("files .length", files.length);

  useEffect(() => {
    pickFolder();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (player && isPlaying) {
      interval = setInterval(async () => {
        const status = player.playing;
        if (status) {
          if (status && player.isLoaded) {
            setPosition(player.currentTime);
            setDuration(player.duration || 1);
          }
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, player]);

  const handleChangeSongPosition = (position: number) => {
    player.seekTo(position);
    setPosition(position);
  };

  const playSong = async (index: number) => {
    const selectedIndex = index <= 0 ? 0 : index;

    if (currentSongIndex - 1 === selectedIndex && position >= 5) {
      handleChangeSongPosition(0);
    } else {
      console.log(`Playig ${files[selectedIndex].title}`);
      setCurrentSongIndex(selectedIndex);
      playFile(files[selectedIndex]);
    }
  };

  const playPauseMusic = async () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  console.log("position ", position);
  console.log("duration ", duration);

  return (
    <>
      <LinearGradient colors={["#212528", "#111315"]} className="bg-[#111315]">
        <SafeAreaView>
          {isLoading ? (
            <Text>Loading Music...</Text>
          ) : tabSelected === "list" ? (
            <MusicList
              files={files}
              setTabSelected={setTabSelected}
              playSong={playSong}
              setCurrentSongIndex={setCurrentSongIndex}
              currentSong={song}
            />
          ) : (
            <Playing
              setTabSelected={setTabSelected}
              playSong={playSong}
              currentSongIndex={currentSongIndex}
              playPauseMusic={playPauseMusic}
              duration={duration}
              position={position}
              handleChangeSongPosition={handleChangeSongPosition}
              isPlaying={isPlaying}
              currentSong={song}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default LayoutScreen;
