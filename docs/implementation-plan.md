# Implementation Plan

This document expands `roadmap.md` into executable tasks.

`roadmap.md` says _what_ each phase covers. This document says _how to execute it, what may
be touched, and how to prove it is done_.

**Execute exactly one task per prompt. Every task ends in a STOP.**

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

| Milestone | Theme                               | Tasks     | Roadmap phases |
| --------- | ----------------------------------- | --------- | -------------- |
| **M1**    | Foundation                          | 1.1 – 1.6 | 1 – 4          |
| **M2**    | Navigation & UI Primitives          | 2.1 – 2.5 | 5 – 6          |
| **M3**    | Screens (mock data)                 | 3.1 – 3.6 | 7 – 14         |
| **M4**    | Data, State & Analytics             | 4.1 – 4.5 | 15 – 17        |
| **M5**    | Native Audio, Integration & Release | 5.1 – 5.6 | 18 – 25        |

Milestones are strictly sequential. Every task depends only on tasks with a lower number.
Nothing in M3 may reference a store, a repository, or a native module, because those do not
exist until M4 and M5.

Phase 0 (Architecture Review) is complete; its outcome is `docs/decisions.md`. The milestone
numbering here matches `roadmap.md`.

---

## Dependency Gates

Install only at the task named. Anything not listed still needs approval.

| Install at | Packages                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Task 1.1   | `zustand`, `react-native-svg`, `expo-font`, `@expo-google-fonts/inter`, `@expo/vector-icons`, `eslint` (dev), `eslint-config-expo` (dev)         |
| Task 1.3   | `nativewind@preview`, `react-native-css`, `tailwindcss` (dev), `@tailwindcss/postcss` (dev), `postcss` (dev), plus a `lightningcss` override pin |
| Task 3.1   | `expo-battery`, `expo-keep-awake`                                                                                                                |
| Task 4.1   | `expo-sqlite`                                                                                                                                    |
| Task 5.1   | `expo-audio`, `expo-file-system`                                                                                                                 |
| Task 5.6   | `jest`, `jest-expo`, `@testing-library/react-native`                                                                                             |

`react-native-reanimated` (4.5.1) and `react-native-worklets` are already installed.

NativeWind moved from Task 1.1 to Task 1.3 so that it is installed, configured, and verified
in a single step rather than installed blind. See ADR-20 for the version rationale.

---

## Global Guardrails

These apply to every task and are not repeated in each one.

**Never modify, in any task:**

