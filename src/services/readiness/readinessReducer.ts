import type { ReadinessSnapshot, ReadinessState, ReadinessStep } from '@/types';

import { READINESS } from './readinessConstants';
import { canTransitionReadiness } from './readinessTransitions';

function stay(state: ReadinessState): ReadinessStep {
  return { state, intent: 'none' };
}

function go(from: ReadinessState, to: ReadinessState, intent: ReadinessStep['intent']): ReadinessStep {
  if (from === to) {
    return stay(from);
  }
  if (!canTransitionReadiness(from, to)) {
    return stay(from);
  }
  return { state: to, intent };
}

function allowsOrUnknown(flag: boolean | null): boolean {
  return flag !== false;
}

function startReady(snapshot: ReadinessSnapshot): boolean {
  return (
    snapshot.automaticTrackingEnabled &&
    snapshot.scheduleConfigured &&
    snapshot.inReadinessWindow &&
    allowsOrUnknown(snapshot.phoneSettled) &&
    !snapshot.interacting &&
    allowsOrUnknown(snapshot.environmentAcceptable) &&
    snapshot.settleElapsedMs >= READINESS.SETTLE_DURATION_MS
  );
}

function becomingSettled(snapshot: ReadinessSnapshot): boolean {
  return (
    snapshot.automaticTrackingEnabled &&
    snapshot.scheduleConfigured &&
    snapshot.inReadinessWindow &&
    allowsOrUnknown(snapshot.phoneSettled) &&
    !snapshot.interacting
  );
}

/**
 * Pure Sleep Readiness step. No clock, sensors, or audio — only the injected snapshot.
 * Stationary phone alone never emits `start_session`.
 */
export function reduceReadiness(state: ReadinessState, snapshot: ReadinessSnapshot): ReadinessStep {
  if (!snapshot.automaticTrackingEnabled && (state === 'SCHEDULED' || state === 'READINESS_WINDOW' || state === 'SETTLING')) {
    return state === 'SCHEDULED' ? stay('SCHEDULED') : go(state, 'SCHEDULED', 'none');
  }

  switch (state) {
    case 'SCHEDULED':
      if (
        snapshot.automaticTrackingEnabled &&
        snapshot.scheduleConfigured &&
        snapshot.inReadinessWindow
      ) {
        return go(state, 'READINESS_WINDOW', 'none');
      }
      return stay(state);

    case 'READINESS_WINDOW':
      if (!snapshot.inReadinessWindow) {
        return go(state, 'SCHEDULED', 'none');
      }
      if (becomingSettled(snapshot)) {
        return go(state, 'SETTLING', 'none');
      }
      return stay(state);

    case 'SETTLING':
      if (!snapshot.inReadinessWindow) {
        return go(state, 'SCHEDULED', 'none');
      }
      if (!becomingSettled(snapshot)) {
        return go(state, 'READINESS_WINDOW', 'none');
      }
      if (startReady(snapshot)) {
        return go(state, 'MONITORING', 'start_session');
      }
      return stay(state);

    case 'MONITORING':
      if (snapshot.inWakeWindow || snapshot.wakeWindowEnded) {
        return go(state, 'WAKE_WINDOW', 'none');
      }
      return stay(state);

    case 'WAKE_WINDOW':
      if (snapshot.wakeWindowEnded) {
        return go(state, 'COMPLETED', 'stop_session');
      }
      return stay(state);

    case 'COMPLETED':
    case 'ERROR':
      return stay(state);
  }
}

export function reduceFail(state: ReadinessState): ReadinessStep {
  return go(state, 'ERROR', 'none');
}

export function reduceReset(state: ReadinessState): ReadinessStep {
  return go(state, 'SCHEDULED', 'none');
}
