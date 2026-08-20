# Implementation Plan

This document expands `roadmap.md` into executable tasks.

`roadmap.md` says *what* each phase covers. This document says *how to execute it,
what may be touched, and how to prove it is done*.

**Execute exactly one task per prompt. Every task ends in a STOP.**

---

# Status

Tasks 1.1–6.8 are complete or archived. Product v1 shipped. Milestone 7
(Tasks 7.1–7.8) is the only active plan.

Archived plans:

- `docs/archive/implementation-plan-m1-m5.md`
- `docs/archive/implementation-plan-m6.md`

Do not follow them as active work.

---

## How to Use This Document

1. Read the task's **Read first** list in full before writing anything.
2. Explain your plan and wait for confirmation if the plan deviates from the task.
3. Modify only what **May modify** permits.
4. Satisfy every **Acceptance criterion**.
5. Run every **Validation** command and paste the output.
6. Show the list of changed files.
7. **STOP.** Do not begin the next task.

Where any document disagrees with `docs/decisions.md`, `decisions.md` wins.

---

## Milestone Overview

| Milestone | Theme                        | Tasks     | Status   | Phases  |
| --------- | ---------------------------- | --------- | -------- | ------- |
| M1–M5     | Foundation through native audio | 1.1–5.6 | archived | 1–25    |
| M6        | Acoustic Recognition         | 6.1–6.8   | archived | 26–33   |
| **M7**    | Automatic Sleep Tracking     | 7.1–7.8   | **active** | 34–41 |

---

## Dependency Gates

Install only at the task named, and only after approval.

| Install at | Packages |
| ---------- | -------- |
| Task 7.4   | Motion APIs (`expo-sensors` or native) — **ask first** |
| Task 7.6   | Local notifications / exact-alarm / background scheduling — **ask first** |

Already available: `expo-battery`, existing microphone FGS, `app_settings` KV table.

No JavaScript-side ML library. Do not add a second audio module.

---

## Global Guardrails

**Never modify, in any task:**

```text
docs/**            (except where a task explicitly says otherwise)
.cursor/rules/**
AGENTS.md
CLAUDE.md
LICENSE
.git/**
node_modules/**
package-lock.json  (except as a side effect of an approved install)
docs/archive/**    (frozen historical record)
```

**Never do, in any task:**

- Redesign the UI or invent a color value.
- Hardcode a color, spacing, radius, or font size.
- Write SQL outside `src/repositories/`.
- Call a native module from the UI.
- Perform DSP in JavaScript.
- Construct a concrete class inside a store, hook, or component.
- Leave a `TODO`, a stub, or a thrown "not implemented".
- Continue to the next task automatically.
- Duplicate capture inside a new pipeline.
- Silently default `automaticTrackingEnabled` to true.
- Claim bed or sleep from motion.
- Send raw PCM, tensors, or log-mel patches across the bridge (ADR-22).
- Add a loudness-threshold branch in `CaptureEngine` (ADR-23).

**Baseline validation, run at the end of every task:**

```bash
npm run typecheck
npm run lint
npm test
```

All three must exit clean.

---

# Milestone 7 — Automatic Sleep Tracking

Goal: schedule once, opt in, then SnoozePulse starts and ends overnight
monitoring via Sleep Readiness and the existing audio engine.

Exit condition: the acceptance list in `docs/prd-automatic-sleep-tracking.md` §22,
except playback-dominant episode tightening (§8), which is deferred past M7.

---

## Task 7.1 — Sleep schedule persistence

**Objective**
Persist bedtime, wake time, and the automatic-tracking flag locally. No UI.
Default automatic tracking **off**. Additive, non-destructive migration V4 so
recorded nights survive (ADR-31).

**Read first**

- `docs/decisions.md` — ADR-12, ADR-18, ADR-30, ADR-31
- `docs/prd-automatic-sleep-tracking.md` §2, §18
- `src/repositories/ISettingsRepository.ts`
- `src/services/ProfileService.ts` (pattern for `app_settings` keys)
- `src/services/database/migrations.ts`

**May modify**

```text
src/services/database/migrations.ts
src/repositories/**
src/services/**          (new ISleepScheduleService + impl + tests)
src/types/**
src/hooks/createContainer.ts   (composition-root wiring only)
src/store/**               (only if a thin schedule slice is required to expose
                           persisted values; no session lifecycle changes)
```

**Must not modify**

```text
modules/**
src/features/**
src/native/**
docs/**
```

**Acceptance criteria**

- Migration V4 is additive. Existing `sleep_sessions` rows are not deleted.
- Keys exist for local bedtime, wake time, and `automaticTrackingEnabled`.
- Missing keys read as: no schedule yet, automatic tracking `false`.
- `ISleepScheduleService` is the only consumer of those keys. The store does
  not call the repository.
