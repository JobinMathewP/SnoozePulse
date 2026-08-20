import { READINESS } from './readinessConstants';

export type MotionSampleClass = 'unknown' | 'still' | 'moving';

/**
 * Classify one accelerometer reading in g. Near-zero vectors are treated as
 * "no data" (denied / unavailable), not as sitting still.
 *
 * Motion measures the phone, never the person.
 */
export function classifyAcceleration(
  x: number,
  y: number,
  z: number,
  stillDelta: number = READINESS.MOTION_STILL_G_DELTA,
): MotionSampleClass {
  if (![x, y, z].every((axis) => Number.isFinite(axis))) {
    return 'unknown';
  }
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (magnitude < 0.1) {
    return 'unknown';
  }
  if (Math.abs(magnitude - 1) <= stillDelta) {
    return 'still';
  }
  return 'moving';
}
