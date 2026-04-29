import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '@core/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 14,
  radius = BorderRadius.sm,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
};

interface SkeletonGroupProps {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  children,
  gap = Spacing.xs,
  style,
}) => <View style={[{ gap }, style]}>{children}</View>;

interface SkeletonCardProps {
  rows?: number;
  showAvatar?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  rows = 3,
  showAvatar = false,
  style,
}) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      {showAvatar ? (
        <Skeleton width={40} height={40} radius={BorderRadius.pill} />
      ) : null}
      <View style={{ flex: 1, gap: Spacing.xs }}>
        <Skeleton width="65%" height={14} />
        <Skeleton width="40%" height={10} />
      </View>
      <Skeleton width={64} height={20} radius={BorderRadius.pill} />
    </View>
    <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === rows - 1 ? '70%' : '100%'}
          height={10}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface2,
  },
  card: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
