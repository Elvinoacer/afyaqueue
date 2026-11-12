import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
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
import { colors, palette } from '@/theme/colors';
import { radius } from '@/theme/metrics';

export default function BroadcastAnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const { announcements, broadcastAnnouncement, dismissAnnouncement } = useApp();

  const [message, setMessage] = useState(
    'Dr. Otieno is unavailable this afternoon — reschedule available through AfyaQueue portal.'
  );
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('urgent');
  const [targetAudience, setTargetAudience] = useState('All Outpatients');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async () => {
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter announcement message');
      return;
    }

    setIsBroadcasting(true);
    try {
      await broadcastAnnouncement(message.trim(), urgency);
      Alert.alert(
        'Broadcast Dispatched',
        'Announcement broadcasted to active patient waiting room devices.'
      );
      setMessage('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send broadcast.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Facility Announcements"
        showBack
        showHospitalBadge={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Composer Card */}
        <Card style={styles.composerCard}>
          <View style={styles.composerHeader}>
            <View style={styles.composerTitleRow}>
              <Icon name="campaign" size={22} color={colors.tertiary} />
              <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                Broadcast Live Alert
              </AppText>
            </View>
            <View style={styles.wingTag}>
              <AppText variant="overline" weight={700} color={colors.brandNavy}>
                MTRH WING 4B
              </AppText>
            </View>
          </View>

          {/* Urgency Toggle */}
          <View style={styles.urgencyRow}>
            <PressableScale
              onPress={() => setUrgency('normal')}
              style={[
                styles.urgencyBtn,
                urgency === 'normal' ? styles.urgencyNormalActive : null,
              ]}>
              <Icon
                name="info"
                size={16}
                color={urgency === 'normal' ? colors.primaryContainer : colors.textMuted}
              />
              <AppText
                variant="label-md"
                weight={urgency === 'normal' ? 700 : 500}
                color={urgency === 'normal' ? colors.primaryContainer : colors.textMuted}>
                Standard Notice
              </AppText>
            </PressableScale>

            <PressableScale
              onPress={() => setUrgency('urgent')}
              style={[
                styles.urgencyBtn,
                urgency === 'urgent' ? styles.urgencyAlertActive : null,
              ]}>
              <Icon
                name="warning"
                size={16}
                color={urgency === 'urgent' ? colors.brandAccentRust : colors.textMuted}
              />
              <AppText
                variant="label-md"
                weight={urgency === 'urgent' ? 700 : 500}
                color={urgency === 'urgent' ? colors.brandAccentRust : colors.textMuted}>
                Urgent Alert
              </AppText>
            </PressableScale>
          </View>

          {/* Message Text Input */}
          <View style={styles.textInputBox}>
            <TextInput
              multiline
              numberOfLines={4}
              placeholder="Enter announcement text to broadcast to waiting patients..."
              placeholderTextColor={palette.slate400}
              value={message}
              onChangeText={setMessage}
              maxLength={250}
              style={styles.textInput}
            />
            <View style={styles.charCountRow}>
              <AppText variant="overline" color={colors.textMuted}>
                {message.length} / 250 CHARACTERS
              </AppText>
            </View>
          </View>

          {/* Target Audience Selector */}
          <View style={styles.audienceSection}>
            <AppText variant="label-sm" weight={700} color={colors.brandNavy} uppercase>
              Target Audience
            </AppText>
            <View style={styles.audienceChipsRow}>
              {['All Outpatients', 'General Medicine', 'Pharmacy', 'Lab Triage'].map((aud) => {
                const isSelected = targetAudience === aud;
                return (
                  <PressableScale
                    key={aud}
                    onPress={() => setTargetAudience(aud)}
                    style={[
                      styles.audienceChip,
                      isSelected ? styles.audienceChipActive : null,
                    ]}>
                    <AppText
                      variant="label-sm"
                      weight={isSelected ? 700 : 500}
                      color={isSelected ? colors.white : colors.brandNavy}>
                      {aud}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Primary Action Button */}
          <Button
            label={isBroadcasting ? 'Broadcasting...' : 'Broadcast Live Announcement'}
            variant="rust"
            trailingIcon="send"
            onPress={handleBroadcast}
            loading={isBroadcasting}
            height={50}
            style={styles.broadcastBtn}
          />
        </Card>

        {/* Active Announcements Stream */}
        <View style={styles.streamSection}>
          <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
            Active Facility Broadcasts ({announcements.length})
          </AppText>

          <View style={styles.streamList}>
            {announcements.map((ann) => {
              const isUrgent = ann.urgency === 'urgent';
              return (
                <Card
                  key={ann.id}
                  style={[
                    styles.announcementCard,
                    isUrgent ? styles.announcementCardUrgent : null,
                  ]}>
                  <View style={styles.announcementTop}>
                    <View style={styles.announcementAuthorRow}>
                      <Icon
                        name={isUrgent ? 'campaign' : 'notifications'}
                        size={18}
                        color={isUrgent ? palette.amber500 : colors.secondary}
                      />
                      <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                        {ann.postedBy} ({ann.postedByRole ?? 'Staff'})
                      </AppText>
                    </View>
                    <PressableScale
                      onPress={() => dismissAnnouncement(ann.id)}
                      style={styles.dismissBtn}>
                      <Icon name="close" size={16} color={colors.textMuted} />
                    </PressableScale>
                  </View>

                  <AppText variant="body-md" color={colors.brandNavy} style={styles.announcementBody}>
                    {ann.text}
                  </AppText>

                  <View style={styles.announcementFooter}>
                    <AppText variant="body-sm" color={colors.textMuted}>
                      {ann.facility ?? 'Moi Teaching & Referral Hospital'}
                    </AppText>
                    <View
                      style={[
                        styles.urgencyTag,
                        isUrgent ? styles.urgencyTagUrgent : styles.urgencyTagNormal,
                      ]}>
                      <AppText
                        variant="overline"
                        weight={800}
                        color={isUrgent ? colors.brandAccentRust : colors.secondary}>
                        {isUrgent ? 'URGENT ALERT' : 'GENERAL NOTICE'}
                      </AppText>
                    </View>
                  </View>
                </Card>
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
    gap: 18,
  },
  composerCard: {
    padding: 16,
    gap: 14,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wingTag: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.md,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  urgencyNormalActive: {
    backgroundColor: colors.brandGreenSoft,
    borderColor: colors.primaryContainer,
  },
  urgencyAlertActive: {
    backgroundColor: '#FFF7ED',
    borderColor: colors.brandAccentRust,
  },
  textInputBox: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: 12,
    minHeight: 100,
  },
  textInput: {
    color: colors.brandNavy,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 70,
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  audienceSection: {
    gap: 8,
  },
  audienceChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  audienceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  audienceChipActive: {
    backgroundColor: colors.brandNavy,
  },
  broadcastBtn: {
    marginTop: 4,
  },
  streamSection: {
    gap: 12,
  },
  streamList: {
    gap: 10,
  },
  announcementCard: {
    padding: 14,
    gap: 8,
  },
  announcementCardUrgent: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  announcementTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  announcementAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dismissBtn: {
    padding: 2,
  },
  announcementBody: {
    lineHeight: 20,
  },
  announcementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  urgencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  urgencyTagUrgent: {
    backgroundColor: '#FED7AA',
  },
  urgencyTagNormal: {
    backgroundColor: colors.brandBlueSoft,
  },
});
