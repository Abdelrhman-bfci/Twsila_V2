import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Colors, BorderRadius, FontFamily, Spacing } from '@core/theme';

interface DayChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  small?: boolean;
}

export const DayChip: React.FC<DayChipProps> = ({
  label,
  selected = false,
  onPress,
  disabled = false,
  small = false,
}) => {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.chip,
        small && styles.chipSm,
        selected && styles.chipActive,
        disabled && styles.disabled,
      ]}
    >
      <View>
        <Text
          style={[
            styles.text,
            small && styles.textSm,
            selected && styles.textActive,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    minWidth: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSm: { paddingVertical: 8, paddingHorizontal: Spacing.sm, minWidth: 44 },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  disabled: { opacity: 0.45 },
  text: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  textSm: { fontSize: 12 },
  textActive: { color: Colors.onPrimary },
});
