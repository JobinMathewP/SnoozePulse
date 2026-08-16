import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme';

type DayRingProps = {
  /** Ring diameter in px. */
  readonly size: number;
  /** Stroke thickness in px. */
  readonly strokeWidth: number;
  /**
   * Quiet-sleep fraction in `[0, 1]`, or `null` when there is no data to score. A `null` or
   * `0` value draws only the inactive track, so empty and unrecorded days stay uniform.
   */
  readonly progress: number | null;
  /**
   * Unique gradient id. SVG gradient ids are document-scoped, and every ring is its own
   * `<Svg>`, so a shared literal would collide across cells; the caller passes the day iso.
   */
  readonly gradientId: string;
};

/**
 * Per-day "quiet sleep" ring (ADR-30). A full sweep means a quiet night; the cyan → blue
 * gradient and midnight track deliberately diverge from Apple Fitness's neon rings to avoid a
 * copycat rejection (Guideline 4.1). The arc starts at 12 o'clock and fills clockwise.
 */
export function DayRing({ size, strokeWidth, progress, gradientId }: DayRingProps) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = progress === null ? 0 : Math.max(0, Math.min(1, progress));
  const dash = clamped * circumference;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.calRingStart} />
          <Stop offset="1" stopColor={colors.calRingEnd} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.calRingTrack}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {dash > 0 ? (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      ) : null}
    </Svg>
  );
}
