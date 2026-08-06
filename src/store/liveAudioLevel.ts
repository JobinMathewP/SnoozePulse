import { makeMutable, type SharedValue } from 'react-native-reanimated';

/**
 * Waveform shared value — written on every AudioLevelEvent (ADR-13).
 *
 * Created with `makeMutable` so the composition-root binder can update it without a
 * React tree. Active Session reads this; the store's `currentDecibel` stays throttled.
 */
export const liveAudioLevel: SharedValue<number> = makeMutable(0);

/** Map engine dB (~0–100 display scale) into Waveform's 0–1 domain. */
export function decibelToWaveLevel(decibel: number): number {
  const normalized = (decibel - 20) / 70;
  if (normalized <= 0) {
    return 0;
  }
  if (normalized >= 1) {
    return 1;
  }
  return normalized;
}
