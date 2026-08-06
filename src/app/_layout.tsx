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
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { StoreApi } from 'zustand/vanilla';

import { createContainer, StoreProvider } from '@/hooks';
import {
  bindAudioSubscriptions,
  createAppStore,
  type AppStore,
} from '@/store';
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
  const [store, setStore] = useState<StoreApi<AppStore> | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const container = await createContainer();
        if (cancelled) {
          return;
        }
        const appStore = createAppStore(container);
        unsubscribe = bindAudioSubscriptions(appStore, container.audioService);
        setStore(appStore);
      } catch (error: unknown) {
        console.error('[composition] failed to assemble container', error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    // Hold splash until fonts and the composition root are both ready.
    if ((fontsLoaded || fontError) && store) {
      SplashScreen.hide();
    }
  }, [fontsLoaded, fontError, store]);

  if ((!fontsLoaded && !fontError) || !store) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider store={store}>
        <Stack
          screenOptions={{
            headerTintColor: colors.fg,
            headerStyle: { backgroundColor: colors.bgApp },
            headerTitleStyle: {
              fontFamily: 'Inter_600SemiBold',
              color: colors.fg,
            },
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
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
