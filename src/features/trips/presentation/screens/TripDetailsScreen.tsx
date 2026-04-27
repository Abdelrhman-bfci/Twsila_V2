import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Screen,
  Header,
  Card,
  Badge,
  Button,
  RouteTimeline,
  Avatar,
  TripRouteMapView,
} from '@shared/components';
import type { RouteMapPoint } from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import { DAYS_OF_WEEK, TripStatus } from '@core/constants';
import { formatTime, formatCurrency } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'TripDetails'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'TripDetails'>;

export const TripDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const t = await tripsRepository.getTrip(tripId);
    setTrip(t);
    setRefreshing(false);
  }, [tripId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  if (!trip) {
    return (
      <Screen>
        <Header title={t('common.loading')} onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const passengers = trip.passengers ?? [];
  const stops = trip.stops ?? [];
  const pricing = trip.pricing ?? [];

  const isAdmin = trip.admin_id === user?.id;
  const isMember = passengers.some((p) => p.user_id === user?.id);
  const seatsLeft = Math.max(0, trip.total_seats - passengers.length);

  const handleJoin = async () => {
    if (!user) return;
    try {
      await tripsRepository.joinTrip(trip.id, user.id);
      load();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : '');
    }
  };

  const handleLeave = async () => {
    if (!user || isAdmin) return;
    await tripsRepository.leaveTrip(trip.id, user.id);
    load();
  };

  const schedDays = trip.schedule_days ?? [];

  const timelineStops = [
    {
      label: t('trips.startPoint'),
      address: trip.start_address,
      type: 'start' as const,
      meta: formatTime(trip.departure_time),
    },
    ...stops.map((s) => ({
      label: t('trips.intermediateStop', { n: s.stop_order + 1 }),
      address: s.address,
      type: 'middle' as const,
      meta: s.distance_from_start_km
        ? `${s.distance_from_start_km} km`
        : undefined,
    })),
    {
      label: t('trips.endPoint'),
      address: trip.end_address,
      type: 'end' as const,
      meta: trip.distance_km ? `${trip.distance_km} km` : undefined,
    },
  ];

  const routeMapPoints: RouteMapPoint[] = [
    {
      type: 'start',
      label: shortAddress(trip.start_address),
      lat: trip.start_lat,
      lng: trip.start_lng,
    },
    ...stops.map((s) => ({
      type: 'middle' as const,
      label: shortAddress(s.address),
      lat: s.lat,
      lng: s.lng,
    })),
    {
      type: 'end',
      label: shortAddress(trip.end_address),
      lat: trip.end_lat,
      lng: trip.end_lng,
    },
  ];

  return (
    <Screen background={Colors.surface}>
      <Header
        title={trip.name || t('trips.tripDetails')}
        onBack={() => nav.goBack()}
        right={
          <Badge
            label={t(`trips.status.${trip.status}`)}
            tone={
              trip.status === TripStatus.Assigned ? 'success'
                : trip.status === TripStatus.Bidding ? 'warning'
                : 'primary'
            }
          />
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        <View style={styles.mapWrap}>
          <TripRouteMapView points={routeMapPoints} height={220} />
          <View style={styles.routeBadge}>
            <View style={styles.routeIconCol}>
              <Ionicons name="ellipse" size={10} color={Colors.primary} />
              <View style={styles.routeIconLine} />
              <Ionicons name="location" size={12} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeBadgeLabel}>
                {t('trips.routeOverview')}
              </Text>
              <Text
                style={styles.routeBadgeTitle}
                numberOfLines={1}
              >
                {shortAddress(trip.start_address)} → {shortAddress(trip.end_address)}
              </Text>
            </View>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Avatar name={trip.admin_name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroAdminLabel}>{t('trips.tripAdmin')}</Text>
              <Text style={styles.heroAdminName}>
                {trip.admin_name || '—'}
              </Text>
            </View>
            {isAdmin && (
              <Badge label={t('trips.youAreAdmin')} tone="primary" icon="shield-checkmark" />
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
                {passengers.length}/{trip.total_seats} {t('common.seats')}
              </Text>
            </View>
            {trip.distance_km ? (
              <View style={styles.metaItem}>
                <Ionicons name="map-outline" size={14} color={Colors.textLight} />
                <Text style={styles.metaText}>{trip.distance_km} km</Text>
              </View>
            ) : null}
          </View>
        </Card>

        <SectionTitle title={t('trips.tripTimeline')} />
        <Card>
          <RouteTimeline stops={timelineStops} />
        </Card>

        <SectionTitle title={t('trips.scheduleDays')} />
        <Card>
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((d) => {
              const active = schedDays.includes(d.value);
              return (
                <View
                  key={d.value}
                  style={[
                    styles.dayChip,
                    active && {
                      backgroundColor: Colors.primary,
                      borderColor: Colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      active && { color: Colors.onPrimary },
                    ]}
                  >
                    {t(`days.${d.key}`)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.dateHint}>
            {trip.active_from} → {trip.active_to || '—'}
          </Text>
        </Card>

        <SectionTitle title={t('trips.passengers')} />
        <Card>
          {passengers.length === 0 ? (
            <Text style={styles.empty}>{t('trips.noPassengers')}</Text>
          ) : (
            passengers.map((p) => {
              const price = pricing.find((x) => x.user_id === p.user_id)?.price;
              return (
                <View key={p.id} style={styles.passengerRow}>
                  <Avatar name={p.user_name} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passengerName}>{p.user_name}</Text>
                    <Text style={styles.passengerMeta}>
                      {p.pickup_address || '—'}
                      {p.distance_km ? ` · ${p.distance_km} km` : ''}
                    </Text>
                  </View>
                  {p.is_admin ? (
                    <Badge label={t('trips.tripAdmin')} tone="primary" size="sm" />
                  ) : price ? (
                    <Text style={styles.priceText}>{formatCurrency(price)}</Text>
                  ) : null}
                </View>
              );
            })
          )}
        </Card>

        {/* Admin actions */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <Button
              title={t('pricing.title')}
              variant="outline"
              onPress={() => nav.navigate('Pricing', { tripId: trip.id })}
              leftIcon={<Ionicons name="cash-outline" size={18} color={Colors.primary} />}
            />
            <View style={{ height: Spacing.sm }} />
            <Button
              title={t('offers.bidsReceived')}
              onPress={() => nav.navigate('Offers', { tripId: trip.id })}
              leftIcon={<Ionicons name="hammer-outline" size={18} color={Colors.onPrimary} />}
            />
          </View>
        )}

        {/* Member actions */}
        {!isAdmin && isMember && (
          <View style={styles.adminActions}>
            <Button
              title={t('attendance.title')}
              onPress={() => nav.navigate('Attendance', { tripId: trip.id })}
              leftIcon={
                <Ionicons name="calendar-outline" size={18} color={Colors.onPrimary} />
              }
            />
            <View style={{ height: Spacing.sm }} />
            <Button
              title={t('trips.leaveTrip')}
              variant="outline"
              onPress={handleLeave}
            />
          </View>
        )}

        {/* Non-member actions */}
        {!isMember && (
          <View style={styles.adminActions}>
            <Button
              title={seatsLeft > 0 ? t('trips.joinTrip') : t('trips.tripFull')}
              onPress={handleJoin}
              disabled={seatsLeft === 0}
              leftIcon={
                <Ionicons name="add-circle-outline" size={18} color={Colors.onPrimary} />
              }
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const shortAddress = (address?: string): string => {
  if (!address) return '—';
  const first = address.split(/[-•·,–—]/)[0]?.trim() || address;
  if (first.length <= 26) return first;
  return `${first.slice(0, 24).trim()}…`;
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  mapWrap: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'visible',
  },
  routeBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.card,
  },
  routeIconCol: { alignItems: 'center', gap: 2, paddingTop: 2 },
  routeIconLine: { width: 2, height: 12, backgroundColor: Colors.primaryFixedDim },
  routeBadgeLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  routeBadgeTitle: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  heroCard: { gap: Spacing.sm, ...Shadows.card },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroAdminLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAdminName: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.bold,
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
  sectionTitle: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLowest,
  },
  dayChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  dateHint: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.sm,
  },
  empty: {
    fontSize: 13,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    paddingVertical: Spacing.sm,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
  },
  passengerName: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  passengerMeta: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  priceText: {
    fontSize: 14,
    color: Colors.secondary,
    fontFamily: FontFamily.bold,
  },
  adminActions: { marginTop: Spacing.lg },
});
