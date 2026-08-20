import { FakeBatteryMonitor } from '@/services/fakes/FakeBatteryMonitor';
import { FakeReadinessSignals } from '@/services/fakes/FakeReadinessSignals';

import { AppStateInteractionMonitor, isInteracting } from '../AppStateInteractionMonitor';
import type { IEnvironmentMonitor, IInteractionMonitor, IMotionMonitor } from '../IReadinessSignals';
import { ReadinessSignals } from '../ReadinessSignals';
import { StubMotionMonitor } from '../StubMotionMonitor';
import { toEvaluateFlags } from '../toEvaluateFlags';
import { UnknownEnvironmentMonitor } from '../UnknownEnvironmentMonitor';

class ManualInteraction implements IInteractionMonitor {
  interacting = false;
  private readonly listeners = new Set<(value: boolean) => void>();

  getInteracting(): boolean {
    return this.interacting;
  }

  set(interacting: boolean): void {
    this.interacting = interacting;
    for (const listener of this.listeners) {
      listener(interacting);
    }
  }

  subscribe(listener: (interacting: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.interacting);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

class ManualMotion implements IMotionMonitor {
  settled: boolean | null = null;
  private readonly listeners = new Set<(value: boolean | null) => void>();

  getPhoneSettled(): boolean | null {
    return this.settled;
  }

  set(settled: boolean | null): void {
    this.settled = settled;
    for (const listener of this.listeners) {
      listener(settled);
    }
  }

  subscribe(listener: (phoneSettled: boolean | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.settled);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

class ManualEnvironment implements IEnvironmentMonitor {
  acceptable: boolean | null = null;

  getAcceptable(): boolean | null {
    return this.acceptable;
  }

  subscribe(listener: (acceptable: boolean | null) => void): () => void {
    listener(this.acceptable);
    return () => undefined;
  }
}

describe('toEvaluateFlags', () => {
  it('passes unknown motion and environment through instead of treating them as not ready', () => {
    expect(
      toEvaluateFlags({
        charging: false,
        batteryLevel: 0.8,
        interacting: false,
        phoneSettled: null,
        environmentAcceptable: null,
      }),
    ).toEqual({
      phoneSettled: null,
      interacting: false,
      environmentAcceptable: null,
    });
  });

  it('passes through known settled + quiet when not interacting', () => {
    expect(
      toEvaluateFlags({
        charging: true,
        batteryLevel: 0.9,
        interacting: false,
        phoneSettled: true,
        environmentAcceptable: true,
      }),
    ).toEqual({
      phoneSettled: true,
      interacting: false,
      environmentAcceptable: true,
    });
  });
});

describe('AppStateInteractionMonitor', () => {
  it('treats background as idle and active/inactive as interacting', () => {
    expect(isInteracting('background')).toBe(false);
    expect(isInteracting('active')).toBe(true);
    expect(isInteracting('inactive')).toBe(true);

    let current: string = 'active';
    const listeners = new Set<(state: string) => void>();
    const monitor = new AppStateInteractionMonitor({
      get currentState() {
        return current;
      },
      addEventListener(_type, listener) {
        listeners.add(listener);
        return {
          remove: () => {
            listeners.delete(listener);
          },
        };
      },
    });

    expect(monitor.getInteracting()).toBe(true);
    current = 'background';
    for (const listener of listeners) {
      listener('background');
    }
    expect(monitor.getInteracting()).toBe(false);
  });
});

describe('stub monitors', () => {
  it('never invents a settled phone or a quiet room', () => {
    expect(new StubMotionMonitor().getPhoneSettled()).toBeNull();
    expect(new UnknownEnvironmentMonitor().getAcceptable()).toBeNull();
  });
});

describe('ReadinessSignals', () => {
  it('composes charging from the battery port and leaves motion unknown', async () => {
    const battery = new FakeBatteryMonitor();
    battery.setSnapshot({ level: 0.42, charging: true });
    const interaction = new ManualInteraction();
    interaction.set(true);
    const signals = new ReadinessSignals(
      battery,
      interaction,
      new ManualMotion(),
      new ManualEnvironment(),
    );

    const snapshot = await signals.getSnapshot();
    expect(snapshot.charging).toBe(true);
    expect(snapshot.batteryLevel).toBeCloseTo(0.42);
    expect(snapshot.interacting).toBe(true);
    expect(snapshot.phoneSettled).toBeNull();
    expect(snapshot.environmentAcceptable).toBeNull();
  });

  it('emits when interaction or battery changes', () => {
    const battery = new FakeBatteryMonitor();
    const interaction = new ManualInteraction();
    const seen: boolean[] = [];
    const signals = new ReadinessSignals(
      battery,
      interaction,
      new StubMotionMonitor(),
      new UnknownEnvironmentMonitor(),
    );

    const unsub = signals.subscribe((snapshot) => {
      seen.push(snapshot.interacting);
    });
    interaction.set(true);
    expect(seen[seen.length - 1]).toBe(true);

    unsub();
  });
});

describe('FakeReadinessSignals', () => {
  it('lets tests drive every field', async () => {
    const fake = new FakeReadinessSignals();
    fake.setSnapshot({
      charging: true,
      batteryLevel: 0.5,
      interacting: false,
      phoneSettled: true,
      environmentAcceptable: true,
    });
    await expect(fake.getSnapshot()).resolves.toEqual({
      charging: true,
      batteryLevel: 0.5,
      interacting: false,
      phoneSettled: true,
      environmentAcceptable: true,
    });
  });
});
