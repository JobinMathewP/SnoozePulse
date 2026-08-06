# API Contracts

## Purpose
Defines the interfaces and event payloads shared across the application.

---

# IAudioEngine

Responsibilities:
- Start recording
- Stop recording
- Pause / Resume
- Subscribe to native events
- Permission status

## Events

### AudioLevelEvent

```ts
interface AudioLevelEvent {
  timestamp: number;
  decibel: number;
  rms: number;
  snoreDetected: boolean;
}
```

### SnoreEvent

```ts
interface SnoreEvent {
  id: string;
  sessionId: string;
  timestamp: number;
  durationMs: number;
  peakDb: number;
  audioPath: string;
}
```

---

# Repository Interfaces

## ISleepRepository

- createSession()
- finishSession()
- getSession(id)
- listSessions()
- deleteSession()

## ISnoreRepository

- saveSnoreEvent()
- getEvents(sessionId)
- deleteEvents(sessionId)

---

# Zustand Store

State:
- sessionState
- currentDecibel
- isRecording
- activeSession
- lastSnoreEvent

Actions:
- startSession()
- stopSession()
- pauseSession()
- resumeSession()
- updateAudioLevel()
- addSnoreEvent()

UI must communicate only with the Store.
The Store communicates with repositories and services.
