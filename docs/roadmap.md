# Development Roadmap (AI-Optimized for Cursor)

> **Purpose**
>
> This document is the execution playbook for Cursor.
> Complete **exactly one phase** per prompt.
> Never continue automatically to the next phase.

---

# Status

Product v1 (App Store / Play Store 1.0.0) shipped. M1–M6 are archived under
`docs/archive/`. The only active milestone is **M7 — Automatic Sleep Tracking**
(product v2, Phases 34–41, Tasks 7.1–7.8).

See ADR-31 (product), ADR-32 (background), ADR-33 (docs restructure), ADR-34
(battery save-and-stop).

---

# Documentation Priority

When multiple references overlap, follow the list in `docs/README.md`.
`docs/decisions.md` always wins.

`roadmap.md` defines the phases. `implementation-plan.md` breaks each phase into
executable tasks. On task scope, the implementation plan is more specific and
takes precedence.

---

# Global Rules

Before every phase:

- Read all relevant documentation, especially the feature PRD and ADR-31 / ADR-32.
- Read `.cursor/rules/`.
- Explain the implementation plan.
- Modify only allowed files.
- Run `npm run typecheck`, `npm run lint`, and `npm test`.
- Show changed files.
- Stop and wait for instructions.

## Never

- Redesign the UI or invent color values.
- Duplicate the native audio capture pipeline.
- Claim the user is in bed or asleep from phone sensors.
- Silently enable automatic tracking or overnight microphone use.
- Hardcode colors or spacing.
- Execute SQL inside UI components or stores.
- Access native modules directly from UI.
- Perform DSP in JavaScript.
- Construct a concrete implementation inside a store, hook, or component.
- Modify unrelated files.
- Continue to another phase automatically.
- Send raw PCM, log-mel patches, or tensors across the React Native bridge (ADR-22).
- Add a loudness-threshold branch in `CaptureEngine` (ADR-23).
- Add a dependency without approval.

---

# Milestones and Dependency Gates

| Milestone | Status   | Phases  | Install at | Packages |
| --------- | -------- | ------- | ---------- | -------- |
| M1–M5     | archived | 1–25    | —          | `docs/archive/roadmap-m1-m5.md` |
| M6 Acoustic Recognition | archived | 26–33 | — | `docs/archive/roadmap-m6.md` |
| **M7** Automatic Sleep Tracking | **active** | 34–41 | Task 7.6 | Notifications / background scheduling — **ask before installing**. Motion APIs — **ask before installing**. `expo-battery` is already present. |

Anything not on this list still requires approval before it is added.

---

# Known Starting Condition

- Product v1 is on the stores. App version is `1.0.0`.
- `npm run typecheck`, `npm run lint`, and `npm test` pass on the v1 codebase.
- Users start nights by pressing Start. There is no sleep schedule.
- `app_settings` (migration V3) already stores onboarding, greeting name, and
  review-prompt flags (ADR-30). V4 is additive and non-destructive.
- The native audio engine is the production path. M7 only **calls** it.

---

# Milestone 7 — Automatic Sleep Tracking

Goal: the user sets bedtime, wake time, and an opt-in. On a typical night
SnoozePulse starts and ends monitoring without a Start tap, using Sleep
Readiness (not bed detection), entirely on-device.

Exit condition for M7: schedule persists; automatic tracking is off until
opt-in; readiness window evaluates combined signals; stationary-alone cannot
start; `IAudioService.startSession()` / `stopSession()` are the only capture
lifecycle calls; wake window completes the session; a low-battery running session
is saved (ADR-34); a local notification opens Summary; failed nights are distinct
from successful ones; Home still offers manual start as an override; Android is
validated. iOS shares interfaces and is best-effort until macOS validation (ADR-32).

Playback-dominant episode tightening (§8 of the feature PRD) is **not** an M7
exit requirement.

---

## Phase 34 — Sleep schedule persistence

