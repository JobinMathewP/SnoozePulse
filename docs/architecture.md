# Architecture Specification: SnoozePulse

> Ratified decisions live in `docs/decisions.md`. That document is the tie-breaker.

## 1. System Topology Overview

SnoozePulse follows a unidirectional data flow (UDF) architecture with a native audio
processing pipeline. From Milestone 6 onward the native layer runs an on-device TFLite
classifier (YAMNet); loudness thresholds no longer participate in detection (ADR-21,
ADR-23).

```text
+-----------------------------------------------------------------------------------+
|                                   NATIVE LAYER                                    |
|  Swift (iOS) / Kotlin (Android) — capture · log-mel front-end · TFLite (YAMNet)   |
|  Delegates: NNAPI (Android) · Core ML (iOS) · CPU fallback                        |
+-----------------------------------------------------------------------------------+
                 │
                 │ Throttled events (100–200 ms) — level + snore + interruption
                 │ Never PCM, tensors, or log-mel patches (ADR-16, ADR-22)
                 ▼
+-----------------------------------------------------------------------------------+
|                                    CORE JS                                        |
|     React Native · Zustand · Repository Layer · expo-sqlite · React Hooks         |
+-----------------------------------------------------------------------------------+
                 │
                 │ Immutable application state
                 ▼
+-----------------------------------------------------------------------------------+
|                                    UI LAYER                                       |
|      React Native Components · Reanimated · NativeWind · Theme Tokens             |
+-----------------------------------------------------------------------------------+
```

## 2. Architectural Rules

- UI never communicates directly with native modules.
- UI communicates through the store; the store reaches native through `IAudioEngine`.
- Stores never execute raw SQL.
- Database access goes through repositories (`ISleepRepository`, `ISnoreRepository`).
- Business logic belongs in services, not UI components and not repositories.
- Styling must use centralized theme tokens.

## 2.1 Layering (strict)

```text
UI → Store → Services → Repositories → SQLite / Native
```

The store **never** calls a repository directly. Every persistence or native operation is
mediated by a service. This is deliberately stricter than a store-to-repository shortcut so
that orchestration and business rules have exactly one home.

Responsibilities per layer:

| Layer        | Owns                                              | Must never                                     |
| ------------ | ------------------------------------------------- | ---------------------------------------------- |
| UI           | Rendering, user intent                            | SQL, native calls, business logic              |
| Store        | Application state, state machine transitions      | SQL, business rules, `new` on a concrete class |
| Services     | Business logic, orchestration, scoring, retention | SQL                                            |
| Repositories | SQL, mapping rows to domain models                | Business rules                                 |

`services/` and `repositories/` are separate directories and separate concerns:

```text
services/                    repositories/
  AudioService                 SleepRepository
  SleepService                 SnoreRepository
  AnalyticsService
```

## 2.2 Dependency Injection

Concrete implementations are never constructed inside a store, hook, or component.

```text
IAudioEngine  ←  AudioEngine   (constructed once at the composition root)
                     ↓ injected
                   Store
```

A single composition root wires the object graph at app start and injects interfaces
downward. `new AudioEngine()` inside a store or component is forbidden.

This keeps every layer testable in isolation with a fake engine and a fake database, and it
is the mechanism that enforces the "prefer interfaces over concrete implementations" rule
in `.cursor/rules/01-guardrails.mdc`.

## 3. Recording State Machine

`IDLE → STARTING → RECORDING → PAUSED → STOPPING → COMPLETED`

Any unrecoverable failure transitions to `ERROR`.

Transitions are guarded: an illegal transition is rejected by the store rather than
silently applied.

`PAUSED` is **system-only**. It is entered and left by the audio engine in response to
interruptions such as an incoming call or another app seizing the audio session. There is
no user-facing pause control on any screen and none is to be added.

## 3.1 Live Audio Render Path

The audio level stream arrives at roughly 5–10 Hz. Over an eight-hour session that is on
the order of 288,000 events, so the stream must not drive React reconciliation.

```text
AudioLevelEvent ──┬── Reanimated shared value ──→ Waveform   (per event, no React render)
                  └── Store (throttled)        ──→ everything else
```

The store still exposes `currentDecibel` for non-animated consumers, but it is updated at a
throttled, human-perceptible rate. The waveform reads the shared value directly.

