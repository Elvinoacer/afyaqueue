import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, palette } from '@/theme/colors';
import { layout, radius, shadows } from '@/theme/metrics';
import type { TypographyVariant } from '@/theme/typography';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

export type ButtonVariant =
  /** Orange conversion CTA (`bg-[#F27438]`). */
  | 'primary'
  /** Royal-blue solid (`bg-secondary`), e.g. "Track Live Queue". */
  | 'blue'
  /** Forest-green solid, e.g. "Save Doctor". */
  | 'green'
  /** Deep rust (`bg-tertiary`), e.g. "Broadcast Live Announcement". */
  | 'rust'
  /** Soft blue (`bg-brand-blue-soft text-secondary`). */
  | 'secondary'
  /** White with blue outline (`border-secondary text-secondary`). */
  | 'outline'
  /** Neutral grey (`bg-surface-container-high`). */
  | 'neutral'
  /** Red destructive outline. */
  | 'danger'
  /** Soft red fill (`bg-red-100 text-status-danger`). */
  | 'dangerSoft'
  /** Text-only. */
  | 'ghost';

interface VariantStyle {
  bg: string;
  fg: string;
  border?: string;
  shadow?: ViewStyle;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: colors.brandOrange, fg: colors.white, shadow: shadows.cta },
  blue: { bg: colors.secondary, fg: colors.white, shadow: shadows.ctaBlue },
  green: { bg: colors.primaryContainer, fg: colors.white, shadow: shadows.sm },
  rust: { bg: colors.tertiary, fg: colors.white, shadow: shadows.md },
  secondary: { bg: colors.brandBlueSoft, fg: colors.secondary },
  outline: { bg: colors.surfaceCard, fg: colors.secondary, border: colors.secondary },
  neutral: { bg: colors.surfaceContainerHigh, fg: colors.brandNavy },
  danger: { bg: colors.surfaceCard, fg: colors.statusDanger, border: palette.red200 },
  dangerSoft: { bg: palette.red100, fg: colors.statusDanger, border: palette.red200 },
  ghost: { bg: colors.transparent, fg: colors.textMuted },
};

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Leading Material Symbol. */
  icon?: IconName;
  /** Trailing Material Symbol (designs commonly use `arrow_forward`). */
  trailingIcon?: IconName;
  iconSize?: number;
  /** Height in px. Defaults to 48 (touch-target minimum). */
  height?: number;
  textVariant?: TypographyVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Override corner radius (defaults to 12 / `rounded-xl`). */
  rounded?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  iconSize = 20,
  height = layout.buttonHeight,
  textVariant = 'label-lg',
  loading,
  disabled,
  fullWidth = true,
  rounded = radius.xl,
  style,
  children,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const v = VARIANTS[variant];
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      activeScale={0.98}
      style={[
        styles.base,
        {
          height,
          borderRadius: rounded,
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1 : 0,
        },
        fullWidth ? styles.fullWidth : null,
        v.shadow,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={iconSize} color={v.fg} /> : null}
          <AppText variant={textVariant} weight={700} color={v.fg}>
            {label}
          </AppText>
          {children}
          {trailingIcon ? <Icon name={trailingIcon} size={iconSize} color={v.fg} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
