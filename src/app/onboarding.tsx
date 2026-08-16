import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { OnboardingScreen } from '@/features/onboarding';
import { useProfile } from '@/hooks';

/**
 * First-run onboarding route (ADR-30). Persists the onboarding flag (and the optional
 * greeting name) via the profile store action, then replaces to the tabs so Back cannot
 * return to onboarding. The `(tabs)` index redirects here until `onboarded` is true.
 */
export default function OnboardingRoute() {
  const router = useRouter();
  const { completeOnboarding } = useProfile();
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback(
    (name: string | null) => {
      if (busy) {
        return;
      }
      setBusy(true);
      void (async () => {
        // Persist regardless of outcome: even if the write fails we let the user in rather
        // than trapping them on onboarding. The gate re-reads on next boot.
        await completeOnboarding(name);
        router.replace('/(tabs)');
      })();
    },
    [busy, completeOnboarding, router],
  );

  return <OnboardingScreen onComplete={onComplete} />;
}
