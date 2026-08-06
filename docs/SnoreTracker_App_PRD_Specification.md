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

Native audio engine should:

- Calculate RMS
- Estimate dB
- Detect snore events
- Ignore noise below threshold
- Save only significant snippets

## Scoring

Sleep score and snore score ship in V1 as **simple weighted metrics over recorded
statistics** — snore count, total snoring time, peak loudness, and session duration.

This is an explicit placeholder. The agent must not invent medical or clinical scoring.
Each score is one pure function with its weighting constants in a single named block so it
can be replaced wholesale in V2 without touching callers (ADR-10).

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

- Cloud backup
- AI snore classification
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
