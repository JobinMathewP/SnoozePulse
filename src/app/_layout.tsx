import '../../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { ensureDatabase } from '@/services/database';
import { colors } from '@/theme';

// Held in global scope, not in the component: by the time a hook runs the splash screen may
// already have been dismissed. Released in the effect below once Inter is resident, so no
// frame is ever painted in the system face and then reflowed (ADR-07).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Release on failure too, otherwise a missing font traps the user on the splash screen.
    if (fontsLoaded || fontError) {
      SplashScreen.hide();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Task 4.1 boot probe — logs user_version + table list. Absorbed into the composition
    // root in Task 4.4 (ADR-18).
    void ensureDatabase().catch((error: unknown) => {
      console.error('[database] failed to open', error);
    });
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.fg,
        headerStyle: { backgroundColor: colors.bgApp },
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', color: colors.fg },
        contentStyle: { backgroundColor: colors.bgApp },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="session/active"
        options={{
          headerShown: false,
          // iOS interactive pop; Android relies on no header back affordance.
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="session/[id]/summary"
        options={{
          title: 'Sleep Summary',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Stack>
  );
}
