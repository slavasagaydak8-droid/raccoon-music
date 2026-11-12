import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../data/database';
import { theme } from '../constants/theme';

export function TrackRow({
  track,
  onPress,
  onFavorite,
  onRemove,
}: {
  track: Track;
  onPress: () => void;
  onFavorite?: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.main} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Воспроизвести ${track.title}`}>
        <View style={styles.art}><Text style={styles.artText}>R</Text></View>
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{track.artist}</Text>
        </View>
      </Pressable>
      {onFavorite ? (
        <Pressable onPress={onFavorite} style={styles.action} accessibilityRole="button" accessibilityLabel={track.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}>
          <Text style={[styles.heart, track.isFavorite && styles.heartActive]}>{track.isFavorite ? '♥' : '♡'}</Text>
        </Pressable>
      ) : null}
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.action} accessibilityRole="button" accessibilityLabel="Удалить">
          <Text style={styles.remove}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 3 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, minWidth: 0 },
  art: { width: 48, height: 48, borderRadius: 9, backgroundColor: '#272A31', alignItems: 'center', justifyContent: 'center' },
  artText: { color: theme.accent, fontSize: 20, fontWeight: '800' },
  info: { flex: 1, gap: 4, minWidth: 0 },
  title: { color: theme.text, fontSize: 14, fontWeight: '600' },
  artist: { color: theme.muted, fontSize: 12 },
  action: { minWidth: 36, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  heart: { color: theme.muted, fontSize: 22 },
  heartActive: { color: theme.accent },
  remove: { color: theme.muted, fontSize: 25 },
});
