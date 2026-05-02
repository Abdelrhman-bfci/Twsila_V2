import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Spacing } from '@core/theme';
import { isRTL } from '@core/i18n';

type Tone = 'primary' | 'secondary' | 'warning' | 'neutral' | 'success';

interface StatTileProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

const toneMap: Record<Tone, { bg: string; fg: string; iconBg: string }> = {
  primary: {
    bg: Colors.surfaceLowest,
    fg: Colors.primary,
    iconBg: Colors.primarySoft,
  },
  secondary: {
    bg: Colors.surfaceLowest,
    fg: Colors.secondary,
    iconBg: Colors.secondarySoft,
  },
  warning: {
    bg: Colors.surfaceLowest,
    fg: Colors.warning,
    iconBg: Colors.warningSoft,
  },
  success: {
    bg: Colors.surfaceLowest,
    fg: Colors.success,
    iconBg: Colors.successSoft,
  },
  neutral: {
    bg: Colors.surfaceLowest,
    fg: Colors.text,
    iconBg: Colors.surface1,
  },
};

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  caption,
  icon,
  tone = 'primary',
  style,
}) => {
  const t = toneMap[tone];
  return (
    <View style={[styles.tile, { backgroundColor: t.bg }, style]}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: t.iconBg }]}>
            <Ionicons name={icon} size={14} color={t.fg} />
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: t.fg }]}>{value}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 130,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  row: {
    flexDirection: isRTL() === I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginTop: Spacing.xs,
    letterSpacing: -0.3,
  },
  caption: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});
