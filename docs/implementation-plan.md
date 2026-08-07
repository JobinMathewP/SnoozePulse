# Implementation Plan

This document expands `roadmap.md` into executable tasks.

`roadmap.md` says _what_ each phase covers. This document says _how to execute it, what may
be touched, and how to prove it is done_.

**Execute exactly one task per prompt. Every task ends in a STOP.**

---

# Status

Tasks 1.1 through 5.6 are complete and archived at
`docs/archive/implementation-plan-m1-m5.md`. The M5 detector shipped, and its acoustic
performance is inadequate. Milestone 6 (Tasks 6.1–6.6) rewrites the detector and the
scoring stack around an on-device YAMNet classifier.

---

## How to Use This Document

1. Read the task's **Read first** list in full before writing anything.
2. Explain your plan and wait for confirmation if the plan deviates from the task.
3. Modify only what **May modify** permits.
4. Satisfy every **Acceptance criterion**.
5. Run every **Validation** command and paste the output.
6. Show the list of changed files.
7. **STOP.** Do not begin the next task.

Where any document disagrees with `docs/decisions.md`, `decisions.md` wins.

---

## Milestone Overview

| Milestone | Theme                               | Tasks     | Status   | Phases  |
| --------- | ----------------------------------- | --------- | -------- | ------- |
| M1        | Foundation                          | 1.1 – 1.6 | archived | 1 – 4   |
| M2        | Navigation & UI Primitives          | 2.1 – 2.5 | archived | 5 – 6   |
| M3        | Screens (mock data)                 | 3.1 – 3.6 | archived | 7 – 14  |
| M4        | Data, State & Analytics             | 4.1 – 4.5 | archived | 15 – 17 |
| M5        | Native Audio, Integration & Release | 5.1 – 5.6 | archived | 18 – 25 |
| **M6**    | Acoustic Recognition                | 6.1 – 6.6 | active   | 26 – 31 |

Archived tasks live in `docs/archive/implementation-plan-m1-m5.md`. They are preserved
verbatim; do not follow them as active work.

---

## Dependency Gates

Install only at the task named. Anything not listed still needs approval.

| Install at | Packages                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Task 6.1   | Android (Gradle): `org.tensorflow:tensorflow-lite:2.16.1`, `org.tensorflow:tensorflow-lite-support:0.4.4`. iOS (CocoaPods): `TensorFlowLiteSwift ~> 2.14`, `TensorFlowLiteCCoreML ~> 2.14`. |

No JavaScript-side ML library is installed. Inference is native (ADR-22).

---

## Global Guardrails

These apply to every task and are not repeated in each one.

**Never modify, in any task:**

```text
docs/**            (except where a task explicitly says otherwise)
.cursor/rules/**
AGENTS.md
CLAUDE.md
LICENSE
assets/**          (except where a task explicitly says otherwise)
.git/**
node_modules/**
package-lock.json  (except as a side effect of an approved install)
docs/archive/**    (frozen historical record)
```

**Never do, in any task:**

- Redesign the UI or invent a color value.
- Hardcode a color, spacing, radius, or font size.
- Write SQL outside `src/repositories/`.
- Call a native module from the UI.
- Perform DSP in JavaScript.
- Construct a concrete class inside a store, hook, or component.
- Leave a `TODO`, a stub, or a thrown "not implemented".
- Continue to the next task automatically.
- Send raw PCM, log-mel patches, or tensors across the React Native bridge (ADR-22).
- Add a loudness-threshold branch in `CaptureEngine` (ADR-23).

**Baseline validation, run at the end of every task:**

```bash
npm run typecheck
npm run lint
npm test
```

All three must exit clean.

---

# Milestone 6 — Acoustic Recognition

Goal: replace the loudness-threshold detector with an on-device YAMNet classifier so the
app separates snores from coughs, speech, fans, blanket rustle, and rain.

Exit condition for M6: a recorded session detects snores via the classifier only,
`AudioDsp` no longer contributes to detection, `AudioLevelEvent` and `SnoreEvent` carry
`confidence`, V2 scores compute from confidence-weighted inputs, and the regression suite
meets its precision / recall gates on the public corpus.

