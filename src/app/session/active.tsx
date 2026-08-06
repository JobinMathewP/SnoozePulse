import { useRouter } from 'expo-router';

import { ActiveSessionScreen } from '@/features/session';

/**
 * Active Session route — OLED monitoring surface (Task 3.3).
 * Ending the mock session opens the sample Summary until live sessions land.
 */
export default function ActiveSessionRoute() {
  const router = useRouter();

  return (
    <ActiveSessionScreen
      onEndSession={() => {
        router.replace({ pathname: '/session/[id]/summary', params: { id: 'sample' } });
      }}
    />
  );
}
