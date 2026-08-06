import { useEffect, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { audioLevelBand, MOCK_AUDIO_HZ, type AudioLevelBand } from './mock';

const TICK_MS = 1000 / MOCK_AUDIO_HZ;
/** Update the React label once per second so the 10 Hz stream does not re-render the tree. */
const LABEL_EVERY_TICKS = MOCK_AUDIO_HZ;

type MockAudioLevel = {
  readonly level: SharedValue<number>;
  readonly band: AudioLevelBand;
};

/**
 * Drives a Reanimated shared value at 10 Hz with a mock sine (ADR-13).
 *
 * The shared value is written without React state. The band label is throttled to 1 Hz.
 */
export function useMockAudioLevel(): MockAudioLevel {
  const level = useSharedValue(0.22);
  const [band, setBand] = useState<AudioLevelBand>('Low');

  useEffect(() => {
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      // Quiet overnight baseline with gentle variation — not a real mic stream.
      const next = 0.18 + 0.45 * Math.abs(Math.sin(ticks / 5)) + 0.08 * Math.abs(Math.sin(ticks / 13));
      level.value = Math.min(1, next);

      if (ticks % LABEL_EVERY_TICKS === 0) {
        setBand(audioLevelBand(level.value));
      }
    }, TICK_MS);

    return () => {
      clearInterval(id);
    };
  }, [level]);

  return { level, band };
}
