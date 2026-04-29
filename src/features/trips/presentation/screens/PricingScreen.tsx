import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
import { formatCurrency, formatCityName } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'Pricing'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'Pricing'>;

type Status = 'loading' | 'success' | 'empty' | 'error' | 'notFound';

export const PricingScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
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

      const pax = (data.passengers ?? []).filter((p) => !p.is_admin);
      const initial: Record<string, string> = {};
      pax.forEach((p) => {
        const existing = (data.pricing ?? []).find((x) => x.user_id === p.user_id);
        initial[p.user_id] = existing?.price ? String(existing.price) : '';
      });
      setPrices(initial);
      setStatus(pax.length === 0 ? 'empty' : 'success');
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

  const passengers = useMemo(
    () => (trip?.passengers ?? []).filter((p) => !p.is_admin),
    [trip]
  );

  const totalRevenue = useMemo(
    () =>
      Object.values(prices).reduce((sum, v) => sum + (parseFloat(v) || 0), 0),
    [prices]
  );

  const filledPrices = useMemo(
    () => Object.values(prices).filter((v) => parseFloat(v) > 0).length,
    [prices]
  );

  const handleSave = async () => {
    if (!user || !trip) return;
    setSubmitting(true);
    setActionMsg(null);
    try {
      for (const [uid, raw] of Object.entries(prices)) {
        const value = parseFloat(raw);
        if (!isNaN(value) && value > 0) {
          await tripsRepository.setPassengerPrice(trip.id, uid, value, user.id);
        }
      }
      await load();
      setActionMsg({ tone: 'success', text: t('pricing.savedSuccess') });
    } catch (err) {
      setActionMsg({
        tone: 'error',
        text: err instanceof Error ? err.message : t('errors.actionFailed'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('pricing.title')} onBack={() => nav.goBack()} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card>
            <Skeleton width="60%" height={14} />
            <View style={{ height: 8 }} />
            <Skeleton width="40%" height={24} />
          </Card>
          <View style={{ height: Spacing.md }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} style={{ marginBottom: Spacing.sm }}>
              <View style={styles.skelRow}>
                <Skeleton width={42} height={42} radius={BorderRadius.pill} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="50%" height={14} />
                  <Skeleton width="80%" height={10} />
                </View>
              </View>
              <View style={{ height: Spacing.sm }} />
              <Skeleton height={42} radius={BorderRadius.md} />
            </Card>
          ))}
        </ScrollView>
      </Screen>
    );
  }

  if (status === 'notFound') {
    return (
      <Screen background={Colors.surface}>
        <Header title={t('pricing.title')} onBack={() => nav.goBack()} />
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
        <Header title={t('pricing.title')} onBack={() => nav.goBack()} />
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
        title={t('pricing.title')}
        subtitle={`${formatCityName(trip.start_address)} → ${formatCityName(
          trip.end_address
        )}`}
        onBack={() => nav.goBack()}
      />
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
        >
          <Text style={styles.subtitle}>{t('pricing.subtitle')}</Text>

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

          <View style={styles.statsRow}>
            <StatTile
              label={t('pricing.perRoundTrip')}
              value={formatCurrency(totalRevenue)}
              caption={t('pricing.passengerCount', { count: passengers.length })}
              icon="cash-outline"
              tone="primary"
            />
            <StatTile
              label={t('pricing.passengerCount', { count: passengers.length })}
              value={`${filledPrices}/${passengers.length}`}
              icon="people-outline"
              tone={filledPrices === passengers.length ? 'success' : 'warning'}
            />
          </View>

          {status === 'empty' ? (
            <Card style={{ marginTop: Spacing.md }}>
              <EmptyState
                icon="people-outline"
                title={t('pricing.noPassengersTitle')}
                subtitle={t('pricing.noPassengersSubtitle')}
              />
            </Card>
          ) : (
            <>
              <SectionHeader
                title={t('trips.passengers')}
                caption={`${passengers.length} ${t('common.passengers').toLowerCase()}`}
                leadingIcon="cash-outline"
                style={{ marginTop: Spacing.lg }}
              />

              <View style={layout.isWide ? styles.gridWide : undefined}>
                {passengers.map((p) => {
                  const v = prices[p.user_id] || '';
                  const has = parseFloat(v) > 0;
                  return (
                    <Card
                      key={p.id}
                      style={[
                        styles.passengerCard,
                        layout.isWide && { width: '49%' },
                      ]}
                      variant="outlined"
                    >
                      <View style={styles.row}>
                        <Avatar name={p.user_name} size={42} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pName}>{p.user_name}</Text>
                          <Text style={styles.pMeta} numberOfLines={2}>
                            <Ionicons name="location-outline" size={11} />{' '}
                            {p.pickup_address || '—'}
                          </Text>
                          {p.distance_km ? (
                            <Badge
                              label={t('pricing.distanceAway', { km: p.distance_km })}
                              tone="primary"
                              size="sm"
                              style={{ marginTop: 4 }}
                            />
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>
                          {t('pricing.amount')}
                        </Text>
                        <View
                          style={[
                            styles.amountInputBox,
                            has && {
                              borderColor: Colors.secondary,
                              backgroundColor: Colors.secondarySoft,
                            },
                          ]}
                        >
                          <TextInput
                            value={v}
                            onChangeText={(text) =>
                              setPrices((prev) => ({
                                ...prev,
                                [p.user_id]: text,
                              }))
                            }
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={Colors.textLight}
                            style={styles.amountInput}
                          />
                          <Text style={styles.amountCurrency}>
                            {t('common.currency')}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>

              <Button
                title={t('pricing.saveAll')}
                onPress={handleSave}
                loading={submitting}
                style={{ marginTop: Spacing.lg }}
                leftIcon={
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={Colors.onPrimary}
                  />
                }
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  passengerCard: { marginBottom: Spacing.sm, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  pName: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.text },
  pMeta: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: Colors.surface1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  amountLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Colors.text,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    minWidth: 120,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  amountInput: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    minWidth: 60,
    paddingVertical: 6,
    textAlign: 'right',
  },
  amountCurrency: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    marginStart: 4,
  },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
