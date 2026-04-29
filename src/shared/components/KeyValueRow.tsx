import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, FontFamily, Spacing } from '@core/theme';

interface KeyValueRowProps {
  label: string;
  value?: string | React.ReactNode;
  emphasis?: 'normal' | 'strong' | 'positive' | 'negative';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export const KeyValueRow: React.FC<KeyValueRowProps> = ({
  label,
  value,
  emphasis = 'normal',
  style,
  labelStyle,
  valueStyle,
}) => {
  const valueColor =
    emphasis === 'positive'
      ? Colors.secondary
      : emphasis === 'negative'
      ? Colors.error
      : emphasis === 'strong'
      ? Colors.text
      : Colors.text;

  const valueWeight =
    emphasis === 'strong' || emphasis === 'positive' || emphasis === 'negative'
      ? FontFamily.bold
      : FontFamily.semiBold;

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          style={[
            styles.value,
            { color: valueColor, fontFamily: valueWeight },
            emphasis === 'strong' && { fontSize: 16 },
            valueStyle,
          ]}
        >
          {value}
        </Text>
      ) : (
        <View>{value}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    flexShrink: 1,
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    textAlign: 'right',
  },
});
