# Architecture Decision Record

Decisions ratified at the end of Phase 0 (Architecture Review).

This document is the tie-breaker. Where any other document in `docs/` or any rule in
`.cursor/rules/` disagrees with a decision recorded here, this document wins and the
other document is considered stale and should be corrected.

---

## ADR-01 — Navigation: Expo Router

Navigation is implemented using **Expo Router**, which satisfies the React Navigation
requirement in `.cursor/rules/02-tech-stack.mdc` because Expo Router is built on top of
React Navigation.

Rationale: already scaffolded, file-based routing, and a clean path to deep linking.

Routes live in `src/app/`, not a top-level `app/`.

---

## ADR-02 — Remove the starter template

The `create-expo-app` template code is deleted in Phase 1. See the Phase 1 deletion list
in `roadmap.md` for the exact files.

Web is **not** a supported target. Android and iOS only. `.web.tsx` variants are removed
and no new ones are created.

---

## ADR-03 — Dependencies are installed per milestone

No dependency is installed before the milestone that needs it. See the milestone
dependency table in `roadmap.md`.

---

## ADR-04 — `typecheck` script

`package.json` provides `"typecheck": "tsc --noEmit"`. Every phase gate runs it.

---

## ADR-05 — Folder structure

The full eleven-directory structure is used. See `coding-standards.md`.

---

## ADR-06 — Colors are sampled, never invented

Additional design tokens beyond the five documented brand colors are produced by
**sampling pixels directly from the reference images** in `docs/`. No token value may be
guessed, eyeballed, or generated. See `ui-guidelines.md` for the sampling procedure and
the list of tokens that must be sampled.

---

## ADR-07 — Typography: bundle Inter

Inter is bundled via `expo-font` and `@expo-google-fonts/inter` so Android and iOS render
identically. The "Inter / SF Pro / Roboto" list in earlier documents was a fallback stack,
not a per-platform mandate.

---

## ADR-08 — Branding: SnoozePulse

The product is **SnoozePulse** everywhere. The reference images render "SnoreCare"; that
string is a mockup artifact and is not implemented. This is the one place where a string
in the images is deliberately not reproduced.

---

## ADR-09 — Scope is four screens

The product is Home, Active Session, Summary, and History.

The bottom navigation in the reference images shows four tabs including **Insights** and
**Profile**. Those two are **not part of the product** and are not built, not stubbed, and
not placeholdered. The reference images are stale on this point.

Bottom navigation therefore has three tab destinations — Home, History, and a settings
entry point reachable from the Home header gear icon — with Active Session and Summary
presented outside the tab bar. See `design-spec.md` for the navigation map.

---

## ADR-10 — Scoring is deferred to V2

Snore score and sleep score are computed by `IAnalyticsService` using **simple, documented,
weighted metrics** as a V1 placeholder. The agent must not invent medical or clinical
scoring.

The V1 implementation must be a single, clearly isolated, pure function per score so that
it can be replaced wholesale in V2 without touching callers. The weighting constants live
in one named constants block, not scattered through the service.

---

## ADR-11 — Aggregate timeline table

A third table, `session_buckets`, stores pre-aggregated time buckets so the Summary
timeline chart and the History trends never recompute from raw events.

---

## ADR-12 — Strict layering

```text
UI → Store → Services → Repositories → SQLite / Native
```

The store never calls a repository directly. This overrides the looser wording previously
in `api-contracts.md`.

---

## ADR-13 — Waveform bypasses React renders

The ~10 Hz audio level stream drives a Reanimated shared value written directly by the
event subscription. It does not flow through React reconciliation.

The store still exposes `currentDecibel` for non-animated consumers, but it is updated at
a throttled, human-perceptible rate rather than at event rate.

---

## ADR-14 — Pause is system-only

`PAUSED` is entered and exited by the system in response to audio interruptions such as an
incoming call. There is **no user-facing pause control** and none is added to any screen.

---

## ADR-15 — Audio retention

