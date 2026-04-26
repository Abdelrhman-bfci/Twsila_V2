import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  Button,
  Card,
  Header,
  Input,
  Screen,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { formatCurrency, formatTime } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '@features/trips/data/tripsRepository';
import { Trip } from '@features/trips/domain/models/Trip';
import { CaptainMarketplaceStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<CaptainMarketplaceStackParamList, 'SubmitBid'>;
type Rt = RouteProp<CaptainMarketplaceStackParamList, 'SubmitBid'>;

export const SubmitBidScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { user } = useAuth();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [costPerTrip, setCostPerTrip] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const t = await tripsRepository.getTrip(tripId);
    setTrip(t);
  }, [tripId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const tripCount = useMemo(
    () => trip?.attendance.filter((a) => a.status === 'confirmed').length || 0,
    [trip]
  );

  const ratePerTrip = parseFloat(costPerTrip) || 0;
  const total = ratePerTrip * Math.max(tripCount, 1);
  const platformFee = total * 0.05;
  const netTotal = total - platformFee;

  if (!trip || !user) {
    return (
      <Screen>
        <Header title={t('common.loading')} onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const handleSubmit = async () => {
    if (!ratePerTrip) {
      Alert.alert(t('common.error'), t('validation.invalidNumber'));
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
      Alert.alert(t('common.success'), t('captain.submitBid'));
      nav.goBack();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : '');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen background={Colors.surface}>
      <Header title={t('captain.submitYourBid')} onBack={() => nav.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card>
            <Text style={styles.tripName}>
              {trip.name || `${trip.start_address} → ${trip.end_address}`}
            </Text>
            <Text style={styles.tripMeta}>
              {formatTime(trip.departure_time)} ·{' '}
              {trip.distance_km ? `${trip.distance_km} km` : ''}
            </Text>
            <View style={styles.routeRow}>
              <Ionicons name="navigate" size={14} color={Colors.primary} />
              <Text style={styles.routeText}>
                {trip.start_address} → {trip.end_address}
              </Text>
            </View>
          </Card>

          <Card style={{ marginTop: Spacing.md }}>
            <Input
              label={t('captain.costPerTrip')}
              placeholder={t('captain.costPerTripPlaceholder')}
              keyboardType="decimal-pad"
              leftIcon="cash-outline"
              value={costPerTrip}
              onChangeText={setCostPerTrip}
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
          </Card>

          <Card style={{ marginTop: Spacing.md }} variant="tinted">
            <Text style={styles.sectionTitle}>{t('captain.estimateSummary')}</Text>
            <Row label={t('captain.ratePerTrip')} value={formatCurrency(ratePerTrip)} />
            <Row
              label={t('captain.tripCount')}
              value={`× ${Math.max(tripCount, 1)}`}
            />
            <Row
              label={t('captain.platformFee')}
              value={`- ${formatCurrency(platformFee)}`}
            />
            <View style={styles.divider} />
            <Row
              label={t('captain.totalPeriodCost')}
              value={formatCurrency(netTotal)}
              bold
            />
          </Card>

          <Button
            title={t('captain.submitBidCta')}
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: Spacing.lg }}
            leftIcon={
              <Ionicons name="paper-plane-outline" size={18} color={Colors.onPrimary} />
            }
          />
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

const Row: React.FC<{ label: string; value: string; bold?: boolean }> = ({
  label,
  value,
  bold,
}) => (
  <View style={styles.rowItem}>
    <Text style={[styles.rowLabel, bold && { color: Colors.text }]}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        bold && { fontSize: 18, color: Colors.primary, fontFamily: FontFamily.bold },
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  tripName: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text },
  tripMeta: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  routeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  rowValue: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
});
