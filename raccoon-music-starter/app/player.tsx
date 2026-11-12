import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayer } from '../contexts/PlayerContext';
import { theme } from '../constants/theme';

function formatTime(value: number): string {
  const seconds = Math.max(0, Math.floor(value || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const { current, isPlaying, toggle, next, previous, currentTime, duration, seek, toggleFavorite, tracks } = usePlayer();
  const currentTrack = current ? tracks.find((track) => track.id === current.id) ?? current : null;

  if (!currentTrack) {
    return <View style={s.page}><Text style={s.empty}>Выбери трек из своей библиотеки.</Text></View>;
  }

  return (
    <View style={s.page}>
      <Text style={s.brand}>RACCOON MUSIC</Text>
      <View style={s.art}>
        <Text style={s.artR}>R</Text>
        <Text style={s.artSub}>YOUR SOUND</Text>
      </View>
      <View style={s.trackInfo}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={s.title}>{currentTrack.title}</Text>
          <Text numberOfLines={1} style={s.artist}>{currentTrack.artist}</Text>
        </View>
        <Pressable onPress={() => void toggleFavorite(currentTrack.id)} style={s.favorite}>
          <Text style={[s.favoriteText, currentTrack.isFavorite && s.favoriteActive]}>{currentTrack.isFavorite ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={Math.max(duration, 1)}
        value={Math.min(currentTime, Math.max(duration, 1))}
        onSlidingComplete={(value) => void seek(value).catch(() => Alert.alert('Ошибка', 'Не удалось перемотать трек.'))}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.text}
        disabled={duration <= 0}
      />
      <View style={s.times}><Text style={s.artist}>{formatTime(currentTime)}</Text><Text style={s.artist}>{formatTime(duration)}</Text></View>
      <View style={s.controls}>
        <Pressable onPress={previous} accessibilityLabel="Предыдущий трек"><Text style={s.control}>|‹</Text></Pressable>
        <Pressable onPress={toggle} style={s.play} accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести'}><Text style={s.playText}>{isPlaying ? 'Ⅱ' : '▶'}</Text></Pressable>
        <Pressable onPress={next} accessibilityLabel="Следующий трек"><Text style={s.control}>›|</Text></Pressable>
      </View>
      <Text style={s.localNote}>ЛОКАЛЬНОЕ ВОСПРОИЗВЕДЕНИЕ</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 25 },
  brand: { color: theme.muted, fontSize: 10, letterSpacing: 3, marginBottom: 35 },
  art: { width: '100%', aspectRatio: 1, maxWidth: 330, backgroundColor: '#20242C', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  artR: { fontSize: 120, color: theme.accent, fontWeight: '900' },
  artSub: { color: theme.muted, fontSize: 9, letterSpacing: 4 },
  trackInfo: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 12 },
  title: { color: theme.text, fontSize: 23, fontWeight: '800' },
  artist: { color: theme.muted, fontSize: 13, marginTop: 6 },
  favorite: { padding: 8 },
  favoriteText: { color: theme.muted, fontSize: 27 },
  favoriteActive: { color: theme.accent },
  times: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 42, marginTop: 28 },
  control: { color: theme.text, fontSize: 30 },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#101114', fontSize: 23, fontWeight: '900' },
  localNote: { color: theme.muted, fontSize: 9, letterSpacing: 2, marginTop: 28 },
  empty: { color: theme.muted, fontSize: 15 },
});
