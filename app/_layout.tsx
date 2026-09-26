import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';
import { db, getDbInitError } from '../db/client';
import { seedCategories } from '../db/seed';
import migrations from '../drizzle/migrations';
import { colors, typography } from '@/components/ui';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const isSharedArrayBufferError = error.message?.includes('SharedArrayBuffer');

  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>
        {isSharedArrayBufferError ? 'Fitur Web Memerlukan Konteks Aman' : 'Terjadi Kesalahan'}
      </Text>
      <Text style={styles.errorText}>
        {isSharedArrayBufferError
          ? 'Database SQLite pada Web memerlukan SharedArrayBuffer yang aktif. Silakan buka aplikasi pada emulator/perangkat Android atau iOS untuk pengalaman penuh offline.'
          : error.message}
      </Text>
      <Pressable onPress={retry} style={styles.retryButton}>
        <Text style={styles.retryText}>Muat Ulang</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const initError = getDbInitError();

  if (initError) {
    const isSharedArrayBufferError = initError.message?.includes('SharedArrayBuffer');
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          {isSharedArrayBufferError ? 'Kebutuhan Web Browser' : 'Terjadi Kesalahan Database'}
        </Text>
        <Text style={styles.errorText}>
          {isSharedArrayBufferError
            ? 'Database SQLite pada Web memerlukan SharedArrayBuffer (Cross-Origin Isolation). Silakan buka aplikasi pada perangkat Android atau iOS (melalui Expo Go / Development Build) untuk pengalaman penuh offline.'
            : initError.message}
        </Text>
      </View>
    );
  }

  return <RootLayoutContent />;
}

function RootLayoutContent() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    'Inter': Inter_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
  });
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!success) return;
    seedCategories()
      .then(() => setSeeded(true))
      .catch((err) => {
        console.error('Seed error:', err);
        setSeeded(true);
      });
  }, [success]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Terjadi Kesalahan Migrasi</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  if (!success || !seeded || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="record"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  errorTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.red,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  retryText: {
    ...typography.captionBold,
    color: colors.white,
    fontSize: 13,
  },
});
