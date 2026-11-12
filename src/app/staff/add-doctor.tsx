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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useApp } from '@/store/app-context';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/metrics';

const SPECIALTIES = [
  'General Medicine',
  'Pediatrics',
  'Dental Surgery',
  'Cardiology',
  'ENT & Head Specialist',
  'Orthopedics',
];

const DEFAULT_SLOTS = [
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
];

export default function AddDoctorScreen() {
  const insets = useSafeAreaInsets();
  const { addDoctor } = useApp();

  const [name, setName] = useState('Dr. Jane Mutua');
  const [specialty, setSpecialty] = useState('General Medicine');
  const facility = 'Moi Teaching Hospital';
  const [room, setRoom] = useState('Wing 4B, Room 16');
  const [consultationFee, setConsultationFee] = useState('500');
  const [availableDate, setAvailableDate] = useState('2026-09-22');
  const [selectedSlots, setSelectedSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [avgConsultationMins, setAvgConsultationMins] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter clinician name');
      return;
    }
    if (selectedSlots.length === 0) {
      Alert.alert('Slots Required', 'Please enable at least one time slot');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoctor({
        name: name.trim(),
        specialty,
        facility: facility.trim(),
        room: room.trim(),
        consultationFee: parseInt(consultationFee, 10) || 500,
        availableDate,
        availableSlots: selectedSlots,
        avgConsultationMins,
        photoUrl: 'doc-sarah-wanjiku',
        rating: 5.0,
        reviewCount: 1,
        experienceYears: 5,
      });

      Alert.alert(
        'Clinician Registered',
        `${name} has been published with live queue dispatch enabled on desk.`,
        [
          {
            text: 'View Desk',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add clinician.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Add Clinician Service"
        showBack
        showHospitalBadge={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Input
            label="Clinician Full Name"
            required
            icon="person"
            placeholder="e.g. Dr. Jane Mutua"
            value={name}
            onChangeText={setName}
          />

          {/* Specialty Selector */}
          <View style={styles.fieldSection}>
            <AppText variant="label-sm" weight={700} color={colors.brandNavy} uppercase>
              Department / Specialty *
            </AppText>
            <View style={styles.specialtiesGrid}>
              {SPECIALTIES.map((spec) => {
                const isSelected = specialty === spec;
                return (
                  <PressableScale
                    key={spec}
                    onPress={() => setSpecialty(spec)}
                    style={[
                      styles.specialtyChip,
                      isSelected ? styles.specialtyChipActive : null,
                    ]}>
                    <AppText
                      variant="label-md"
                      weight={isSelected ? 700 : 500}
                      color={isSelected ? colors.white : colors.brandNavy}>
                      {spec}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <Input
            label="Facility & Consultation Room"
            required
            icon="meeting_room"
            placeholder="e.g. Wing 4B, Room 16"
            value={room}
            onChangeText={setRoom}
          />

          <View style={styles.rowTwoCols}>
            <View style={styles.col}>
              <Input
                label="Consultation Fee (KSh)"
                required
                icon="payments"
                placeholder="500"
                keyboardType="numeric"
                value={consultationFee}
                onChangeText={setConsultationFee}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Available Date"
                required
                icon="calendar_month"
                placeholder="2026-09-22"
                value={availableDate}
                onChangeText={setAvailableDate}
              />
            </View>
          </View>

          {/* Average Consultation Duration Stepper */}
          <View style={styles.fieldSection}>
            <AppText variant="label-sm" weight={700} color={colors.brandNavy} uppercase>
              Average Consultation Time (Minutes)
            </AppText>
            <View style={styles.stepperRow}>
              {[5, 8, 10, 15, 20].map((mins) => {
                const isSelected = avgConsultationMins === mins;
                return (
                  <PressableScale
                    key={mins}
                    onPress={() => setAvgConsultationMins(mins)}
                    style={[
                      styles.stepperBtn,
                      isSelected ? styles.stepperBtnActive : null,
                    ]}>
                    <AppText
                      variant="label-md"
                      weight={isSelected ? 700 : 600}
                      color={isSelected ? colors.white : colors.brandNavy}>
                      {mins}m
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Available Slots Generator */}
          <View style={styles.fieldSection}>
            <View style={styles.slotsHeader}>
              <AppText variant="label-sm" weight={700} color={colors.brandNavy} uppercase>
                Generate Available Time Slots ({selectedSlots.length} Enabled)
              </AppText>
              <PressableScale
                onPress={() =>
                  setSelectedSlots(
                    selectedSlots.length === DEFAULT_SLOTS.length ? [] : DEFAULT_SLOTS
                  )
                }>
                <AppText variant="label-sm" weight={700} color={colors.secondary}>
                  {selectedSlots.length === DEFAULT_SLOTS.length ? 'Clear All' : 'Select All'}
                </AppText>
              </PressableScale>
            </View>

            <View style={styles.slotsGrid}>
              {DEFAULT_SLOTS.map((slot) => {
                const isSelected = selectedSlots.includes(slot);
                return (
                  <PressableScale
                    key={slot}
                    onPress={() => toggleSlot(slot)}
                    style={[
                      styles.slotChip,
                      isSelected ? styles.slotChipActive : null,
                    ]}>
                    <Icon
                      name={isSelected ? 'check' : 'add'}
                      size={14}
                      color={isSelected ? colors.white : colors.textMuted}
                    />
                    <AppText
                      variant="label-sm"
                      weight={isSelected ? 700 : 500}
                      color={isSelected ? colors.white : colors.brandNavy}>
                      {slot}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Primary Action Button */}
          <Button
            label={isSubmitting ? 'Registering...' : 'Publish Doctor & Enable Live Queue'}
            variant="green"
            trailingIcon="arrow_forward"
            onPress={handleSave}
            loading={isSubmitting}
            height={50}
            style={styles.saveBtn}
          />
        </Card>
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
  },
  formCard: {
    padding: 16,
    gap: 16,
  },
  fieldSection: {
    gap: 8,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
  },
  specialtyChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnActive: {
    backgroundColor: colors.primaryContainer,
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
  },
  slotChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  saveBtn: {
    marginTop: 8,
  },
});
