import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Spacing } from '@core/theme';
import { SkeletonCard } from './Skeleton';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { Ionicons } from '@expo/vector-icons';

export type ViewStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';

interface StateViewProps {
  status: ViewStatus;
  loading?: React.ReactNode;
  empty?: {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
  };
  error?: {
    title: string;
    description?: string;
    retryLabel?: string;
    onRetry?: () => void;
  };
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Number of skeleton cards to render in default loading state. */
  skeletonCount?: number;
}

export const StateView: React.FC<StateViewProps> = ({
  status,
  loading,
  empty,
  error,
  children,
  style,
  skeletonCount = 3,
}) => {
  if (status === 'loading') {
    if (loading) return <View style={style}>{loading}</View>;
    return (
      <View style={[styles.skeletonStack, style]}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (status === 'error' && error) {
    return (
      <View style={style}>
        <ErrorState
          title={error.title}
          description={error.description}
          retryLabel={error.retryLabel}
          onRetry={error.onRetry}
        />
      </View>
    );
  }

  if (status === 'empty' && empty) {
    return (
      <View style={style}>
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          subtitle={empty.subtitle}
        >
          {empty.children}
        </EmptyState>
      </View>
    );
  }

  return <View style={[{ flex: 1 }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  skeletonStack: {
    gap: Spacing.sm,
  },
});
