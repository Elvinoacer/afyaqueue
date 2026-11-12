import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

import { AppText } from './app-text';
import { Icon } from './icon';

export interface QueueCenterpieceProps {
  queueNumber: number | string;
  label?: string;
  subtitle?: string;
  etaText?: string;
  isTurn?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function QueueCenterpiece({
  queueNumber,
  label = 'YOUR QUEUE NUMBER',
  subtitle,
  etaText = 'Est: ~10:00 AM',
  isTurn = false,
  style,
}: QueueCenterpieceProps) {
  const ringColor = isTurn ? colors.primaryContainer : colors.secondary;
  const fillColor = isTurn ? colors.brandGreenSoft : colors.brandBlueSoft;

  return (
    <View style={[styles.haloContainer, style]}>
      {/* Outer ambient decorative glows */}
      <View style={styles.ambientTopRight} />
      <View style={styles.ambientBottomLeft} />

      {/* Main 180x180 circle centerpiece */}
      <View
        style={[
          styles.circle,
          {
            backgroundColor: fillColor,
            borderColor: ringColor,
          },
        ]}>
        <AppText
          variant="overline"
          weight={800}
          color={ringColor}
          uppercase
          style={styles.overline}>
          {isTurn ? "IT'S YOUR TURN" : label}
        </AppText>

        <AppText
          variant="display-giant"
          weight={800}
          color={colors.brandNavy}
          style={styles.giantNumber}>
          {queueNumber}
        </AppText>

        <View style={styles.subtitleRow}>
          <Icon name="alarm" size={14} color={ringColor} />
          <AppText variant="body-sm" weight={600} color={colors.textMuted}>
            {subtitle ?? etaText}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  haloContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  ambientTopRight: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EBF1FF',
    opacity: 0.6,
  },
  ambientBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.brandGreenSoft,
    opacity: 0.6,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    zIndex: 2,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  overline: {
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  giantNumber: {
    fontSize: 54,
    lineHeight: 60,
    textAlign: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
});
