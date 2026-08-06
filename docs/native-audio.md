# Native Audio Architecture

## Objective

Perform all audio capture and DSP on native threads.

```text
Microphone
      │
      ▼
AVAudioEngine (iOS)
AudioRecord (Android)
      │
      ▼
RMS + Peak + Threshold Detection
      │
      ▼
Save 5-second snippets
      │
      ▼
Emit throttled events (100–200ms)
      │
      ▼
React Native Bridge
      │
      ▼
useAudioMonitor()
```

## Module Location

The native engine is an Expo local module at the repository root:

```text
modules/
  snoozepulse-audio/
    expo-module.config.json
    ios/       # Swift — AVAudioEngine
    android/   # Kotlin — AudioRecord
    src/       # TypeScript binding
```

`src/native/` holds only `IAudioEngine` and the JS-side wrapper that adapts the module's
events into domain events. Nothing else in the app imports the module directly.

## Relationship to expo-audio

`expo-av` no longer exists in Expo SDK 57; `expo-audio` replaces it. The two are used
together, with a clear split:

| Concern                                   | Owner                |
| ----------------------------------------- | -------------------- |
| Capture, DSP, snore detection, snippets    | `snoozepulse-audio`  |
| Android foreground service + permissions   | `expo-audio` plugin  |
| iOS `UIBackgroundModes: audio`             | `expo-audio` plugin  |
| Snippet playback on the Summary screen     | `expo-audio` player  |

`expo-audio` provides metering and recording but cannot do continuous threshold analysis
with automatic extraction of snippets around detected episodes, which is why the custom
module exists.

Only one component may hold the audio session at a time. `IAudioEngine` owns session
arbitration; playback must not start while capture is active.

## Rules

- Never send raw PCM to JavaScript.
- Perform RMS, peak detection and filtering natively.
- JS subscribes only.
- SQLite writes occur asynchronously and in batches, never once per event.
- Use foreground service on Android.
- Use Background Audio mode on iOS.

## Platform Configuration

Android, via the `expo-audio` config plugin:

- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `POST_NOTIFICATIONS`
- A declared microphone foreground service.
- On Android 14+ the service must be started while the app is still foregrounded. The
  `STARTING` state therefore cannot complete after backgrounding.

iOS:

- `UIBackgroundModes: ["audio"]`
- Background capture is enabled at runtime through `setAudioModeAsync`.

## Snippet Storage

Snippets are written to the **document** directory, never the cache directory. The OS may
delete cache files under storage pressure, which would silently destroy recorded evidence.

Retention is 30 days or 500 MB, whichever limit is reached first, enforced automatically by
`ISleepService` (ADR-15). Deleting a session deletes its snippets. Orphaned files left by a
crash are reclaimed on the next app start.

## Native Responsibilities

- Permission handling
- Audio session lifecycle
- DSP
- Snore threshold detection
- Audio snippet creation
- Event emission

- Ambient noise calibration
- Audio session arbitration
- System-triggered pause and resume on interruption (ADR-14)

## JavaScript Responsibilities

- Subscribe to events
- Update Zustand
- Render UI
- Persist metadata through services, which delegate to repositories
