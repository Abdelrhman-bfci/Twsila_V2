import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, FontFamily, Spacing } from '@core/theme';

const LOGO_SOURCE = require('../../../assets/logo.png');

interface SplashViewProps {
  /** Optional message shown under the spinner (e.g. "Loading…"). */
  message?: string;
  /** When true, hides the spinner — useful for a pure brand splash. */
  hideSpinner?: boolean;
}

/**
 * Branded full-screen splash that mirrors the native splash configured in
 * app.json. Used while the JS layer finishes booting (fonts, i18n, auth
 * session restore) so the user never sees a blank/white screen.
 */
export const SplashView: React.FC<SplashViewProps> = ({
  message,
  hideSpinner,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image
          source={LOGO_SOURCE}
          resizeMode="contain"
          style={styles.logo}
        />
      </View>

      <Text style={styles.brand}>Twsila</Text>

      {!hideSpinner ? (
        <ActivityIndicator
          size="small"
          color={Colors.white}
          style={styles.spinner}
        />
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
  },
  brand: {
    color: Colors.white,
    fontSize: 28,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  spinner: {
    marginTop: Spacing.lg,
  },
  message: {
    marginTop: Spacing.sm,
    color: Colors.white,
    opacity: 0.85,
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
});
