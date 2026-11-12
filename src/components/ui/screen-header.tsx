import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { colors } from '@/theme/colors';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'royal';
  showBack?: boolean;
  onBackPress?: () => void;
  showHospitalBadge?: boolean;
  hospitalText?: string;
  trailingActions?: {
    icon: IconName;
    onPress: () => void;
    accessibilityLabel?: string;
    badgeCount?: number;
  }[];
  rightElement?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({
  title,
  subtitle,
  variant = 'default',
  showBack = false,
  onBackPress,
  showHospitalBadge = true,
  hospitalText = 'MTRH Outpatient Portal',
  trailingActions,
  rightElement,
  style,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const isRoyal = variant === 'royal';

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        isRoyal ? styles.wrapperRoyal : null,
        { paddingTop: Math.max(insets.top, 12) },
        style,
      ]}>
      {showHospitalBadge && !isRoyal ? (
        <View style={styles.hospitalStrip}>
          <View style={styles.hospitalLeft}>
            <View style={styles.hospitalIcon}>
              <Icon name="local_hospital" filled size={14} color={colors.primaryContainer} />
            </View>
            <AppText variant="label-sm" color={colors.textMuted} weight={600}>
              {hospitalText}
            </AppText>
          </View>
          <View style={styles.triageBadge}>
            <View style={styles.pulseDot} />
            <AppText variant="label-sm" weight={700} color={colors.primaryContainer}>
              Triage Live
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.bar}>
        <View style={styles.leftSlot}>
          {showBack ? (
            <PressableScale
              onPress={handleBack}
              style={[styles.actionBtn, isRoyal ? styles.actionBtnRoyal : null]}
              accessibilityLabel="Navigate Back">
              <Icon name="arrow_back" size={22} color={isRoyal ? colors.white : colors.brandNavy} />
            </PressableScale>
          ) : null}

          {title ? (
            <View style={styles.titleColumn}>
              <AppText
                variant="headline-md"
                weight={700}
                color={isRoyal ? colors.white : colors.brandNavy}
                numberOfLines={1}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText
                  variant="body-sm"
                  color={isRoyal ? 'rgba(255, 255, 255, 0.85)' : colors.textMuted}
                  numberOfLines={1}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.rightSlot}>
          {trailingActions?.map((action, idx) => (
            <PressableScale
              key={idx}
              onPress={action.onPress}
              style={[styles.actionBtn, isRoyal ? styles.actionBtnRoyal : null]}
              accessibilityLabel={action.accessibilityLabel}>
              <Icon name={action.icon} size={20} color={isRoyal ? colors.white : colors.brandNavy} />
            </PressableScale>
          ))}
          {rightElement}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    zIndex: 40,
  },
  wrapperRoyal: {
    backgroundColor: colors.brandBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  hospitalStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  hospitalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hospitalIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brandGreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryContainer,
  },
  bar: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  titleColumn: {
    flex: 1,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnRoyal: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
