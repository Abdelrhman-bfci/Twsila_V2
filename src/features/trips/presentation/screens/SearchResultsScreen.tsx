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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Badge,
  Banner,
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
import { DAYS_OF_WEEK } from '@core/constants';
import { formatTime, formatCityName } from '@core/utils/format';

import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'SearchResults'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'SearchResults'>;

type SortKey = 'newest' | 'departure' | 'capacity';

export const SearchResultsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const layout = useResponsiveLayout();
  const { startQuery, endQuery } = route.params || {};

  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<ViewStatus>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('newest');

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') setRefreshing(true);
      else setStatus('loading');
      try {
        const data = await tripsRepository.listTrips({ startQuery, endQuery });
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
    [startQuery, endQuery, t]
  );

  React.useEffect(() => {
    load('initial');
  }, [load]);

  const sortedTrips = useMemo(() => {
    const list = [...trips];
    if (sort === 'departure') {
      list.sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    } else if (sort === 'capacity') {
      list.sort((a, b) => {
        const aLeft = a.total_seats - (a.passengers ?? []).length;
        const bLeft = b.total_seats - (b.passengers ?? []).length;
        return bLeft - aLeft;
      });
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [trips, sort]);

  const seatsLeft = (trip: Trip) =>
    Math.max(0, trip.total_seats - (trip.passengers ?? []).length);

  const subtitle =
    startQuery || endQuery ? `${startQuery || '—'} → ${endQuery || '—'}` : undefined;

  const cardWidth = layout.isWide
    ? `${(100 - 2) / 2}%`
    : '100%';

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('trips.groups')}
        onBack={() => nav.goBack()}
        subtitle={subtitle}
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
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.resultCount}>
              {status === 'success'
                ? `${trips.length} ${t('trips.groups').toLowerCase()}`
                : status === 'loading'
                ? t('common.loading')
                : status === 'empty'
                ? t('trips.noResultsTitle')
                : t('errors.loadFailed')}
            </Text>
            <Text style={styles.toolbarHint}>
              {subtitle ?? t('trips.exploreSubtitle')}
            </Text>
          </View>
          <Pressable
            style={styles.editSearch}
            onPress={() => nav.goBack()}
            hitSlop={6}
          >
            <Ionicons name="options-outline" size={14} color={Colors.primary} />
            <Text style={styles.editSearchText}>{t('trips.updateSearch')}</Text>
          </Pressable>
        </View>

        {status === 'success' && trips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            <FilterChip
              label={t('trips.filters.all')}
              selected={sort === 'newest'}
              onPress={() => setSort('newest')}
              count={trips.length}
            />
            <FilterChip
              label={t('trips.departureTime')}
              selected={sort === 'departure'}
              icon="time-outline"
              onPress={() => setSort('departure')}
            />
            <FilterChip
              label={t('common.seats')}
              selected={sort === 'capacity'}
              icon="people-outline"
              onPress={() => setSort('capacity')}
            />
          </ScrollView>
        ) : null}

        <StateView
          status={status}
          loading={
            <View style={{ gap: Spacing.sm }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} style={{ gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <View style={styles.skelTopRow}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={[styles.skelLine, { width: '70%' }]} />
                      <View style={[styles.skelLine, { width: '50%', height: 10 }]} />
                    </View>
                    <View
                      style={[
                        styles.skelLine,
                        { width: 60, height: 18, borderRadius: 9 },
                      ]}
                    />
                  </View>
                  <View style={[styles.skelLine, { width: '40%', height: 10 }]} />
                  <View style={[styles.skelLine, { width: '60%', height: 10 }]} />
                </Card>
              ))}
            </View>
          }
          empty={{
            icon: 'search-outline',
            title: t('trips.noResultsTitle'),
            subtitle: t('trips.noResultsSubtitle'),
            children: (
              <Button
                title={t('trips.createNewTripRequest')}
                onPress={() =>
                  nav.navigate('CreateTrip', { startQuery, endQuery })
                }
                leftIcon={
                  <Ionicons name="add" size={18} color={Colors.onPrimary} />
                }
              />
            ),
          }}
          error={{
            title: t('errors.loadFailed'),
            description: errorMsg ?? t('errors.loadFailedSubtitle'),
            retryLabel: t('common.retry'),
            onRetry: () => load('initial'),
          }}
        >
          <View style={[styles.grid, layout.isWide && styles.gridWide]}>
            {sortedTrips.map((trip) => {
              const remaining = seatsLeft(trip);
              const dayLabels = (trip.schedule_days ?? [])
                .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
                .filter(Boolean) as string[];
              const isAlmostFull = remaining > 0 && remaining <= 2;
              return (
                <Pressable
                  key={trip.id}
                  onPress={() => nav.navigate('TripDetails', { tripId: trip.id })}
                  style={layout.isWide ? { width: cardWidth } : undefined}
                >
                  <Card style={styles.tripCard} variant="outlined">
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tripTitle} numberOfLines={1}>
                          {formatCityName(trip.start_address)} →{' '}
                          {formatCityName(trip.end_address)}
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
                        size="sm"
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
                        <Text
                          style={[
                            styles.metaText,
                            isAlmostFull && { color: Colors.warning },
                            remaining === 0 && { color: Colors.error },
                          ]}
                        >
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
                  </Card>
                </Pressable>
              );
            })}
          </View>

          <Card style={styles.createCard} variant="tinted">
            <View style={styles.createIcon}>
              <Ionicons
                name="add-circle-outline"
                size={26}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.createTitle}>{t('trips.noResults')}</Text>
            <Text style={styles.createSubtitle}>
              {t('trips.noResultsSubtitle')}
            </Text>
            <Button
              title={t('trips.createNewTripRequest')}
              onPress={() => nav.navigate('CreateTrip', { startQuery, endQuery })}
              style={{ marginTop: Spacing.md, alignSelf: 'stretch' }}
              leftIcon={<Ionicons name="add" size={18} color={Colors.onPrimary} />}
            />
          </Card>
        </StateView>

        {errorMsg && status !== 'error' ? (
          <Banner
            tone="warning"
            title={t('errors.loadFailed')}
            description={errorMsg}
            actionLabel={t('common.retry')}
            onActionPress={() => load('initial')}
            style={{ marginTop: Spacing.sm }}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  toolbarLeft: { flex: 1, gap: 2 },
  resultCount: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  toolbarHint: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
  },
  editSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primarySoft,
  },
  editSearchText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  grid: {},
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
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
    maxWidth: 360,
    lineHeight: 18,
  },
  skelTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  skelLine: {
    height: 14,
    backgroundColor: Colors.surface2,
    borderRadius: BorderRadius.sm,
  },
});
