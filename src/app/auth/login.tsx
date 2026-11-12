import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import type { UserRole } from '@/types/models';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [identifier, setIdentifier] = useState('kevin.kibet@gmail.com');
  const [password, setPassword] = useState('Password123!');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'staff') {
      setIdentifier('mary.chebet@mtrh.go.ke');
    } else {
      setIdentifier('kevin.kibet@gmail.com');
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or hospital reg number');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      await signIn(identifier, password, selectedRole);
      if (selectedRole === 'staff') {
        router.replace('/(tabs)/desk');
      } else {
        router.replace('/(tabs)/discover');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    setTimeout(async () => {
      await signIn(identifier, password, selectedRole);
      setIsLoading(false);
      if (selectedRole === 'staff') {
        router.replace('/(tabs)/desk');
      } else {
        router.replace('/(tabs)/discover');
      }
    }, 700);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScreenHeader showHospitalBadge hospitalText="MTRH Outpatient Portal" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.mainLogoBadge}>
              <Icon name="local_hospital" filled size={28} color={colors.white} />
            </View>
            <View style={styles.clockSubBadge}>
              <Icon name="schedule" size={12} color={colors.white} />
            </View>
          </View>

          <AppText variant="headline-xl" weight={800} color={colors.brandNavy} style={styles.title}>
            AfyaQueue
          </AppText>
          <AppText variant="body-md" color={colors.textMuted} style={styles.subtitle}>
            Skip the wait. See a doctor.
          </AppText>

          <View style={styles.facilityPill}>
            <Icon name="domain" size={14} color={colors.secondary} />
            <AppText variant="label-sm" weight={600} color={colors.secondary}>
              Moi Teaching & Referral Hospital
            </AppText>
          </View>
        </View>

        {/* Login Surface Card */}
        <Card style={styles.card}>
          <View style={styles.cardIntro}>
            <AppText variant="headline-lg" weight={700} color={colors.brandNavy}>
              Welcome Back
            </AppText>
            <AppText variant="body-sm" color={colors.textMuted} style={styles.introSubtitle}>
              Sign in to access your queue tokens and clinic appointments
            </AppText>
          </View>

          {/* Role Segmented Tabs */}
          <View style={styles.roleTabsContainer}>
            <PressableScale
              onPress={() => handleRoleSelect('patient')}
              style={[
                styles.roleTab,
                selectedRole === 'patient' ? styles.roleTabActivePatient : null,
              ]}>
              <Icon
                name={selectedRole === 'patient' ? 'check_circle' : 'person'}
                filled={selectedRole === 'patient'}
                size={16}
                color={selectedRole === 'patient' ? colors.white : colors.textMuted}
              />
              <AppText
                variant="label-md"
                weight={selectedRole === 'patient' ? 700 : 500}
                color={selectedRole === 'patient' ? colors.white : colors.textMuted}>
                Patient
              </AppText>
            </PressableScale>

            <PressableScale
              onPress={() => handleRoleSelect('staff')}
              style={[
                styles.roleTab,
                selectedRole === 'staff' ? styles.roleTabActiveStaff : null,
              ]}>
              <Icon
                name="badge"
                filled={selectedRole === 'staff'}
                size={16}
                color={selectedRole === 'staff' ? colors.white : colors.textMuted}
              />
              <AppText
                variant="label-md"
                weight={selectedRole === 'staff' ? 700 : 500}
                color={selectedRole === 'staff' ? colors.white : colors.textMuted}>
                Clinic Staff / Desk
              </AppText>
            </PressableScale>
          </View>

          {/* Role Guidance */}
          <View style={styles.guidanceRow}>
            <Icon name="info" size={14} color={colors.textMuted} />
            <AppText variant="body-sm" color={colors.textMuted} style={styles.guidanceText}>
              {selectedRole === 'patient'
                ? 'Patients access queue numbers & discovery'
                : 'Staff access triage & live queue management desk'}
            </AppText>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Input
              label="Email or Hospital Reg Number"
              icon="mail"
              placeholder="e.g. kevin.kibet@gmail.com or PT-2026-0142"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              error={errorMessage}
            />

            <Input
              label="Password"
              icon="lock"
              placeholder="••••••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            {/* Remember Device & Forgot Password */}
            <View style={styles.utilityRow}>
              <PressableScale
                onPress={() => setRememberDevice(!rememberDevice)}
                style={styles.checkboxRow}>
                <View
                  style={[
                    styles.checkbox,
                    rememberDevice ? styles.checkboxChecked : null,
                  ]}>
                  {rememberDevice ? <Icon name="check" size={12} color={colors.white} /> : null}
                </View>
                <AppText variant="body-sm" color={colors.brandNavy}>
                  Remember device
                </AppText>
              </PressableScale>

              <PressableScale onPress={() => alert('Password reset link sent to registered email.')}>
                <AppText variant="label-md" weight={600} color={colors.secondary}>
                  Forgot password?
                </AppText>
              </PressableScale>
            </View>

            {/* Primary Brand Orange CTA */}
            <Button
              label={isLoading ? 'Signing In...' : 'Log In to AfyaQueue'}
              variant="primary"
              trailingIcon="arrow_forward"
              onPress={handleLogin}
              loading={isLoading}
              height={50}
              style={styles.loginBtn}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText variant="overline" weight={700} color={colors.textMuted} style={styles.dividerText}>
              QUICK ACCESS OPTIONS
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          {/* Biometrics / Phone Quick-Log */}
          <PressableScale onPress={handleBiometricLogin} style={styles.biometricBtn}>
            <View style={styles.biometricLeft}>
              <View style={styles.biometricIconWrapper}>
                <Icon name="fingerprint" size={22} color={colors.secondary} />
              </View>
              <View>
                <AppText variant="label-md" weight={700} color={colors.brandNavy}>
                  Biometrics / Phone Quick-Log
                </AppText>
                <AppText variant="body-sm" color={colors.textMuted}>
                  Kenya M-Pesa ID or TouchID bypass
                </AppText>
              </View>
            </View>
            <Icon name="chevron_right" size={18} color={colors.textMuted} />
          </PressableScale>
        </Card>

        {/* Register Navigation Link */}
        <View style={styles.registerRow}>
          <AppText variant="body-sm" color={colors.textMuted}>
            {"Don't have an account? "}
          </AppText>
          <PressableScale onPress={() => router.push('/auth/register')}>
            <AppText variant="label-md" weight={700} color={colors.primaryContainer}>
              Register new account
            </AppText>
          </PressableScale>
        </View>

        {/* Institutional Compliance Footer */}
        <View style={styles.complianceFooter}>
          <Icon name="verified_user" size={14} color={colors.primaryContainer} />
          <AppText variant="label-sm" color={colors.textMuted} align="center">
            Encrypted HIPAA / Data Protection Compliant • Offline Cached Session
          </AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  logoBadgeContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  mainLogoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clockSubBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandBlueSoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(39, 82, 183, 0.15)',
    marginTop: 6,
  },
  card: {
    width: '100%',
    padding: 18,
    gap: 16,
  },
  cardIntro: {
    gap: 2,
  },
  introSubtitle: {
    marginTop: 2,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  roleTabActivePatient: {
    backgroundColor: colors.primaryContainer,
  },
  roleTabActiveStaff: {
    backgroundColor: colors.secondary,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  guidanceText: {
    flex: 1,
    fontSize: 12,
  },
  formSection: {
    gap: 14,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  loginBtn: {
    marginTop: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  dividerText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
  },
  biometricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  biometricIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.brandBlueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  complianceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
  },
});
