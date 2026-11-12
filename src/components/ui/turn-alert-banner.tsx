import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/metrics';

import { AppText } from './app-text';
import { Icon } from './icon';

export interface TurnAlertBannerProps {
  isTurn: boolean;
  room?: string;
  doctorName?: string;
  peopleAhead?: number;
  style?: StyleProp<ViewStyle>;
}

export function TurnAlertBanner({
  isTurn,
  room = 'Room 14',
  doctorName = 'Dr. Sarah Wanjiku',
  peopleAhead = 5,
  style,
}: TurnAlertBannerProps) {
  if (isTurn) {
    return (
      <View style={[styles.urgentCard, style]}>
        <View style={styles.urgentLeftIcon}>
          <Icon name="check_circle" filled size={26} color={colors.primaryContainer} />
        </View>
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <AppText variant="headline-md" weight={800} color={colors.brandNavy}>
              {"It's your turn!"}
            </AppText>
            <View style={styles.nowBadge}>
              <AppText variant="overline" weight={800} color={colors.white}>
                NOW SERVING
              </AppText>
            </View>
          </View>
          <AppText variant="body-md" weight={600} color={colors.brandNavy} style={styles.mt1}>
            Please proceed immediately to <AppText weight={800} color={colors.primaryContainer}>{room}</AppText> to see {doctorName}.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.upcomingCard, style]}>
      <View style={styles.upcomingLeftIcon}>
        <Icon name="notifications_active" size={24} color={colors.secondary} />
      </View>
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
            {peopleAhead <= 2 ? 'Almost your turn!' : 'Queue in Progress'}
          </AppText>
          <View style={styles.upcomingBadge}>
            <AppText variant="overline" weight={700} color={colors.white}>
              UPCOMING
            </AppText>
          </View>
        </View>
        <AppText variant="body-sm" color={colors.textMuted} style={styles.mt1}>
          Keep your app open and stay within earshot of {room}. Audio notification will chime automatically.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  urgentCard: {
    backgroundColor: colors.brandGreenSoft,
    borderWidth: 1.5,
    borderColor: colors.primaryContainer,
    borderRadius: radius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  urgentLeftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: 'rgba(39, 82, 183, 0.3)',
    borderRadius: radius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  upcomingLeftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nowBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  upcomingBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  mt1: {
    marginTop: 4,
  },
});
