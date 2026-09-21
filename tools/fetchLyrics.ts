import { Song } from "@/types/types";
import { toast } from "sonner-native";
import { addLyrics } from "./db";

export const fetchLyrics = async (
  track: Song | null,
  setLyrics: (id: string, plainLyrics: string, syncedLyrics?: string) => void
) => {
  console.log("OKKKKK");
  if (!track) {
    return null;
  }

  try {
    const request = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURI(track.artist || "").replace(/%20/g, "+")}&track_name=${encodeURI(track.title || "").replace(/%20/g, "+")}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Origin: "https://lrclib.net",
          Referer: "https://lrclib.net/",
        },
      }
    );

    const response = await request.json();

    if (response.plainLyrics) {
      console.log("Set lyrics for ", track.title);

      if (response.plainLyrics && response.syncedLyrics) {
        setLyrics(track.id || "", response.plainLyrics, response.syncedLyrics);
        const lyrics = response.syncedLyrics || response.plainLyrics;
        await addLyrics(track.id || track.uri, response.plainLyrics, lyrics);
        return lyrics;
      } else {
        setLyrics(track.id || "", response.plainLyrics);
        await addLyrics(track.id || track.uri, response.plainLyrics, null);
        return response.plainLyrics;
      }
    } else {
      toast.info("No Lyrics available!");
      return null;
    }
  } catch (error) {
    console.log(error);
  }
};
