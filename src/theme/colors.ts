/**
 * AfyaQueue "Clinical Motion" colour tokens.
 *
 * Source of truth: `screen_designs/afyaqueue_clinical_motion/DESIGN.md` and the
 * Tailwind config embedded in every `screen_designs/<screen>/code.html`.
 * Token names mirror the Tailwind class names used in the designs so that a
 * class such as `text-brand-navy` maps 1:1 to `colors.brandNavy`.
 */
export const colors = {
  // ── Material 3 surface roles ───────────────────────────────────────────
  surface: '#f7f9fb',
  surfaceDim: '#d8dadc',
  surfaceBright: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  surfaceVariant: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#3f4940',
  inverseSurface: '#2d3133',
  inverseOnSurface: '#eff1f3',
  outline: '#6f7a70',
  outlineVariant: '#bec9be',
  surfaceTint: '#066d3a',
  background: '#f7f9fb',
  onBackground: '#191c1e',

  // ── Brand roles ────────────────────────────────────────────────────────
  primary: '#006032',
  onPrimary: '#ffffff',
  primaryContainer: '#1e7a46', // AfyaQueue forest green
  onPrimaryContainer: '#adffc2',
  inversePrimary: '#81d99b',
  primaryFixed: '#9df6b6',
  primaryFixedDim: '#81d99b',
  onPrimaryFixed: '#00210d',
  onPrimaryFixedVariant: '#00522a',

  secondary: '#2e58bd', // royal blue (system / live context)
  onSecondary: '#ffffff',
  secondaryContainer: '#7297ff',
  onSecondaryContainer: '#002c7c',
  secondaryFixed: '#dbe1ff',
  secondaryFixedDim: '#b3c5ff',
  onSecondaryFixed: '#00174a',
  onSecondaryFixedVariant: '#063fa4',

  tertiary: '#913500',
  onTertiary: '#ffffff',
  tertiaryContainer: '#b6480b',
  onTertiaryContainer: '#ffe8df',
  tertiaryFixed: '#ffdbcd',
  tertiaryFixedDim: '#ffb597',
  onTertiaryFixed: '#360f00',
  onTertiaryFixedVariant: '#7d2d00',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // ── AfyaQueue custom tokens ───────────────────────────────────────────
  brandGreen: '#1E7A46',
  brandGreenSoft: '#E6F4EC',
  brandBlue: '#2752B7',
  brandBlueSoft: '#EBF1FF',
  brandNavy: '#16264A',
  brandAccentRust: '#C1541A',
  brandOrange: '#F27438', // primary CTA (Log In, Confirm Booking, Call Next)
  surfaceCard: '#FFFFFF',
  borderSubtle: '#E2E8F0',
  textMuted: '#64748B',
  statusDanger: '#DC2626',

  // ── Splash ("The Vital Bypass") ────────────────────────────────────────
  obsidian: '#060A12',
  obsidianElevated: '#0C1220',
  obsidianCard: '#101827',
  clinicalCyan: '#0EA5E9',
  surgicalEmerald: '#1E7A46',
  vitalGlow: '#22C55E',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/**
 * Subset of the default Tailwind palette referenced by the designs
 * (e.g. `bg-amber-50`, `text-emerald-400`, `border-slate-800`).
 */
export const palette = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  orange50: '#fff7ed',
  orange100: '#ffedd5',
  orange200: '#fed7aa',
  orange600: '#ea580c',
  orange700: '#c2410c',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  green50: '#f0fdf4',
  green500: '#22c55e',
  green600: '#16a34a',
  emerald50: '#ecfdf5',
  emerald200: '#a7f3d0',
  emerald300: '#6ee7b7',
  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065f46',
  emerald950: '#022c22',
  sky200: '#bae6fd',
  sky300: '#7dd3fc',
  sky400: '#38bdf8',
  sky500: '#0ea5e9',
  sky700: '#0369a1',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  rose500: '#f43f5e',
  pink500: '#ec4899',
  purple50: '#faf5ff',
  purple600: '#9333ea',
} as const;

/** Apply an alpha channel (0–1) to a `#RRGGBB` colour, e.g. Tailwind `/40`. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${clean.slice(0, 6)}${a}`;
}

export type ColorToken = keyof typeof colors;
