import React, { useCallback, useMemo, useState } from 'react';
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

import {
  Badge,
  Button,
  Card,
  FilterChip,
  Header,
  Screen,
  StateView,
  type ViewStatus,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { useResponsiveLayout } from '@shared/hooks';
import { formatTime, formatCityName } from '@core/utils/format';
import { DAYS_OF_WEEK, TripStatus } from '@core/constants';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import { PassengerMyTripsStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerMyTripsStackParamList, 'MyTrips'>;

type FilterKey = 'all' | 'managing' | 'joined' | 'active' | 'completed';

export const MyTripsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<ViewStatus>('loading');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!user) {
        setStatus('empty');
        return;
      }
      if (mode === 'refresh') setRefreshing(true);
      else setStatus('loading');
      try {
        const data = await tripsRepository.listTripsForUser(user.id);
        setTrips(data);
        setStatus(data.length === 0 ? 'empty' : 'success');
        setErrorMsg(null);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : t('errors.network'));
        setStatus('error');
      } finally {
        setRefreshing(false);
      }
    },
    [user, t]
  );

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load])
  );

  const counts = useMemo(() => {
    const managing = trips.filter((t) => t.admin_id === user?.id).length;
    const joined = trips.length - managing;
    const active = trips.filter(
      (t) =>
        t.status !== TripStatus.Completed && t.status !== TripStatus.Cancelled
    ).length;
    const completed = trips.length - active;
    return { all: trips.length, managing, joined, active, completed };
  }, [trips, user?.id]);

  const filtered = useMemo(() => {
    return trips.filter((tr) => {
      if (filter === 'managing') return tr.admin_id === user?.id;
      if (filter === 'joined') return tr.admin_id !== user?.id;
      if (filter === 'active')
        return (
          tr.status !== TripStatus.Completed &&
          tr.status !== TripStatus.Cancelled
        );
      if (filter === 'completed')
        return (
          tr.status === TripStatus.Completed ||
          tr.status === TripStatus.Cancelled
        );
      return true;
    });
  }, [trips, filter, user?.id]);

  const filterStatus: ViewStatus =
    status === 'success' && filtered.length === 0 ? 'empty' : status;

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('nav.myTrips')}
        subtitle={
          status === 'success'
            ? t('attendance.summarySubtitle', {
                confirmed: counts.active,
                total: counts.all,
              })
            : undefined
        }
        transparent
        right={
          <Pressable
            hitSlop={6}
            onPress={() =>
              (nav as unknown as { navigate: (s: string) => void }).navigate(
                'TripDetails' as never
              )
            }
          />
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          layout.isWide && {
            maxWidth: layout.contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip
            label={t('trips.filters.all')}
            count={counts.all}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label={t('trips.filters.managing')}
            count={counts.managing}
            selected={filter === 'managing'}
            icon="shield-checkmark-outline"
            onPress={() => setFilter('managing')}
          />
          <FilterChip
            label={t('trips.filters.joined')}
            count={counts.joined}
            selected={filter === 'joined'}
            icon="bus-outline"
            onPress={() => setFilter('joined')}
          />
          <FilterChip
            label={t('trips.filters.active')}
            count={counts.active}
            selected={filter === 'active'}
            onPress={() => setFilter('active')}
          />
          <FilterChip
            label={t('trips.filters.completed')}
            count={counts.completed}
            selected={filter === 'completed'}
            onPress={() => setFilter('completed')}
          />
        </ScrollView>

        <StateView
          status={filterStatus}
          loading={
            <View style={{ gap: Spacing.sm }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} variant="outlined" style={styles.skelCard}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={[styles.skelLine, { width: '60%' }]} />
                    <View
                      style={[styles.skelLine, { width: '85%', height: 10 }]}
                    />
                    <View
                      style={[styles.skelLine, { width: '40%', height: 10 }]}
                    />
                  </View>
                  <View
                    style={[
                      styles.skelLine,
                      { width: 56, height: 18, borderRadius: 9 },
                    ]}
                  />
                </Card>
              ))}
            </View>
          }
          empty={{
            icon: 'bus-outline',
            title:
              filter !== 'all'
                ? t('trips.myTripsEmptyTitle')
                : t('trips.myTripsEmptyTitle'),
            subtitle: t('trips.myTripsEmptySubtitle'),
            children: (
              <View style={{ gap: Spacing.sm, alignSelf: 'stretch' }}>
                <Button
                  title={t('trips.searchTrips')}
                  variant="primary"
                  onPress={() =>
                    (nav.getParent() as unknown as {
                      navigate: (s: string) => void;
                    } | null)?.navigate('ExploreTab')
                  }
                  leftIcon={
                    <Ionicons name="search" size={18} color={Colors.onPrimary} />
                  }
                />
                <Button
                  title={t('trips.createNewTripRequest')}
                  variant="outline"
                  onPress={() =>
                    (nav.getParent() as unknown as {
                      navigate: (s: string, p?: object) => void;
                    } | null)?.navigate('ExploreTab', {
                      screen: 'CreateTrip',
                      params: {},
                    })
                  }
                />
              </View>
            ),
          }}
          error={{
            title: t('errors.loadFailed'),
            description: errorMsg ?? t('errors.loadFailedSubtitle'),
            retryLabel: t('common.retry'),
            onRetry: () => load('initial'),
          }}
        >
          <View style={[styles.list, layout.isWide && styles.listWide]}>
            {filtered.map((trip) => {
              const isAdmin = trip.admin_id === user?.id;
              const dayLabels = (trip.schedule_days ?? [])
                .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
                .filter(Boolean) as string[];
              const passengersCount = (trip.passengers ?? []).length;
              return (
                <Pressable
                  key={trip.id}
                  onPress={() => nav.navigate('TripDetails', { tripId: trip.id })}
                  style={layout.isWide ? styles.cardWideWrap : undefined}
                >
                  <Card style={styles.card} variant="outlined">
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={1}>
                          {formatCityName(trip.start_address)} →{' '}
                          {formatCityName(trip.end_address)}
                        </Text>
                        <Text style={styles.subtitle} numberOfLines={1}>
                          {formatCityName(trip.start_address)} →{' '}
                          {formatCityName(trip.end_address)}
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
                            trip.status === 'assigned'
                              ? 'success'
                              : trip.status === 'bidding'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                        />
                      )}
                    </View>

                    <View style={styles.meta}>
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
                          {passengersCount}/{trip.total_seats}
                        </Text>
                      </View>
                      {trip.distance_km ? (
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="map-outline"
                            size={14}
                            color={Colors.textLight}
                          />
                          <Text style={styles.metaText}>
                            {trip.distance_km} km
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {dayLabels.length > 0 ? (
                      <View style={styles.daysRow}>
                        {dayLabels.map((d) => (
                          <View key={d} style={styles.dayPill}>
                            <Text style={styles.dayPillText}>{t(`days.${d}`)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {isAdmin && trip.status === 'bidding' ? (
                      <View style={styles.alertChip}>
                        <Ionicons
                          name="hammer-outline"
                          size={12}
                          color={Colors.warning}
                        />
                        <Text style={styles.alertChipText}>
                          {t('offers.newOffers', {
                            count: (trip.offers ?? []).length,
                          })}
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </StateView>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  list: {},
  listWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cardWideWrap: {
    width: '49%',
  },
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
  alertChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.warningSoft,
    marginTop: 4,
  },
  alertChipText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.warning,
  },
  skelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  skelLine: {
    height: 14,
    backgroundColor: Colors.surface2,
    borderRadius: BorderRadius.sm,
  },
});
