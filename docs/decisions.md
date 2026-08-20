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

---

## ADR-30 — Public App Store release scope

Ratified when preparing the first public App Store / Play Store submission.

The app was built for a development team and is missing the shell a store reviewer and a
first-time user expect. This ADR defines the minimal, honest scope that closes those gaps
without adding a backend, an account, or any medical claim. It supersedes any earlier doc
that implies a session-overwrite model or a stubbed Settings screen.

**Persistence**

- A new key-value `app_settings` table lands as migration **V3**. Unlike V2 (ADR-26), V3 is
  **additive and non-destructive** — a user's recorded nights survive the public-release
  upgrade. V3 stores the optional display name, the onboarding flag, and rating-prompt
  bookkeeping only.
- Every session is already an immutable row keyed by id; nothing overwrites the previous
  night. The gap was navigational, not structural, so the fix is a calendar view over
  `listSessionsInRange`, not a schema change to sessions.

**Onboarding + greeting**

- A four-slide illustrated first-run flow (welcome, on-device AI, privacy, optional name)
  gates the tabs via a `Redirect`. The medical disclaimer stays as a caption on the privacy
  slide (Guideline 1.4.1), not a fifth screen. The onboarding flag is read at boot and
  seeded synchronously so the gate never flashes the tabs first.
- The greeting name is **optional and skippable**. When blank, the greeting falls back to a
  neutral "Good evening". No gender, age, or account is ever collected.

**Sessions**

- **All same-day sessions are preserved and browsable.** The calendar marks any day with
  recordings and, when a day holds more than one session, lists each so none is hidden.
- **Minimum session length is 5 minutes** (`MIN_SESSION_DURATION_MS`). Ending earlier warns
  the user and, on confirmation, **discards** the session entirely (row + snippets) rather
  than saving a night with no useful signal. Wall-clock based, so paused gaps still count.

**Settings + compliance**

- A real Settings screen carries: the greeting name, on-device retention info (ADR-15),
  **Delete all sleep data** (destructive, confirmed), the medical disclaimer, external
  Privacy / Terms / Support links (the GitHub Pages site under `website/`), and the app
  version. Chrome is illustrated (moon header, privacy/wellness art, grouped cards) matching
  `assets/new_images/settings-screen.png`; the compliance rows and store paths are unchanged.
- No dead affordances (App Store Guideline 2.1): the History "insights" card is now static,
  honest, general-guidance copy and is non-tappable; the Summary timeline info icon opens a
  real explanatory dialog.
- Medical positioning (Guideline 1.4.1): SnoozePulse is a **wellness tool**, never a
  diagnostic device. Copy avoids apnea/diagnosis/treatment claims throughout.
- iOS config: `supportsTablet: false` (iPhone-only) and a Privacy Manifest declaring the
  required-reason APIs the Expo runtime touches (file timestamp `C617.1`, system boot time
  `35F9.1`, disk space `E174.1`, user defaults `CA92.1`).

**Ratings**

- `expo-store-review` surfaces Apple's / Google's native in-app review sheet **once**, after
  the **3rd saved session** (`REVIEW_PROMPT_AFTER_SESSIONS`). A once-only flag persists so it
  never re-asks. There is no Settings "Rate" row. The app never shows its own like/dislike
  gate — the OS throttles and owns the outcome.

This ADR adds one new dependency (`expo-store-review`) and one new colour token (`scrim`,
for modal veils — the only value not sampled from a reference image, since no modal mock
exists). Layering is unchanged: UI → Store → Services → Repositories, with `ProfileService`
and `ReviewService` injected at the composition root (ADR-12, ADR-18).

---

## ADR-31 — Product v2 is Automatic Sleep Tracking

Ratified when product v1 (App Store / Play Store 1.0.0) shipped and v2 planning started.

**Version names**

- **Product v1** = the released store app. Manual "Start Sleep Session", YAMNet in the
  native module, confidence-weighted scores, onboarding, Settings, no backend.
- **Product v2** = Automatic Sleep Tracking, specified in `docs/prd.md` and
  `docs/prd-automatic-sleep-tracking.md`.
