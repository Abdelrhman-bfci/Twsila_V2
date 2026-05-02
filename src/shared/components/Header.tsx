import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily } from '@core/theme';
import { isRTL } from '@core/i18n';

export type HeaderVariant = 'default' | 'branded' | 'minimal';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
  /** `default` — centered title; `branded` — TWSILA wordmark + optional subtitle; `minimal` — compact one-line. */
  variant?: HeaderVariant;
  style?: StyleProp<ViewStyle>;
}

const backChevronName = (): keyof typeof Ionicons.glyphMap =>
  isRTL() ? 'chevron-forward' : 'chevron-back';

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  right,
  transparent = false,
  variant = 'default',
  style,
}) => {
  useTranslation(); // Force re-render on language change
  const backIcon = backChevronName();
  if (variant === 'branded') {
    return (
      <View
        style={[
          styles.container,
          !transparent && styles.surface,
          styles.brandRow,
          { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
          style,
        ]}
      >
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backBtn}>
            <Ionicons name={backIcon} size={22} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.brandCenter}>
          <Text style={styles.brandTitle}>TWSILA</Text>
          {title ? (
            <Text
              style={styles.brandScreenTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={styles.subtitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.right}>{right}</View>
      </View>
    );
  }

  if (variant === 'minimal') {
    return (
      <View
        style={[
          styles.container,
          !transparent && styles.surface,
          styles.minimalRow,
          { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
          style,
        ]}
      >
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backBtnMinimal}>
            <Ionicons name={backIcon} size={20} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        <View style={styles.minimalTitleWrap}>
          {title ? (
            <Text
              style={styles.minimalTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>{right}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        !transparent && styles.surface,
        { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' },
        style,
      ]}
    >
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name={backIcon} size={22} color={Colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.center}>
        {title ? (
          <Text
            style={styles.title}
            numberOfLines={2}
            ellipsizeMode="tail"
            textAlign="center"
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            style={styles.subtitle}
            numberOfLines={2}
            ellipsizeMode="tail"
            textAlign="center"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
  },
  brandRow: {
    paddingVertical: Spacing.sm,
    alignItems: 'flex-start',
  },
  brandCenter: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xs, minWidth: 0 },
  brandTitle: {
    fontSize: 20,
    color: '#312E81',
    fontFamily: FontFamily.extraBold,
    letterSpacing: 1.2,
  },
  brandScreenTitle: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  minimalRow: {
    paddingVertical: Spacing.sm,
  },
  minimalTitleWrap: { flex: 1, minWidth: 0, paddingHorizontal: Spacing.xs },
  minimalTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  backBtnMinimal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    backgroundColor: Colors.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface1,
  },
  spacer: { width: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    minWidth: 0,
  },
  right: { minWidth: 40, alignItems: 'flex-end' },
  title: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    alignSelf: 'stretch',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});
