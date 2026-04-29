import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';

import {
  Avatar,
  Badge,
  Banner,
  Card,
  Header,
  Screen,
  StateView,
  StatTile,
  type ViewStatus,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
} from '@core/theme';
import {
  APP_VERSION,
  AttendanceStatus,
  OfferStatus,
  UserRole,
} from '@core/constants';
import {
  changeLanguage,
  getCurrentLanguage,
} from '@core/i18n';
import { useResponsiveLayout } from '@shared/hooks';
import { formatCurrency } from '@core/utils/format';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { tripsRepository } from '@features/trips/data/tripsRepository';
import { Trip } from '@features/trips/domain/models/Trip';

interface ProfileMetrics {
  trips: number;
  upcoming: number;
  completed: number;
  earnings?: number;
  acceptedBids?: number;
}

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const layout = useResponsiveLayout();
  const [language, setLanguage] = useState(getCurrentLanguage());
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [restartHint, setRestartHint] = useState(false);

  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [status, setStatus] = useState<ViewStatus>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setStatus('loading');
      let trips: Trip[];
      if (user.role === UserRole.Captain) {
        trips = await tripsRepository.listTrips({});
      } else {
        trips = await tripsRepository.listTripsForUser(user.id);
      }

      let m: ProfileMetrics = {
        trips: 0,
        upcoming: 0,
        completed: 0,
      };

      if (user.role === UserRole.Captain) {
        const myOffers = trips.flatMap((tr) =>
          (tr.offers ?? []).filter((o) => o.captain_id === user.id)
        );
        const accepted = myOffers.filter(
          (o) => o.status === OfferStatus.Accepted
        );
        m = {
          trips: myOffers.length,
          upcoming: myOffers.filter((o) => o.status === OfferStatus.Pending)
            .length,
          completed: accepted.length,
          earnings: accepted.reduce((s, o) => s + o.offer_price, 0),
          acceptedBids: accepted.length,
        };
      } else {
        const upcoming = trips.filter(
          (tr) =>
            tr.status !== 'completed' && tr.status !== 'cancelled'
        ).length;
        const confirmedDays = trips.flatMap((tr) =>
          (tr.attendance ?? []).filter(
            (a) =>
              a.user_id === user.id &&
              a.status === AttendanceStatus.Confirmed
          )
        ).length;
        m = {
          trips: trips.length,
          upcoming,
          completed: confirmedDays,
        };
      }
      setMetrics(m);
      setStatus('success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t('errors.network'));
      setStatus('error');
    }
  }, [user, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!user) return null;

  const isCaptain = user.role === UserRole.Captain;

  const onChangeLanguage = async (next: 'en' | 'ar') => {
    if (next === language) return;
    setLanguage(next);
    const reloadNeeded = await changeLanguage(next);
    if (reloadNeeded) setRestartHint(true);
  };

  const confirmSignOut = () => {
    Alert.alert(t('auth.signOut'), t('auth.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const openLink = async (url: string) => {
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
  };

  const heroCard = (
    <Card style={styles.heroCard} variant="outlined">
      <View style={styles.heroRow}>
        <Avatar
          name={user.name}
          uri={user.avatar_url}
          size={72}
          background={
            isCaptain ? Colors.secondarySoft : Colors.primarySoft
          }
          color={isCaptain ? Colors.secondary : Colors.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.phone}>{user.phone}</Text>
          {user.email ? (
            <Text style={styles.phone}>{user.email}</Text>
          ) : null}
          <View style={styles.badges}>
            <Badge
              label={isCaptain ? t('auth.captain') : t('auth.passenger')}
              tone={isCaptain ? 'secondary' : 'primary'}
              icon={isCaptain ? 'car-sport' : 'school'}
              size="sm"
            />
            {user.is_verified ? (
              <Badge
                label={t('profile.verified')}
                tone="success"
                icon="checkmark-circle"
                size="sm"
              />
            ) : null}
            <Badge
              label={`${user.rating.toFixed(1)} ★`}
              tone="warning"
              size="sm"
            />
          </View>
        </View>
      </View>

      <View style={styles.heroActions}>
        <Pressable style={styles.heroActionBtn} onPress={() => Alert.alert(t('profile.editProfile'), t('common.comingSoon'))}>
          <Ionicons
            name="create-outline"
            size={14}
            color={Colors.primary}
          />
          <Text style={styles.heroActionText}>
            {t('profile.editProfile')}
          </Text>
        </Pressable>
        {isCaptain ? (
          <Pressable style={styles.heroActionBtn} onPress={() => Alert.alert(t('profile.manageVehicle'), t('common.comingSoon'))}>
            <Ionicons name="car-outline" size={14} color={Colors.primary} />
            <Text style={styles.heroActionText}>
              {t('profile.manageVehicle')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );

  const statsCard = (
    <View style={styles.statsRow}>
      {isCaptain ? (
        <>
          <StatTile
            label={t('profile.tripsTaken')}
            value={metrics?.completed ?? 0}
            icon="checkmark-done-outline"
            tone="secondary"
          />
          <StatTile
            label={t('captain.activeBids')}
            value={metrics?.upcoming ?? 0}
            icon="hourglass-outline"
            tone="warning"
          />
          {metrics?.earnings ? (
            <StatTile
              label={t('captain.lifetimeEarnings')}
              value={formatCurrency(metrics.earnings)}
              icon="wallet-outline"
              tone="primary"
            />
          ) : null}
        </>
      ) : (
        <>
          <StatTile
            label={t('profile.tripsTaken')}
            value={metrics?.trips ?? 0}
            icon="bus-outline"
            tone="primary"
          />
          <StatTile
            label={t('attendance.verifiedTrips')}
            value={metrics?.completed ?? 0}
            icon="calendar-outline"
            tone="secondary"
          />
          <StatTile
            label={t('trips.filters.active')}
            value={metrics?.upcoming ?? 0}
            icon="navigate-outline"
            tone="warning"
          />
        </>
      )}
    </View>
  );

  const captainVehicleCard = isCaptain && user.captain ? (
    <Card variant="outlined" style={{ marginTop: Spacing.md }}>
      <Text style={styles.sectionTitle}>{t('profile.vehicle')}</Text>
      <View style={styles.vehicleRow}>
        <View style={styles.vehicleIcon}>
          <Ionicons name="car-sport" size={20} color={Colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.vehicleModel}>
            {user.captain.car_model || t('profile.vehicle')}
          </Text>
          <View style={styles.vehicleMeta}>
            <View style={styles.vehiclePill}>
              <Ionicons
                name="key-outline"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.vehiclePillText}>
                {user.captain.car_number}
              </Text>
            </View>
            <View style={styles.vehiclePill}>
              <Ionicons
                name="people-outline"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.vehiclePillText}>
                {user.captain.seats} {t('common.seats')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  ) : null;

  const preferencesCard = (
    <Card padded={false} style={{ marginTop: Spacing.md }} variant="outlined">
      <SectionHeader title={t('profile.preferences')} />

      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name="language" size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{t('profile.language')}</Text>
          <Text style={styles.rowCaption}>
            {language === 'ar'
              ? t('common.arabic')
              : t('common.english')}
          </Text>
        </View>
        <View style={styles.langPills}>
          <Pressable
            onPress={() => onChangeLanguage('ar')}
            style={[
              styles.langPill,
              language === 'ar' && styles.langPillActive,
            ]}
          >
            <Text
              style={[
                styles.langPillText,
                language === 'ar' && styles.langPillTextActive,
              ]}
            >
              AR
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onChangeLanguage('en')}
            style={[
              styles.langPill,
              language === 'en' && styles.langPillActive,
            ]}
          >
            <Text
              style={[
                styles.langPillText,
                language === 'en' && styles.langPillTextActive,
              ]}
            >
              EN
            </Text>
          </Pressable>
        </View>
      </View>

      <Divider />

      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons
            name="notifications-outline"
            size={18}
            color={Colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{t('profile.notifications')}</Text>
          <Text style={styles.rowCaption}>
            {t('profile.notificationsCaption')}
          </Text>
        </View>
        <Switch
          value={notificationsOn}
          onValueChange={setNotificationsOn}
          trackColor={{
            false: Colors.surfaceDim,
            true: Colors.primary,
          }}
          thumbColor={Colors.onPrimary}
        />
      </View>
    </Card>
  );

  const supportCard = (
    <Card padded={false} style={{ marginTop: Spacing.md }} variant="outlined">
      <SectionHeader title={t('profile.support')} />

      <SettingRow
        icon="star-outline"
        label={t('profile.rateApp')}
        onPress={() => Alert.alert(t('profile.rateApp'), t('common.comingSoon'))}
      />
      <Divider />
      <SettingRow
        icon="help-circle-outline"
        label={t('profile.supportLabel')}
        onPress={() => openLink('mailto:hello@twsila.app')}
      />
      <Divider />
      <SettingRow
        icon="information-circle-outline"
        label={t('profile.about')}
        onPress={() => Alert.alert(t('profile.about'), t('common.comingSoon'))}
      />
    </Card>
  );

  const legalCard = (
    <Card padded={false} style={{ marginTop: Spacing.md }} variant="outlined">
      <SectionHeader title={t('profile.account')} />

      <SettingRow
        icon="document-text-outline"
        label={t('profile.terms')}
        onPress={() => Alert.alert(t('profile.terms'), t('common.comingSoon'))}
      />
      <Divider />
      <SettingRow
        icon="shield-checkmark-outline"
        label={t('profile.privacyPolicy')}
        onPress={() =>
          Alert.alert(t('profile.privacyPolicy'), t('common.comingSoon'))
        }
      />
    </Card>
  );

  return (
    <Screen background={Colors.surface}>
      <Header title={t('profile.title')} transparent />
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
        {restartHint ? (
          <Banner
            tone="info"
            title={t('profile.languageUpdated')}
            description={t('profile.restartHint')}
            onDismiss={() => setRestartHint(false)}
            style={{ marginBottom: Spacing.md }}
          />
        ) : null}

        {layout.isWide ? (
          <View style={styles.twoCols}>
            <View style={styles.colMain}>
              {heroCard}
              <StateView
                status={status}
                loading={
                  <View style={styles.statsRow}>
                    <View style={[styles.statSkeleton, { flex: 1 }]} />
                    <View style={[styles.statSkeleton, { flex: 1 }]} />
                    <View style={[styles.statSkeleton, { flex: 1 }]} />
                  </View>
                }
                error={{
                  title: t('errors.loadFailed'),
                  description:
                    errorMsg ?? t('errors.loadFailedSubtitle'),
                  retryLabel: t('common.retry'),
                  onRetry: () => load(),
                }}
                style={{ marginTop: Spacing.md }}
              >
                {statsCard}
              </StateView>
              {captainVehicleCard}
            </View>
            <View style={styles.colSide}>
              {preferencesCard}
              {supportCard}
              {legalCard}
              <SignOutButton onPress={confirmSignOut} t={t} />
              <Text style={styles.versionText}>
                {t('profile.version', { version: APP_VERSION })}
              </Text>
            </View>
          </View>
        ) : (
          <>
            {heroCard}
            <StateView
              status={status}
              loading={
                <View style={[styles.statsRow, { marginTop: Spacing.md }]}>
                  <View style={[styles.statSkeleton, { flex: 1 }]} />
                  <View style={[styles.statSkeleton, { flex: 1 }]} />
                </View>
              }
              error={{
                title: t('errors.loadFailed'),
                description: errorMsg ?? t('errors.loadFailedSubtitle'),
                retryLabel: t('common.retry'),
                onRetry: () => load(),
              }}
              style={{ marginTop: Spacing.md }}
            >
              {statsCard}
            </StateView>
            {captainVehicleCard}
            {preferencesCard}
            {supportCard}
            {legalCard}
            <SignOutButton onPress={confirmSignOut} t={t} />
            <Text style={styles.versionText}>
              {t('profile.version', { version: APP_VERSION })}
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const SettingRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}> = ({ icon, label, onPress }) => (
  <Pressable style={styles.row} onPress={onPress}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={{ flex: 1 }} />
    <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
  </Pressable>
);

const Divider: React.FC = () => <View style={styles.divider} />;

const SignOutButton: React.FC<{ onPress: () => void; t: any }> = ({
  onPress,
  t,
}) => (
  <Pressable onPress={onPress} style={styles.logoutBtn}>
    <Ionicons name="log-out-outline" size={18} color={Colors.error} />
    <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  twoCols: { flexDirection: 'row', gap: Spacing.lg },
  colMain: { flex: 1.2 },
  colSide: { flex: 1 },
  heroCard: { gap: Spacing.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  name: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  phone: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  heroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySoft,
  },
  heroActionText: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: Spacing.md,
  },
  statSkeleton: {
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface2,
    minWidth: 130,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  vehicleRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleModel: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  vehicleMeta: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4 },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface2,
  },
  vehiclePillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  rowCaption: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: BorderRadius.pill,
    padding: 2,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  langPillActive: { backgroundColor: Colors.primary },
  langPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.bold,
  },
  langPillTextActive: { color: Colors.onPrimary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.errorSoft,
    borderRadius: BorderRadius.md,
  },
  logoutText: {
    color: Colors.error,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.md,
  },
});