Snore audio snippets are retained for **30 days or 500 MB, whichever limit is reached
first**. Cleanup is automatic. Deleting a session deletes its snippets.

---

## ADR-16 — Native module location

The Swift and Kotlin sources live in a top-level Expo local module:

```text
modules/snoozepulse-audio/
```

`src/native/` holds only the JavaScript-side interface and wrapper.

---

## ADR-17 — Visual verification target

Android Emulator first, then a physical Android device. iOS verification is deferred
because the development machine is Windows.

---

## ADR-18 — Dependency injection

Concrete implementations are never constructed inside a store, a component, or a hook.

```text
IAudioEngine  ←  AudioEngine  (constructed once at composition root)
                     ↓ injected
                   Store
```

Every consumer depends on the interface. A single composition root wires the concrete
graph at app start. This keeps the store testable with a fake engine and a fake database.

---

## ADR-19 — Services and repositories are separate concerns

`services/` holds business logic and orchestration. `repositories/` holds persistence and
nothing else.

```text
services/                    repositories/
  AudioService                 SleepRepository
  SleepService                 SnoreRepository
  AnalyticsService
```

A repository never contains a business rule. A service never contains SQL.

---

## ADR-20 — NativeWind v5 preview with Tailwind CSS 4

Ratified during Task 1.1.

NativeWind's current stable line (4.2.6) depends on `react-native-css-interop@0.2.6`, which
declares `tailwindcss: "~3"` as a peer, and its documentation targets Expo SDK 54. NativeWind
v5 is the line that supports React Native 0.81+. This project runs React Native 0.86 on Expo
SDK 57, which is New Architecture only, so **v5 is the only line that claims support for our
runtime**.

Accepted: v5 is still a preview release.

Approved package set, beyond the original M1 list:

```text
nativewind@preview        react-native-css
tailwindcss (4.x)         @tailwindcss/postcss  (dev)
                          postcss               (dev)
```

Plus a pinned `lightningcss` override, which NativeWind's own installation guide requires to
avoid `global.css` deserialization errors:

```json
{ "overrides": { "lightningcss": "1.30.1" } }
```

**Installation is deferred to Task 1.3**, where NativeWind is configured and verified in one
step, rather than installed blind in Task 1.1 and only exercised later.

### Consequence for theme tokens

Tailwind 4 moves theme definition out of `tailwind.config.js` and into CSS via `@theme`.
ADR-06 and the "Tailwind config is generated from `src/theme/`" rule are unchanged in
principle — `src/theme/` remains the single source of truth — but the mechanism changes:
Task 1.4 generates CSS custom properties into an `@theme` block instead of a JavaScript
config object. There is no `tailwind.config.js` in this project.

---

## ADR-21 — V2 detector is an on-device YAMNet classifier

Ratified at the start of Milestone 6.

The M5 detector (`AudioDsp.rms` → `db >= ambientBaselineDb + SNORE_MARGIN_DB`) is a loudness
threshold, not a snore recogniser. It cannot separate snores from coughs, speech, fans,
blanket rustling, or rain. Because every downstream metric (snore count, duration, peak,
sleep score, snore score) depends on that decision, the entire analytics stack inherits its
error.

**V2 replaces the detector with the pretrained YAMNet classifier** running on the device
through TFLite. YAMNet was trained on the Google AudioSet ontology and its 521-class output
includes `Snoring` (index 38) and `Snort` (index 39). We ship it **as-is** with no fine
tuning; only the two snore-related probability outputs are consumed by the episode builder.

Rationale:

- Ship-ready. No training corpus needed.
- Public, well-understood, and license-clean (Apache-2.0 model weights).
- The 0.975 s window and 16 kHz mono input already match our capture format.
- Fine tuning is a V3 possibility once an evaluation corpus exists (ADR-27).

Consequence: `snoreDetected` on `AudioLevelEvent` is now driven by classifier probability
plus hysteresis, not by dB. dB is retained on the event **only** as a UI display value for
the waveform.

---

## ADR-22 — TFLite runs inside the native module, not via JSI in JavaScript

