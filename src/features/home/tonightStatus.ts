import type { LocalTimeOfDay, SessionState } from '@/types';

import {
  localTimeOfDayFromDate,
  scheduleWindowFlags,
} from '@/services/readiness/readinessWindows';

import { homeCopy, missedNightCopy, tonightCopy } from './copy';
import type { LastNightPresentation } from './lastNightPresentation';

export type TonightKind = 'manual' | 'armed' | 'waiting' | 'monitoring' | 'failed' | 'ready';

export type TonightStatus = {
  readonly kind: TonightKind;
  readonly headline: string;
  readonly subhead: string;
  readonly heroCaption: string | null;
  readonly heroAccessibilityLabel: string;
  readonly openActiveOnPress: boolean;
};

function formatClock(time: LocalTimeOfDay): string {
  const period = time.hours >= 12 ? 'PM' : 'AM';
  const hour12 = time.hours % 12 === 0 ? 12 : time.hours % 12;
  const minutes = String(time.minutes).padStart(2, '0');
  return `${hour12}:${minutes} ${period}`;
}

function isLiveSession(sessionState: SessionState): boolean {
  return (
    sessionState === 'STARTING' ||
    sessionState === 'RECORDING' ||
    sessionState === 'PAUSED' ||
    sessionState === 'STOPPING'
  );
}

/**
 * Primary Home message when automatic tracking is on. Auto off keeps product-v1 Start copy.
 */
export function tonightStatus(args: {
  readonly automaticTrackingEnabled: boolean;
  readonly sessionState: SessionState;
  readonly bedtime: LocalTimeOfDay | null;
  readonly wakeTime: LocalTimeOfDay | null;
  readonly lastNight: LastNightPresentation;
  readonly now: Date;
}): TonightStatus {
  const {
    automaticTrackingEnabled,
    sessionState,
    bedtime,
    wakeTime,
    lastNight,
    now,
  } = args;
  const live = isLiveSession(sessionState);
  const openActiveOnPress = sessionState === 'RECORDING' || sessionState === 'PAUSED';

  if (!automaticTrackingEnabled) {
    return {
      kind: 'manual',
      headline: homeCopy.headline,
      subhead: homeCopy.subhead,
      heroCaption: null,
      heroAccessibilityLabel: openActiveOnPress
        ? tonightCopy.openActiveAccessibilityLabel
        : homeCopy.heroAccessibilityLabel,
      openActiveOnPress,
    };
  }

  const override = {
    heroCaption: live ? tonightCopy.inProgressCaption : tonightCopy.overrideCaption,
    heroAccessibilityLabel: openActiveOnPress
      ? tonightCopy.openActiveAccessibilityLabel
      : tonightCopy.overrideAccessibilityLabel,
    openActiveOnPress,
  };

  if (live) {
    return {
      kind: 'monitoring',
      headline: tonightCopy.monitoringHeadline,
      subhead: tonightCopy.monitoringSubhead,
      ...override,
    };
  }

  if (bedtime === null || wakeTime === null) {
    return {
      kind: 'failed',
      headline: tonightCopy.unarmedHeadline,
      subhead: tonightCopy.unarmedSubhead,
      ...override,
    };
  }

  if (sessionState === 'ERROR' || lastNight.missedReason !== null) {
    const reason = lastNight.missedReason ?? 'engine';
    return {
      kind: 'failed',
      headline: missedNightCopy[reason].title,
      subhead: missedNightCopy[reason].body,
      ...override,
    };
  }

  const flags = scheduleWindowFlags(bedtime, wakeTime, localTimeOfDayFromDate(now));

  if (flags.inReadinessWindow) {
    return {
      kind: 'waiting',
      headline: tonightCopy.waitingHeadline,
      subhead: tonightCopy.waitingSubhead,
      ...override,
    };
  }

  if (
    lastNight.belongsToCurrentNight &&
    lastNight.session !== null &&
    (flags.wakeWindowEnded || flags.inWakeWindow)
  ) {
    return {
      kind: 'ready',
      headline: tonightCopy.readyHeadline,
      subhead: tonightCopy.readySubhead,
      ...override,
    };
  }

  return {
    kind: 'armed',
    headline: tonightCopy.armedHeadline,
    subhead: tonightCopy.armedSubhead(formatClock(bedtime)),
    ...override,
  };
}
