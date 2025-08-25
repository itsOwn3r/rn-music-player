export interface Song {
  uri: string;
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
}
