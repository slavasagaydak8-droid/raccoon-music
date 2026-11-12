import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../../constants/theme';
import { usePlayer } from '../../contexts/PlayerContext';
import { TrackRow } from '../../components/TrackRow';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { tracks, playTrack, toggleFavorite } = usePlayer();
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return tracks.filter((track) => `${track.title} ${track.artist} ${track.album ?? ''} ${track.fileName}`.toLocaleLowerCase().includes(normalized));
  }, [query, tracks]);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.kicker}>НАЙДИ СВОЙ ЗВУК</Text>
      <Text style={s.title}>Поиск</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Треки, исполнители, файлы…"
        placeholderTextColor={theme.muted}
        style={s.input}
        autoCapitalize="none"
        returnKeyType="search"
      />
      <Text style={s.heading}>{query.trim() ? `Результаты · ${results.length}` : 'Поиск по твоей библиотеке'}</Text>
      {!query.trim() ? (
        <View style={s.emptyCard}><Text style={s.emptyIcon}>⌕</Text><Text style={s.sub}>Введи название композиции или исполнителя. Интернет-каталог подключим отдельно после выбора лицензированного источника.</Text></View>
      ) : results.length === 0 ? (
        <Text style={s.sub}>В локальной библиотеке ничего не найдено.</Text>
      ) : results.map((track) => (
        <TrackRow key={track.id} track={track}
          onPress={() => void playTrack(track).catch(() => undefined)}
          onFavorite={() => void toggleFavorite(track.id)} />
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
  input: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 13, padding: 15, color: theme.text, marginTop: 20, fontSize: 14 },
  heading: { color: theme.text, fontWeight: '700', fontSize: 16, marginTop: 28, marginBottom: 12 },
  sub: { color: theme.muted, fontSize: 13, lineHeight: 20 },
  emptyCard: { alignItems: 'center', padding: 25, backgroundColor: theme.surface, borderRadius: 15, gap: 10 },
  emptyIcon: { color: theme.accent, fontSize: 32 },
});
