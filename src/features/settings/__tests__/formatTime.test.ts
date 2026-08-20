import {
  DEFAULT_BEDTIME,
  DEFAULT_WAKE_TIME,
  formatLocalTimeDisplay,
  toTwelveHour,
  toTwentyFour,
} from '../formatTime';

describe('formatLocalTimeDisplay', () => {
  it('renders the PRD bedtime and wake examples', () => {
    expect(formatLocalTimeDisplay(DEFAULT_BEDTIME)).toBe('11:30 PM');
    expect(formatLocalTimeDisplay(DEFAULT_WAKE_TIME)).toBe('7:00 AM');
  });

  it('renders midnight and noon without converting through UTC', () => {
    expect(formatLocalTimeDisplay({ hours: 0, minutes: 0 })).toBe('12:00 AM');
    expect(formatLocalTimeDisplay({ hours: 12, minutes: 5 })).toBe('12:05 PM');
  });
});

describe('twelve-hour conversion', () => {
  it('round-trips 11:30 PM and 7:00 AM', () => {
    expect(toTwentyFour(toTwelveHour(DEFAULT_BEDTIME))).toEqual(DEFAULT_BEDTIME);
    expect(toTwentyFour(toTwelveHour(DEFAULT_WAKE_TIME))).toEqual(DEFAULT_WAKE_TIME);
  });
});
