import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../../constants/theme';
import { usePlayer } from '../../contexts/PlayerContext';
import { TrackRow } from '../../components/TrackRow';

export default function LibraryScreen() {
  const { tracks, importAudioFiles, removeTrack, toggleFavorite, playTrack, isLoadingLibrary } = usePlayer();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const visibleTracks = filter === 'favorites' ? tracks.filter((track) => track.isFavorite) : tracks;

  const importAudio = async () => {
    if (isImporting) return;
    setIsImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const outcome = await importAudioFiles(result.assets);
      if (outcome.failedNames.length) {
        Alert.alert(
          'Импорт завершён не полностью',
          `Добавлено: ${outcome.imported}. Не удалось импортировать: ${outcome.failedNames.join(', ')}`,
        );
      } else {
        Alert.alert('Готово', `Добавлено аудиофайлов: ${outcome.imported}`);
      }
    } catch (error) {
      console.warn('RACCOON MUSIC picker error:', error);
      Alert.alert('Не удалось добавить музыку', 'Попробуй выбрать аудиофайлы ещё раз.');
    } finally {
      setIsImporting(false);
    }
  };

  const confirmRemove = (trackId: string, title: string) => {
    Alert.alert('Удалить трек?', `«${title}» будет удалён из библиотеки и из плейлистов. Копия файла в RACCOON MUSIC также будет удалена.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => {
        void removeTrack(trackId).catch((error) => {
          console.warn(error);
          Alert.alert('Ошибка', 'Не удалось удалить трек.');
        });
      } },
    ]);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.kicker}>ТВОЯ КОЛЛЕКЦИЯ</Text>
      <Text style={s.title}>Моя музыка</Text>
      <Text style={s.sub}>Импортируй аудиофайлы с устройства. RACCOON MUSIC сохранит их копии в своём хранилище, чтобы библиотека не зависела от временного кэша.</Text>
      <Pressable onPress={() => void importAudio()} disabled={isImporting} style={[s.button, isImporting && s.buttonDisabled]}>
        <Text style={s.buttonText}>{isImporting ? 'Импортируем…' : '＋  Добавить музыку'}</Text>
      </Pressable>
      <View style={s.filters}>
        <Pressable onPress={() => setFilter('all')} style={[s.filter, filter === 'all' && s.filterActive]}><Text style={[s.filterText, filter === 'all' && s.filterTextActive]}>Все · {tracks.length}</Text></Pressable>
        <Pressable onPress={() => setFilter('favorites')} style={[s.filter, filter === 'favorites' && s.filterActive]}><Text style={[s.filterText, filter === 'favorites' && s.filterTextActive]}>Избранное · {tracks.filter((track) => track.isFavorite).length}</Text></Pressable>
      </View>
      {isLoadingLibrary ? <Text style={s.empty}>Загружаем библиотеку…</Text> : null}
      {visibleTracks.length === 0 && !isLoadingLibrary ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>{filter === 'favorites' ? '♡' : '♫'}</Text>
          <Text style={s.emptyTitle}>{filter === 'favorites' ? 'Пока нет избранных треков' : 'Библиотека пуста'}</Text>
          <Text style={s.empty}>{filter === 'favorites' ? 'Нажимай на сердечко рядом с композицией, чтобы сохранить её здесь.' : 'Добавь музыку с телефона или из приложения «Файлы».'}</Text>
        </View>
      ) : null}
      {visibleTracks.map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          onPress={() => void playTrack(track).catch(() => Alert.alert('Ошибка воспроизведения', 'Не удалось открыть этот аудиофайл.'))}
          onFavorite={() => void toggleFavorite(track.id)}
          onRemove={() => confirmRemove(track.id, track.title)}
        />
      ))}
      <View style={{ height: 110 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingTop: 58, paddingBottom: 30 },
  kicker: { color: theme.accent, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title: { color: theme.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  sub: { color: theme.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  button: { backgroundColor: theme.accent, padding: 16, borderRadius: 13, alignItems: 'center', marginTop: 23 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#101114', fontWeight: '800', fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 23, marginBottom: 10 },
  filter: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  filterActive: { backgroundColor: theme.surface2, borderColor: theme.accent },
  filterText: { color: theme.muted, fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: theme.text },
  emptyCard: { alignItems: 'center', padding: 27, backgroundColor: theme.surface, borderRadius: 16, marginTop: 15, gap: 8 },
  emptyIcon: { fontSize: 36, color: theme.accent },
  emptyTitle: { color: theme.text, fontWeight: '700', fontSize: 16 },
  empty: { color: theme.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
