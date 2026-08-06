# API Contracts

## Purpose
Defines the interfaces and event payloads shared across the application.

All consumers depend on the interface, never on the implementation. Implementations are
constructed once at the composition root and injected downward (ADR-18).

---

# IAudioEngine

Responsibilities:
- Start recording
- Stop recording
- Pause / Resume (**system-triggered only** — no user-facing control, ADR-14)
- Ambient noise calibration
- Subscribe to native events
- Permission status

## Events

### AudioLevelEvent

Emitted continuously at a native-throttled 100–200 ms interval.

```ts
interface AudioLevelEvent {
  sessionId: string;
  timestamp: number;
  decibel: number;
  rms: number;
  snoreDetected: boolean;
}
```

`sessionId` is required so that a late event arriving after a session ends can be discarded
rather than misattributed.

This event drives a Reanimated shared value directly and reaches the store only in throttled
form (ADR-13).

### SnoreEvent

Emitted once per completed snore episode.

```ts
interface SnoreEvent {
  id: string;
  sessionId: string;
  timestamp: number;
  durationMs: number;
  peakDb: number;
  audioPath: string | null;
}
```

`audioPath` is nullable: detection must still report the episode when snippet writing fails
because storage is full or the retention cap was hit.

---

# Repository Interfaces

Repositories contain SQL and row-to-model mapping. They contain no business rules.

## ISleepRepository

- createSession()
- finishSession()
- getSession(id)
- listSessions() — paginated
- deleteSession() — cascades to snore events, buckets, and snippet files
- saveBuckets() / getBuckets(sessionId) — see `session_buckets` (ADR-11)

## ISnoreRepository

- saveSnoreEvent()
- saveSnoreEvents() — batched, single transaction
- getEvents(sessionId)
- deleteEvents(sessionId)

Exact parameter and return types are defined in Phase 3 (`src/types/`) and finalised in
Phase 4.

---

# Service Interfaces

Services contain business logic and orchestration. They contain no SQL.

## IAudioService
Owns the recording lifecycle and the state machine. Mediates between the store and
`IAudioEngine`. Batches snore events before handing them to the repository.

## ISleepService
Session creation and completion, readiness checks, and snippet retention enforcement
(30 days / 500 MB, ADR-15).

## IAnalyticsService
Sleep score, snore score, timeline bucket aggregation, and weekly/monthly comparisons.

Scoring is a documented V1 heuristic using simple weighted metrics and is scheduled for
replacement in V2 (ADR-10). Each score is a single pure function with its weighting
constants in one named block. The agent must not invent medical or clinical scoring.

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
- pauseSession() — invoked by the audio engine on interruption, never by a control
- resumeSession() — invoked by the audio engine, never by a control
- updateAudioLevel()
- addSnoreEvent()

`currentDecibel` is updated at a throttled rate for non-animated consumers. The waveform does
not read it (ADR-13).

## Layering

```text
UI → Store → Services → Repositories → SQLite / Native
```

UI communicates only with the store. The store communicates only with services. The store
**never** calls a repository directly (ADR-12).

Services are injected into the store at the composition root; the store never constructs
them (ADR-18).
