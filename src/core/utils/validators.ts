export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^\+?\d{10,15}$/.test(cleaned);
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (password: string): boolean =>
  password.length >= 8;

export const isNonEmpty = (value: string | undefined | null): boolean =>
  !!value && value.trim().length > 0;
