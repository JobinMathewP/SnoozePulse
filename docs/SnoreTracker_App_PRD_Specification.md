# SnoozePulse – Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Draft  
**Platform:** React Native (Expo Development Build)  
**Target Devices:** Android & iOS

---

# Design Reference

The official UI specification is:

Primary References

- docs/home-screen.jpg
- docs/active-session.jpg
- docs/summary-screen.jpg
- docs/history-screen.jpg

Secondary Reference

- docs/mockup.jpg

All screens should match this visual language, with two ratified exceptions:

- The images render the product name as "SnoreCare". The product is **SnoozePulse** (ADR-08).
- The images show **Insights** and **Profile** tabs. Those are not part of the product and
  are not built (ADR-09).

The mockup defines:

- layout
- spacing
- typography
- colors
- navigation
- card hierarchy
- icon placement

The PRD describes behavior.

The mockup describes appearance.

If there is a conflict:

Behavior comes from the PRD.

Appearance comes from the mockup.

# 1. Product Vision

SnoozePulse is a privacy-first sleep monitoring application that detects snoring during sleep, records important snore events, analyzes sleep quality, and presents meaningful insights without uploading audio to the cloud.

All processing and storage occur locally on the device unless a future cloud sync feature is enabled.

---

# 2. Goals

## Primary Goals

- Detect snoring accurately
- Record only relevant snore audio snippets
- Operate throughout an entire night's sleep
- Minimize battery consumption
- Provide actionable sleep analytics

## Non-Goals

- Medical diagnosis
- Sleep apnea diagnosis
- Cloud storage in V1
- Clinically derived scoring in V1 (see §5 Scoring)
- Insights and Profile screens
- Web support

---

# 3. Target Users

People who:

- Snore regularly
- Want to understand sleep quality
- Need overnight monitoring
- Prefer privacy-first local processing

---

# 4. Core Features

## Home

- Start Sleep Session
- Device readiness checks
- Battery warning
- Microphone permission status
- Ambient noise calibration

## Active Sleep

- OLED-friendly UI
- Live clock
- Audio waveform visualization
- Slide to end session
- Background recording indicator

## Morning Summary

Display:

- Sleep duration
- Snore count
- Snore score
- Total snoring time
- Peak loudness
- Loudest event
- Interactive timeline
- Playable audio snippets

## History

- Weekly trends
- Monthly trends
- Sleep score history
- Snore reduction comparison
- Calendar overview

---

# 5. Functional Requirements

## Recording

- Start monitoring manually
- Continue while screen is locked
- Foreground service on Android
- Background audio mode on iOS
- Pause and resume are system-triggered only, on audio interruption (ADR-14)

## Detection

Native audio engine performs on-device acoustic classification (ADR-21). The pipeline is:

1. Capture 16 kHz mono PCM (AGC-safe source per ADR-25).
2. Slice into 0.975 s windows with 50% overlap.
3. Compute a 96 × 64 log-mel spectrogram on the native thread.
4. Run inference on the bundled YAMNet TFLite model via NNAPI (Android) or Core ML (iOS).
5. Sum the `Snoring` and `Snort` class probabilities to obtain a confidence score.
6. Apply hysteresis (enter ≥ 0.55, exit < 0.35, min 300 ms, hang 700 ms) to build episodes.
7. Write a 5-second WAV snippet on episode close.
8. Emit `AudioLevelEvent` (with `confidence`) and `SnoreEvent` (with `confidence`,
   `classLabel`, and `spectralPeakHz`) to JavaScript.

dB is retained only as a UI display value for the waveform and as the input to the rolling
noise-floor estimate. dB does not participate in detection (ADR-23).

## Scoring

Sleep score and snore score are V2 (ADR-26). Each is one pure function whose weighting
constants live in a single named block (`scoringConstantsV2.ts`), so a future V3 can
replace them wholesale without touching callers.

V2 inputs extend the M5 statistics (snore count, total snoring time, peak dB, session
duration) with classifier-derived signals:

- `avgConfidence` — mean classifier probability across episodes.
- `snoringShareByConfidence` — Σ(episode duration × confidence) / session duration.
- `spectralConsistency` — 1 minus the coefficient of variation of `spectralPeakHz` across
  episodes.
- `episodeRegularity` — a 0–1 measure of how evenly episodes are spaced.

The agent must not invent medical or clinical scoring.

## Storage

Persist locally using SQLite (`expo-sqlite`), with WAL journaling,
`PRAGMA foreign_keys = ON`, and forward-only migrations driven by `PRAGMA user_version`.

Tables:

- `sleep_sessions` — one row per night. Start and end timestamps, resolved state, ambient
  calibration baseline, total snore duration, snore count, peak dB and when it occurred,
  and both computed scores.
- `snore_events` — one row per episode. Foreign key to the session with `ON DELETE CASCADE`,
  composite index on `(session_id, timestamp)`.
- `session_buckets` — pre-aggregated time buckets: session id, bucket start, average dB,
  peak dB, and snoring milliseconds. Written incrementally during the session (ADR-11).

`session_buckets` exists so the Summary timeline chart and the History trends never
recompute from raw events. Storing the raw 10 Hz level stream would mean roughly 288,000
rows per night, which is not viable across months.

Snore event writes are batched into a single transaction on a size or time trigger, with a
guaranteed flush on `STOPPING`.

## Retention

Audio snippets are kept for **30 days or 500 MB, whichever limit is reached first**.
Cleanup is automatic. Deleting a session deletes its snippets. Orphaned files are reclaimed
at app start.

---

# 6. UI Theme

Background:
#0B0F17

Surface:
#161F30

Primary:
#6366F1

Alert:
#F43F5E

Success:
#10B981

Additional tokens are sampled directly from the reference images, never invented (ADR-06).

Typography:

- Inter, bundled on both platforms (ADR-07)

Rounded corners:
16px+

Spacing:
8 / 16 / 24 / 32 token system

---

# 7. Architecture

Capture and persistence:

```text
Native Audio Engine → React Native Bridge → Zustand Store → Services → Repositories → SQLite
```

Presentation:

```text
UI → Zustand Store  (reads via selectors; user intent flows back down the same chain)
```

The store never calls a repository directly, and the UI never reads SQLite directly
(ADR-12). Implementations are injected as interfaces at a single composition root (ADR-18).

Navigation is Expo Router, which satisfies the React Navigation requirement because Expo
Router is built on React Navigation (ADR-01).

See `docs/architecture.md` and `docs/decisions.md`.

---

# 8. Performance Targets

- Stable overnight recording
- Memory usage should remain stable
- UI updates throttled to approximately 100–200ms
- No unnecessary allocations
- Smooth 60 FPS UI

---

# 9. Accessibility

- accessibilityLabel for all controls
- Minimum touch size 44x44
- Dynamic font scaling support
- High contrast color usage

---

# 10. Future Enhancements

Shipped in V2 (M6): on-device acoustic classification via YAMNet. See ADR-21.

Future work:

- Cloud backup
- Custom-trained snore classifier (fine-tuned head over YAMNet embeddings) with an
  opt-in on-device training corpus (ADR-27 leaves this door open)
- Wearable integration
- Smart alarm
- Sleep apnea risk estimation
- PDF report export

---

# 11. Definition of Done

A feature is complete when:

- TypeScript passes
- ESLint passes
- No runtime warnings
- Accessibility verified
- Theme tokens used
- Repository pattern followed
- No placeholder implementations
- Documentation updated
