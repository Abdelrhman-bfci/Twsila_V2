import React, { useState } from 'react';
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
  Button,
  Card,
  Header,
  Screen,
  SectionHeader,
  Skeleton,
  SkeletonCard,
} from '@shared/components';
import { PlacesAutocompleteField } from '@shared/components/PlacesAutocompleteField';
import { useResponsiveLayout } from '@shared/hooks';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import { formatCityName, formatTime } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { PassengerExploreStackParamList } from '@navigation/types';
import { tripsRepository } from '../../data/tripsRepository';
import { Trip } from '../../domain/models/Trip';

type Nav = NativeStackNavigationProp<PassengerExploreStackParamList, 'Search'>;

const POPULAR_ROUTES = [
  { from: 'New Cairo', to: 'AUC', tag: 'AUC line' },
  { from: '6th October', to: 'GUC', tag: 'GUC corridor' },
  { from: 'Heliopolis', to: 'Cairo Univ.', tag: 'Cairo Univ.' },
  { from: 'Maadi', to: 'AUC', tag: 'Maadi → AUC' },
];

export const SearchScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const layout = useResponsiveLayout();

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [recent, setRecent] = useState<Trip[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecent = React.useCallback(async () => {
    if (!user) {
      setLoadingRecent(false);
      return;
    }
    try {
      const data = await tripsRepository.listTripsForUser(user.id);
      setRecent(data);
    } finally {
      setLoadingRecent(false);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      setLoadingRecent(true);
      loadRecent();
    }, [loadRecent])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecent();
    setRefreshing(false);
  };

  const onSearch = () => {
    nav.navigate('SearchResults', {
      startQuery: start.trim() || undefined,
      endQuery: end.trim() || undefined,
    });
  };

  const greetingName = user?.name?.split(' ')[0] || '';
  const popularColumns = layout.isWide ? 4 : layout.isMedium ? 3 : 2;
  const popularBasis = `${Math.floor(100 / popularColumns) - 2}%`;

  return (
    <Screen background={Colors.surface}>
      <Header
        title={t('trips.explore')}
        subtitle={t('trips.exploreSubtitle')}
        transparent
      />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroGreeting}>
            {greetingName ? t('trips.exploreGreeting', { name: greetingName }) : t('common.appName')}
          </Text>
          <Text style={styles.heroTitle}>{t('trips.exploreSubtitle')}</Text>

          <View style={{ zIndex: 20, marginBottom: Spacing.sm }}>
            <PlacesAutocompleteField
              label={t('trips.pickup')}
              placeholder={t('trips.pickupPlaceholder')}
              leftIcon="location"
              value={start}
              onChangeAddress={setStart}
              onPlaceResolved={(p) => setStart(p.address)}
            />
          </View>
          <View style={{ zIndex: 10, marginBottom: Spacing.md }}>
            <PlacesAutocompleteField
              label={t('trips.dropoff')}
              placeholder={t('trips.dropoffPlaceholder')}
              leftIcon="flag"
              value={end}
              onChangeAddress={setEnd}
              onPlaceResolved={(p) => setEnd(p.address)}
            />
          </View>

          <Button
            title={t('trips.searchTrips')}
            onPress={onSearch}
            leftIcon={<Ionicons name="search" size={18} color={Colors.onPrimary} />}
          />

          <Pressable
            style={styles.createInline}
            onPress={() =>
              nav.navigate('CreateTrip', {
                startQuery: start.trim() || undefined,
                endQuery: end.trim() || undefined,
              })
            }
          >
            <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.createInlineText}>
              {t('trips.createNewTripRequest')}
            </Text>
          </Pressable>
        </View>

        <SectionHeader
          title={t('trips.popularRoutes')}
          caption={t('trips.popularRoutesSubtitle')}
          leadingIcon="flame"
        />
        <View style={styles.popularGrid}>
          {POPULAR_ROUTES.map((r, i) => (
            <Pressable
              key={i}
              style={[styles.popularCard, { flexBasis: popularBasis }]}
              onPress={() =>
                nav.navigate('SearchResults', { startQuery: r.from, endQuery: r.to })
              }
            >
              <View style={styles.popularIcon}>
                <Ionicons name="navigate" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.popularRoute} numberOfLines={1}>
                  {r.from} → {r.to}
                </Text>
                <Text style={styles.popularTag} numberOfLines={1}>
                  {r.tag}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
            </Pressable>
          ))}
        </View>

        <SectionHeader
          title={t('nav.myTrips')}
          actionLabel={t('common.more')}
          actionIcon="arrow-forward"
          onActionPress={() => nav.navigate('SearchResults', {})}
          leadingIcon="bus-outline"
          style={{ marginTop: Spacing.lg }}
        />

        {loadingRecent ? (
          <View style={{ gap: Spacing.sm }}>
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
          </View>
        ) : recent.length === 0 ? (
          <Card variant="outlined" style={styles.recentEmpty}>
            <View style={styles.recentEmptyIcon}>
              <Ionicons name="search-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentEmptyTitle}>
                {t('trips.searchEmpty')}
              </Text>
              <Text style={styles.recentEmptySub} numberOfLines={2}>
                {t('trips.searchEmptySubtitle')}
              </Text>
            </View>
          </Card>
        ) : (
          recent.slice(0, 3).map((trip) => (
            <Pressable
              key={trip.id}
              onPress={() => nav.navigate('TripDetails', { tripId: trip.id })}
            >
              <Card style={styles.recentCard} variant="outlined">
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {formatCityName(trip.start_address)} →{' '}
                    {formatCityName(trip.end_address)}
                  </Text>
                  <Text style={styles.recentMeta} numberOfLines={1}>
                    <Ionicons name="time-outline" size={12} />{' '}
                    {formatTime(trip.departure_time)} ·{' '}
                    {(trip.passengers ?? []).length}/{trip.total_seats}{' '}
                    {t('common.seats')}
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
                  size="sm"
                />
              </Card>
            </Pressable>
          ))
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
    fontSize: 19,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  createInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  createInlineText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  popularCard: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  popularIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularRoute: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Colors.text,
  },
  popularTag: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 1,
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
  recentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recentEmptyIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentEmptyTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  recentEmptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    lineHeight: 16,
  },
});
