> **Archived — product v1 / Milestone 6 shipped.**
>
> This file is preserved for provenance. Do not follow it as an active plan. The
> active roadmap lives in `docs/roadmap.md` and covers **M7 — Automatic Sleep
> Tracking** (product v2). See `docs/archive/README.md` and ADR-33.

# Development Roadmap (AI-Optimized for Cursor)

> **Purpose**
>
> This document is the execution playbook for Cursor.
> Complete **exactly one phase** per prompt.
> Never continue automatically to the next phase.

---

# Status

M1–M5 shipped as debug builds on Android and iOS in August 2026. The M5 detector was a
loudness-over-baseline threshold and could not distinguish snores from other sounds. It is
superseded by **Milestone 6 — Acoustic Recognition** (Phases 26–31, Tasks 6.1–6.8). Phase
31 / Task 6.6 (regression corpus and RC-2 gate) is deferred to post-M6 hardening under
ADR-29; it is not required for M6 exit.

The archived M1–M5 roadmap lives at `docs/archive/roadmap-m1-m5.md`. Do not follow it as an
active plan. See ADR-28 for the restructure and ADR-21 for why the detector is being
rewritten.

---

# Documentation Priority

When multiple references overlap, follow this order:

1. docs/decisions.md ← ratified decisions, overrides everything below
2. docs/home-screen.jpg
3. docs/active-session.jpg
4. docs/summary-screen.jpg
5. docs/history-screen.jpg
6. docs/mockup.jpg
7. docs/design-spec.md
8. docs/ui-guidelines.md
9. docs/architecture.md
10. docs/api-contracts.md
11. docs/native-audio.md
12. docs/SnoreTracker_App_PRD_Specification.md
13. docs/coding-standards.md
14. docs/testing-strategy.md
15. docs/implementation-plan.md
16. docs/roadmap.md

Where any reference conflicts with `decisions.md`, `decisions.md` wins. Ratified deviations
carried forward from M1–M5: SnoozePulse branding (ADR-08) and the removal of Insights and
Profile tabs (ADR-09). M6 adds ADR-21 (YAMNet detector), ADR-23 (loudness detector deleted),
and ADR-26 (V2 scoring with a destructive migration).

`roadmap.md` defines the phases. `implementation-plan.md` breaks each phase into executable
tasks with allowed paths, acceptance criteria, and validation commands. On task scope, the
implementation plan is the more specific document and takes precedence.

---

# Global Rules

Before every phase:

- Read all relevant documentation.
- Read `.cursor/rules/`.
- Explain the implementation plan.
- Modify only allowed files.
- Run:
  - `npm run typecheck`
  - `npm run lint`
- Show changed files.
- Stop and wait for instructions.

## Never

- Redesign the UI.
- Invent APIs, dependencies, or color values.
- Hardcode colors or spacing.
- Execute SQL inside UI components or stores.
- Access native modules directly from UI.
- Perform DSP in JavaScript.
- Construct a concrete implementation inside a store, hook, or component.
- Modify unrelated files.
- Continue to another phase automatically.
- Send raw PCM, log-mel patches, or tensors across the React Native bridge (ADR-22).
- Add a loudness-threshold branch in `CaptureEngine` (ADR-23 forbids the fallback).

---

# Milestones and Dependency Gates

M1–M5 are archived. M6 is the only active milestone.

| Milestone | Status   | Phases  | Install at | Packages |
| --------- | -------- | ------- | ---------- | -------- |
| M1–M5     | archived | 1–25    | —          | see `docs/archive/roadmap-m1-m5.md` |
| **M6** Acoustic Recognition | active | 26–33 | Task 6.1 | Android (Gradle): `org.tensorflow:tensorflow-lite:2.16.1`, `org.tensorflow:tensorflow-lite-support:0.4.4`. iOS (CocoaPods): `TensorFlowLiteSwift ~> 2.14`, `TensorFlowLiteCCoreML ~> 2.14`. JS: none. |

