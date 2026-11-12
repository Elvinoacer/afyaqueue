import { Platform, type ViewStyle } from 'react-native';

/**
 * Spacing, radius and elevation tokens.
 *
 * NOTE: the designs override Tailwind's default radius scale:
 *   rounded      → 4px   (radius.sm)
 *   rounded-md   → 6px   (Tailwind default)
 *   rounded-lg   → 8px   (radius.lg)
 *   rounded-xl   → 12px  (radius.xl)
 *   rounded-2xl  → 16px  (Tailwind default)
 *   rounded-3xl  → 24px  (Tailwind default)
 *   rounded-full → 9999
 */
export const spacing = {
  /** 4px */ xs: 4,
  /** 8px */ sm: 8,
  /** 12px */ gutterSm: 12,
  /** 16px */ md: 16,
  /** 24px */ lg: 24,
  /** 32px */ xl: 32,
  /** 48px */ xxl: 48,
  /** Screen horizontal margin (16px on phones). */
  margin: 16,
  marginMd: 24,
  marginLg: 32,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

/** Fixed layout metrics from DESIGN.md. */
export const layout = {
  appBarHeight: 56,
  bottomNavHeight: 56,
  inputHeight: 48,
  buttonHeight: 48,
  /** Designs are authored on a 390px wide frame. */
  designWidth: 390,
} as const;

const NAVY = '#16264A';

function shadow(
  offsetY: number,
  blur: number,
  opacity: number,
  elevation: number,
  color = NAVY,
): ViewStyle {
  return Platform.select<ViewStyle>({
    web: { boxShadow: `0px ${offsetY}px ${blur}px ${hexToRgba(color, opacity)}` } as ViewStyle,
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blur / 2,
      elevation,
    },
  })!;
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Elevation levels (DESIGN.md › Elevation & Depth) plus Tailwind equivalents.
 * Prefer hairline borders + tonal fills; use shadows sparingly.
 */
export const shadows = {
  none: {} as ViewStyle,
  /** Tailwind `shadow-sm` / Level 1 ambient bloom. */
  sm: shadow(1, 3, 0.05, 1),
  /** Tailwind `shadow` / `shadow-md` / Level 2 raised focus. */
  md: shadow(4, 8, 0.07, 3),
  /** Tailwind `shadow-lg` / Level 3 sticky anchors, sheets. */
  lg: shadow(10, 18, 0.1, 8),
  /** Tailwind `shadow-xl` / `shadow-2xl`. */
  xl: shadow(20, 30, 0.14, 14),
  /** Orange CTA glow (`shadow-lg shadow-orange-500/20`). */
  cta: shadow(8, 18, 0.25, 6, '#F27438'),
  /** Royal blue CTA glow. */
  ctaBlue: shadow(8, 18, 0.22, 6, '#2752B7'),
} as const;

export { hexToRgba };
