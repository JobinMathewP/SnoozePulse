import type { ReadinessState, ReadinessTransitionMap } from '@/types';

/**
 * Allowed Sleep Readiness transitions. Staying in the same state is not a
 * transition. `ERROR` is reachable from every live state; recovery is `reset`
 * back to `SCHEDULED`.
 */
export const READINESS_TRANSITIONS: ReadinessTransitionMap = {
  SCHEDULED: ['READINESS_WINDOW', 'ERROR'],
  READINESS_WINDOW: ['SETTLING', 'SCHEDULED', 'ERROR'],
  SETTLING: ['MONITORING', 'READINESS_WINDOW', 'SCHEDULED', 'ERROR'],
  MONITORING: ['WAKE_WINDOW', 'ERROR'],
  WAKE_WINDOW: ['COMPLETED', 'ERROR'],
  COMPLETED: ['SCHEDULED', 'ERROR'],
  ERROR: ['SCHEDULED'],
};

export function canTransitionReadiness(from: ReadinessState, to: ReadinessState): boolean {
  return READINESS_TRANSITIONS[from].includes(to);
}