- ADR-21 "V2 detector" and ADR-26 "V2 scoring" are **algorithm version labels**. They
  already shipped inside product v1. Do not rename those ADRs and do not treat "V2
  scoring" as the App Store version.

**Product principle**

> Set your sleep schedule once. SnoozePulse takes care of the rest.

The user should not have to remember to open the app and press Start every night. Manual
start **remains** as an override for naps, travel, and nights when automatic tracking
does not fire.

**Scope that is in**

- User-configured bedtime and wake time, persisted locally in `app_settings` (additive
  SQLite migration **V4**, non-destructive — recorded nights survive).
- Explicit opt-in for automatic tracking. Never silently enable overnight microphone use.
- A **Sleep Readiness** state machine that may start and stop the existing recording
  session. It does not merge into the recording machine
  (`IDLE → STARTING → RECORDING → PAUSED → STOPPING → COMPLETED`).
- Readiness stays open from 30 minutes before expected bedtime until **2 hours before
  the wake window starts**, so a late night can still auto-start. Example: 11:00 PM
  bedtime / 7:00 AM wake → wake window 6:30–7:30, latest auto-start ~4:30 AM. A 2:00 AM
  settle may start; ~5:00 AM must not.
- Supporting on-device signals: schedule, motion, phone interaction, charging,
  environmental audio. Stationary phone **alone** cannot start monitoring.
- Automatic start calls the existing `IAudioService.startSession()` path. No second
  capture pipeline.
- Automatic completion around the wake window, then a **local** morning notification
  that deep-links to Summary.
- Honest failed/incomplete sessions. No fabricated analytics.
- In-progress sessions at or below 20% while unplugged are stopped and **saved**
  (ADR-34). Auto-start does not begin in that condition (missed night).
- A gentle charger reminder when automatic tracking is on and the device is not
  charging. Not a hard requirement.

**Scope that is out of the first v2 ship**

- Acoustic echo cancellation.
- Wearables.
- A learned sleep-readiness model.
- Inferring actual wake from sensors as a hard stop (default end is the wake window;
  extending for recent snores is a later improvement, not this ship).
- Detecting that the phone was left in another room from "sleep breathing." YAMNet
  hears snore/snort, not quiet respiration; a quiet empty room and a quiet non-snorer
  are indistinguishable.
- Weekday vs weekend schedules, travel/timezone intelligence beyond device local time.
- Changing YAMNet thresholds because music is playing. Playback-dominant audio is a
  **quality flag**, not a sensitivity knob (see the feature PRD §8). Touching the
  native detector reopens ADR-29.

**Language**

Internally and in user-facing copy, the system reports **sleep readiness**, never "the
user is in bed" or "the user is asleep". Phone sensors cannot prove location or sleep
state. Wellness positioning from ADR-30 is unchanged.

**Onboarding**

ADR-30's four-slide first-run flow stays. Sleep schedule and the automatic-tracking
opt-in may be collected as an additional onboarding step **or** only in Settings for
the first M7 tasks. Either way the user can change them later. Do not silently
default automatic tracking on.

**Layering**

Unchanged: UI → Store → Services → Repositories → SQLite / Native. New work lands as
`ISleepScheduleService` / `IReadinessService` (names may be adjusted at implementation)
injected at the composition root. The store does not call repositories. Android remains
the primary development and validation platform (ADR-17).

---

## ADR-32 — Background execution for Sleep Readiness

Ratified with ADR-31. This is the hard constraint on automatic tracking.

The feature is useless if it only works while the app is open. It is also illegal
(product-wise) if it starts the microphone all evening "just in case".

**What the OS will and will not do**

- **Android** can wake the app at the start of the readiness window (exact alarm /
  foreground service) and then evaluate cheap signals. The existing microphone
  foreground service is what runs **after** `START SESSION`, not before.
- **iOS** will not reliably run arbitrary code at bedtime if the process is killed.
  Product v2 implements the same TypeScript interfaces on iOS; killed-state
  auto-start is **best-effort** until validated on macOS. A user who leaves the app
  backgrounded, or who opens it during the evening, must still get automatic start
  once settled. Do not invent a backend or silent push to paper over this.

**Readiness vs monitoring**

