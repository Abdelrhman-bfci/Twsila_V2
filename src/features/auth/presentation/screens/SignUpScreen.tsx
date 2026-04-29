import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Banner,
  Button,
  Header,
  Input,
  Screen,
  Stepper,
} from '@shared/components';
import {
  Colors,
  Spacing,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@core/theme';
import { useResponsiveLayout } from '@shared/hooks';
import {
  isValidPhone,
  isStrongPassword,
  isNonEmpty,
} from '@core/utils/validators';
import { UserRole, UserRoleValue } from '@core/constants';

import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

type StepKey = 'role' | 'account' | 'vehicle';

export const SignUpScreen: React.FC = () => {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { signUp, loading } = useAuth();
  const layout = useResponsiveLayout();

  const [role, setRole] = useState<UserRoleValue>(UserRole.Passenger);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const stepKeys: StepKey[] = useMemo(
    () => (role === UserRole.Captain ? ['role', 'account', 'vehicle'] : ['role', 'account']),
    [role]
  );

  const steps = stepKeys.map((key) => ({
    key,
    title:
      key === 'role'
        ? t('auth.step1Title')
        : key === 'account'
        ? t('auth.step2Title')
        : t('auth.step3Title'),
  }));

  const safeStepIndex = Math.min(stepIndex, steps.length - 1);
  const currentStep = stepKeys[safeStepIndex];

  const validateAccount = (): boolean => {
    const next: Record<string, string> = {};
    if (!isNonEmpty(name)) next.name = t('auth.nameRequired');
    if (!phone.trim()) next.phone = t('auth.phoneRequired');
    else if (!isValidPhone(phone)) next.phone = t('auth.phoneInvalid');
    if (!isStrongPassword(password)) next.password = t('auth.passwordTooShort');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateVehicle = (): boolean => {
    const next: Record<string, string> = {};
    if (role === UserRole.Captain && !isNonEmpty(carNumber))
      next.carNumber = t('auth.carNumberRequired');
    setErrors((p) => ({ ...p, ...next }));
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    setSubmitError(null);
    if (currentStep === 'account' && !validateAccount()) return;
    if (currentStep === 'vehicle' && !validateVehicle()) return;
    if (safeStepIndex < steps.length - 1) {
      setStepIndex(safeStepIndex + 1);
    }
  };

  const goBack = () => {
    setSubmitError(null);
    if (safeStepIndex === 0) {
      nav.goBack();
    } else {
      setStepIndex(safeStepIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validateAccount()) {
      setStepIndex(stepKeys.indexOf('account'));
      return;
    }
    if (role === UserRole.Captain && !validateVehicle()) {
      setStepIndex(stepKeys.indexOf('vehicle'));
      return;
    }
    if (!terms) {
      setErrors((p) => ({ ...p, terms: t('auth.termsRequired') }));
      return;
    }

    try {
      await signUp({
        name: name.trim(),
        phone: phone.trim(),
        password,
        role,
        captain:
          role === UserRole.Captain
            ? {
                car_number: carNumber.trim(),
                car_model: carModel.trim() || undefined,
              }
            : undefined,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const onLastStep = safeStepIndex === steps.length - 1;
  const cardMax = layout.isWide ? 560 : layout.isMedium ? 540 : '100%';

  return (
    <Screen background={Colors.surface}>
      <Header onBack={goBack} title={t('auth.joinTwsila')} transparent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { alignItems: 'center' }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { maxWidth: cardMax }]}>
            <View style={styles.stepperWrap}>
              <Stepper steps={steps} currentIndex={safeStepIndex} />
            </View>

            <Text style={styles.subtitle}>{t('auth.joinSubtitle')}</Text>

            {submitError ? (
              <Banner
                tone="error"
                title={t('common.error')}
                description={submitError}
                style={{ marginBottom: Spacing.md }}
              />
            ) : null}

            {currentStep === 'role' ? (
              <RoleStep role={role} setRole={setRole} t={t} />
            ) : null}

            {currentStep === 'account' ? (
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
                  label={t('auth.password')}
                  placeholder={t('auth.passwordPlaceholder')}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                  helper={t('auth.passwordHelper')}
                />
              </View>
            ) : null}

            {currentStep === 'vehicle' ? (
              <View style={styles.formCard}>
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
                <Banner
                  tone="info"
                  title={t('auth.captainDesc')}
                  compact
                  style={{ marginTop: Spacing.xs }}
                />
              </View>
            ) : null}

            {onLastStep ? (
              <Pressable style={styles.termsRow} onPress={() => setTerms((v) => !v)}>
                <View
                  style={[
                    styles.checkbox,
                    terms && {
                      backgroundColor: Colors.primary,
                      borderColor: Colors.primary,
                    },
                  ]}
                >
                  {terms ? (
                    <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />
                  ) : null}
                </View>
                <Text style={styles.termsText}>
                  {t('auth.iAgree')}{' '}
                  <Text style={styles.link}>{t('auth.termsOfService')}</Text>{' '}
                  {t('auth.and')}{' '}
                  <Text style={styles.link}>{t('auth.privacyPolicy')}</Text>
                </Text>
              </Pressable>
            ) : null}
            {onLastStep && errors.terms ? (
              <Text style={styles.errorTxt}>{errors.terms}</Text>
            ) : null}

            <View style={styles.actionsRow}>
              {safeStepIndex > 0 ? (
                <Button
                  title={t('common.previous')}
                  variant="outline"
                  onPress={goBack}
                  fullWidth={false}
                  style={{ minWidth: 120 }}
                />
              ) : null}
              <View style={{ flex: 1 }} />
              {!onLastStep ? (
                <Button
                  title={t('auth.continue')}
                  onPress={goNext}
                  fullWidth={false}
                  style={{ minWidth: 160 }}
                  rightIcon={
                    <Ionicons name="arrow-forward" size={16} color={Colors.onPrimary} />
                  }
                />
              ) : (
                <Button
                  title={t('auth.createAccountCta')}
                  onPress={handleSubmit}
                  loading={loading}
                  fullWidth={false}
                  style={{ minWidth: 200 }}
                />
              )}
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>{t('auth.alreadyHaveAccount')} </Text>
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

const RoleStep: React.FC<{
  role: UserRoleValue;
  setRole: (r: UserRoleValue) => void;
  t: (k: string) => string;
}> = ({ role, setRole, t }) => {
  const options = [
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
  ];

  return (
    <View>
      <Text style={styles.sectionLabel}>{t('auth.chooseRole')}</Text>
      <View style={styles.rolesRow}>
        {options.map((r) => {
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
              {active ? (
                <View style={styles.roleCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  stepperWrap: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginBottom: Spacing.lg,
    lineHeight: 18,
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
    minHeight: 130,
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
    lineHeight: 16,
  },
  roleCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    marginTop: Spacing.md,
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
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  errorTxt: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: FontFamily.medium,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  bottomText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
});
