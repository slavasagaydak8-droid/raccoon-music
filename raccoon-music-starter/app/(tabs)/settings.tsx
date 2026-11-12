import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';

const rows = [
  { title: 'Хранилище', detail: 'Библиотека и плейлисты сохраняются локально в SQLite' },
  { title: 'Импорт музыки', detail: 'Аудиофайлы копируются в память приложения' },
  { title: 'Фоновое воспроизведение', detail: 'Настроено через expo-audio; требуется проверка на устройстве' },
  { title: 'Интернет-каталог', detail: 'Пока не подключён — выбираем только лицензированные источники' },
  { title: 'Эквалайзер', detail: 'Будет добавлен после выбора совместимого аудио DSP-модуля' },
];

export default function SettingsScreen() {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.kicker}>ПЕРСОНАЛИЗАЦИЯ</Text>
      <Text style={s.title}>Настройки</Text>
      <View style={s.group}>
        {rows.map((row) => (
          <View key={row.title} style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{row.title}</Text>
              <Text style={s.detail}>{row.detail}</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </View>
        ))}
      </View>
      <Text style={s.footer}>RACCOON MUSIC · YOUR MUSIC. YOUR WORLD.{ '\n' }VERSION 0.2.0</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, paddingTop: 58 },
  kicker: { color: theme.accent, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  title: { color: theme.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  group: { backgroundColor: theme.surface, borderRadius: 15, paddingHorizontal: 15, marginTop: 28 },
  row: { minHeight: 68, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 12 },
  label: { color: theme.text, fontSize: 14, fontWeight: '600' },
  detail: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  arrow: { color: theme.muted, fontSize: 22 },
  footer: { color: theme.muted, fontSize: 9, letterSpacing: 1, textAlign: 'center', marginTop: 35, lineHeight: 18 },
});