Reference: ADR-31, `docs/prd-automatic-sleep-tracking.md` §2, §18

Allowed: SQLite migration V4, settings repository/service, types, tests.

Tasks:

- Additive `app_settings` keys (or equivalent) for bedtime, wake time, and
  `automaticTrackingEnabled` (default false).
- `ISleepScheduleService` injected at the composition root.
- No UI yet.

---

## Phase 35 — Settings (and optional onboarding) for schedule + opt-in

Reference: feature PRD §2, §17; existing Settings primitives.

Allowed: `src/features/settings/**`, optional onboarding slide, copy, tests.

Tasks:

- Sleep Schedule section: bedtime, wake time, automatic tracking toggle.
- Privacy explanation of microphone use during the scheduled window.
- Opt-in is explicit. Toggle off remains the default for existing users.

---

## Phase 36 — Readiness state machine (pure TypeScript)

Reference: feature PRD §9–§10, ADR-31

Allowed: services, types, unit tests. No native, no UI.

Tasks:

- Implement `SCHEDULED → READINESS_WINDOW → SETTLING → MONITORING → WAKE_WINDOW → COMPLETED` with `ERROR` from any state.
- Combined-signal start rule; stationary-alone rejected.
- Named constants block for window offsets and thresholds (open until 2 hours
  before the wake window).
- This machine calls start/stop through interfaces; it does not own recording state.

---

## Phase 37 — Device signals (Android first)

Reference: feature PRD §5–§6, §16; ADR-32

Allowed: signal adapters behind interfaces, Android native or approved Expo APIs,
tests, fakes.

Tasks:

- Charging (`expo-battery` already installed).
- Screen / interaction (phone in use → delay start).
- Motion as a supporting settled/unsettled signal.
- **Stop and ask** before adding `expo-sensors` or a new native module.

---

## Phase 38 — Local scheduler: arm window and start the existing engine

Reference: feature PRD §3–§4, §11; ADR-32

Allowed: scheduler service, Android alarm / FGS wiring, store wiring, tests.

Tasks:

- Enter readiness window around bedtime (open until 2 hours before the wake window).
- When the combined rule fires, call existing `IAudioService.startSession()`.
- Do not auto-start at or below 20% unplugged (ADR-34).
- No second microphone pipeline.
- Manual start still works and is not blocked by the scheduler.

---

## Phase 39 — Wake window completion + morning notification

Reference: feature PRD §12–§14

Allowed: scheduler, notification wiring (ask before new dependency), deep link
to Summary, tests.

Tasks:

- End monitoring in the wake window via existing `stopSession()`.
- Local notification after a successful night.
- Tap opens that session's Summary.

---

## Phase 40 — Failed nights, charger reminder, privacy copy

Reference: feature PRD §15–§17

Allowed: copy, notification/reminder UX, session failure states, tests.

Tasks:

- Microphone denied, **skipped** auto-start for low battery, and OS interruption
  produce honest failed / incomplete nights.
- An in-progress session that hits 20% unplugged is saved (ADR-34), not failed.
- Non-blocking charger reminder when auto-tracking is on and the device is
  unplugged near the window.
- Privacy copy is visible at opt-in.

---

## Phase 41 — Home when automatic tracking is on

Reference: `docs/prd.md` §6, existing Home primitives, ADR-06

Allowed: `src/features/home/**`, copy, tests. No visual-language invention.

Tasks:

- Tonight's armed / waiting / failed status is the primary daily message.
- Start remains as an override.
- Reuse existing tokens and components. No new mock required for this phase.

---

# Definition of Done (Every Phase)

A phase is complete only if:

- `npm run typecheck` passes
- `npm run lint` passes
- `npm test` passes
- No runtime warnings
- No placeholder implementations
- Uses theme tokens
- Uses reusable UI primitives
- Follows strict layering
- Depends on interfaces, not concrete implementations
- Automatic tracking cannot enable itself
- Stops after completion
