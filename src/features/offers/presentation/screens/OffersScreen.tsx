import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  Screen,
  SectionHeader,
  Skeleton,
  StatTile,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { useResponsiveLayout } from '@shared/hooks';
import { OfferStatus } from '@core/constants';
import { formatCurrency } from '@core/utils/format';
import { shareTrip } from '@core/utils/sharing';

import { tripsRepository } from '@features/trips/data/tripsRepository';
import { CaptainOffer, Trip } from '@features/trips/domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'Offers'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'Offers'>;

type Status = 'loading' | 'success' | 'empty' | 'error' | 'notFound';

export const OffersScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const layout = useResponsiveLayout();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await tripsRepository.getTrip(tripId);
      if (!data) {
        setStatus('notFound');
        return;
      }
      setTrip(data);
      const offers = data.offers ?? [];
      setStatus(offers.length === 0 ? 'empty' : 'success');
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t('errors.network'));
      setStatus('error');
    }
  }, [tripId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const accept = async (o: CaptainOffer) => {
    setBusy(o.id);
    try {
      await tripsRepository.acceptOffer(o.id);
      await load();
      setActionMsg({
        tone: 'success',
        text: t('offers.acceptedSuccess', { captain: o.captain_name || '' }),
      });
    } catch (err) {
      setActionMsg({
        tone: 'error',
        text: err instanceof Error ? err.message : t('errors.actionFailed'),
      });
    } finally {
      setBusy(null);
    }
  };

  const reject = async (o: CaptainOffer) => {
    setBusy(o.id);
    try {
      await tripsRepository.rejectOffer(o.id);
      await load();
      setActionMsg({ tone: 'success', text: t('offers.rejectedSuccess') });
    } catch (err) {
      setActionMsg({
        tone: 'error',
        text: err instanceof Error ? err.message : t('errors.actionFailed'),
      });
    } finally {
      setBusy(null);
    }
  };

  const offers = trip?.offers ?? [];
  const pending = offers.filter((o) => o.status === OfferStatus.Pending);
  const accepted = offers.find((o) => o.status === OfferStatus.Accepted);

  const stats = useMemo(() => {
    if (!pending.length) return null;
    const lowest = pending.reduce(
      (m, o) => (o.offer_price < m ? o.offer_price : m),
      pending[0].offer_price
    );
    const fastestEta = pending.reduce<number | null>((m, o) => {
      if (!o.eta_minutes) return m;
      if (m === null) return o.eta_minutes;
      return Math.min(m, o.eta_minutes);
    }, null);
    const topRating = pending.reduce<number | null>((m, o) => {
      if (!o.captain_rating) return m;
      if (m === null) return o.captain_rating;
      return Math.max(m, o.captain_rating);
    }, null);
    return { lowest, fastestEta, topRating };
  }, [pending]);

  if (status === 'loading') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('offers.bidsReceived')} onBack={() => nav.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} style={{ marginBottom: Spacing.sm }}>
              <View style={styles.skelRow}>
                <Skeleton width={42} height={42} radius={BorderRadius.pill} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="50%" height={14} />
                  <Skeleton width="80%" height={10} />
                </View>
                <Skeleton width={64} height={20} radius={BorderRadius.pill} />
              </View>
              <View style={{ height: Spacing.sm }} />
              <Skeleton width="100%" height={48} radius={BorderRadius.md} />
            </Card>
          ))}
        </ScrollView>
      </Screen>
    );
  }

  if (status === 'notFound') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('offers.bidsReceived')} onBack={() => nav.goBack()} />
        <ErrorState
          icon="map-outline"
          title={t('errors.tripNotFound')}
          description={t('errors.tripNotFoundSubtitle')}
        />
      </Screen>
    );
  }

  if (status === 'error' || !trip) {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('offers.bidsReceived')} onBack={() => nav.goBack()} />
        <ErrorState
          title={t('errors.loadFailed')}
          description={errorMsg ?? t('errors.loadFailedSubtitle')}
          retryLabel={t('common.retry')}
          onRetry={load}
        />
      </Screen>
    );
  }

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('offers.bidsReceived')}
        onBack={() => nav.goBack()}
        subtitle={
          pending.length
            ? t('offers.newOffers', { count: pending.length })
            : t('offers.noNewOffers')
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
      >
        {actionMsg ? (
          <Banner
            tone={actionMsg.tone === 'success' ? 'success' : 'error'}
            title={
              actionMsg.tone === 'success'
                ? t('common.success')
                : t('errors.actionFailed')
            }
            description={actionMsg.text}
            onDismiss={() => setActionMsg(null)}
            style={{ marginBottom: Spacing.md }}
          />
        ) : null}

        {accepted ? (
          <Card style={styles.acceptedCard} variant="tinted">
            <View style={styles.row}>
              <Avatar name={accepted.captain_name} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.captainName}>{accepted.captain_name}</Text>
                <Text style={styles.vehicle}>
                  {accepted.vehicle_label} · {accepted.vehicle_seats}{' '}
                  {t('common.seats')}
                </Text>
              </View>
              <Badge
                label={t('offers.selectedCaptain')}
                tone="success"
                icon="checkmark-circle"
              />
            </View>
            <View style={styles.statsRow}>
              <StatTile
                label={t('offers.basePrice')}
                value={formatCurrency(accepted.offer_price)}
                icon="cash-outline"
                tone="primary"
              />
              {accepted.eta_minutes ? (
                <StatTile
                  label={t('captain.estTime')}
                  value={`${accepted.eta_minutes} ${t('common.min')}`}
                  icon="time-outline"
                  tone="secondary"
                />
              ) : null}
              {accepted.captain_rating ? (
                <StatTile
                  label={t('offers.rating')}
                  value={accepted.captain_rating.toFixed(1)}
                  icon="star-outline"
                  tone="warning"
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {status === 'empty' && !accepted ? (
          <Card style={{ marginTop: Spacing.md }}>
            <EmptyState
              icon="megaphone-outline"
              title={t('offers.bidsReceived')}
              subtitle={t('offers.noOffersYet')}
            >
              <Button
                title={t('trips.shareTrip')}
                onPress={() => shareTrip(trip, t)}
                leftIcon={
                  <Ionicons
                    name="share-social-outline"
                    size={20}
                    color={Colors.onPrimary}
                  />
                }
              />
            </EmptyState>
          </Card>
        ) : null}

        {stats && !accepted ? (
          <View style={styles.compareWrap}>
            <SectionHeader
              title={t('offers.comparison')}
              leadingIcon="podium-outline"
              style={{ marginTop: Spacing.lg }}
            />
            <View style={styles.compareRow}>
              <View style={[styles.compareTile, styles.compareTileLow]}>
                <Text style={styles.compareTileLabel}>
                  {t('offers.lowestBid')}
                </Text>
                <Text style={styles.compareTileValue}>
                  {formatCurrency(stats.lowest)}
                </Text>
              </View>
              {stats.fastestEta !== null ? (
                <View style={styles.compareTile}>
                  <Text style={styles.compareTileLabel}>
                    {t('offers.fastestEta')}
                  </Text>
                  <Text style={styles.compareTileValue}>
                    {stats.fastestEta} {t('common.min')}
                  </Text>
                </View>
              ) : null}
              {stats.topRating !== null ? (
                <View style={styles.compareTile}>
                  <Text style={styles.compareTileLabel}>
                    {t('offers.topRated')}
                  </Text>
                  <Text style={styles.compareTileValue}>
                    {stats.topRating.toFixed(1)} ★
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {pending.length > 0 ? (
          <SectionHeader
            title={t('offers.bidsReceived')}
            caption={t('offers.newOffers', { count: pending.length })}
            leadingIcon="hammer-outline"
            style={{ marginTop: Spacing.md }}
          />
        ) : null}

        <View style={layout.isWide ? styles.gridWide : undefined}>
          {pending.map((o) => (
            <Card
              key={o.id}
              style={[styles.offerCard, layout.isWide && { width: '49%' }]}
              variant="outlined"
            >
              <View style={styles.row}>
                <Avatar name={o.captain_name} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.captainName}>{o.captain_name}</Text>
                  <Text style={styles.vehicle}>
                    <Ionicons name="car-outline" size={12} /> {o.vehicle_label}{' '}
                    {o.vehicle_seats
                      ? `· ${o.vehicle_seats} ${t('common.seats')}`
                      : ''}
                  </Text>
                  {o.captain_rating ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color={Colors.warning} />
                      <Text style={styles.ratingText}>
                        {o.captain_rating.toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.priceMain}>
                    {formatCurrency(o.offer_price)}
                  </Text>
                  {o.price_per_ride ? (
                    <Text style={styles.pricePer}>
                      {formatCurrency(o.price_per_ride)} {t('common.perRide')}
                    </Text>
                  ) : null}
                </View>
              </View>

              {o.comment ? (
                <View style={styles.comment}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.commentText}>{o.comment}</Text>
                </View>
              ) : null}

              {o.eta_minutes || o.vehicle_seats ? (
                <View style={styles.metaRow}>
                  {o.eta_minutes ? (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={Colors.textLight}
                      />
                      <Text style={styles.metaText}>
                        {o.eta_minutes} {t('common.min')}
                      </Text>
                    </View>
                  ) : null}
                  {o.vehicle_seats ? (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="people-outline"
                        size={12}
                        color={Colors.textLight}
                      />
                      <Text style={styles.metaText}>
                        {o.vehicle_seats} {t('common.seats')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.actions}>
                <Button
                  title={t('offers.acceptOffer')}
                  onPress={() => accept(o)}
                  loading={busy === o.id}
                  style={{ flex: 1 }}
                  size="sm"
                  leftIcon={
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Colors.onPrimary}
                    />
                  }
                />
                <View style={{ width: Spacing.sm }} />
                <Button
                  title={t('offers.rejectOffer')}
                  variant="outline"
                  onPress={() => reject(o)}
                  loading={busy === o.id}
                  style={{ flex: 1 }}
                  size="sm"
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  acceptedCard: { marginBottom: Spacing.lg, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  captainName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  vehicle: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  priceMain: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  pricePer: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  compareWrap: {},
  compareRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  compareTile: {
    flex: 1,
    minWidth: 110,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface1,
  },
  compareTileLow: {
    backgroundColor: Colors.secondarySoft,
  },
  compareTileLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  compareTileValue: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  offerCard: { marginBottom: Spacing.sm, gap: Spacing.sm },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.primarySoft,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  commentText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
  metaRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  actions: { flexDirection: 'row' },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
