import type {
  LocalTimeOfDay,
  MicrophonePermissionStatus,
  MissedNight,
  MissedNightReason,
  SleepSession,
} from '@/types';

import { sleepNightIso } from '@/services/nightWindows';
import {
  localTimeOfDayFromDate,
  scheduleWindowFlags,
} from '@/services/readiness/readinessWindows';

export type LastNightPresentation = {
  readonly session: SleepSession | null;
  readonly missedReason: MissedNightReason | null;
  readonly showBatterySavedCaption: boolean;
};

/**
 * What Home's "Last night" card should show. COMPLETED nights keep scores.
 * ERROR rows and persisted misses never become a Summary stand-in.
 */
export function lastNightPresentation(args: {
  readonly sessions: readonly SleepSession[];
  readonly missedNight: MissedNight | null;
  readonly automaticTrackingEnabled: boolean;
  readonly bedtime: LocalTimeOfDay | null;
  readonly wakeTime: LocalTimeOfDay | null;
  readonly microphone: MicrophonePermissionStatus | undefined;
  readonly lastCompletedWasBatterySave: boolean;
  readonly now: Date;
}): LastNightPresentation {
  const {
    sessions,
    missedNight,
    automaticTrackingEnabled,
    bedtime,
    wakeTime,
    microphone,
    lastCompletedWasBatterySave,
    now,
  } = args;
  const currentNight = sleepNightIso(now, bedtime, wakeTime);
  const thisNight = sessions.filter(
    (session) => sleepNightIso(new Date(session.startedAt), bedtime, wakeTime) === currentNight,
  );
  const thisNightCompleted = thisNight.find((session) => session.state === 'COMPLETED') ?? null;
  if (thisNightCompleted !== null) {
    return {
      session: thisNightCompleted,
      missedReason: null,
      showBatterySavedCaption: lastCompletedWasBatterySave,
    };
  }

  if (thisNight.some((session) => session.state === 'ERROR')) {
    return { session: null, missedReason: 'engine', showBatterySavedCaption: false };
  }

  if (missedNight !== null && missedNight.nightIso === currentNight) {
    return { session: null, missedReason: missedNight.reason, showBatterySavedCaption: false };
  }

  const clock = localTimeOfDayFromDate(now);
  const flags = scheduleWindowFlags(bedtime, wakeTime, clock);
  const nearNight = flags.inReadinessWindow || flags.inWakeWindow || flags.wakeWindowEnded;
  const hour = now.getHours();
  const eveningOrMorning = hour >= 20 || hour < 10;

  if (automaticTrackingEnabled && (bedtime === null || wakeTime === null) && eveningOrMorning) {
    return { session: null, missedReason: 'schedule', showBatterySavedCaption: false };
  }

  if (automaticTrackingEnabled && nearNight && microphone === 'denied') {
    return { session: null, missedReason: 'microphone', showBatterySavedCaption: false };
  }

  const olderCompleted = sessions.find((session) => session.state === 'COMPLETED') ?? null;
  return {
    session: olderCompleted,
    missedReason: null,
    showBatterySavedCaption: false,
  };
}
