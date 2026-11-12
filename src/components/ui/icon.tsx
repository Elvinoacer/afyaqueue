import { memo } from 'react';
import { Platform, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { ICON_FONT, ICON_FONT_FILLED } from '@/theme/fonts';

import glyphMap from './material-symbols-glyphs.json';

export type IconName = keyof typeof glyphMap;

export interface IconProps {
  /** Material Symbols name exactly as used in the designs, e.g. `"local_hospital"`. */
  name: IconName;
  /** Glyph box size in px (Tailwind `text-[20px]`). Default 24. */
  size?: number;
  color?: string;
  /** Equivalent to `font-variation-settings: 'FILL' 1`. */
  filled?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/**
 * Material Symbols Outlined icon rendered from a bundled static font
 * (wght 400, opsz 24, GRAD 0). Two instances are bundled — FILL 0 and FILL 1 —
 * because React Native cannot drive variable-font axes at runtime.
 */
export const Icon = memo(function Icon({
  name,
  size = 24,
  color = colors.brandNavy,
  filled = false,
  style,
  accessibilityLabel,
}: IconProps) {
  const code = glyphMap[name];
  return (
    <Text
      allowFontScaling={false}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      selectable={false}
      style={[
        styles.base,
        {
          fontFamily: filled ? ICON_FONT_FILLED : ICON_FONT,
          fontSize: size,
          lineHeight: size,
          width: size,
          height: size,
          color,
        },
        style,
      ]}>
      {code ? String.fromCodePoint(code) : '?'}
    </Text>
  );
});

const styles = StyleSheet.create({
  base: {
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...Platform.select({ web: { userSelect: 'none' } as TextStyle, default: {} }),
  },
});
