import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Button,
  Calendar,
  Card,
  Header,
  Input,
  Screen,
  SectionHeader,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import {
  DEFAULT_DEPARTURE_TIME,
  DEFAULT_TRIP_SEATS,
} from '@core/constants';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'CreateTrip'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'CreateTrip'>;

export const CreateTripScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();

  const [startAddress, setStartAddress] = useState(route.params?.startQuery || '');
  const [endAddress, setEndAddress] = useState(route.params?.endQuery || '');
  const [stops, setStops] = useState<string[]>(['']);
  const [departureTime, setDepartureTime] = useState(DEFAULT_DEPARTURE_TIME);
  const [totalSeats, setTotalSeats] = useState(String(DEFAULT_TRIP_SEATS));
  const [selectedDates, setSelectedDates] = useState<string[]>(() =>
    defaultMonthSelection()
  );
  const [submitting, setSubmitting] = useState(false);

  const setStop = (idx: number, value: string) =>
    setStops((prev) => prev.map((s, i) => (i === idx ? value : s)));

  const addStop = () => setStops((prev) => [...prev, '']);
  const removeStop = (idx: number) =>
    setStops((prev) => prev.filter((_, i) => i !== idx));

  const { activeFrom, activeTo, scheduleDays } = useMemo(
    () => derivePeriodFromDates(selectedDates),
    [selectedDates]
  );

  const handleCreate = async () => {
    if (!user) return;
    if (!startAddress.trim() || !endAddress.trim()) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    if (!selectedDates.length) {
      Alert.alert(t('common.error'), t('trips.scheduleSubtitle'));
      return;
    }
    setSubmitting(true);
    try {
      const trip = await tripsRepository.createTrip({
        admin_id: user.id,
        name: `${startAddress.trim()} → ${endAddress.trim()}`,
        start_address: startAddress.trim(),
        end_address: endAddress.trim(),
        stops: stops
          .map((s) => s.trim())
          .filter(Boolean)
          .map((address) => ({ address })),
        schedule_days: scheduleDays,
        active_from: activeFrom,
        active_to: activeTo || undefined,
        departure_time: departureTime,
        total_seats: parseInt(totalSeats, 10) || DEFAULT_TRIP_SEATS,
      });
      nav.replace('TripDetails', { tripId: trip.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error');
      Alert.alert(t('common.error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen background={Colors.surface}>
      <Header title={t('trips.createTrip')} onBack={() => nav.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroBanner}>
            <Ionicons
              name="map"
              size={20}
              color={Colors.primary}
              style={{ marginEnd: Spacing.sm }}
            />
            <Text style={styles.heroText}>
              {t('trips.youAreAdmin')} · {t('trips.scheduleSubtitle')}
            </Text>
          </View>

          <SectionHeader
            title={t('trips.routeConfig')}
            leadingIcon="location-outline"
          />
          <Card>
            <View style={styles.routeBuilder}>
              <View style={styles.routeLine} />

              <View style={styles.routeRow}>
                <View style={[styles.routeMarker, styles.routeMarkerStart]} />
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('trips.startPoint')}
                    placeholder={t('trips.startPointPlaceholder')}
                    value={startAddress}
                    onChangeText={setStartAddress}
                  />
                </View>
              </View>

              {stops.map((s, i) => (
                <View key={i} style={styles.routeRow}>
                  <View style={[styles.routeMarker, styles.routeMarkerMiddle]} />
                  <View style={{ flex: 1 }}>
                    <Input
                      label={t('trips.intermediateStop', { n: i + 1 })}
                      placeholder={t('trips.stopPlaceholder')}
                      value={s}
                      onChangeText={(v) => setStop(i, v)}
                      rightIcon="trash-outline"
                      onRightIconPress={() => removeStop(i)}
                    />
                  </View>
                </View>
              ))}

              <View style={styles.routeRow}>
                <View style={[styles.routeMarker, styles.routeMarkerEnd]} />
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('trips.endPoint')}
                    placeholder={t('trips.endPointPlaceholder')}
                    value={endAddress}
                    onChangeText={setEndAddress}
                  />
                </View>
              </View>
            </View>

            <Pressable style={styles.addStop} onPress={addStop}>
              <Ionicons
                name="add-circle"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.addStopText}>{t('trips.addStop')}</Text>
            </Pressable>
          </Card>

          <SectionHeader
            title={t('trips.tripPeriod')}
            caption={t('trips.scheduleSubtitle')}
            leadingIcon="calendar"
            style={{ marginTop: Spacing.md }}
          />
          <Calendar
            selectedDates={selectedDates}
            onChange={setSelectedDates}
            minDate={new Date()}
          />
          <View style={styles.scheduleSummary}>
            <Text style={styles.scheduleSummaryLabel}>
              {t('trips.totalDays')}
            </Text>
            <Text style={styles.scheduleSummaryValue}>
              {selectedDates.length}
            </Text>
          </View>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input
                label={t('trips.departureTime')}
                leftIcon="time-outline"
                value={departureTime}
                onChangeText={setDepartureTime}
                placeholder="HH:MM"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={t('trips.maxCapacity')}
                leftIcon="people-outline"
                value={totalSeats}
                onChangeText={setTotalSeats}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Button
            title={t('trips.createTripCta')}
            onPress={handleCreate}
            loading={submitting}
            size="lg"
            style={{ marginTop: Spacing.md }}
            rightIcon={
              <Ionicons name="arrow-forward" size={18} color={Colors.onPrimary} />
            }
          />

          <Pressable style={styles.draftBtn}>
            <Text style={styles.draftBtnText}>{t('trips.saveAsDraft')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const toIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const defaultMonthSelection = (): string[] => {
  const today = new Date();
  const out: string[] = [];
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const cursor = new Date(Math.max(today.getTime(), startOfMonth.getTime()));
  while (cursor <= endOfMonth) {
    const dow = cursor.getDay();
    if (dow >= 0 && dow <= 4) out.push(toIso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};

const derivePeriodFromDates = (dates: string[]) => {
  if (!dates.length) {
    const today = new Date();
    const inAMonth = new Date(today);
    inAMonth.setMonth(inAMonth.getMonth() + 1);
    return {
      activeFrom: toIso(today),
      activeTo: toIso(inAMonth),
      scheduleDays: [0, 1, 2, 3, 4],
    };
  }
  const sorted = [...dates].sort();
  const days = new Set<number>();
  sorted.forEach((iso) => {
    const d = new Date(iso);
    days.add(d.getDay());
  });
  return {
    activeFrom: sorted[0],
    activeTo: sorted[sorted.length - 1],
    scheduleDays: Array.from(days).sort(),
  };
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  heroText: {
    flex: 1,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
  },
  routeBuilder: {
    position: 'relative',
    paddingTop: 4,
  },
  routeLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    bottom: 28,
    width: 2,
    backgroundColor: Colors.primaryFixedDim,
    opacity: 0.7,
    borderRadius: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  routeMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 30,
    marginLeft: 6,
    backgroundColor: Colors.primaryFixedDim,
  },
  routeMarkerStart: {
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.primaryFixed,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 5,
  },
  routeMarkerMiddle: {
    backgroundColor: Colors.primaryLight,
  },
  routeMarkerEnd: {
    backgroundColor: Colors.secondary,
    borderWidth: 4,
    borderColor: Colors.secondaryFixed,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 5,
  },
  addStop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginTop: 4,
    borderRadius: BorderRadius.md,
  },
  addStopText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.primary,
  },
  scheduleSummary: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  scheduleSummaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  scheduleSummaryValue: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  draftBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  draftBtnText: {
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
});
