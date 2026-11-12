import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { colors, palette } from '@/theme/colors';
import { radius, shadows } from '@/theme/metrics';
import { DOCTOR_IMAGES } from '@/store/mock-data';
import type { Doctor } from '@/types/models';

import { AppText } from './app-text';
import { Button } from './button';
import { Icon } from './icon';
import { PressableScale } from './pressable-scale';

export interface DoctorCardProps {
  doctor: Doctor;
  onPress?: () => void;
  showBookButton?: boolean;
  openSlotsCount?: number;
}

export function DoctorCard({
  doctor,
  onPress,
  showBookButton = true,
  openSlotsCount,
}: DoctorCardProps) {
  const avatarSource =
    (doctor.photoUrl && DOCTOR_IMAGES[doctor.photoUrl]) ||
    DOCTOR_IMAGES['doc-sarah-wanjiku'];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/doctor/${doctor.id}` as any);
    }
  };

  return (
    <PressableScale onPress={handlePress} activeScale={0.99} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
          <View style={styles.verifiedDot}>
            <Icon name="check" size={10} color={colors.white} />
          </View>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <AppText variant="headline-md" weight={700} color={colors.brandNavy} numberOfLines={1}>
              {doctor.name}
            </AppText>
            {doctor.consultationFee ? (
              <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                KSh {doctor.consultationFee}
              </AppText>
            ) : null}
          </View>

          <AppText variant="body-sm" color={colors.textMuted} numberOfLines={1}>
            {doctor.specialty} • {doctor.facility}
          </AppText>

          <View style={styles.ratingRow}>
            <Icon name="star" filled size={14} color={palette.amber500} />
            <AppText variant="label-sm" weight={700} color={colors.brandNavy}>
              {doctor.rating ?? 4.9}
            </AppText>
            <AppText variant="body-sm" color={colors.textMuted}>
              ({doctor.reviewCount ?? 120} reviews)
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerMetaLeft}>
          <View style={styles.availabilityPill}>
            <Icon name="check_circle" filled size={12} color={colors.primaryContainer} />
            <AppText variant="label-sm" weight={600} color={colors.primaryContainer}>
              {doctor.availableDate === '2026-09-22' ? 'Open today' : 'Available'}
            </AppText>
          </View>
          {openSlotsCount !== undefined ? (
            <AppText variant="body-sm" color={colors.textMuted}>
              {openSlotsCount} slots left
            </AppText>
          ) : null}
        </View>

        {showBookButton ? (
          <Button
            label="Book Appointment"
            variant="secondary"
            height={34}
            textVariant="label-md"
            fullWidth={false}
            rounded={radius.lg}
            onPress={handlePress}
          />
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    gap: 12,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surfaceCard,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  footerMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
});
