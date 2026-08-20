import { batteryCardCopyFor } from '../batteryCard';
import { batteryCopy } from '../copy';

describe('batteryCardCopyFor', () => {
  it('does not call 21% Battery Ready or sufficient for overnight recording', () => {
    const card = batteryCardCopyFor(0.21, false);
    expect(card.kind).toBe('caution');
    expect(card.title).toBe(batteryCopy.cautionTitle);
    expect(card.subtitle).toBe(batteryCopy.cautionSubtitle);
    expect(card.title).not.toBe(batteryCopy.okTitle);
    expect(card.subtitle).not.toBe(batteryCopy.okSubtitle);
  });

  it('calls the pack ready only above 50%', () => {
    expect(batteryCardCopyFor(0.5, false).kind).toBe('caution');
    expect(batteryCardCopyFor(0.51, false)).toEqual({
      kind: 'ready',
      title: batteryCopy.okTitle,
      subtitle: batteryCopy.okSubtitle,
    });
  });

  it('keeps Battery Low at the 20% save-and-stop line', () => {
    expect(batteryCardCopyFor(0.2, false)).toEqual({
      kind: 'low',
      title: batteryCopy.lowTitle,
      subtitle: batteryCopy.lowSubtitle,
    });
  });

  it('asks to stay plugged in when charging through the caution band', () => {
    expect(batteryCardCopyFor(0.3, true)).toEqual({
      kind: 'caution',
      title: batteryCopy.cautionChargingTitle,
      subtitle: batteryCopy.cautionChargingSubtitle,
    });
  });
});
