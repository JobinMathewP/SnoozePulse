import { TOUCH_TARGET, hitSlopForVisualSize } from '@/components/ui/touchTarget';

describe('touchTarget', () => {
  it('exports the 44 dp accessibility floor', () => {
    expect(TOUCH_TARGET).toBe(44);
  });

  it('expands hitSlop so visual size meets the floor', () => {
    expect(hitSlopForVisualSize(24)).toBe(10);
    expect(hitSlopForVisualSize(44)).toBe(0);
    expect(hitSlopForVisualSize(48)).toBe(0);
  });
});
