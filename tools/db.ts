// tools/db.ts
import { Playlist, Song } from "@/types/types";
import * as SQLite from "expo-sqlite";
import uuid from "react-native-uuid";

export const db = SQLite.openDatabaseSync("music.db");

export async function initDB() {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY NOT NULL,
      uri TEXT UNIQUE,
      localUri TEXT DEFAULT NULL,
      filename TEXT,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration REAL,
      coverArt TEXT,
      size INTEGER,
      date INTEGER,
      year INTEGER,
      lyrics TEXT,
      syncedLyrics TEXT,
      playCount INTEGER DEFAULT 0,
      lastPlayedAt INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      coverArt TEXT,
      type TEXT DEFAULT 'user',
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlistId TEXT REFERENCES playlists(id) ON DELETE CASCADE,
      songId TEXT REFERENCES songs(id) ON DELETE CASCADE,
      PRIMARY KEY (playlistId, songId)
    );

  `);

  const now = Date.now();

  const systemPlaylists = [
    {
      id: "downloads",
      name: "Downloads",
      description: "Downloaded songs",
      type: "user",
    },
    {
      id: "recent",
      name: "Recently Added",
      description: "Songs you’ve recently added",
      type: "system",
    },
    {
      id: "favorites",
      name: "Favorites",
      description: "Your favorite songs collection",
      type: "user",
    },
    {
      id: "most-played",
      name: "Most Played",
      description: "Your top 50 most listened songs",
      type: "system",
    },
  ];

  for (const { id, name, description, type } of systemPlaylists) {
    const exists = await db.getFirstAsync(
      `SELECT id FROM playlists WHERE id = ?`,
      [id]
    );
    if (!exists) {
      await db.runAsync(
        `INSERT INTO playlists (id, name, description, type, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, description, type, now, now]
      );
    }
  }
}

export async function addSong(song: Song) {
  await db.runAsync(
    `INSERT OR REPLACE INTO songs
      (id, uri, filename, title, artist, album, duration, coverArt, size, date, year, lyrics, syncedLyrics)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'), ?, ?, ?)`,

    [
      song.id || song.uri,
      song.uri ?? null,
      song.filename ?? null,
      song.title ?? null,
      song.artist ?? null,
      song.album ?? null,
      song.duration ?? 0,
      song.coverArt ?? null,
      song.size ?? 0,
      song.year ?? null,
      song.lyrics ?? null,
      song.syncedLyrics ?? null,
    ]
  );
}

export async function getSong(songId: string): Promise<Song | undefined> {
  if (!songId) {
    return undefined;
  }
  const row = await db.getFirstAsync(
    `SELECT * FROM songs WHERE id = ? ORDER BY date DESC`,
    [songId]
  );

  return row as Song | undefined;
}

export async function getAllSongs(): Promise<Song[]> {
  const rows = await db.getAllAsync(`SELECT * FROM songs ORDER BY date DESC`);
  return rows as Song[];
}

export async function getSongInfoFromDB(id: string): Promise<Song | null> {
  if (!id) return null;
  const row = await db.getFirstAsync(`SELECT * FROM songs WHERE id = ?`, [id]);
  return row ? (row as Song) : null;
}

export async function removeSong(id: string) {
  await db.runAsync(`DELETE FROM songs WHERE id = ?`, [id]);
}

export async function clearSongs() {
  await db.execAsync(`DELETE FROM songs`);
}

export async function addLyrics(
  songId: string,
  lyrics: string,
  syncedLyrics: string | null
) {
  await db.runAsync(
    "UPDATE songs SET lyrics = ?, syncedLyrics = ? WHERE id = ?",
    [lyrics, syncedLyrics, songId]
  );
}

export async function incrementPlayCountInDB(
  songId: string | null | undefined
) {
  if (!songId) {
    return;
  }
  await db.runAsync(
    "UPDATE songs SET playCount = COALESCE(playCount, 0) + 1, lastPlayedAt = strftime('%s','now') WHERE id = ?",
    [songId]
  );
}

export async function updateSongSyncedLyrics(
  id: string,
  syncedLyrics: string
): Promise<void> {
  if (!id) {
    return;
  }

  await db.runAsync(`UPDATE songs SET syncedLyrics = ? WHERE id = ?`, [
    syncedLyrics,
    id,
  ]);
}

