import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, Spacing } from '@core/theme';
import { Button } from './Button';

interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  retryLabel,
  onRetry,
  icon = 'cloud-offline-outline',
  compact = false,
}) => (
  <View style={[styles.container, compact && styles.compact]}>
    <View style={styles.iconWrap}>
      <Ionicons name={icon} size={26} color={Colors.error} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {onRetry && retryLabel ? (
      <View style={styles.action}>
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="outline"
          size="sm"
          fullWidth={false}
          leftIcon={<Ionicons name="refresh" size={16} color={Colors.primary} />}
        />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  compact: {
    paddingVertical: Spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  action: { marginTop: Spacing.md },
});
