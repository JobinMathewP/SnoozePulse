import { greeting } from '../copy';

describe('greeting', () => {
  it('uses the part of day', () => {
    expect(greeting(null, 8)).toBe('Good morning');
    expect(greeting(null, 14)).toBe('Good afternoon');
    expect(greeting(null, 21)).toBe('Good evening');
  });

  it('personalizes with a display name', () => {
    expect(greeting('Sam', 21)).toBe('Good evening, Sam');
  });

  it('falls back to neutral copy for a blank name (no dangling comma)', () => {
    expect(greeting('   ', 8)).toBe('Good morning');
    expect(greeting('', 8)).toBe('Good morning');
  });
});
