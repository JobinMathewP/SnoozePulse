import { useAudioLevels } from '@/hooks';
import { liveAudioLevel } from '@/store';
import type { SharedValue } from 'react-native-reanimated';

import { audioLevelBandFromDb, type AudioLevelBand } from './copy';

type LiveAudioLevel = {
  readonly level: SharedValue<number>;
  readonly band: AudioLevelBand;
};

/**
 * Waveform shared value is updated by {@link bindAudioSubscriptions} (ADR-13).
 * Band label comes from the throttled store decibel so React re-renders stay rare.
 */
export function useLiveAudioLevel(): LiveAudioLevel {
  const { currentDecibel } = useAudioLevels();
  const band: AudioLevelBand = audioLevelBandFromDb(currentDecibel);
  return { level: liveAudioLevel, band };
}
