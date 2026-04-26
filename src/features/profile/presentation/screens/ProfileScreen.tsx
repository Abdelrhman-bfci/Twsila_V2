import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  Badge,
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
import { APP_VERSION, UserRole } from '@core/constants';
import {
  changeLanguage,
  getCurrentLanguage,
} from '@core/i18n';

import { useAuth } from '@features/auth/presentation/context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [language, setLanguage] = useState(getCurrentLanguage());

  const toggleLanguage = async () => {
    const next = language === 'ar' ? 'en' : 'ar';
    setLanguage(next);
    const reloadNeeded = await changeLanguage(next);
    if (reloadNeeded) {
      Alert.alert(t('common.success'), t('common.appName'));
    }
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

  if (!user) return null;

  return (
    <Screen background={Colors.surface}>
      <Header title={t('profile.title')} transparent />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.heroCard}>
          <Avatar name={user.name} size={72} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.phone}>{user.phone}</Text>
          <View style={styles.badges}>
            <Badge
              label={
                user.role === UserRole.Captain
                  ? t('auth.captain')
                  : t('auth.passenger')
              }
              tone={user.role === UserRole.Captain ? 'secondary' : 'primary'}
              icon={user.role === UserRole.Captain ? 'car-sport' : 'school'}
            />
            {user.is_verified && (
              <Badge
                label={t('profile.verified')}
                tone="success"
                icon="checkmark-circle"
              />
            )}
          </View>
        </Card>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={18} color={Colors.warning} />
            <Text style={styles.statValue}>{user.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('common.captainMode')}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="bus" size={18} color={Colors.primary} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t('profile.tripsTaken')}</Text>
          </View>
        </View>

        <Text style={styles.section}>{t('profile.settings')}</Text>
        <Card padded={false}>
          <SettingRow
            icon="language"
            label={t('profile.language')}
            right={
              <View style={styles.langToggle}>
                <Text
                  style={[
                    styles.langText,
                    language === 'ar' && styles.langActive,
                  ]}
                >
                  AR
                </Text>
                <Switch
                  value={language === 'en'}
                  onValueChange={toggleLanguage}
                  trackColor={{
                    false: Colors.surfaceDim,
                    true: Colors.primary,
                  }}
                  thumbColor={Colors.onPrimary}
                />
                <Text
                  style={[
                    styles.langText,
                    language === 'en' && styles.langActive,
                  ]}
                >
                  EN
                </Text>
              </View>
            }
          />
          <Divider />
          <SettingRow icon="star-outline" label={t('profile.rateApp')} />
          <Divider />
          <SettingRow icon="help-circle-outline" label={t('profile.support')} />
          <Divider />
          <SettingRow icon="document-text-outline" label={t('profile.terms')} />
          <Divider />
          <SettingRow icon="shield-checkmark-outline" label={t('profile.privacyPolicy')} />
        </Card>

        <Pressable onPress={confirmSignOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>{t('auth.signOut')}</Text>
        </Pressable>

        <Text style={styles.versionText}>
          {t('profile.version', { version: APP_VERSION })}
        </Text>
      </ScrollView>
    </Screen>
  );
};

const SettingRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  right?: React.ReactNode;
}> = ({ icon, label, right }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
    </View>
    <Text style={styles.settingLabel}>{label}</Text>
    <View style={{ flex: 1 }} />
    {right || (
      <Ionicons
        name="chevron-forward"
        size={18}
        color={Colors.textLight}
      />
    )}
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  heroCard: { alignItems: 'center', gap: Spacing.xs },
  name: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  phone: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLowest,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  section: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langText: {
    fontSize: 12,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
  },
  langActive: { color: Colors.primary },
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