---

## Task 6.1 — TFLite runtime scaffold and model asset

**Objective**
Add TFLite to `modules/snoozepulse-audio` on both platforms, bundle the YAMNet classifier
model, and confirm it loads on device with the expected hardware delegate. **No capture
wiring, no feature extraction, no detection change.**

**Read first**

- `docs/decisions.md` — ADR-16, ADR-21, ADR-22, ADR-28
- `docs/native-audio.md` — Model asset layout
- YAMNet documentation (Kaggle Models / TF Hub) — confirm the classifier variant, input
  shape `[1, 15600]`, output shape `[1, 521]`, and license.
- Expo Modules API docs for SDK 57

**May modify**

```text
modules/snoozepulse-audio/android/build.gradle
modules/snoozepulse-audio/android/src/main/assets/yamnet.tflite     (add binary asset)
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/YamnetClassifier.kt
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/SnoreClassifier.kt
modules/snoozepulse-audio/ios/SnoozePulseAudio.podspec
modules/snoozepulse-audio/ios/Resources/yamnet.tflite               (add binary asset)
modules/snoozepulse-audio/ios/YamnetClassifier.swift
modules/snoozepulse-audio/ios/SnoreClassifier.swift
modules/snoozepulse-audio/__fixtures__/LICENSES.md                   (create)
```

**Must not modify**

```text
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/CaptureEngine.kt
modules/snoozepulse-audio/ios/CaptureEngine.swift
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/AudioDsp.kt
modules/snoozepulse-audio/ios/AudioDsp.swift
modules/snoozepulse-audio/src/**
src/**
```

**Acceptance criteria**

- Android: `build.gradle` declares the two TFLite dependencies at the versions in the
  gate table.
- iOS: the Podspec declares `TensorFlowLiteSwift` and `TensorFlowLiteCCoreML`.
- `yamnet.tflite` is present at the asset paths in ADR-28 and passes a size sanity check
  (roughly 3.5–4.5 MB).
- A private `SnoreClassifier` interface exists on both platforms with one implementation,
  `YamnetClassifier`. It exposes `load()`, `warm()`, `classify(patch: FloatArray): Float`
  (returns `P(Snoring) + P(Snort)`), and `close()`.
- Warm inference is executed once from `SnoozePulseAudioModule` initialisation and the
  resolved delegate is logged (`NNAPI`, `CoreML`, or `CPU`).
- `LICENSES.md` records the YAMNet weights license and any Freesound clips referenced by
  later fixtures.
