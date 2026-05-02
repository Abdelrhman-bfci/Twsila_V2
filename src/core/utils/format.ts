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

/** First segment of a geocoded line (POI / area name), not the full address. */
export const formatPlaceName = (address: string, maxLen = 56): string => {
  if (!address) return '';
  const normalized = address.replace(/\u060C/g, ',').trim();
  const parts = normalized.split(',').map((p) => p.trim()).filter(Boolean);
  const head = parts[0] || normalized;
  if (head.length <= maxLen) return head;
  const slice = head.slice(0, Math.max(4, maxLen - 1)).trim();
  return `${slice}…`;
};

/** Short location label (legacy callers); prefers the leading place segment. */
export const formatCityName = (address: string): string =>
  formatPlaceName(address, 120);
