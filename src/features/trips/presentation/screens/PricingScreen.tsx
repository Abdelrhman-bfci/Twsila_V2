import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
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
  Button,
  Card,
  Header,
  Screen,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { formatCurrency } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'Pricing'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'Pricing'>;

export const PricingScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const t = await tripsRepository.getTrip(tripId);
    if (!t) return;
    setTrip(t);
    const initial: Record<string, string> = {};
    t.passengers
      .filter((p) => !p.is_admin)
      .forEach((p) => {
        const existing = t.pricing.find((x) => x.user_id === p.user_id);
        initial[p.user_id] = existing?.price ? String(existing.price) : '';
      });
    setPrices(initial);
  }, [tripId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalRevenue = useMemo(
    () =>
      Object.values(prices).reduce((sum, v) => sum + (parseFloat(v) || 0), 0),
    [prices]
  );

  const handleSave = async () => {
    if (!user || !trip) return;
    setSubmitting(true);
    try {
      for (const [uid, raw] of Object.entries(prices)) {
        const value = parseFloat(raw);
        if (!isNaN(value) && value > 0) {
          await tripsRepository.setPassengerPrice(trip.id, uid, value, user.id);
        }
      }
      await load();
      Alert.alert(t('common.success'), t('pricing.saveAll'));
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : '');
    } finally {
      setSubmitting(false);
    }
  };

  if (!trip) {
    return (
      <Screen>
        <Header title={t('common.loading')} onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const passengers = trip.passengers.filter((p) => !p.is_admin);

  return (
    <Screen background={Colors.surface}>
      <Header title={t('pricing.title')} onBack={() => nav.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.subtitle}>{t('pricing.subtitle')}</Text>

          <Card style={styles.summaryCard} variant="tinted">
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('pricing.perRoundTrip')}</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalRevenue)}
              </Text>
            </View>
            <Text style={styles.summaryHint}>
              {passengers.length} × {t('common.passenger' as never) || 'passengers'}
            </Text>
          </Card>

          {passengers.map((p) => {
            const v = prices[p.user_id] || '';
            return (
              <Card key={p.id} style={styles.passengerCard}>
                <View style={styles.row}>
                  <Avatar name={p.user_name} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pName}>{p.user_name}</Text>
                    <Text style={styles.pMeta}>
                      <Ionicons name="location-outline" size={12} />{' '}
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
                  <Text style={styles.amountLabel}>{t('pricing.amount')}</Text>
                  <View style={styles.amountInputBox}>
                    <TextInput
                      value={v}
                      onChangeText={(text) =>
                        setPrices((prev) => ({ ...prev, [p.user_id]: text }))
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

          {!passengers.length && (
            <Text style={styles.empty}>{t('trips.noPassengers')}</Text>
          )}

          <Button
            title={t('pricing.saveAll')}
            onPress={handleSave}
            loading={submitting}
            style={{ marginTop: Spacing.lg }}
            leftIcon={
              <Ionicons name="cloud-upload-outline" size={18} color={Colors.onPrimary} />
            }
          />
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
  },
  summaryCard: { marginBottom: Spacing.md },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  summaryHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  passengerCard: { marginBottom: Spacing.sm, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pName: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.text },
  pMeta: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
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
  empty: {
    textAlign: 'center',
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    paddingVertical: Spacing.lg,
  },
});
