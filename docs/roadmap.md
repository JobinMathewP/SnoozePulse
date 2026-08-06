# Development Roadmap (AI-Optimized for Cursor)

> **Purpose**
>
> This document is the execution playbook for Cursor.
> Complete **exactly one phase** per prompt.
> Never continue automatically to the next phase.

---

# Documentation Priority

When multiple references overlap, follow this order:

1. docs/home-screen.jpg
2. docs/active-session.jpg
3. docs/summary-screen.jpg
4. docs/history-screen.jpg
5. docs/mockup.jpg
6. docs/design-spec.md
7. docs/ui-guidelines.md
8. docs/architecture.md
9. docs/api-contracts.md
10. docs/native-audio.md
11. docs/SnoreTracker_App_PRD_Specification.md
12. docs/coding-standards.md
13. docs/testing-strategy.md
14. docs/roadmap.md

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
- Invent APIs or dependencies.
- Hardcode colors or spacing.
- Execute SQL inside UI components.
- Access native modules directly from UI.
- Perform DSP in JavaScript.
- Modify unrelated files.
- Continue to another phase automatically.

---

# Phase 0 — Architecture Review

**Goal**
- Read every document in `docs/`
- Read Cursor rules
- Summarize architecture, design system and roadmap
- Identify contradictions or missing requirements

Allowed files:
- None

Deliverable:
- Review report only

---

# Phase 1 — Project Structure

Allowed:
- src/features/**
- src/services/**
- src/repositories/**
- src/store/**
- src/theme/**
- src/types/**
- src/native/**

Tasks:
- Create folders only
- Configure path aliases if needed

Forbidden:
- UI
- Business logic

---

# Phase 2 — Theme System

Allowed:
- src/theme/**

Tasks:
- colors.ts
- spacing.ts
- typography.ts
- radius.ts
- shadows.ts

Reference:
- docs/ui-guidelines.md

---

# Phase 3 — Shared Types

Allowed:
- src/types/**

Tasks:
- SessionState
- SleepSession
- SnoreEvent
- AudioLevelEvent
- Analytics models

Reference:
- docs/api-contracts.md

---

# Phase 4 — Service Interfaces

Allowed:
- src/services/**
- src/repositories/**

Tasks:
- IAudioEngine
- ISleepRepository
- ISnoreRepository
- IAnalyticsService

No implementations.

---

# Phase 5 — Navigation Shell

Allowed:
- app/**
- navigation files

Tasks:
- Bottom tabs
- Route types
- Blank screens
- Safe area

No UI implementation.

---

# Phase 6 — UI Primitives

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

# Phase 7 — Home Screen

Reference:
- docs/home-screen.jpg

Allowed:
- src/features/home/**
- src/components/ui/**

Tasks:
- Match layout
- Theme tokens only
- Mock data only

Stop after completion.

---

# Phase 8 — Home Review

No code changes.

Compare implementation with:
- docs/home-screen.jpg

Produce:
- Visual review
- Missing items
- Suggested refinements

---

# Phase 9 — Active Session Screen

Reference:
- docs/active-session.jpg

Mock data only.

---

# Phase 10 — Active Screen Review

Review only.

---

# Phase 11 — Summary Screen

Reference:
- docs/summary-screen.jpg

Mock data only.

---

# Phase 12 — Summary Review

Review only.

---

# Phase 13 — History Screen

Reference:
- docs/history-screen.jpg

Mock data only.

---

# Phase 14 — History Review

Review only.

---

# Phase 15 — SQLite & Repository Layer

Reference:
- docs/api-contracts.md
- PRD

Tasks:
- SQLite schema
- Database client
- Repository implementations

No UI modifications.

---

# Phase 16 — Zustand Store

Tasks:
- Recording state
- Session state
- Store actions

Do not connect native audio.

---

# Phase 17 — Analytics Engine

Tasks:
- Sleep score
- Snore score
- Statistics
- Timeline aggregation

No UI redesign.

---

# Phase 18 — Native Audio Bridge

Reference:
- docs/native-audio.md

Tasks:
- Expo config
- Bridge interface
- Event subscription

No DSP in JavaScript.

---

# Phase 19 — Native Audio Engine

Platform:
- Swift
- Kotlin

Tasks:
- RMS
- Peak detection
- Snore detection
- Snippet generation
- Event emission

---

# Phase 20 — Integration

Connect:
UI → Store → Repositories → SQLite → Native Audio

Replace all mock data.

---

# Phase 21 — Charts & Audio Playback

Implement:
- Timeline chart
- Audio snippets
- Playback

---

# Phase 22 — Error Handling

Handle:
- Permission denial
- Database failure
- Storage full
- Native failures

---

# Phase 23 — Accessibility

Verify:
- accessibilityLabel
- Dynamic type
- Safe areas
- 44x44 touch targets

---

# Phase 24 — Performance

Review:
- Memory stability
- Re-render count
- Animation smoothness
- Battery impact

---

# Phase 25 — Release Candidate

Checklist:
- TypeScript clean
- ESLint clean
- No runtime warnings
- No TODOs
- Documentation updated
- Commit to Git

---

# Definition of Done (Every Phase)

A phase is complete only if:

- TypeScript passes
- ESLint passes
- No runtime warnings
- No placeholder implementations
- Uses theme tokens
- Uses reusable UI primitives
- Follows repository pattern
- Stops after completion