```text
docs/**            (except where a task explicitly says otherwise)
.cursor/rules/**
AGENTS.md
CLAUDE.md
LICENSE
assets/**          (except where a task explicitly says otherwise)
.git/**
node_modules/**
package-lock.json  (except as a side effect of an approved install)
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

**Baseline validation, run at the end of every task:**

```bash
npm run typecheck
npm run lint
```

Both must exit clean. `npm run lint` is only available after Task 1.1.

---

# Milestone 1 — Foundation

Goal: a clean, empty, correctly configured project with the full type and interface
vocabulary in place, and no starter-template code left.

Exit condition for M1: the app boots to a blank screen, typecheck and lint are clean, and
every interface the rest of the build depends on is defined with zero implementations.

---

## Task 1.1 — Toolchain and M1 dependencies

**Status: complete.**

**Objective**
Install the M1 dependency set and make `npm run lint` functional. No source changes.

**Read first**

- `docs/decisions.md` (ADR-03, ADR-04)
- `docs/roadmap.md` — Milestones and Dependency Gates
- `docs/coding-standards.md`
- https://docs.expo.dev/versions/v57.0.0/ — confirm every version against SDK 57

**May modify**

```text
package.json
package-lock.json
eslint.config.js        (create)
```

**Must not modify**

```text
src/**
app.json
tsconfig.json
```

**Acceptance criteria**

- The seven Task 1.1 packages installed at SDK 57 compatible versions, resolved via
  `npx expo install` where the package is an Expo package.
- `eslint` and `eslint-config-expo` are in `devDependencies`, not `dependencies`.
- `eslint.config.js` exists and extends `eslint-config-expo/flat`.
- `npm run lint` runs without an interactive prompt.
- `npm run typecheck` still passes with zero errors.
- No source file changed.

Lint is not expected to exit clean until Task 1.2, because template files that Task 1.1 may
not touch contain lint errors. Do not add ignore rules to mask them.

**Validation**

```bash
npm run lint
npm run typecheck
git status --short
```

**STOP.** Report installed versions and the lint baseline. Wait for review.

**Execution notes**

- `expo install` adds an `expo-font` config plugin entry to `app.json`. Task 1.1 may not
  modify `app.json`; revert it. Runtime font loading in Task 1.4 does not need the plugin.
- The Windows `"--" --dev` form from Expo's ESLint guide did not route packages to
  `devDependencies`; a follow-up `npm install --save-dev` with the Expo-resolved ranges was
  required.

---

## Task 1.2 — Remove the starter template and create the folder structure

**Status: complete.**

**Objective**
Delete all `create-expo-app` scaffolding and lay down the eleven-directory structure.

**Read first**

- `docs/decisions.md` (ADR-02, ADR-05)
- `docs/coding-standards.md` — Folder Structure
- `docs/roadmap.md` — Phase 1 deletion list

**May modify**

```text
src/**
scripts/**
app.json          (remove the `web` block only)
README.md         (rewrite for SnoozePulse)
package.json      (remove the `web` and `reset-project` scripts)
```

**Must not modify**

```text
docs/**
tsconfig.json
eslint.config.js
assets/**
```

**Acceptance criteria**

- Every file on the Phase 1 deletion list is gone.
- These directories exist: `src/app`, `src/components/ui`, `src/features`, `src/hooks`,
  `src/native`, `src/repositories`, `src/services`, `src/store`, `src/theme`, `src/types`,
  `src/utils`.
- `src/app/_layout.tsx` and `src/app/index.tsx` are reduced to a minimal bootable shell with
  no imports of deleted files.
- No `.web.tsx` file remains anywhere; the `web` block is gone from `app.json`.
- `npm run typecheck` passes with zero errors.
- README describes SnoozePulse, not the Expo starter.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

The app must boot to a blank screen with no red box and no console warnings.

**STOP.** Show the deleted file list and a screenshot of the blank boot. Wait for review.

---

## Task 1.3 — NativeWind installation and configuration

**Objective**
Install and wire NativeWind v5 so styling works, leaving the `@theme` block empty for Task
1.4 to populate from theme tokens.

**Read first**

- `docs/decisions.md` (ADR-20, ADR-06)
- `docs/coding-standards.md` — Styling
- `docs/ui-guidelines.md`
- https://www.nativewind.dev/v5/getting-started/installation — follow the v5 guide, not v4

**Install** (ADR-20)

```bash
npx expo install nativewind@preview react-native-css@latest
npx expo install --dev tailwindcss @tailwindcss/postcss postcss
```

Then pin the override in `package.json`:

```json
{ "overrides": { "lightningcss": "1.30.1" } }
```

Without the pin, `global.css` fails with deserialization errors at build time.

**May modify**

```text
package.json            (approved installs + lightningcss override)
package-lock.json
babel.config.js         (create or modify)
metro.config.js         (create or modify)
postcss.config.mjs      (create)
global.css              (create — NativeWind entry stylesheet)
nativewind-env.d.ts     (create)
src/app/_layout.tsx     (import the stylesheet only)
src/app/index.tsx       (temporary className proof only; reverted before STOP)
tsconfig.json           (types entry only)
```

**Must not modify**

```text
src/theme/**
src/components/**
src/features/**
docs/**
app.json
```

**Acceptance criteria**

- A `className` on a `View` visibly applies on a running Android device.
- `metro.config.js` wraps the default config with `withNativewind(config)`. v5 takes no CSS
  path argument — unlike v4, the stylesheet is linked by importing it in `src/app/_layout.tsx`.
- `global.css` uses the v5 at-rules (`@import "tailwindcss/theme.css" layer(theme)` and
  siblings), not the legacy `@tailwind` directives.
- The `@theme` block contains **no literal color, spacing, or radius values**. It is left
  empty and populated from `src/theme/` in Task 1.4.
- `nativewind-env.d.ts` contains a triple-slash reference to `react-native-css/types`. It must
  not be named `nativewind.d.ts` or `app.d.ts`, or the types will not be picked up.
- **There is no `tailwind.config.js`.** Tailwind 4 defines theme in CSS (ADR-20).
- Reanimated and NativeWind coexist; the app runs and the Android bundle builds.
- `npm run typecheck` and `npm run lint` clean.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

Requires the Android SDK: this is the first task whose acceptance criterion cannot be proven
without a running emulator or device.

**STOP.** Confirm a `className` renders, with a screenshot. Wait for review.

---

## Task 1.4 — Theme system with sampled color tokens

**Objective**
Build the token layer and make it the single source of truth for Tailwind.

**Read first**

- `docs/decisions.md` (ADR-06, ADR-07)
- `docs/ui-guidelines.md` — Colors, the sampling table, Typography, Spacing
- `docs/SnoreTracker_App_PRD_Specification.md` §6
- The four reference images — these are the source of every non-base color

**May modify**

```text
src/theme/**
global.css              (@theme block only)
app.json                (expo-font plugin registration, only if build-time embedding is used)
src/app/_layout.tsx     (font loading only)
```

**Must not modify**

```text
src/components/**
src/features/**
docs/**
```

**Acceptance criteria**

- `colors.ts`, `spacing.ts`, `typography.ts`, `radius.ts`, `shadows.ts` exist.
- The five base tokens match `ui-guidelines.md` exactly.
- **Every additional color token is sampled pixel-by-pixel from a reference image.** No
  value is guessed. Each carries a comment naming the source image and the element sampled.
- Every token group in the `ui-guidelines.md` sampling table is covered: warning/amber, the
  three text tints, card border, OLED background, active accent, hero gradient, timeline
  gradient, and tab bar.
- Inter is bundled and loaded via `expo-font`; the splash screen holds until fonts are ready.
  Task 1.2 removed the previous `preventAutoHideAsync()` call, so reintroduce the hold and its
  matching `hideAsync()` together.
- Spacing is exactly `xs 4 / sm 8 / md 16 / lg 24 / xl 32`.
- The `@theme` block in `global.css` is generated from `src/theme/` — changing a token changes
  the utility. Under Tailwind 4 this means emitting CSS custom properties, not a JavaScript
  config object; there is no `tailwind.config.js` (ADR-20). `src/theme/` remains the single
  source of truth, and no literal value is written directly into the CSS.

**Deliverable alongside the code**
A provenance table: token name, hex, source image, element sampled.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

**STOP.** Post the provenance table. Wait for review before any screen work begins.

---

## Task 1.5 — Shared types

**Objective**
Define the domain vocabulary. Types only — no logic, no implementations.

**Read first**

- `docs/api-contracts.md` — all of it
- `docs/decisions.md` (ADR-10, ADR-11, ADR-14)
- `docs/architecture.md` §3 — the state machine
- `docs/coding-standards.md` — Naming

**May modify**

```text
src/types/**
```

**Must not modify**

```text
everything else
```

**Acceptance criteria**

- `SessionState` models `IDLE | STARTING | RECORDING | PAUSED | STOPPING | COMPLETED | ERROR`.
- `AudioLevelEvent` includes `sessionId` (ratified change).
- `SnoreEvent.audioPath` is `string | null` (ratified change).
- `SleepSession`, `SessionBucket`, and the analytics models exist.
- A typed error union exists — errors are typed, never raw throws.
- Zero uses of `any`. Zero runtime code: this task emits types only.

**Validation**

```bash
npm run typecheck
npm run lint
```

**STOP.** Wait for review.

---

## Task 1.6 — Interfaces and the composition root contract

**Objective**
Declare every interface the app depends on, plus the shape of the composition root. No
implementations of any kind.

**Read first**

- `docs/api-contracts.md`
- `docs/decisions.md` (ADR-12, ADR-18, ADR-19)
- `docs/architecture.md` §2.1, §2.2
- `docs/native-audio.md`

**May modify**

```text
src/native/**          (IAudioEngine only)
src/repositories/**    (interfaces only)
src/services/**        (interfaces only)
src/store/**           (composition root type only)
```

**Must not modify**

```text
src/types/**
src/theme/**
src/app/**
```

**Acceptance criteria**

- `IAudioEngine`, `ISleepRepository`, `ISnoreRepository`, `IAudioService`, `ISleepService`,
  `IAnalyticsService` all defined with full parameter and return types.
- `ISleepRepository.listSessions()` is paginated.
- Repository interfaces expose no business-rule method; service interfaces expose no SQL.
- A `Container` type describes what the composition root provides.
- Zero classes, zero function bodies, zero `TODO`.

**Validation**

```bash
npm run typecheck
npm run lint
```

**STOP.** M1 complete. Wait for review before starting M2.

---

# Milestone 2 — Navigation & UI Primitives

Goal: the app's routing skeleton and every reusable visual primitive, verified against the
reference images before any screen is assembled from them.

Exit condition for M2: all four routes are reachable, and every primitive renders in
isolation using only theme tokens.

---

## Task 2.1 — Navigation shell

**Objective**
Build the Expo Router structure. Routes render placeholder text only.

**Read first**

- `docs/decisions.md` (ADR-01, ADR-09)
- `docs/design-spec.md` — Navigation Map
- `docs/ui-guidelines.md` — Accessibility
- https://docs.expo.dev/versions/v57.0.0/sdk/router.md

**May modify**

```text
src/app/**
src/types/navigation.ts    (create)
```

**Must not modify**

```text
src/components/**
src/features/**
src/theme/**
```

**Acceptance criteria**

- Tab routes: Home and History.
- Non-tab routes: Active Session (full screen, tab bar hidden, no back gesture), Summary
  (pushed, back + share affordances), Settings (pushed from the Home header).
- **No Insights or Profile route exists** (ADR-09).
- Route params are typed; `typedRoutes` compiles.
- Safe areas respected on all routes.
- Every tab and header control has an `accessibilityLabel` and a 44×44 minimum target.
- Screens contain a placeholder label and nothing else.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

Manually reach all five routes.

**STOP.** Wait for review.

---

## Task 2.2 — Layout primitives

**Objective**
`Screen`, `Card`, `SectionHeader` — the structural spine every screen composes from.

**Read first**

- `docs/ui-guidelines.md` — Components, Spacing, Pixel Accuracy
- `docs/design-spec.md`
- `docs/summary-screen.jpg` and `docs/history-screen.jpg` for card geometry

**May modify**

```text
src/components/ui/**
```

**Must not modify**

```text
src/app/**
src/features/**
src/theme/**
```

**Acceptance criteria**

- `Screen` handles safe area, background token, and scroll vs fixed variants.
- `Card` supports the three widths visible in the images: full-bleed, half-width pair, and
  a three-column metric strip.
- `SectionHeader` matches the "Snoring Timeline" / "Weekly Comparison" treatment.
- Zero literal style values — tokens only.
- Each primitive is under ~200 lines and has one responsibility.

**Validation**

```bash
npm run typecheck
npm run lint
```

**STOP.** Wait for review.

---

## Task 2.3 — Content primitives

**Objective**
`Button`, `StatusCard`, `MetricCard`.

**Read first**

- `docs/home-screen.jpg` — the three status cards and the hero button
- `docs/summary-screen.jpg` — the metric strip and the half-width metric pair
- `docs/ui-guidelines.md` — Accessibility, Animation

**May modify**

```text
src/components/ui/**
```

**Must not modify**

```text
src/app/**
src/features/**
src/theme/**
```

**Acceptance criteria**

- `StatusCard` supports the three states visible on Home: alert, success, and informational,
  each with a leading icon, title, subtitle, and optional trailing element.
- `MetricCard` supports a large value with a unit, a caption, and an optional trailing icon.
- `Button` includes the hero variant (gradient fill, ring, glow) built from gradient tokens.
- Every interactive element has an `accessibilityLabel` and meets 44×44.
- Transitions are Reanimated, 150–250 ms.

**Validation**

```bash
npm run typecheck
npm run lint
```

**STOP.** Wait for review.

---

## Task 2.4 — Data visualisation primitives

**Objective**
`Waveform` and `TimelineCard`, the two components with real performance constraints.

**Read first**

- `docs/decisions.md` (ADR-13)
- `docs/architecture.md` §3.1 — the live audio render path
- `docs/active-session.jpg` — live waveform
- `docs/summary-screen.jpg` — timeline bars and the peak callout
- `docs/SnoreTracker_App_PRD_Specification.md` §8

**May modify**

```text
src/components/ui/**
```

**Must not modify**

```text
src/app/**
src/features/**
src/store/**
```

**Acceptance criteria**

- `Waveform` reads a Reanimated **shared value** and never a React state value (ADR-13).
  Its props accept a shared value, not a number.
- Updating the shared value at 10 Hz causes **zero** React re-renders — prove this with a
  render counter.
- `TimelineCard` renders bars with the sampled intensity gradient, dB axis, time axis, and
  the peak callout, and exposes an `onBarPress` callback.
- Both use `react-native-svg`; neither allocates per frame.
- Bars are individually accessible with a value-bearing label.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

**STOP.** Report the render count under a simulated 10 Hz stream. Wait for review.

---

## Task 2.5 — Primitive audit

**Objective**
Review only. No code changes.

**Read first**

- All four reference images
- `docs/ui-guidelines.md` — Pixel Accuracy
- Everything built in Tasks 2.2 – 2.4

**May modify**

```text
nothing
```

**Acceptance criteria**
A written report covering:

- Each primitive rendered next to the image region it derives from.
- Layout deviation measured against the ±4 px and ±2 px targets.
- Any hardcoded value found anywhere in `src/components/ui/**`.
- Any duplicated primitive.
- A list of gaps to fix before M3, with a recommendation for each.

**Validation**

```bash
npx expo start --android
```

Screenshots on the Android emulator (ADR-17).

**STOP.** M2 complete. Wait for review before starting M3.

---

# Milestone 3 — Screens (mock data)

Goal: all four screens visually complete, driven entirely by mock data.

Nothing in this milestone may import from `src/store/`, `src/repositories/`, or
`src/native/`. Mock data lives in each feature folder and is deleted in Task 5.3.

Exit condition for M3: all four screens match their reference images within tolerance.

---

## Task 3.1 — Home screen

**Objective**
Build Home from the primitives, with mock data.

**Read first**

- `docs/home-screen.jpg` — the authority for this task
- `docs/decisions.md` (ADR-08, ADR-09)
- `docs/design-spec.md`, `docs/ui-guidelines.md`
- `docs/SnoreTracker_App_PRD_Specification.md` §4 Home

**May modify**

```text
src/features/home/**
src/components/ui/**       (only to fix a gap found in Task 2.5)
src/app/(tabs)/index.tsx
package.json               (expo-battery, expo-keep-awake install)
```

**Must not modify**

```text
src/store/**
src/repositories/**
src/native/**
src/theme/**
```

**Acceptance criteria**

- Header reads **SnoozePulse**, not "SnoreCare" (ADR-08), with the gear icon routing to
  Settings.
- Hero start button, the two-line headline, the three-line subhead, and the three status
  cards all match the image.
- Status cards cover battery, microphone permission, and ambient calibration.
- Battery percentage comes from `expo-battery`; permission and calibration are mock.
- Everything else is mock data declared in one file.
- No import from store, repositories, or native.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

**STOP.** Wait for review.

---

## Task 3.2 — Home visual review

**Objective**
Review only. No code changes.

**Read first**

- `docs/home-screen.jpg`
- `docs/ui-guidelines.md` — Pixel Accuracy

**May modify**

```text
nothing
```

**Acceptance criteria**
A side-by-side report: emulator screenshot against the reference, deviations measured
against tolerance, missing elements listed, and a prioritised fix list.

**Validation**

```bash
npx expo start --android
```

**STOP.** Wait for review. Fixes are applied on instruction, not automatically.

---

## Task 3.3 — Active Session screen

**Objective**
Build the full-screen monitoring surface with a mock-driven waveform.

**Read first**

- `docs/active-session.jpg`
- `docs/decisions.md` (ADR-13, ADR-14)
- `docs/architecture.md` §3, §3.1

**May modify**

```text
src/features/session/**
src/app/session/active.tsx
src/components/ui/**       (gap fixes only)
```

**Must not modify**

```text
src/store/**
src/repositories/**
src/native/**
```

**Acceptance criteria**

- Pure-black OLED background token, no tab bar, no back gesture.
- Live clock, status line, waveform, and the audio level label.
- **Slide to end session** is the only control. No pause control exists (ADR-14).
- The waveform is driven by a mock generator writing to a shared value at 10 Hz, with zero
  React re-renders.
- The screen keeps the device awake via `expo-keep-awake`.
- Slide gesture uses `react-native-gesture-handler` and has an accessible alternative.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

**STOP.** Wait for review.

---

## Task 3.4 — Summary screen

**Objective**
Build the morning summary with mock data.

**Read first**

- `docs/summary-screen.jpg`
- `docs/SnoreTracker_App_PRD_Specification.md` §4 Morning Summary
- `docs/decisions.md` (ADR-10, ADR-11)

**May modify**

```text
src/features/summary/**
src/app/session/[id]/summary.tsx
src/components/ui/**       (gap fixes only)
```

**Must not modify**

```text
src/store/**
src/repositories/**
src/native/**
```

**Acceptance criteria**

- Date navigator, the three-metric strip, the half-width metric pair, the loudest-episode
  card, the timeline chart, and the snippet list all match the image.
- The snore score renders as a label plus the five-dot scale, using the sampled amber token.
- Timeline is fed mock bucket data shaped like `SessionBucket`, so Task 5.3 is a data swap.
- Snippet rows show a play affordance, timestamp, dB, duration, mini-waveform, and length.
  Playback is inert in this task.
- "Tap on any bar to hear audio" is present and wired to a no-op handler.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

**STOP.** Wait for review.

---

## Task 3.5 — History screen

**Objective**
Build the trends screen with mock data.

**Read first**

- `docs/history-screen.jpg`
- `docs/SnoreTracker_App_PRD_Specification.md` §4 History
- `docs/decisions.md` (ADR-09, ADR-10)

**May modify**

```text
src/features/history/**
src/app/(tabs)/history.tsx
src/components/ui/**       (gap fixes only)
```

**Must not modify**

```text
src/store/**
src/repositories/**
src/native/**
```

**Acceptance criteria**

- 7 Days / 30 Days segmented control, the day strip with per-day score labels and the
  selected-day ring, the improvement card with its trend line, the weekly comparison table,
  and the insights card.
- Comparison rows use the sampled success and warning tokens for direction.
- All values are mock; percentages are not computed here.
- Segmented control is keyboard and screen-reader accessible.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

**STOP.** Wait for review.

---

## Task 3.6 — Consolidated visual review

**Objective**
Review only. No code changes.

**Read first**

- All four reference images
- `docs/ui-guidelines.md` — Pixel Accuracy
- The Task 3.2 report, to confirm Home has not regressed

**May modify**

```text
nothing
```

**Acceptance criteria**
A report covering Active Session, Summary, and History side by side with their references,
plus a cross-screen consistency check: spacing rhythm, card radii, typographic scale, and
information density. Confirm no hardcoded values and no duplicated primitives anywhere in
`src/features/**`.

**Validation**

```bash
npx expo start --android
```

**STOP.** M3 complete. Wait for review before starting M4.

---

# Milestone 4 — Data, State & Analytics

Goal: the full persistence and state layer behind the finished UI, still not connected to it.

Nothing in this milestone modifies `src/features/**` or `src/app/**`. The UI stays on mock
data until Task 5.3.

Exit condition for M4: a session can be created, populated, scored, and read back entirely
through services, exercised by tests, with no UI involvement.

---

## Task 4.1 — Database client, schema and migrations

**Objective**
Stand up SQLite with the three-table schema.

**Read first**

- `docs/SnoreTracker_App_PRD_Specification.md` §5 Storage
- `docs/decisions.md` (ADR-11, ADR-12)
- `docs/roadmap.md` — Phase 15
- https://docs.expo.dev/versions/v57.0.0/sdk/sqlite.md

**May modify**

```text
src/services/database/**
src/types/**              (row types only)
package.json
```

**Must not modify**

```text
src/features/**
src/app/**
src/store/**
src/repositories/**
```

**Acceptance criteria**

- `expo-sqlite` installed; database opened once as an async singleton.
- WAL journaling enabled and `PRAGMA foreign_keys = ON`.
- Migrations are forward-only and driven by `PRAGMA user_version`.
- `sleep_sessions`, `snore_events`, `session_buckets` created per the PRD, with
  `ON DELETE CASCADE` from sessions and a composite index on
  `snore_events(session_id, timestamp)`.
- **`SQLiteProvider` / `useSQLiteContext` are not used** — the client is injectable so
  non-React callers can reach it.
- Opening twice does not run migrations twice.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

Log the resolved `user_version` and the table list on boot.

**STOP.** Wait for review.

---

## Task 4.2 — Repository implementations

**Objective**
Implement `ISleepRepository` and `ISnoreRepository`. SQL only.

**Read first**

- `docs/api-contracts.md` — Repository Interfaces
- `docs/decisions.md` (ADR-19)
- `docs/architecture.md` §2.1

**May modify**

```text
src/repositories/**
```

**Must not modify**

```text
src/services/**
src/store/**
src/features/**
src/app/**
```

**Acceptance criteria**

- Both interfaces fully implemented against the injected client.
- `saveSnoreEvents()` writes a batch inside one `withTransactionAsync`.
- `listSessions()` is paginated.
- `deleteSession()` cascades to events and buckets and returns the snippet paths it
  orphaned, so a service can delete the files. The repository does **not** touch the
  filesystem.
- Rows are mapped to domain models; no row type escapes the repository.
- Errors are typed and returned, never swallowed and never rethrown raw.
- **Zero business rules.** No scoring, no retention, no thresholds.

**Validation**

```bash
npm run typecheck
npm run lint
```

**STOP.** Wait for review.

---

## Task 4.3 — Sleep and audio services

**Objective**
Implement the orchestration layer that sits between the store and the repositories.

**Read first**

- `docs/api-contracts.md` — Service Interfaces
- `docs/decisions.md` (ADR-12, ADR-15, ADR-18, ADR-19)
- `docs/architecture.md` §2.1, §2.2, §3
- `docs/native-audio.md` — Snippet Storage

**May modify**

```text
src/services/**
src/utils/**
```

**Must not modify**

```text
src/repositories/**
src/store/**
src/features/**
src/app/**
modules/**
```

**Acceptance criteria**

- `SleepService` owns session create and finish, readiness checks, and the retention policy
  of 30 days or 500 MB whichever comes first (ADR-15).
- `AudioService` owns the state machine transitions and event batching. It depends on
  `IAudioEngine` — injected, never constructed (ADR-18). No engine implementation exists
  yet, so it is exercised against a fake.
- Illegal state transitions are rejected, not silently applied.
- Snore events are buffered and flushed on a size or time trigger, with a guaranteed flush
  on `STOPPING`.
- **Zero SQL** anywhere in `src/services/`.

**Validation**

```bash
npm run typecheck
npm run lint
```

**STOP.** Wait for review.

---

## Task 4.4 — Zustand store and composition root

**Objective**
Build the state container and the single place the object graph is assembled.

**Read first**

- `docs/api-contracts.md` — Zustand Store, Layering
- `docs/decisions.md` (ADR-12, ADR-13, ADR-14, ADR-18)
- `docs/architecture.md` §2.1, §2.2, §3, §3.1

**May modify**

```text
src/store/**
src/hooks/**
src/app/_layout.tsx     (mount the composition root only)
```

**Must not modify**

```text
src/services/**
src/repositories/**
src/features/**
```

**Acceptance criteria**

- Three slices: session, audio, settings.
- Session slice owns guarded state machine transitions and is the only place a transition
  happens.
- Store exposes exactly the contract in `api-contracts.md`.
- `currentDecibel` is updated at a throttled rate, not at event rate (ADR-13).
- `pauseSession` / `resumeSession` are callable only by the audio layer; no UI path reaches
  them (ADR-14).
- **The store imports nothing from `src/repositories/`** (ADR-12).
- **The store contains no `new`** — services arrive by injection (ADR-18).
- A single composition root builds the graph at app start and is the only file that
  constructs concrete classes.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo start --android
```

Grep proof: no `repositories` import inside `src/store/`.

**STOP.** Wait for review.

---

## Task 4.5 — Analytics service

**Objective**
Implement scoring, aggregation, and comparisons as replaceable V1 heuristics.

**Read first**

- `docs/decisions.md` (ADR-10, ADR-11)
- `docs/SnoreTracker_App_PRD_Specification.md` §5 Scoring
- `docs/coding-standards.md` — Deferred Implementations
- `docs/summary-screen.jpg` and `docs/history-screen.jpg` for the output shapes

**May modify**

```text
src/services/analytics/**
src/utils/**
src/types/**            (analytics models only)
```

**Must not modify**

```text
src/store/**
src/repositories/**
src/features/**
src/app/**
```

**Acceptance criteria**

- Sleep score and snore score are each **one pure function** with all weighting constants in
  a single named block, and a doc comment marking them V1 heuristics for V2 replacement
  (ADR-10).
- Inputs are limited to recorded statistics: snore count, total snoring time, peak loudness,
  session duration. **No medical or clinical scoring is invented.**
- Score-to-label mapping (Mild / Moderate / Heavy) and the five-dot scale are derived from
  one threshold table.
- Bucket aggregation produces `SessionBucket` rows matching the mock shape used in Task 3.4,
  so integration is a data swap.
- Weekly and monthly comparison produces the percentage deltas shown on History, with the
  baseline documented.
- Every function is pure and side-effect free. No `TODO`, no stub, no throw.

**Validation**

```bash
npm run typecheck
npm run lint
```

**STOP.** M4 complete. Wait for review before starting M5.

---

# Milestone 5 — Native Audio, Integration & Release

Goal: the real audio engine, the end-to-end wiring, and the release gates.

### Platform Validation

This project targets both Android and iOS.

Implementation requirements:

- Build native implementations for Android (Kotlin) and iOS (Swift).
- Validate runtime behavior on Android during development.
- Keep shared TypeScript code platform-agnostic.
- Defer iOS runtime verification until a macOS build environment is available.

Note on platform: the development machine is Windows, so iOS cannot be compiled locally.
Swift is written and reviewed but validated later via EAS Build. Android is the verification
target throughout (ADR-17).

Exit condition for M5: a real overnight session records, detects, persists, scores, and
displays with no mock data anywhere.

---

## Task 5.1 — Native module scaffold and platform configuration

**Objective**
Create the Expo local module and get background recording permissions configured. No DSP.

**Read first**

- `docs/native-audio.md` — all of it
- `docs/decisions.md` (ADR-16)
- `docs/api-contracts.md` — IAudioEngine
- https://docs.expo.dev/versions/v57.0.0/sdk/audio.md
- Expo Modules API docs for SDK 57

**May modify**

```text
modules/snoozepulse-audio/**
src/native/**
app.json
package.json
```

**Must not modify**

```text
src/store/**
src/services/**
src/features/**
src/repositories/**
```

**Acceptance criteria**

- `expo-audio` and `expo-file-system` installed.
- Module scaffolded at `modules/snoozepulse-audio/` with `expo-module.config.json`, `ios/`,
  `android/`, and `src/` (ADR-16).
- Android gains `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `POST_NOTIFICATIONS`
  and a declared microphone foreground service.
- iOS gains `UIBackgroundModes: ["audio"]`.
- `src/native/` contains the wrapper implementing `IAudioEngine`, adapting module events into
  domain events. It is the only file importing the module.
- Permission request and status round-trip works on a device.
- Events emit as a heartbeat stub; **no DSP yet**.
- Prebuild succeeds and the dev build installs on Android.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo prebuild --clean
npx expo run:android
```

**STOP.** Confirm the permission prompt and the foreground service notification. Wait for review.

---

## Task 5.2 — Native audio engine

**Objective**
Implement capture and DSP in Swift and Kotlin.

**Read first**

- `docs/native-audio.md`
- `docs/architecture.md` §3, §3.1
- `docs/SnoreTracker_App_PRD_Specification.md` §5 Detection, §8

**May modify**

```text
modules/snoozepulse-audio/ios/**
modules/snoozepulse-audio/android/**
modules/snoozepulse-audio/src/**
```

**Must not modify**

```text
src/**
```

**Acceptance criteria**

- Kotlin `AudioRecord` and Swift `AVAudioEngine` capture into a fixed-size ring buffer with
  no per-frame allocation.
- RMS, peak, and dB computed natively. Snore detection runs against the calibrated ambient
  baseline. Ambient calibration is implemented.
- **No raw PCM ever crosses the bridge.**
- `AudioLevelEvent` emitted on a native throttle of 100–200 ms, carrying `sessionId`.
- 5-second snippets written to the **document** directory, never the cache directory.
- When a snippet cannot be written, the `SnoreEvent` still emits with `audioPath: null`.
- Audio session arbitration implemented; system interruption drives pause and resume
  (ADR-14).
- On Android 14+ the foreground service starts while the app is foregrounded.
- Memory is flat across a long run — **soak verification deferred to Task 5.3** (see
  Validation dependency below). Not treating an incomplete soak as a Task 5.2 failure:
  Task 5.2 must not modify `src/**`, so no UI recording path exists yet.

**Validation — completed**

```bash
npm run typecheck   # pass
npm run lint        # pass
npx expo run:android  # BUILD SUCCESSFUL; app launched on emulator
```

**Validation — Blocked by Task 5.3**

Record for 30+ minutes with the screen locked. Report memory at start and end.

This soak **cannot** run in Task 5.2: Home and session flows still use M3 mocks, so the
app never starts native capture from the UI. Do not fabricate results or add a temporary
harness that bypasses the product path.

**Dependency (carry-forward):** Originally owned by Task 5.3 after live recording landed.
**Plan amendment:** soak deferred again to **Task 5.6** (performance / RC) so Task 5.4 can
proceed after short E2E proof. Not a Task 5.2 or 5.3 failure.

**STOP.** Task 5.2 is complete pending review for the items that *can* be validated now.
The soak remains open and owned by Task 5.3 — not a Task 5.2 failure. iOS remains
unvalidated locally (Windows host); note it explicitly. Wait for review.

---

## Task 5.3 — End-to-end integration

**Objective**
Replace every piece of mock data with live data through the full chain.

**Read first**

- `docs/architecture.md` §2.1
- `docs/decisions.md` (ADR-12, ADR-13, ADR-18)
- Every mock file created in M3
- Task 5.2 Validation — Blocked by Task 5.3 (locked-screen memory soak carry-forward)

**May modify**

```text
src/features/**
src/app/**
src/store/**
src/services/**
src/native/**
```

**Must not modify**

```text
src/theme/**
modules/**
docs/**
```

**Acceptance criteria**

- Chain live end to end: UI → Store → Services → Repositories → SQLite / Native.
- **Every mock data file from M3 is deleted.** Zero remain.
- The waveform is driven by real events through the shared value, still with zero React
  re-renders at 10 Hz (ADR-13).
- Start on Home transitions the state machine and routes to Active Session; slide-to-end
  finalises the session and routes to Summary.
- Summary and History render real persisted data with real computed scores.
- No screen imports a repository or the native module directly.
- A full recorded session survives an app restart.
- **Carry-forward from Task 5.2 (30+ min soak):** see Validation — deferred below. Short
  live sessions on Android emulator after reboot confirmed mic → waveform → snore →
  Summary (not a substitute for the locked-screen soak).

**Validation — completed (short live sessions)**

```bash
npm run typecheck
npm run lint
npx expo run:android
```

Full loop exercised: start, record (minutes-scale), end, Summary with real scores/snippets,
History with persisted day column. Mic/waveform responded after host reboot (emulator still
flaky on long capture / focus).

**Validation — Blocked / deferred to Task 5.6**

Record for 30+ minutes with the screen locked. Report memory at start and end.

**Explicit plan amendment:** the 30+ minute locked-screen memory soak is **not** treated as
a Task 5.3 failure. Short E2E proof is enough to proceed to Task 5.4. The soak (and the
broader 8-hour performance pass) is owned by **Task 5.6** — do not skip it at RC without
another amendment.

**STOP.** Task 5.3 complete pending review for items validated above. Soak remains open → 5.6.

---

## Task 5.4 — Charts and audio playback

**Objective**
Make the timeline interactive and snippets playable.

**Read first**

- `docs/roadmap.md` — Phase 21
- `docs/summary-screen.jpg`
- `docs/native-audio.md` — Relationship to expo-audio
- https://docs.expo.dev/versions/v57.0.0/sdk/audio.md

**May modify**

```text
src/features/summary/**
src/features/history/**
src/components/ui/**
src/services/**
```

**Must not modify**

```text
src/repositories/**
modules/**
src/theme/**
```

**Acceptance criteria**

- Timeline chart is backed by `session_buckets`, never recomputed from raw events.
- Tapping a bar plays the loudest snore event within that bucket's time range.
- Snippet rows play, pause, and show progress.
- **Playback and capture never hold the audio session simultaneously** — arbitration lives
  in the engine and is enforced.
- A snippet whose `audioPath` is `null` renders in a disabled state, never a crash.
- History trend line and comparison values come from the analytics service.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo run:android
```

Attempt playback during an active recording and confirm it is refused cleanly.

**STOP.** Wait for review.

---

## Task 5.5 — Error handling, retention and accessibility

**Objective**
Close every failure path and complete the accessibility pass.

**Read first**

- `docs/roadmap.md` — Phases 22 and 23
- `docs/decisions.md` (ADR-15)
- `docs/ui-guidelines.md` — Accessibility
- `docs/coding-standards.md` — Error Handling
- `docs/SnoreTracker_App_PRD_Specification.md` §9

**May modify**

```text
src/services/**
src/store/**
src/features/**
src/components/ui/**
src/app/**
```

**Must not modify**

```text
modules/**
src/theme/**
docs/**
```

**Acceptance criteria**

- Permission denial, database failure, storage full, and native failure each have a typed
  error, a recovery path, and a user-facing state. None is swallowed.
- The `ERROR` state is reachable and recoverable from the UI.
- Retention enforced: 30 days or 500 MB whichever first, automatic, with session deletion
  removing snippets and orphaned files reclaimed at app start (ADR-15).
- Every interactive element has an `accessibilityLabel` and meets 44×44.
- Dynamic font scaling does not break any layout at the largest system size.
- Safe areas correct on notched and gesture-navigation devices.

**Validation**

```bash
npm run typecheck
npm run lint
npx expo run:android
```

Manually: deny permission, fill storage, force a DB error, enable TalkBack, set the largest
font size.

**STOP.** Wait for review.

---

## Task 5.6 — Tests, performance and release candidate

**Objective**
Install the test tooling, write the pyramid, run the performance pass, and cut the RC.

**Read first**

- `docs/testing-strategy.md` — all of it
- `docs/roadmap.md` — Phases 24 and 25
- `docs/SnoreTracker_App_PRD_Specification.md` §8, §11

**May modify**

```text
**/__tests__/**
jest.config.js
package.json
README.md
docs/**            (documentation-updated requirement only)
```

**Must not modify**

```text
application source, except to fix a defect a test reveals
```

**Acceptance criteria**

- `jest`, `jest-expo`, `@testing-library/react-native` installed; `npm test` works.
- Unit tests: analytics, date utilities, both scores, repository methods, state machine
  transition guards including rejection of illegal transitions, and the retention policy.
- Component tests: rendering, interaction, accessibility, theme compliance.
- Integration tests: recording lifecycle, SQLite persistence, store updates, navigation.
- Performance verified: memory flat across an 8-hour run, the audio stream triggers no React
  renders, animations hold frame rate, battery impact measured.
- **Carry-forward:** 30+ minute locked-screen memory soak from Tasks 5.2 / 5.3 — report
  start vs end PSS; closes that open validation item.
- Release gates: typecheck clean, lint clean, tests green, zero runtime warnings, zero
  `TODO`, documentation current.
- Manual QA checklist from `testing-strategy.md` completed on Android; iOS items explicitly
  marked deferred.

**Validation**

```bash
npm run typecheck
npm run lint
npm test
npx expo run:android --variant release
```

**STOP.** M5 complete. Report the RC status and wait for the instruction to commit.

---

# Progress Tracker

| Task | Title                                     | Status      |
| ---- | ----------------------------------------- | ----------- |
| 1.1  | Toolchain and M1 dependencies             | Complete    |
| 1.2  | Remove starter template, create folders   | Complete    |
| 1.3  | NativeWind installation and configuration | Not started |
| 1.4  | Theme system with sampled tokens          | Not started |
| 1.5  | Shared types                              | Not started |
| 1.6  | Interfaces and composition root contract  | Not started |
| 2.1  | Navigation shell                          | Not started |
| 2.2  | Layout primitives                         | Not started |
| 2.3  | Content primitives                        | Not started |
| 2.4  | Data visualisation primitives             | Not started |
| 2.5  | Primitive audit                           | Not started |
| 3.1  | Home screen                               | Not started |
| 3.2  | Home visual review                        | Not started |
| 3.3  | Active Session screen                     | Not started |
| 3.4  | Summary screen                            | Not started |
| 3.5  | History screen                            | Not started |
| 3.6  | Consolidated visual review                | Not started |
| 4.1  | Database client, schema, migrations       | Not started |
| 4.2  | Repository implementations                | Not started |
| 4.3  | Sleep and audio services                  | Not started |
| 4.4  | Zustand store and composition root        | Not started |
| 4.5  | Analytics service                         | Not started |
| 5.1  | Native module scaffold and config         | Complete    |
| 5.2  | Native audio engine                       | Complete (soak → 5.6) |
| 5.3  | End-to-end integration                    | Complete (soak → 5.6) |
| 5.4  | Charts and audio playback                 | In review   |
| 5.5  | Error handling, retention, accessibility  | Not started |
| 5.6  | Tests, performance, release candidate     | Not started |
