import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Badge,
  Card,
  EmptyState,
  Header,
  Screen,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
} from '@core/theme';
import { OfferStatus } from '@core/constants';
import { formatCurrency, formatTime } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '@features/trips/data/tripsRepository';
import {
  CaptainOffer,
  Trip,
} from '@features/trips/domain/models/Trip';
import { CaptainBidsStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<CaptainBidsStackParamList, 'MyBids'>;

interface BidWithTrip {
  offer: CaptainOffer;
  trip: Trip;
}

export const MyBidsScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();

  const [bids, setBids] = useState<BidWithTrip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const all = await tripsRepository.listTrips({});
    const mine: BidWithTrip[] = [];
    for (const trip of all) {
      const offer = trip.offers.find((o) => o.captain_id === user.id);
      if (offer) mine.push({ offer, trip });
    }
    setBids(mine);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toneFor = (status: string): 'warning' | 'success' | 'error' | 'neutral' => {
    if (status === OfferStatus.Accepted) return 'success';
    if (status === OfferStatus.Pending) return 'warning';
    if (status === OfferStatus.Rejected) return 'error';
    return 'neutral';
  };

  const labelFor = (status: string): string => {
    if (status === OfferStatus.Accepted) return t('captain.bidAccepted');
    if (status === OfferStatus.Pending) return t('captain.bidPending');
    if (status === OfferStatus.Rejected) return t('captain.bidRejected');
    return t('captain.bidWithdrawn');
  };

  return (
    <Screen background={Colors.surface}>
      <Header title={t('captain.myBids')} transparent />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        {bids.length === 0 && !refreshing ? (
          <EmptyState
            icon="hammer-outline"
            title={t('captain.myBids')}
            subtitle={t('captain.noBids')}
          />
        ) : null}

        {bids.map(({ offer, trip }) => (
          <Pressable
            key={offer.id}
            onPress={() => nav.navigate('TripDetails', { tripId: trip.id })}
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {trip.name || `${trip.start_address} → ${trip.end_address}`}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    <Ionicons name="navigate-outline" size={12} />{' '}
                    {trip.start_address} → {trip.end_address}
                  </Text>
                </View>
                <Badge label={labelFor(offer.status)} tone={toneFor(offer.status)} size="sm" />
              </View>

              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>{t('offers.basePrice')}</Text>
                  <Text style={styles.priceMain}>{formatCurrency(offer.offer_price)}</Text>
                </View>
                <View style={styles.depTime}>
                  <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                  <Text style={styles.metaText}>{formatTime(trip.departure_time)}</Text>
                </View>
              </View>

              {offer.comment ? (
                <Text style={styles.comment} numberOfLines={2}>
                  {offer.comment}
                </Text>
              ) : null}
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { marginBottom: Spacing.sm, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  title: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text },
  subtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceMain: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  depTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  comment: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    backgroundColor: Colors.surface1,
    padding: Spacing.sm,
    borderRadius: 12,
  },
});
