import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors } from '@/theme/colors';
import {
  typography,
  type FontFamilyName,
  type FontWeight,
  type TypographyVariant,
} from '@/theme/typography';

export interface AppTextProps extends TextProps {
  /** Design-system type style (defaults to `body-md`). */
  variant?: TypographyVariant;
  /** Weight override — Tailwind `font-medium` = 500, `font-semibold` = 600, `font-bold` = 700, `font-extrabold` = 800. */
  weight?: FontWeight;
  /** Family override for the rare cases a design mixes families. */
  family?: FontFamilyName;
  color?: string;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
}

/**
 * The only text primitive screens should use. Resolves the correct custom
 * font file for the requested weight and disables Android font padding so
 * line-heights match the web designs exactly.
 */
export function AppText({
  variant = 'body-md',
  weight,
  family,
  color = colors.brandNavy,
  align,
  uppercase,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        typography(variant, { weight, family }),
        { color },
        align ? { textAlign: align } : null,
        uppercase ? styles.uppercase : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
  uppercase: { textTransform: 'uppercase' },
});
