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

const truncateLabel = (value: string, maxLen: number): string => {
  const t = value.trim();
  if (!t) return '';
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, Math.max(4, maxLen - 1)).trim();
  return `${slice}…`;
};

/** Heuristic: last segment is often country; city is usually just before it. */
const isLikelyCountrySegment = (segment: string): boolean => {
  const t = segment.trim().toLowerCase();
  if (t.length < 3) return false;
  const hints = [
    'egypt',
    'مصر',
    'emirates',
    'الإمارات',
    'uae',
    'saudi',
    'السعودية',
    'kuwait',
    'الكويت',
    'qatar',
    'قطر',
    'bahrain',
    'البحرين',
    'oman',
    'عمان',
    'jordan',
    'الأردن',
    'iraq',
    'العراق',
    'syria',
    'سوريا',
    'lebanon',
    'لبنان',
    'palestine',
    'فلسطين',
    'morocco',
    'المغرب',
    'tunisia',
    'تونس',
    'algeria',
    'الجزائر',
    'libya',
    'ليبيا',
    'sudan',
    'السودان',
    'yemen',
    'اليمن',
    'usa',
    'united states',
    'united kingdom',
    'england',
    'france',
    'germany',
    'spain',
    'italy',
    'india',
    'china',
  ];
  return hints.some((h) => t === h || t.includes(h));
};

/** Best-effort city / locality from a formatted address line. */
export const extractCityFromAddress = (address: string): string => {
  if (!address) return '';
  const normalized = address.replace(/\u060C/g, ',').trim();
  const parts = normalized.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return parts[parts.length - 2];
  }
  if (parts.length === 2) {
    const a = parts[0];
    const b = parts[1];
    if (isLikelyCountrySegment(b)) return a;
    return b;
  }
  if (parts.length === 1) {
    const dashParts = normalized.split(/\s*[-–—]\s/).map((p) => p.trim()).filter(Boolean);
    if (dashParts.length >= 2) return dashParts[dashParts.length - 1];
    return parts[0];
  }
  return normalized;
};

/** City-style label for UI (Arabic-friendly when address came from Maps `language=ar`). */
export const formatCityName = (address: string, maxLen = 80): string =>
  truncateLabel(extractCityFromAddress(address), maxLen);

/** @deprecated Prefer formatCityName — same behavior (city/locality only). */
export const formatPlaceName = (address: string, maxLen = 56): string =>
  formatCityName(address, maxLen);
