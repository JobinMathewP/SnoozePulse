import {
  batterySavedCopy,
  chargerReminderCopy,
  missedNightCopy,
} from '../copy';

describe('home failed-night copy', () => {
  it('keeps microphone and low-battery skip copy from the PRD', () => {
    expect(missedNightCopy.microphone).toEqual({
      title: "Tonight's tracking couldn't start.",
      body: 'Microphone permission is required.',
    });
    expect(missedNightCopy.battery).toEqual({
      title: "Tonight's tracking couldn't start.",
      body: 'Battery was too low.',
    });
  });

  it('explains a missing schedule and an interrupted engine without scores', () => {
    expect(missedNightCopy.schedule.body).toBe(
      'Set a bedtime and wake time in Settings.',
    );
    expect(missedNightCopy.engine.body).toBe(
      'Tracking was interrupted before it could finish.',
    );
  });

  it('captions an ADR-34 battery save as a real night', () => {
    expect(batterySavedCopy.caption).toBe(
      "SnoozePulse saved last night's tracking before the battery ran out.",
    );
  });

  it('keeps the charger reminder non-blocking', () => {
    expect(chargerReminderCopy.title).toBe("Tonight's tracking");
    expect(chargerReminderCopy.subtitle).toBe(
      "Your phone isn't charging. For the best experience, connect your charger before bed.",
    );
  });
});
