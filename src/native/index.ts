/**
 * JavaScript-side native contracts and the thin engine wrapper (ADR-16).
 *
 * `modules/snoozepulse-audio/` holds Swift / Kotlin. Application code depends on
 * {@link IAudioEngine} only — never on the Expo module package path.
 */

export type { Result } from './IAudioEngine';
export type { IAudioEngine } from './IAudioEngine';
export { AudioEngine } from './AudioEngine';
