import { Tabs } from 'expo-router';

import { BottomNavBar } from '@/components/ui/bottom-nav-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={() => <BottomNavBar />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="queue" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="desk" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
