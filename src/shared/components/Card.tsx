import React from 'react';
import { View, StyleSheet, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@core/theme';

interface CardProps extends ViewProps {
  variant?: 'flat' | 'elevated' | 'outlined' | 'tinted';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padded = true,
  style,
  children,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'tinted' && styles.tinted,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.lg,
  },
  padded: { padding: Spacing.sm },
  elevated: { ...Shadows.card },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tinted: {
    backgroundColor: Colors.primarySoft,
  },
});
