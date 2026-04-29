import i18n from '../i18n';

export const formatCurrency = (value: number): string => {
  const symbol = i18n.t('common.currency');
  const rounded = Math.round(value);
  return `${rounded.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')} ${symbol}`;
};

export const formatDistance = (km: number): string => {
  const lang = i18n.t('common.km');
  return `${km.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} ${lang}`;
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

export const toIsoDate = (date: Date): string =>
  date.toISOString().split('T')[0];

export const dayOfWeek = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
};

export const formatLongDate = (date: Date | string, lang?: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(lang || (i18n.language === 'ar' ? 'ar-EG' : 'en-US'), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
};

export const formatCityName = (address: string): string => {
  if (!address) return '';
  const parts = address.split(/[,•·–—-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    // If it's "Street, City, Country" -> parts[1] is city
    // If it's "City, Country" -> parts[0] is city
    return parts.length >= 3 ? parts[0] : parts[0];
  }
  return address;
};
