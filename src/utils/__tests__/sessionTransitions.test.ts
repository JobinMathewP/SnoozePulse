import { canTransition, SESSION_TRANSITIONS } from '@/utils';
import type { SessionState } from '@/types';

describe('canTransition', () => {
  const states = Object.keys(SESSION_TRANSITIONS) as SessionState[];

  it('allows every listed successor', () => {
    for (const from of states) {
      for (const to of SESSION_TRANSITIONS[from]) {
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });

  it('rejects illegal transitions', () => {
    expect(canTransition('IDLE', 'RECORDING')).toBe(false);
    expect(canTransition('IDLE', 'IDLE')).toBe(false);
    expect(canTransition('RECORDING', 'IDLE')).toBe(false);
    expect(canTransition('RECORDING', 'STARTING')).toBe(false);
    expect(canTransition('COMPLETED', 'RECORDING')).toBe(false);
    expect(canTransition('ERROR', 'RECORDING')).toBe(false);
    expect(canTransition('STOPPING', 'IDLE')).toBe(false);
  });

  it('allows ERROR recovery to IDLE or STARTING', () => {
    expect(canTransition('ERROR', 'IDLE')).toBe(true);
    expect(canTransition('ERROR', 'STARTING')).toBe(true);
  });
});
