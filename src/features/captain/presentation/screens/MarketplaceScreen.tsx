import React, { useCallback, useMemo, useState } from 'react';
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
  Banner,
  Button,
  Card,
  FilterChip,
  Header,
  Input,
  Screen,
  StateView,
  StatTile,
  type ViewStatus,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { useResponsiveLayout } from '@shared/hooks';
import {
  AttendanceStatus,
  DAYS_OF_WEEK,
  OfferStatus,
  TripStatus,
} from '@core/constants';
import { formatTime, formatCurrency, formatCityName } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '@features/trips/data/tripsRepository';
import { Trip } from '@features/trips/domain/models/Trip';
import { CaptainMarketplaceStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<CaptainMarketplaceStackParamList, 'Marketplace'>;

type SortKey = 'newest' | 'distance' | 'rate';

export const MarketplaceScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<ViewStatus>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') setRefreshing(true);
      else setStatus('loading');
      try {
        const data = await tripsRepository.listTripsForCaptain({
          startQuery: start || undefined,
          endQuery: end || undefined,
        });
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
    [start, end, t]
  );

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load])
  );

  const myActive = useMemo(
    () =>
      user
        ? trips.flatMap((t) =>
            (t.offers ?? []).filter(
              (o) =>
                o.captain_id === user.id && o.status === OfferStatus.Pending
            )
          ).length
        : 0,
    [trips, user]
  );

  const avgRate = useMemo(() => {
    const rates = trips
      .flatMap((tr) =>
        (tr.offers ?? []).filter((o) => o.status === OfferStatus.Accepted)
      )
      .map((o) => o.offer_price);
    if (!rates.length) return null;
    return Math.round(rates.reduce((s, x) => s + x, 0) / rates.length);
  }, [trips]);

  const sortedTrips = useMemo(() => {
    const list = [...trips];
    if (sort === 'distance') {
      list.sort((a, b) => (b.distance_km || 0) - (a.distance_km || 0));
    } else if (sort === 'rate') {
      list.sort(
        (a, b) =>
          (b.distance_km || 0) * (b.base_price_per_km || 0) -
          (a.distance_km || 0) * (a.base_price_per_km || 0)
      );
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [trips, sort]);

  const filtersActive = !!(start || end);

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('captain.marketplace')}
        subtitle={t('captain.marketplaceSubtitle')}
        transparent
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
        <View style={styles.statsRow}>
          <StatTile
            label={t('captain.activeBids')}
            value={myActive}
            icon="hammer-outline"
            tone="primary"
          />
          <StatTile
            label={t('captain.dailySummary')}
            value={trips.length}
            icon="storefront-outline"
            tone="secondary"
          />
          {avgRate != null ? (
            <StatTile
              label={t('captain.averageRate')}
              value={formatCurrency(avgRate)}
              icon="trending-up-outline"
              tone="warning"
            />
          ) : null}
        </View>

        <Card style={styles.filterCard} variant="outlined">
          <View style={styles.filterRow}>
            <Ionicons name="filter-outline" size={16} color={Colors.primary} />
            <Text style={styles.filterTitle}>{t('captain.filters')}</Text>
            {filtersActive ? (
              <Pressable
                style={styles.clearBtn}
                onPress={() => {
                  setStart('');
                  setEnd('');
                  setTimeout(() => load('initial'), 0);
                }}
                hitSlop={6}
              >
                <Text style={styles.clearBtnText}>
                  {t('captain.filterClearAll')}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <View style={layout.isWide ? styles.filterRowWide : undefined}>
            <View style={layout.isWide ? { flex: 1 } : undefined}>
              <Input
                placeholder={t('trips.pickupPlaceholder')}
                leftIcon="location-outline"
                value={start}
                onChangeText={setStart}
                onSubmitEditing={() => load('initial')}
              />
            </View>
            <View style={layout.isWide ? { flex: 1 } : undefined}>
              <Input
                placeholder={t('trips.dropoffPlaceholder')}
                leftIcon="flag-outline"
                value={end}
                onChangeText={setEnd}
                onSubmitEditing={() => load('initial')}
              />
            </View>
          </View>
        </Card>

        {status === 'success' ? (
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
              label={t('captain.totalDistance')}
              selected={sort === 'distance'}
              icon="map-outline"
              onPress={() => setSort('distance')}
            />
            <FilterChip
              label={t('captain.estValue')}
              selected={sort === 'rate'}
              icon="cash-outline"
              onPress={() => setSort('rate')}
            />
          </ScrollView>
        ) : null}

        <StateView
          status={status}
          loading={
            <View style={{ gap: Spacing.sm }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={i}
                  variant="outlined"
                  style={{ marginBottom: Spacing.sm, gap: Spacing.sm }}
                >
                  <View style={styles.skelRow}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={[styles.skelLine, { width: '70%' }]} />
                      <View
                        style={[styles.skelLine, { width: '50%', height: 10 }]}
                      />
                    </View>
                    <View
                      style={[
                        styles.skelLine,
                        { width: 60, height: 18, borderRadius: 9 },
                      ]}
                    />
                  </View>
                  <View style={[styles.skelLine, { width: '50%', height: 10 }]} />
                  <View style={[styles.skelLine, { width: '60%', height: 12 }]} />
                </Card>
              ))}
            </View>
          }
          empty={{
            icon: 'storefront-outline',
            title: t('captain.marketplaceEmpty'),
            subtitle: t('captain.marketplaceEmptySubtitle'),
            children: filtersActive ? (
              <Button
                title={t('captain.filterClearAll')}
                variant="outline"
                onPress={() => {
                  setStart('');
                  setEnd('');
                  setTimeout(() => load('initial'), 0);
                }}
              />
            ) : undefined,
          }}
          error={{
            title: t('errors.loadFailed'),
            description: errorMsg ?? t('errors.loadFailedSubtitle'),
            retryLabel: t('common.retry'),
            onRetry: () => load('initial'),
          }}
        >
          <View style={[styles.list, layout.isWide && styles.listWide]}>
            {sortedTrips.map((trip) => {
              const myOffer = (trip.offers ?? []).find(
                (o) =>
                  o.captain_id === user?.id &&
                  o.status === OfferStatus.Pending
              );
              const dayLabels = (trip.schedule_days ?? [])
                .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
                .filter(Boolean) as string[];
              const passengersReady = (trip.attendance ?? []).filter(
                (a) => a.status === AttendanceStatus.Confirmed
              ).length;
              const estRevenue =
                (trip.distance_km || 0) * (trip.base_price_per_km || 0);
              const isAssigned = trip.status === TripStatus.Assigned;

              return (
                <Pressable
                  key={trip.id}
                  onPress={() =>
                    nav.navigate('TripDetails', { tripId: trip.id })
                  }
                  style={layout.isWide ? styles.cardWideWrap : undefined}
                >
                  <Card style={styles.tripCard} variant="outlined">
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tripTitle} numberOfLines={1}>
                          {formatCityName(trip.start_address)} →{' '}
                          {formatCityName(trip.end_address)}
                        </Text>
                        <Text style={styles.tripRoute} numberOfLines={1}>
                          <Ionicons name="navigate-outline" size={11} />{' '}
                          {trip.start_address} → {trip.end_address}
                        </Text>
                      </View>
                      {isAssigned ? (
                        <Badge
                          label={t('captain.tripFinalized')}
                          tone="neutral"
                          size="sm"
                        />
                      ) : myOffer ? (
                        <Badge
                          label={t('captain.bidPending')}
                          tone="warning"
                          size="sm"
                          icon="hourglass-outline"
                        />
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
                          {t('captain.studentsReady', {
                            ready: passengersReady,
                            total: (trip.passengers ?? []).length,
                          })}
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

                    <View style={styles.bottomRow}>
                      {estRevenue ? (
                        <View>
                          <Text style={styles.bottomLabel}>
                            {t('captain.estValue')}
                          </Text>
                          <Text style={styles.bottomValue}>
                            {formatCurrency(estRevenue)}
                          </Text>
                        </View>
                      ) : (
                        <View />
                      )}
                      {myOffer ? (
                        <View style={styles.myOfferPill}>
                          <Text style={styles.myOfferLabel}>
                            {t('captain.yourBidPrice')}
                          </Text>
                          <Text style={styles.myOfferPrice}>
                            {formatCurrency(myOffer.offer_price)}
                          </Text>
                        </View>
                      ) : (
                        <Pressable
                          style={[
                            styles.bidBtn,
                            isAssigned && styles.bidBtnDisabled,
                          ]}
                          disabled={isAssigned}
                          onPress={() =>
                            nav.navigate('SubmitBid', { tripId: trip.id })
                          }
                        >
                          <Ionicons
                            name="hammer"
                            size={14}
                            color={Colors.onPrimary}
                          />
                          <Text style={styles.bidBtnText}>
                            {t('captain.submitBid')}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </StateView>

        {errorMsg && status === 'success' ? (
          <Banner
            tone="warning"
            title={t('errors.loadFailed')}
            description={errorMsg}
            actionLabel={t('common.retry')}
            onActionPress={() => load('initial')}
            style={{ marginTop: Spacing.md }}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  filterCard: { marginBottom: Spacing.md, gap: 0 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  filterRowWide: { flexDirection: 'row', gap: Spacing.sm },
  filterTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  clearBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  clearBtnText: {
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
  list: {},
  listWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cardWideWrap: { width: '49%' },
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
  },
  bottomLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bottomValue: {
    fontSize: 16,
    color: Colors.secondary,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  myOfferPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warningSoft,
  },
  myOfferLabel: {
    fontSize: 11,
    color: Colors.warning,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  myOfferPrice: {
    fontSize: 14,
    color: Colors.warning,
    fontFamily: FontFamily.bold,
  },
  bidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  bidBtnDisabled: { backgroundColor: Colors.surface2 },
  bidBtnText: {
    color: Colors.onPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  skelLine: {
    height: 14,
    backgroundColor: Colors.surface2,
    borderRadius: BorderRadius.sm,
  },
});
