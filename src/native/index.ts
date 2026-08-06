/**
 * JavaScript-side native contracts.
 *
 * `modules/snoozepulse-audio/` holds the Swift and Kotlin sources. This folder holds only
 * the interface (and, later, the thin wrapper that adapts module events into domain events).
 * Application code depends on `IAudioEngine`, never on the Expo module directly (ADR-16).
 */

export type { Result } from './IAudioEngine';
export type { IAudioEngine } from './IAudioEngine';
