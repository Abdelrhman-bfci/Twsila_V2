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
import { Colors, Spacing, FontFamily } from '@core/theme';

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

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  right,
  transparent = false,
  variant = 'default',
  style,
}) => {
  if (variant === 'branded') {
    return (
      <View
        style={[
          styles.container,
          !transparent && styles.surface,
          styles.brandRow,
          style,
        ]}
      >
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backBtn}>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={Colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.brandCenter}>
          <Text style={styles.brandTitle}>TWSILA</Text>
          {title ? <Text style={styles.brandScreenTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
          style,
        ]}
      >
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backBtnMinimal}>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        <View style={styles.minimalTitleWrap}>
          {title ? <Text style={styles.minimalTitle}>{title}</Text> : null}
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
        style,
      ]}
    >
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
            size={22}
            color={Colors.text}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.center}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  brandRow: {
    paddingVertical: Spacing.sm,
    alignItems: 'flex-start',
  },
  brandCenter: { flex: 1, alignItems: 'center' },
  brandTitle: {
    fontSize: 22,
    color: '#312E81',
    fontFamily: FontFamily.extraBold,
    letterSpacing: 1.2,
  },
  brandScreenTitle: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  minimalRow: {
    paddingVertical: Spacing.sm,
  },
  minimalTitleWrap: { flex: 1 },
  minimalTitle: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  backBtnMinimal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    backgroundColor: Colors.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface1,
  },
  spacer: { width: 40 },
  center: { flex: 1, alignItems: 'center' },
  right: { minWidth: 40, alignItems: 'flex-end' },
  title: {
    fontSize: 17,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});
