// tools/db.ts
import { Song } from "@/types/types";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("music.db");

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
      syncedLyrics TEXT
    );

    CREATE TABLE IF NOT EXISTS favorites (
      songId TEXT PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
      date INTEGER
    );
  `);
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
