import { Song } from "@/types/types";

export const fetchLyrics = async (
  track: Song | null,
  setLyrics: (uri: string, plainLyrics: string, syncedLyrics?: string) => void
) => {
  if (!track) {
    return null;
  }

  const request = await fetch(
    `https://lrclib.net/api/get?artist_name=${encodeURI(track.artist || "").replace(/%20/g, "+")}&track_name=${encodeURI(track.title || "").replace(/%20/g, "+")}`,
    {
      method: "GET",
    }
  );

  const response = await request.json();

  if (response.plainLyrics) {
    if (response.plainLyrics && response.syncedLyrics) {
      setLyrics(track.uri, response.plainLyrics, response.syncedLyrics);
    } else {
      setLyrics(track.uri, response.plainLyrics);
    }
  }
};
