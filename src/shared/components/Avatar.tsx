import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontFamily } from '@core/theme';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  background?: string;
  color?: string;
}

const initialsOf = (name?: string): string => {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  uri,
  size = 40,
  background = Colors.primarySoft,
  color = Colors.primary,
}) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: BorderRadius.pill }}
      />
    );
  }
  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: BorderRadius.pill,
          backgroundColor: background,
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: size * 0.4 }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FontFamily.bold },
});
