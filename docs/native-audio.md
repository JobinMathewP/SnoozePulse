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

## Rules

- Never send raw PCM to JavaScript.
- Perform RMS, peak detection and filtering natively.
- JS subscribes only.
- SQLite writes occur asynchronously.
- Use foreground service on Android.
- Use Background Audio mode on iOS.

## Native Responsibilities

- Permission handling
- Audio session lifecycle
- DSP
- Snore threshold detection
- Audio snippet creation
- Event emission

## JavaScript Responsibilities

- Subscribe to events
- Update Zustand
- Render UI
- Persist metadata through repositories
