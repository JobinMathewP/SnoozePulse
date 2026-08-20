import {
  batteryCopy,
  batterySavedCopy,
  chargerReminderCopy,
  missedNightCopy,
  tonightCopy,
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

  it('does not call 21% sufficient for overnight recording', () => {
    expect(batteryCopy.okSubtitle).toBe('Sufficient for overnight recording');
    expect(batteryCopy.cautionTitle).toBe('Charge recommended');
    expect(batteryCopy.cautionSubtitle).toBe('May not last overnight unplugged');
  });

  it('keeps the charger reminder non-blocking', () => {
    expect(chargerReminderCopy.title).toBe("Tonight's tracking");
    expect(chargerReminderCopy.subtitle).toBe(
      "Your phone isn't charging. For the best experience, connect your charger before bed.",
    );
  });
});

describe('home automatic-tracking copy', () => {
  it('keeps Start as an override, not the primary daily message', () => {
    expect(tonightCopy.armedHeadline).toBe("Tonight's tracking is on.");
    expect(tonightCopy.waitingHeadline).toBe("Tonight's tracking is waiting.");
    expect(tonightCopy.monitoringHeadline).toBe("Tonight's tracking is on.");
    expect(tonightCopy.readyHeadline).toBe('Your sleep summary is ready.');
    expect(tonightCopy.overrideCaption).toBe('Start anyway');
    expect(tonightCopy.overrideAccessibilityLabel).toBe('Start a sleep session anyway');
    expect(tonightCopy.openActiveAccessibilityLabel).toBe(
      'Return to the active sleep session',
    );
  });
});
