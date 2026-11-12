import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, shadows } from '@/theme/metrics';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Internal padding (defaults to 16 / `p-4`). */
  padding?: number;
  /** Level-1 ambient shadow (`shadow-sm`). Default true. */
  elevated?: boolean;
  testID?: string;
}

/**
 * Level-1 contained surface: white, 1px `#E2E8F0` hairline, 12px radius.
 */
export function Card({ children, style, padding = 16, elevated = true, testID }: CardProps) {
  return (
    <View testID={testID} style={[styles.card, { padding }, elevated ? shadows.sm : null, style]}>
      {children}
    </View>
  );
}

export function Divider({ style, color = colors.borderSubtle }: { style?: StyleProp<ViewStyle>; color?: string }) {
  return <View style={[styles.divider, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  divider: { height: StyleSheet.hairlineWidth * 2, alignSelf: 'stretch' },
});
