import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  Banner,
  Button,
  Card,
  ErrorState,
  Header,
  Input,
  KeyValueRow,
  Screen,
  Skeleton,
  StatTile,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import {
  AttendanceStatus,
  DAYS_OF_WEEK,
  OfferStatus,
} from '@core/constants';
import { formatCurrency, formatTime } from '@core/utils/format';
import { useResponsiveLayout } from '@shared/hooks';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '@features/trips/data/tripsRepository';
import { Trip } from '@features/trips/domain/models/Trip';
import { CaptainMarketplaceStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<CaptainMarketplaceStackParamList, 'SubmitBid'>;
type Rt = RouteProp<CaptainMarketplaceStackParamList, 'SubmitBid'>;

type Status = 'loading' | 'success' | 'notFound' | 'error';

const PLATFORM_FEE_RATE = 0.05;

export const SubmitBidScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [costPerTrip, setCostPerTrip] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const fresh = await tripsRepository.getTrip(tripId);
      if (!fresh) {
        setStatus('notFound');
        return;
      }
      setTrip(fresh);
      const existing = (fresh.offers ?? []).find(
        (o) => o.captain_id === user?.id
      );
      if (existing && existing.status === OfferStatus.Pending) {
        setCostPerTrip(String(existing.price_per_ride ?? ''));
        setComment(existing.comment ?? '');
      }
      setStatus('success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t('errors.network'));
      setStatus('error');
    }
  }, [tripId, t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const tripCount = useMemo(
    () =>
      trip?.attendance.filter((a) => a.status === AttendanceStatus.Confirmed)
        .length || 0,
    [trip]
  );

  const ratePerTrip = parseFloat(costPerTrip) || 0;
  const total = ratePerTrip * Math.max(tripCount, 1);
  const platformFee = total * PLATFORM_FEE_RATE;
  const netTotal = total - platformFee;

  const passengerCount = (trip?.passengers ?? []).filter((p) => !p.is_admin)
    .length;
  const dayLabels = (trip?.schedule_days ?? [])
    .map((d) => DAYS_OF_WEEK.find((x) => x.value === d)?.key)
    .filter(Boolean) as string[];

  if (status === 'loading') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('captain.submitYourBid')} onBack={() => nav.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card variant="outlined" style={{ gap: Spacing.sm }}>
            <Skeleton height={20} width="65%" />
            <Skeleton height={12} width="40%" />
            <Skeleton height={12} width="80%" />
          </Card>
          <Card style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
            <Skeleton height={48} />
            <Skeleton height={80} />
          </Card>
          <Card style={{ marginTop: Spacing.md }} variant="tinted">
            <Skeleton height={14} width="50%" />
            <Skeleton height={12} width="80%" style={{ marginTop: 8 }} />
            <Skeleton height={12} width="60%" style={{ marginTop: 6 }} />
            <Skeleton height={20} width="40%" style={{ marginTop: 12 }} />
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  if (status === 'notFound' || status === 'error' || !trip || !user) {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('captain.submitYourBid')} onBack={() => nav.goBack()} />
        <View style={{ padding: Spacing.lg, flex: 1 }}>
          <ErrorState
            icon={status === 'notFound' ? 'help-buoy-outline' : 'alert-circle-outline'}
            title={
              status === 'notFound'
                ? t('errors.tripNotFound')
                : t('errors.loadFailed')
            }
            description={
              status === 'notFound'
                ? t('errors.tripNotFoundSubtitle')
                : errorMsg ?? t('errors.loadFailedSubtitle')
            }
            retryLabel={status === 'error' ? t('common.retry') : undefined}
            onRetry={status === 'error' ? () => load() : undefined}
          />
        </View>
      </Screen>
    );
  }

  const handleSubmit = async () => {
    setValidationError(null);
    setSubmitError(null);
    if (!ratePerTrip) {
      setValidationError(t('validation.invalidNumber'));
      return;
    }
    setSubmitting(true);
    try {
      await tripsRepository.submitOffer({
        trip_id: trip.id,
        captain_id: user.id,
        captain_name: user.name,
        captain_rating: user.rating,
        vehicle_label: user.captain?.car_model,
        vehicle_seats: user.captain?.seats,
        offer_price: total,
        price_per_ride: ratePerTrip,
        comment: comment || undefined,
      });
      nav.goBack();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('errors.network'));
    } finally {
      setSubmitting(false);
    }
  };

  const summaryCard = (
    <Card style={{ marginTop: Spacing.md }} variant="tinted">
      <Text style={styles.sectionTitle}>{t('captain.estimateSummary')}</Text>
      <KeyValueRow
        label={t('captain.ratePerTrip')}
        value={ratePerTrip ? formatCurrency(ratePerTrip) : '—'}
      />
      <KeyValueRow
        label={t('captain.tripCount')}
        value={`× ${Math.max(tripCount, 1)}`}
      />
      <KeyValueRow
        label={t('captain.platformFee')}
        value={ratePerTrip ? `- ${formatCurrency(platformFee)}` : '—'}
      />
      <View style={styles.divider} />
      <KeyValueRow
        label={t('captain.totalPeriodCost')}
        value={ratePerTrip ? formatCurrency(netTotal) : '—'}
        emphasis="positive"
      />
    </Card>
  );

  const tripCard = (
    <Card variant="outlined">
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tripName} numberOfLines={2}>
            {trip.name || `${trip.start_address} → ${trip.end_address}`}
          </Text>
          <Text style={styles.tripMeta}>
            {formatTime(trip.departure_time)}
            {trip.distance_km ? ` · ${trip.distance_km} km` : ''}
            {passengerCount ? ` · ${passengerCount} ${t('offers.trips')}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <Ionicons name="navigate" size={14} color={Colors.primary} />
        <Text style={styles.routeText} numberOfLines={2}>
          {trip.start_address} → {trip.end_address}
        </Text>
      </View>

      {dayLabels.length ? (
        <View style={styles.daysRow}>
          {dayLabels.map((d) => (
            <View key={d} style={styles.dayPill}>
              <Text style={styles.dayPillText}>{t(`days.${d}`)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <StatTile
          label={t('captain.tripCount')}
          value={Math.max(tripCount, 1)}
          icon="calendar-outline"
          tone="primary"
        />
        <StatTile
          label={t('captain.studentsReady', {
            ready: tripCount,
            total: passengerCount,
          })}
          value={passengerCount}
          icon="people-outline"
          tone="secondary"
        />
      </View>
    </Card>
  );

  const formCard = (
    <Card style={{ marginTop: Spacing.md, gap: 0 }}>
      <Input
        label={t('captain.costPerTrip')}
        placeholder={t('captain.costPerTripPlaceholder')}
        keyboardType="decimal-pad"
        leftIcon="cash-outline"
        value={costPerTrip}
        onChangeText={(v) => {
          setValidationError(null);
          setCostPerTrip(v);
        }}
        error={validationError ?? undefined}
        helper={t('captain.suggestedRange', {
          min: 80,
          max: 150,
          currency: t('common.currency'),
        })}
      />

      <Input
        label={t('captain.additionalNotes')}
        placeholder={t('captain.notesPlaceholder')}
        leftIcon="chatbubble-ellipses-outline"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      {user.captain ? (
        <View style={styles.vehicleRow}>
          <Ionicons name="car-outline" size={14} color={Colors.textLight} />
          <Text style={styles.vehicleText}>
            {t('captain.vehicle')}: {user.captain.car_model}
            {user.captain.car_number ? ` · ${user.captain.car_number}` : ''}
          </Text>
        </View>
      ) : null}
    </Card>
  );

  return (
    <Screen background={Colors.surface}>
      <Header title={t('captain.submitYourBid')} onBack={() => nav.goBack()} />
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
          {submitError ? (
            <Banner
              tone="error"
              title={t('errors.loadFailed')}
              description={submitError}
              onDismiss={() => setSubmitError(null)}
              style={{ marginBottom: Spacing.md }}
            />
          ) : null}

          {layout.isWide ? (
            <View style={styles.wideRow}>
              <View style={styles.wideCol}>{tripCard}</View>
              <View style={styles.wideCol}>
                {formCard}
                {summaryCard}
              </View>
            </View>
          ) : (
            <>
              {tripCard}
              {formCard}
              {summaryCard}
            </>
          )}

          <Pressable
            style={[
              styles.primaryAction,
              (!ratePerTrip || submitting) && styles.primaryActionDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!ratePerTrip || submitting}
          >
            <Ionicons
              name="paper-plane-outline"
              size={18}
              color={Colors.onPrimary}
            />
            <Text style={styles.primaryActionText}>
              {submitting ? t('common.loading') : t('captain.submitBidCta')}
            </Text>
          </Pressable>

          <Button
            title={t('captain.cancelReturn')}
            variant="ghost"
            onPress={() => nav.goBack()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  wideRow: { flexDirection: 'row', gap: Spacing.md },
  wideCol: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tripName: { fontSize: 17, fontFamily: FontFamily.bold, color: Colors.text },
  tripMeta: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  routeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.sm,
  },
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxs,
  },
  vehicleText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  primaryActionDisabled: { backgroundColor: Colors.surface2 },
  primaryActionText: {
    color: Colors.onPrimary,
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
});
