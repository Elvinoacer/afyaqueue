import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useApp } from '@/store/app-context';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/metrics';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    currentRole,
    switchRole,
    signOut,
    notificationSettings,
    updateNotificationSettings,
  } = useApp();

  const handleToggleSMS = (val: boolean) => {
    updateNotificationSettings({ smsAlerts: val });
  };

  const handleTogglePush = (val: boolean) => {
    updateNotificationSettings({ pushNotifications: val });
  };

  const handleToggleChime = (val: boolean) => {
    updateNotificationSettings({ audioChimes: val });
  };

  const handleSwitchRole = async () => {
    const nextRole = currentRole === 'patient' ? 'staff' : 'patient';
    await switchRole(nextRole);
    Alert.alert(
      'Role Switched',
      `Switched session to ${nextRole === 'staff' ? 'Clinic Staff Desk' : 'Patient Experience'}.`,
      [
        {
          text: 'Continue',
          onPress: () => {
            if (nextRole === 'staff') {
              router.replace('/(tabs)/desk');
            } else {
              router.replace('/(tabs)/discover');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of AfyaQueue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Profile & Settings"
        showBack={false}
        showHospitalBadge
        hospitalText="MTRH Account & Settings"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 84 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Profile Identity Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Icon
                name={currentRole === 'staff' ? 'badge' : 'person'}
                size={30}
                color={currentRole === 'staff' ? colors.secondary : colors.primaryContainer}
              />
            </View>
            <View style={styles.profileDetails}>
              <View style={styles.nameRow}>
                <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                  {currentUser?.name ?? 'Kevin Kibet'}
                </AppText>
                <View
                  style={[
                    styles.roleBadge,
                    currentRole === 'staff' ? styles.roleBadgeStaff : styles.roleBadgePatient,
                  ]}>
                  <AppText
                    variant="overline"
                    weight={800}
                    color={currentRole === 'staff' ? colors.secondary : colors.primaryContainer}>
                    {currentRole === 'staff' ? 'CLINIC DESK' : 'PATIENT'}
                  </AppText>
                </View>
              </View>
              <AppText variant="body-sm" color={colors.textMuted}>
                {currentUser?.email ?? 'kevin.kibet@gmail.com'}
              </AppText>
              <AppText variant="body-sm" weight={600} color={colors.brandNavy}>
                Phone: {currentUser?.phone ?? '0712 345 678'}
              </AppText>
            </View>
          </View>

          <View style={styles.facilityRow}>
            <Icon name="domain" size={16} color={colors.secondary} />
            <AppText variant="body-sm" color={colors.brandNavy}>
              {currentUser?.facility ?? 'Moi Teaching & Referral Hospital (Eldoret)'}
            </AppText>
          </View>
        </Card>

        {/* Dual-Role Switcher Card */}
        <Card style={styles.roleSwitcherCard}>
          <View style={styles.roleSwitcherLeft}>
            <View style={styles.switchIconWrap}>
              <Icon name="sync_alt" size={20} color={colors.secondary} />
            </View>
            <View style={styles.switchInfo}>
              <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                Dual-Role Simulation Switch
              </AppText>
              <AppText variant="body-sm" color={colors.textMuted}>
                Currently logged in as{' '}
                <AppText weight={700} color={colors.brandNavy}>
                  {currentRole === 'staff' ? 'Clinic Staff / Desk' : 'Patient'}
                </AppText>
              </AppText>
            </View>
          </View>

          <Button
            label={currentRole === 'staff' ? 'Switch to Patient' : 'Switch to Staff'}
            variant="secondary"
            height={38}
            textVariant="label-sm"
            fullWidth={false}
            onPress={handleSwitchRole}
          />
        </Card>

        {/* Notification Settings */}
        <View style={styles.sectionBlock}>
          <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
            Notification & Audio Preferences
          </AppText>

          <Card style={styles.settingsCard}>
            {/* SMS Alerts */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="sms" size={20} color={colors.secondary} />
                <View>
                  <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                    SMS Turn Alerts
                  </AppText>
                  <AppText variant="body-sm" color={colors.textMuted}>
                    Receive SMS dispatch when 2 people are ahead
                  </AppText>
                </View>
              </View>
              <Switch
                value={notificationSettings.smsAlerts}
                onValueChange={handleToggleSMS}
                trackColor={{ false: colors.surfaceContainer, true: colors.primaryContainer }}
              />
            </View>

            <View style={styles.divider} />

            {/* Push Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="notifications_active" size={20} color={colors.secondary} />
                <View>
                  <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                    Push Notifications
                  </AppText>
                  <AppText variant="body-sm" color={colors.textMuted}>
                    Instant real-time queue position telemetry
                  </AppText>
                </View>
              </View>
              <Switch
                value={notificationSettings.pushNotifications}
                onValueChange={handleTogglePush}
                trackColor={{ false: colors.surfaceContainer, true: colors.primaryContainer }}
              />
            </View>

            <View style={styles.divider} />

            {/* Audio Chimes */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="volume_up" size={20} color={colors.secondary} />
                <View>
                  <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                    Queue Audio Chime
                  </AppText>
                  <AppText variant="body-sm" color={colors.textMuted}>
                    Sound PA chime tone when your token is called
                  </AppText>
                </View>
              </View>
              <Switch
                value={notificationSettings.audioChimes}
                onValueChange={handleToggleChime}
                trackColor={{ false: colors.surfaceContainer, true: colors.primaryContainer }}
              />
            </View>
          </Card>
        </View>

        {/* Offline Cache & Persistence Health */}
        <Card style={styles.cacheHealthCard}>
          <View style={styles.cacheHeader}>
            <Icon name="cloud_done" size={20} color={colors.primaryContainer} />
            <AppText variant="label-md" weight={700} color={colors.brandNavy}>
              Local Persistence & Offline Cache
            </AppText>
          </View>
          <AppText variant="body-sm" color={colors.textMuted}>
            Active token, doctor directory, and historical appointment records are cached locally via AsyncStorage & Firestore offline persistence.
          </AppText>
        </Card>

        {/* Emergency Hotline Button */}
        <PressableScale
          onPress={() => Alert.alert('Emergency', 'Calling MTRH Outpatient Emergency Hotline (0700 000 000)...')}
          style={styles.emergencyBtn}>
          <Icon name="call" size={18} color={colors.statusDanger} />
          <AppText variant="label-md" weight={700} color={colors.statusDanger}>
            Emergency Triage Hotline: 0700 000 000
          </AppText>
        </PressableScale>

        {/* Sign Out Button */}
        <Button
          label="Sign Out of AfyaQueue"
          variant="danger"
          icon="logout"
          onPress={handleSignOut}
          height={48}
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
  profileCard: {
    padding: 16,
    gap: 12,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roleBadgePatient: {
    backgroundColor: colors.brandGreenSoft,
  },
  roleBadgeStaff: {
    backgroundColor: colors.brandBlueSoft,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  roleSwitcherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  roleSwitcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  switchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchInfo: {
    flex: 1,
    gap: 2,
  },
  sectionBlock: {
    gap: 10,
  },
  settingsCard: {
    padding: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 4,
  },
  cacheHealthCard: {
    padding: 14,
    gap: 6,
    backgroundColor: colors.brandGreenSoft,
    borderColor: 'rgba(30, 122, 70, 0.2)',
  },
  cacheHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: radius.xl,
  },
});
