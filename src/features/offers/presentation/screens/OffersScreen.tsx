import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Header,
  Screen,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import { OfferStatus } from '@core/constants';
import { formatCurrency } from '@core/utils/format';
import { shareTrip } from '@core/utils/sharing';

import { tripsRepository } from '@features/trips/data/tripsRepository';
import { CaptainOffer, Trip } from '@features/trips/domain/models/Trip';
import { PassengerExploreStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'Offers'>;
type Rt = RouteProp<PassengerExploreStackParamList, 'Offers'>;

export const OffersScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const t = await tripsRepository.getTrip(tripId);
    setTrip(t);
  }, [tripId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async (o: CaptainOffer) => {
    setBusy(o.id);
    try {
      await tripsRepository.acceptOffer(o.id);
      await load();
      Alert.alert(t('common.success'), t('offers.selectedCaptain'));
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : '');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (o: CaptainOffer) => {
    setBusy(o.id);
    try {
      await tripsRepository.rejectOffer(o.id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (!trip) {
    return (
      <Screen>
        <Header title={t('common.loading')} onBack={() => nav.goBack()} />
      </Screen>
    );
  }

  const offers = trip.offers ?? [];
  const pending = offers.filter((o) => o.status === OfferStatus.Pending);
  const accepted = offers.find((o) => o.status === OfferStatus.Accepted);

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('offers.bidsReceived')}
        onBack={() => nav.goBack()}
        subtitle={
          pending.length
            ? t('offers.newOffers', { count: pending.length })
            : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {accepted ? (
          <Card style={styles.acceptedCard} variant="tinted">
            <View style={styles.row}>
              <Avatar name={accepted.captain_name} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.captainName}>{accepted.captain_name}</Text>
                <Text style={styles.vehicle}>
                  {accepted.vehicle_label} · {accepted.vehicle_seats} {t('common.seats')}
                </Text>
              </View>
              <Badge label={t('offers.selectedCaptain')} tone="success" icon="checkmark-circle" />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('offers.basePrice')}</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(accepted.offer_price)}
                </Text>
              </View>
              {accepted.eta_minutes ? (
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>{t('captain.estTime')}</Text>
                  <Text style={styles.statValue}>
                    {accepted.eta_minutes} {t('common.min')}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>
        ) : null}

        {pending.length === 0 && !accepted ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon="megaphone-outline"
              title={t('offers.bidsReceived')}
              subtitle={t('offers.noOffersYet')}
            />
            <View style={{ paddingHorizontal: Spacing.xl, marginTop: -Spacing.lg }}>
              <Button
                title={t('trips.shareTrip')}
                onPress={() => shareTrip(trip, t)}
                leftIcon={<Ionicons name="share-social-outline" size={20} color={Colors.onPrimary} />}
              />
            </View>
          </View>
        ) : null}

        {pending.map((o) => (
          <Card key={o.id} style={styles.offerCard}>
            <View style={styles.row}>
              <Avatar name={o.captain_name} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={styles.captainName}>{o.captain_name}</Text>
                <Text style={styles.vehicle}>
                  <Ionicons name="car-outline" size={12} /> {o.vehicle_label}{' '}
                  {o.vehicle_seats ? `· ${o.vehicle_seats} ${t('common.seats')}` : ''}
                </Text>
                {o.captain_rating ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.ratingText}>{o.captain_rating}</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.priceMain}>{formatCurrency(o.offer_price)}</Text>
                {o.price_per_ride ? (
                  <Text style={styles.pricePer}>
                    {formatCurrency(o.price_per_ride)} {t('common.perRide')}
                  </Text>
                ) : null}
              </View>
            </View>

            {o.comment ? (
              <View style={styles.comment}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.commentText}>{o.comment}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Button
                title={t('offers.acceptOffer')}
                onPress={() => accept(o)}
                loading={busy === o.id}
                style={{ flex: 1 }}
                size="sm"
                leftIcon={
                  <Ionicons name="checkmark" size={16} color={Colors.onPrimary} />
                }
              />
              <View style={{ width: Spacing.sm }} />
              <Button
                title={t('offers.rejectOffer')}
                variant="outline"
                onPress={() => reject(o)}
                loading={busy === o.id}
                style={{ flex: 1 }}
                size="sm"
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  acceptedCard: { marginBottom: Spacing.lg, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  captainName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  vehicle: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  priceMain: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  pricePer: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  statBox: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLowest,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginTop: 2,
  },
  offerCard: { marginBottom: Spacing.sm, gap: Spacing.sm },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.primarySoft,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  commentText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamily.regular,
  },
  actions: { flexDirection: 'row' },
});
