export const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('0')) {
    return '+20' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
};

export const isValidPhone = (phone: string): boolean => {
  const cleaned = normalizePhone(phone);
  return /^\+201[0125]\d{8}$/.test(cleaned);
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (password: string): boolean =>
  password.length >= 8;

export const isNonEmpty = (value: string | undefined | null): boolean =>
  !!value && value.trim().length > 0;