Ratified at the start of Milestone 6.

The obvious alternative — `react-native-fast-tflite` — puts the tensor and the inference
call on the JavaScript side. That directly contradicts the rules in `docs/native-audio.md`
("Never send raw PCM to JavaScript. Perform … filtering natively") and ADR-16 (native module
owns the DSP boundary).

**TFLite runtime lives inside `modules/snoozepulse-audio`** on both platforms:

| Platform | Runtime                                                 | Hardware delegate |
| -------- | ------------------------------------------------------- | ----------------- |
| Android  | `org.tensorflow:tensorflow-lite` + support library      | NNAPI (falls back to CPU) |
| iOS      | `TensorFlowLiteSwift` + `TensorFlowLiteCCoreML`         | Core ML (falls back to CPU) |

The model file is bundled as a native asset (see ADR-28 for the exact layout). No PCM, no
tensors, no feature vectors ever cross the React Native bridge. JS still sees only
`AudioLevelEvent`, `SnoreEvent`, and `AudioInterruptionEvent`, exactly as ADR-16 requires.

`react-native-fast-tflite` is explicitly rejected for this project. Revisiting it would
require a new ADR and a rewrite of `docs/native-audio.md`.

---

## ADR-23 — The loudness detector is deleted, not kept as a fallback

Ratified at the start of Milestone 6.

Task 6.3 deletes the M5 detection path from both `CaptureEngine.kt` and `CaptureEngine.swift`.
No dual code path is kept. There is no build flag that flips between "ML" and "loudness".

Kept from `AudioDsp`:

- `rms(samples, count)` — feeds the display dB on the waveform.
- `rmsToDb(rms)` — feeds the display dB on the waveform.
- `peak(samples, count)` — used only for the noise-floor bookkeeping in ADR-25.

Deleted from `CaptureEngine`:

- `SNORE_MARGIN_DB` constant.
- Any code path where `db >= ambientBaselineDb + SNORE_MARGIN_DB` produces a `snoreDetected`
  or affects `snoreActive`.
- The one-shot `ambientBaselineDb` field (replaced by the adaptive noise floor in ADR-25).

Rationale: keeping a fallback would double the surface area to test, invite silent
regressions when the model is unavailable, and preserve the exact behaviour we know is
wrong. The model asset is bundled with the app; if it fails to load, the app surfaces an
`AUDIO_ENGINE` error and refuses to start capture, rather than silently degrading to the
broken behaviour.

---

## ADR-24 — Event payloads gain `confidence`, `classLabel`, and `noiseFloorDb`

Ratified at the start of Milestone 6.

The wire types in `modules/snoozepulse-audio/src/SnoozePulseAudio.types.ts` and the domain
types in `src/types/` grow the following fields:

`AudioLevelEvent`

- `confidence: number` — classifier probability for the snore class union
  (`P(Snoring) + P(Snort)`), clamped to `[0, 1]`. Updated at the emit cadence.
- `noiseFloorDb: number` — rolling 60 s median of the display dB, as defined in ADR-25.

`SnoreEvent`

- `confidence: number` — the mean probability across the frames that made up the episode.
- `classLabel: 'snoring' | 'snort'` — the class with the higher summed probability across
  the episode.
- `spectralPeakHz: number | null` — dominant frequency of the log-mel patch at the loudest
  frame, or `null` when the pipeline could not determine one.

Unchanged: `sessionId`, `timestamp`, `decibel`, `rms`, `snoreDetected` on level events;
`id`, `sessionId`, `timestamp`, `durationMs`, `peakDb`, `audioPath` on snore events.
`audioPath` remains nullable per ADR-15.

Old sessions never observed these fields; the wipe migration in ADR-26 means no persisted
row will be missing them.

---

## ADR-25 — AGC-safe capture and adaptive noise floor

Ratified at the start of Milestone 6.

