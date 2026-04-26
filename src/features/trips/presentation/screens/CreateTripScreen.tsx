import React, { useState } from 'react';
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
  Card,
  DayChip,
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
  DAYS_OF_WEEK,
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
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [activeFrom, setActiveFrom] = useState(toIso(new Date()));
  const [activeTo, setActiveTo] = useState(
    toIso(addMonths(new Date(), 1))
  );
  const [submitting, setSubmitting] = useState(false);

  const toggleDay = (d: number) =>
    setScheduleDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );

  const setStop = (idx: number, value: string) =>
    setStops((prev) => prev.map((s, i) => (i === idx ? value : s)));

  const addStop = () => setStops((prev) => [...prev, '']);
  const removeStop = (idx: number) =>
    setStops((prev) => prev.filter((_, i) => i !== idx));

  const handleCreate = async () => {
    if (!user) return;
    if (!startAddress.trim() || !endAddress.trim()) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    if (!scheduleDays.length) {
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

          <SectionHeader title={t('trips.routeConfig')} />
          <Card>
            <Input
              label={t('trips.startPoint')}
              placeholder={t('trips.startPointPlaceholder')}
              leftIcon="location-outline"
              value={startAddress}
              onChangeText={setStartAddress}
            />
            {stops.map((s, i) => (
              <View key={i} style={styles.stopRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('trips.intermediateStop', { n: i + 1 })}
                    placeholder={t('trips.stopPlaceholder')}
                    leftIcon="ellipse-outline"
                    value={s}
                    onChangeText={(v) => setStop(i, v)}
                  />
                </View>
                <Pressable
                  style={styles.stopRemove}
                  onPress={() => removeStop(i)}
                  hitSlop={6}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addStop} onPress={addStop}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addStopText}>{t('trips.addStop')}</Text>
            </Pressable>

            <Input
              label={t('trips.endPoint')}
              placeholder={t('trips.endPointPlaceholder')}
              leftIcon="flag-outline"
              value={endAddress}
              onChangeText={setEndAddress}
            />
          </Card>

          <SectionHeader
            title={t('trips.scheduleDays')}
            caption={t('trips.scheduleSubtitle')}
            style={{ marginTop: Spacing.md }}
          />
          <Card>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => (
                <DayChip
                  key={d.value}
                  label={t(`days.${d.key}`)}
                  selected={scheduleDays.includes(d.value)}
                  onPress={() => toggleDay(d.value)}
                />
              ))}
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('trips.activeFrom')}
                  leftIcon="calendar-outline"
                  value={activeFrom}
                  onChangeText={setActiveFrom}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('trips.activeTo')}
                  leftIcon="calendar-outline"
                  value={activeTo}
                  onChangeText={setActiveTo}
                  placeholder="YYYY-MM-DD"
                />
              </View>
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
          </Card>

          <Button
            title={t('trips.createTripCta')}
            onPress={handleCreate}
            loading={submitting}
            style={{ marginTop: Spacing.lg }}
            leftIcon={
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.onPrimary} />
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const toIso = (d: Date) => d.toISOString().split('T')[0];
const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
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
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs },
  stopRemove: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  addStop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  addStopText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.primary,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
});
