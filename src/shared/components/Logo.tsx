import React from 'react';
import {
  View,
  Image,
  ImageStyle,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';

import { BorderRadius, Shadows } from '@core/theme';

export type LogoVariant = 'plain' | 'badge';

interface LogoProps {
  size?: number;
  variant?: LogoVariant;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

const LOGO_SOURCE = require('../../../assets/logo.png');

export const Logo: React.FC<LogoProps> = ({
  size = 96,
  variant = 'plain',
  style,
  imageStyle,
}) => {
  const dimension = { width: size, height: size };

  if (variant === 'badge') {
    const imgSize = size * 1.65; // Scale up further to fill circle edges like in LoginScreen
    return (
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Image
          source={LOGO_SOURCE}
          resizeMode="cover"
          style={[{ width: imgSize, height: imgSize }, imageStyle]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.plain, dimension, style]}>
      <Image
        source={LOGO_SOURCE}
        resizeMode="contain"
        style={[dimension, imageStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  plain: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
