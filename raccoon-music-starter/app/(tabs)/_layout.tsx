import React from 'react';
import { Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { MiniPlayer } from '../../components/MiniPlayer';
import { theme } from '../../constants/theme';

function TabIcon({ color, text }: { color: string; text: string }) {
  return <Text style={{ color, fontSize: 22, fontWeight: '600' }}>{text}</Text>;
}

export default function TabLayout() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border, height: 62, paddingTop: 6, paddingBottom: 5 },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 10, paddingBottom: 2 },
      }}>
        <Tabs.Screen name="index" options={{ title: 'Главная', tabBarLabel: 'Главная', tabBarIcon: ({ color }) => <TabIcon color={color} text="⌂" /> }} />
        <Tabs.Screen name="search" options={{ title: 'Поиск', tabBarLabel: 'Поиск', tabBarIcon: ({ color }) => <TabIcon color={color} text="⌕" /> }} />
        <Tabs.Screen name="library" options={{ title: 'Моя музыка', tabBarLabel: 'Моя музыка', tabBarIcon: ({ color }) => <TabIcon color={color} text="♫" /> }} />
        <Tabs.Screen name="playlists" options={{ title: 'Плейлисты', tabBarLabel: 'Плейлисты', tabBarIcon: ({ color }) => <TabIcon color={color} text="▤" /> }} />
        <Tabs.Screen name="settings" options={{ title: 'Настройки', tabBarLabel: 'Настройки', tabBarIcon: ({ color }) => <TabIcon color={color} text="⚙" /> }} />
      </Tabs>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 66, zIndex: 20 }}>
        <MiniPlayer onExpand={() => router.push('/player')} />
      </View>
    </View>
  );
}
