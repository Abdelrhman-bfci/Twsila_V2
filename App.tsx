import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { initI18n } from '@core/i18n';
import { loadFonts } from '@core/theme/fonts';
import { AuthProvider } from '@features/auth/presentation/context/AuthContext';
import { AppNavigator } from '@navigation/AppNavigator';

// Keep the native splash visible until we explicitly hide it. This must run as
// early as possible — at module load — so the Android/iOS splash stays up
// while React, fonts, and i18n boot. Wrapped in a try/catch because in some
// fast-refresh scenarios it may be called twice.
try {
  void SplashScreen.preventAutoHideAsync();
} catch {
  // no-op
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Run i18n + fonts in parallel and never let either failure freeze
        // the app — we want to fall back to defaults rather than be stuck
        // on the native splash forever.
        await Promise.allSettled([initI18n(), loadFonts()]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the native splash as soon as our first JS frame is ready to render.
  const onLayoutRootView = useCallback(async () => {
    if (!ready) return;
    try {
      await SplashScreen.hideAsync();
    } catch {
      // no-op — already hidden
    }
  }, [ready]);

  if (!ready) {
    // While we wait for fonts/i18n, the native splash is still visible, so
    // returning a transparent view is fine. SplashView is rendered as a JS
    // fallback below for the auth-restore phase.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
