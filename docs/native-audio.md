# Native Audio Architecture

## Objective

Perform all audio capture, DSP, feature extraction, and ML inference on native threads.
JavaScript subscribes to throttled events only. No PCM, tensors, or log-mel patches ever
cross the bridge (ADR-16, ADR-22).

```text
Microphone
      │
      ▼
AVAudioEngine (iOS, .measurement)         AudioRecord (Android)
                                          source: UNPROCESSED → VOICE_RECOGNITION
      │
      ▼
16 kHz mono Int16 ring buffer  (5 s capacity)
      │
      ▼
Sliding 0.975 s window (15,600 samples, 50% overlap)
      │
      ▼
Log-mel spectrogram — native thread, allocation-free
      • 25 ms window, 10 ms hop, 64 mel bins (125–7500 Hz), log(x + 1e-3)
      • output: 96 × 64 float32
      │
      ▼
TFLite runtime  (bundled yamnet.tflite)
      ├── Android delegate: NNAPI  (falls back to CPU)
      └── iOS    delegate: Core ML (falls back to CPU)
      │
      ▼
P(Snoring) + P(Snort)  → confidence ∈ [0, 1]
      │
      ▼
Rolling 60 s noise-floor median (display-only dB)
      │
      ▼
Episode builder — hysteresis (enter ≥ 0.55, exit < 0.35, min 300 ms, hang 700 ms)
      │
      ▼
Save 5-second WAV snippet on episode close
      │
      ▼
Emit throttled events (100–200 ms):
  onAudioLevel  { …, confidence, noiseFloorDb }
  onSnore       { …, confidence, classLabel, spectralPeakHz }
  onInterruption { … }
      │
      ▼
React Native Bridge
      │
      ▼
useAudioMonitor() / AudioService
```

## Module Location

The native engine is an Expo local module at the repository root:

```text
modules/
  snoozepulse-audio/
    expo-module.config.json
    ios/       # Swift — AVAudioEngine, MelSpectrogram, YamnetClassifier, CaptureEngine
    android/   # Kotlin — AudioRecord, MelSpectrogram, YamnetClassifier, CaptureEngine
    src/       # TypeScript binding (types + events only, no logic)
    __fixtures__/   # regression corpus + log-mel parity fixtures (Task 6.2, 6.6)
```

`src/native/` holds only `IAudioEngine` and the JS-side wrapper that adapts the module's
events into domain events. Nothing else in the app imports the module directly.

## Model Asset Layout

The bundled classifier is `yamnet.tflite` from the pretrained YAMNet release (521 AudioSet
classes). Only outputs `Snoring` (index 38) and `Snort` (index 39) are consumed by the
episode builder.

```text
modules/snoozepulse-audio/
  android/src/main/assets/yamnet.tflite        # bundled AAR asset (Task 6.1)
  ios/Resources/yamnet.tflite                  # copied into the framework bundle (Task 6.1)
  __fixtures__/
    audio/                                     # regression corpus (Task 6.6, ADR-27)
    mel/                                       # log-mel parity fixtures (Task 6.2)
    LICENSES.md                                # per-clip license + attribution
```

Size sanity: the file is roughly 3.5–4.5 MB. Anything outside that range should fail the
Task 6.1 acceptance check.

## Relationship to expo-audio

`expo-av` no longer exists in Expo SDK 57; `expo-audio` replaces it. The two are used
together, with a clear split:

| Concern                                    | Owner                |
| ------------------------------------------ | -------------------- |
| Capture, DSP, feature extraction           | `snoozepulse-audio`  |
| TFLite runtime + delegate management       | `snoozepulse-audio`  |
| Episode building + snippet writing         | `snoozepulse-audio`  |
| Android foreground service + permissions   | `expo-audio` plugin  |
| iOS `UIBackgroundModes: audio`             | `expo-audio` plugin  |
| Snippet playback on the Summary screen     | `expo-audio` player  |

`expo-audio` provides metering and recording but cannot run a TFLite classifier or extract
snippets around detected episodes, which is why the custom module exists.

Only one component may hold the audio session at a time. `IAudioEngine` owns session
arbitration; playback must not start while capture is active.

## Rules

- **Never send raw PCM to JavaScript.**
- **Never send tensors or log-mel patches to JavaScript.**
- Perform capture, log-mel feature extraction, and TFLite inference natively.
- **Both platforms store snippets as 16 kHz, 16-bit mono PCM WAV.** Android opens
  `AudioRecord` at 16 kHz. iOS must resample the hardware input rate (often 48 kHz) down
  to 16 kHz before the ring buffer and `SnippetWriter` — otherwise the WAV header says
  16 kHz while the samples are still 48 kHz.
- JS subscribes only.
- SQLite writes occur asynchronously and in batches, never once per event.
- Use foreground service on Android.
- Use Background Audio mode on iOS.
- No loudness-threshold branch. `AudioDsp.rmsToDb` produces only the display dB and the
  rolling noise floor (ADR-23).
- No JS-side TFLite. `react-native-fast-tflite` is explicitly rejected (ADR-22).

## Platform Configuration

Android, via the `expo-audio` config plugin:

- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `POST_NOTIFICATIONS`
- A declared microphone foreground service.
- On Android 14+ the service must be started while the app is still foregrounded. The
  `STARTING` state therefore cannot complete after backgrounding.

Android TFLite dependencies (Task 6.1):

```gradle
implementation "org.tensorflow:tensorflow-lite:2.16.1"
implementation "org.tensorflow:tensorflow-lite-support:0.4.4"
```

iOS:

- `UIBackgroundModes: ["audio"]`
- Background capture is enabled at runtime through `setAudioModeAsync`.

iOS TFLite dependencies (Task 6.1):

```ruby
s.dependency 'TensorFlowLiteSwift', '~> 2.14'
s.dependency 'TensorFlowLiteCCoreML', '~> 2.14'
```

## Capture Source

- **iOS:** `AVAudioSession.mode = .measurement` (AGC disabled).
- **Android:** `MediaRecorder.AudioSource.UNPROCESSED` first when the OS advertises
  `SUPPORT_AUDIO_SOURCE_UNPROCESSED == "true"`; otherwise `VOICE_RECOGNITION`. `MIC` is
  never chosen (ADR-25).

The engine logs the granted source on every session start so we can detect OEM silent
fallbacks.

## Adaptive Noise Floor

- No one-shot 3 s calibration. `IAudioEngine.calibrate()` returns the current noise-floor
  estimate immediately and does not block (ADR-25).
- The engine maintains a rolling 60 s median of the display dB and publishes it as
  `AudioLevelEvent.noiseFloorDb`.
- The Home-screen calibration affordance stays as cosmetic feedback while the first 60 s
  of the rolling window fills.

## Snippet Storage

Snippets are written to the **document** directory, never the cache directory. The OS may
delete cache files under storage pressure, which would silently destroy recorded evidence.

Retention is 30 days or 500 MB, whichever limit is reached first, enforced automatically
by `ISleepService` (ADR-15). Deleting a session deletes its snippets. Orphaned files left
by a crash are reclaimed on the next app start.

## Native Responsibilities

- Permission handling
- Audio session lifecycle
- Log-mel feature extraction
- TFLite inference with hardware delegate management
- Episode building via confidence hysteresis
- Audio snippet creation
- Event emission
- Rolling noise-floor estimation
- Audio session arbitration
- System-triggered pause and resume on interruption (ADR-14)

## JavaScript Responsibilities

- Subscribe to events
- Update Zustand
- Render UI
- Persist metadata through services, which delegate to repositories
- Compute V2 scores from persisted event data (ADR-26)