export async function createPlaylist(name: string, description?: string) {
  const id = uuid.v4().toString().slice(-8);
  const now = Date.now();
  try {
    await db.runAsync(
      `INSERT INTO playlists (id, name, description, coverArt, type, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description || "", null, "user", now, now]
    );
  } catch (error) {
    console.log(error);
  }

  return id;
}

export async function getAllPlaylists(
  type: "user" | "system" | "all" = "all"
): Promise<Playlist[]> {
  let query = `SELECT * FROM playlists`;
  const params: any[] = [];

  if (type === "user" || type === "system") {
    query += ` WHERE type = ?`;
    params.push(type);
  }

  const playlists: Playlist[] = await db.getAllAsync(query, params);
  for (const playlist of playlists) {
    const songs: Song[] = await db.getAllAsync(
      `SELECT s.* FROM songs s
       JOIN playlist_songs ps ON ps.songId = s.id
       WHERE ps.playlistId = ?`,
      [playlist.id]
    );
    playlist.songs = songs;
    playlist.songsLength = songs.length;
    playlist.duration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  }

  return playlists;
}

export async function getSpeceficSystemPlaylist(
  type: "recent" | "most-played"
) {
  let songs: Song[] = [];

  const playlist: Playlist | null = await db.getFirstAsync(
    `SELECT * FROM playlists WHERE type = ? AND id = ?`,
    ["system", type]
  );

  if (!playlist) {
    return;
  }

  if (type === "recent") {
    // Recently added: last 50 songs by date
    songs = await db.getAllAsync(`
        SELECT * FROM songs
        ORDER BY date DESC
      `);
  } else if (type === "most-played") {
    // Most played: top 50 by playCount
    songs = await db.getAllAsync(`
        SELECT * FROM songs
        WHERE playCount > 0
        ORDER BY playCount DESC, lastPlayedAt DESC
        LIMIT 50
      `);
  }

  playlist.songs = songs;
  playlist.songsLength = songs.length;
  playlist.duration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  return playlist;
}

export async function addSongToPlaylist(playlistId: string, songId: string) {
  if (playlistId === "recent" || playlistId === "most-played") {
    return;
  }
  const playlistSize: { count: number } | null = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM playlist_songs WHERE playlistId = ?`,
    [playlistId]
  );

  if (playlistSize?.count === 0) {
    const song: Song | undefined = await getSong(songId);
    if (song && song.coverArt) {
      await db.runAsync(`UPDATE playlists SET coverArt = ? WHERE id = ?`, [
        song.coverArt,
        playlistId,
      ]);
    }
  }
  await db.runAsync(
    `INSERT OR IGNORE INTO playlist_songs (playlistId, songId) VALUES (?, ?)`,
    [playlistId, songId]
  );
  await db.runAsync(`UPDATE playlists SET updatedAt = ? WHERE id = ?`, [
    Date.now(),
    playlistId,
  ]);
}

export async function removePlaylist(playlistId: string) {
  if (
    playlistId === "downloads" ||
    playlistId === "recent" ||
    playlistId === "most-played" ||
    playlistId === "favorites"
  ) {
    return;
  }
  await db.runAsync(`DELETE FROM playlists WHERE id = ?`, [playlistId]);
}

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
) {
  if (playlistId === "recent" || playlistId === "most-played") {
    return;
  }
  await db.runAsync(
    `DELETE FROM playlist_songs WHERE playlistId = ? AND songId = ?`,
    [playlistId, songId]
  );
  await db.runAsync(`UPDATE playlists SET updatedAt = ? WHERE id = ?`, [
    Date.now(),
    playlistId,
  ]);
}
export async function addFavorite(songId: string) {
  await addSongToPlaylist("favorites", songId);
}

export async function removeFavorite(songId: string) {
  await removeSongFromPlaylist("favorites", songId);
}

export async function getFavoriteSongs(): Promise<Song[]> {
  const playlist = await db.getFirstAsync(
    `SELECT * FROM playlists WHERE id = 'favorites'`
  );

  if (!playlist) return [];

  const songs: Song[] = await db.getAllAsync(
    `SELECT s.* FROM songs s
     JOIN playlist_songs ps ON ps.songId = s.id
     WHERE ps.playlistId = ?`,
    ["favorites"]
  );

  return songs;
}

export async function setLocalURI(localUri: string, songId: string) {
  await db.runAsync(`UPDATE songs SET localUri = ? WHERE id = ?`, [
    localUri,
    songId,
  ]);
}
