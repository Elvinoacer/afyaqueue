import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useApp } from '@/store/app-context';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/metrics';

export default function StaffDeskScreen() {
  const insets = useSafeAreaInsets();
  const {
    doctors,
    appointments,
    getDoctorQueueStatus,
    callNextPatient,
    skipPatient,
  } = useApp();

  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-sarah-wanjiku');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) ?? doctors[0];
  const activeDate = selectedDoctor.availableDate || '2026-09-22';
  const queueStatus = getDoctorQueueStatus(selectedDoctor.id, activeDate);
  const nowServing = queueStatus.nowServing;

  // Appointments for this doctor on their active clinic date
  const doctorAppointments = appointments
    .filter((a) => a.doctorId === selectedDoctor.id && a.date === activeDate)
    .sort((a, b) => a.queueNumber - b.queueNumber);

  const waitingCount = doctorAppointments.filter((a) => a.queueNumber > nowServing).length;
  const nextPatient = doctorAppointments.find((a) => a.queueNumber > nowServing);
  const nextQueueNumber = nextPatient ? nextPatient.queueNumber : nowServing + 1;

  const handleCallNext = async () => {
    setIsAdvancing(true);
    try {
      const advancedNumber = await callNextPatient(selectedDoctor.id, activeDate);
      Alert.alert(
        'Patient Summoned',
        `Token #${advancedNumber} has been called to ${selectedDoctor.room ?? 'Room 14'}. Audio chime and push notifications dispatched.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not advance queue.');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip / Mark No-Show',
      `Are you sure you want to skip #${nextQueueNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip Patient',
          style: 'destructive',
          onPress: async () => {
            await skipPatient(selectedDoctor.id, activeDate);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="AfyaQueue Desk"
        showBack={false}
        showHospitalBadge={false}
        trailingActions={[
          {
            icon: 'person_add',
            onPress: () => router.push('/staff/add-doctor'),
            accessibilityLabel: 'Add Clinician',
          },
          {
            icon: 'campaign',
            onPress: () => router.push('/announcements/broadcast'),
            accessibilityLabel: 'Broadcast Announcement',
          },
        ]}
      />

      {/* Sub-header Context Strip */}
      <View style={styles.subHeader}>
        <View style={styles.roleSyncRow}>
          <View style={styles.rolePill}>
            <View style={styles.roleBlueDot} />
            <AppText variant="label-sm" weight={700} color={colors.secondary}>
              Staff Desk (Nurse / Receptionist)
            </AppText>
          </View>
          <View style={styles.syncRow}>
            <Icon name="sync" size={14} color={colors.primaryContainer} />
            <AppText variant="label-sm" weight={600} color={colors.primaryContainer}>
              Live (1-2s updates)
            </AppText>
          </View>
        </View>

        <View style={styles.deskLocationRow}>
          <AppText variant="headline-lg" weight={800} color={colors.brandNavy}>
            {"Today's Live Queue"}
          </AppText>
          <View style={styles.wingBadge}>
            <AppText variant="label-md" weight={700} color={colors.brandNavy}>
              MTRH Wing 4B
            </AppText>
          </View>
        </View>
      </View>

      {/* Clinician Stream Horizontal Selector */}
      <View style={styles.streamSelector}>
        <AppText variant="overline" weight={700} color={colors.textMuted} style={styles.streamLabel}>
          ACTIVE CLINICIAN STREAM
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.streamChipsRibbon}>
          {doctors.map((doc) => {
            const isSelected = selectedDoctorId === doc.id;
            return (
              <PressableScale
                key={doc.id}
                onPress={() => setSelectedDoctorId(doc.id)}
                style={[
                  styles.streamChip,
                  isSelected ? styles.streamChipActive : styles.streamChipInactive,
                ]}>
                <Icon
                  name="stethoscope"
                  size={16}
                  color={isSelected ? colors.white : colors.textMuted}
                />
                <AppText
                  variant="label-md"
                  weight={isSelected ? 700 : 500}
                  color={isSelected ? colors.white : colors.brandNavy}>
                  {doc.name} ({doc.specialty.split(' ')[0]})
                </AppText>
                {isSelected ? (
                  <Icon name="check_circle" filled size={14} color={colors.white} />
                ) : null}
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 140 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* KPI Counter Cards Grid */}
        <View style={styles.kpiGrid}>
          {/* NOW SERVING */}
          <View style={styles.kpiCardServing}>
            <View style={styles.kpiCardHeader}>
              <AppText variant="overline" weight={800} color={colors.primaryContainer}>
                NOW SERVING
              </AppText>
              <View style={styles.activeMiniBadge}>
                <AppText variant="overline" weight={800} color={colors.primaryContainer}>
                  ACTIVE
                </AppText>
              </View>
            </View>
            <AppText variant="display-giant" weight={800} color={colors.primaryContainer} style={styles.kpiNumber}>
              {nowServing}
            </AppText>
            <View style={styles.kpiDividerGreen} />
            <AppText variant="label-md" weight={700} color={colors.brandNavy} numberOfLines={1}>
              {doctorAppointments.find((a) => a.queueNumber === nowServing)?.patientName ?? 'In Consultation'}
            </AppText>
            <View style={styles.roomTagRow}>
              <Icon name="meeting_room" size={12} color={colors.primaryContainer} />
              <AppText variant="body-sm" color={colors.primaryContainer} weight={600}>
                {selectedDoctor.room ?? 'Room 14'}
              </AppText>
            </View>
          </View>

          {/* WAITING IN QUEUE */}
          <View style={styles.kpiCardWaiting}>
            <View style={styles.kpiCardHeader}>
              <AppText variant="overline" weight={800} color={colors.brandAccentRust}>
                WAITING IN QUEUE
              </AppText>
              <View style={styles.urgentMiniBadge}>
                <AppText variant="overline" weight={800} color={colors.brandAccentRust}>
                  +3 Urgent
                </AppText>
              </View>
            </View>
            <AppText variant="display-giant" weight={800} color={colors.brandAccentRust} style={styles.kpiNumber}>
              {waitingCount}
            </AppText>
            <View style={styles.kpiDividerOrange} />
            <AppText variant="label-md" weight={700} color={colors.brandNavy} numberOfLines={1}>
              Next: #{nextQueueNumber} {nextPatient?.patientName ?? 'Waiting'}
            </AppText>
            <View style={styles.roomTagRow}>
              <Icon name="timer" size={12} color={colors.textMuted} />
              <AppText variant="body-sm" color={colors.textMuted}>
                Est: ~{waitingCount * (selectedDoctor.avgConsultationMins ?? 5)} mins
              </AppText>
            </View>
          </View>
        </View>

        {/* Sub-metric Banner */}
        <Card style={styles.subMetricBanner}>
          <View style={styles.subMetricLeft}>
            <Icon name="receipt_long" size={18} color={colors.secondary} />
            <AppText variant="body-sm" color={colors.brandNavy}>
              Last Issued Token:{' '}
              <AppText weight={800} color={colors.brandNavy}>
                #{queueStatus.lastIssuedNumber}
              </AppText>
            </AppText>
          </View>
          <AppText variant="body-sm" color={colors.textMuted}>
            Avg: {selectedDoctor.avgConsultationMins ?? 5}m/patient
          </AppText>
        </Card>

        {/* Live Patient Queue List */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <View style={styles.listTitleRow}>
              <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                Patients Waiting
              </AppText>
              <AppText variant="body-sm" color={colors.textMuted}>
                (Today, 22 Sep 2026)
              </AppText>
            </View>
            <PressableScale style={styles.sortBtn}>
              <Icon name="filter_list" size={16} color={colors.secondary} />
              <AppText variant="label-sm" weight={700} color={colors.secondary}>
                Sort
              </AppText>
            </PressableScale>
          </View>

          <Card style={styles.queueTableCard}>
            {doctorAppointments.map((appt, i) => {
              const isServing = appt.queueNumber === nowServing;
              const isCompleted = appt.queueNumber < nowServing;
              const isNext = appt.queueNumber === nextQueueNumber;

              return (
                <View
                  key={appt.id}
                  style={[
                    styles.queueRow,
                    isServing ? styles.queueRowServing : null,
                    isNext ? styles.queueRowNext : null,
                    i < doctorAppointments.length - 1 ? styles.rowBorder : null,
                  ]}>
                  <View style={styles.rowLeft}>
                    <View
                      style={[
                        styles.numberBadge,
                        isServing
                          ? styles.numberBadgeServing
                          : isNext
                          ? styles.numberBadgeNext
                          : styles.numberBadgeNormal,
                      ]}>
                      <AppText
                        variant="headline-md"
                        weight={800}
                        color={
                          isServing
                            ? colors.white
                            : isNext
                            ? colors.tertiary
                            : colors.textMuted
                        }>
                        #{appt.queueNumber}
                      </AppText>
                    </View>

                    <View>
                      <View style={styles.patientNameLine}>
                        <AppText
                          variant="label-md"
                          weight={700}
                          color={isCompleted ? colors.textMuted : colors.brandNavy}
                          style={isCompleted ? styles.completedStrike : null}>
                          {appt.patientName}
                        </AppText>
                        {isServing ? (
                          <Icon name="medical_information" size={14} color={colors.secondary} />
                        ) : null}
                      </View>
                      <AppText variant="body-sm" color={isServing ? colors.secondary : colors.textMuted}>
                        {appt.timeSlot} • {appt.notes ?? 'Outpatient Consultation'}
                      </AppText>
                    </View>
                  </View>

                  <View>
                    {isServing ? (
                      <View style={styles.servingNowTag}>
                        <Icon name="record_voice_over" size={12} color={colors.white} />
                        <AppText variant="label-sm" weight={800} color={colors.white}>
                          SERVING [NOW]
                        </AppText>
                      </View>
                    ) : isCompleted ? (
                      <View style={styles.completedTag}>
                        <Icon name="check" size={12} color={colors.textMuted} />
                        <AppText variant="label-sm" weight={600} color={colors.textMuted}>
                          DONE
                        </AppText>
                      </View>
                    ) : isNext ? (
                      <View style={styles.nextTag}>
                        <AppText variant="label-sm" weight={700} color={colors.brandAccentRust}>
                          NEXT IN LINE
                        </AppText>
                      </View>
                    ) : (
                      <View style={styles.waitingTag}>
                        <AppText variant="label-sm" color={colors.textMuted}>
                          Waiting
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        </View>

        {/* Chime System PA Speaker Box */}
        <Card style={styles.chimeCard}>
          <View style={styles.chimeTopRow}>
            <View style={styles.chimeLeft}>
              <Icon name="volume_up" size={20} color={colors.brandAccentRust} />
              <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                PA Chime System: Hall B Online
              </AppText>
            </View>
            <PressableScale
              onPress={() => Alert.alert('Test Chime', 'Broadcasting 2-tone clinical chime to Waiting Room 4B...')}
              style={styles.testChimeBtn}>
              <AppText variant="label-sm" weight={700} color={colors.secondary}>
                Test Audio Chime →
              </AppText>
            </PressableScale>
          </View>
        </Card>
      </ScrollView>

      {/* Sticky Operational Action Bar */}
      <View style={[styles.stickyActionBar, { bottom: 64 + insets.bottom }]}>
        <View style={styles.actionBarContainer}>
          {/* Primary Call Next Button */}
          <PressableScale
            onPress={handleCallNext}
            disabled={isAdvancing}
            style={styles.callNextBtn}>
            <View style={styles.callNextTop}>
              <Icon name="volume_up" size={20} color={colors.white} />
              <AppText variant="label-lg" weight={800} color={colors.white}>
                CALL NEXT PATIENT (#{nextQueueNumber})
              </AppText>
              <Icon name="arrow_forward" size={20} color={colors.white} />
            </View>
            <AppText variant="body-sm" color="#FFE8DF" style={styles.callNextCaption}>
              Advances queue to #{nextQueueNumber} and notifies patient
            </AppText>
          </PressableScale>

          {/* Secondary Skip Button */}
          <PressableScale onPress={handleSkip} style={styles.skipBtn}>
            <Icon name="person_cancel" size={18} color={colors.statusDanger} />
            <AppText variant="label-sm" weight={700} color={colors.statusDanger}>
              Skip / No-Show
            </AppText>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 6,
  },
  roleSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roleBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deskLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wingBadge: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  streamSelector: {
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 6,
  },
  streamLabel: {
    paddingHorizontal: 16,
  },
  streamChipsRibbon: {
    paddingHorizontal: 16,
    gap: 8,
  },
  streamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  streamChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  streamChipInactive: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCardServing: {
    flex: 1,
    backgroundColor: colors.brandGreenSoft,
    borderRadius: radius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 2,
  },
  kpiCardWaiting: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: radius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 2,
  },
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeMiniBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  urgentMiniBadge: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  kpiNumber: {
    fontSize: 32,
    lineHeight: 38,
    marginVertical: 2,
  },
  kpiDividerGreen: {
    height: 1,
    backgroundColor: 'rgba(30, 122, 70, 0.2)',
    marginVertical: 4,
  },
  kpiDividerOrange: {
    height: 1,
    backgroundColor: 'rgba(193, 84, 26, 0.2)',
    marginVertical: 4,
  },
  roomTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subMetricBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  subMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listSection: {
    gap: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  queueTableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  queueRowServing: {
    backgroundColor: colors.brandBlueSoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  queueRowNext: {
    backgroundColor: '#FFFBF5',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeServing: {
    backgroundColor: colors.secondary,
  },
  numberBadgeNext: {
    backgroundColor: '#FED7AA',
  },
  numberBadgeNormal: {
    backgroundColor: colors.surfaceContainer,
  },
  patientNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedStrike: {
    textDecorationLine: 'line-through',
  },
  servingNowTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  nextTag: {
    backgroundColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  waitingTag: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  chimeCard: {
    padding: 14,
  },
  chimeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testChimeBtn: {
    padding: 4,
  },
  stickyActionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
  },
  actionBarContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  callNextBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.brandOrange,
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callNextCaption: {
    fontSize: 11,
    marginTop: 2,
  },
  skipBtn: {
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
