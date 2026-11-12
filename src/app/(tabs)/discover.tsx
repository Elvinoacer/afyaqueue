import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { DoctorCard } from '@/components/ui/doctor-card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useApp } from '@/store/app-context';
import { colors, palette } from '@/theme/colors';
import { radius, shadows } from '@/theme/metrics';

const SPECIALTY_FILTERS = [
  'All',
  'Dental',
  'Pediatrics',
  'General Medicine',
  'Cardiology',
  'ENT',
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    doctors,
    appointments,
    announcements,
    dismissAnnouncement,
    activeAppointment,
    activeQueueNumber,
    peopleAheadCount,
    estimatedWaitMinutes,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const topAnnouncement = announcements.find((a) => a.urgency === 'urgent') ?? announcements[0];

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.facility.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialty =
        selectedSpecialty === 'All' ||
        doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        showHospitalBadge
        hospitalText="MTRH Outpatient Portal"
        trailingActions={[
          {
            icon: 'notifications',
            onPress: () => router.push('/announcements/broadcast'),
            accessibilityLabel: 'Announcements',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Patient Greeting & Facility Context */}
        <View style={styles.greetingSection}>
          <View>
            <AppText variant="headline-xl" weight={800} color={colors.brandNavy}>
              Hi {currentUser?.name ?? 'Kevin Kibet'}
            </AppText>
            <View style={styles.regNoRow}>
              <AppText variant="label-sm" color={colors.textMuted}>
                Reg No:
              </AppText>
              <View style={styles.regNoBadge}>
                <AppText variant="label-sm" weight={700} color={colors.brandNavy}>
                  {currentUser?.patientRegNo ?? 'PT-2026-0142'}
                </AppText>
              </View>
            </View>
          </View>

          <PressableScale style={styles.locationPickerBtn}>
            <Icon name="location_on" size={16} color={colors.secondary} />
            <AppText variant="label-md" weight={600} color={colors.brandNavy} numberOfLines={1} style={styles.locationText}>
              Moi Teaching Hospital
            </AppText>
            <Icon name="expand_more" size={16} color={colors.textMuted} />
          </PressableScale>
        </View>

        {/* Real-time Facility Announcement */}
        {topAnnouncement ? (
          <View style={styles.announcementBanner}>
            <Icon name="campaign" size={20} color={palette.amber500} />
            <AppText variant="body-sm" weight={600} color={colors.brandNavy} style={styles.announcementText}>
              {topAnnouncement.text}
            </AppText>
            <PressableScale
              onPress={() => dismissAnnouncement(topAnnouncement.id)}
              style={styles.dismissBtn}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </PressableScale>
          </View>
        ) : null}

        {/* Active Queue Quick Sticky Widget */}
        {activeAppointment ? (
          <Card style={styles.activeQueueCard}>
            <PressableScale
              onPress={() => router.push('/(tabs)/queue')}
              style={styles.activeQueueRow}>
              <View style={styles.activeQueueLeft}>
                <View style={styles.queueCircleBadge}>
                  <AppText variant="headline-md" weight={800} color={colors.secondary}>
                    {activeQueueNumber}
                  </AppText>
                </View>
                <View style={styles.queueInfoCol}>
                  <View style={styles.pulseTitleRow}>
                    <View style={styles.pulseDot} />
                    <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                      Active Queue: {activeAppointment.doctorName}
                    </AppText>
                  </View>
                  <AppText variant="body-sm" color={colors.textMuted}>
                    {peopleAheadCount} ahead of you (~{estimatedWaitMinutes} min)
                  </AppText>
                </View>
              </View>

              <View style={styles.viewQueueAction}>
                <AppText variant="label-md" weight={700} color={colors.secondary}>
                  View Queue
                </AppText>
                <Icon name="arrow_forward" size={16} color={colors.secondary} />
              </View>
            </PressableScale>
          </Card>
        ) : null}

        {/* Search Field & Filter Trigger */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Input
              icon="search"
              placeholder="Search doctor, specialty (e.g. Dental, Pediatrics)..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <PressableScale
            onPress={() => router.push('/appointments')}
            style={styles.filterBtn}
            accessibilityLabel="Filter specialists">
            <Icon name="tune" size={20} color={colors.brandNavy} />
          </PressableScale>
        </View>

        {/* Specialty Category Filter Ribbon */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRibbon}>
          {SPECIALTY_FILTERS.map((specialty) => {
            const isSelected = selectedSpecialty === specialty;
            return (
              <PressableScale
                key={specialty}
                onPress={() => setSelectedSpecialty(specialty)}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillActive : styles.filterPillInactive,
                ]}>
                <AppText
                  variant="label-md"
                  weight={isSelected ? 700 : 500}
                  color={isSelected ? colors.white : colors.textMuted}>
                  {specialty}
                </AppText>
              </PressableScale>
            );
          })}
        </ScrollView>

        {/* Doctor Discovery Cards */}
        <View style={styles.doctorSection}>
          <View style={styles.doctorSectionHeader}>
            <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
              Available Specialists
            </AppText>
            <AppText variant="label-sm" color={colors.textMuted} weight={600}>
              {filteredDoctors.length} On Duty
            </AppText>
          </View>

          <View style={styles.doctorList}>
            {filteredDoctors.map((doc) => {
              const bookedCount = appointments.filter(
                (a) =>
                  a.doctorId === doc.id &&
                  a.date === (doc.availableDate || '2026-09-22') &&
                  a.status === 'upcoming'
              ).length;
              const openSlotsCount = Math.max(0, doc.availableSlots.length - bookedCount);
              return (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  openSlotsCount={openSlotsCount}
                />
              );
            })}
          </View>
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
    gap: 16,
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  regNoBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 160,
    ...shadows.sm,
  },
  locationText: {
    flex: 1,
  },
  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.xl,
    padding: 12,
  },
  announcementText: {
    flex: 1,
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 4,
  },
  activeQueueCard: {
    padding: 12,
    backgroundColor: colors.surfaceCard,
  },
  activeQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeQueueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  queueCircleBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandBlueSoft,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueInfoCol: {
    flex: 1,
    gap: 2,
  },
  pulseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryContainer,
  },
  viewQueueAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  filterRibbon: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  filterPillActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterPillInactive: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  doctorSection: {
    gap: 12,
  },
  doctorSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorList: {
    gap: 12,
  },
});
