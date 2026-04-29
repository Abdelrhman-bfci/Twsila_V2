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

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  count,
  icon,
  disabled = false,
  style,
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    style={[
      styles.chip,
      selected && styles.chipActive,
      disabled && { opacity: 0.5 },
      style,
    ]}
  >
    {icon ? (
      <Ionicons
        name={icon}
        size={14}
        color={selected ? Colors.onPrimary : Colors.textSecondary}
      />
    ) : null}
    <Text style={[styles.text, selected && styles.textActive]}>{label}</Text>
    {typeof count === 'number' ? (
      <View style={[styles.countWrap, selected && styles.countWrapActive]}>
        <Text style={[styles.countText, selected && styles.countTextActive]}>
          {count}
        </Text>
      </View>
    ) : null}
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLowest,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.1,
  },
  textActive: { color: Colors.onPrimary },
  countWrap: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface2,
    minWidth: 20,
    alignItems: 'center',
  },
  countWrapActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },
  countTextActive: { color: Colors.onPrimary },
});
