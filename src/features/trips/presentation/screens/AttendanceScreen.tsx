import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import {
  AttendanceStatus,
} from '@core/constants';
import {
  formatCurrency,
  formatLongDate,
  formatTime,
  toIsoDate,
  formatCityName,
} from '@core/utils/format';

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
}

export const AttendanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(new Date()));
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const t = await tripsRepository.getTrip(tripId);
    setTrip(t);
  }, [tripId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
      return { date, iso, isScheduled, attendance, isToday: i === 0 };
    });
  }, [trip, user]);

  if (!trip || !user) {
    return (
      <Screen>
        <Header title={t('common.loading')} onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const selectedDay = days.find((d) => d.iso === selectedDate);
  const myPricing = (trip.pricing ?? []).find((p) => p.user_id === user.id);
  const lockedPrice =
    selectedDay?.attendance?.price_locked || myPricing?.price;

  const handleConfirm = async () => {
    if (!selectedDay?.isScheduled) return;
    setSubmitting(true);
    try {
      await tripsRepository.confirmAttendance(trip.id, user.id, selectedDay.iso);
      await load();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : '');
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
    } finally {
      setSubmitting(false);
    }
  };

  const myAttendance = (trip.attendance ?? []).filter((a) => a.user_id === user.id);
  const confirmedCount = myAttendance.filter(
    (a) => a.status === AttendanceStatus.Confirmed
  ).length;
  const totalCount = myAttendance.length || 1;
  const attendanceRate = Math.round((confirmedCount / totalCount) * 100);

  return (
    <Screen background={Colors.surface}>
      <Header title={t('attendance.title')} onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.title}>
            {formatCityName(trip.start_address)} → {formatCityName(trip.end_address)}
          </Text>
          <Text style={styles.subtitle}>
            {formatTime(trip.departure_time)} · {trip.start_address}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{attendanceRate}%</Text>
              <Text style={styles.statLabel}>{t('attendance.attendanceRate')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{confirmedCount}</Text>
              <Text style={styles.statLabel}>{t('attendance.verifiedTrips')}</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.section}>{t('attendance.subtitle')}</Text>
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
                  ]}
                >
                  {d.date.getDate()}
                </Text>
                {status === AttendanceStatus.Confirmed && (
                  <View style={styles.tickWrap}>
                    <Ionicons name="checkmark" size={12} color={Colors.onSecondary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedDay && (
          <Card
            style={[
              styles.actionCard,
              selectedDay.isScheduled && !selectedDay.attendance?.confirmed_at && styles.actionRequired,
            ]}
            variant={
              selectedDay.attendance?.status === AttendanceStatus.Confirmed
                ? 'tinted'
                : 'elevated'
            }
          >
            <Text style={styles.actionDate}>{formatLongDate(selectedDay.date)}</Text>

            {!selectedDay.isScheduled ? (
              <Text style={styles.helperLight}>{t('attendance.noTripToday')}</Text>
            ) : selectedDay.attendance?.status === AttendanceStatus.Confirmed ? (
              <>
                <View style={styles.row}>
                  <Badge
                    label={t('attendance.confirmed')}
                    tone="success"
                    icon="checkmark-circle"
                  />
                  {lockedPrice ? (
                    <Text style={styles.priceText}>
                      {formatCurrency(lockedPrice)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.helperLight}>{t('attendance.cancelWarning')}</Text>
                <Button
                  title={t('attendance.cancelSeat')}
                  variant="outline"
                  loading={submitting}
                  onPress={handleCancel}
                />
              </>
            ) : (
              <>
                <Badge
                  label={t('attendance.confirmRequired')}
                  tone="warning"
                  icon="alert-circle"
                />
                <Text style={styles.helperLight}>{t('attendance.confirmHint')}</Text>
                <Button
                  title={t('attendance.confirmAttendance')}
                  loading={submitting}
                  onPress={handleConfirm}
                  leftIcon={
                    <Ionicons name="checkmark-circle" size={18} color={Colors.onPrimary} />
                  }
                />
                <Button
                  title={t('attendance.cancelSeat')}
                  variant="ghost"
                  onPress={handleCancel}
                />
              </>
            )}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text },
  subtitle: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statBox: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  section: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  calendarRow: { paddingVertical: Spacing.xs, gap: Spacing.xs, paddingEnd: Spacing.sm },
  dayCard: {
    width: 64,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  dayCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  dayCardDisabled: { opacity: 0.45 },
  dayCardConfirmed: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondarySoft,
  },
  dayCardDeclined: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSoft,
  },
  dayLabel: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
  },
  dayLabelActive: { color: Colors.onPrimary },
  dayNum: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  tickWrap: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCard: { marginTop: Spacing.lg, gap: Spacing.sm },
  actionRequired: {
    borderWidth: 1.5,
    borderColor: Colors.warning,
    backgroundColor: Colors.warningSoft,
  },
  actionDate: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  helperLight: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  priceText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.secondary,
  },
});
