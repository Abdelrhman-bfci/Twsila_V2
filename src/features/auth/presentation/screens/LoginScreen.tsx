import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Input, Screen } from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import { isDevMode, DEV_ACCOUNTS } from '@core/config/devMode';
import { isValidPhone, isStrongPassword } from '@core/utils/validators';

import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { signIn, loading } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const handleSignIn = async () => {
    const next: typeof errors = {};
    if (!phone.trim()) next.phone = t('auth.phoneRequired');
    else if (!isValidPhone(phone)) next.phone = t('auth.phoneInvalid');
    if (!password) next.password = t('auth.passwordRequired');
    else if (!isStrongPassword(password)) next.password = t('auth.passwordTooShort');
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await signIn(phone.trim(), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.loginFailed');
      Alert.alert(t('common.error'), msg);
    }
  };

  const quickLogin = async (acc: (typeof DEV_ACCOUNTS)[number]) => {
    setPhone(acc.phone);
    setPassword(acc.password);
    try {
      await signIn(acc.phone, acc.password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.loginFailed');
      Alert.alert(t('common.error'), msg);
    }
  };

  return (
    <Screen background={Colors.surface}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="bus" size={28} color={Colors.onPrimary} />
            </View>
            <Text style={styles.appName}>{t('common.appName')}</Text>
            <Text style={styles.tagline}>{t('common.tagline')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('auth.welcomeBack')}</Text>

            <Input
              label={t('auth.phone')}
              placeholder={t('auth.phonePlaceholder')}
              keyboardType="phone-pad"
              autoCapitalize="none"
              leftIcon="call-outline"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
            />

            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            <Pressable style={styles.forgotBtn}>
              <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
            </Pressable>

            <Button
              title={t('auth.signIn')}
              loading={loading}
              onPress={handleSignIn}
              style={{ marginTop: Spacing.sm }}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('auth.noAccount')}</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title={t('auth.createAccount')}
              variant="outline"
              onPress={() => nav.navigate('SignUp')}
            />
          </View>

          {isDevMode() && (
            <View style={styles.devBanner}>
              <View style={styles.devTopRow}>
                <Ionicons name="construct-outline" size={16} color={Colors.primary} />
                <Text style={styles.devTitle}>{t('auth.devMode')}</Text>
              </View>
              <Text style={styles.devSubtitle}>{t('auth.devPickAccount')}</Text>

              <View style={styles.devGrid}>
                {DEV_ACCOUNTS.map((a) => (
                  <Pressable
                    key={a.id}
                    style={styles.devCard}
                    onPress={() => quickLogin(a)}
                  >
                    <View
                      style={[
                        styles.devIcon,
                        {
                          backgroundColor:
                            a.role === 'captain'
                              ? Colors.secondarySoft
                              : Colors.primarySoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={a.role === 'captain' ? 'car-sport' : 'person'}
                        size={16}
                        color={
                          a.role === 'captain' ? Colors.secondary : Colors.primary
                        }
                      />
                    </View>
                    <Text style={styles.devName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={styles.devRole}>
                      {a.role === 'captain'
                        ? t('auth.captain')
                        : t('auth.passenger')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  brand: { alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.elevated,
  },
  appName: {
    marginTop: Spacing.md,
    fontSize: 28,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  tagline: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.xs },
  forgot: { color: Colors.primary, fontFamily: FontFamily.semiBold, fontSize: 13 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textLight,
  },
  devBanner: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryFixedDim,
  },
  devTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  devTitle: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  devSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  devGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  devCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  devIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  devName: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.text },
  devRole: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
});
