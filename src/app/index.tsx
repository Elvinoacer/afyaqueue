import { useCallback, useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useApp } from '@/store/app-context';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, isInitializing } = useApp();

  // Animation values for institutional 1.8s sequence using React 19 safe useState initializers
  const [crossScale] = useState(() => new Animated.Value(0.4));
  const [crossOpacity] = useState(() => new Animated.Value(0));
  const [glowScale] = useState(() => new Animated.Value(0.6));
  const [glowOpacity] = useState(() => new Animated.Value(0));
  const [ticketSlide] = useState(() => new Animated.Value(120));
  const [ticketOpacity] = useState(() => new Animated.Value(0));

  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

  const proceedToApp = useCallback(() => {
    if (hasAutoNavigated) return;
    setHasAutoNavigated(true);

    if (currentUser) {
      if (currentUser.role === 'staff') {
        router.replace('/(tabs)/desk');
      } else {
        router.replace('/(tabs)/discover');
      }
    } else {
      router.replace('/auth/login');
    }
  }, [hasAutoNavigated, currentUser]);

  useEffect(() => {
    // Sequence animations
    Animated.parallel([
      Animated.timing(crossScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(crossOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(glowScale, {
            toValue: 1.5,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(700),
        Animated.parallel([
          Animated.spring(ticketSlide, {
            toValue: 0,
            damping: 14,
            stiffness: 120,
            useNativeDriver: true,
          }),
          Animated.timing(ticketOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // 1.8s auto-transition timer
    const timer = setTimeout(() => {
      proceedToApp();
    }, 2200);

    return () => clearTimeout(timer);
  }, [
    crossOpacity,
    crossScale,
    glowOpacity,
    glowScale,
    isInitializing,
    proceedToApp,
    ticketOpacity,
    ticketSlide,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Background Ambient Radiance */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Top Institutional Facility Header */}
      <View style={styles.topHeader}>
        <View style={styles.pillBadge}>
          <View style={styles.beaconPulse} />
          <AppText variant="overline" weight={800} color="#38BDF8" uppercase>
            MTRH VITAL BYPASS 2.0
          </AppText>
        </View>
        <AppText variant="body-sm" color="#94A3B8">
          Moi Teaching & Referral Hospital
        </AppText>
      </View>

      {/* Center Medical Cross Emblem */}
      <View style={styles.centerSection}>
        <Animated.View
          style={[
            styles.emblemWrapper,
            {
              opacity: crossOpacity,
              transform: [{ scale: crossScale }],
            },
          ]}>
          {/* Vertical Precision Glass Pill (Surgical Emerald) */}
          <View style={styles.verticalPill} />
          {/* Horizontal Precision Glass Pill (Clinical Cyan) */}
          <View style={styles.horizontalPill} />
          {/* Center Intersection Glow */}
          <View style={styles.intersectionGlow} />
        </Animated.View>

        <AppText variant="headline-xl" weight={800} color="#FFFFFF" style={styles.brandTitle}>
          AfyaQueue
        </AppText>
        <AppText variant="body-md" color="#94A3B8" style={styles.brandSubtitle}>
          Real-Time Institutional Clinical Dispatch
        </AppText>
      </View>

      {/* Bottom Token Router Ticket Sheet */}
      <Animated.View
        style={[
          styles.ticketContainer,
          {
            opacity: ticketOpacity,
            transform: [{ translateY: ticketSlide }],
          },
        ]}>
        <View style={styles.ticketInner}>
          <View style={styles.ticketHeader}>
            <View style={styles.routerStatus}>
              <Icon name="sync" size={16} color="#22C55E" />
              <AppText variant="label-sm" weight={700} color="#22C55E">
                Active Triage Session
              </AppText>
            </View>
            <View style={styles.tokenPill}>
              <AppText variant="overline" weight={800} color="#38BDF8">
                {currentUser?.role === 'staff' ? 'DESK 4B' : 'TOKEN #18'}
              </AppText>
            </View>
          </View>

          <View style={styles.ticketBody}>
            <AppText variant="label-md" weight={700} color="#FFFFFF">
              {currentUser?.name ?? 'Kevin Kibet (PT-2026-0142)'}
            </AppText>
            <AppText variant="body-sm" color="#94A3B8">
              {currentUser?.role === 'staff'
                ? 'Outpatient Queue Desk • Dr. Sarah Wanjiku Stream'
                : 'Dr. Sarah Wanjiku • General Medicine • Room 14'}
            </AppText>
          </View>

          <Button
            label="Enter AfyaQueue Portal"
            variant="primary"
            trailingIcon="arrow_forward"
            onPress={proceedToApp}
            height={50}
            style={styles.continueButton}
          />

          <PressableScale onPress={() => router.push('/auth/login')} style={styles.switchRoleLink}>
            <AppText variant="label-sm" color="#64748B" align="center">
              Switch role or log in with credentials →
            </AppText>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A12',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    shadowColor: '#22C55E',
    shadowOpacity: 0.3,
    shadowRadius: 50,
  },
  topHeader: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 6,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  beaconPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  verticalPill: {
    position: 'absolute',
    width: 28,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#1E7A46',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  horizontalPill: {
    position: 'absolute',
    width: 110,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  intersectionGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  brandTitle: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  ticketContainer: {
    width: '100%',
  },
  ticketInner: {
    backgroundColor: '#0C1220',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    gap: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenPill: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  ticketBody: {
    gap: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  continueButton: {
    marginTop: 6,
  },
  switchRoleLink: {
    paddingVertical: 4,
  },
});
