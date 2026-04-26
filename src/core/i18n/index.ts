import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import ar from './locales/ar.json';

const LANGUAGE_KEY = '@twsila_v2_language';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

export type AppLanguage = 'en' | 'ar';

const detectInitialLanguage = async (): Promise<AppLanguage> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
  } catch {
    // ignore — fall back to device locale
  }
  const device = Localization.getLocales()?.[0]?.languageCode || 'ar';
  return device === 'en' ? 'en' : 'ar';
};

export const initI18n = async (): Promise<AppLanguage> => {
  const language = await detectInitialLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'ar',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });

  const shouldBeRTL = language === 'ar';
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }

  return language;
};

export const changeLanguage = async (language: AppLanguage): Promise<boolean> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);

  const shouldBeRTL = language === 'ar';
  const reloadNeeded = I18nManager.isRTL !== shouldBeRTL;
  if (reloadNeeded) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
  return reloadNeeded;
};

export const getCurrentLanguage = (): AppLanguage =>
  (i18n.language as AppLanguage) || 'ar';

export const isRTL = (): boolean => getCurrentLanguage() === 'ar';

export default i18n;
