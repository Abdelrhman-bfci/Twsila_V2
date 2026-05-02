import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Banner, Button, Input, Screen } from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import { useResponsiveLayout } from '@shared/hooks';
import { isDevMode, DEV_ACCOUNTS } from '@core/config/devMode';
import { isValidPhone, isStrongPassword } from '@core/utils/validators';

import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { signIn, loading } = useAuth();
  const layout = useResponsiveLayout();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(-20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(brandOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(brandTranslateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.back(1.70158)),
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 220);
  }, [brandOpacity, brandTranslateY, cardOpacity, cardTranslateY]);

  const handleSignIn = async () => {
    setSubmitError(null);
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
      setSubmitError(err instanceof Error ? err.message : t('auth.loginFailed'));
    }
  };

  const quickLogin = async (acc: (typeof DEV_ACCOUNTS)[number]) => {
    setSubmitError(null);
    setPhone(acc.phone);
    setPassword(acc.password);
    try {
      await signIn(acc.phone, acc.password);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('auth.loginFailed'));
    }
  };

  const cardMaxWidth = layout.isWide ? 460 : layout.isMedium ? 460 : '100%';

  return (
    <Screen background={Colors.primary} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            layout.isWide && { flexDirection: 'row', alignItems: 'stretch' },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.brandTop,
              layout.isWide && styles.brandTopWide,
              {
                opacity: brandOpacity,
                transform: [{ translateY: brandTranslateY }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Image
                source={require('../../../../../assets/logo.png')}
                resizeMode="cover"
                style={styles.logoImg}
              />
            </View>
            <Text style={styles.appName}>{t('common.appName').toUpperCase()}</Text>
            <Text style={styles.tagline}>{t('common.tagline')}</Text>

            {layout.isWide ? (
              <View style={styles.wideTrust}>
                <View style={styles.wideTrustItem}>
                  <Ionicons name="shield-checkmark" size={14} color="#A9A7FF" />
                  <Text style={styles.wideTrustText}>{t('auth.securedBy')}</Text>
                </View>
                <View style={styles.wideTrustItem}>
                  <Ionicons name="ribbon" size={14} color="#A9A7FF" />
                  <Text style={styles.wideTrustText}>{t('auth.studentVerified')}</Text>
                </View>
              </View>
            ) : null}
          </Animated.View>

          <Animated.View
            style={[
              styles.cardWrap,
              layout.isWide && styles.cardWrapWide,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <View style={[styles.card, { maxWidth: cardMaxWidth, alignSelf: 'center' }]}>
              <Text style={styles.cardEyebrow}>{t('auth.signIn').toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{t('auth.welcomeBack')}</Text>
              <Text style={styles.cardSubtitle}>{t('auth.welcomeSubtitle')}</Text>

              {submitError ? (
                <Banner
                  tone="error"
                  title={t('auth.loginFailed')}
                  description={submitError}
                  style={{ marginBottom: Spacing.md }}
                />
              ) : null}

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

              <Pressable
                style={styles.forgotBtn}
                onPress={() => setSubmitError(t('common.comingSoon'))}
              >
                <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
              </Pressable>

              <Button
                title={t('auth.signIn')}
                loading={loading}
                onPress={handleSignIn}
                size="lg"
                style={styles.signInBtn}
              />

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>
                  {t('auth.verifiedPartners')}
                </Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.partnersRow}>
                <Pressable style={styles.partnerBtn}>
                  <Ionicons name="logo-google" size={18} color={Colors.text} />
                  <Text style={styles.partnerText}>{t('auth.google')}</Text>
                </Pressable>
                <Pressable style={styles.partnerBtn}>
                  <Ionicons name="git-network-outline" size={18} color={Colors.text} />
                  <Text style={styles.partnerText}>{t('auth.uniHub')}</Text>
                </Pressable>
              </View>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>{t('auth.noAccount')} </Text>
                <Pressable onPress={() => nav.navigate('SignUp')}>
                  <Text style={styles.signUpLink}>{t('auth.signUp')}</Text>
                </Pressable>
              </View>

              {!layout.isWide ? (
                <View style={styles.trustRow}>
                  <View style={styles.trustItem}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={13}
                      color={Colors.textLight}
                    />
                    <Text style={styles.trustText}>{t('auth.securedBy')}</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Ionicons name="ribbon-outline" size={13} color={Colors.textLight} />
                    <Text style={styles.trustText}>{t('auth.studentVerified')}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {isDevMode() && (
              <View style={[styles.devBanner, { maxWidth: cardMaxWidth, alignSelf: 'center' }]}>
                <View style={styles.devTopRow}>
                  <Ionicons name="construct-outline" size={14} color={Colors.primary} />
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
                          size={14}
                          color={
                            a.role === 'captain' ? Colors.secondary : Colors.primary
                          }
                        />
                      </View>
                      <Text style={styles.devName} numberOfLines={1}>
                        {a.name}
                      </Text>
                      <Text style={styles.devRole}>
                        {a.role === 'captain' ? t('auth.captain') : t('auth.passenger')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxl, flexGrow: 1 },
  brandTop: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  brandTopWide: {
    flex: 1,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.elevated,
  },
  logoImg: { width: 165, height: 165 },
  appName: {
    marginTop: Spacing.md,
    fontSize: 30,
    color: '#FFFFFF',
    fontFamily: FontFamily.black,
    letterSpacing: 1.5,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    maxWidth: 320,
  },
  wideTrust: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  wideTrustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wideTrustText: {
    fontSize: 12,
    color: '#A9A7FF',
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.5,
  },
  cardWrap: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    flex: 1,
  },
  cardWrapWide: {
    flex: 1,
    marginTop: 0,
    borderRadius: 0,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    ...Shadows.card,
  },
  cardEyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 4, marginTop: 2 },
  forgot: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
  },
  signInBtn: { marginTop: Spacing.sm },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.textLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  partnersRow: { flexDirection: 'row', gap: Spacing.sm },
  partnerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLowest,
  },
  partnerText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.text,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signUpText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  signUpLink: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  trustRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    opacity: 0.7,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: Colors.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  devBanner: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    width: '100%',
    ...Shadows.subtle,
  },
  devTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  devTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },
  devSubtitle: {
    fontSize: 11,
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
    flexBasis: '47%',
    flexGrow: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  devIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  devName: { fontSize: 12, fontFamily: FontFamily.semiBold, color: Colors.text },
  devRole: { fontSize: 10, color: Colors.textLight, marginTop: 2 },
});
