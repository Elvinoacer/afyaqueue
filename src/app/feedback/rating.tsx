import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
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
import { radius } from '@/theme/metrics';

const FEEDBACK_TAGS = [
  'Friendly & Attentive',
  'Clear Diagnosis',
  'Minimal Wait',
  'Clean Facility',
  'Professional Nurse',
  'Thorough Examination',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good Consultation',
  4: 'Very Good Care',
  5: 'Exceptional Healthcare',
};

export default function DoctorRatingScreen() {
  const insets = useSafeAreaInsets();
  const { doctorId, appointmentId } = useLocalSearchParams<{
    doctorId?: string;
    appointmentId?: string;
  }>();
  const { currentUser, doctors, appointments, submitRating } = useApp();

  const doctor =
    (doctorId ? doctors.find((d) => d.id === doctorId) : null) ??
    doctors[0];

  const appointment = appointmentId
    ? appointments.find((a) => a.id === appointmentId)
    : null;

  const [stars, setStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Friendly & Attentive',
    'Clear Diagnosis',
  ]);
  const [comment, setComment] = useState(
    `Dr. ${doctor?.name.replace(/^Dr\.\s*/, '') ?? 'Sarah'} was attentive, thorough in explaining my care plan, and the digital queue wait was surprisingly smooth!`
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitRating({
        doctorId: doctor?.id ?? 'doc-sarah-wanjiku',
        doctorName: doctor?.name ?? 'Dr. Sarah Wanjiku',
        patientId: currentUser?.uid ?? 'usr-kevin-kibet',
        patientName: isAnonymous ? 'Anonymous Patient' : (currentUser?.name ?? 'Kevin Kibet'),
        appointmentId: appointment?.id ?? (appointmentId || 'apt-today-kevin'),
        stars,
        tags: selectedTags,
        comment,
      });

      Alert.alert(
        'Thank You!',
        'Your feedback helps MTRH maintain exceptional medical standards.',
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Visit Feedback & Rating"
        showBack
        showHospitalBadge={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Doctor Summary Card */}
        <Card style={styles.doctorCard}>
          <Image
            source={
              (doctor?.photoUrl && DOCTOR_IMAGES[doctor.photoUrl]) ||
              DOCTOR_IMAGES['doc-sarah-profile']
            }
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.doctorInfo}>
            <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
              {doctor?.name ?? 'Dr. Sarah Wanjiku'}
            </AppText>
            <AppText variant="body-sm" color={colors.textMuted}>
              {doctor?.specialty ?? 'General Medicine'} • {doctor?.facility ?? 'Moi Teaching Hospital'}
            </AppText>
            <View style={styles.visitDatePill}>
              <Icon name="check_circle" filled size={12} color={colors.primaryContainer} />
              <AppText variant="label-sm" color={colors.primaryContainer}>
                Consultation Completed
              </AppText>
            </View>
          </View>
        </Card>

        {/* Star Rating Section */}
        <Card style={styles.ratingCard}>
          <AppText variant="label-lg" weight={700} color={colors.brandNavy} align="center">
            How was your clinical experience?
          </AppText>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <PressableScale
                key={star}
                onPress={() => setStars(star)}
                activeScale={0.88}
                style={styles.starTouch}>
                <Icon
                  name="star"
                  filled={star <= stars}
                  size={36}
                  color={star <= stars ? palette.amber500 : colors.surfaceContainerHigh}
                />
              </PressableScale>
            ))}
          </View>

          <View style={styles.ratingLabelBadge}>
            <AppText variant="label-md" weight={700} color={palette.amber500}>
              {RATING_LABELS[stars]}
            </AppText>
          </View>
        </Card>

        {/* Quick Feedback Tags */}
        <View style={styles.sectionBlock}>
          <AppText variant="label-lg" weight={700} color={colors.brandNavy}>
            What stood out the most?
          </AppText>
          <View style={styles.tagsFlex}>
            {FEEDBACK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <PressableScale
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.tagChip,
                    isSelected ? styles.tagChipSelected : styles.tagChipUnselected,
                  ]}>
                  {isSelected ? (
                    <Icon name="check" size={14} color={colors.white} />
                  ) : null}
                  <AppText
                    variant="label-md"
                    weight={isSelected ? 700 : 500}
                    color={isSelected ? colors.white : colors.brandNavy}>
                    {tag}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Written Review Field */}
        <View style={styles.sectionBlock}>
          <AppText variant="label-lg" weight={700} color={colors.brandNavy}>
            Detailed Comments & Observations
          </AppText>
          <View style={styles.textAreaContainer}>
            <TextInput
              multiline
              numberOfLines={4}
              placeholder="Share your experience with the physician and waiting room..."
              placeholderTextColor={palette.slate400}
              value={comment}
              onChangeText={setComment}
              style={styles.textArea}
            />
          </View>
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <AppText variant="label-md" weight={700} color={colors.brandNavy}>
              Post review anonymously
            </AppText>
            <AppText variant="body-sm" color={colors.textMuted}>
              Hide your patient name on clinic noticeboards
            </AppText>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: colors.surfaceContainer, true: colors.primaryContainer }}
          />
        </View>

        {/* Submit CTA */}
        <Button
          label={isSubmitting ? 'Submitting Review...' : 'Submit Visit Review'}
          variant="primary"
          trailingIcon="arrow_forward"
          onPress={handleSubmit}
          loading={isSubmitting}
          height={50}
          style={styles.submitBtn}
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
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  doctorInfo: {
    flex: 1,
    gap: 2,
  },
  visitDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ratingCard: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starTouch: {
    padding: 4,
  },
  ratingLabelBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sectionBlock: {
    gap: 10,
  },
  tagsFlex: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  tagChipSelected: {
    backgroundColor: colors.primaryContainer,
  },
  tagChipUnselected: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  textAreaContainer: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: 12,
    minHeight: 100,
  },
  textArea: {
    color: colors.brandNavy,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceCard,
    padding: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  switchTextCol: {
    flex: 1,
    gap: 2,
  },
  submitBtn: {
    marginTop: 8,
  },
});
