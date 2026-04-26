import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Input, Screen, Header } from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import {
  isValidPhone,
  isStrongPassword,
  isNonEmpty,
} from '@core/utils/validators';
import { UserRole, UserRoleValue } from '@core/constants';

import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { signUp, loading } = useAuth();

  const [role, setRole] = useState<UserRoleValue>(UserRole.Passenger);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!isNonEmpty(name)) next.name = t('auth.nameRequired');
    if (!phone.trim()) next.phone = t('auth.phoneRequired');
    else if (!isValidPhone(phone)) next.phone = t('auth.phoneInvalid');
    if (!isStrongPassword(password)) next.password = t('auth.passwordTooShort');
    if (role === UserRole.Captain && !isNonEmpty(carNumber))
      next.carNumber = t('auth.carNumberRequired');
    if (!terms) next.terms = t('auth.termsRequired');
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await signUp({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role,
        captain:
          role === UserRole.Captain
            ? { car_number: carNumber.trim(), car_model: carModel.trim() || undefined }
            : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error');
      Alert.alert(t('common.error'), msg);
    }
  };

  return (
    <Screen background={Colors.surface}>
      <Header onBack={() => nav.goBack()} title={t('auth.joinTwsila')} transparent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>{t('auth.joinSubtitle')}</Text>

          <Text style={styles.sectionLabel}>{t('auth.chooseRole')}</Text>
          <View style={styles.rolesRow}>
            {[
              {
                key: UserRole.Passenger,
                title: t('auth.passenger'),
                desc: t('auth.passengerDesc'),
                icon: 'school' as const,
                tone: { bg: Colors.primarySoft, fg: Colors.primary },
              },
              {
                key: UserRole.Captain,
                title: t('auth.captain'),
                desc: t('auth.captainDesc'),
                icon: 'car-sport' as const,
                tone: { bg: Colors.secondarySoft, fg: Colors.secondary },
              },
            ].map((r) => {
              const active = role === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRole(r.key)}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                >
                  <View
                    style={[
                      styles.roleIcon,
                      { backgroundColor: active ? r.tone.fg : r.tone.bg },
                    ]}
                  >
                    <Ionicons
                      name={r.icon}
                      size={22}
                      color={active ? Colors.onPrimary : r.tone.fg}
                    />
                  </View>
                  <Text style={[styles.roleTitle, active && { color: Colors.primary }]}>
                    {r.title}
                  </Text>
                  <Text style={styles.roleDesc} numberOfLines={3}>
                    {r.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.formCard}>
            <Input
              label={t('auth.fullName')}
              placeholder={t('auth.fullNamePlaceholder')}
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <Input
              label={t('auth.phone')}
              placeholder={t('auth.phonePlaceholder')}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
            />
            <Input
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
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

            {role === UserRole.Captain && (
              <>
                <Input
                  label={t('auth.carNumber')}
                  placeholder={t('auth.carNumberPlaceholder')}
                  leftIcon="card-outline"
                  value={carNumber}
                  onChangeText={setCarNumber}
                  error={errors.carNumber}
                />
                <Input
                  label={t('auth.carModel')}
                  placeholder={t('auth.carModelPlaceholder')}
                  leftIcon="car-outline"
                  value={carModel}
                  onChangeText={setCarModel}
                />
              </>
            )}

            <Pressable
              style={styles.termsRow}
              onPress={() => setTerms((v) => !v)}
            >
              <View
                style={[
                  styles.checkbox,
                  terms && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                ]}
              >
                {terms && <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />}
              </View>
              <Text style={styles.termsText}>
                {t('auth.iAgree')}{' '}
                <Text style={styles.link}>{t('auth.termsOfService')}</Text>{' '}
                {t('auth.and')}{' '}
                <Text style={styles.link}>{t('auth.privacyPolicy')}</Text>
              </Text>
            </Pressable>
            {errors.terms ? <Text style={styles.errorTxt}>{errors.terms}</Text> : null}

            <Button
              title={t('auth.signUp')}
              onPress={handleSubmit}
              loading={loading}
              style={{ marginTop: Spacing.sm }}
            />

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>{t('auth.alreadyHaveAccount')}</Text>
              <Pressable onPress={() => nav.goBack()}>
                <Text style={styles.link}>{t('auth.signIn')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
    marginBottom: Spacing.sm,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  roleCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
    ...Shadows.card,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  roleTitle: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  roleDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },
  formCard: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  link: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  errorTxt: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: FontFamily.medium,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.md,
  },
  bottomText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
});
