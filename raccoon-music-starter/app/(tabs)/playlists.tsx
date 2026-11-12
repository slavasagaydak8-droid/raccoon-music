import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { theme } from '../../constants/theme';
import { usePlayer } from '../../contexts/PlayerContext';
import { TrackRow } from '../../components/TrackRow';
import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistTracks,
  getPlaylists,
  removeTrackFromPlaylist,
  renamePlaylist,
  type Playlist,
  type Track,
} from '../../data/database';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PlaylistsScreen() {
  const db = useSQLiteContext();
  const { tracks, playTrack, toggleFavorite } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [nameMode, setNameMode] = useState<'create' | 'rename'>('create');
  const [draftName, setDraftName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedId) ?? null;
  const selectedTrackIds = useMemo(() => new Set(selectedTracks.map((track) => track.id)), [selectedTracks]);
  const availableTracks = tracks.filter((track) => !selectedTrackIds.has(track.id));

  const refresh = useCallback(async () => {
    const rows = await getPlaylists(db);
    setPlaylists(rows);
    if (selectedId) {
      const exists = rows.some((playlist) => playlist.id === selectedId);
      if (exists) setSelectedTracks(await getPlaylistTracks(db, selectedId));
      else {
        setSelectedId(null);
        setSelectedTracks([]);
      }
    }
  }, [db, selectedId]);

  useEffect(() => {
    let active = true;
    getPlaylists(db)
      .then((rows) => { if (active) setPlaylists(rows); })
      .catch((error) => {
        console.warn('RACCOON MUSIC playlists load:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить плейлисты.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [db]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTracks([]);
      return;
    }
    let active = true;
    getPlaylistTracks(db, selectedId)
      .then((rows) => { if (active) setSelectedTracks(rows); })
      .catch((error) => {
        console.warn('RACCOON MUSIC playlist tracks load:', error);
        if (active) Alert.alert('Ошибка', 'Не удалось загрузить композиции плейлиста.');
      });
    return () => { active = false; };
  }, [db, selectedId]);

  const openCreate = () => {
    setNameMode('create');
    setDraftName('');
    setNameModalVisible(true);
  };

  const openRename = () => {
    if (!selectedPlaylist) return;
    setNameMode('rename');
    setDraftName(selectedPlaylist.name);
    setNameModalVisible(true);
  };

  const saveName = async () => {
    const name = draftName.trim();
    if (!name) {
      Alert.alert('Название пустое', 'Введи название плейлиста.');
      return;
    }
    setIsSaving(true);
    try {
      if (nameMode === 'create') {
        const id = makeId();
        await createPlaylist(db, id, name);
        setSelectedId(id);
      } else if (selectedId) {
        await renamePlaylist(db, selectedId, name);
      }
      setNameModalVisible(false);
      await refresh();
    } catch (error) {
      console.warn('RACCOON MUSIC save playlist:', error);
      Alert.alert('Не удалось сохранить', 'Возможно, плейлист с таким названием уже существует. Попробуй другое название.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!selectedPlaylist) return;
    Alert.alert('Удалить плейлист?', `«${selectedPlaylist.name}» будет удалён. Сами аудиофайлы останутся в библиотеке.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => {
        void deletePlaylist(db, selectedPlaylist.id)
          .then(() => {
            setSelectedId(null);
            setSelectedTracks([]);
            return refresh();
          })
          .catch((error) => {
            console.warn(error);
            Alert.alert('Ошибка', 'Не удалось удалить плейлист.');
          });
      } },
    ]);
  };

  const addToSelected = async (trackId: string) => {
    if (!selectedId) return;
    try {
      await addTrackToPlaylist(db, selectedId, trackId);
      setSelectedTracks(await getPlaylistTracks(db, selectedId));
      await refresh();
    } catch (error) {
      console.warn(error);
      Alert.alert('Ошибка', 'Не удалось добавить композицию в плейлист.');
    }
  };

  const removeFromSelected = async (trackId: string) => {
    if (!selectedId) return;
    try {
      await removeTrackFromPlaylist(db, selectedId, trackId);
      setSelectedTracks(await getPlaylistTracks(db, selectedId));
      await refresh();
    } catch (error) {
      console.warn(error);
      Alert.alert('Ошибка', 'Не удалось удалить композицию из плейлиста.');
    }
  };

  return (
    <View style={s.page}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>ОРГАНИЗУЙ СВОЙ ЗВУК</Text>
        <Text style={s.title}>Плейлисты</Text>

        {!selectedPlaylist ? (
          <>
            <Pressable style={s.createButton} onPress={openCreate}>
              <Text style={s.createButtonText}>＋  Создать плейлист</Text>
            </Pressable>
            {isLoading ? <Text style={s.note}>Загружаем плейлисты…</Text> : null}
            {!isLoading && playlists.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.mark}>♫</Text>
                <Text style={s.name}>Твоя музыка — твои подборки</Text>
                <Text style={s.sub}>Создай первый плейлист, добавь в него композиции из библиотеки и собери собственный саундтрек.</Text>
              </View>
            ) : null}
            {playlists.map((playlist) => (
              <Pressable key={playlist.id} style={s.playlistRow} onPress={() => setSelectedId(playlist.id)}>
                <View style={s.playlistArt}><Text style={s.playlistArtText}>♫</Text></View>
                <View style={s.playlistInfo}>
                  <Text style={s.playlistName}>{playlist.name}</Text>
                  <Text style={s.note}>{playlist.trackCount} {playlist.trackCount === 1 ? 'трек' : 'треков'}</Text>
                </View>
                <Text style={s.arrow}>›</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <Pressable onPress={() => setSelectedId(null)} style={s.back}><Text style={s.backText}>‹  Все плейлисты</Text></Pressable>
            <View style={s.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.detailTitle}>{selectedPlaylist.name}</Text>
                <Text style={s.note}>{selectedTracks.length} {selectedTracks.length === 1 ? 'трек' : 'треков'}</Text>
              </View>
              <Pressable onPress={openRename} style={s.headerAction}><Text style={s.headerActionText}>Изменить</Text></Pressable>
              <Pressable onPress={confirmDelete} style={s.headerAction}><Text style={s.deleteText}>Удалить</Text></Pressable>
            </View>
            <Pressable style={s.addButton} onPress={() => setAddModalVisible(true)}>
              <Text style={s.addButtonText}>＋  Добавить треки</Text>
            </Pressable>
            {selectedTracks.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.mark}>＋</Text>
                <Text style={s.name}>Плейлист пока пуст</Text>
                <Text style={s.sub}>Добавь композиции из своей музыкальной библиотеки.</Text>
              </View>
            ) : selectedTracks.map((track) => (
              <TrackRow key={track.id} track={track}
                onPress={() => void playTrack(track).catch(() => undefined)}
                onFavorite={() => void toggleFavorite(track.id)}
                onRemove={() => void removeFromSelected(track.id)} />
            ))}
          </>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={() => setNameModalVisible(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{nameMode === 'create' ? 'Новый плейлист' : 'Переименовать плейлист'}</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Название плейлиста"
              placeholderTextColor={theme.muted}
              style={s.input}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={() => void saveName()}
            />
            <View style={s.modalActions}>
              <Pressable onPress={() => setNameModalVisible(false)} style={s.cancelButton}><Text style={s.cancelText}>Отмена</Text></Pressable>
              <Pressable onPress={() => void saveName()} disabled={isSaving} style={s.saveButton}><Text style={s.saveText}>{isSaving ? 'Сохраняем…' : 'Сохранить'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, s.addModalCard]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Добавить композиции</Text>
              <Pressable onPress={() => setAddModalVisible(false)}><Text style={s.close}>×</Text></Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {availableTracks.length === 0 ? (
                <Text style={s.sub}>Все доступные треки уже добавлены или библиотека пока пуста.</Text>
              ) : availableTracks.map((track) => (
                <View key={track.id} style={s.availableRow}>
                  <View style={s.availableInfo}>
                    <Text numberOfLines={1} style={s.playlistName}>{track.title}</Text>
                    <Text numberOfLines={1} style={s.note}>{track.artist}</Text>
                  </View>
                  <Pressable style={s.smallAdd} onPress={() => void addToSelected(track.id)}><Text style={s.smallAddText}>＋</Text></Pressable>
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={() => setAddModalVisible(false)} style={s.doneButton}><Text style={s.saveText}>Готово</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingTop: 58, paddingBottom: 30 },
  kicker: { color: theme.accent, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title: { color: theme.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  createButton: { backgroundColor: theme.accent, padding: 15, borderRadius: 13, alignItems: 'center', marginTop: 24, marginBottom: 18 },
  createButtonText: { color: '#101114', fontSize: 14, fontWeight: '800' },
  playlistRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.border },
  playlistArt: { width: 54, height: 54, borderRadius: 11, backgroundColor: theme.surface2, alignItems: 'center', justifyContent: 'center' },
  playlistArtText: { color: theme.accent, fontSize: 25 },
  playlistInfo: { flex: 1 },
  playlistName: { color: theme.text, fontSize: 14, fontWeight: '700' },
  note: { color: theme.muted, fontSize: 11, marginTop: 4 },
  arrow: { color: theme.muted, fontSize: 28, paddingHorizontal: 7 },
  emptyCard: { alignItems: 'center', padding: 27, backgroundColor: theme.surface, borderRadius: 16, marginTop: 18, gap: 8 },
  mark: { fontSize: 34, color: theme.accent },
  name: { color: theme.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sub: { color: theme.muted, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  back: { marginTop: 22, marginBottom: 15 },
  backText: { color: theme.accent, fontWeight: '700', fontSize: 13 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 },
  detailTitle: { color: theme.text, fontSize: 23, fontWeight: '800' },
  headerAction: { paddingHorizontal: 9, paddingVertical: 9 },
  headerActionText: { color: theme.accent, fontSize: 11, fontWeight: '700' },
  deleteText: { color: theme.danger, fontSize: 11, fontWeight: '700' },
  addButton: { borderWidth: 1, borderColor: theme.accent, borderRadius: 12, padding: 13, alignItems: 'center', marginBottom: 12 },
  addButtonText: { color: theme.accent, fontWeight: '800', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 19 },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  input: { color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 13, marginTop: 18, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  cancelButton: { paddingHorizontal: 15, paddingVertical: 12 },
  cancelText: { color: theme.muted, fontWeight: '700' },
  saveButton: { backgroundColor: theme.accent, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 9 },
  saveText: { color: '#101114', fontWeight: '800', textAlign: 'center' },
  addModalCard: { maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  close: { color: theme.muted, fontSize: 28 },
  availableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 10 },
  availableInfo: { flex: 1 },
  smallAdd: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  smallAddText: { color: '#101114', fontSize: 23, fontWeight: '700' },
  doneButton: { backgroundColor: theme.accent, borderRadius: 10, padding: 13, marginTop: 16 },
});
