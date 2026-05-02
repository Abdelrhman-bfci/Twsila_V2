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
import { OfferStatus, DAYS_OF_WEEK } from '@core/constants';
import {
  formatCityName,
  formatCurrency,
  formatTime,
  formatLongDate,
} from '@core/utils/format';
import { useResponsiveLayout } from '@shared/hooks';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '@features/trips/data/tripsRepository';
import {
  CaptainOffer,
  Trip,
} from '@features/trips/domain/models/Trip';
import { CaptainBidsStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<CaptainBidsStackParamList, 'MyBids'>;

interface BidWithTrip {
  offer: CaptainOffer;
  trip: Trip;
}

type FilterKey = 'all' | OfferStatus.Pending | OfferStatus.Accepted | OfferStatus.Rejected;

export const MyBidsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();

  const [bids, setBids] = useState<BidWithTrip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<ViewStatus>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!user) return;
      if (mode === 'refresh') setRefreshing(true);
      else setStatus('loading');
      try {
        const all = await tripsRepository.listTrips({});
        const mine: BidWithTrip[] = [];
        for (const trip of all) {
          const offer = (trip.offers ?? []).find(
            (o) => o.captain_id === user.id
          );
          if (offer) mine.push({ offer, trip });
        }
        mine.sort(
          (a, b) =>
            new Date(b.offer.created_at).getTime() -
            new Date(a.offer.created_at).getTime()
        );
        setBids(mine);
        setStatus(mine.length === 0 ? 'empty' : 'success');
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
    const pending = bids.filter(
      (b) => b.offer.status === OfferStatus.Pending
    ).length;
    const accepted = bids.filter(
      (b) => b.offer.status === OfferStatus.Accepted
    ).length;
    const rejected = bids.filter(
      (b) => b.offer.status === OfferStatus.Rejected
    ).length;
    return { all: bids.length, pending, accepted, rejected };
  }, [bids]);

  const filtered = useMemo(() => {
    if (filter === 'all') return bids;
    return bids.filter((b) => b.offer.status === filter);
  }, [bids, filter]);

  const totalEarnings = useMemo(
    () =>
      bids
        .filter((b) => b.offer.status === OfferStatus.Accepted)
        .reduce((sum, b) => sum + b.offer.offer_price, 0),
    [bids]
  );

  const winRate = useMemo(() => {
    const decided = counts.accepted + counts.rejected;
    if (decided === 0) return null;
    return Math.round((counts.accepted / decided) * 100);
  }, [counts]);

  const toneFor = (
    s: string
  ): 'warning' | 'success' | 'error' | 'neutral' => {
    if (s === OfferStatus.Accepted) return 'success';
    if (s === OfferStatus.Pending) return 'warning';
    if (s === OfferStatus.Rejected) return 'error';
    return 'neutral';
  };

  const labelFor = (s: string): string => {
    if (s === OfferStatus.Accepted) return t('captain.bidAccepted');
    if (s === OfferStatus.Pending) return t('captain.bidPending');
    if (s === OfferStatus.Rejected) return t('captain.bidRejected');
    return t('captain.bidWithdrawn');
  };

  const iconFor = (s: string) =>
    s === OfferStatus.Accepted
      ? 'checkmark-circle'
      : s === OfferStatus.Rejected
      ? 'close-circle'
      : 'hourglass-outline';

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('captain.myBids')}
        subtitle={
          counts.pending
            ? t('offers.newOffers', { count: counts.pending })
            : undefined
        }
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
        {bids.length > 0 ? (
          <View style={styles.statsRow}>
            <StatTile
              label={t('captain.activeBids')}
              value={counts.pending}
              icon="hourglass-outline"
              tone="warning"
            />
            <StatTile
              label={t('captain.bidAccepted')}
              value={counts.accepted}
              icon="checkmark-circle-outline"
              tone="secondary"
            />
            {winRate != null ? (
              <StatTile
                label={t('captain.winRate')}
                value={`${winRate}%`}
                caption={
                  totalEarnings
                    ? `${formatCurrency(totalEarnings)} ${t(
                        'captain.lifetimeEarnings'
                      )}`
                    : undefined
                }
                icon="trending-up-outline"
                tone="primary"
              />
            ) : null}
          </View>
        ) : null}

        {bids.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <FilterChip
              label={t('trips.filters.all')}
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
              count={counts.all}
            />
            <FilterChip
              label={t('captain.bidPending')}
              selected={filter === OfferStatus.Pending}
              onPress={() => setFilter(OfferStatus.Pending)}
              icon="hourglass-outline"
              count={counts.pending}
            />
            <FilterChip
              label={t('captain.bidAccepted')}
              selected={filter === OfferStatus.Accepted}
              onPress={() => setFilter(OfferStatus.Accepted)}
              icon="checkmark-circle-outline"
              count={counts.accepted}
            />
            <FilterChip
              label={t('captain.bidRejected')}
              selected={filter === OfferStatus.Rejected}
              onPress={() => setFilter(OfferStatus.Rejected)}
              icon="close-circle-outline"
              count={counts.rejected}
            />
          </ScrollView>
        ) : null}

        <StateView
          status={
            bids.length > 0 && filtered.length === 0 ? 'empty' : status
          }
          loading={
            <View style={{ gap: Spacing.sm }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  variant="outlined"
                  style={{ marginBottom: Spacing.sm, gap: Spacing.sm }}
                >
                  <View style={styles.skelRow}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={[styles.skelLine, { width: '70%' }]} />
                      <View
                        style={[
                          styles.skelLine,
                          { width: '50%', height: 10 },
                        ]}
                      />
                    </View>
                    <View
                      style={[
                        styles.skelLine,
                        { width: 70, height: 18, borderRadius: 9 },
                      ]}
                    />
                  </View>
                  <View
                    style={[styles.skelLine, { width: '40%', height: 18 }]}
                  />
                </Card>
              ))}
            </View>
          }
          empty={
            bids.length > 0 && filtered.length === 0
              ? {
                  icon: 'filter-outline',
                  title: t('trips.noResultsTitle'),
                  subtitle: t('trips.noResultsSubtitle'),
                  children: (
                    <Button
                      title={t('captain.filterClearAll')}
                      variant="outline"
                      onPress={() => setFilter('all')}
                    />
                  ),
                }
              : {
                  icon: 'hammer-outline',
                  title: t('captain.noBids'),
                  subtitle: t('captain.noBidsSubtitle'),
                  children: (
                    <Button
                      title={t('captain.browseMarketplace')}
                      onPress={() =>
                        (
                          nav.getParent() as unknown as {
                            navigate: (s: string) => void;
                          } | null
                        )?.navigate('MarketplaceTab')
                      }
                      leftIcon={
                        <Ionicons
                          name="storefront-outline"
                          size={16}
                          color={Colors.onPrimary}
                        />
                      }
                    />
                  ),
                }
          }
          error={{
            title: t('errors.loadFailed'),
            description: errorMsg ?? t('errors.loadFailedSubtitle'),
            retryLabel: t('common.retry'),
            onRetry: () => load('initial'),
          }}
        >
          <View style={[styles.list, layout.isWide && styles.listWide]}>
            {filtered.map(({ offer, trip }) => {
              const dayLabels = (trip.schedule_days ?? [])
                .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
                .filter(Boolean) as string[];
              return (
                <Pressable
                  key={offer.id}
                  onPress={() =>
                    nav.navigate('TripDetails', { tripId: trip.id })
                  }
                  style={layout.isWide ? styles.cardWideWrap : undefined}
                >
                  <Card variant="outlined" style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={1}>
                          {trip.name ||
                            `${formatCityName(trip.start_address)} → ${formatCityName(
                              trip.end_address
                            )}`}
                        </Text>
                        <Text style={styles.subtitle} numberOfLines={1}>
                          <Ionicons name="navigate-outline" size={11} />{' '}
                          {formatCityName(trip.start_address)} →{' '}
                          {formatCityName(trip.end_address)}
                        </Text>
                      </View>
                      <Badge
                        label={labelFor(offer.status)}
                        tone={toneFor(offer.status)}
                        icon={iconFor(offer.status)}
                        size="sm"
                      />
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={Colors.textLight}
                        />
                        <Text style={styles.metaText}>
                          {formatTime(trip.departure_time)}
                        </Text>
                      </View>
                      {trip.distance_km ? (
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="map-outline"
                            size={13}
                            color={Colors.textLight}
                          />
                          <Text style={styles.metaText}>
                            {trip.distance_km} km
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={Colors.textLight}
                        />
                        <Text style={styles.metaText}>
                          {t('captain.submittedOn', {
                            date: formatLongDate(offer.created_at),
                          })}
                        </Text>
                      </View>
                    </View>

                    {dayLabels.length > 0 ? (
                      <View style={styles.daysRow}>
                        {dayLabels.slice(0, 5).map((d) => (
                          <View key={d} style={styles.dayPill}>
                            <Text style={styles.dayPillText}>
                              {t(`days.${d}`)}
                            </Text>
                          </View>
                        ))}
                        {dayLabels.length > 5 ? (
                          <View style={styles.dayPill}>
                            <Text style={styles.dayPillText}>
                              +{dayLabels.length - 5}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    <View style={styles.priceRow}>
                      <View>
                        <Text style={styles.priceLabel}>
                          {t('captain.yourBidPrice')}
                        </Text>
                        <Text style={styles.priceMain}>
                          {formatCurrency(offer.offer_price)}
                        </Text>
                        {offer.price_per_ride ? (
                          <Text style={styles.pricePerRide}>
                            {formatCurrency(offer.price_per_ride)} ·{' '}
                            {t('captain.ratePerTrip')}
                          </Text>
                        ) : null}
                      </View>
                      {offer.status === OfferStatus.Pending ? (
                        <View style={styles.statusHint}>
                          <Ionicons
                            name="time"
                            size={14}
                            color={Colors.warning}
                          />
                          <Text style={styles.statusHintText}>
                            {t('captain.awaitingReview')}
                          </Text>
                        </View>
                      ) : offer.status === OfferStatus.Accepted ? (
                        <View
                          style={[
                            styles.statusHint,
                            { backgroundColor: Colors.successSoft },
                          ]}
                        >
                          <Ionicons
                            name="trophy"
                            size={14}
                            color={Colors.secondary}
                          />
                          <Text
                            style={[
                              styles.statusHintText,
                              { color: Colors.secondary },
                            ]}
                          >
                            {t('captain.bidWon')}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {offer.comment ? (
                      <View style={styles.commentBox}>
                        <Ionicons
                          name="chatbubble-outline"
                          size={13}
                          color={Colors.textLight}
                        />
                        <Text style={styles.comment} numberOfLines={2}>
                          {offer.comment}
                        </Text>
                      </View>
                    ) : null}
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
  cardWideWrap: { width: '49%' },
  card: { marginBottom: Spacing.sm, gap: Spacing.sm },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceLabel: {
    fontSize: 10,
    color: Colors.textLight,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceMain: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  pricePerRide: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  statusHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  statusHintText: {
    fontSize: 11,
    color: Colors.warning,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.surface1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  comment: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  skelLine: {
    height: 14,
    backgroundColor: Colors.surface2,
    borderRadius: BorderRadius.sm,
  },
});
