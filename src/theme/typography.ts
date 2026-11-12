import type { TextStyle } from 'react-native';

/**
 * Typography tokens for the "Clinical Motion" design system.
 *
 * React Native cannot synthesise weights for custom fonts on Android, so each
 * weight is a separately loaded font family (see `src/theme/fonts.ts`).
 * Use `fontFamily(family, weight)` or the `<AppText variant weight />`
 * component instead of `fontWeight`.
 */

export type FontFamilyName = 'jakarta' | 'inter' | 'mono';
export type FontWeight = 400 | 500 | 600 | 700 | 800;

const FAMILIES: Record<FontFamilyName, Partial<Record<FontWeight, string>>> = {
  jakarta: {
    400: 'PlusJakartaSans_400Regular',
    500: 'PlusJakartaSans_500Medium',
    600: 'PlusJakartaSans_600SemiBold',
    700: 'PlusJakartaSans_700Bold',
    800: 'PlusJakartaSans_800ExtraBold',
  },
  inter: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
    800: 'Inter_800ExtraBold',
  },
  mono: {
    400: 'JetBrainsMono_500Medium',
    500: 'JetBrainsMono_500Medium',
    600: 'JetBrainsMono_700Bold',
    700: 'JetBrainsMono_700Bold',
    800: 'JetBrainsMono_700Bold',
  },
};

/** Resolve the loaded font family name for a family + weight pair. */
export function fontFamily(family: FontFamilyName, weight: FontWeight): string {
  const map = FAMILIES[family];
  return map[weight] ?? map[400] ?? map[500]!;
}

interface VariantSpec {
  family: FontFamilyName;
  size: number;
  lineHeight: number;
  /** Tracking in `em`, converted to px at runtime. */
  tracking: number;
  weight: FontWeight;
  uppercase?: boolean;
}

/** Mirrors the `fontSize` entries in the design Tailwind config 1:1. */
const VARIANTS = {
  'display-giant': { family: 'jakarta', size: 56, lineHeight: 64, tracking: -0.03, weight: 800 },
  'display-giant-mobile': { family: 'jakarta', size: 44, lineHeight: 52, tracking: -0.025, weight: 800 },
  'headline-xl': { family: 'jakarta', size: 32, lineHeight: 40, tracking: -0.02, weight: 700 },
  'headline-xl-mobile': { family: 'jakarta', size: 26, lineHeight: 32, tracking: -0.015, weight: 700 },
  'headline-lg': { family: 'jakarta', size: 22, lineHeight: 28, tracking: -0.01, weight: 700 },
  'headline-md': { family: 'jakarta', size: 18, lineHeight: 24, tracking: 0, weight: 600 },
  'body-lg': { family: 'inter', size: 16, lineHeight: 24, tracking: 0, weight: 400 },
  'body-md': { family: 'inter', size: 14, lineHeight: 20, tracking: 0, weight: 400 },
  'body-sm': { family: 'inter', size: 12, lineHeight: 16, tracking: 0.01, weight: 400 },
  'label-lg': { family: 'jakarta', size: 14, lineHeight: 20, tracking: 0.01, weight: 600 },
  'label-md': { family: 'jakarta', size: 12, lineHeight: 16, tracking: 0.02, weight: 600 },
  'label-sm': { family: 'jakarta', size: 11, lineHeight: 14, tracking: 0.05, weight: 700 },
  overline: { family: 'jakarta', size: 10, lineHeight: 12, tracking: 0.08, weight: 800, uppercase: true },
} satisfies Record<string, VariantSpec>;

export type TypographyVariant = keyof typeof VARIANTS;

/**
 * Build a TextStyle for a variant, optionally overriding the weight (Tailwind
 * `font-bold` etc.) or family (some designs pair `font-body-sm` with Jakarta).
 */
export function typography(
  variant: TypographyVariant,
  overrides: { weight?: FontWeight; family?: FontFamilyName } = {},
): TextStyle {
  const spec: VariantSpec = VARIANTS[variant];
  const weight = overrides.weight ?? spec.weight;
  const family = overrides.family ?? spec.family;
  return {
    fontFamily: fontFamily(family, weight),
    fontSize: spec.size,
    lineHeight: spec.lineHeight,
    letterSpacing: +(spec.tracking * spec.size).toFixed(2),
    ...(spec.uppercase ? { textTransform: 'uppercase' as const } : null),
  };
}

/** Tailwind `tracking-*` helpers expressed in px for a given font size. */
export const tracking = {
  tighter: (size: number) => -0.05 * size,
  tight: (size: number) => -0.025 * size,
  normal: () => 0,
  wide: (size: number) => 0.025 * size,
  wider: (size: number) => 0.05 * size,
  widest: (size: number) => 0.1 * size,
};

export const variants = VARIANTS;
