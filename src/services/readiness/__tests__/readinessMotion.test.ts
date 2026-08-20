import { AccelerometerMotionMonitor, type AccelerometerPort } from '../AccelerometerMotionMonitor';
import { READINESS } from '../readinessConstants';
import { classifyAcceleration } from '../readinessMotion';

describe('classifyAcceleration', () => {
  it('treats near-zero vectors as no data, not sitting still', () => {
    expect(classifyAcceleration(0, 0, 0)).toBe('unknown');
    expect(classifyAcceleration(0.01, 0, 0)).toBe('unknown');
  });

  it('treats ~1 g as still and a large swing as moving', () => {
    expect(classifyAcceleration(0, 0, 1)).toBe('still');
    expect(classifyAcceleration(0, 0, 0.95)).toBe('still');
    expect(classifyAcceleration(0.8, 0.8, 0.8)).toBe('moving');
  });
});

type FakeAccel = AccelerometerPort & {
  emit(x: number, y: number, z: number): void;
  granted: boolean;
  available: boolean;
};

function fakeAccelerometer(): FakeAccel {
  const listeners = new Set<(m: { x: number; y: number; z: number; timestamp: number }) => void>();
  return {
    available: true,
    granted: true,
    async isAvailableAsync() {
      return this.available;
    },
    async getPermissionsAsync() {
      return { granted: this.granted };
    },
    setUpdateInterval() {
      return;
    },
    addListener(listener) {
      listeners.add(listener);
      return {
        remove: () => {
          listeners.delete(listener);
        },
      };
    },
    emit(x, y, z) {
      for (const listener of listeners) {
        listener({ x, y, z, timestamp: 0 });
      }
    },
  };
}

describe('AccelerometerMotionMonitor', () => {
  it('stays unknown when permission is not granted (fallback path)', async () => {
    const accel = fakeAccelerometer();
    accel.granted = false;
    const monitor = new AccelerometerMotionMonitor(accel, () => 0);
    const seen: (boolean | null)[] = [];
    const unsub = monitor.subscribe((value) => {
      seen.push(value);
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(monitor.getPhoneSettled()).toBeNull();
    unsub();
  });

  it('reports moving immediately and settled after the still streak', async () => {
    const accel = fakeAccelerometer();
    let now = 0;
    const monitor = new AccelerometerMotionMonitor(accel, () => now);
    const unsub = monitor.subscribe(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    accel.emit(2, 0, 0);
    expect(monitor.getPhoneSettled()).toBe(false);

    now = 0;
    accel.emit(0, 0, 1);
    expect(monitor.getPhoneSettled()).toBe(false);

    now = READINESS.MOTION_STILL_STREAK_MS;
    accel.emit(0, 0, 1);
    expect(monitor.getPhoneSettled()).toBe(true);

    unsub();
  });
});
