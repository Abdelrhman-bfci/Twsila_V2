import React, { useMemo, useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Banner,
  Button,
  Calendar,
  Card,
  Header,
  Input,
  KeyValueRow,
  RouteTimeline,
  Screen,
  SectionHeader,
  StatTile,
  Stepper,
} from '@shared/components';
import { PlacesAutocompleteField } from '@shared/components/PlacesAutocompleteField';
import {
  TripRouteMapView,
  RouteMapPoint,
} from '@shared/components/TripRouteMapView';
import { Spacing, Colors, BorderRadius, FontFamily } from '@core/theme';
import { isRTL } from '@core/i18n';
import {
  DEFAULT_DEPARTURE_TIME,
  DEFAULT_TRIP_SEATS,
  DAYS_OF_WEEK,
} from '@core/constants';
import {
  geocodeAddress,
  hasGoogleMapsConfig,
  ResolvedPlace,
} from '@core/services/googleMapsApi';
import { useResponsiveLayout } from '@shared/hooks';
import { formatTime, formatCityName } from '@core/utils/format';

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

type StepKey = 'route' | 'schedule' | 'review';

export const CreateTripScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();

  const [stepIndex, setStepIndex] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(!!route.params?.tripId);

  const [start, setStart] = useState<RoutePoint>({
    address: route.params?.startQuery || '',
  });
  const [end, setEnd] = useState<RoutePoint>({
    address: route.params?.endQuery || '',
  });
  const [stops, setStops] = useState<RoutePoint[]>([]);
  const [departureTime, setDepartureTime] = useState(DEFAULT_DEPARTURE_TIME);
  const [totalSeats, setTotalSeats] = useState(String(DEFAULT_TRIP_SEATS));
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>(() =>
    defaultMonthSelection()
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const tripId = route.params?.tripId;
    if (tripId) {
      const loadTrip = async () => {
        try {
          const trip = await tripsRepository.getTrip(tripId);
          if (trip) {
            setStart({ address: trip.start_address, lat: trip.start_lat, lng: trip.start_lng });
            setEnd({ address: trip.end_address, lat: trip.end_lat, lng: trip.end_lng });
            setStops(trip.stops.map(s => ({ address: s.address, lat: s.lat, lng: s.lng })));
            setDepartureTime(trip.departure_time);
            setTotalSeats(String(trip.total_seats));
            setIsRoundTrip(trip.is_round_trip);
            
            // Generate dates between activeFrom and activeTo that match scheduleDays
            const dates: string[] = [];
            const cursor = new Date(trip.active_from);
            const endLimit = trip.active_to ? new Date(trip.active_to) : new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0);
            const daysSet = new Set(trip.schedule_days);
            
            while (cursor <= endLimit) {
              if (daysSet.has(cursor.getDay())) {
                dates.push(toIso(cursor));
              }
              cursor.setDate(cursor.getDate() + 1);
            }
            setSelectedDates(dates);
          }
        } catch (e) {
          setErrorMsg(t('errors.loadFailed'));
        } finally {
          setLoadingInitial(false);
        }
      };
      loadTrip();
    }
  }, [route.params?.tripId, t]);

  const setStop = (idx: number, p: RoutePoint) =>
    setStops((prev) => prev.map((s, i) => (i === idx ? p : s)));
  const setStopAddress = (idx: number, address: string) =>
    setStops((prev) => prev.map((s, i) => (i === idx ? { ...s, address } : s)));
  const addStop = () => setStops((prev) => [...prev, emptyPoint()]);
  const removeStop = (idx: number) =>
    setStops((prev) => prev.filter((_, i) => i !== idx));

  const { activeFrom, activeTo, scheduleDays } = useMemo(
    () => derivePeriodFromDates(selectedDates),
    [selectedDates]
  );

  const mapPoints: RouteMapPoint[] = useMemo(() => {
    const out: RouteMapPoint[] = [];
    if (start.address.trim()) {
      out.push({
        type: 'start',
        label: formatCityName(start.address, 28),
        lat: start.lat,
        lng: start.lng,
      });
    }
    stops.forEach((s) => {
      if (!s.address.trim()) return;
      out.push({
        type: 'middle',
        label: formatCityName(s.address, 28),
        lat: s.lat,
        lng: s.lng,
      });
    });
    if (end.address.trim()) {
      out.push({
        type: 'end',
        label: formatCityName(end.address, 28),
        lat: end.lat,
        lng: end.lng,
      });
    }
    return out;
  }, [start, end, stops]);

  const applyResolved =
    (setter: Dispatch<SetStateAction<RoutePoint>>) =>
    (place: ResolvedPlace) => {
      setter({
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        placeId: place.placeId,
      });
    };

  const ensurePointCoords = async (
    p: RoutePoint,
    label: string
  ): Promise<RoutePoint> => {
    if (p.lat != null && p.lng != null) return p;
    if (!hasGoogleMapsConfig()) return p;
    const g = await geocodeAddress(p.address);
    if (!g) {
      throw new Error(`${label}: ${t('maps.couldNotGeocode')}`);
    }
    return { ...p, lat: g.lat, lng: g.lng };
  };

  const steps: { key: StepKey; title: string }[] = [
    { key: 'route', title: t('trips.createSteps.route') },
    { key: 'schedule', title: t('trips.createSteps.schedule') },
    { key: 'review', title: t('trips.createSteps.review') },
  ];

  const validateRoute = (): string | null => {
    if (!start.address.trim() || !end.address.trim())
      return t('validation.addStartEnd');
    return null;
  };
  const validateSchedule = (): string | null => {
    if (!selectedDates.length) return t('validation.addAtLeastOneDay');
    return null;
  };

  const goNext = () => {
    setErrorMsg(null);
    if (stepIndex === 0) {
      const err = validateRoute();
      if (err) {
        setErrorMsg(err);
        return;
      }
    }
    if (stepIndex === 1) {
      const err = validateSchedule();
      if (err) {
        setErrorMsg(err);
        return;
      }
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goBack = () => {
    setErrorMsg(null);
    if (stepIndex === 0) {
      nav.goBack();
    } else {
      setStepIndex((i) => Math.max(0, i - 1));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    const err = validateRoute() || validateSchedule();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
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

      const tripData = {
        name: `${formatCityName(startP.address)} → ${formatCityName(endP.address)}`,
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
        is_round_trip: isRoundTrip,
      };

      let trip;
      if (route.params?.tripId) {
        trip = await tripsRepository.updateTrip(route.params.tripId, tripData);
      } else {
        trip = await tripsRepository.createTrip({
          ...tripData,
          admin_id: user.id,
        });
      }
      
      nav.replace('TripDetails', { tripId: trip.id });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t('errors.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const dayLabel = (dow: number) =>
    t(`days.${DAYS_OF_WEEK.find((x) => x.value === dow)?.key || 'sun'}`);

  const placeTitleLine =
    start.address.trim() && end.address.trim()
      ? `${formatCityName(start.address)} → ${formatCityName(end.address)}`
      : null;

  const headerSubtitle = [placeTitleLine, `${stepIndex + 1} / ${steps.length}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen background={Colors.surface}>
      <Header
        title={route.params?.tripId ? t('trips.editTrip') : steps[stepIndex].title}
        subtitle={headerSubtitle}
        onBack={goBack}
      />
      {loadingInitial ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: FontFamily.medium, color: Colors.textSecondary }}>{t('common.loading')}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
          contentContainerStyle={[
            styles.scroll,
            layout.isWide && {
              maxWidth: layout.contentMaxWidth,
              alignSelf: 'center',
              width: '100%',
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepperWrap}>
            <Stepper steps={steps} currentIndex={stepIndex} />
          </View>

          <Banner
            tone="info"
            title={t('trips.youAreAdmin')}
            description={t('trips.scheduleSubtitle')}
            compact
          />

          {errorMsg ? (
            <Banner
              tone="error"
              title={t('common.error')}
              description={errorMsg}
              style={{ marginTop: Spacing.sm }}
              onDismiss={() => setErrorMsg(null)}
            />
          ) : null}

          {steps[stepIndex].key === 'route' ? (
            <View style={styles.section}>
              <SectionHeader
                title={t('trips.routeConfig')}
                leadingIcon="navigate-outline"
                style={{ marginTop: Spacing.md }}
              />
              <Card>
                <View style={styles.routeBuilder}>
                  <View style={styles.routeLine} />

                  <View style={styles.routeRow}>
                    <View
                      style={[styles.routeMarker, styles.routeMarkerStart]}
                    />
                    <View style={{ flex: 1, zIndex: 30 }}>
                      <PlacesAutocompleteField
                        label={t('trips.startPoint')}
                        placeholder={t('trips.startPointPlaceholder')}
                        value={start.address}
                        onChangeAddress={(addr) =>
                          setStart((s) => ({
                            ...s,
                            address: addr,
                            lat: undefined,
                            lng: undefined,
                          }))
                        }
                        onPlaceResolved={applyResolved(setStart)}
                        onClearCoords={() =>
                          setStart((s) => ({
                            ...s,
                            lat: undefined,
                            lng: undefined,
                          }))
                        }
                        leftIcon="flag"
                      />
                    </View>
                  </View>

                  {stops.map((s, i) => (
                    <View key={i} style={styles.routeRow}>
                      <View
                        style={[styles.routeMarker, styles.routeMarkerMiddle]}
                      />
                      <View style={{ flex: 1, zIndex: 25 - i }}>
                        <PlacesAutocompleteField
                          label={t('trips.intermediateStop', { n: i + 1 })}
                          placeholder={t('trips.stopPlaceholder')}
                          value={s.address}
                          onChangeAddress={(addr) => setStopAddress(i, addr)}
                          onPlaceResolved={(place) =>
                            setStop(i, {
                              address: place.address,
                              lat: place.lat,
                              lng: place.lng,
                              placeId: place.placeId,
                            })
                          }
                          onClearCoords={() =>
                            setStop(i, {
                              ...s,
                              address: s.address,
                              lat: undefined,
                              lng: undefined,
                            })
                          }
                          leftIcon="pin"
                        />
                      </View>
                      <Pressable
                        style={styles.removeStopBtn}
                        onPress={() => removeStop(i)}
                        hitSlop={15}
                      >
                        <Ionicons
                          name="close-circle"
                          size={22}
                          color={Colors.error}
                        />
                      </Pressable>
                    </View>
                  ))}

                  <View style={styles.routeRow}>
                    <View
                      style={[styles.routeMarker, styles.routeMarkerEnd]}
                    />
                    <View style={{ flex: 1, zIndex: 20 }}>
                      <PlacesAutocompleteField
                        label={t('trips.endPoint')}
                        placeholder={t('trips.endPointPlaceholder')}
                        value={end.address}
                        onChangeAddress={(addr) =>
                          setEnd((e) => ({
                            ...e,
                            address: addr,
                            lat: undefined,
                            lng: undefined,
                          }))
                        }
                        onPlaceResolved={applyResolved(setEnd)}
                        onClearCoords={() =>
                          setEnd((e) => ({
                            ...e,
                            lat: undefined,
                            lng: undefined,
                          }))
                        }
                        leftIcon="location"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.roundTripToggle}>
                  <Pressable
                    style={[
                      styles.toggleOption,
                      !isRoundTrip && styles.toggleOptionActive,
                    ]}
                    onPress={() => setIsRoundTrip(false)}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        !isRoundTrip && styles.toggleOptionTextActive,
                      ]}
                    >
                      {t('trips.oneWay')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleOption,
                      isRoundTrip && styles.toggleOptionActive,
                    ]}
                    onPress={() => setIsRoundTrip(true)}
                  >
                    <Ionicons
                      name="repeat-outline"
                      size={14}
                      color={isRoundTrip ? Colors.onPrimary : Colors.textLight}
                    />
                    <Text
                      style={[
                        styles.toggleOptionText,
                        isRoundTrip && styles.toggleOptionTextActive,
                      ]}
                    >
                      {t('trips.roundTrip')}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                style={[
                  styles.addStop,
                  { flexDirection: isRTL() === I18nManager.isRTL ? 'row' : 'row-reverse' },
                ]}
                onPress={addStop}
              >
                  <Ionicons
                    name="add-circle"
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.addStopText}>{t('trips.addStop')}</Text>
                </Pressable>
              </Card>

              <Text style={styles.mapSectionTitle}>
                {t('maps.routePreview')}
              </Text>
              <View style={styles.mapWrap}>
                <TripRouteMapView points={mapPoints} height={200} />
              </View>
            </View>
          ) : null}

          {steps[stepIndex].key === 'schedule' ? (
            <View style={styles.section}>
              <SectionHeader
                title={t('trips.tripPeriod')}
                caption={t('trips.scheduleSubtitle')}
                leadingIcon="calendar"
                style={{ marginTop: Spacing.md }}
              />
              <Card padded={false}>
                <View style={{ padding: Spacing.sm }}>
                  <Calendar
                    selectedDates={selectedDates}
                    onChange={setSelectedDates}
                    minDate={new Date()}
                  />
                </View>
                <View style={styles.scheduleSummary}>
                  <View>
                    <Text style={styles.scheduleSummaryLabel}>
                      {t('trips.totalDays')}
                    </Text>
                    <Text style={styles.scheduleSummaryValue}>
                      {selectedDates.length}
                    </Text>
                  </View>
                  <View style={styles.daysOfWeekTrack}>
                    {scheduleDays.map((d) => (
                      <View key={d} style={styles.dowChip}>
                        <Text style={styles.dowChipText}>{dayLabel(d)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>

              <SectionHeader
                title={t('trips.departureTime')}
                leadingIcon="time-outline"
                style={{ marginTop: Spacing.lg }}
              />
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
            </View>
          ) : null}

          {steps[stepIndex].key === 'review' ? (
            <View style={styles.section}>
              <SectionHeader
                title={t('trips.review.title')}
                caption={t('trips.review.subtitle')}
                leadingIcon="checkmark-done-outline"
                style={{ marginTop: Spacing.md }}
              />

              <View style={styles.statsRow}>
                <StatTile
                  label={t('trips.departureTime')}
                  value={formatTime(departureTime)}
                  icon="time-outline"
                />
                <StatTile
                  label={t('common.seats')}
                  value={totalSeats}
                  caption={t('common.seats')}
                  icon="people-outline"
                />
                <StatTile
                  label={t('trips.review.totalDays')}
                  value={selectedDates.length}
                  icon="calendar-outline"
                  tone="neutral"
                />
                <StatTile
                  label={t('trips.isRoundTrip')}
                  value={isRoundTrip ? t('common.yes') : t('common.no')}
                  icon="repeat-outline"
                  tone={isRoundTrip ? 'success' : 'neutral'}
                />
              </View>

              <SectionHeader
                title={t('trips.tripTimeline')}
                leadingIcon="git-branch-outline"
                style={{ marginTop: Spacing.lg }}
              />
              <Card>
                <RouteTimeline
                  stops={[
                    {
                      label: t('trips.startPoint'),
                      address: formatCityName(start.address),
                      type: 'start' as const,
                      meta: formatTime(departureTime),
                    },
                    ...stops
                      .filter((s) => s.address.trim())
                      .map((s, i) => ({
                        label: t('trips.intermediateStop', { n: i + 1 }),
                        address: formatCityName(s.address),
                        type: 'middle' as const,
                      })),
                    {
                      label: t('trips.endPoint'),
                      address: formatCityName(end.address),
                      type: 'end' as const,
                    },
                  ]}
                />
              </Card>

              <Text style={styles.mapSectionTitle}>
                {t('maps.routePreview')}
              </Text>
              <View style={styles.mapWrap}>
                <TripRouteMapView points={mapPoints} height={180} />
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            {stepIndex > 0 ? (
              <Button
                title={t('common.previous')}
                variant="outline"
                size="sm"
                onPress={goBack}
                fullWidth={false}
                leftIcon={
                  <Ionicons
                    name={isRTL() ? 'chevron-forward' : 'chevron-back'}
                    size={18}
                    color={Colors.primary}
                  />
                }
              />
            ) : null}
            <View style={{ flex: 1 }} />
            {stepIndex < steps.length - 1 ? (
              <Button
                title={t('common.next')}
                onPress={goNext}
                fullWidth={false}
                rightIcon={
                  <Ionicons
                    name={isRTL() ? 'chevron-back' : 'chevron-forward'}
                    size={18}
                    color={Colors.onPrimary}
                  />
                }
              />
            ) : (
              <Button
                title={route.params?.tripId ? t('trips.updateTrip') : t('trips.createTripCta')}
                onPress={handleSubmit}
                loading={submitting}
                fullWidth={false}
                leftIcon={
                  <Ionicons
                    name={route.params?.tripId ? "save-outline" : "rocket-outline"}
                    size={16}
                    color={Colors.onPrimary}
                  />
                }
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
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
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  stepperWrap: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  section: {},
  mapSectionTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mapWrap: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: Spacing.sm,
  },
  routeBuilder: { position: 'relative', paddingTop: 4 },
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
  routeMarkerMiddle: { backgroundColor: Colors.primaryLight },
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
    padding: Spacing.xs,
    marginTop: 36,
    marginRight: -Spacing.xs,
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
  roundTripToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    padding: 4,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    alignSelf: 'center',
    width: '80%',
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleOptionText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
  },
  toggleOptionTextActive: {
    color: Colors.onPrimary,
  },
  addStopText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: Colors.primary,
  },
  scheduleSummary: {
    padding: Spacing.md,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  scheduleSummaryLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  scheduleSummaryValue: {
    fontSize: 24,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  daysOfWeekTrack: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dowChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primarySoft,
  },
  dowChipText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  actions: {
    flexDirection: isRTL() === I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
