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
  size?: number;
  playCount?: number;
  lastPlayedAt?: number;
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
  songs: Song[];
  songsLength: number;
  duration: number;
  coverArt?: string;
  createdAt: number;
  updatedAt: number;
};

export type Album = {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  coverArt?: string;
  songs: Song[];
  releaseDate: number;
  duration: number;
  genre?: string;
  createdAt: number;
  updatedAt: number;
};
