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
  decibel: number;          // display-only; produced by AudioDsp.rmsToDb (ADR-23)
  rms: number;              // display-only; not used for detection
  noiseFloorDb: number;     // rolling 60 s median of display dB (ADR-25)
  confidence: number;       // P(Snoring) + P(Snort), clamped [0, 1] (ADR-21)
  snoreDetected: boolean;   // driven by classifier hysteresis (ADR-24)
}
```

`sessionId` is required so that a late event arriving after a session ends can be discarded
rather than misattributed.

`snoreDetected` reflects the classifier's current hysteretic state (enter ≥ 0.55,
exit < 0.35). It does **not** compare `decibel` or `rms` against any threshold (ADR-23).

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
  peakDb: number;                        // display-only; no longer feeds detection
  confidence: number;                    // mean classifier probability across the episode
  classLabel: 'snoring' | 'snort';       // class with the higher summed probability
  spectralPeakHz: number | null;         // dominant frequency at the loudest frame
  audioPath: string | null;
}
```

`audioPath` is nullable: detection must still report the episode when snippet writing fails
because storage is full or the retention cap was hit.

`peakDb` is retained for legacy Summary metric cards but does not affect scoring after M6
(ADR-26); V2 scores weight episodes by `confidence` and duration, not peak dB.

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

From Milestone 6 onward, scoring is V2 (ADR-26). Each score is a single pure function
with its weighting constants in one named block. The V1 pure functions
(`computeSleepScoreV1`, `computeSnoreScoreV1`) remain in the codebase for archival reads
only; the write path calls V2 exclusively.

V2 score inputs (`ScoreInputs`) grow the following fields:

```ts
interface ScoreInputs {
  // Pre-existing fields, unchanged.
  sessionDurationMs: number;
  snoreCount: number;
  totalSnoringMs: number;
  peakDb: number;

  // Added in M6 (ADR-26).
  avgConfidence: number;               // mean classifier probability across episodes
  snoringShareByConfidence: number;    // Σ(duration × confidence) / sessionDurationMs
  spectralConsistency: number;         // 1 − CV(spectralPeakHz); 0 when < 2 episodes
  episodeRegularity: number;           // 0–1, evenness of episode spacing
}
```

The agent must not invent medical or clinical scoring.

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
