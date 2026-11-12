import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/store/app-context';
import { appFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8FAFC' },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="auth/login" options={{ animation: 'fade' }} />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="doctor/[id]" />
          <Stack.Screen name="appointments/index" />
          <Stack.Screen name="appointments/reschedule" options={{ presentation: 'modal' }} />
          <Stack.Screen name="feedback/rating" options={{ presentation: 'modal' }} />
          <Stack.Screen name="staff/add-doctor" options={{ presentation: 'modal' }} />
          <Stack.Screen name="announcements/broadcast" options={{ presentation: 'modal' }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
