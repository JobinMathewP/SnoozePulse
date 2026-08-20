import { canTransitionReadiness, READINESS_TRANSITIONS } from '../readinessTransitions';
import type { ReadinessState } from '@/types';

describe('canTransitionReadiness', () => {
  const states = Object.keys(READINESS_TRANSITIONS) as ReadinessState[];

  it('allows every listed successor', () => {
    for (const from of states) {
      for (const to of READINESS_TRANSITIONS[from]) {
        expect(canTransitionReadiness(from, to)).toBe(true);
      }
    }
  });

  it('rejects skipping to MONITORING from SCHEDULED (stationary cannot jump the queue)', () => {
    expect(canTransitionReadiness('SCHEDULED', 'MONITORING')).toBe(false);
    expect(canTransitionReadiness('SCHEDULED', 'SETTLING')).toBe(false);
    expect(canTransitionReadiness('READINESS_WINDOW', 'MONITORING')).toBe(false);
    expect(canTransitionReadiness('READINESS_WINDOW', 'COMPLETED')).toBe(false);
    expect(canTransitionReadiness('SETTLING', 'COMPLETED')).toBe(false);
    expect(canTransitionReadiness('MONITORING', 'SCHEDULED')).toBe(false);
  });

  it('allows ERROR from every non-ERROR state and recovery only to SCHEDULED', () => {
    for (const from of states) {
      if (from !== 'ERROR') {
        expect(canTransitionReadiness(from, 'ERROR')).toBe(true);
      }
    }
    expect(canTransitionReadiness('ERROR', 'MONITORING')).toBe(false);
    expect(canTransitionReadiness('ERROR', 'SCHEDULED')).toBe(true);
  });
});
