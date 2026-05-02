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
  View,
  I18nManager,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@core/theme';
import { isRTL } from '@core/i18n';

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
    { flexDirection: isRTL() === I18nManager.isRTL ? 'row' : 'row-reverse' },
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
          {leftIcon && (
            <View style={isRTL() && styles.rtlFlip}>{leftIcon}</View>
          )}
          <Text style={labelStyle}>{title}</Text>
          {rightIcon && (
            <View style={isRTL() && styles.rtlFlip}>{rightIcon}</View>
          )}
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
    borderRadius: BorderRadius.pill,
  },
  rtlFlip: {
    transform: [{ scaleX: -1 }],
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.55 },
  text: { ...Typography.button },

  primaryContainer: {
    backgroundColor: Colors.primary,
    ...Shadows.card,
  },
  primaryText: { color: Colors.onPrimary },

  secondaryContainer: {
    backgroundColor: Colors.secondary,
    ...Shadows.card,
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

  smContainer: { paddingVertical: 5, paddingHorizontal: Spacing.md, minHeight: 30 },
  smText: { fontSize: 12 },
  mdContainer: { paddingVertical: 8, paddingHorizontal: Spacing.lg, minHeight: 38 },
  mdText: { fontSize: 13 },
  lgContainer: { paddingVertical: 12, paddingHorizontal: Spacing.lg, minHeight: 46 },
  lgText: { fontSize: 15 },
});
