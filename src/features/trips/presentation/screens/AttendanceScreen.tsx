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
  Badge,
  Banner,
  Button,
  Card,
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
  Shadows,
} from '@core/theme';
import { useResponsiveLayout } from '@shared/hooks';
import {
  formatCurrency,
  formatLongDate,
  formatTime,
  toIsoDate,
  formatCityName,
} from '@core/utils/format';
import { OfferStatus, UserRole, AttendanceStatus } from '@core/constants';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip, TripAttendance } from '../../domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'Attendance'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'Attendance'>;

interface CalendarDay {
  date: Date;
  iso: string;
  isScheduled: boolean;
  attendance?: TripAttendance;
  isToday: boolean;
  confirmedCount: number;
}

type Status = 'loading' | 'success' | 'error' | 'notFound';

const styles = StyleSheet.create({
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  summaryHeader: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text },
  subtitle: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    lineHeight: 17,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  calendarRow: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    paddingEnd: Spacing.sm,
  },
  dayCard: {
    width: 68,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  dayCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryContainer,
    ...Shadows.card,
  },
  dayCardDisabled: { opacity: 0.4, backgroundColor: Colors.surfaceDisabled },
  dayCardConfirmed: { borderColor: Colors.success, backgroundColor: Colors.successContainer },
  dayCardDeclined: { borderColor: Colors.error, backgroundColor: Colors.errorContainer },
  dayLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.textLight,
    textTransform: 'capitalize',
  },
  dayLabelActive: { color: Colors.primary },
  dayNum: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginTop: 2,
  },
  todayPill: {
    position: 'absolute',
    top: -Spacing.xs,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    zIndex: 1,
  },
  todayPillText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: Colors.onSecondary,
    letterSpacing: 0.5,
  },
  tickWrap: {
    marginTop: 6,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickWrapDecline: { backgroundColor: 'transparent' },
  tickWrapPending: { backgroundColor: 'transparent' },
  actionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xxl,
    gap: Spacing.sm,
  },
  actionRequired: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  actionEyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionDate: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginTop: 2,
  },
  helperLight: {
    paddingVertical: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface1,
    borderRadius: BorderRadius.sm,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  priceText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
  },
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  twoColMain: { flex: 2 },
  twoColAside: { flex: 1 },
  attendeesList: {
    marginTop: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLowest,
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    width: '100%',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantInitials: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  participantName: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.text,
    flex: 1,
  },
  participantPrice: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
  },
});

