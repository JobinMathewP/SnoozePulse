> **Archived — superseded by Milestone 6.**
>
> This file is preserved verbatim for provenance. Do not follow it as an active
> plan. The active roadmap lives in `docs/roadmap.md` and covers M6 (Acoustic
> Recognition). See `docs/archive/README.md` and ADR-28 in `docs/decisions.md`
> for context.

# Development Roadmap (AI-Optimized for Cursor)

> **Purpose**
>
> This document is the execution playbook for Cursor.
> Complete **exactly one phase** per prompt.
> Never continue automatically to the next phase.

---

# Documentation Priority

When multiple references overlap, follow this order:

1. docs/decisions.md ← ratified decisions, overrides everything below
2. docs/home-screen.jpg
3. docs/active-session.jpg
4. docs/summary-screen.jpg
5. docs/history-screen.jpg
6. docs/mockup.jpg
7. docs/design-spec.md
8. docs/ui-guidelines.md
9. docs/architecture.md
10. docs/api-contracts.md
11. docs/native-audio.md
12. docs/SnoreTracker_App_PRD_Specification.md
13. docs/coding-standards.md
14. docs/testing-strategy.md
15. docs/implementation-plan.md
16. docs/roadmap.md

Where a reference image conflicts with `decisions.md`, `decisions.md` wins. There are
currently two such conflicts, both ratified: SnoozePulse branding (ADR-08) and the removal
of the Insights and Profile tabs (ADR-09).

`roadmap.md` defines the phases. `implementation-plan.md` breaks each phase into executable
tasks with allowed paths, acceptance criteria, and validation commands. On task scope, the
implementation plan is the more specific document and takes precedence.

---

# Global Rules

Before every phase:

- Read all relevant documentation.
- Read `.cursor/rules/`.
- Explain the implementation plan.
- Modify only allowed files.
- Run:
  - `npm run typecheck`
  - `npm run lint`
- Show changed files.
- Stop and wait for instructions.

## Never

- Redesign the UI.
- Invent APIs, dependencies, or color values.
- Hardcode colors or spacing.
- Execute SQL inside UI components or stores.
- Access native modules directly from UI.
- Perform DSP in JavaScript.
- Construct a concrete implementation inside a store, hook, or component.
- Modify unrelated files.
- Continue to another phase automatically.

---

# Milestones and Dependency Gates

No dependency is installed before the phase that needs it. Installing a dependency is part
of the phase named below and requires no separate approval.

| Milestone | Phases | Install at | Packages |
| --- | --- | --- | --- |
| **M1** Foundation | 1–4 | Phase 1 | `zustand`, `react-native-svg`, `expo-font`, `@expo-google-fonts/inter`, `@expo/vector-icons`, `eslint`, `eslint-config-expo`, then `nativewind@preview`, `react-native-css`, `tailwindcss`, `@tailwindcss/postcss`, `postcss` (ADR-20) |
| **M2** Navigation & UI primitives | 5–6 | — | — |
| **M3** Screens (mock data) | 7–14 | Phase 7 | `expo-battery`, `expo-keep-awake` |
| **M4** Data, state & analytics | 15–17 | Phase 15 | `expo-sqlite` |
| **M5** Native audio, integration & release | 18–25 | Phase 18 | `expo-audio`, `expo-file-system` |
| | | Phase 25 | `jest`, `jest-expo`, `@testing-library/react-native` |

Phase 0 (Architecture Review) is complete and precedes M1.

`react-native-reanimated` (4.5.1) and `react-native-worklets` are already installed.

Anything not on this list still requires approval before it is added.

Each milestone is broken into 4–6 executable tasks in `docs/implementation-plan.md`, which
specifies per-task allowed paths, acceptance criteria, and validation commands.

---

# Known Starting Condition

`npm run typecheck` passes with zero errors. Every phase must keep it that way.

It briefly failed on two CSS-module imports in starter-template files. Running the app
generated `expo-env.d.ts` and `.expo/types/`, which supply those ambient declarations. Both
files are build artifacts: if typecheck fails on `*.module.css` or `@/global.css` after a
clean checkout, run the app once to regenerate them rather than editing the affected files —
they are on the Phase 1 deletion list anyway.

`npm run lint` is not available until Phase 1 installs ESLint.

---

# Phase 0 — Architecture Review

**Status: complete.** Outcome recorded in `docs/decisions.md`.

Allowed files:
- None

Deliverable:
- Review report only

---

# Phase 1 — Project Structure (M1)

