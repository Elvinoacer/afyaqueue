import { useState } from 'react';
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
import { ScreenHeader } from '@/components/ui/screen-header';
import { useApp } from '@/store/app-context';
import { DOCTOR_IMAGES } from '@/store/mock-data';
import { colors, palette } from '@/theme/colors';
import { radius } from '@/theme/metrics';

export default function MyAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { appointments, doctors, getDoctorQueueStatus, currentUser, cancelAppointment } = useApp();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingList = appointments.filter((a) => a.status === 'upcoming');
  const pastList = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');

  const handleCancel = (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'Keep Slot', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            await cancelAppointment(appointmentId);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="My Appointments"
        showBack
        showHospitalBadge={false}
        trailingActions={[
          {
            icon: 'tune',
            onPress: () => Alert.alert('Filter', 'Filter appointments by doctor or date'),
            accessibilityLabel: 'Filter',
          },
        ]}
      />

      {/* Patient Context Badge */}
      <View style={styles.patientContextStrip}>
        <View style={styles.patientLeft}>
          <Icon name="badge" size={16} color={colors.primaryContainer} />
          <AppText variant="label-md" weight={700} color={colors.brandNavy}>
            {currentUser?.name ?? 'Kevin Kibet'}
          </AppText>
          <AppText variant="body-sm" color={colors.textMuted}>
            •
          </AppText>
          <AppText variant="body-sm" weight={600} color={colors.textMuted}>
            {currentUser?.patientRegNo ?? 'PT-2026-0142'}
          </AppText>
        </View>
        <View style={styles.mtrhPill}>
          <AppText variant="overline" weight={800} color={colors.primaryContainer}>
            MTRH ELDORET
          </AppText>
        </View>
      </View>

      {/* Segmented Navigation Tabs */}
      <View style={styles.segmentedTabsContainer}>
        <PressableScale
          onPress={() => setActiveTab('upcoming')}
          style={[
            styles.segmentTab,
            activeTab === 'upcoming' ? styles.segmentTabActive : null,
          ]}>
          <AppText
            variant="label-md"
            weight={700}
            color={activeTab === 'upcoming' ? colors.secondary : colors.textMuted}>
            Upcoming
          </AppText>
          <View
            style={[
              styles.countPill,
              activeTab === 'upcoming' ? styles.countPillActive : null,
            ]}>
            <AppText
              variant="label-sm"
              weight={700}
              color={activeTab === 'upcoming' ? colors.secondary : colors.textMuted}>
              {upcomingList.length}
            </AppText>
          </View>
        </PressableScale>

        <PressableScale
          onPress={() => setActiveTab('past')}
          style={[
            styles.segmentTab,
            activeTab === 'past' ? styles.segmentTabActive : null,
          ]}>
          <AppText
            variant="label-md"
            weight={700}
            color={activeTab === 'past' ? colors.secondary : colors.textMuted}>
            Past & Completed
          </AppText>
          <View
            style={[
              styles.countPill,
              activeTab === 'past' ? styles.countPillActive : null,
            ]}>
            <AppText
              variant="label-sm"
              weight={700}
              color={activeTab === 'past' ? colors.secondary : colors.textMuted}>
              {pastList.length}
            </AppText>
          </View>
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 40 },
        ]}
        showsVerticalScrollIndicator={false}>
        {activeTab === 'upcoming' ? (
          <View style={styles.appointmentsList}>
            {upcomingList.map((appt, idx) => {
              const isToday = appt.date === '2026-09-22';

              return (
                <Card key={appt.id} style={styles.apptCard}>
                  {isToday ? (
                    <View style={styles.activeTodayHeader}>
                      <View style={styles.activeTodayLeft}>
                        <View style={styles.activeDot} />
                        <AppText variant="overline" weight={800} color={colors.secondary} uppercase>
                          Active Today
                        </AppText>
                      </View>
                      <View style={styles.tokenPill}>
                        <AppText variant="overline" weight={800} color={colors.secondary}>
                          TOKEN #{appt.queueNumber}
                        </AppText>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.cardMain}>
                    <View style={styles.doctorHeader}>
                      <Image
                        source={
                          appt.doctorId === 'doc-david-kiprono'
                            ? DOCTOR_IMAGES['doc-david-kiprono']
                            : DOCTOR_IMAGES['doc-sarah-wanjiku']
                        }
                        style={styles.doctorAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.doctorInfoCol}>
                        <View style={styles.doctorTitleRow}>
                          <AppText variant="headline-md" weight={700} color={colors.brandNavy} numberOfLines={1}>
                            {appt.doctorName}
                          </AppText>
                          <View style={styles.statusPill}>
                            <AppText variant="label-sm" weight={700} color={colors.primaryContainer}>
                              Confirmed
                            </AppText>
                          </View>
                        </View>
                        <AppText variant="body-sm" color={colors.textMuted} numberOfLines={1}>
                          {appt.doctorSpecialty}
                        </AppText>
                        <View style={styles.roomLocationRow}>
                          <Icon name="location_on" size={14} color={colors.primaryContainer} />
                          <AppText variant="body-sm" color={colors.brandNavy} numberOfLines={1}>
                            {appt.facility}, {appt.room ?? 'Room 14'}
                          </AppText>
                        </View>
                      </View>
                    </View>

                    {/* Date & Time Ribbon */}
                    <View style={styles.dateTimeRibbon}>
                      <View style={styles.dateTimeLeft}>
                        <Icon name="schedule" size={16} color={colors.secondary} />
                        <View>
                          <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                            {appt.date === '2026-09-22' ? 'Today, 22 Sep 2026' : 'Tomorrow, 23 Sep 2026'}
                          </AppText>
                          <AppText variant="body-sm" color={colors.textMuted}>
                            {appt.timeSlot}
                          </AppText>
                        </View>
                      </View>
                      <View style={styles.slotBadge}>
                        <AppText variant="label-sm" weight={600} color={colors.brandNavy}>
                          Slot #{appt.queueNumber < 10 ? `0${appt.queueNumber}` : appt.queueNumber}
                        </AppText>
                      </View>
                    </View>

                    {/* Live Queue Telemetry (for today's appointment) */}
                    {isToday ? (() => {
                      const qStatus = getDoctorQueueStatus(appt.doctorId, appt.date);
                      const servingNum = qStatus.nowServing;
                      const ahead = Math.max(0, appt.queueNumber - servingNum - 1);
                      const doc = doctors.find((d) => d.id === appt.doctorId);
                      const waitMins = ahead * (doc?.avgConsultationMins ?? 5);

                      return (
                        <View style={styles.telemetryBox}>
                          <View style={styles.telemetryHeader}>
                            <View style={styles.telemetryLeft}>
                              <Icon name="sensors" size={14} color={colors.secondary} />
                              <AppText variant="label-sm" weight={700} color={colors.secondary}>
                                Live Queue Telemetry
                              </AppText>
                            </View>
                            <AppText variant="body-sm" weight={700} color={colors.brandNavy}>
                              Serving #{servingNum}
                            </AppText>
                          </View>

                          <View style={styles.progressBarBg}>
                            <View style={styles.progressBarFill} />
                          </View>

                          <View style={styles.telemetryFooter}>
                            <AppText variant="body-sm" weight={600} color={colors.brandNavy}>
                              {ahead} patients ahead of you
                            </AppText>
                            <AppText variant="body-sm" weight={600} color={colors.secondary}>
                              ~{waitMins} mins wait
                            </AppText>
                          </View>
                        </View>
                      );
                    })() : null}

                    {/* Actions */}
                    <View style={styles.actionsBlock}>
                      {isToday ? (
                        <Button
                          label="Track Live Queue"
                          variant="blue"
                          icon="confirmation_number"
                          trailingIcon="arrow_forward"
                          onPress={() => router.push('/(tabs)/queue')}
                          height={46}
                        />
                      ) : null}

                      <View style={styles.buttonRow}>
                        <PressableScale
                          onPress={() =>
                            router.push({
                              pathname: '/appointments/reschedule',
                              params: { appointmentId: appt.id },
                            } as any)
                          }
                          style={styles.subBtn}>
                          <Icon name="edit_calendar" size={16} color={colors.textMuted} />
                          <AppText variant="label-md" weight={600} color={colors.brandNavy}>
                            Reschedule
                          </AppText>
                        </PressableScale>

                        <PressableScale
                          onPress={() => handleCancel(appt.id)}
                          style={styles.cancelSubBtn}>
                          <Icon name="cancel" size={16} color={colors.statusDanger} />
                          <AppText variant="label-md" weight={600} color={colors.statusDanger}>
                            Cancel
                          </AppText>
                        </PressableScale>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={styles.pastSection}>
            <View style={styles.pastHeader}>
              <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                Past Records
              </AppText>
              <View style={styles.pastBadge}>
                <AppText variant="label-sm" weight={700} color={colors.textMuted}>
                  Recent
                </AppText>
              </View>
            </View>

            {pastList.map((past) => (
              <Card key={past.id} style={styles.pastCard}>
                <View style={styles.pastTop}>
                  <View style={styles.pastDoctorLeft}>
                    <View style={styles.dentistryIconWrap}>
                      <Icon name="dentistry" size={20} color={colors.primaryContainer} />
                    </View>
                    <View>
                      <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                        {past.doctorName}
                      </AppText>
                      <AppText variant="body-sm" color={colors.textMuted}>
                        {past.doctorSpecialty} • {past.date}
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.completedTag}>
                    <Icon name="check_circle" filled size={12} color={colors.primaryContainer} />
                    <AppText variant="overline" weight={800} color={colors.primaryContainer}>
                      COMPLETED
                    </AppText>
                  </View>
                </View>

                <View style={styles.pastFooter}>
                  <View style={styles.ratingLeft}>
                    <Icon name="star" filled size={14} color={palette.amber500} />
                    <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                      5.0
                    </AppText>
                    <AppText variant="body-sm" color={colors.textMuted}>
                      (Patient Review)
                    </AppText>
                  </View>

                  <PressableScale
                    onPress={() =>
                      router.push({
                        pathname: '/feedback/rating',
                        params: { appointmentId: past.id, doctorId: past.doctorId },
                      } as any)
                    }
                    style={styles.reviewBtn}>
                    <Icon name="rate_review" size={16} color={colors.primaryContainer} />
                    <AppText variant="label-md" weight={700} color={colors.primaryContainer}>
                      Rate Visit
                    </AppText>
                  </PressableScale>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Emergency Triage Aside Banner */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyLeft}>
            <View style={styles.emergencyIconWrap}>
              <Icon name="medical_information" size={22} color={colors.statusDanger} />
            </View>
            <View>
              <AppText variant="label-lg" weight={700} color={colors.brandNavy}>
                Need Urgent Triage?
              </AppText>
              <AppText variant="body-sm" color={colors.textMuted}>
                MTRH Outpatient Desk: 0700 000 000
              </AppText>
            </View>
          </View>
          <PressableScale
            onPress={() => Alert.alert('Dial Desk', 'Calling 0700 000 000...')}
            style={styles.callDeskBtn}>
            <Icon name="call" size={16} color={colors.statusDanger} />
            <AppText variant="label-md" weight={700} color={colors.brandNavy}>
              Call Desk
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
  patientContextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  patientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mtrhPill: {
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  segmentedTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: radius.lg,
  },
  segmentTabActive: {
    backgroundColor: colors.surfaceCard,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainer,
  },
  countPillActive: {
    backgroundColor: colors.brandBlueSoft,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  appointmentsList: {
    gap: 16,
  },
  apptCard: {
    padding: 0,
    overflow: 'hidden',
  },
  activeTodayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  activeTodayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  tokenPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(39, 82, 183, 0.2)',
  },
  cardMain: {
    padding: 16,
    gap: 14,
  },
  doctorHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.brandGreenSoft,
  },
  doctorInfoCol: {
    flex: 1,
    gap: 2,
  },
  doctorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roomLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateTimeRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dateTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotBadge: {
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  telemetryBox: {
    backgroundColor: 'rgba(235, 241, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(39, 82, 183, 0.2)',
    borderRadius: radius.xl,
    padding: 12,
    gap: 8,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  progressBarFill: {
    width: '66%',
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  telemetryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionsBlock: {
    gap: 8,
    paddingTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subBtn: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cancelSubBtn: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  pastSection: {
    gap: 12,
  },
  pastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pastBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pastCard: {
    padding: 14,
    gap: 10,
  },
  pastTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastDoctorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dentistryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandGreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pastFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: 14,
    marginTop: 8,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emergencyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    backgroundColor: palette.red100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callDeskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
});