- Round-trip unit tests cover read / write / default-off.
- Times are stored in a timezone-safe, local-wall-clock form documented in the
  type (not as a UTC instant that drifts).

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

**STOP.** Report the key names, default values, and migration number. Wait.

---

## Task 7.2 — Settings UI for schedule and opt-in

**Objective**
Let the user set bedtime, wake time, and enable/disable automatic tracking from
Settings, using existing Settings primitives. Privacy copy explains microphone
use during the scheduled window.

**Read first**

- `docs/prd-automatic-sleep-tracking.md` §2, §17
- `docs/design-spec.md`
- `src/features/settings/**`
- `.cursor/rules/01-guardrails.mdc`

**May modify**

```text
src/features/settings/**
src/features/onboarding/**   (only if adding a schedule step; Settings-only is
                             acceptable for this task)
src/theme/**                 (only if a token is genuinely missing; sample it)
src/store/**                 (selectors / actions for schedule, no business rules)
```

**Must not modify**

```text
modules/**
src/native/**
src/services/database/**
src/repositories/**
docs/**
```

**Acceptance criteria**

- Settings shows bedtime, wake time, and an automatic-tracking control.
- Automatic tracking cannot be turned on without the user doing so.
- Privacy sentence from the feature PRD §17 is visible near the toggle.
- Accessibility labels on every interactive control.
- Existing users who never open the new section remain opted out.
- Theme tokens only. No hex literals outside `src/theme/**`.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

**STOP.** Report screenshots or a structural description of the new Settings
section. Do not start the state machine.

---

## Task 7.3 — Readiness state machine

**Objective**
A pure TypeScript Sleep Readiness machine, unit-tested with fakes, that decides
when to request start and stop. It does not start the engine itself in this
task — it exposes intents the next tasks will wire.

**Read first**

- `docs/prd-automatic-sleep-tracking.md` §4, §9, §10, §12
- `docs/architecture.md` — recording state machine (do not merge)
- ADR-31, ADR-32

**May modify**

```text
src/services/**            (readiness service + constants + tests)
src/types/**
```

**Must not modify**

```text
modules/**
src/features/**
src/native/**
src/repositories/**
docs/**
```

**Acceptance criteria**

- States: `SCHEDULED`, `READINESS_WINDOW`, `SETTLING`, `MONITORING`,
  `WAKE_WINDOW`, `COMPLETED`, `ERROR`.
- Illegal transitions are rejected, same pattern as the recording machine.
- Start intent requires: in window + settled + not interacting + acceptable
  environment. Stationary-alone tests must **not** emit start.
- Window offsets and thresholds live in one named constants block. Readiness stays
  open until 2 hours before the wake window starts (not a 60-minute post-bedtime
  lag). 2 AM on an 11 PM–7 AM night is in window; 5 AM is not.
- No clock, sensor, or audio I/O inside the reducer — those are injected.
- Recording states are not duplicated here.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

**STOP.** Paste the transition table and the stationary-alone failing case.

---

## Task 7.4 — Device signals (Android first)

**Objective**
Adapters for charging, phone interaction, and motion that the readiness machine
can read. Android is the validation target. Ask before any new dependency.

**Read first**

- `docs/prd-automatic-sleep-tracking.md` §5, §6, §16
- ADR-32
- `package.json` — `expo-battery` is already installed

**May modify**

```text
src/services/**
src/native/**              (JS wrappers only, if a native signal is approved)
modules/snoozepulse-audio/**   (only if extending the existing module is approved
                               instead of a new package — ask first)
src/types/**
```

**Must not modify**

```text
src/features/**
docs/**
```

**Acceptance criteria**

- `IReadinessSignals` (name may vary) exposes: charging, screen/interactive,
  motion-settled, and a placeholder for audio-environment that may be "unknown"
  until a later sample exists.
- Implementations are fakes in tests; the store/UI never construct them.
- Motion is documented as phone-settled, not person-in-bed.
- Charging uses `expo-battery` unless a gap is proven.
- If `expo-sensors` or other packages are required, **stop and ask** before
  installing. Do not install speculatively.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

**STOP.** Report which signals are live vs stubbed, and any dependency request.

---

## Task 7.5 — Scheduler starts the existing audio engine

**Objective**
Arm the readiness window around bedtime. When the combined rule fires, call
existing `IAudioService.startSession()`. No second microphone.

**Read first**

- `docs/prd-automatic-sleep-tracking.md` §3, §11
- ADR-32
- `src/services/IAudioService.ts`
- `src/store/sessionSlice.ts`

**May modify**

```text
src/services/**
src/store/**
src/hooks/createContainer.ts
src/native/**              (JS only, if Android alarm wiring needs a wrapper)
modules/**                 (only with approval, Android scheduler glue)
```

**Must not modify**

```text
src/features/**            (Home comes in Task 7.8)
docs/**
```

