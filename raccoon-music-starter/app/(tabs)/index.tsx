import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { usePlayer } from '../../contexts/PlayerContext';
import { TrackRow } from '../../components/TrackRow';

export default function HomeScreen() {
  const router = useRouter();
  const { tracks, playTrack, isLoadingLibrary } = usePlayer();

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.top}>
        <View style={s.brandBlock}>
          <Text style={s.kicker}>GOOD SOUND. GOOD MOOD.</Text>
          <Text style={s.logo}>RACCOON <Text style={s.logoAccent}>MUSIC</Text></Text>
        </View>
        <Image source={require('../../assets/raccoon-logo.png')} style={s.avatar} />
      </View>

      <View style={s.hero}>
        <Text style={s.kicker}>ТВОЯ МУЗЫКА — ТВОИ ПРАВИЛА</Text>
        <Text style={s.heroTitle}>Погрузись{ '\n' }в свой звук.</Text>
        <Text style={s.sub}>Собери музыку, которая звучит именно по-твоему.</Text>
        <View style={s.heroFooter}>
          <Text style={s.heroStat}>{tracks.length} ТРЕКОВ В БИБЛИОТЕКЕ</Text>
          <Pressable onPress={() => router.push('/library')}><Text style={s.heroLink}>ОТКРЫТЬ →</Text></Pressable>
        </View>
      </View>

      <Text style={s.heading}>Быстрый доступ</Text>
      <View style={s.tiles}>
        <Pressable style={s.tile} onPress={() => router.push('/library')}>
          <Text style={s.tileMark}>♡</Text><Text style={s.tileText}>Избранное</Text>
        </Pressable>
        <Pressable style={s.tile} onPress={() => router.push('/playlists')}>
          <Text style={s.tileMark}>♫</Text><Text style={s.tileText}>Плейлисты</Text>
        </Pressable>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.heading}>Недавно добавленные</Text>
        <Pressable onPress={() => router.push('/library')}><Text style={s.more}>ВСЕ →</Text></Pressable>
      </View>
      {isLoadingLibrary ? (
        <Text style={s.empty}>Загружаем твою библиотеку…</Text>
      ) : tracks.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>♫</Text>
          <Text style={s.emptyTitle}>Здесь пока тихо</Text>
          <Text style={s.empty}>Добавь аудиофайлы в разделе «Моя музыка» — они сохранятся на устройстве.</Text>
          <Pressable style={s.importButton} onPress={() => router.push('/library')}><Text style={s.importButtonText}>Добавить музыку</Text></Pressable>
        </View>
      ) : (
        tracks.slice(0, 5).map((track) => (
          <TrackRow key={track.id} track={track} onPress={() => {
            void playTrack(track).then(() => router.push('/player')).catch(() => undefined);
          }} />
        ))
      )}
      <View style={{ height: 115 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingTop: 58, paddingBottom: 30 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  brandBlock: { flex: 1 },
  kicker: { color: theme.muted, fontSize: 9, letterSpacing: 2, fontWeight: '700' },
  logo: { color: theme.text, fontSize: 21, fontWeight: '900', letterSpacing: 0.5, marginTop: 5 },
  logoAccent: { color: theme.accent },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: theme.border, resizeMode: 'cover' },
  hero: { backgroundColor: '#171A20', borderRadius: 20, padding: 22, minHeight: 220, justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  heroTitle: { color: theme.text, fontSize: 34, fontWeight: '800', lineHeight: 39, marginTop: 15 },
  sub: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  heroStat: { color: theme.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  heroLink: { color: theme.accent, fontSize: 10, fontWeight: '800' },
  heading: { color: theme.text, fontSize: 18, fontWeight: '700', marginTop: 27, marginBottom: 13 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, minHeight: 90, borderRadius: 13, padding: 13, justifyContent: 'space-between', backgroundColor: '#202127' },
  tileMark: { color: theme.accent, fontSize: 22 },
  tileText: { color: theme.text, fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: { color: theme.accent, fontSize: 10, fontWeight: '700' },
  empty: { color: theme.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  emptyCard: { alignItems: 'center', padding: 24, backgroundColor: theme.surface, borderRadius: 16, gap: 8 },
  emptyIcon: { fontSize: 34, color: theme.accent },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  importButton: { backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 17, paddingVertical: 11, marginTop: 8 },
  importButtonText: { color: '#101114', fontWeight: '800', fontSize: 12 },
});
