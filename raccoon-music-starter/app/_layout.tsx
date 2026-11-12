import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SQLiteProvider } from 'expo-sqlite';
import { PlayerProvider } from '../contexts/PlayerContext';
import { DATABASE_NAME, migrateDbIfNeeded } from '../data/database';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
        <PlayerProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerTitleStyle: { color: theme.text, fontWeight: '700' },
            contentStyle: { backgroundColor: theme.background },
            headerShadowVisible: false,
          }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="player" options={{ presentation: 'modal', title: 'Сейчас играет' }} />
          </Stack>
        </PlayerProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
