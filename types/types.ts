export interface Song {
  uri: string;
  localUri?: string;
  filename: string;
  title: string | undefined;
  artist: string | null;
  album: string | null;
  coverArt: string | null;
  index: number;
  year?: string | null;
  comment?: string | null;
  date?: number | null;
  duration: number | 0;
  id?: string | null;
  isFavorite?: boolean;
  lyrics?: string | null;
  syncedLyrics?: string | null;
}

export type Artist = {
  name: string;
  image: string | null;
  songs: Song[];
};

export type Playlist = {
  id: string;
  name: string;
  userId?: string;
  userName?: string;
  profileUrl?: string;
  description?: string;
  songs: string[];
  songsLength: number;
  duration: number;
  coverArt?: string;
  createdAt: number;
  updatedAt: number;
};