Allowed:
- package.json (dependency install only)
- babel.config.js, metro.config.js, postcss.config.mjs, global.css (NativeWind setup)
- eslint config
- app.json
- README.md
- src/** (creation and the deletion list below)
- scripts/**

Tasks:
- Install the M1 dependencies.
- Delete the starter template (list below).
- Create the folder structure from `coding-standards.md`.
- Configure NativeWind.
- Confirm path aliases.
- Rewrite README.md for SnoozePulse.
- Remove the `web` block from app.json; web is not a target (ADR-02).

Deletion list:

```text
src/app/explore.tsx
src/components/animated-icon.tsx
src/components/animated-icon.web.tsx
src/components/animated-icon.module.css
src/components/app-tabs.tsx
src/components/app-tabs.web.tsx
src/components/external-link.tsx
src/components/hint-row.tsx
src/components/themed-text.tsx
src/components/themed-view.tsx
src/components/web-badge.tsx
src/components/ui/collapsible.tsx
src/constants/                     (entire folder, including theme.ts)
src/global.css                     (replaced by the NativeWind entry stylesheet)
src/hooks/use-color-scheme.ts
src/hooks/use-color-scheme.web.ts
src/hooks/use-theme.ts
scripts/reset-project.js
```

`src/app/_layout.tsx` and `src/app/index.tsx` import deleted files, so Phase 1 reduces them
to a minimal bootable shell. They are rebuilt properly in Phase 5.

Forbidden:
- UI implementation
- Business logic

Exit criteria:
- `npm run typecheck` passes with zero errors.
- `npm run lint` passes with zero errors and warnings.
- The app boots to a blank screen.

---

# Phase 2 — Theme System (M1)

Allowed:
- src/theme/**
- global.css (`@theme` block only)

Tasks:
- colors.ts
- spacing.ts
- typography.ts
- radius.ts
- shadows.ts
- Load Inter via `expo-font` (ADR-07).
- Generate the `@theme` block from these tokens so tokens remain the single source of truth.
  Tailwind 4 defines theme in CSS, so this emits custom properties rather than a JavaScript
  config object (ADR-20).

**Color sampling (ADR-06).** Before writing `colors.ts`, sample every additional token
directly from the reference images. Do not guess a value. Record token name, hex, source
image, and the element sampled. The required sampling list is in `ui-guidelines.md`.

Reference:
- docs/ui-guidelines.md

Deliverable alongside the code:
- A table of every sampled token with its provenance.

---

# Phase 3 — Shared Types (M1)

Allowed:
- src/types/**

Tasks:
- SessionState
- SleepSession
- SnoreEvent
- AudioLevelEvent
- SessionBucket
- Analytics models

Reference:
- docs/api-contracts.md

Note the ratified payload changes: `AudioLevelEvent` carries `sessionId`, and
`SnoreEvent.audioPath` is nullable.

---

# Phase 4 — Service and Repository Interfaces (M1)

Allowed:
- src/services/**
- src/repositories/**
- src/native/**

Tasks:
- IAudioEngine
- ISleepRepository
- ISnoreRepository
- IAudioService
- ISleepService
- IAnalyticsService
- Define the composition root's shape (ADR-18).

No implementations.

Services hold business logic; repositories hold SQL. They never merge (ADR-19).

---

# Phase 5 — Navigation Shell (M2)

Allowed:
- src/app/**

Navigation is Expo Router (ADR-01). Routes live in `src/app/`, not a top-level `app/`.

Tasks:
- Tab layout: Home, History
- Active Session route outside the tab bar
- Summary route, pushed, with back and share
- Settings route, pushed from the Home header
- Route types
- Blank screens
- Safe area

Do not create Insights or Profile routes (ADR-09).

No UI implementation.

---

# Phase 6 — UI Primitives (M2)

Reference:
- docs/design-spec.md
- docs/ui-guidelines.md

Allowed:
- src/components/ui/**

Create:
- Screen
- Button
- Card
- StatusCard
- MetricCard
- SectionHeader
- TimelineCard
- Waveform

---

# Phase 7 — Home Screen (M3)

Reference:
- docs/home-screen.jpg

Allowed:
- src/features/home/**
- src/components/ui/**
- src/app/(tabs)/index.tsx
- package.json

Tasks:
- Install `expo-battery` and `expo-keep-awake`.
- Match layout
- Theme tokens only
- Mock data only
- Header renders "SnoozePulse" (ADR-08)

Stop after completion.

---

# Phase 8 — Home Review (M3)

No code changes.

Compare implementation with:
- docs/home-screen.jpg

Produce:
- Visual review
- Missing items
- Suggested refinements

---

# Phase 9 — Active Session Screen (M3)

Reference:
- docs/active-session.jpg

Allowed:
- src/features/session/**
- src/components/ui/**

Mock data only.

The only control is "slide to end session". No pause control (ADR-14).

The waveform reads a Reanimated shared value, not store state (ADR-13). In this phase the
shared value is driven by mock data.

---

# Phase 10 — Active Screen Review (M3)

Review only.

---

# Phase 11 — Summary Screen (M3)

Reference:
- docs/summary-screen.jpg

Allowed:
- src/features/summary/**
- src/components/ui/**

Mock data only.

---

# Phase 12 — Summary Review (M3)

Review only.

---

# Phase 13 — History Screen (M3)

Reference:
- docs/history-screen.jpg

Allowed:
- src/features/history/**
- src/components/ui/**

Mock data only.

---

# Phase 14 — History Review (M3)

Review only.

---

# Phase 15 — SQLite and Repository Layer (M4)

Reference:
- docs/api-contracts.md
- PRD §5 Storage

Allowed:
- src/repositories/**
- src/services/** (database client only)
- package.json

Tasks:
- Install `expo-sqlite`.
- Schema: `sleep_sessions`, `snore_events`, `session_buckets` (ADR-11).
- WAL journaling, `PRAGMA foreign_keys = ON`, `PRAGMA user_version` migrations.
- Async singleton database client, injected into repositories.
- Repository implementations with batched writes.

Do not use `SQLiteProvider` / `useSQLiteContext` as the primary access path — it would make
the database reachable from any component and break the layering rule.

No UI modifications.

---

# Phase 16 — Zustand Store (M4)

Allowed:
- src/store/**
- src/hooks/**

Tasks:
- Session slice with guarded state machine transitions
- Audio slice
- Settings slice
- Composition root wiring (ADR-18)

The store calls services only, never repositories (ADR-12).

Do not connect native audio.

---

# Phase 17 — Analytics Engine (M4)

Allowed:
- src/services/**
- src/utils/**

Tasks:
- Sleep score — V1 weighted heuristic (ADR-10)
- Snore score — V1 weighted heuristic (ADR-10)
- Statistics
- Timeline bucket aggregation
- Weekly and monthly comparisons

Each score is one pure function with its weighting constants in a single named block, and a
doc comment marking it as a V1 heuristic scheduled for V2 replacement. Do not invent medical
or clinical scoring. Do not leave a `TODO`.

No UI redesign.

---

# Phase 18 — Native Audio Bridge (M5)

Reference:
- docs/native-audio.md

Allowed:
- src/native/**
- modules/snoozepulse-audio/** (scaffold and TypeScript binding)
- app.json
- package.json

Tasks:
- Install `expo-audio` and `expo-file-system`.
- Scaffold the Expo local module at `modules/snoozepulse-audio/` (ADR-16).
- Configure the Android foreground service and iOS background audio mode via the
  `expo-audio` plugin.
- Bridge interface and event subscription.

No DSP in JavaScript.

---

# Phase 19 — Native Audio Engine (M5)

Allowed:
- modules/snoozepulse-audio/ios/**
- modules/snoozepulse-audio/android/**

Platform:
- Swift (AVAudioEngine)
- Kotlin (AudioRecord)

Tasks:
- RMS
- Peak detection
- Snore detection against the calibrated ambient baseline
- Snippet generation to the document directory
- Throttled event emission (100–200 ms)
- Audio session arbitration
- System pause and resume on interruption

---

# Phase 20 — Integration (M5)

Connect:
UI → Store → Services → Repositories → SQLite → Native Audio

Replace all mock data.

---

# Phase 21 — Charts and Audio Playback (M5)

Implement:
- Timeline chart backed by `session_buckets`
- Audio snippets
- Playback via `expo-audio`, arbitrated against capture

The Summary timeline's "tap any bar to hear audio" maps a bucket to the loudest snore event
within that bucket's time range.

---

# Phase 22 — Error Handling, Retention and Cleanup (M5)

Handle:
- Permission denial
- Database failure
- Storage full
- Native failures
- `SnoreEvent.audioPath === null` when a snippet could not be written

Implement retention (ADR-15):
- 30 days or 500 MB, whichever comes first
- Automatic cleanup
- Session deletion removes its snippets
- Orphaned files reclaimed at app start

---

# Phase 23 — Accessibility (M5)

Verify:
- accessibilityLabel
- Dynamic type
- Safe areas
- 44x44 touch targets

---

# Phase 24 — Performance (M5)

Review:
- Memory stability over an 8-hour session
- Re-render count — the audio level stream must not trigger React renders
- Animation smoothness
- Battery impact

---

# Phase 25 — Release Candidate (M5)

Allowed:
- Test files across the codebase
- package.json

Checklist:
- Install the M5 test tooling and write the test pyramid from `testing-strategy.md`
- TypeScript clean
- ESLint clean
- No runtime warnings
- No TODOs
- Documentation updated
- Commit to Git

---

# Definition of Done (Every Phase)

A phase is complete only if:

- `npm run typecheck` passes
- `npm run lint` passes
- No runtime warnings
- No placeholder implementations
- Uses theme tokens
- Uses reusable UI primitives
- Follows strict layering: UI → Store → Services → Repositories → SQLite / Native
- Depends on interfaces, not concrete implementations
- Stops after completion