The M5 detector opened the microphone with `MediaRecorder.AudioSource.MIC` on Android, which
keeps automatic gain control (AGC) enabled on most OEMs. On iOS it used
`AVAudioSession.mode = .measurement`, which does disable AGC. This asymmetry alone made
peak-dB numbers non-comparable across the two platforms.

**Android capture source order:**

1. `MediaRecorder.AudioSource.UNPROCESSED` when the device advertises
   `PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED == "true"` (API ≥ 24).
2. `MediaRecorder.AudioSource.VOICE_RECOGNITION` otherwise.
3. `MediaRecorder.AudioSource.MIC` **is never chosen**.

The engine logs the source actually granted so we can spot OEMs that silently fall back.

**iOS capture:** `.measurement` mode is retained. No behaviour change on iOS.

**Adaptive noise floor:**

- The one-shot 3 s `calibrate()` call is retained on the native surface for backward
  compatibility with the existing store call chain but returns immediately with the current
  rolling noise-floor estimate. The Home-screen "calibrating…" affordance stays; it is
  cosmetic feedback while the first 60 s of the rolling window fills.
- During capture the engine maintains a rolling 60 s median of the display dB and exposes
  it as `AudioLevelEvent.noiseFloorDb` (ADR-24). No level threshold participates in
  detection any more; the classifier owns that decision.

---

## ADR-26 — V2 scoring and destructive migration

Ratified at the start of Milestone 6.

V1 scoring (`computeSleepScoreV1`, `computeSnoreScoreV1`) is retained as the source-of-truth
for any pre-V2 row that survives. V2 introduces two new pure functions in new files
alongside the V1 files (which become read-only):

- `src/services/analytics/sleepScoreV2.ts` → `computeSleepScoreV2`
- `src/services/analytics/snoreScoreV2.ts` → `computeSnoreScoreV2`
- `src/services/analytics/scoringConstantsV2.ts` → `SLEEP_SCORE_V2`, `SNORE_SCORE_V2`,
  `SNORE_SCORE_SCALE_V2`

V2 score inputs extend `ScoreInputs` (existing fields kept as-is) with:

- `avgConfidence: number` — mean classifier probability across all snore episodes in the
  session.
- `snoringShareByConfidence: number` — Σ (episode duration × episode confidence) / session
  duration.
- `spectralConsistency: number` — 1 minus the coefficient of variation of `spectralPeakHz`
  across the session's episodes; `0` when fewer than two episodes exist.
- `episodeRegularity: number` — a measure of how evenly episodes are spaced in the night,
  defined in `scoringConstantsV2.ts`.

**Schema migration:** the SQLite migration file adds a
`sleep_sessions.score_version INTEGER NOT NULL DEFAULT 2` column. **In the same migration,
every row of `sleep_sessions`, `snore_events`, and `session_buckets` is deleted, and all
snippet files under the documents directory are reclaimed.** Rationale:

- The app is pre-launch. Every existing session on a device was recorded by the shipped-M5
  detector and is either a false positive or has fictitious peak numbers.
- We cannot back-fill V2 scores because we do not have the original PCM.
- Preserving the rows would mean shipping a UI that renders two incompatible score
  histories side by side, which is worse than the wipe.

M5's ADR-10 ("scoring is deferred to V2") is now satisfied by this ADR. V1 scoring stays in
the codebase but is unreachable from the write path after Task 6.5.

---

## ADR-27 — Public evaluation corpus, no in-app data collection

Ratified at the start of Milestone 6.

M6 ships YAMNet as-is (ADR-21). The app collects no training data, no telemetry, and no
audio ever leaves the device. Retention rules from ADR-15 are unchanged.

The regression corpus is built exclusively from public, redistributable sources:

- Google AudioSet snoring clips (labels 38 and 39), sourced through the published label
  file; only clips whose underlying video licenses permit redistribution are used.
- Freesound.org clips under CC0 or CC-BY-4.0 for snoring, coughing, speech, fans, rain,
  music, and blanket / cloth rustle. CC-BY clips require attribution in `NOTICES.md`.
- Public-domain sleep-lab excerpts where the source explicitly grants redistribution.

