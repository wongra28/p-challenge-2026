import { StyleSheet } from 'react-native';

export const colors = {
  // Backgrounds — Spark DS "1. Color modes" (dark)
  bgPrimary: '#0C111D',
  bgSecondary: '#161B26',
  bgTertiary: '#1F242F',
  bgQuaternary: '#1F242F',
  bgBrandSolid: '#7F56D9',
  bgBrandSolidHover: '#6941C6',
  bgActive: '#1F242F',
  bgDisabled: '#333741',
  bgDisabledSubtle: '#1F242F',
  bgOverlay: 'rgba(12,17,29,0.7)',
  bgErrorSolid: '#D92D20',
  bgSuccessSolid: '#079455',

  // Text
  textPrimary: '#F5F5F6',
  textSecondary: '#94969C',
  textTertiary: '#85888E',
  textWhite: '#FFFFFF',
  textDisabled: '#85888E',
  textBrand: '#B692F6',
  textError: '#F97066',
  textSuccess: '#75E0A7',
  textAmber: '#FDB022',

  // Border
  borderPrimary: '#333741',
  borderSecondary: '#1F242F',
  borderBrand: '#7F56D9',
  borderBrandAlt: '#B692F6',
  borderError: '#F04438',

  // Semantic — PRD: amber for trade-offs, never red
  amber: '#F79009',
  amberBg: '#27200E',
  success: '#17B26A',
  successBg: '#0D2B1A',

  // Domain-specific — from spec CSS
  court: '#2E6BB0',

  // Band colours (1-7, low to high)
  bandNew: '#47CD89',
  band1: '#F97066',
  band2: '#FDB022',
  band3: '#F79009',
  band4: '#A78BFA',
  band5: '#B692F6',
  band6: '#7F56D9',
  band7: '#2E90FA',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '9xl': 80,
} as const;

export const radius = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  full: 9999,
} as const;

export const fonts = {
  display: 'ClashGrotesk-Semibold',
  displayMedium: 'ClashGrotesk-Medium',
  body: 'InstrumentSans-Regular',
  bodyMedium: 'InstrumentSans-Medium',
  bodySemibold: 'InstrumentSans-SemiBold',
} as const;

export const type = StyleSheet.create({
  displayLg: { fontSize: 30, lineHeight: 38, fontFamily: fonts.display, letterSpacing: -0.6, color: colors.textPrimary },
  displaySm: { fontSize: 24, lineHeight: 32, fontFamily: fonts.display, letterSpacing: -0.48, color: colors.textPrimary },
  textXl: { fontSize: 20, lineHeight: 30, fontFamily: fonts.body, color: colors.textPrimary },
  textLg: { fontSize: 18, lineHeight: 28, fontFamily: fonts.body, color: colors.textPrimary },
  textMd: { fontSize: 16, lineHeight: 24, fontFamily: fonts.body, color: colors.textPrimary },
  textSm: { fontSize: 14, lineHeight: 20, fontFamily: fonts.body, color: colors.textPrimary },
  textXs: { fontSize: 12, lineHeight: 18, fontFamily: fonts.body, color: colors.textSecondary },
  labelLg: { fontSize: 18, lineHeight: 28, fontFamily: fonts.bodySemibold, color: colors.textPrimary },
  labelMd: { fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyMedium, color: colors.textPrimary },
  labelSm: { fontSize: 12, lineHeight: 18, fontFamily: fonts.bodyMedium, color: colors.textPrimary },
  labelXs: { fontSize: 11, lineHeight: 18, fontFamily: fonts.bodyMedium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  mono: { fontSize: 13, fontFamily: 'monospace', color: colors.textSecondary },
});

export function bandColor(band: number | null): string {
  if (band === null) return colors.bandNew;
  const key = `band${band}` as keyof typeof colors;
  return colors[key] ?? colors.textSecondary;
}

export function bandLabel(band: number | null): string {
  if (band === null) return 'new';
  if (band <= 1) return 'starter';
  if (band <= 2) return 'developing';
  if (band <= 3) return 'progressing';
  if (band <= 4) return 'competitive';
  if (band <= 5) return 'strong';
  if (band <= 6) return 'advanced';
  return 'elite';
}