```text
SCHEDULED          no extra process required
READINESS_WINDOW   cheap signals only (time, charging, screen interactive, motion)
SETTLING           same cheap signals, sustained
MONITORING         existing native audio engine / FGS / background audio
WAKE_WINDOW        existing engine still running until STOP SESSION
COMPLETED          local notification, process may sleep
```

Do not open a second microphone pipeline during `READINESS_WINDOW`. If environmental
audio is used as a supporting signal, it must go through the existing native module as
a short, explicit sample — not overnight capture. Privacy copy must say the microphone
is used during the **scheduled sleep window**, not only after snores are detected.

**Signals are supporting, combined, and tunable**

Exact thresholds stay in one named constants block (same pattern as scoring constants)
and are tuned from real nights. A combination is required to start when the samples
exist. **Missing** motion or a pre-start environment sample must not block auto-start;
the remaining signals (window, not interacting, settle duration) still apply. A
**known** moving phone or known-noisy room still delays start. Motion measures the
phone, not the person.

**Charging** is advisory for auto-start. An in-progress session at or below 20% while
unplugged is stopped and **saved** (ADR-34) — it is not discarded and it is not a failed
night with invented scores. Auto-start must not begin when the pack is already at or
below that threshold and unplugged; that skip is an honest missed night. Missing
microphone permission / OS interruption still mark the night failed or incomplete
rather than writing a fake Summary.

**New dependencies** (notifications, background tasks, motion) are installed only at
the milestone task that needs them, and only after approval. `expo-battery` is already
present.

---

## ADR-33 — Documentation restructure for product v2

Ratified with ADR-31.

Product v1 shipped. The M6 roadmap, M6 implementation plan, and the v1 PRD are moved
into `docs/archive/`:

| Archived file | Was |
| ------------- | --- |
| `docs/archive/prd-v1.md` | `docs/SnoreTracker_App_PRD_Specification.md` |
| `docs/archive/roadmap-m6.md` | `docs/roadmap.md` |
| `docs/archive/implementation-plan-m6.md` | `docs/implementation-plan.md` |

M1–M5 archives remain. Their banners now point at M7, not M6.

Active documents:

- `docs/prd.md` — product v2
- `docs/prd-automatic-sleep-tracking.md` — feature spec
- `docs/roadmap.md` — M7 phases
- `docs/implementation-plan.md` — M7 tasks
- `docs/README.md` — map and documentation priority

Living architecture docs (`architecture.md`, `api-contracts.md`, `native-audio.md`,
`design-spec.md`, and the rest) stay at the top level and are updated in place. They
describe the shipped engine plus the v2 readiness layer.

ADR-29's corpus trigger fired when v1 left the development team. The corpus remains a
hardening backlog item in the M6 archive. Product v2 does not block on it unless the
detection pipeline changes.

`docs/decisions.md` still wins over every other document.

---

## ADR-34 — Low battery stops an in-progress session and saves it

Ratified with the late-start readiness window. Product rule:

> If the pack is getting genuinely low (about 20%, and 15% is already too late),
> stop the session and **save** whatever we have.

**Threshold**

`BATTERY_SAVE_THRESHOLD = 0.2` (same fraction Home uses for the battery-low card).
Charging or full packs are never stopped — the phone can recover. Unknown levels
(`< 0`) are ignored.

**Save, do not discard**

`stopSession()` already finalizes scores and persists `COMPLETED`. That is the path.
Do not call `discardSession()`. Do not transition to `ERROR` solely because of charge.
ADR-30's five-minute discard dialog is UI-only on slide-to-end; a battery stop bypasses
it and saves even a short night rather than risking an OS kill with nothing on disk.

**Where it runs**

A battery port (`IBatteryMonitor`) is bound at the composition root, alongside audio
subscriptions, so the guard still fires with the screen locked and will still fire if
auto-start later records without Active Session focused. Active Session navigates to
Summary when that save completes.

**Auto-start**

If the pack is already at or below 20% and unplugged when the scheduler would start,
do not start (honest missed night). That check lands with Task 7.5. Manual Start
remains possible; Home already warns. If they start anyway at 18%, this guard saves
immediately.

This ADR supersedes the ADR-32 sentence that treated low battery as a failed /
incomplete night for an **already running** session.

