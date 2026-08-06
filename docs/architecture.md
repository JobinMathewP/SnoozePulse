# Architecture Specification: SnoozePulse

## 1. System Topology Overview

SnoozePulse follows a unidirectional data flow (UDF) architecture with a native audio processing pipeline.

```text
+-----------------------------------------------------------------------------------+
|                                   NATIVE LAYER                                    |
|      Swift (iOS) / Kotlin (Android) performs microphone capture and DSP           |
+-----------------------------------------------------------------------------------+
                 │
                 │ Throttled events (100–200 ms)
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
- UI communicates through `IAudioEngine`.
- Stores never execute raw SQL.
- Database access goes through repositories (`ISleepRepository`, `ISnoreRepository`).
- Business logic belongs in services, not UI components.
- Styling must use centralized theme tokens.

## 3. Recording State Machine

`IDLE → STARTING → RECORDING → PAUSED → STOPPING → COMPLETED`

Any unrecoverable failure transitions to `ERROR`.

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

Primary References

- docs/home-screen.jpg
- docs/active-session.jpg
- docs/summary-screen.jpg
- docs/history-screen.jpg

Secondary Reference

- docs/mockup.jpg
