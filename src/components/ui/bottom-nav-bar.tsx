import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';

import { colors } from '@/theme/colors';
import { useApp } from '@/store/app-context';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

export type TabKey = 'queue' | 'book' | 'records' | 'desk' | 'profile';

interface TabItem {
  key: TabKey;
  label: string;
  icon: IconName;
  route: string;
}

const TABS: TabItem[] = [
  { key: 'queue', label: 'Live Queue', icon: 'confirmation_number', route: '/(tabs)/queue' },
  { key: 'book', label: 'Book', icon: 'calendar_month', route: '/(tabs)/discover' },
  { key: 'records', label: 'Records', icon: 'medical_services', route: '/(tabs)/records' },
  { key: 'desk', label: 'Desk', icon: 'clinical_notes', route: '/(tabs)/desk' },
  { key: 'profile', label: 'Profile', icon: 'account_circle', route: '/(tabs)/profile' },
];

export function BottomNavBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { activeQueueNumber } = useApp();

  const handleTabPress = (route: string) => {
    router.navigate(route as any);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive =
          pathname === tab.route ||
          (tab.key === 'book' &&
            (pathname === '/(tabs)' ||
              pathname === '/(tabs)/discover' ||
              pathname === '/discover' ||
              pathname === '/' ||
              pathname.includes('discover'))) ||
          (tab.key === 'queue' && pathname.includes('queue')) ||
          (tab.key === 'records' && pathname.includes('records')) ||
          (tab.key === 'desk' && pathname.includes('desk')) ||
          (tab.key === 'profile' && pathname.includes('profile'));

        const color = isActive ? colors.primaryContainer : colors.textMuted;

        return (
          <PressableScale
            key={tab.key}
            onPress={() => handleTabPress(tab.route)}
            style={styles.tabItem}
            activeScale={0.92}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}>
            <View style={styles.iconContainer}>
              <Icon name={tab.icon} filled={isActive} size={22} color={color} />
              {tab.key === 'queue' && activeQueueNumber ? (
                <View style={styles.badge}>
                  <AppText variant="overline" weight={800} color={colors.white} style={styles.badgeText}>
                    {activeQueueNumber}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText
              variant="label-sm"
              weight={isActive ? 700 : 500}
              color={color}
              numberOfLines={1}>
              {tab.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 50,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
});
