import '../../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { StoreApi } from 'zustand/vanilla';

import { ErrorPanel, Screen } from '@/components/ui';
import { createContainer, StoreProvider, useAppStore } from '@/hooks';
import {
  bindAudioSubscriptions,
  bindBatteryGuard,
  bindReadinessScheduler,
  createAppStore,
  type AppStore,
} from '@/store';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '@/theme';
import type { AppError } from '@/types';

// Held in global scope, not in the component: by the time a hook runs the splash screen may
// already have been dismissed. Released in the effect below once Inter is resident, so no
// frame is ever painted in the system face and then reflowed (ADR-07).
SplashScreen.preventAutoHideAsync();

/** Open Active Session when auto-start (or any path) reaches RECORDING off that route. */
function AutoSessionGate() {
  const router = useRouter();
  const pathname = usePathname();
  const sessionState = useAppStore((state) => state.sessionState);

  useEffect(() => {
    if (sessionState !== 'RECORDING') {
      return;
    }
    if (pathname === '/session/active' || pathname.startsWith('/onboarding')) {
      return;
    }
    router.replace('/session/active');
  }, [sessionState, pathname, router]);

  return null;
}

function toBootError(cause: unknown): AppError {
  return {
    code: 'PERSISTENCE',
    message: 'SnoozePulse could not start. Database or storage failed to open.',
    cause,
  };
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [store, setStore] = useState<StoreApi<AppStore> | null>(null);
  const [bootError, setBootError] = useState<AppError | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const assemble = useCallback(async () => {
    try {
      setBootError(null);
      const container = await createContainer();
      const appStore = createAppStore(container, { profile: container.bootProfile });
      const unsubAudio = bindAudioSubscriptions(appStore, container.audioService);
      const unsubBattery = bindBatteryGuard(appStore, container.batteryMonitor);
      const unsubReadiness = bindReadinessScheduler(
        appStore,
        container.readinessService,
        container.readinessSignals,
      );
      setStore(appStore);
      return () => {
        unsubAudio();
        unsubBattery();
        unsubReadiness();
      };
    } catch (cause: unknown) {
      console.error('[composition] failed to assemble container', cause);
      setStore(null);
      setBootError(toBootError(cause));
      return undefined;
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const result = await assemble();
      if (cancelled) {
        result?.();
        return;
      }
      unsubscribe = result;
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [assemble, bootAttempt]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (store || bootError) {
        SplashScreen.hide();
      }
    }
  }, [fontsLoaded, fontError, store, bootError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (bootError && !store) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Screen variant="fixed" background="app" testID="boot-error-screen">
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <ErrorPanel
              error={bootError}
              primaryLabel="Try again"
              primaryAccessibilityLabel="Retry opening SnoozePulse"
              onPrimary={() => {
                setBootAttempt((n) => n + 1);
              }}
              testID="boot-error"
            />
            <Text
              style={{
                color: colors.fgCaption,
                fontFamily: fontFamily.regular,
                fontSize: fontSize.caption,
                lineHeight: lineHeight.caption,
                textAlign: 'center',
              }}
            >
              If this keeps happening, free some device storage and reopen the app.
            </Text>
          </View>
        </Screen>
      </GestureHandlerRootView>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider store={store}>
        <AutoSessionGate />
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
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen
            name="session/active"
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen name="session/[id]/summary" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

