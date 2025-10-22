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

    CREATE TABLE IF NOT EXISTS favorites (
      songId TEXT PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
      date INTEGER
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
    { id: "downloads", name: "Downloads", description: "Downloaded songs" },
    {
      id: "recent",
      name: "Recently Added",
      description: "Songs you’ve recently added",
    },
    {
      id: "most-played",
      name: "Most Played",
      description: "Your top 50 most listened songs",
    },
    {
      id: "favorites",
      name: "Your Favorite Songs",
      description: "Your favorite songs collection",
    },
  ];

  for (const { id, name, description } of systemPlaylists) {
    const exists = await db.getFirstAsync(
      `SELECT id FROM playlists WHERE id = ?`,
      [id]
    );
    if (!exists) {
      await db.runAsync(
        `INSERT INTO playlists (id, name, description, type, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, description, "system", now, now]
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

export async function removeSong(id: string) {
  await db.runAsync(`DELETE FROM songs WHERE id = ?`, [id]);
}

export async function clearSongs() {
  await db.execAsync(`DELETE FROM songs`);
}

// Favorites handling
export async function addFavorite(songId: string) {
  await db.runAsync(
    "INSERT OR REPLACE INTO favorites (songId, date) VALUES (?, strftime('%s','now'))",
    [songId]
  );
}

export async function removeFavorite(songId: string) {
  await db.runAsync("DELETE FROM favorites WHERE songId = ?", [songId]);
}

export async function getFavoriteSongs(): Promise<Song[]> {
  const rows = await db.getAllAsync(`
    SELECT songs.* FROM songs
    JOIN favorites ON songs.id = favorites.songId
    ORDER BY favorites.date DESC
  `);
  return rows as Song[];
}

export async function addLyrics(
  songId: string,
  lyrics: string,
  syncedLyrics: string
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

export async function createPlaylist(name: string, description?: string) {
  const id = uuid.v4().toString().slice(-8);
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO playlists (id, name, description, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, description || "", "user", now, now]
  );

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
  console.log("PPPPPPPPPPlylists", playlists);
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

export async function addSongToPlaylist(playlistId: string, songId: string) {
  if (
    playlistId === "downloads" ||
    playlistId === "recent" ||
    playlistId === "most-played" ||
    playlistId === "favorites"
  ) {
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
  if (
    playlistId === "downloads" ||
    playlistId === "recent" ||
    playlistId === "most-played" ||
    playlistId === "favorites"
  ) {
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
