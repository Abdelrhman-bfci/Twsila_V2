import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { shareTrip } from '@core/utils/sharing';
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
  ErrorState,
  Header,
  RouteTimeline,
  Screen,
  SectionHeader,
  Skeleton,
  StatTile,
  TripRouteMapView,
} from '@shared/components';
import type { RouteMapPoint } from '@shared/components';
import { useResponsiveLayout } from '@shared/hooks';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import { DAYS_OF_WEEK, TripStatus, UserRole, OfferStatus } from '@core/constants';
import { formatTime, formatCurrency, formatCityName } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import {
  PassengerExploreStackParamList,
  CaptainMarketplaceStackParamList,
} from '@navigation/types';

type CombinedParamList = PassengerExploreStackParamList &
  CaptainMarketplaceStackParamList;

type Nav = NativeStackNavigationProp<CombinedParamList, 'TripDetails'>;
type Rt = RouteProp<CombinedParamList, 'TripDetails'>;

type Status = 'loading' | 'success' | 'error' | 'notFound';

export const TripDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') setRefreshing(true);
      else setStatus('loading');
      try {
        const data = await tripsRepository.getTrip(tripId);
        if (!data) {
          setStatus('notFound');
          return;
        }
        setTrip(data);
        setStatus('success');
        setErrorMsg(null);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : t('errors.network'));
        setStatus('error');
      } finally {
        setRefreshing(false);
      }
    },
    [tripId, t]
  );

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load])
  );
  useEffect(() => {
    load('initial');
  }, [load]);

  const handleJoin = async () => {
    if (!user || !trip) return;
    setBusy(true);
    try {
      await tripsRepository.joinTrip(trip.id, user.id);
      setActionMsg({ tone: 'success', text: t('trips.joinSuccess') });
      await load('initial');
    } catch (err) {
      setActionMsg({
        tone: 'error',
        text: err instanceof Error ? err.message : t('errors.actionFailed'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !trip) return;
    setBusy(true);
    try {
      await tripsRepository.leaveTrip(trip.id, user.id);
      setActionMsg({ tone: 'success', text: t('trips.leaveSuccess') });
      await load('initial');
    } catch (err) {
      setActionMsg({
        tone: 'error',
        text: err instanceof Error ? err.message : t('errors.actionFailed'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleShare = () => {
    if (trip) shareTrip(trip, t);
  };

  if (status === 'loading') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('trips.tripDetails')} onBack={() => nav.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Skeleton height={220} radius={BorderRadius.lg} />
          <View style={{ height: Spacing.md }} />
          <Card>
            <View style={styles.skelRow}>
              <Skeleton width={44} height={44} radius={BorderRadius.pill} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="40%" height={10} />
                <Skeleton width="60%" height={14} />
              </View>
            </View>
            <View style={{ height: Spacing.sm }} />
            <Skeleton width="100%" height={12} />
            <View style={{ height: 6 }} />
            <Skeleton width="80%" height={12} />
          </Card>
          <View style={{ height: Spacing.md }} />
          <Card>
            <Skeleton width="50%" height={14} />
            <View style={{ height: Spacing.sm }} />
            <Skeleton width="100%" height={10} />
            <View style={{ height: 6 }} />
            <Skeleton width="90%" height={10} />
            <View style={{ height: 6 }} />
            <Skeleton width="80%" height={10} />
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  if (status === 'notFound') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('trips.tripDetails')} onBack={() => nav.goBack()} />
        <ErrorState
          icon="map-outline"
          title={t('errors.tripNotFound')}
          description={t('errors.tripNotFoundSubtitle')}
          retryLabel={t('common.retry')}
          onRetry={() => load('initial')}
        />
      </Screen>
    );
  }

  if (status === 'error' || !trip) {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('trips.tripDetails')} onBack={() => nav.goBack()} />
        <ErrorState
          title={t('errors.loadFailed')}
          description={errorMsg ?? t('errors.loadFailedSubtitle')}
          retryLabel={t('common.retry')}
          onRetry={() => load('initial')}
        />
      </Screen>
    );
  }

  const passengers = trip.passengers ?? [];
  const stops = trip.stops ?? [];
  const pricing = trip.pricing ?? [];

  const isAdmin = trip.admin_id === user?.id;
  const isMember = passengers.some((p) => p.user_id === user?.id);
  const isCaptain = user?.role === UserRole.Captain;
  const isAssignedCaptain = trip.captain_id === user?.id;
  const myOffer = trip.offers?.find(
    (o) => o.captain_id === user?.id && o.status === OfferStatus.Pending
  );

  const seatsLeft = Math.max(0, trip.total_seats - passengers.length);
  const schedDays = trip.schedule_days ?? [];

  const timelineStops = [
    {
      label: t('trips.startPoint'),
      address: formatCityName(trip.start_address),
      type: 'start' as const,
      meta: formatTime(trip.departure_time),
    },
    ...stops.map((s) => ({
      label: t('trips.intermediateStop', { n: s.stop_order + 1 }),
      address: formatCityName(s.address),
      type: 'middle' as const,
      meta: s.distance_from_start_km ? `${s.distance_from_start_km} km` : undefined,
    })),
    {
      label: t('trips.endPoint'),
      address: formatCityName(trip.end_address),
      type: 'end' as const,
      meta: trip.distance_km ? `${trip.distance_km} km` : undefined,
    },
  ];

  const routeMapPoints: RouteMapPoint[] = [
    {
      type: 'start',
      label: formatCityName(trip.start_address, 28),
      lat: trip.start_lat,
      lng: trip.start_lng,
    },
    ...stops.map((s) => ({
      type: 'middle' as const,
      label: formatCityName(s.address, 28),
      lat: s.lat,
      lng: s.lng,
    })),
    {
      type: 'end',
      label: formatCityName(trip.end_address, 28),
      lat: trip.end_lat,
      lng: trip.end_lng,
    },
  ];

  const StatusBadge = (
    <Badge
      label={t(`trips.status.${trip.status}`)}
      tone={
        trip.status === TripStatus.Assigned
          ? 'success'
          : trip.status === TripStatus.Bidding
            ? 'warning'
            : 'primary'
      }
      icon={
        trip.status === TripStatus.Assigned ? 'checkmark-circle' : undefined
      }
    />
  );

  const HeroCard = (
    <Card style={styles.heroCard}>
      <View style={styles.heroTop}>
        <Avatar name={trip.admin_name} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroAdminLabel}>{t('trips.tripAdmin')}</Text>
          <Text style={styles.heroAdminName}>{trip.admin_name || '—'}</Text>
        </View>
        {isAdmin ? (
          <Badge
            label={t('trips.youAreAdmin')}
            tone="primary"
            icon="shield-checkmark"
            size="sm"
          />
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <StatTile
          label={t('trips.departureTime')}
          value={formatTime(trip.departure_time)}
          icon="time-outline"
        />
        <StatTile
          label={t('common.seats')}
          value={`${passengers.length}/${trip.total_seats}`}
          caption={
            seatsLeft === 0
              ? t('trips.tripFull')
              : seatsLeft === 1
                ? t('trips.seatLeft')
                : t('trips.seatsLeft', { count: seatsLeft })
          }
          icon="people-outline"
          tone={seatsLeft === 0 ? 'warning' : 'primary'}
        />
        {trip.distance_km ? (
          <StatTile
            label={t('captain.totalDistance')}
            value={`${trip.distance_km} ${t('common.km')}`}
            icon="map-outline"
            tone="neutral"
          />
        ) : null}
        <StatTile
          label={t('trips.isRoundTrip')}
          value={trip.is_round_trip ? t('common.yes') : t('common.no')}
          icon="repeat-outline"
          tone={trip.is_round_trip ? 'success' : 'neutral'}
        />
      </View>
    </Card>
  );

  const TimelineCard = (
    <View>
      <SectionHeader title={t('trips.tripTimeline')} leadingIcon="git-branch-outline" />
      <Card>
        <RouteTimeline stops={timelineStops} />
      </Card>
    </View>
  );

  const ScheduleCard = (
    <View>
      <SectionHeader title={t('trips.scheduleDays')} leadingIcon="calendar-outline" />
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
          <Ionicons name="calendar-clear-outline" size={11} /> {trip.active_from}
          {' → '}
          {trip.active_to || '—'}
        </Text>
      </Card>
    </View>
  );

  const PassengersCard = (
    <View>
      <SectionHeader
        title={t('trips.passengers')}
        caption={`${passengers.length}/${trip.total_seats}`}
        leadingIcon="people-outline"
      />
      <Card>
        {passengers.length === 0 ? (
          <Text style={styles.empty}>{t('trips.noPassengers')}</Text>
        ) : (
          passengers.map((p, idx) => {
            const price = pricing.find((x) => x.user_id === p.user_id)?.price;
            return (
              <View
                key={p.id}
                style={[
                  styles.passengerRow,
                  idx > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: Colors.borderLight,
                    paddingTop: Spacing.sm,
                    marginTop: Spacing.xs,
                  },
                ]}
              >
                <Avatar name={p.user_name} size={36} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.passengerName}>{p.user_name || '—'}</Text>
                  {(isAdmin || isAssignedCaptain) && p.user_phone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${p.user_phone}`)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Ionicons name="call-outline" size={13} color={Colors.primary} />
                        <Text style={styles.passengerPhone}>Call</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => Linking.openURL(`whatsapp://send?phone=${p.user_phone}`)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
                        <Text style={[styles.passengerPhone, { color: '#25D366' }]}>WhatsApp</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.passengerMeta}>
                      {p.pickup_address
                        ? formatCityName(p.pickup_address)
                        : '—'}
                      {p.distance_km ? ` · ${p.distance_km} km` : ''}
                    </Text>
                  )}
                </View>
                {p.is_admin ? (
                  <Badge
                    label={t('trips.tripAdmin')}
                    tone="primary"
                    size="sm"
                  />
                ) : (
                  <Badge label="—" tone="neutral" size="sm" />
                )}
              </View>
            );
          })
        )}
      </Card>
    </View>
  );

  const CaptainCard = trip.captain_id ? (
    <View>
      <SectionHeader title={t('offers.selectedCaptain')} leadingIcon="car-outline" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Avatar name={trip.captain_name} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.heroAdminLabel}>{t('nav.captain')}</Text>
            <Text style={styles.heroAdminName}>{trip.captain_name || '—'}</Text>
            {(isAdmin || isMember) && trip.captain_phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 4 }}>
                <Pressable
                  onPress={() => Linking.openURL(`tel:${trip.captain_phone}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Ionicons name="call-outline" size={13} color={Colors.primary} />
                  <Text style={styles.passengerPhone}>Call</Text>
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL(`whatsapp://send?phone=${trip.captain_phone}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
                  <Text style={[styles.passengerPhone, { color: '#25D366' }]}>WhatsApp</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
    </View>
  ) : null;

  const Actions = (
    <View>
      {isAdmin ? (
        <View style={styles.adminActions}>
          <Button
            title={t('offers.bidsReceived')}
            onPress={() => nav.navigate('Offers', { tripId: trip.id })}
            leftIcon={
              <Ionicons name="hammer-outline" size={18} color={Colors.onPrimary} />
            }
          />
          <View style={{ height: Spacing.sm }} />
          <Button
            title={t('attendance.title')}
            variant="outline"
            onPress={() => nav.navigate('Attendance', { tripId: trip.id })}
            leftIcon={
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            }
          />
        </View>
      ) : null}

      {!isAdmin && isMember ? (
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
            loading={busy}
          />
        </View>
      ) : null}

      {!isMember && !isCaptain ? (
        <View style={styles.adminActions}>
          <Button
            title={seatsLeft > 0 ? t('trips.joinTrip') : t('trips.tripFull')}
            onPress={handleJoin}
            disabled={seatsLeft === 0}
            loading={busy}
            leftIcon={
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={Colors.onPrimary}
              />
            }
          />
        </View>
      ) : null}

      {isCaptain ? (
        <View style={styles.adminActions}>
          {isAssignedCaptain ? (
            <>
              <Banner
                tone="success"
                title={t('offers.status.accepted')}
                description={t('captain.youAreAssigned')}
                icon="checkmark-circle"
              />
              <View style={{ height: Spacing.sm }} />
              <Button
                title={t('attendance.title')}
                variant="outline"
                onPress={() => nav.navigate('Attendance', { tripId: trip.id })}
                leftIcon={
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                }
              />
            </>
          ) : myOffer ? (
            <View style={{ gap: Spacing.sm }}>
              <Badge
                label={t('captain.bidPending')}
                tone="warning"
                icon="hourglass-outline"
                style={{ alignSelf: 'flex-start' }}
              />
              <Button
                title={t('captain.editBid')}
                variant="outline"
                onPress={() => nav.navigate('SubmitBid', { tripId: trip.id })}
                leftIcon={
                  <Ionicons name="create-outline" size={18} color={Colors.primary} />
                }
              />
            </View>
          ) : (
            <Button
              title={t('captain.submitBid')}
              onPress={() => nav.navigate('SubmitBid', { tripId: trip.id })}
              disabled={trip.status === TripStatus.Assigned}
              leftIcon={
                <Ionicons name="hammer-outline" size={18} color={Colors.onPrimary} />
              }
            />
          )}
        </View>
      ) : null}

      <View style={{ marginTop: Spacing.md }}>
        <Button
          title={t('trips.shareTrip')}
          variant="outline"
          onPress={handleShare}
          leftIcon={
            <Ionicons
              name="share-social-outline"
              size={20}
              color={Colors.primary}
            />
          }
        />
      </View>
    </View>
  );

  return (
    <Screen background={Colors.surface}>
      <Header
        title={`${formatCityName(trip.start_address)} → ${formatCityName(
          trip.end_address
        )}`}
        onBack={() => nav.goBack()}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            {trip.admin_id === user?.id && (
              <Pressable
                onPress={() => nav.navigate('CreateTrip', { tripId: trip.id })}
                hitSlop={10}
                style={({ pressed }) => ({
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: pressed ? Colors.surface2 : Colors.surface1,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Ionicons name="create-outline" size={20} color={Colors.primary} />
              </Pressable>
            )}
            {StatusBadge}
          </View>
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
              <Text style={styles.routeBadgeTitle} numberOfLines={1}>
                {formatCityName(trip.start_address)} →{' '}
                {formatCityName(trip.end_address)}
              </Text>
            </View>
          </View>
        </View>

        {layout.isWide ? (
          <View style={styles.twoCol}>
            <View style={styles.twoColMain}>
              {HeroCard}
              {TimelineCard}
              {PassengersCard}
            </View>
            <View style={styles.twoColAside}>
              {CaptainCard}
              {ScheduleCard}
              {Actions}
            </View>
          </View>
        ) : (
          <>
            {HeroCard}
            {TimelineCard}
            {CaptainCard}
            {ScheduleCard}
            {PassengersCard}
            {Actions}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
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
  heroCard: { gap: Spacing.md, ...Shadows.card },
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
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
    textAlign: 'center',
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
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
  passengerPhone: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  priceText: {
    fontSize: 14,
    color: Colors.secondary,
    fontFamily: FontFamily.bold,
  },
  adminActions: { marginTop: Spacing.md },
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  twoColMain: { flex: 2 },
  twoColAside: { flex: 1 },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
