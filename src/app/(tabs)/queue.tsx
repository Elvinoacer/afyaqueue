import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { QueueCenterpiece } from '@/components/ui/queue-centerpiece';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TurnAlertBanner } from '@/components/ui/turn-alert-banner';
import { useApp } from '@/store/app-context';
import { DOCTOR_IMAGES } from '@/store/mock-data';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/metrics';

export default function QueueScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeAppointment,
    activeQueueNumber,
    nowServingNumber,
    peopleAheadCount,
    estimatedWaitMinutes,
    isMyTurnActive,
    cancelAppointment,
  } = useApp();

  const [liveDotPulse, setLiveDotPulse] = useState(true);

  // Pulse effect timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDotPulse((prev) => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const doctorName = activeAppointment?.doctorName ?? 'Dr. Sarah Wanjiku';
  const doctorSpecialty = activeAppointment?.doctorSpecialty ?? 'General Medicine';
  const room = activeAppointment?.room ?? 'Room 14';

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel your queue token? This will release your position.',
      [
        { text: 'Keep Slot', style: 'cancel' },
        {
          text: 'Cancel Token',
          style: 'destructive',
          onPress: async () => {
            if (activeAppointment) {
              await cancelAppointment(activeAppointment.id);
            }
            router.replace('/(tabs)/discover');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Live Queue Status"
        subtitle="Real-Time Sync • Moi Teaching Hospital"
        variant="royal"
        showBack
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/discover');
          }
        }}
        showHospitalBadge={false}
        rightElement={
          <View style={styles.liveSyncedBadge}>
            <View
              style={[
                styles.livePulseDot,
                { opacity: liveDotPulse ? 1 : 0.4 },
              ]}
            />
            <AppText variant="overline" weight={800} color={colors.white}>
              LIVE SYNCED
            </AppText>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Doctor Info Card */}
        <Card style={styles.doctorInfoCard}>
          <View style={styles.doctorInfoLeft}>
            <Image
              source={DOCTOR_IMAGES['doc-sarah-queue']}
              style={styles.doctorAvatar}
              contentFit="cover"
            />
            <View style={styles.doctorMetaCol}>
              <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                {doctorName}
              </AppText>
              <AppText variant="body-sm" color={colors.textMuted}>
                {doctorSpecialty} • {room}
              </AppText>
              <View style={styles.tagsRow}>
                <View style={styles.dateTag}>
                  <Icon name="today" size={12} color={colors.textMuted} />
                  <AppText variant="label-sm" color={colors.brandNavy}>
                    Today, 22 Sep 2026
                  </AppText>
                </View>
                <View style={styles.timeTag}>
                  <Icon name="schedule" size={12} color={colors.secondary} />
                  <AppText variant="label-sm" weight={700} color={colors.secondary}>
                    {activeAppointment?.timeSlot ?? '09:30 AM'}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.verifiedIconWrap}>
            <Icon name="verified" filled size={18} color={colors.primaryContainer} />
          </View>
        </Card>

        {/* Giant Queue Hero Display */}
        <Card style={styles.queueHeroCard}>
          <QueueCenterpiece
            queueNumber={activeQueueNumber}
            isTurn={isMyTurnActive}
            subtitle={
              isMyTurnActive
                ? 'Proceed to Consultation Room'
                : `${peopleAheadCount} ahead of you`
            }
          />
          <View style={styles.syncFrequencyPill}>
            <Icon name="sensors" size={14} color={colors.secondary} />
            <AppText variant="label-sm" weight={600} color={colors.secondary}>
              Sync frequency: every 15s
            </AppText>
          </View>
        </Card>

        {/* 3 Stats Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Card 1: NOW SERVING */}
          <View style={styles.metricCardServing}>
            <AppText variant="overline" weight={800} color={colors.primaryContainer}>
              NOW SERVING
            </AppText>
            <AppText variant="display-giant" weight={800} color={colors.primaryContainer} style={styles.metricNumber}>
              {nowServingNumber}
            </AppText>
            <View style={styles.metricCaptionRow}>
              <Icon name="login" size={12} color={colors.primaryContainer} />
              <AppText variant="label-sm" weight={700} color={colors.primaryContainer}>
                In {room}
              </AppText>
            </View>
          </View>

          {/* Card 2: AHEAD OF YOU */}
          <View style={styles.metricCardAhead}>
            <AppText variant="overline" weight={800} color={colors.textMuted}>
              AHEAD OF YOU
            </AppText>
            <AppText variant="display-giant" weight={800} color={colors.brandNavy} style={styles.metricNumber}>
              {peopleAheadCount}
            </AppText>
            <AppText variant="label-sm" weight={600} color={colors.brandNavy}>
              people waiting
            </AppText>
          </View>

          {/* Card 3: EST. WAIT */}
          <View style={styles.metricCardWait}>
            <AppText variant="overline" weight={800} color={colors.secondary}>
              EST. WAIT
            </AppText>
            <AppText variant="display-giant" weight={800} color={colors.secondary} style={styles.metricNumber}>
              ~{estimatedWaitMinutes}
            </AppText>
            <AppText variant="label-sm" weight={500} color={colors.textMuted}>
              mins (5m / pt)
            </AppText>
          </View>
        </View>

        {/* Live Turn Approaching Alert Banner */}
        <TurnAlertBanner
          isTurn={isMyTurnActive}
          room={room}
          doctorName={doctorName}
          peopleAhead={peopleAheadCount}
        />

        {/* Lab & Pharmacy Queue Notice */}
        <Card style={styles.ancillaryNoticeCard}>
          <View style={styles.ancillaryNoticeLeft}>
            <Icon name="local_pharmacy" size={20} color={colors.secondary} />
            <AppText variant="body-sm" weight={500} color={colors.brandNavy} style={styles.ancillaryText}>
              Laboratory & Pharmacy Queue slots are reserved under #{activeQueueNumber}
            </AppText>
          </View>
          <Icon name="chevron_right" size={18} color={colors.textMuted} />
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            label="Reschedule Appointment"
            variant="outline"
            icon="event_repeat"
            onPress={() => router.push('/appointments/reschedule')}
            height={48}
          />

          <PressableScale onPress={handleCancel} style={styles.cancelBtn}>
            <Icon name="cancel" size={18} color={colors.statusDanger} />
            <AppText variant="label-md" weight={700} color={colors.statusDanger}>
              Cancel Appointment
            </AppText>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  liveSyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  doctorInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  doctorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  doctorMetaCol: {
    flex: 1,
    gap: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandGreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueHeroCard: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  syncFrequencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCardServing: {
    flex: 1,
    backgroundColor: colors.brandGreenSoft,
    borderRadius: radius.xl,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 122, 70, 0.2)',
    gap: 2,
  },
  metricCardAhead: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 2,
  },
  metricCardWait: {
    flex: 1,
    backgroundColor: colors.brandBlueSoft,
    borderRadius: radius.xl,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(39, 82, 183, 0.2)',
    gap: 2,
  },
  metricNumber: {
    fontSize: 28,
    lineHeight: 34,
    marginVertical: 2,
  },
  metricCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ancillaryNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  ancillaryNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ancillaryText: {
    flex: 1,
  },
  actionsContainer: {
    gap: 8,
    paddingTop: 4,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
});
