import { useAudioLevels } from '@/hooks';
import { liveAudioLevel } from '@/store';
import type { SharedValue } from 'react-native-reanimated';

import { audioLevelBandFromDb, type AudioLevelBand } from './copy';

type LiveAudioLevel = {
  readonly level: SharedValue<number>;
  readonly band: AudioLevelBand;
  /**
   * Task 6.7 — classifier's throttled probability `P(snoring) + P(snort)` clamped
   * `[0, 1]`. Display only (ADR-21).
   */
  readonly confidence: number;
  /**
   * Classifier's hysteretic snore state at the last throttled tick (ADR-24). React
   * re-renders coalesce with `currentDecibel` changes so this stays cheap.
   */
  readonly snoreDetected: boolean;
  /**
   * Rolling 60 s median of display dB from the native side (ADR-25). `0` before the
   * estimator warms up.
   */
  readonly noiseFloorDb: number;
};

/**
 * Waveform shared value is updated by {@link bindAudioSubscriptions} (ADR-13).
 *
 * Throttled fields (decibel + classifier confidence + hysteretic snore state + rolling
 * noise floor) come from the Zustand slice so React re-renders stay rare. Task 6.7
 * exposes the classifier-driven fields alongside the display-only band so the record
 * screen can render an ML-driven readout without subscribing to raw level events.
 */
export function useLiveAudioLevel(): LiveAudioLevel {
  const {
    currentDecibel,
    currentConfidence,
    currentSnoreDetected,
    currentNoiseFloorDb,
  } = useAudioLevels();
  const band: AudioLevelBand = audioLevelBandFromDb(currentDecibel);
  return {
    level: liveAudioLevel,
    band,
    confidence: currentConfidence,
    snoreDetected: currentSnoreDetected,
    noiseFloorDb: currentNoiseFloorDb,
  };
}