**Acceptance criteria**

- Automatic path calls the same `startSession()` as the manual button.
- No new `AudioRecord` / `AVAudioEngine` instance for readiness.
- Manual start still works while automatic tracking is on or off.
- If the user is in an active session, the scheduler does not start a second one.
- Do not auto-start when the pack is already at or below 20% and unplugged (ADR-34
  skip). Manual Start still works.
- Unit tests cover: combined rule fires → start; interacting → no start;
  already recording → no start.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

On-device Android check is expected: enable auto-tracking, set bedtime soon,
confirm a session starts only after settled + idle. Report if the OS will not
wake a killed process yet — that gap is ADR-32, not a silent workaround.

**STOP.** Report how the window is armed on Android.

---

## Task 7.6 — Wake completion and morning notification

**Objective**
End the session in the wake window through existing `stopSession()`, then show
a local notification that opens that night's Summary.

**Read first**

- `docs/prd-automatic-sleep-tracking.md` §12–§14
- ADR-32
- Expo Router linking for `session/[id]/summary`

**May modify**

```text
src/services/**
src/store/**
src/app/**                 (deep-link / notification response only)
package.json               (only after approval for notifications)
app.json                   (only after approval, notification permissions)
```

**Must not modify**

```text
modules/snoozepulse-audio/**   (detector frozen)
docs/**
```

**Acceptance criteria**

- Wake window uses named constants, not the exact wake timestamp as "user awoke".
  Default stop is the end of that window; snore-extend is out of this task.
- In-progress low battery still save-stops via the existing ADR-34 guard; this task
  does not invent a second stop path.
- Successful auto-complete persists scores the same way as a manual slide-to-end.
- Local notification copy matches the feature PRD §14 in intent.
- Tap opens the completed session's Summary, not a generic Home.
- **Ask before** adding `expo-notifications` or native notification code.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

**STOP.** Report the deep-link route and whether a new package was approved.

---

## Task 7.7 — Failed nights, charger reminder, privacy

**Objective**
Nights that did not track are not presented as summaries. Unplugged phones get a
gentle charger reminder. Opt-in copy stays honest.

**Read first**

- `docs/prd-automatic-sleep-tracking.md` §15–§17
- ADR-30 (minimum session length / discard)
- ADR-31

**May modify**

```text
src/services/**
src/features/settings/**
src/features/home/**       (reminder / failed-night copy only)
src/types/**
src/store/**
```

**Must not modify**

```text
modules/**
docs/**
```

**Acceptance criteria**

- Microphone denied, missing schedule, and engine errors produce a failed or
  skipped night, never a Summary with invented scores.
- An in-progress session that hits 20% unplugged is **saved** (ADR-34), not failed.
  Auto-start skipped for low battery is a missed night, not a Summary.
- Sessions shorter than `MIN_SESSION_DURATION_MS` still follow ADR-30 on slide-to-end.
  Battery save bypasses that discard dialog.
- Charger reminder is non-blocking when auto-tracking is on and unplugged near
  the window.
- Privacy copy remains on the opt-in control.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

**STOP.** List the failure states and the copy used for each.

---

## Task 7.8 — Home when automatic tracking is on

**Objective**
When automatic tracking is enabled, Home's primary daily message is tonight's
status, not "press Start". Start remains as an override. Reuse existing Home
primitives and tokens. Do not invent a new visual language.

**Read first**

- `docs/prd.md` §6
- `docs/design-spec.md`
- `src/features/home/**`
- ADR-06, ADR-08

**May modify**

```text
src/features/home/**
src/theme/**               (only if a token is missing; sample it)
src/store/**               (selectors only)
```

**Must not modify**

```text
modules/**
src/services/**
src/repositories/**
src/native/**
docs/**
```

**Acceptance criteria**

- Auto off: Home behaves as product v1 (Start is primary).
- Auto on: status reflects armed / waiting / monitoring / failed / ready.
- Start is still reachable and labelled as an override, not removed.
- No hex literals outside theme. Accessibility labels on new controls.
- Branding remains SnoozePulse.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
```

**STOP.** M7 complete on the TypeScript/Android path. Report Home states and
any iOS gaps left for macOS validation.

---

# Progress Tracker

| Task | Title                                              | Status  |
| ---- | -------------------------------------------------- | ------- |
| 7.1  | Sleep schedule persistence                         | pending |
| 7.2  | Settings UI for schedule and opt-in                | pending |
| 7.3  | Readiness state machine                            | pending |
| 7.4  | Device signals (Android first)                     | pending |
| 7.5  | Scheduler starts the existing audio engine         | pending |
| 7.6  | Wake completion and morning notification           | pending |
| 7.7  | Failed nights, charger reminder, privacy           | pending |
| 7.8  | Home when automatic tracking is on                 | pending |
