import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Badge,
  Card,
  EmptyState,
  Header,
  Input,
  Screen,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { DAYS_OF_WEEK, OfferStatus } from '@core/constants';
import { formatTime, formatCurrency } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '@features/trips/data/tripsRepository';
import { Trip } from '@features/trips/domain/models/Trip';
import { CaptainMarketplaceStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<CaptainMarketplaceStackParamList, 'Marketplace'>;

export const MarketplaceScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    const data = await tripsRepository.listTripsForCaptain({
      startQuery: start || undefined,
      endQuery: end || undefined,
    });
    setTrips(data);
    setRefreshing(false);
  }, [start, end]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const myActive = user
    ? trips.flatMap((t) =>
        t.offers.filter(
          (o) => o.captain_id === user.id && o.status === OfferStatus.Pending
        )
      ).length
    : 0;

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('captain.marketplace')}
        subtitle={t('captain.marketplaceSubtitle')}
        transparent
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: Colors.primarySoft }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {myActive}
            </Text>
            <Text style={styles.statLabel}>{t('captain.activeBids')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.secondarySoft }]}>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>
              {trips.length}
            </Text>
            <Text style={styles.statLabel}>{t('captain.dailySummary')}</Text>
          </View>
        </View>

        <Card style={styles.filterCard} variant="outlined">
          <View style={styles.filterRow}>
            <Ionicons name="filter-outline" size={16} color={Colors.primary} />
            <Text style={styles.filterTitle}>{t('captain.filters')}</Text>
          </View>
          <Input
            placeholder={t('trips.pickupPlaceholder')}
            leftIcon="location-outline"
            value={start}
            onChangeText={setStart}
            onSubmitEditing={load}
          />
          <Input
            placeholder={t('trips.dropoffPlaceholder')}
            leftIcon="flag-outline"
            value={end}
            onChangeText={setEnd}
            onSubmitEditing={load}
          />
        </Card>

        {trips.length === 0 && !refreshing ? (
          <EmptyState
            icon="search-outline"
            title={t('captain.marketplace')}
            subtitle={t('captain.marketplaceSubtitle')}
          />
        ) : null}

        {trips.map((trip) => {
          const myOffer = trip.offers.find(
            (o) => o.captain_id === user?.id && o.status === OfferStatus.Pending
          );
          const dayLabels = trip.schedule_days
            .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
            .filter(Boolean) as string[];
          const passengersReady = trip.attendance.filter(
            (a) => a.status === 'confirmed'
          ).length;

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
                      <Ionicons name="navigate-outline" size={12} />{' '}
                      {trip.start_address} → {trip.end_address}
                    </Text>
                  </View>
                  {myOffer ? (
                    <Badge label={t('captain.bidPending')} tone="warning" size="sm" />
                  ) : (
                    <Badge
                      label={t(`trips.status.${trip.status}`)}
                      tone="primary"
                      size="sm"
                    />
                  )}
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                    <Text style={styles.metaText}>
                      {formatTime(trip.departure_time)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color={Colors.textLight} />
                    <Text style={styles.metaText}>
                      {t('captain.studentsReady', {
                        ready: passengersReady,
                        total: trip.passengers.length,
                      })}
                    </Text>
                  </View>
                  {trip.distance_km ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="map-outline" size={14} color={Colors.textLight} />
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

                {myOffer ? (
                  <View style={styles.myOfferRow}>
                    <Text style={styles.myOfferLabel}>{t('captain.myBids')}</Text>
                    <Text style={styles.myOfferPrice}>
                      {formatCurrency(myOffer.offer_price)}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.bidBtn}
                    onPress={() =>
                      nav.navigate('SubmitBid', { tripId: trip.id })
                    }
                  >
                    <Ionicons name="hammer-outline" size={16} color={Colors.onPrimary} />
                    <Text style={styles.bidBtnText}>{t('captain.submitBid')}</Text>
                  </Pressable>
                )}
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
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontFamily: FontFamily.bold },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterCard: { marginBottom: Spacing.md, gap: 0 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  filterTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  tripCard: { marginBottom: Spacing.sm, gap: Spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tripTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text },
  tripRoute: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
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
  myOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  myOfferLabel: {
    fontSize: 12,
    color: Colors.tertiary,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  myOfferPrice: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.tertiary,
  },
  bidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  bidBtnText: {
    color: Colors.onPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
});