export const AttendanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [submitting, setSubmitting] = useState(false);
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
      setStatus('success');
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

  const days = useMemo<CalendarDay[]>(() => {
    if (!trip || !user) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const iso = toIsoDate(date);
      const isScheduled = (trip.schedule_days ?? []).includes(date.getDay());
      const attendance = (trip.attendance ?? []).find(
        (a) => a.user_id === user.id && a.trip_date === iso
      );
      const confirmedCount = (trip.attendance ?? []).filter(
        (a) => a.trip_date === iso && a.status === AttendanceStatus.Confirmed
      ).length;
      return { date, iso, isScheduled, attendance, isToday: i === 0, confirmedCount };
    });
  }, [trip, user]);

  const acceptedOffer = useMemo(
    () =>
      trip?.offers?.find(
        (o) => o.captain_id === trip.captain_id && o.status === OfferStatus.Accepted
      ),
    [trip]
  );

  const totalTripPrice = useMemo(() => acceptedOffer?.price_per_ride || acceptedOffer?.offer_price || 0, [acceptedOffer]);

  const dayAttendees = useMemo(() => {
    if (!selectedDate || !trip) return [];
    const confirmed = (trip.attendance ?? []).filter(
      (a) => a.trip_date === selectedDate && a.status === AttendanceStatus.Confirmed
    );
    const userIds = confirmed.map((c) => c.user_id);
    return (trip.passengers ?? []).filter((p) => userIds.includes(p.user_id));
  }, [trip, selectedDate]);

  const currentPrice = useMemo(() => {
    if (dayAttendees.length === 0) return 0;
    return totalTripPrice / dayAttendees.length;
  }, [dayAttendees.length, totalTripPrice]);

  if (status === 'loading') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('attendance.title')} onBack={() => nav.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card>
            <Skeleton width="40%" height={14} />
            <View style={{ height: 8 }} />
            <Skeleton width="70%" height={10} />
            <View style={{ height: Spacing.md }} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Skeleton height={60} radius={BorderRadius.lg} style={{ flex: 1 }} />
              <Skeleton height={60} radius={BorderRadius.lg} style={{ flex: 1 }} />
            </View>
          </Card>
          <View style={{ height: Spacing.md }} />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width={68} height={100} radius={BorderRadius.xl} />
            ))}
          </View>
          <View style={{ height: Spacing.md }} />
          <Card style={{ height: 240, borderRadius: BorderRadius.xxl }} />
        </ScrollView>
      </Screen>
    );
  }

  if (status === 'notFound') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('attendance.title')} onBack={() => nav.goBack()} />
        <ErrorState
          icon="map-outline"
          title={t('errors.tripNotFound')}
          description={t('errors.tripNotFoundSubtitle')}
        />
      </Screen>
    );
  }

  if (status === 'error' || !trip || !user) {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('attendance.title')} onBack={() => nav.goBack()} />
        <ErrorState
          title={t('errors.loadFailed')}
          description={errorMsg ?? t('errors.loadFailedSubtitle')}
          retryLabel={t('common.retry')}
          onRetry={load}
        />
      </Screen>
    );
  }

  const selectedDay = days.find((d) => d.iso === selectedDate);

  const handleConfirm = async () => {
    if (!selectedDay?.isScheduled) return;
    setSubmitting(true);
    try {
      await tripsRepository.confirmAttendance(trip.id, user.id, selectedDay.iso);
      await load();
      setActionMsg({ tone: 'success', text: t('attendance.actionSuccess') });
    } catch (err) {
      setActionMsg({
        tone: 'error',
        text: err instanceof Error ? err.message : t('errors.actionFailed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedDay) return;
    setSubmitting(true);
    try {
      await tripsRepository.cancelAttendance(trip.id, user.id, selectedDay.iso);
      await load();
      setActionMsg({ tone: 'success', text: t('attendance.actionSuccess') });
    } catch (err) {
      setActionMsg({
        tone: 'error',
        text: err instanceof Error ? err.message : t('errors.actionFailed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const myAttendance = (trip.attendance ?? []).filter(
    (a) => a.user_id === user.id
  );
  const confirmedCount = myAttendance.filter(
    (a) => a.status === AttendanceStatus.Confirmed
  ).length;
  const totalScheduled = days.filter((d) => d.isScheduled).length || 1;
  const attendanceRate = Math.round((confirmedCount / totalScheduled) * 100);

  const TripSummaryCard = (
    <Card>
      <View style={styles.summaryHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {formatCityName(trip.start_address)} →{' '}
            {formatCityName(trip.end_address)}
          </Text>
          <Text style={styles.subtitle}>
            <Ionicons name="time-outline" size={11} />{' '}
            {formatTime(trip.departure_time)} ·{' '}
            <Ionicons name="location-outline" size={11} />{' '}
            {formatCityName(trip.start_address)} →{' '}
            {formatCityName(trip.end_address)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatTile
          label={t('attendance.attendanceRate')}
          value={`${attendanceRate}%`}
          icon="trending-up-outline"
          tone="success"
        />
        <StatTile
          label={t('attendance.verifiedTrips')}
          value={`${confirmedCount}/${totalScheduled}`}
          icon="checkmark-circle-outline"
          tone="primary"
        />
        {totalTripPrice > 0 ? (
          <StatTile
            label={t('attendance.totalTripPrice')}
            value={formatCurrency(totalTripPrice)}
            icon="cash-outline"
            tone="secondary"
          />
        ) : null}
      </View>
    </Card>
  );

  const CalendarCard = (
    <View>
      <SectionHeader
        title={t('attendance.weekOverview')}
        caption={t('attendance.selectDay')}
        leadingIcon="calendar-outline"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarRow}
      >
        {days.map((d) => {
          const isSelected = d.iso === selectedDate;
          const status = d.attendance?.status;
          return (
            <Pressable
              key={d.iso}
              disabled={!d.isScheduled}
              onPress={() => setSelectedDate(d.iso)}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
                !d.isScheduled && styles.dayCardDisabled,
                status === AttendanceStatus.Confirmed && styles.dayCardConfirmed,
                status === AttendanceStatus.Declined && styles.dayCardDeclined,
              ]}
            >
              {d.isToday ? (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>
                    {t('common.today').toUpperCase()}
                  </Text>
                </View>
              ) : null}
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelActive,
                  !d.isScheduled && { color: Colors.textLight },
                ]}
              >
                {d.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.dayNum,
                  isSelected && styles.dayLabelActive,
                  !d.isScheduled && { color: Colors.textLight },
                ]}
              >
                {d.date.getDate()}
              </Text>
              {status === AttendanceStatus.Confirmed ? (
                <View style={styles.tickWrap}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.onPrimary}
                  />
                </View>
              ) : status === AttendanceStatus.Declined ? (
                <View style={[styles.tickWrap, styles.tickWrapDecline]}>
                  <Ionicons name="close-circle" size={16} color={Colors.onError} />
                </View>
              ) : d.isScheduled ? (
                <View style={[styles.tickWrap, styles.tickWrapPending]}>
                  <Ionicons
                    name="radio-button-off"
                    size={14}
                    color={Colors.textLight}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const ActionCard = selectedDay ? (
    <Card
      style={[
        styles.actionCard,
        selectedDay.isScheduled &&
          !selectedDay.attendance?.confirmed_at &&
          styles.actionRequired,
      ]}
      variant={
        selectedDay.attendance?.status === AttendanceStatus.Confirmed
          ? 'tinted'
          : 'elevated'
      }
    >
      <View style={styles.actionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionEyebrow}>
            {selectedDay.isToday ? t('common.today') : t('common.tomorrow')}
          </Text>
          <Text style={styles.actionDate}>
            {formatLongDate(selectedDay.date)}
          </Text>
        </View>
        {selectedDay.attendance?.status === AttendanceStatus.Confirmed ? (
          <Badge
            label={t('attendance.confirmed')}
            tone="success"
            icon="checkmark-circle"
          />
        ) : selectedDay.attendance?.status === AttendanceStatus.Declined ? (
          <Badge label={t('attendance.declined')} tone="error" icon="close-circle" />
        ) : selectedDay.isScheduled ? (
          <Badge label={t('attendance.pending')} tone="warning" icon="alert-circle" />
        ) : (
          <Badge label={t('attendance.notScheduled')} tone="neutral" />
        )}
      </View>

      {!selectedDay.isScheduled ? (
        <Text style={styles.helperLight}>{t('attendance.noTripToday')}</Text>
      ) : (
        <>
          {totalTripPrice > 0 ? (
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>{t('trips.perPassenger')}</Text>
                <Text style={{ fontSize: 10, color: Colors.textLight }}>
                  {formatCurrency(totalTripPrice)} / {dayAttendees.length || 1}
                </Text>
              </View>
              <Text style={styles.priceText}>{formatCurrency(currentPrice)}</Text>
            </View>
          ) : null}

          {dayAttendees.length > 0 && (
            <View style={styles.attendeesList}>
              <View style={styles.nameRow}>
                {dayAttendees.map((p) => (
                  <View key={p.user_id} style={styles.participantChip}>
                    <View style={styles.participantInfo}>
                      <View style={styles.participantAvatar}>
                        <Text style={styles.participantInitials}>
                          {(p.user_name || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.participantName} numberOfLines={1}>
                        {p.user_name}
                      </Text>
                    </View>
                    <Text style={styles.participantPrice}>
                      {formatCurrency(currentPrice)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {selectedDay.attendance?.status === AttendanceStatus.Confirmed ? (
            <Button
              title={t('attendance.cancelSeat')}
              variant="outline"
              loading={submitting}
              onPress={handleCancel}
              style={{ marginTop: Spacing.sm }}
            />
          ) : (
            <>
              <Button
                title={t('attendance.confirmAttendance')}
                loading={submitting}
                onPress={handleConfirm}
                style={{ marginTop: Spacing.sm }}
                leftIcon={
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={Colors.onPrimary}
                  />
                }
              />
              {selectedDay.attendance?.status !== AttendanceStatus.Declined ? (
                <Button
                  title={t('attendance.cancelSeat')}
                  variant="ghost"
                  onPress={handleCancel}
                  style={{ marginTop: Spacing.xs }}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </Card>
  ) : null;

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('attendance.title')}
        onBack={() => nav.goBack()}
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

        {layout.isWide ? (
          <View style={styles.twoCol}>
            <View style={styles.twoColMain}>
              {TripSummaryCard}
              <View style={{ height: Spacing.md }} />
              {CalendarCard}
            </View>
            <View style={styles.twoColAside}>{ActionCard}</View>
          </View>
        ) : (
          <>
            {TripSummaryCard}
            {CalendarCard}
            {ActionCard}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};
