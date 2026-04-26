import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@core/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...rest
}) => {
  const containerStyle = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={containerStyle}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? Colors.onPrimary : Colors.primary}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={labelStyle}>{title}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.55 },
  text: { ...Typography.button },

  primaryContainer: {
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  primaryText: { color: Colors.onPrimary },

  secondaryContainer: {
    backgroundColor: Colors.secondary,
    ...Shadows.subtle,
  },
  secondaryText: { color: Colors.onSecondary },

  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  outlineText: { color: Colors.primary },

  ghostContainer: { backgroundColor: 'transparent' },
  ghostText: { color: Colors.primary },

  dangerContainer: { backgroundColor: Colors.error },
  dangerText: { color: Colors.onError },

  smContainer: { paddingVertical: 8, paddingHorizontal: Spacing.md, minHeight: 36 },
  smText: { fontSize: 14 },
  mdContainer: { paddingVertical: 14, paddingHorizontal: Spacing.lg, minHeight: 48 },
  mdText: { fontSize: 16 },
  lgContainer: { paddingVertical: 18, paddingHorizontal: Spacing.lg, minHeight: 56 },
  lgText: { fontSize: 17 },
});
