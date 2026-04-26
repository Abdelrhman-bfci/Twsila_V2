/**
 * Twsila V2 — "Academic Transit Modern" palette
 *
 * The palette is anchored by Indigo Blue for institutional reliability,
 * Emerald Green for success states & financial actions, and a soft cool
 * gray neutral scale.
 */
export const Colors = {
  // ─── Primary: Indigo ───
  primary: '#1F108E',
  primaryLight: '#3730A3',
  primaryDark: '#0F0069',
  primarySoft: '#E2DFFF',
  primaryFixed: '#E2DFFF',
  primaryFixedDim: '#C3C0FF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#A9A7FF',
  primaryContainer: '#3730A3',

  // ─── Secondary: Emerald ───
  secondary: '#006C4A',
  secondaryLight: '#82F5C1',
  secondaryDark: '#005137',
  secondarySoft: '#E6FAF1',
  secondaryFixed: '#85F8C4',
  secondaryFixedDim: '#68DBA9',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#82F5C1',
  onSecondaryContainer: '#00714E',

  // ─── Tertiary: Amber (alerts/pending) ───
  tertiary: '#603B00',
  tertiaryLight: '#FFB95F',
  tertiarySoft: '#FFDDB8',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#F49D09',

  // ─── Backgrounds / Surfaces ───
  background: '#F9F9FF',
  surface: '#F9F9FF',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#F0F3FF',
  surface1: '#E7EEFE',
  surface2: '#E2E8F8',
  surface3: '#DCE2F3',
  surfaceVariant: '#DCE2F3',
  surfaceDim: '#D3DAEA',

  // ─── Text ───
  text: '#151C27',
  textSecondary: '#464553',
  textLight: '#777584',
  onSurface: '#151C27',
  onSurfaceVariant: '#464553',
  onBackground: '#151C27',

  // ─── Borders / Outlines ───
  border: '#C8C4D5',
  borderLight: '#DCE2F3',
  outline: '#777584',
  outlineVariant: '#C8C4D5',

  // ─── Status ───
  error: '#BA1A1A',
  errorSoft: '#FFDAD6',
  onError: '#FFFFFF',
  onErrorContainer: '#93000A',
  success: '#006C4A',
  successSoft: '#E6FAF1',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  info: '#3B82F6',
  infoSoft: '#EFF6FF',

  // ─── Brand decoratives ───
  glass: 'rgba(255,255,255,0.85)',
  glassDark: 'rgba(15,23,42,0.04)',

  // ─── Base ───
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15,23,42,0.5)',
} as const;
