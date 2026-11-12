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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { registerUser } = useApp();

  const [role, setRole] = useState<UserRole>('patient');
  const [name, setName] = useState('Kevin Kibet');
  const [patientRegNo, setPatientRegNo] = useState('PT-2026-0142');
  const [phone, setPhone] = useState('0712 345 678');
  const [email, setEmail] = useState('kevin.kibet@gmail.com');
  const [password, setPassword] = useState('KibetStrong2026@');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the terms and privacy policy.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await registerUser({
        name,
        email,
        phone,
        role,
        patientRegNo: role === 'patient' ? patientRegNo : undefined,
      });

      if (role === 'staff') {
        router.replace('/(tabs)/desk');
      } else {
        router.replace('/(tabs)/discover');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}>
      <ScreenHeader
        title="Create Account"
        showBack
        showHospitalBadge={false}
        rightElement={
          <View style={styles.headerMtrhBadge}>
            <Icon name="local_hospital" filled size={14} color={colors.primaryContainer} />
            <AppText variant="overline" weight={800} color={colors.primaryContainer}>
              MTRH ELDORET
            </AppText>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introHeader}>
          <AppText variant="headline-xl" weight={800} color={colors.brandNavy}>
            Join AfyaQueue
          </AppText>
          <AppText variant="body-md" color={colors.textMuted} style={styles.introSubtitle}>
            Register to skip clinic queues or manage outpatient intake at Moi Teaching & Referral Hospital.
          </AppText>
        </View>

        {/* Role Toggle Selector */}
        <View style={styles.roleSelectionSection}>
          <View style={styles.roleLabelRow}>
            <AppText variant="label-sm" weight={700} color={colors.brandNavy} uppercase>
              Select Role
            </AppText>
            <AppText variant="body-sm" color={colors.textMuted}>
              Step 1 of 2
            </AppText>
          </View>

          <View style={styles.rolesGrid}>
            {/* Patient Option */}
            <PressableScale
              onPress={() => setRole('patient')}
              style={[
                styles.roleOptionCard,
                role === 'patient' ? styles.roleOptionSelectedPatient : null,
              ]}>
              {role === 'patient' ? (
                <View style={styles.checkBadgeGreen}>
                  <Icon name="check" size={14} color={colors.white} />
                </View>
              ) : null}
              <View
                style={[
                  styles.roleIconWrapper,
                  role === 'patient' ? styles.roleIconWrapperActiveGreen : null,
                ]}>
                <Icon
                  name="person"
                  size={24}
                  color={role === 'patient' ? colors.primaryContainer : colors.textMuted}
                />
              </View>
              <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                Patient
              </AppText>
              <AppText variant="body-sm" color={colors.textMuted}>
                Book doctors & track live queue
              </AppText>
            </PressableScale>

            {/* Staff Option */}
            <PressableScale
              onPress={() => setRole('staff')}
              style={[
                styles.roleOptionCard,
                role === 'staff' ? styles.roleOptionSelectedStaff : null,
              ]}>
              {role === 'staff' ? (
                <View style={styles.checkBadgeBlue}>
                  <Icon name="check" size={14} color={colors.white} />
                </View>
              ) : null}
              <View
                style={[
                  styles.roleIconWrapper,
                  role === 'staff' ? styles.roleIconWrapperActiveBlue : null,
                ]}>
                <Icon
                  name="medical_services"
                  size={24}
                  color={role === 'staff' ? colors.secondary : colors.textMuted}
                />
              </View>
              <AppText variant="headline-md" weight={700} color={colors.brandNavy}>
                Clinic Staff
              </AppText>
              <AppText variant="body-sm" color={colors.textMuted}>
                Manage queue desk & triage
              </AppText>
            </PressableScale>
          </View>
        </View>

        {/* Dynamic Role Notice Card */}
        <View style={styles.noticeCard}>
          <Icon name="info" filled size={20} color={colors.primaryContainer} />
          <AppText variant="body-sm" color={colors.brandNavy} style={styles.noticeText}>
            Registering as a{' '}
            <AppText weight={700} color={colors.primaryContainer}>
              {role === 'patient' ? 'Patient' : 'Clinic Staff'}
            </AppText>{' '}
            {role === 'patient'
              ? 'automatically enables real-time queue position tracking, live wait estimates, and chime alerts.'
              : 'grants authorized access to summon next patient, update clinic availability, and dispatch triage announcements.'}
          </AppText>
        </View>

        {/* Form Inputs */}
        <Card style={styles.formCard}>
          <Input
            label="Full Name"
            required
            icon="person"
            placeholder="e.g. Kevin Kibet"
            value={name}
            onChangeText={setName}
          />

          <Input
            label={role === 'patient' ? 'Patient Reg. Number' : 'Staff Employee ID'}
            helperText={
              role === 'patient'
                ? 'Found on your physical MTRH clinic outpatient card'
                : 'Hospital payroll or nursing license number'
            }
            icon="badge"
            placeholder={role === 'patient' ? 'e.g. PT-2026-0142' : 'e.g. STF-0092'}
            value={patientRegNo}
            onChangeText={setPatientRegNo}
            autoCapitalize="characters"
          />

          <Input
            label="Phone Number"
            required
            prefix="+254"
            icon="phone"
            placeholder="0712 345 678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Input
            label="Email Address"
            required
            icon="mail"
            placeholder="kevin.kibet@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Password"
            required
            icon="lock"
            placeholder="Enter strong password"
            isPassword
            value={password}
            onChangeText={setPassword}
          />

          {/* Password Security Meter */}
          <View style={styles.securityMeterContainer}>
            <View style={styles.securityHeaderRow}>
              <View style={styles.securityLabelRow}>
                <Icon name="check_circle" filled size={14} color={colors.primaryContainer} />
                <AppText variant="body-sm" weight={700} color={colors.primaryContainer}>
                  Strong security
                </AppText>
              </View>
              <AppText variant="overline" color={colors.textMuted}>
                8+ CHARACTERS
              </AppText>
            </View>
            <View style={styles.meterBarsRow}>
              <View style={styles.meterBar} />
              <View style={styles.meterBar} />
              <View style={styles.meterBar} />
              <View style={styles.meterBar} />
            </View>
          </View>

          {/* Terms & Privacy Checkbox */}
          <PressableScale
            onPress={() => setAgreeTerms(!agreeTerms)}
            style={styles.termsRow}>
            <View
              style={[
                styles.checkbox,
                agreeTerms ? styles.checkboxChecked : null,
              ]}>
              {agreeTerms ? <Icon name="check" size={12} color={colors.white} /> : null}
            </View>
            <AppText variant="body-sm" color={colors.textMuted} style={styles.termsText}>
              I agree to the{' '}
              <AppText weight={600} color={colors.primaryContainer}>
                MTRH Digital Outpatient Terms
              </AppText>{' '}
              &{' '}
              <AppText weight={600} color={colors.primaryContainer}>
                Patient Data Privacy Policy
              </AppText>{' '}
              under Kenya Data Protection Act.
            </AppText>
          </PressableScale>

          {error ? (
            <AppText variant="body-sm" color={colors.statusDanger}>
              {error}
            </AppText>
          ) : null}

          {/* Primary Action Button */}
          <Button
            label={isLoading ? 'Creating Account...' : 'Create Account & Get Started'}
            variant="primary"
            trailingIcon="arrow_forward"
            onPress={handleRegister}
            loading={isLoading}
            height={50}
            style={styles.registerBtn}
          />
        </Card>

        {/* Footer Login Link */}
        <View style={styles.footerLinkRow}>
          <AppText variant="body-md" color={colors.textMuted}>
            Already registered?{' '}
          </AppText>
          <PressableScale onPress={() => router.push('/auth/login')}>
            <AppText variant="label-md" weight={700} color={colors.secondary}>
              Log in to your account
            </AppText>
          </PressableScale>
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
    gap: 16,
  },
  headerMtrhBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandGreenSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  introHeader: {
    gap: 4,
  },
  introSubtitle: {
    marginTop: 2,
  },
  roleSelectionSection: {
    gap: 8,
  },
  roleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rolesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOptionCard: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: 14,
    gap: 6,
    position: 'relative',
  },
  roleOptionSelectedPatient: {
    borderColor: colors.primaryContainer,
    borderWidth: 2,
  },
  roleOptionSelectedStaff: {
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  checkBadgeGreen: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeBlue: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  roleIconWrapperActiveGreen: {
    backgroundColor: colors.brandGreenSoft,
  },
  roleIconWrapperActiveBlue: {
    backgroundColor: colors.brandBlueSoft,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.brandGreenSoft,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: 12,
  },
  noticeText: {
    flex: 1,
    lineHeight: 18,
  },
  formCard: {
    padding: 16,
    gap: 14,
  },
  securityMeterContainer: {
    gap: 6,
    marginTop: 2,
  },
  securityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meterBarsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
  },
  meterBar: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.primaryContainer,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 4,
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
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  termsText: {
    flex: 1,
    lineHeight: 18,
  },
  registerBtn: {
    marginTop: 8,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});
