import React, { useMemo, useState, Dispatch, SetStateAction } from 'react';
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
import { PlacesAutocompleteField } from '@shared/components/PlacesAutocompleteField';
import { TripRouteMapView, RouteMapPoint } from '@shared/components/TripRouteMapView';
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
import {
  geocodeAddress,
  hasGoogleMapsConfig,
  ResolvedPlace,
} from '@core/services/googleMapsApi';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'CreateTrip'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'CreateTrip'>;

type RoutePoint = {
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string;
};

const emptyPoint = (): RoutePoint => ({ address: '' });

export const CreateTripScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();

  const [start, setStart] = useState<RoutePoint>({
    address: route.params?.startQuery || '',
  });
  const [end, setEnd] = useState<RoutePoint>({
    address: route.params?.endQuery || '',
  });
  const [stops, setStops] = useState<RoutePoint[]>([emptyPoint()]);
  const [departureTime, setDepartureTime] = useState(DEFAULT_DEPARTURE_TIME);
  const [totalSeats, setTotalSeats] = useState(String(DEFAULT_TRIP_SEATS));
  const [selectedDates, setSelectedDates] = useState<string[]>(() =>
    defaultMonthSelection()
  );
  const [submitting, setSubmitting] = useState(false);

  const setStop = (idx: number, p: RoutePoint) =>
    setStops((prev) => prev.map((s, i) => (i === idx ? p : s)));

  const setStopAddress = (idx: number, address: string) =>
    setStops((prev) => prev.map((s, i) => (i === idx ? { ...s, address } : s)));

  const addStop = () => setStops((prev) => [...prev, emptyPoint()]);
  const removeStop = (idx: number) =>
    setStops((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const { activeFrom, activeTo, scheduleDays } = useMemo(
    () => derivePeriodFromDates(selectedDates),
    [selectedDates]
  );

  const mapPoints: RouteMapPoint[] = useMemo(() => {
    const out: RouteMapPoint[] = [];
    if (start.address.trim()) {
      out.push({
        type: 'start',
        label: shortLabel(start.address),
        lat: start.lat,
        lng: start.lng,
      });
    }
    stops.forEach((s) => {
      if (!s.address.trim()) return;
      out.push({
        type: 'middle',
        label: shortLabel(s.address),
        lat: s.lat,
        lng: s.lng,
      });
    });
    if (end.address.trim()) {
      out.push({
        type: 'end',
        label: shortLabel(end.address),
        lat: end.lat,
        lng: end.lng,
      });
    }
    return out;
  }, [start, end, stops]);

  const applyResolved =
    (setter: Dispatch<SetStateAction<RoutePoint>>) => (place: ResolvedPlace) => {
      setter({
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        placeId: place.placeId,
      });
    };

  const ensurePointCoords = async (p: RoutePoint, label: string): Promise<RoutePoint> => {
    if (p.lat != null && p.lng != null) return p;
    if (!hasGoogleMapsConfig()) {
      return p;
    }
    const g = await geocodeAddress(p.address);
    if (!g) {
      throw new Error(`${label}: ${t('maps.couldNotGeocode')}`);
    }
    return { ...p, lat: g.lat, lng: g.lng };
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!start.address.trim() || !end.address.trim()) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    if (!selectedDates.length) {
      Alert.alert(t('common.error'), t('trips.scheduleSubtitle'));
      return;
    }
    setSubmitting(true);
    try {
      const startP = await ensurePointCoords(start, t('trips.startPoint'));
      const endP = await ensurePointCoords(end, t('trips.endPoint'));
      const nonEmptyStops = stops.filter((s) => s.address.trim());
      const stopResolved: RoutePoint[] = [];
      for (let i = 0; i < nonEmptyStops.length; i++) {
        const s = await ensurePointCoords(
          nonEmptyStops[i],
          t('trips.intermediateStop', { n: i + 1 })
        );
        stopResolved.push(s);
      }

      const trip = await tripsRepository.createTrip({
        admin_id: user.id,
        name: `${startP.address.trim()} → ${endP.address.trim()}`,
        start_address: startP.address.trim(),
        start_lat: startP.lat,
        start_lng: startP.lng,
        end_address: endP.address.trim(),
        end_lat: endP.lat,
        end_lng: endP.lng,
        stops: stopResolved.map((s) => ({
          address: s.address.trim(),
          lat: s.lat,
          lng: s.lng,
        })),
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
      <Header
        variant="branded"
        title={t('trips.createTrip')}
        onBack={() => nav.goBack()}
      />
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
                <View style={{ flex: 1, zIndex: 30 }}>
                  <PlacesAutocompleteField
                    label={t('trips.startPoint')}
                    placeholder={t('trips.startPointPlaceholder')}
                    value={start.address}
                    onChangeAddress={(addr) => setStart((s) => ({ ...s, address: addr, lat: undefined, lng: undefined }))}
                    onPlaceResolved={applyResolved(setStart)}
                    onClearCoords={() => setStart((s) => ({ ...s, lat: undefined, lng: undefined }))}
                    leftIcon="flag"
                  />
                </View>
              </View>

              {stops.map((s, i) => (
                <View key={i} style={styles.routeRow}>
                  <View style={[styles.routeMarker, styles.routeMarkerMiddle]} />
                  <View style={{ flex: 1, zIndex: 25 - i }}>
                    <PlacesAutocompleteField
                      label={t('trips.intermediateStop', { n: i + 1 })}
                      placeholder={t('trips.stopPlaceholder')}
                      value={s.address}
                      onChangeAddress={(addr) => setStopAddress(i, addr)}
                      onPlaceResolved={(place) => setStop(i, {
                        address: place.address,
                        lat: place.lat,
                        lng: place.lng,
                        placeId: place.placeId,
                      })}
                      onClearCoords={() =>
                        setStop(i, { ...s, address: s.address, lat: undefined, lng: undefined })
                      }
                      leftIcon="pin"
                    />
                    {stops.length > 1 ? (
                      <Pressable
                        style={styles.removeStopBtn}
                        onPress={() => removeStop(i)}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.textLight} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))}

              <View style={styles.routeRow}>
                <View style={[styles.routeMarker, styles.routeMarkerEnd]} />
                <View style={{ flex: 1, zIndex: 20 }}>
                  <PlacesAutocompleteField
                    label={t('trips.endPoint')}
                    placeholder={t('trips.endPointPlaceholder')}
                    value={end.address}
                    onChangeAddress={(addr) => setEnd((e) => ({ ...e, address: addr, lat: undefined, lng: undefined }))}
                    onPlaceResolved={applyResolved(setEnd)}
                    onClearCoords={() => setEnd((e) => ({ ...e, lat: undefined, lng: undefined }))}
                    leftIcon="location"
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

          <Text style={styles.mapSectionTitle}>{t('maps.routePreview')}</Text>
          <TripRouteMapView points={mapPoints} height={200} />

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

const shortLabel = (address: string): string => {
  const t = address.trim();
  if (!t) return '—';
  const first = t.split(/[-•·,–—]/)[0]?.trim() || t;
  if (first.length <= 24) return first;
  return `${first.slice(0, 22).trim()}…`;
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
  mapSectionTitle: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
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
  removeStopBtn: {
    position: 'absolute',
    right: 0,
    top: 4,
    padding: 4,
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