- `CaptureEngine` is byte-for-byte unchanged. Detection still uses the M5 loudness path
  (ADR-23's deletion happens in Task 6.3).

**Validation**

```bash
npm run typecheck
npm run lint
npm test
npx expo prebuild --clean
npx expo run:android
```

On a physical device or emulator, capture the log line naming the delegate. Paste it in
the STOP report so we can spot silent CPU fallbacks.

**STOP.** Report installed dependency versions, model size, delegate log, and the
platforms verified. Wait for review.

---

## Task 6.2 — Waveform-window front-end and byte-parity harness

**Objective**
Prepare YAMNet's *native* input — a 15,600-sample Float32 patch normalized to `[-1.0, 1.0]`
via `sample / 32768.0` — with byte-parity to a Python oracle, allocation-free after
warmup. **No mel spectrogram is computed** because the shipped YAMNet variant
(`lite-model/yamnet/classification/tflite/1`) has the log-mel front-end baked into the graph
(input tensor `[1, 15600]`, ADR-21). This task builds the input-preparation stage and its
regression fixture; the classifier remains uncalled from `CaptureEngine` until Task 6.3.

**Read first**

- `docs/decisions.md` — ADR-21, ADR-22
- YAMNet classifier variant page on TF Hub / Kaggle Models — confirm the input tensor
  is `[1, 15600]` float32 in `[-1.0, 1.0]`.

**May modify**

```text
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/WaveformWindow.kt
modules/snoozepulse-audio/android/src/test/java/expo/modules/snoozepulseaudio/WaveformWindowTest.kt
modules/snoozepulse-audio/android/build.gradle       (test dep + test resource srcDir only)
modules/snoozepulse-audio/ios/WaveformWindow.swift
modules/snoozepulse-audio/ios/Tests/WaveformWindowTests.swift
modules/snoozepulse-audio/__fixtures__/audio/reference_tone.wav              (procedurally generated)
modules/snoozepulse-audio/__fixtures__/waveform/reference_tone_windows.bin   (float32 LE oracle)
modules/snoozepulse-audio/__fixtures__/waveform/generate_fixtures.py         (reproducible generator)
modules/snoozepulse-audio/__fixtures__/LICENSES.md
```

**Must not modify**

```text
modules/snoozepulse-audio/**/CaptureEngine.*
modules/snoozepulse-audio/**/AudioDsp.*
modules/snoozepulse-audio/**/YamnetClassifier.*
modules/snoozepulse-audio/**/SnoozePulseAudioModule.*
modules/snoozepulse-audio/src/**
src/**
```

**Acceptance criteria**

- `WaveformWindow` exposes:
  - `fill(samples: ShortArray, count: Int): FloatArray` — copies exactly `patchSamples`
    samples into a pre-allocated `FloatArray(patchSamples)` normalized via
    `sample / 32768.0f` and returns the same instance every call. Throws if
    `count != patchSamples`.
  - `slidingWindows(mono16k: ShortArray, totalCount: Int, onPatch: (FloatArray) -> Unit)` —
    calls `onPatch` once per full 15,600-sample window with a `hopSamples` = 7,800 step
    (50 % overlap). Trailing partial window is discarded.
- Constants: `patchSamples = 15_600` (0.975 s @ 16 kHz), `hopSamples = 7_800`.
- No heap allocation in the hot path after construction; all scratch buffers are held on
  the instance and reused. Verified by an "allocation-free" assertion that calls `fill`
  twice and confirms the returned reference is identity-equal.
- A JVM (Kotlin) parity test compares the flattened window output for
  `__fixtures__/audio/reference_tone.wav` against
  `__fixtures__/waveform/reference_tone_windows.bin` and asserts mean absolute error
  `≤ 1e-6`. Equivalent Swift XCTest exists; Windows hosts may mark iOS execution as
  deferred to a Mac host.
- The Python oracle (`generate_fixtures.py`) is deterministic (fixed seed / analytic
  waveform) and regenerates both files bit-for-bit.
- `YamnetClassifier.classify(patch: FloatArray)` is *not* called from `WaveformWindow` or
  anywhere in `CaptureEngine`. This task ends with an input preparer, no detector rewrite.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
cd modules/snoozepulse-audio/android && ./gradlew :snoozepulse-audio:test
```

On a Mac host, additionally run `xcodebuild test -scheme SnoozePulseAudio` or the Expo
prebuild equivalent to execute `WaveformWindowTests.swift`. Windows may report the iOS
test as deferred.

**STOP.** Report parity MAE for each platform run and the fixture SHA-256 hashes. Wait for
review.

---

## Task 6.3 — Classifier-driven episode builder; delete the loudness detector

**Objective**
Rewrite `CaptureEngine.emitMeterAndDetect` around classifier probability with hysteresis,
grow the event payloads, and delete every code path where dB feeds detection.

**Read first**

- `docs/decisions.md` — ADR-21, ADR-23, ADR-24
- `docs/api-contracts.md`
- `docs/native-audio.md`

**May modify**

```text
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/CaptureEngine.kt
modules/snoozepulse-audio/ios/CaptureEngine.swift
modules/snoozepulse-audio/src/SnoozePulseAudio.types.ts
src/native/AudioEngine.ts
src/types/**              (only AudioLevelEvent, SnoreEvent, and their close relatives)
```

**Must not modify**

```text
modules/snoozepulse-audio/**/YamnetClassifier.*
modules/snoozepulse-audio/**/MelSpectrogram.*
modules/snoozepulse-audio/**/AudioDsp.*     (kept only for display dB)
src/store/**
src/features/**
src/services/**            (no signature changes to IAudioService)
src/repositories/**
```

**Acceptance criteria**

- Every 0.975 s window is fed through `MelSpectrogram` → `YamnetClassifier.classify`. The
  resulting `confidence = P(Snoring) + P(Snort)` is emitted on every `AudioLevelEvent`.
- Episode builder uses hysteresis: enter ≥ 0.55, exit < 0.35, minimum episode 300 ms,
  hang 700 ms. Constants live in a single named block at the top of `CaptureEngine` and
  in `MelSpectrogram` if any front-end constant is needed there.
- The `db >= ambientBaselineDb + SNORE_MARGIN_DB` branch is deleted. `SNORE_MARGIN_DB`
  no longer appears anywhere in `modules/snoozepulse-audio` (`grep` proof required in the
  STOP report).
- `AudioLevelEvent` gains `confidence: number` and `noiseFloorDb: number`. `SnoreEvent`
  gains `confidence: number`, `classLabel: 'snoring' | 'snort'`, and
  `spectralPeakHz: number | null`. Payload shapes match `docs/api-contracts.md` exactly.
- `noiseFloorDb` may be a stub (e.g. always `0`) in this task — Task 6.4 implements the
  rolling median.
- `AudioEngine.ts` forwards every new field; no field is dropped in adaptation.
- Store selectors and features compile with zero changes to their business logic.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
npx expo run:android
```

On device, run a 90-second cough / speech / TV smoke test and record the episode count
(target: 0). Play back a snore clip through room speakers and confirm ≥ 1 episode. Paste
both results in the STOP report.

**STOP.** Report the grep-clean proof for `SNORE_MARGIN_DB`, the smoke-test counts, and
the platforms verified.

---

## Task 6.4 — AGC-safe capture and rolling noise floor

**Objective**
Switch Android's capture source away from `MIC`, keep iOS as `.measurement`, and replace
the one-shot ambient calibration with a rolling 60 s noise-floor estimate exposed via
`AudioLevelEvent.noiseFloorDb`.

**Read first**

- `docs/decisions.md` — ADR-25
- Android `MediaRecorder.AudioSource` documentation

**May modify**

```text
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/CaptureEngine.kt
modules/snoozepulse-audio/ios/CaptureEngine.swift
modules/snoozepulse-audio/android/src/main/java/expo/modules/snoozepulseaudio/SnoozePulseAudioModule.kt
modules/snoozepulse-audio/ios/SnoozePulseAudioModule.swift
src/features/home/**       (calibration copy only, no functional change)
```

**Must not modify**

```text
modules/snoozepulse-audio/**/YamnetClassifier.*
modules/snoozepulse-audio/**/MelSpectrogram.*
modules/snoozepulse-audio/**/AudioDsp.*
modules/snoozepulse-audio/src/**
src/native/**
src/types/**
src/services/**
src/store/**
```

**Acceptance criteria**

- Android tries `MediaRecorder.AudioSource.UNPROCESSED` first when the OS advertises
  support via `AudioManager.getProperty("android.media.property.SUPPORT_AUDIO_SOURCE_UNPROCESSED")
  == "true"`, then falls back to `VOICE_RECOGNITION`. `MIC` is not used.
- The chosen source is logged with a stable tag on every session start.
- iOS `.measurement` mode is retained without changes.
- A rolling 60 s median of the display dB is maintained on the native thread; the current
  value populates `AudioLevelEvent.noiseFloorDb` on every emit.
- The JS-facing `calibrate()` promise returns the current noise-floor estimate immediately
  and does not block for 3 s.
- Home-screen calibration affordance stays; copy may be softened to "measuring
  environment" or equivalent.
- No functional change to the classifier or the episode builder.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
npx expo run:android
```

On device, confirm the granted-source log line and observe `noiseFloorDb` climbing during
the first minute of capture.

**STOP.** Report the granted-source log line for each device you test and the observed
noise-floor curve.

---

## Task 6.5 — V2 analytics and destructive schema migration

**Objective**
Introduce confidence-weighted V1-replacement scoring, migrate the SQLite schema, and wipe
pre-M6 sessions per ADR-26.

**Read first**

- `docs/decisions.md` — ADR-10, ADR-26
- `docs/api-contracts.md` — analytics inputs
- `docs/coding-standards.md` — Deferred Implementations

**May modify**

```text
src/services/analytics/**
src/services/database/migrations.ts
src/services/database/client.ts     (only if the migration API requires it)
src/repositories/**
src/services/**                     (composition-root wiring only)
src/types/**                        (analytics model fields only)
```

**Must not modify**

```text
modules/**
src/features/**                     (except tiny fixes if a type widening breaks a screen)
src/store/**                        (except tiny fixes if a type widening breaks a slice)
src/theme/**
```

**Acceptance criteria**

- New files: `src/services/analytics/sleepScoreV2.ts`, `snoreScoreV2.ts`,
  `scoringConstantsV2.ts`. V1 files are kept, unchanged, and are marked read-only via a
  doc comment ("V1 heuristic. Kept for archival reads only; no write path calls this after
  M6.").
- `ScoreInputs` gains `avgConfidence: number`, `snoringShareByConfidence: number`,
  `spectralConsistency: number`, and `episodeRegularity: number`. Existing fields remain.
- A new migration adds `sleep_sessions.score_version INTEGER NOT NULL DEFAULT 2`, deletes
  every row from `sleep_sessions`, `snore_events`, and `session_buckets`, and reclaims all
  snippet files under the documents directory in the same transaction where possible.
- The analytics composition root and `AudioService.finishActiveSession` call the V2
  functions. V1 functions are unreachable from the write path.
- Unit tests cover both V2 pure functions and the migration idempotency.
- No `TODO`, no stub, no throw.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
npx expo run:android
```

On device, verify that any existing sessions were wiped on first launch and that a fresh
session persists with `score_version=2`.

**STOP.** Report the migration output, the row counts before and after, and the platforms
verified.

---

## Task 6.6 — Regression corpus, precision / recall gates, RC-2

**Objective**
Assemble the public regression corpus, add golden-audio tests that exercise the log-mel +
YAMNet + episode-builder pipeline, publish a confusion matrix, and cut RC-2.

**Read first**

- `docs/decisions.md` — ADR-27
- `docs/testing-strategy.md` — Classifier Regression

**May modify**

```text
modules/snoozepulse-audio/__fixtures__/audio/**
modules/snoozepulse-audio/__fixtures__/LICENSES.md
src/services/analytics/__tests__/**
src/**/__tests__/**
docs/testing-strategy.md       (documentation-updated requirement only)
NOTICES.md                     (create if it doesn't exist)
README.md
package.json                   (only if a new dev-only test helper is required)
```

**Must not modify**

```text
application source, except to fix a defect a test reveals
```

**Acceptance criteria**

- Corpus size: ≥ 50 labelled snore clips, ≥ 100 non-snore clips (fans, coughs, speech,
  music, rain, blanket rustle). Every clip is CC0, CC-BY-4.0, or otherwise redistributable;
  license and attribution recorded in `LICENSES.md` and, where required, in `NOTICES.md`.
- Golden-audio Jest suite loads each clip, runs it through the log-mel front-end and the
  YAMNet classifier via a native-parity test harness, and asserts the episode builder's
  output against the label.
- Precision ≥ 0.85 and recall ≥ 0.90 on the labelled dev set. Failing the gate fails the
  test suite.
- Confusion matrix is printed to the test log and captured in the RC-2 report.
- All release gates from the archived Task 5.6 (typecheck, lint, tests, no runtime
  warnings, no TODO, documentation current) still pass.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
npx expo run:android --variant release
```

**STOP.** M6 complete. Report the precision / recall figures, confusion matrix, and RC-2
status. Wait for the instruction to commit.

---

# Progress Tracker

| Task | Title                                                     | Status  |
| ---- | --------------------------------------------------------- | ------- |
| 6.1  | TFLite runtime scaffold and model asset                   | pending |
| 6.2  | Log-mel feature front-end on the native thread            | pending |
| 6.3  | Classifier-driven episode builder; delete loudness path   | pending |
| 6.4  | AGC-safe capture and rolling noise floor                  | pending |
| 6.5  | V2 analytics and destructive schema migration             | pending |
| 6.6  | Regression corpus, precision / recall gates, RC-2         | pending |
