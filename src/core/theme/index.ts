import { Platform, StyleSheet } from 'react-native';
import { Colors } from './colors';

export { Colors };

export const FontFamily = {
  regular: Platform.select({ ios: 'Cairo-Regular', android: 'Cairo-Regular', default: 'Cairo-Regular' }) || 'Cairo-Regular',
  medium: Platform.select({ ios: 'Cairo-Medium', android: 'Cairo-Medium', default: 'Cairo-Medium' }) || 'Cairo-Medium',
  semiBold: Platform.select({ ios: 'Cairo-SemiBold', android: 'Cairo-SemiBold', default: 'Cairo-SemiBold' }) || 'Cairo-SemiBold',
  bold: Platform.select({ ios: 'Cairo-Bold', android: 'Cairo-Bold', default: 'Cairo-Bold' }) || 'Cairo-Bold',
  extraBold: Platform.select({ ios: 'Cairo-ExtraBold', android: 'Cairo-ExtraBold', default: 'Cairo-ExtraBold' }) || 'Cairo-ExtraBold',
  black: Platform.select({ ios: 'Cairo-Black', android: 'Cairo-Black', default: 'Cairo-Black' }) || 'Cairo-Black',
} as const;

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 34,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 28,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 24,
    fontFamily: FontFamily.semiBold,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text,
    lineHeight: 24,
    fontFamily: FontFamily.regular,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textLight,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textLight,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  containerMargin: 24,
  gutter: 16,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 9999,
} as const;

const indigoShadow = (opacity: number, blur: number, offsetY: number) => ({
  shadowColor: '#3730A3',
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: blur,
  elevation: Math.max(1, Math.round(blur / 2)),
});

export const Shadows = StyleSheet.create({
  none: {
    shadowColor: 'transparent',
    elevation: 0,
  },
  subtle: indigoShadow(0.03, 4, 1),
  card: indigoShadow(0.04, 8, 2),
  elevated: indigoShadow(0.06, 16, 4),
  premium: indigoShadow(0.08, 20, 6),
});
