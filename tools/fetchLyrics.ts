import { Song } from "@/types/types";
import { addLyrics } from "./db";

export const fetchLyrics = async (
  track: Song | null,
  setLyrics: (id: string, plainLyrics: string, syncedLyrics?: string) => void
) => {
  if (!track) {
    return null;
  }

  try {
    const request = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURI(track.artist || "").replace(/%20/g, "+")}&track_name=${encodeURI(track.title || "").replace(/%20/g, "+")}`,
      {
        method: "GET",
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
      return null;
    }
  } catch (error) {
    console.log(error);
  }
};
