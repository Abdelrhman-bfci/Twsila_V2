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
    return (
      <View style={styles.splash}>
        <View style={styles.logo}>
          <Image
            source={require('./assets/logo.png')}
            resizeMode="contain"
            style={{ width: 120, height: 120 }}
          />
        </View>
        <Text style={styles.brand}>TWSILA</Text>
        <ActivityIndicator color="#FFFFFF" style={{ marginTop: 16 }} />
      </View>
    );
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
  splash: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    marginTop: 16,
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: FontFamily.black,
    letterSpacing: 1.5,
    fontWeight: '900',
  },
});
