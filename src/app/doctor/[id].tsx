import { useMemo, useState } from 'react';
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
import { ScreenHeader } from '@/components/ui/screen-header';
import { useApp } from '@/store/app-context';
import { DOCTOR_IMAGES } from '@/store/mock-data';
import { colors, palette } from '@/theme/colors';
import { radius, shadows } from '@/theme/metrics';

interface DateOption {
  dayName: string;
  dayNumber: string;
  month: string;
  isoDate: string;
}

const DATE_OPTIONS: DateOption[] = [
  { dayName: 'Mon', dayNumber: '22', month: 'Sep', isoDate: '2026-09-22' },
  { dayName: 'Tue', dayNumber: '23', month: 'Sep', isoDate: '2026-09-23' },
  { dayName: 'Wed', dayNumber: '24', month: 'Sep', isoDate: '2026-09-24' },
  { dayName: 'Thu', dayNumber: '25', month: 'Sep', isoDate: '2026-09-25' },
  { dayName: 'Fri', dayNumber: '26', month: 'Sep', isoDate: '2026-09-26' },
];

export default function DoctorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { doctors, appointments, currentUser, bookAppointment } = useApp();

  const doctor = doctors.find((d) => d.id === id) ?? doctors[0];

  const [selectedDate, setSelectedDate] = useState('2026-09-22');
  const [selectedSlot, setSelectedSlot] = useState('09:30 AM');
  const [isFavorite, setIsFavorite] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Dynamic open slots formula: d.availableSlots \ { a.timeSlot | a in Appointments(d, date) and a.status == "upcoming" }
  const bookedSlotsForDate = useMemo(() => {
    return new Set(
      appointments
        .filter(
          (a) =>
            a.doctorId === doctor.id &&
            a.date === selectedDate &&
            a.status === 'upcoming'
        )
        .map((a) => a.timeSlot)
    );
  }, [appointments, doctor.id, selectedDate]);

  const openSlotsCount = doctor.availableSlots.filter(
    (s) => !bookedSlotsForDate.has(s)
  ).length;

  // Pure derived state for slot selection (avoids cascading render warning)
  const effectiveSelectedSlot = bookedSlotsForDate.has(selectedSlot)
    ? doctor.availableSlots.find((s) => !bookedSlotsForDate.has(s)) ?? selectedSlot
    : selectedSlot;

  const avatarSource =
    (doctor.photoUrl && DOCTOR_IMAGES[doctor.photoUrl]) ||
    DOCTOR_IMAGES['doc-sarah-wanjiku'];

  const handleConfirmBooking = async () => {
    setIsBooking(true);
    try {
      await bookAppointment({
        doctorId: doctor.id,
        date: selectedDate,
        timeSlot: effectiveSelectedSlot,
      });

      // Navigate to live queue
      router.replace('/(tabs)/queue');
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Unable to book appointment.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Doctor Profile"
        showBack
        showHospitalBadge={false}
        trailingActions={[
          {
            icon: 'share',
            onPress: () => Alert.alert('Share', `Share profile for ${doctor.name}`),
            accessibilityLabel: 'Share Doctor Profile',
          },
          {
            icon: isFavorite ? 'favorite' : 'favorite',
            onPress: () => setIsFavorite(!isFavorite),
            accessibilityLabel: 'Toggle Favorite',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Doctor Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.cardAccentBar} />

          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
              <View style={styles.verifiedBadge}>
                <Icon name="verified" filled size={14} color={colors.white} />
              </View>
            </View>

            <View style={styles.profileInfo}>
              <AppText variant="headline-md" weight={700} color={colors.brandNavy} numberOfLines={1}>
                {doctor.name}
              </AppText>
              <AppText variant="label-md" weight={600} color={colors.secondary} numberOfLines={1}>
                Senior Consultant - {doctor.specialty}
              </AppText>
              <View style={styles.locationRow}>
                <Icon name="location_on" size={14} color={colors.textMuted} />
                <AppText variant="body-sm" color={colors.textMuted} numberOfLines={1}>
                  {doctor.facility}, {doctor.room ?? 'Room 14'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Rating, Experience, Status Row */}
          <View style={styles.metricsRow}>
            <View style={styles.ratingBox}>
              <Icon name="star" filled size={14} color={palette.amber500} />
              <AppText variant="label-sm" weight={700} color={colors.brandNavy}>
                {doctor.rating ?? 4.9}
              </AppText>
              <AppText variant="body-sm" color={colors.textMuted}>
                ({doctor.reviewCount ?? 128} reviews) • {doctor.experienceYears ?? 8} yrs exp
              </AppText>
            </View>

            <View style={styles.availabilityPill}>
              <Icon name="check_circle" filled size={12} color={colors.primaryContainer} />
              <AppText variant="label-sm" weight={700} color={colors.primaryContainer}>
                Available today
              </AppText>
            </View>
          </View>

          {/* Consultation Fee Banner */}
          <View style={styles.feeBanner}>
            <View style={styles.feeLeft}>
              <View style={styles.feeIcon}>
                <Icon name="payments" size={18} color={colors.secondary} />
              </View>
              <AppText variant="body-sm" color={colors.textMuted}>
                Consultation Fee
              </AppText>
            </View>
            <AppText variant="headline-md" weight={800} color={colors.brandNavy}>
              KSh {doctor.consultationFee ?? 500}
            </AppText>
          </View>
        </Card>

        {/* Date Selector Strip */}
        <View style={styles.sectionHeader}>
          <AppText variant="label-lg" weight={700} color={colors.brandNavy}>
            Select Date
          </AppText>
          <AppText variant="body-sm" weight={600} color={colors.secondary}>
            September 2026
          </AppText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRibbon}>
          {DATE_OPTIONS.map((d) => {
            const isSelected = selectedDate === d.isoDate;
            return (
              <PressableScale
                key={d.isoDate}
                onPress={() => setSelectedDate(d.isoDate)}
                style={[
                  styles.datePill,
                  isSelected ? styles.datePillSelected : styles.datePillUnselected,
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

        {/* Time Slot Selection */}
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
              Available Time Slots
            </AppText>
            <AppText variant="body-sm" color={colors.textMuted}>
              {openSlotsCount} slots available for {selectedDate === '2026-09-22' ? 'Mon, 22 Sep' : selectedDate}
            </AppText>
          </View>
          <View style={styles.syncStatusBadge}>
            <AppText variant="overline" weight={800} color={colors.secondary}>
              LIVE SYNC
            </AppText>
          </View>
        </View>

        {/* Slots 3-Column Grid */}
        <View style={styles.slotsGrid}>
          {doctor.availableSlots.map((slot) => {
            const isBooked = bookedSlotsForDate.has(slot);
            const isSelected = effectiveSelectedSlot === slot && !isBooked;

            if (isBooked) {
              return (
                <View key={slot} style={styles.slotCardBooked}>
                  <AppText
                    variant="label-md"
                    weight={500}
                    color={palette.slate400}
                    style={styles.lineThrough}>
                    {slot}
                  </AppText>
                  <Icon name="lock" size={12} color={palette.slate400} />
                </View>
              );
            }

            return (
              <PressableScale
                key={slot}
                onPress={() => setSelectedSlot(slot)}
                style={[
                  styles.slotCard,
                  isSelected ? styles.slotCardSelected : null,
                ]}>
                <AppText
                  variant="label-md"
                  weight={isSelected ? 700 : 600}
                  color={isSelected ? colors.primaryContainer : colors.brandNavy}>
                  {slot}
                </AppText>
                {isSelected ? (
                  <Icon name="check_circle" filled size={14} color={colors.primaryContainer} />
                ) : null}
              </PressableScale>
            );
          })}
        </View>

        {/* Patient Details Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <Icon name="badge" size={18} color={colors.secondary} />
              <AppText variant="label-lg" weight={700} color={colors.brandNavy}>
                Patient Details Summary
              </AppText>
            </View>
            <View style={styles.verifiedTag}>
              <AppText variant="overline" weight={800} color={colors.primaryContainer}>
                VERIFIED PATIENT
              </AppText>
            </View>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryField}>
              <AppText variant="overline" color={colors.textMuted} uppercase>
                Patient Name
              </AppText>
              <AppText variant="body-md" weight={700} color={colors.brandNavy}>
                {currentUser?.name ?? 'Kevin Kibet'}
              </AppText>
            </View>

            <View style={styles.summaryField}>
              <AppText variant="overline" color={colors.textMuted} uppercase>
                Registration No.
              </AppText>
              <AppText variant="body-md" weight={700} color={colors.brandNavy}>
                {currentUser?.patientRegNo ?? 'PT-2026-0142'}
              </AppText>
            </View>
          </View>

          <View style={styles.phoneRow}>
            <View style={styles.phoneLeft}>
              <Icon name="phone" size={16} color={colors.textMuted} />
              <AppText variant="body-sm" color={colors.textMuted}>
                Phone: <AppText weight={700} color={colors.brandNavy}>{currentUser?.phone ?? '0712 345 678'}</AppText>
              </AppText>
            </View>
            <PressableScale onPress={() => router.push('/(tabs)/profile')}>
              <AppText variant="body-sm" weight={700} color={colors.secondary}>
                Change
              </AppText>
            </PressableScale>
          </View>
        </Card>

        {/* Atomic Queue Guarantee Notice */}
        <View style={styles.guaranteeNotice}>
          <View style={styles.guaranteeIcon}>
            <Icon name="lock" filled size={14} color={colors.white} />
          </View>
          <View style={styles.guaranteeContent}>
            <AppText variant="label-md" weight={700} color={colors.secondary}>
              Atomic Queue Guarantee
            </AppText>
            <AppText variant="body-sm" color={colors.brandNavy} style={styles.guaranteeText}>
              Real-time consecutive queue number assigned upon confirmation. Prevents double-booking across Moi Teaching Hospital clinics.
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.slotRecap}>
          <AppText variant="overline" weight={700} color={colors.textMuted} uppercase>
            Selected Slot
          </AppText>
          <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
            {selectedSlot} • Sep 22
          </AppText>
          <View style={styles.waitRecap}>
            <Icon name="bolt" size={12} color={colors.primaryContainer} />
            <AppText variant="body-sm" weight={600} color={colors.primaryContainer}>
              Est. Wait: &lt; 10 mins
            </AppText>
          </View>
        </View>

        <Button
          label={isBooking ? 'Securing Slot...' : 'Confirm Booking'}
          variant="primary"
          trailingIcon="arrow_forward"
          onPress={handleConfirmBooking}
          loading={isBooking}
          height={48}
          fullWidth={false}
          style={styles.confirmBtn}
        />
      </View>
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
    gap: 16,
  },
  profileCard: {
    padding: 16,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primaryContainer,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingTop: 4,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.brandBlueSoft,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  feeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  feeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feeIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRibbon: {
    gap: 8,
    paddingVertical: 2,
  },
  datePill: {
    width: 68,
    height: 74,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  datePillSelected: {
    backgroundColor: colors.secondary,
    ...shadows.sm,
  },
  datePillUnselected: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  syncStatusBadge: {
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '31.3%',
    height: 48,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  slotCardSelected: {
    backgroundColor: colors.brandGreenSoft,
    borderColor: colors.primaryContainer,
    borderWidth: 2,
  },
  slotCardBooked: {
    width: '31.3%',
    height: 48,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  lineThrough: {
    textDecorationLine: 'line-through',
  },
  summaryCard: {
    padding: 14,
    gap: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedTag: {
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  summaryField: {
    flex: 1,
    gap: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  phoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 1,
    borderColor: 'rgba(39, 82, 183, 0.2)',
    borderRadius: radius.xl,
    padding: 12,
  },
  guaranteeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  guaranteeContent: {
    flex: 1,
    gap: 2,
  },
  guaranteeText: {
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  slotRecap: {
    gap: 1,
  },
  waitRecap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  confirmBtn: {
    minWidth: 160,
  },
});
