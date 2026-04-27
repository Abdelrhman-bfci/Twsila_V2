import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Badge, Card, EmptyState, Header, Screen } from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { formatTime } from '@core/utils/format';
import { DAYS_OF_WEEK } from '@core/constants';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import { PassengerMyTripsStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerMyTripsStackParamList, 'MyTrips'>;

export const MyTripsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const data = await tripsRepository.listTripsForUser(user.id);
    setTrips(data);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen background={Colors.surface}>
      <Header title={t('nav.myTrips')} transparent />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        {trips.length === 0 ? (
          <EmptyState
            icon="bus-outline"
            title={t('nav.myTrips')}
            subtitle={t('trips.noResultsSubtitle')}
          />
        ) : null}

        {trips.map((trip) => {
          const isAdmin = trip.admin_id === user?.id;
          const dayLabels = (trip.schedule_days ?? [])
            .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
            .filter(Boolean) as string[];
          return (
            <Pressable
              key={trip.id}
              onPress={() => nav.navigate('TripDetails', { tripId: trip.id })}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {trip.name || `${trip.start_address} → ${trip.end_address}`}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {trip.start_address} → {trip.end_address}
                    </Text>
                  </View>
                  {isAdmin ? (
                    <Badge
                      label={t('trips.tripAdmin')}
                      tone="primary"
                      icon="shield-checkmark"
                      size="sm"
                    />
                  ) : (
                    <Badge
                      label={t(`trips.status.${trip.status}`)}
                      tone={
                        trip.status === 'assigned' ? 'success'
                          : trip.status === 'bidding' ? 'warning'
                          : 'primary'
                      }
                      size="sm"
                    />
                  )}
                </View>

                <View style={styles.meta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                    <Text style={styles.metaText}>{formatTime(trip.departure_time)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color={Colors.textLight} />
                    <Text style={styles.metaText}>
                      {(trip.passengers ?? []).length}/{trip.total_seats}
                    </Text>
                  </View>
                </View>

                <View style={styles.daysRow}>
                  {dayLabels.map((d) => (
                    <View key={d} style={styles.dayPill}>
                      <Text style={styles.dayPillText}>{t(`days.${d}`)}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { marginBottom: Spacing.sm, gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  title: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
  meta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  dayPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface2,
  },
  dayPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
});
