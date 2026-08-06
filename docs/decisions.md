# Architecture Decision Record

Decisions ratified at the end of Phase 0 (Architecture Review).

This document is the tie-breaker. Where any other document in `docs/` or any rule in
`.cursor/rules/` disagrees with a decision recorded here, this document wins and the
other document is considered stale and should be corrected.

---

## ADR-01 — Navigation: Expo Router

Navigation is implemented using **Expo Router**, which satisfies the React Navigation
requirement in `.cursor/rules/02-tech-stack.mdc` because Expo Router is built on top of
React Navigation.

Rationale: already scaffolded, file-based routing, and a clean path to deep linking.

Routes live in `src/app/`, not a top-level `app/`.

---

## ADR-02 — Remove the starter template

The `create-expo-app` template code is deleted in Phase 1. See the Phase 1 deletion list
in `roadmap.md` for the exact files.

Web is **not** a supported target. Android and iOS only. `.web.tsx` variants are removed
and no new ones are created.

---

## ADR-03 — Dependencies are installed per milestone

No dependency is installed before the milestone that needs it. See the milestone
dependency table in `roadmap.md`.

---

## ADR-04 — `typecheck` script

`package.json` provides `"typecheck": "tsc --noEmit"`. Every phase gate runs it.

---

## ADR-05 — Folder structure

The full eleven-directory structure is used. See `coding-standards.md`.

---

## ADR-06 — Colors are sampled, never invented

Additional design tokens beyond the five documented brand colors are produced by
**sampling pixels directly from the reference images** in `docs/`. No token value may be
guessed, eyeballed, or generated. See `ui-guidelines.md` for the sampling procedure and
the list of tokens that must be sampled.

---

## ADR-07 — Typography: bundle Inter

Inter is bundled via `expo-font` and `@expo-google-fonts/inter` so Android and iOS render
identically. The "Inter / SF Pro / Roboto" list in earlier documents was a fallback stack,
not a per-platform mandate.

---

## ADR-08 — Branding: SnoozePulse

The product is **SnoozePulse** everywhere. The reference images render "SnoreCare"; that
string is a mockup artifact and is not implemented. This is the one place where a string
in the images is deliberately not reproduced.

---

## ADR-09 — Scope is four screens

The product is Home, Active Session, Summary, and History.

The bottom navigation in the reference images shows four tabs including **Insights** and
**Profile**. Those two are **not part of the product** and are not built, not stubbed, and
not placeholdered. The reference images are stale on this point.

Bottom navigation therefore has three tab destinations — Home, History, and a settings
entry point reachable from the Home header gear icon — with Active Session and Summary
presented outside the tab bar. See `design-spec.md` for the navigation map.

---

## ADR-10 — Scoring is deferred to V2

Snore score and sleep score are computed by `IAnalyticsService` using **simple, documented,
weighted metrics** as a V1 placeholder. The agent must not invent medical or clinical
scoring.

The V1 implementation must be a single, clearly isolated, pure function per score so that
it can be replaced wholesale in V2 without touching callers. The weighting constants live
in one named constants block, not scattered through the service.

---

## ADR-11 — Aggregate timeline table

A third table, `session_buckets`, stores pre-aggregated time buckets so the Summary
timeline chart and the History trends never recompute from raw events.

---

## ADR-12 — Strict layering

```text
UI → Store → Services → Repositories → SQLite / Native
```

The store never calls a repository directly. This overrides the looser wording previously
in `api-contracts.md`.

---

## ADR-13 — Waveform bypasses React renders

The ~10 Hz audio level stream drives a Reanimated shared value written directly by the
event subscription. It does not flow through React reconciliation.

The store still exposes `currentDecibel` for non-animated consumers, but it is updated at
a throttled, human-perceptible rate rather than at event rate.

---

## ADR-14 — Pause is system-only

`PAUSED` is entered and exited by the system in response to audio interruptions such as an
incoming call. There is **no user-facing pause control** and none is added to any screen.

---

## ADR-15 — Audio retention

Snore audio snippets are retained for **30 days or 500 MB, whichever limit is reached
first**. Cleanup is automatic. Deleting a session deletes its snippets.

---

## ADR-16 — Native module location

The Swift and Kotlin sources live in a top-level Expo local module:

```text
modules/snoozepulse-audio/
```

`src/native/` holds only the JavaScript-side interface and wrapper.

---

## ADR-17 — Visual verification target

Android Emulator first, then a physical Android device. iOS verification is deferred
because the development machine is Windows.

---

## ADR-18 — Dependency injection

Concrete implementations are never constructed inside a store, a component, or a hook.

```text
IAudioEngine  ←  AudioEngine  (constructed once at composition root)
                     ↓ injected
                   Store
```

Every consumer depends on the interface. A single composition root wires the concrete
graph at app start. This keeps the store testable with a fake engine and a fake database.

---

## ADR-19 — Services and repositories are separate concerns

`services/` holds business logic and orchestration. `repositories/` holds persistence and
nothing else.

```text
services/                    repositories/
  AudioService                 SleepRepository
  SleepService                 SnoreRepository
  AnalyticsService
```

A repository never contains a business rule. A service never contains SQL.
