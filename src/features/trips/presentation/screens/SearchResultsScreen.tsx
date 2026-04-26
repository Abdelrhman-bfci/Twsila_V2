import React, { useEffect, useState, useCallback } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Screen,
  Header,
  Card,
  Badge,
  Button,
  EmptyState,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import { DAYS_OF_WEEK } from '@core/constants';
import { formatTime } from '@core/utils/format';

import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'SearchResults'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'SearchResults'>;

export const SearchResultsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { startQuery, endQuery } = route.params || {};

  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await tripsRepository.listTrips({ startQuery, endQuery });
      setTrips(data);
    } finally {
      setRefreshing(false);
    }
  }, [startQuery, endQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const seatsLeft = (trip: Trip) =>
    Math.max(0, trip.total_seats - trip.passengers.length);

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('trips.groups')}
        onBack={() => nav.goBack()}
        subtitle={
          startQuery || endQuery
            ? `${startQuery || '—'} → ${endQuery || '—'}`
            : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        {trips.map((trip) => {
          const remaining = seatsLeft(trip);
          const dayLabels = trip.schedule_days
            .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
            .filter(Boolean) as string[];

          return (
            <Pressable
              key={trip.id}
              onPress={() => nav.navigate('TripDetails', { tripId: trip.id })}
            >
              <Card style={styles.tripCard}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripTitle} numberOfLines={1}>
                      {trip.name || `${trip.start_address} → ${trip.end_address}`}
                    </Text>
                    <Text style={styles.tripRoute} numberOfLines={1}>
                      {trip.start_address} → {trip.end_address}
                    </Text>
                  </View>
                  <Badge
                    label={t(`trips.status.${trip.status}`)}
                    tone={
                      trip.status === 'assigned'
                        ? 'success'
                        : trip.status === 'bidding'
                        ? 'warning'
                        : 'primary'
                    }
                  />
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={Colors.textLight}
                    />
                    <Text style={styles.metaText}>
                      {formatTime(trip.departure_time)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={Colors.textLight}
                    />
                    <Text style={styles.metaText}>
                      {remaining > 0
                        ? remaining === 1
                          ? t('trips.seatLeft')
                          : t('trips.seatsLeft', { count: remaining })
                        : t('trips.tripFull')}
                    </Text>
                  </View>
                  {trip.distance_km ? (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="map-outline"
                        size={14}
                        color={Colors.textLight}
                      />
                      <Text style={styles.metaText}>{trip.distance_km} km</Text>
                    </View>
                  ) : null}
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

        <Card style={styles.createCard} variant="tinted">
          <View style={styles.createIcon}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.createTitle}>{t('trips.noResults')}</Text>
          <Text style={styles.createSubtitle}>{t('trips.noResultsSubtitle')}</Text>
          <Button
            title={t('trips.createNewTripRequest')}
            onPress={() => nav.navigate('CreateTrip', { startQuery, endQuery })}
            style={{ marginTop: Spacing.md }}
            leftIcon={
              <Ionicons name="add" size={18} color={Colors.onPrimary} />
            }
          />
        </Card>

        {!trips.length && !refreshing ? (
          <EmptyState
            icon="search-outline"
            title={t('trips.noResults')}
            subtitle={t('trips.noResultsSubtitle')}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  tripCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tripTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  tripRoute: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
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
  createCard: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  createIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  createTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  createSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
});
