import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { initI18n } from '@core/i18n';
import { loadFonts } from '@core/theme/fonts';
import { Colors, FontFamily } from '@core/theme';
import { AuthProvider } from '@features/auth/presentation/context/AuthContext';
import { AppNavigator } from '@navigation/AppNavigator';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initI18n();
        await loadFonts();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
