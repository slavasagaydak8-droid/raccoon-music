import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayer } from '../contexts/PlayerContext';
import { theme } from '../constants/theme';

export function MiniPlayer({ onExpand }: { onExpand: () => void }) {
  const { current, isPlaying, toggle, next } = usePlayer();
  if (!current) return null;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.info} onPress={onExpand} accessibilityRole="button" accessibilityLabel="Открыть плеер">
        <View style={styles.art}><Text style={styles.r}>R</Text></View>
        <View style={styles.text}>
          <Text numberOfLines={1} style={styles.title}>{current.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{current.artist}</Text>
        </View>
      </Pressable>
      <Pressable onPress={toggle} style={styles.action} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Пауза' : 'Продолжить'}>
        <Text style={styles.icon}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
      </Pressable>
      <Pressable onPress={next} style={styles.action} accessibilityRole="button" accessibilityLabel="Следующий трек">
        <Text style={styles.icon}>»</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 62, marginHorizontal: 12, borderRadius: 13, backgroundColor: '#242830', borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9 },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  art: { width: 42, height: 42, borderRadius: 7, backgroundColor: '#393D46', alignItems: 'center', justifyContent: 'center' },
  r: { color: theme.accent, fontWeight: '900', fontSize: 19 },
  text: { flex: 1, minWidth: 0 },
  title: { color: theme.text, fontWeight: '600', fontSize: 13 },
  artist: { color: theme.muted, fontSize: 11, marginTop: 3 },
  action: { paddingHorizontal: 11, paddingVertical: 8 },
  icon: { color: theme.text, fontSize: 20, fontWeight: '700' },
});
