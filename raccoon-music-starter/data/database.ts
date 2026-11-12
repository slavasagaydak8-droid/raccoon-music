import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'raccoon-music.db';
export const DATABASE_VERSION = 1;

export type Track = {
  id: string;
  title: string;
  artist: string;
  uri: string;
  originalUri: string | null;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  lastModified: number | null;
  duration: number | null;
  album: string | null;
  artworkUri: string | null;
  isFavorite: boolean;
  createdAt: string;
};

export type Playlist = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  trackCount: number;
};

type TrackRow = Omit<Track, 'isFavorite'> & { isFavorite: number };
type PlaylistRow = Omit<Playlist, 'trackCount'> & { trackCount: number };

const TRACK_COLUMNS = `
  id,
  title,
  artist,
  uri,
  original_uri AS originalUri,
  file_name AS fileName,
  mime_type AS mimeType,
  file_size AS fileSize,
  last_modified AS lastModified,
  duration,
  album,
  artwork_uri AS artworkUri,
  is_favorite AS isFavorite,
  created_at AS createdAt
`;

function mapTrack(row: TrackRow): Track {
  return { ...row, isFavorite: row.isFavorite === 1 };
}

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL DEFAULT 'Локальный файл',
        uri TEXT NOT NULL,
        original_uri TEXT,
        file_name TEXT NOT NULL,
        mime_type TEXT,
        file_size INTEGER,
        last_modified INTEGER,
        duration REAL,
        album TEXT,
        artwork_uri TEXT,
        is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        added_at TEXT NOT NULL,
        PRIMARY KEY (playlist_id, track_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tracks_favorite ON tracks(is_favorite);
      CREATE INDEX IF NOT EXISTS idx_playlist_tracks_order ON playlist_tracks(playlist_id, sort_order);
      PRAGMA user_version = 1;
    `);
  }
}

export async function getTracks(db: SQLiteDatabase, favoritesOnly = false): Promise<Track[]> {
  const where = favoritesOnly ? 'WHERE is_favorite = 1' : '';
  const rows = await db.getAllAsync<TrackRow>(
    `SELECT ${TRACK_COLUMNS} FROM tracks ${where} ORDER BY created_at DESC`,
  );
  return rows.map(mapTrack);
}

export async function getTrackById(db: SQLiteDatabase, id: string): Promise<Track | null> {
  const row = await db.getFirstAsync<TrackRow>(
    `SELECT ${TRACK_COLUMNS} FROM tracks WHERE id = ?`,
    id,
  );
  return row ? mapTrack(row) : null;
}

export async function insertTrack(db: SQLiteDatabase, track: Track): Promise<void> {
  await db.runAsync(
    `INSERT INTO tracks (
      id, title, artist, uri, original_uri, file_name, mime_type,
      file_size, last_modified, duration, album, artwork_uri,
      is_favorite, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    track.id,
    track.title,
    track.artist,
    track.uri,
    track.originalUri,
    track.fileName,
    track.mimeType,
    track.fileSize,
    track.lastModified,
    track.duration,
    track.album,
    track.artworkUri,
    track.isFavorite ? 1 : 0,
    track.createdAt,
  );
}

export async function updateTrackDuration(
  db: SQLiteDatabase,
  trackId: string,
  duration: number,
): Promise<void> {
  await db.runAsync('UPDATE tracks SET duration = ? WHERE id = ?', duration, trackId);
}

export async function setTrackFavorite(
  db: SQLiteDatabase,
  trackId: string,
  isFavorite: boolean,
): Promise<void> {
  await db.runAsync('UPDATE tracks SET is_favorite = ? WHERE id = ?', isFavorite ? 1 : 0, trackId);
}

export async function deleteTrackRecord(db: SQLiteDatabase, trackId: string): Promise<void> {
  await db.runAsync('DELETE FROM tracks WHERE id = ?', trackId);
}

export async function getPlaylists(db: SQLiteDatabase): Promise<Playlist[]> {
  return db.getAllAsync<PlaylistRow>(`
    SELECT p.id, p.name,
      p.created_at AS createdAt,
      p.updated_at AS updatedAt,
      COUNT(pt.track_id) AS trackCount
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
    GROUP BY p.id
    ORDER BY p.updated_at DESC, p.name COLLATE NOCASE ASC
  `);
}

export async function createPlaylist(db: SQLiteDatabase, id: string, name: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    id,
    name.trim(),
    now,
    now,
  );
}

export async function renamePlaylist(db: SQLiteDatabase, id: string, name: string): Promise<void> {
  await db.runAsync(
    'UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?',
    name.trim(),
    new Date().toISOString(),
    id,
  );
}

export async function deletePlaylist(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM playlists WHERE id = ?', id);
}

export async function getPlaylistTracks(db: SQLiteDatabase, playlistId: string): Promise<Track[]> {
  const rows = await db.getAllAsync<TrackRow>(`
    SELECT ${TRACK_COLUMNS}
    FROM tracks t
    INNER JOIN playlist_tracks pt ON pt.track_id = t.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.sort_order ASC, pt.added_at ASC
  `, playlistId);
  return rows.map(mapTrack);
}

export async function addTrackToPlaylist(
  db: SQLiteDatabase,
  playlistId: string,
  trackId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, sort_order, added_at)
     VALUES (?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM playlist_tracks WHERE playlist_id = ?), 0), ?)`,
    playlistId,
    trackId,
    playlistId,
    new Date().toISOString(),
  );
  await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', new Date().toISOString(), playlistId);
}

export async function removeTrackFromPlaylist(
  db: SQLiteDatabase,
  playlistId: string,
  trackId: string,
): Promise<void> {
  await db.runAsync(
    'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
    playlistId,
    trackId,
  );
  await db.runAsync('UPDATE playlists SET updated_at = ? WHERE id = ?', new Date().toISOString(), playlistId);
}
