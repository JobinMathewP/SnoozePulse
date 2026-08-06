/**
 * How often `currentDecibel` may change in the store for non-animated consumers (ADR-13).
 * Native events arrive faster; the waveform bypasses this path via Reanimated.
 */
export const DECIBEL_STORE_THROTTLE_MS = 250;
