import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Spacing } from '@core/theme';

interface SectionHeaderProps {
  title: string;
  caption?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  caption,
  actionLabel,
  actionIcon,
  onActionPress,
  leadingIcon,
  style,
}) => (
  <View style={[styles.container, style]}>
    {leadingIcon ? (
      <View style={styles.leadingIcon}>
        <Ionicons name={leadingIcon} size={18} color={Colors.primary} />
      </View>
    ) : null}
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
    {actionLabel ? (
      <Pressable onPress={onActionPress} style={styles.actionBtn} hitSlop={6}>
        {actionIcon ? (
          <Ionicons name={actionIcon} size={14} color={Colors.primary} />
        ) : null}
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  leadingIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  caption: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});
