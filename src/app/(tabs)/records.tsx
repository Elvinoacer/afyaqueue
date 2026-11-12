import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useApp } from '@/store/app-context';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/metrics';

type RecordTab = 'prescriptions' | 'visits' | 'labs';

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, medicalRecords } = useApp();

  const [activeTab, setActiveTab] = useState<RecordTab>('prescriptions');

  const allPrescriptions = medicalRecords.flatMap((r) =>
    r.prescriptions.map((p) => ({
      ...p,
      doctorName: r.doctorName,
      specialty: r.specialty,
      date: r.date,
    }))
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Medical Records"
        showBack={false}
        showHospitalBadge
        hospitalText="MTRH Patient Health Portal"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Patient Health ID Card */}
        <Card style={styles.patientProfileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.profileAvatar}>
              <Icon name="person" size={26} color={colors.primaryContainer} />
            </View>
            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                  {currentUser?.name ?? 'Kevin Kibet'}
                </AppText>
                <View style={styles.insuredBadge}>
                  <AppText variant="overline" weight={800} color={colors.primaryContainer}>
                    SHA VERIFIED
                  </AppText>
                </View>
              </View>
              <AppText variant="body-sm" color={colors.textMuted}>
                Hospital Reg No: <AppText weight={700} color={colors.brandNavy}>{currentUser?.patientRegNo ?? 'PT-2026-0142'}</AppText>
              </AppText>
            </View>
          </View>

          {/* Vitals & Baseline Row */}
          <View style={styles.baselineGrid}>
            <View style={styles.baselineCell}>
              <AppText variant="overline" color={colors.textMuted}>
                BLOOD GROUP
              </AppText>
              <AppText variant="label-md" weight={800} color={colors.brandNavy}>
                O+ Positive
              </AppText>
            </View>
            <View style={styles.baselineCell}>
              <AppText variant="overline" color={colors.textMuted}>
                ALLERGIES
              </AppText>
              <AppText variant="label-md" weight={700} color={colors.primaryContainer}>
                NKDA (None)
              </AppText>
            </View>
            <View style={styles.baselineCell}>
              <AppText variant="overline" color={colors.textMuted}>
                EMERGENCY CONTACT
              </AppText>
              <AppText variant="label-md" weight={600} color={colors.brandNavy}>
                0722 345 678
              </AppText>
            </View>
          </View>
        </Card>

        {/* Record Segment Tabs */}
        <View style={styles.tabsStrip}>
          <PressableScale
            onPress={() => setActiveTab('prescriptions')}
            style={[
              styles.tabBtn,
              activeTab === 'prescriptions' ? styles.tabBtnActive : null,
            ]}>
            <Icon
              name="medication"
              size={16}
              color={activeTab === 'prescriptions' ? colors.secondary : colors.textMuted}
            />
            <AppText
              variant="label-md"
              weight={activeTab === 'prescriptions' ? 700 : 500}
              color={activeTab === 'prescriptions' ? colors.secondary : colors.textMuted}>
              Prescriptions ({allPrescriptions.length})
            </AppText>
          </PressableScale>

          <PressableScale
            onPress={() => setActiveTab('visits')}
            style={[
              styles.tabBtn,
              activeTab === 'visits' ? styles.tabBtnActive : null,
            ]}>
            <Icon
              name="clinical_notes"
              size={16}
              color={activeTab === 'visits' ? colors.secondary : colors.textMuted}
            />
            <AppText
              variant="label-md"
              weight={activeTab === 'visits' ? 700 : 500}
              color={activeTab === 'visits' ? colors.secondary : colors.textMuted}>
              Visits ({medicalRecords.length})
            </AppText>
          </PressableScale>

          <PressableScale
            onPress={() => setActiveTab('labs')}
            style={[
              styles.tabBtn,
              activeTab === 'labs' ? styles.tabBtnActive : null,
            ]}>
            <Icon
              name="biotech"
              size={16}
              color={activeTab === 'labs' ? colors.secondary : colors.textMuted}
            />
            <AppText
              variant="label-md"
              weight={activeTab === 'labs' ? 700 : 500}
              color={activeTab === 'labs' ? colors.secondary : colors.textMuted}>
              Lab Results
            </AppText>
          </PressableScale>
        </View>

        {/* Content based on Active Tab */}
        {activeTab === 'prescriptions' ? (
          <View style={styles.prescriptionsList}>
            {allPrescriptions.map((rx, idx) => (
              <Card key={idx} style={styles.rxCard}>
                <View style={styles.rxHeader}>
                  <View style={styles.rxTitleCol}>
                    <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                      {rx.medication}
                    </AppText>
                    <AppText variant="label-md" weight={600} color={colors.secondary}>
                      {rx.dosage} • {rx.frequency}
                    </AppText>
                  </View>
                  <View style={styles.activeRxTag}>
                    <AppText variant="overline" weight={800} color={colors.primaryContainer}>
                      ACTIVE
                    </AppText>
                  </View>
                </View>

                {rx.instructions ? (
                  <View style={styles.rxInstructionsBox}>
                    <Icon name="info" size={14} color={colors.secondary} />
                    <AppText variant="body-sm" color={colors.brandNavy} style={styles.instructionsText}>
                      {rx.instructions}
                    </AppText>
                  </View>
                ) : null}

                <View style={styles.rxFooterRow}>
                  <View>
                    <AppText variant="body-sm" color={colors.textMuted}>
                      Prescribed by {rx.doctorName}
                    </AppText>
                    <AppText variant="label-sm" color={colors.textMuted}>
                      Date: {rx.date} • Duration: {rx.duration}
                    </AppText>
                  </View>

                  <PressableScale
                    onPress={() => Alert.alert('Pharmacy Refill', `Refill order for ${rx.medication} submitted to MTRH Outpatient Pharmacy Wing B.`)}
                    style={styles.refillBtn}>
                    <Icon name="local_pharmacy" size={14} color={colors.secondary} />
                    <AppText variant="label-sm" weight={700} color={colors.secondary}>
                      Request Refill
                    </AppText>
                  </PressableScale>
                </View>
              </Card>
            ))}
          </View>
        ) : activeTab === 'visits' ? (
          <View style={styles.visitsList}>
            {medicalRecords.map((record) => (
              <Card key={record.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <View>
                    <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                      {record.doctorName}
                    </AppText>
                    <AppText variant="body-sm" color={colors.textMuted}>
                      {record.specialty} • {record.facility}
                    </AppText>
                  </View>
                  <View style={styles.datePill}>
                    <AppText variant="label-sm" weight={700} color={colors.brandNavy}>
                      {record.date}
                    </AppText>
                  </View>
                </View>

                <View style={styles.diagnosisBox}>
                  <AppText variant="overline" color={colors.textMuted}>
                    CLINICAL DIAGNOSIS & ASSESSMENT
                  </AppText>
                  <AppText variant="body-md" weight={600} color={colors.brandNavy} style={styles.diagnosisText}>
                    {record.diagnosis}
                  </AppText>
                </View>

                {record.notes ? (
                  <AppText variant="body-sm" color={colors.textMuted}>
                    Physician Notes: {record.notes}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.labsList}>
            {medicalRecords.flatMap((r) => r.labResults ?? []).map((lab, i) => (
              <Card key={i} style={styles.labCard}>
                <View style={styles.labIconWrap}>
                  <Icon name="biotech" size={20} color={colors.secondary} />
                </View>
                <View style={styles.labInfo}>
                  <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                    {lab}
                  </AppText>
                  <AppText variant="body-sm" color={colors.primaryContainer} weight={600}>
                    Status: Within Certified Reference Range
                  </AppText>
                </View>
                <Icon name="check_circle" filled size={16} color={colors.primaryContainer} />
              </Card>
            ))}
          </View>
        )}

        {/* Download Summary Action */}
        <Button
          label="Download Certified MTRH Summary (PDF)"
          variant="secondary"
          icon="download"
          onPress={() => Alert.alert('Export PDF', 'Generating signed PDF health record summary with QR verification code...')}
          height={48}
          style={styles.downloadBtn}
        />
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
  patientProfileCard: {
    padding: 16,
    gap: 12,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandGreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insuredBadge: {
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  baselineGrid: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 8,
  },
  baselineCell: {
    flex: 1,
    gap: 2,
  },
  tabsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    padding: 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    borderRadius: radius.lg,
  },
  tabBtnActive: {
    backgroundColor: colors.surfaceCard,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  prescriptionsList: {
    gap: 12,
  },
  rxCard: {
    padding: 16,
    gap: 10,
  },
  rxHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rxTitleCol: {
    flex: 1,
    gap: 2,
  },
  activeRxTag: {
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  rxInstructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.brandBlueSoft,
    padding: 10,
    borderRadius: radius.lg,
  },
  instructionsText: {
    flex: 1,
    lineHeight: 18,
  },
  rxFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  refillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.lg,
  },
  visitsList: {
    gap: 12,
  },
  visitCard: {
    padding: 16,
    gap: 10,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePill: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  diagnosisBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: radius.lg,
    gap: 4,
  },
  diagnosisText: {
    marginTop: 2,
  },
  labsList: {
    gap: 10,
  },
  labCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  labIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labInfo: {
    flex: 1,
    gap: 2,
  },
  downloadBtn: {
    marginTop: 4,
  },
});
