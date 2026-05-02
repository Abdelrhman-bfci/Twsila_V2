import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontFamily } from '@core/theme';
import { isRTL } from '@core/i18n';

export interface RouteStop {
  label: string;
  address: string;
  type: 'start' | 'middle' | 'end';
  meta?: string;
}

interface RouteTimelineProps {
  stops: RouteStop[];
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({ stops }) => {
  return (
    <View style={styles.wrapper}>
      {stops.map((stop, idx) => {
        const isLast = idx === stops.length - 1;
        const colorByType =
          stop.type === 'start'
            ? Colors.primary
            : stop.type === 'end'
            ? Colors.secondary
            : Colors.surfaceVariant;

        return (
          <View key={`${stop.label}-${idx}`} style={styles.row}>
            <View style={styles.markerCol}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: colorByType },
                  stop.type === 'middle' && styles.middleMarker,
                ]}
              >
                {stop.type === 'middle' && (
                  <Ionicons name="ellipse" size={8} color={Colors.primary} />
                )}
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>

            <View style={styles.contentCol}>
              <Text style={styles.label}>{stop.label}</Text>
              <Text style={styles.address} numberOfLines={2}>
                {stop.address}
              </Text>
              {stop.meta ? <Text style={styles.meta}>{stop.meta}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 0 },
  row: {
    flexDirection: isRTL() === I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  markerCol: { alignItems: 'center', width: 22 },
  marker: {
    width: 14,
    height: 14,
    borderRadius: BorderRadius.pill,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleMarker: {
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
    minHeight: 32,
  },
  contentCol: { flex: 1, paddingBottom: Spacing.xl },
  label: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  address: {
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});