## 3.2 Navigation

Navigation is implemented using **Expo Router**, which satisfies the React Navigation
requirement because Expo Router is built on React Navigation.

Routes live in `src/app/`. Web is not a supported target.

## 3.3 Native Module Location

The Swift and Kotlin audio engine is an Expo local module at the repository root:

```text
modules/snoozepulse-audio/
```

`src/native/` contains only the JavaScript-side interface and wrapper. See
`docs/native-audio.md`.

## UI Implementation Rules

The UI layer must be implemented using the design references.

Implementation priority:

1. Individual screen images
2. Full mockup
3. Theme tokens

Do not redesign layouts.

Only make changes required for:

- responsive layouts
- accessibility
- platform conventions
- the two ratified deviations below

Ratified deviations from the reference images:

- The product name renders as **SnoozePulse**, not "SnoreCare" (ADR-08).
- The **Insights** and **Profile** tabs shown in the images are not part of the product and
  are not built (ADR-09).

No other deviation is permitted without a new ADR.

Primary References

- docs/home-screen.jpg
- docs/active-session.jpg
- docs/summary-screen.jpg
- docs/history-screen.jpg

Secondary Reference

- docs/mockup.jpg

## 4. V2 Detection Pipeline

Ratified in ADR-21 through ADR-25. This section is the tie-breaker for anything the
older reference images or PRD wording implies about the detector.

```text
Microphone
   │  Android: MediaRecorder.AudioSource.UNPROCESSED → VOICE_RECOGNITION (ADR-25)
   │  iOS:     AVAudioSession .measurement (AGC disabled)
   ▼
16 kHz mono Int16 ring buffer  (unchanged from M5)
   │
   ▼
Sliding 0.975 s window @ 50% overlap  (15,600 samples, matches YAMNet)
   │
   ▼
Log-mel front-end on native thread
   • 25 ms window, 10 ms hop
   • 64 mel bins, 125 Hz – 7500 Hz
   • log(x + 1e-3)
   • output: 96 × 64 float32 patch, allocation-free after warmup
   │
   ▼
TFLite runtime  (bundled yamnet.tflite)
   ├── Android: NNAPI delegate  (org.tensorflow:tensorflow-lite)
   └── iOS:     Core ML delegate (TensorFlowLiteSwift + TensorFlowLiteCCoreML)
   │
   ▼
P(Snoring) + P(Snort)   → confidence ∈ [0, 1]
   │
   ▼
Rolling 60 s noise-floor median (display-only dB)
   │
   ▼
Episode builder with hysteresis
   • enter ≥ 0.55, exit < 0.35
   • min episode 300 ms, hang 700 ms
   │
   ▼
SnoreEvent   { confidence, classLabel, spectralPeakHz, … }
AudioLevelEvent { confidence, noiseFloorDb, decibel (display-only), … }
```

Rules in force:

- No PCM, tensors, or log-mel patches cross the bridge (ADR-16, ADR-22).
- `AudioDsp.rmsToDb` produces only the display dB and the input to the noise-floor
  median. It does not participate in detection (ADR-23).
- The TFLite runtime lives inside `modules/snoozepulse-audio`. `react-native-fast-tflite`
  is explicitly rejected (ADR-22).
- Model asset location is fixed by ADR-28:
  - Android: `modules/snoozepulse-audio/android/src/main/assets/yamnet.tflite`
  - iOS: `modules/snoozepulse-audio/ios/Resources/yamnet.tflite`

The V2 pipeline changes nothing above the native layer. `IAudioEngine`, `AudioLevelEvent`,
and `SnoreEvent` remain the only crossing points; the events grow new fields (ADR-24) but
their shapes stay assignable to any existing consumer.

## Cross-Platform Architecture

SnoozePulse is a cross-platform React Native application.

Shared application layers (UI, state management, repositories, analytics, SQLite access) are platform-independent.

Only the native audio engine is platform-specific and consists of:

- Android implementation (Kotlin) — capture, log-mel, TFLite + NNAPI delegate
- iOS implementation (Swift) — capture, log-mel, TFLite + Core ML delegate

Both implementations expose the same TypeScript interface (`IAudioEngine`) and emit
identically-shaped events.