The corpus lives under `modules/snoozepulse-audio/__fixtures__/audio/` alongside a
`LICENSES.md` file that names each clip's origin, license, and attribution requirement.

A future ADR (V3) may introduce opt-in user data collection with an explicit consent flow;
that is out of scope for M6.

---

## ADR-28 — Documentation restructure for M6

Ratified at the start of Milestone 6.

M5 shipped. The Phase 0–25 roadmap and the Task 1.1–5.6 implementation plan are moved,
verbatim, into `docs/archive/`. The active `docs/roadmap.md` and `docs/implementation-plan.md`
are rewritten around a single active milestone, **M6 — Acoustic Recognition**, spanning
Phases 26–31 and Tasks 6.1–6.6.

**Bundled model asset layout:**

```text
modules/snoozepulse-audio/
  android/src/main/assets/yamnet.tflite     # bundled AAR asset
  ios/Resources/yamnet.tflite               # copied into the framework bundle
  __fixtures__/
    audio/                                  # regression corpus (ADR-27) + reference_tone.wav
    waveform/                               # Int16 → Float32 window parity fixtures (Task 6.2)
    LICENSES.md
```

Documentation Priority (from `docs/roadmap.md`) is unchanged: `docs/decisions.md` still
wins over every other doc. This ADR is the tie-breaker for any lingering M1–M5 language
that contradicts M6.

---

## ADR-29 — Regression corpus and RC-2 gate deferred to post-M6 hardening

Ratified after Task 6.5 sign-off, before Task 6.7 starts.

Task 6.6 (originally: assemble a ≥ 150-clip public regression corpus and enforce a
precision / recall gate) is **deferred**, not cancelled. The gate is postponed to a
post-M6 hardening task that lands **after** Task 6.8 and **before either**:

- the app is distributed to any user outside the development team, **or**
- any change is made to the detection pipeline (model swap, threshold retune, class-label
  edit, front-end change).

Whichever trigger fires first re-opens the gate. Until then the corpus is not required
for M6 sign-off.

**Rationale**

- The YAMNet classifier already passes on-device smoke tests after Task 6.3–6.5
  (snore audio fires episodes, cough / speech / music / rain do not).
- ADR-21 fixes YAMNet as-is for M6. No detector tuning, threshold changes, or model swap
  is planned across Tasks 6.7 or 6.8, so the gate would not exercise anything that is
  currently in motion.
- Building a compliant corpus is ~a day of ops work (Freesound / AudioSet fetch, per-clip
  license verification, `LICENSES.md` and `NOTICES.md` authorship, ~40–60 MB of committed
  audio, harness). That effort is materially larger than any other M6 task and returns
  its full value only once we start iterating on the detector — which we are not.
- Building the corpus *after* dogfooding through Tasks 6.7 and 6.8 lets it codify the
  failure modes we actually observe on real bedrooms, rather than failure modes we
  imagined ahead of time.

**Scope of the deferral**

- Task 6.6's original section in `docs/implementation-plan.md` and Phase 31 in
  `docs/roadmap.md` remain as the definition of the eventual gate, tagged **deferred**.
  Nothing in them is deleted — a future agent picks it up under this ADR.
- The M6 exit condition drops the phrase "and the regression suite meets its
  precision / recall gates on the public corpus." That sentence is replaced with
  "and the classifier passes on-device smoke tests; a formal regression gate lands under
  ADR-29 before any release outside the development team."
- The `Classifier Regression (M6)` section of `docs/testing-strategy.md` stays as the
  target design and is banner-tagged deferred.

**What the trigger obliges**

When either trigger above fires, the reopened task must, at minimum:

- Meet ADR-27's corpus rules (public, redistributable, attributed).
- Meet the original Precision ≥ 0.85 / Recall ≥ 0.90 bars from Task 6.6.
- Include at least one failure clip per failure mode observed during Task 6.7 / 6.8
  dogfooding.

This ADR does not weaken ADR-27 or ADR-21. It sequences the work, not the standard.
