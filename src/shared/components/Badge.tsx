import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontFamily } from '@core/theme';

type Tone = 'primary' | 'secondary' | 'warning' | 'success' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: Colors.primarySoft, fg: Colors.primary },
  secondary: { bg: Colors.secondarySoft, fg: Colors.secondary },
  warning: { bg: Colors.warningSoft, fg: Colors.warning },
  success: { bg: Colors.successSoft, fg: Colors.success },
  error: { bg: Colors.errorSoft, fg: Colors.error },
  info: { bg: Colors.infoSoft, fg: Colors.info },
  neutral: { bg: Colors.surface2, fg: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = 'primary',
  icon,
  style,
  size = 'md',
}) => {
  const { bg, fg } = toneMap[tone];
  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        { backgroundColor: bg },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          { color: fg },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  badgeSm: { paddingHorizontal: Spacing.xs, paddingVertical: 3 },
  text: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.2,
  },
  textSm: { fontSize: 11 },
});
