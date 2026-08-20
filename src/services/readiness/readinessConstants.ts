/**
 * Sleep Readiness window offsets and settle threshold (ADR-31).
 *
 * Readiness opens 30 minutes before expected bedtime and stays open until 2 hours
 * before the wake window starts — late nights can still auto-start. Example:
 * bedtime 11:30 PM / wake 7:00 AM → readiness 11:00 PM–4:30 AM, wake window
 * 6:30–7:30 AM. A 2:00 AM settle can start; 5:00 AM cannot. Tunable here only.
 */
export const READINESS = {
  /** Minutes before expected bedtime that evaluation may begin. */
  BEDTIME_LEAD_MINUTES: 30,
  /**
   * Minutes before the wake window opens when auto-start must stop considering.
   * Replaces a short post-bedtime lag so 2 AM is still in window on a typical night.
   */
  READINESS_CLOSE_BEFORE_WAKE_WINDOW_MINUTES: 120,
  /** Minutes before expected wake that the wake window opens. */
  WAKE_LEAD_MINUTES: 30,
  /** Minutes after expected wake that monitoring should end (time-based default). */
  WAKE_LAG_MINUTES: 30,
  /**
   * How long the phone must stay settled, idle, and in an acceptable environment
   * before emitting `start_session`.
   */
  SETTLE_DURATION_MS: 10 * 60 * 1000,
  /** Accelerometer poll while evaluating readiness. Slow on purpose (battery). */
  MOTION_UPDATE_INTERVAL_MS: 1000,
  /**
   * | |a| − 1 g | below this counts as still. Tight enough to catch walking,
   * loose enough for a phone on a mattress.
   */
  MOTION_STILL_G_DELTA: 0.08,
  /** How long samples must stay still before `phoneSettled` becomes true. */
  MOTION_STILL_STREAK_MS: 3000,
  /** How often the scheduler re-evaluates while the JS process is alive. */
  TICK_INTERVAL_MS: 15_000,
} as const;
