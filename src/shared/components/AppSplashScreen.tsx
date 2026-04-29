import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  Image,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Shadows, FontFamily, Spacing } from '@core/theme';

const { width } = Dimensions.get('window');

export const AppSplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require('../../../assets/logo.png')}
            resizeMode="cover"
            style={styles.logoImg}
          />
        </View>
        <Text style={styles.appName}>{t('common.appName').toUpperCase()}</Text>
        <Text style={styles.tagline}>{t('common.tagline')}</Text>
      </Animated.View>
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F108E', // Direct primary color to avoid any initialization issues
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.elevated,
  },
  logoImg: { width: 200, height: 200 },
  appName: {
    marginTop: Spacing.md,
    fontSize: 30,
    color: '#FFFFFF',
    fontFamily: FontFamily.black,
    letterSpacing: 1.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 50,
  },
});
