import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Spacing } from '@core/theme';

type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

interface BannerProps {
  tone?: Tone;
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onActionPress?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const toneMap: Record<
  Tone,
  { bg: string; fg: string; border: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  info: {
    bg: Colors.infoSoft,
    fg: Colors.info,
    border: '#BFDBFE',
    icon: 'information-circle',
  },
  success: {
    bg: Colors.secondarySoft,
    fg: Colors.secondary,
    border: '#A7F3D0',
    icon: 'checkmark-circle',
  },
  warning: {
    bg: Colors.warningSoft,
    fg: Colors.warning,
    border: '#FCD34D',
    icon: 'alert-circle',
  },
  error: {
    bg: Colors.errorSoft,
    fg: Colors.error,
    border: '#FECACA',
    icon: 'close-circle',
  },
  neutral: {
    bg: Colors.surface1,
    fg: Colors.textSecondary,
    border: Colors.borderLight,
    icon: 'megaphone-outline',
  },
};

export const Banner: React.FC<BannerProps> = ({
  tone = 'info',
  title,
  description,
  icon,
  actionLabel,
  onActionPress,
  onDismiss,
  compact = false,
  style,
}) => {
  const tones = toneMap[tone];
  const iconName = icon || tones.icon;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tones.bg,
          borderColor: tones.border,
        },
        compact && styles.compact,
        style,
      ]}
    >
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        <Ionicons name={iconName} size={compact ? 16 : 18} color={tones.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: tones.fg }]}>{title}</Text>
        {description ? (
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        ) : null}
        {actionLabel && onActionPress ? (
          <Pressable onPress={onActionPress} hitSlop={6} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: tones.fg }]}>
              {actionLabel}
            </Text>
            <Ionicons name="arrow-forward" size={13} color={tones.fg} />
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={6} style={styles.dismiss}>
          <Ionicons name="close" size={16} color={tones.fg} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  compact: { padding: Spacing.sm, borderRadius: BorderRadius.sm },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconWrapCompact: { width: 20, height: 20 },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  actionText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
  dismiss: {
    padding: 2,
  },
});
