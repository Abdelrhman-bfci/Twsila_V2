import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Input, Screen, Header, Card, Badge } from '@shared/components';
import { Colors, Spacing, FontFamily, BorderRadius, Shadows } from '@core/theme';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { PassengerExploreStackParamList } from '@navigation/types';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'Search'>;

const POPULAR_ROUTES = [
  { from: 'New Cairo', to: 'AUC' },
  { from: '6th October', to: 'GUC' },
  { from: 'Heliopolis', to: 'Cairo Univ.' },
];

export const SearchScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [recent, setRecent] = useState<Trip[]>([]);

  React.useEffect(() => {
    if (!user) return;
    tripsRepository.listTripsForUser(user.id).then(setRecent);
  }, [user]);

  const onSearch = () => {
    nav.navigate('SearchResults', {
      startQuery: start.trim() || undefined,
      endQuery: end.trim() || undefined,
    });
  };

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('trips.explore')}
        subtitle={t('trips.exploreSubtitle')}
        transparent
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroGreeting}>
            {t('common.appName')} · {user?.name?.split(' ')[0] || ''}
          </Text>
          <Text style={styles.heroTitle}>{t('trips.exploreSubtitle')}</Text>

          <Input
            placeholder={t('trips.pickupPlaceholder')}
            leftIcon="location-outline"
            value={start}
            onChangeText={setStart}
          />
          <Input
            placeholder={t('trips.dropoffPlaceholder')}
            leftIcon="flag-outline"
            value={end}
            onChangeText={setEnd}
          />

          <Button
            title={t('trips.searchTrips')}
            onPress={onSearch}
            leftIcon={<Ionicons name="search" size={18} color={Colors.onPrimary} />}
          />
        </View>

        <Text style={styles.sectionLabel}>{t('trips.groups')}</Text>
        <View style={styles.popularGrid}>
          {POPULAR_ROUTES.map((r, i) => (
            <Pressable
              key={i}
              style={styles.popularCard}
              onPress={() =>
                nav.navigate('SearchResults', { startQuery: r.from, endQuery: r.to })
              }
            >
              <View style={styles.popularIcon}>
                <Ionicons name="navigate" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.popularRoute} numberOfLines={1}>
                {r.from} → {r.to}
              </Text>
            </Pressable>
          ))}
        </View>

        {recent.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
              {t('nav.myTrips')}
            </Text>
            {recent.slice(0, 3).map((trip) => (
              <Pressable
                key={trip.id}
                onPress={() => nav.navigate('TripDetails', { tripId: trip.id })}
              >
                <Card style={styles.recentCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {trip.name || `${trip.start_address} → ${trip.end_address}`}
                    </Text>
                    <Text style={styles.recentMeta} numberOfLines={1}>
                      {trip.start_address} → {trip.end_address}
                    </Text>
                  </View>
                  <Badge
                    label={t(`trips.status.${trip.status}`)}
                    tone={
                      trip.status === 'assigned' || trip.status === 'in_progress'
                        ? 'success'
                        : trip.status === 'bidding'
                        ? 'warning'
                        : 'primary'
                    }
                  />
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  heroCard: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
    marginBottom: Spacing.lg,
  },
  heroGreeting: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  popularCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  popularIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularRoute: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Colors.text,
    flex: 1,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  recentName: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: Colors.text,
  },
  recentMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textLight,
    marginTop: 2,
  },
});