Phases 26–30 correspond to Tasks 6.1–6.5. Phase 31 (regression corpus + RC-2 gate) is
deferred per ADR-29 and does not map to an active task. Phase 32 (Task 6.7 — UI wiring
for the ML detector) and Phase 33 (Task 6.8 — mockup-aligned visual polish) were added
after Task 6.5 sign-off; see `docs/implementation-plan.md` for the executable spec of
each.

No JavaScript-side ML library is installed. Inference is native (ADR-22).

Anything not on this list still requires approval before it is added.

---

# Known Starting Condition

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm test` passes (M5 test suite is green).
- Android and iOS debug builds run on device.
- The M5 detector is the current production path and is what M6 replaces.

---

# Milestone 6 — Acoustic Recognition

Goal: replace the loudness-threshold detector with an on-device YAMNet classifier so that
snores are separated from coughs, speech, fans, blanket rustle, and rain.

Exit condition for M6: a recorded session detects snores via the classifier only, `AudioDsp`
no longer contributes to detection, `AudioLevelEvent` and `SnoreEvent` carry `confidence`,
V2 scores compute from confidence-weighted inputs, the ML-driven fields are surfaced in
the UI (Phase 32 / Task 6.7), and the visual polish reconciles with the reference mockups
(Phase 33 / Task 6.8). The classifier passes on-device smoke tests; a formal regression
gate lands under ADR-29 before any release outside the development team.

---

## Phase 26 — TFLite runtime scaffold and model asset

Reference:

- docs/native-audio.md
- ADR-21, ADR-22, ADR-28

Allowed:

- modules/snoozepulse-audio/android/build.gradle
- modules/snoozepulse-audio/android/src/main/assets/yamnet.tflite
- modules/snoozepulse-audio/ios/SnoozePulseAudio.podspec
- modules/snoozepulse-audio/ios/Resources/yamnet.tflite
- modules/snoozepulse-audio/ios/**  (loader class only, no capture wiring)
- modules/snoozepulse-audio/android/src/main/java/**  (loader class only, no capture wiring)
- modules/snoozepulse-audio/__fixtures__/LICENSES.md

Tasks:

- Add the TFLite dependencies from the M6 install row.
- Bundle the YAMNet classifier `.tflite` as a native asset.
- Load the model on both platforms behind a private `SnoreClassifier` interface.
- Warm inference on start and log the resolved delegate (NNAPI / Core ML / CPU).

**No capture wiring. No feature extraction. No changes to detection.**

---

## Phase 27 — Log-mel feature front-end

Reference:

- docs/native-audio.md — Model asset layout
- ADR-22

Allowed:

- modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/MelSpectrogram.kt
- modules/snoozepulse-audio/ios/MelSpectrogram.swift
- modules/snoozepulse-audio/__fixtures__/mel/**

Tasks:

- Implement YAMNet's front-end natively: 25 ms window, 10 ms hop, 64 mel bins covering
  125 Hz – 7500 Hz, log with a 1e-3 offset.
- Produce a 96 × 64 `float[]` patch for each 0.975 s window.
- Zero allocations after warmup on both platforms.
- Ship a Python-generated fixture per platform under `__fixtures__/mel/` for parity tests.

**No classifier calls yet. No capture wiring.**

---

## Phase 28 — Classifier interface + episode builder; delete loudness detector

Reference:

- docs/native-audio.md
- docs/api-contracts.md — updated event payloads
- ADR-21, ADR-23, ADR-24

Allowed:

- modules/snoozepulse-audio/android/**
- modules/snoozepulse-audio/ios/**
- modules/snoozepulse-audio/src/SnoozePulseAudio.types.ts
- src/native/AudioEngine.ts
- src/types/**  (level + snore event fields only)

Tasks:

- Introduce a `SnoreClassifier` interface (Kotlin + Swift) with a `YamnetClassifier`
  implementation that consumes the log-mel patch and returns `P(Snoring) + P(Snort)`.
- Rewrite `CaptureEngine.emitMeterAndDetect` around classifier probability with hysteresis:
  enter ≥ 0.55, exit < 0.35, min 300 ms, hang 700 ms.
- Delete `SNORE_MARGIN_DB` and the `db >= ambientBaselineDb + SNORE_MARGIN_DB` branch.
  `ambientBaselineDb` as a single stored value is deleted with it (ADR-25 replaces it).
- Add `confidence` and `noiseFloorDb` to `AudioLevelEvent`; add `confidence`, `classLabel`,
  and `spectralPeakHz` to `SnoreEvent`.
- Adapter (`AudioEngine.ts`) forwards the new fields; store selectors continue to work.

Retained from `AudioDsp`: `rms`, `rmsToDb`, `peak` — all only feed the display dB / rolling
noise floor. None participates in detection (ADR-23).

---

## Phase 29 — AGC-safe capture and adaptive noise floor

Reference:

- ADR-25

Allowed:

- modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/CaptureEngine.kt
- modules/snoozepulse-audio/ios/CaptureEngine.swift
- modules/snoozepulse-audio/src/SnoozePulseAudio.types.ts (only if a new debug field is
  proven necessary)
- src/features/home/**  (calibration copy only, no functional change)

Tasks:

- Android capture source order: `UNPROCESSED` (when supported) → `VOICE_RECOGNITION`. Never
  `MIC`.
- Log the source the OS actually granted.
- Maintain a rolling 60 s median of the display dB and expose it as
  `AudioLevelEvent.noiseFloorDb`.
- Keep the JS-facing `calibrate()` promise; it returns the current noise-floor estimate
  immediately instead of running a 3 s blocking pass.
- Home-screen calibration affordance stays; label copy may be softened to "measuring
  environment".

---

## Phase 30 — V2 analytics and destructive schema migration

Reference:

- docs/api-contracts.md — analytics inputs
- ADR-10, ADR-26

Allowed:

- src/services/analytics/**
- src/services/database/migrations.ts
- src/repositories/**
- src/types/**  (analytics model fields only)
- src/services/**  (composition-root wiring only)

Tasks:

- Create `sleepScoreV2.ts`, `snoreScoreV2.ts`, `scoringConstantsV2.ts`.
- Extend `ScoreInputs` with `avgConfidence`, `snoringShareByConfidence`,
  `spectralConsistency`, and `episodeRegularity`.
- Add a `score_version` column to `sleep_sessions` (default 2).
- In the same migration, delete every row from `sleep_sessions`, `snore_events`,
  `session_buckets` and reclaim all snippet files (ADR-26).
- Route write paths through V2 functions. V1 functions remain in source but are unreachable
  after this phase.

---

## Phase 31 — Regression corpus, precision / recall gates, RC-2 _(deferred, ADR-29)_

> **Status: deferred.** Postponed to post-M6 hardening under ADR-29. Reopens when the app
> is distributed outside the development team, or when any change is made to the
> detection pipeline. The rest of this phase is preserved verbatim as the definition of
> the eventual gate.

Reference:

- docs/testing-strategy.md — Classifier Regression
- ADR-27
- ADR-29

Allowed:

- modules/snoozepulse-audio/__fixtures__/audio/**
- modules/snoozepulse-audio/__fixtures__/LICENSES.md
- src/services/analytics/__tests__/**
- src/**/__tests__/**
- docs/testing-strategy.md  (documentation-updated requirement only)
- NOTICES.md  (create if it doesn't exist)
- README.md

Tasks:

- Assemble ≥ 50 labelled snore clips and ≥ 100 non-snore clips from public sources listed
  in ADR-27.
- Golden-audio Jest suite runs each clip through the log-mel + YAMNet pipeline and asserts
  the episode builder's output.
- Precision ≥ 0.85 and recall ≥ 0.90 on the labelled dev set.
- Confusion matrix printed as part of the RC-2 report.

---

# Definition of Done (Every Phase)

A phase is complete only if:

- `npm run typecheck` passes
- `npm run lint` passes
- `npm test` passes
- No runtime warnings
- No placeholder implementations
- Uses theme tokens
- Uses reusable UI primitives
- Follows strict layering: UI → Store → Services → Repositories → SQLite / Native
- Depends on interfaces, not concrete implementations
- No PCM, tensors, or log-mel patches cross the bridge
- Stops after completion
