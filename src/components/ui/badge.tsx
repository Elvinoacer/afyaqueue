import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, palette } from '@/theme/colors';
import { radius } from '@/theme/metrics';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

export type BadgeVariant =
  | 'success' // Green soft (#E6F4EC, fg: #1E7A46)
  | 'info' // Blue soft (#EBF1FF, fg: #2752B7)
  | 'warning' // Amber/orange soft (#FFF7ED, fg: #C1541A)
  | 'danger' // Red soft (#FEE2E2, fg: #DC2626)
  | 'neutral' // Grey (#ECEEF0, fg: #16264A)
  | 'primary' // Solid Green (#1E7A46, fg: white)
  | 'royal'; // Solid Royal Blue (#2752B7, fg: white)

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: IconName;
  iconFilled?: boolean;
  size?: 'sm' | 'md';
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; fg: string; border?: string }> = {
  success: { bg: colors.brandGreenSoft, fg: colors.primaryContainer, border: colors.brandGreenSoft },
  info: { bg: colors.brandBlueSoft, fg: colors.secondary, border: colors.brandBlueSoft },
  warning: { bg: '#FFF7ED', fg: colors.brandAccentRust, border: '#FED7AA' },
  danger: { bg: palette.red100, fg: colors.statusDanger, border: palette.red200 },
  neutral: { bg: colors.surfaceContainer, fg: colors.brandNavy, border: colors.borderSubtle },
  primary: { bg: colors.primaryContainer, fg: colors.white },
  royal: { bg: colors.secondary, fg: colors.white },
};

export function Badge({
  label,
  variant = 'neutral',
  icon,
  iconFilled = false,
  size = 'md',
  onPress,
  selected,
  style,
  children,
}: BadgeProps) {
  let v = BADGE_STYLES[variant];
  if (selected !== undefined) {
    v = selected ? BADGE_STYLES.primary : BADGE_STYLES.neutral;
  }

  const isSmall = size === 'sm';

  const content = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style,
      ]}>
      {icon ? (
        <Icon
          name={icon}
          filled={iconFilled}
          size={isSmall ? 12 : 14}
          color={v.fg}
          style={styles.icon}
        />
      ) : null}
      <AppText
        variant={isSmall ? 'label-sm' : 'label-md'}
        weight={700}
        color={v.fg}>
        {label}
      </AppText>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} activeScale={0.95}>
        {content}
      </PressableScale>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});
