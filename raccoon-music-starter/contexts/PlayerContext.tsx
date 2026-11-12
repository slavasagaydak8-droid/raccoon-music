import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';
import {
  deleteTrackRecord,
  getTrackById,
  getTracks,
  insertTrack,
  setTrackFavorite,
  updateTrackDuration,
  type Track,
} from '../data/database';

type ImportResult = { imported: number; failedNames: string[] };

type PlayerValue = {
  tracks: Track[];
  current: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoadingLibrary: boolean;
  refreshTracks: () => Promise<void>;
  importAudioFiles: (assets: DocumentPickerAsset[]) => Promise<ImportResult>;
  removeTrack: (trackId: string) => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  playTrack: (track: Track) => Promise<void>;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerValue | null>(null);

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeFilePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 90) || 'audio';
}

function titleFromFileName(name: string): string {
  return name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Без названия';
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  const refreshTracks = useCallback(async () => {
    const savedTracks = await getTracks(db);
    setTracks(savedTracks);
    setCurrent((oldCurrent) => {
      if (!oldCurrent) return null;
      return savedTracks.find((track) => track.id === oldCurrent.id) ?? null;
    });
  }, [db]);

  useEffect(() => {
    let active = true;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((error) => console.warn('RACCOON MUSIC audio mode:', error));

    getTracks(db)
      .then((savedTracks) => {
        if (active) setTracks(savedTracks);
      })
      .catch((error) => console.warn('RACCOON MUSIC library load:', error))
      .finally(() => {
        if (active) setIsLoadingLibrary(false);
      });

    return () => {
      active = false;
    };
  }, [db]);

  useEffect(() => {
    if (!current || !status.isLoaded || !Number.isFinite(status.duration) || status.duration <= 0) return;
    if (current.duration === status.duration) return;

    const trackId = current.id;
    const duration = status.duration;
    updateTrackDuration(db, trackId, duration)
      .then(() => {
        setCurrent((oldCurrent) => oldCurrent?.id === trackId ? { ...oldCurrent, duration } : oldCurrent);
        setTracks((oldTracks) => oldTracks.map((track) => track.id === trackId ? { ...track, duration } : track));
      })
      .catch((error) => console.warn('RACCOON MUSIC duration metadata:', error));
  }, [current, db, status.duration, status.isLoaded]);

  const importAudioFiles = useCallback(async (assets: DocumentPickerAsset[]): Promise<ImportResult> => {
    const audioDirectory = new Directory(Paths.document, 'audio');
    audioDirectory.create({ idempotent: true, intermediates: true });

    let imported = 0;
    const failedNames: string[] = [];

    for (const asset of assets) {
      const id = makeId();
      const extension = asset.name.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1]?.toLowerCase() ?? 'audio';
      const destination = new File(audioDirectory, `${id}-${safeFilePart(asset.name || `track.${extension}`)}`);

      try {
        const source = new File(asset.uri);
        await source.copy(destination);
        const track: Track = {
          id,
          title: titleFromFileName(asset.name),
          artist: 'Локальный файл',
          uri: destination.uri,
          originalUri: asset.uri,
          fileName: asset.name,
          mimeType: asset.mimeType ?? null,
          fileSize: asset.size ?? destination.size ?? null,
          lastModified: asset.lastModified ?? null,
          duration: null,
          album: null,
          artworkUri: null,
          isFavorite: false,
          createdAt: new Date().toISOString(),
        };
        await insertTrack(db, track);
        imported += 1;
      } catch (error) {
        failedNames.push(asset.name || 'Неизвестный файл');
        try {
          if (destination.exists) destination.delete();
        } catch {
          // Keep the original import error; an orphaned copy can be cleaned later.
        }
        console.warn(`RACCOON MUSIC import failed for ${asset.name}:`, error);
      }
    }

    await refreshTracks();
    return { imported, failedNames };
  }, [db, refreshTracks]);

  const removeTrack = useCallback(async (trackId: string) => {
    const track = await getTrackById(db, trackId);
    await deleteTrackRecord(db, trackId);
    if (current?.id === trackId) {
      player.pause();
      player.setActiveForLockScreen(false);
      setCurrent(null);
    }
    if (track?.uri) {
      try {
        const storedFile = new File(track.uri);
        if (storedFile.exists) storedFile.delete();
      } catch (error) {
        console.warn('RACCOON MUSIC could not remove stored audio file:', error);
      }
    }
    await refreshTracks();
  }, [current?.id, db, player, refreshTracks]);

  const toggleFavorite = useCallback(async (trackId: string) => {
    const track = tracks.find((item) => item.id === trackId);
    if (!track) return;
    await setTrackFavorite(db, trackId, !track.isFavorite);
    await refreshTracks();
  }, [db, refreshTracks, tracks]);

  const playTrack = useCallback(async (track: Track) => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      player.replace({ uri: track.uri });
      player.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist,
        albumTitle: track.album ?? 'RACCOON MUSIC',
      });
      setCurrent(track);
      player.play();
    } catch (error) {
      console.warn('RACCOON MUSIC playback failed:', error);
      throw error;
    }
  }, [player]);

  const move = useCallback((direction: number) => {
    if (!tracks.length) return;
    const index = current ? tracks.findIndex((track) => track.id === current.id) : -1;
    const nextIndex = (index + direction + tracks.length) % tracks.length;
    void playTrack(tracks[nextIndex]).catch((error) => console.warn(error));
  }, [current, playTrack, tracks]);

  const value = useMemo<PlayerValue>(() => ({
    tracks,
    current,
    isPlaying: !!status.playing,
    currentTime: status.currentTime ?? 0,
    duration: status.duration ?? current?.duration ?? 0,
    isLoadingLibrary,
    refreshTracks,
    importAudioFiles,
    removeTrack,
    toggleFavorite,
    playTrack,
    toggle: () => {
      if (status.playing) player.pause();
      else player.play();
    },
    next: () => move(1),
    previous: () => move(-1),
    seek: (seconds) => player.seekTo(seconds),
  }), [
    tracks, current, status.playing, status.currentTime, status.duration,
    isLoadingLibrary, refreshTracks, importAudioFiles, removeTrack,
    toggleFavorite, playTrack, player, move,
  ]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('usePlayer must be used inside PlayerProvider');
  return value;
}
