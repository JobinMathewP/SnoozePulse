import { Redirect } from 'expo-router';

import { HomeScreen } from '@/features/home';
import { useProfile } from '@/hooks';

/**
 * Home tab route — composes the feature screen (Task 3.1).
 *
 * Onboarding gate (ADR-30): until the user has completed first-run onboarding we redirect
 * here to `/onboarding`. `onboarded` is seeded synchronously from a boot read, so this does
 * not flash the tabs before redirecting.
 */
export default function HomeRoute() {
  const { onboarded } = useProfile();

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <HomeScreen />;
}
