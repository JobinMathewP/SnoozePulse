import { MIN_SESSION_DURATION_MS } from '@/utils/constants';
import { isSessionTooShort, sessionDurationMs } from '@/utils/sessionLength';

describe('sessionDurationMs', () => {
  it('returns elapsed wall-clock time', () => {
    expect(sessionDurationMs(1000, 4000)).toBe(3000);
  });

  it('clamps negative deltas to zero', () => {
    expect(sessionDurationMs(5000, 1000)).toBe(0);
  });
});

describe('isSessionTooShort', () => {
  it('flags sessions under the 5-minute minimum', () => {
    const start = 0;
    expect(isSessionTooShort(start, MIN_SESSION_DURATION_MS - 1)).toBe(true);
  });

  it('keeps a session exactly at the minimum', () => {
    const start = 0;
    expect(isSessionTooShort(start, MIN_SESSION_DURATION_MS)).toBe(false);
  });

  it('keeps a comfortably long session', () => {
    const start = 0;
    expect(isSessionTooShort(start, MIN_SESSION_DURATION_MS * 2)).toBe(false);
  });
});
