import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useApp } from '@/store/app-context';
import { DOCTOR_IMAGES } from '@/store/mock-data';
import { colors } from '@/theme/colors';
import { radius, shadows } from '@/theme/metrics';

interface NewDateOption {
  dayName: string;
  dayNumber: string;
  month: string;
  isoDate: string;
}

const NEW_DATE_OPTIONS: NewDateOption[] = [
  { dayName: 'Wed', dayNumber: '24', month: 'Sep', isoDate: '2026-09-24' },
  { dayName: 'Thu', dayNumber: '25', month: 'Sep', isoDate: '2026-09-25' },
  { dayName: 'Fri', dayNumber: '26', month: 'Sep', isoDate: '2026-09-26' },
  { dayName: 'Mon', dayNumber: '29', month: 'Sep', isoDate: '2026-09-29' },
];

const NEW_TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '11:30 AM',
  '02:00 PM',
  '03:00 PM',
];

export default function RescheduleModalScreen() {
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { appointments, activeAppointment, rescheduleAppointment } = useApp();

  const targetAppt =
    (appointmentId ? appointments.find((a) => a.id === appointmentId) : null) ??
    activeAppointment ??
    appointments[0];

  const [selectedDate, setSelectedDate] = useState('2026-09-24');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doctorName = targetAppt?.doctorName ?? 'Dr. Sarah Wanjiku';
  const doctorSpecialty = targetAppt?.doctorSpecialty ?? 'General Medicine';
  const room = targetAppt?.room ?? 'Room 14 (Wing B)';
  const currentToken = targetAppt?.queueNumber ?? 18;

  const handleConfirmReschedule = async () => {
    if (!targetAppt) {
      Alert.alert('No appointment', 'There is no appointment to reschedule.');
      return;
    }

    setIsSubmitting(true);
    try {
      await rescheduleAppointment({
        appointmentId: targetAppt.id,
        newDate: selectedDate,
        newTimeSlot: selectedSlot,
      });

      Alert.alert(
        'Rescheduled Successfully',
        `Your appointment with ${doctorName} has been rescheduled to ${selectedDate} at ${selectedSlot}. A new queue token has been assigned.`,
        [
          {
            text: 'View Queue',
            onPress: () => router.replace('/(tabs)/queue'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not reschedule appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      {/* Top drag handle & title */}
      <View style={[styles.modalTopBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.dragHandle} />
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={styles.calendarIconWrap}>
              <Icon name="calendar_month" size={18} color={colors.secondary} />
            </View>
            <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
              Reschedule Appointment
            </AppText>
          </View>
          <PressableScale onPress={() => router.back()} style={styles.closeBtn}>
            <Icon name="close" size={20} color={colors.textMuted} />
          </PressableScale>
        </View>

        <AppText variant="body-sm" color={colors.textMuted} style={styles.explanationText}>
          Select a new date and open time slot. Your current token (
          <AppText weight={700} color={colors.brandNavy}>
            #{currentToken}
          </AppText>
          ) will be released and a new queue number will be assigned upon confirmation.
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* 1. Current Appointment Summary Card */}
        <Card style={styles.currentCard}>
          <View style={styles.currentCardTop}>
            <View style={styles.doctorInfoRow}>
              <Image
                source={DOCTOR_IMAGES['doc-sarah-wanjiku']}
                style={styles.doctorAvatar}
                contentFit="cover"
              />
              <View>
                <View style={styles.verifiedRow}>
                  <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                    {doctorName}
                  </AppText>
                  <Icon name="verified" filled size={14} color={colors.primaryContainer} />
                </View>
                <AppText variant="body-sm" color={colors.textMuted}>
                  {doctorSpecialty} • {room}
                </AppText>
              </View>
            </View>
            <View style={styles.originalBadge}>
              <AppText variant="overline" weight={700} color={colors.textMuted}>
                ORIGINAL
              </AppText>
            </View>
          </View>

          <View style={styles.currentSlotPill}>
            <View style={styles.currentSlotLeft}>
              <Icon name="history_toggle_off" size={18} color={colors.secondary} />
              <AppText variant="body-sm" color={colors.brandNavy}>
                <AppText color={colors.textMuted}>Current:</AppText> Today, 22 Sep • 09:30 AM
              </AppText>
            </View>
            <View style={styles.currentTokenBadge}>
              <AppText variant="label-sm" weight={700} color={colors.secondary}>
                Token #{currentToken}
              </AppText>
            </View>
          </View>
        </Card>

        {/* 2. Select New Date Strip */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
              Select New Date
            </AppText>
            <AppText variant="body-sm" color={colors.textMuted}>
              September 2026
            </AppText>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRibbon}>
            {NEW_DATE_OPTIONS.map((d) => {
              const isSelected = selectedDate === d.isoDate;
              return (
                <PressableScale
                  key={d.isoDate}
                  onPress={() => setSelectedDate(d.isoDate)}
                  style={[
                    styles.datePill,
                    isSelected ? styles.datePillActive : styles.datePillInactive,
                  ]}>
                  <AppText
                    variant="overline"
                    weight={700}
                    color={isSelected ? colors.white : colors.textMuted}
                    uppercase>
                    {d.dayName}
                  </AppText>
                  <AppText
                    variant="headline-lg"
                    weight={800}
                    color={isSelected ? colors.white : colors.brandNavy}>
                    {d.dayNumber}
                  </AppText>
                  <AppText
                    variant="label-sm"
                    color={isSelected ? colors.white : colors.textMuted}>
                    {d.month}
                  </AppText>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Select New Time Slot */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
              Select New Time Slot
            </AppText>
            <AppText variant="label-sm" weight={700} color={colors.secondary}>
              6 SLOTS OPEN
            </AppText>
          </View>

          <View style={styles.timeGrid}>
            {NEW_TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <PressableScale
                  key={slot}
                  onPress={() => setSelectedSlot(slot)}
                  style={[
                    styles.timeSlotChip,
                    isSelected ? styles.timeSlotChipActive : styles.timeSlotChipInactive,
                  ]}>
                  <AppText
                    variant="label-md"
                    weight={isSelected ? 700 : 600}
                    color={isSelected ? colors.secondary : colors.brandNavy}>
                    {slot}
                  </AppText>
                  {isSelected ? (
                    <Icon name="check_circle" filled size={14} color={colors.secondary} />
                  ) : null}
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* 4. Release & Re-issue Policy */}
        <View style={styles.policyNotice}>
          <Icon name="info" filled size={18} color={colors.secondary} />
          <AppText variant="body-sm" color={colors.brandNavy} style={styles.policyText}>
            New queue position assigned chronologically for chosen date. Your previous queue number will be instantly released to waiting outpatients.
          </AppText>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[styles.bottomActionsBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label="Keep Current Slot"
          variant="outline"
          onPress={() => router.back()}
          height={48}
          fullWidth={false}
          style={styles.keepBtn}
        />

        <Button
          label={isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
          variant="primary"
          trailingIcon="arrow_forward"
          onPress={handleConfirmReschedule}
          loading={isSubmitting}
          height={48}
          fullWidth={false}
          style={styles.confirmRescheduleBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalTopBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 8,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationText: {
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 18,
  },
  currentCard: {
    padding: 14,
    gap: 12,
    backgroundColor: colors.surfaceBright,
  },
  currentCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  originalBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.lg,
  },
  currentSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentTokenBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(39, 82, 183, 0.2)',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRibbon: {
    gap: 8,
  },
  datePill: {
    width: 68,
    height: 74,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  datePillActive: {
    backgroundColor: colors.secondary,
    ...shadows.sm,
  },
  datePillInactive: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotChip: {
    width: '31.3%',
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  timeSlotChipActive: {
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  timeSlotChipInactive: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.brandBlueSoft,
    borderRadius: radius.xl,
    padding: 12,
  },
  policyText: {
    flex: 1,
    lineHeight: 18,
  },
  bottomActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  keepBtn: {
    flex: 1,
  },
  confirmRescheduleBtn: {
    flex: 1.5,
  },
});
