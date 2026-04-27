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
    return (
      <View
        style={[
          styles.badge,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
          },
          style,
        ]}
      >
        <Image
          source={LOGO_SOURCE}
          resizeMode="contain"
          style={[dimension, imageStyle]}
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
    borderRadius: BorderRadius.pill,
    ...Shadows.elevated,
  },
});
