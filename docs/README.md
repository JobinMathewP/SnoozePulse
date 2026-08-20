# Docs

`docs/decisions.md` is the tie-breaker. Where any other document or reference
image disagrees with a ratified ADR, the ADR wins.

## Product versions

| Version | App Store | What it is |
| ------- | --------- | ---------- |
| **Product v1** | 1.0.0 | Manual start, on-device YAMNet, four screens, onboarding, Settings. Shipped. |
| **Product v2** | next | Automatic sleep tracking: schedule once, SnoozePulse starts and ends overnight monitoring. Active. |

Internal ADRs still say "V2 detector" and "V2 scoring". Those are **scoring / detector version labels** from M6. They already shipped inside product v1. Do not confuse them with App Store / product v2.

## Start here

| Document | Role |
| -------- | ---- |
| `decisions.md` | Ratified ADRs. Wins over everything else. |
| `prd.md` | Product-v2 contract (vision, scope, non-goals). |
| `prd-automatic-sleep-tracking.md` | Feature spec for automatic tracking. |
| `roadmap.md` | M7 phases. One phase per prompt. |
| `implementation-plan.md` | Executable M7 tasks. More specific than the roadmap on task scope. |

## Living architecture (still in force)

These describe the shipped v1 system. Product v2 extends them; it does not replace them.

| Document | Role |
| -------- | ---- |
| `architecture.md` | Topology, layering, recording state machine, YAMNet pipeline, sleep-readiness machine |
| `api-contracts.md` | Interfaces and event payloads |
| `native-audio.md` | Native capture / classifier. Auto-start must not duplicate this. |
| `design-spec.md` | Screen map and reference images |
| `ui-guidelines.md` | Tokens and visual rules |
| `coding-standards.md` | Structure and conventions |
| `testing-strategy.md` | Test pyramid and QA |
| `performance-rc.md` | Overnight soak procedure |

## Reference images

`home-screen.jpg`, `active-session.jpg`, `summary-screen.jpg`, `history-screen.jpg`, `mockup.jpg`.

Product v2 may add Settings / Home copy for the sleep schedule. Until a dedicated v2 mock exists, reuse existing primitives and tokens (ADR-06). Do not invent a new visual language.

## Archive

Shipped v1 plans and the v1 PRD live in `archive/`. Do not follow them as active work.

## Documentation priority

When references overlap:

1. `docs/decisions.md`
2. Per-screen reference images, then `docs/mockup.jpg`
3. `docs/prd.md` and `docs/prd-automatic-sleep-tracking.md` (behavior)
4. `docs/design-spec.md` / `docs/ui-guidelines.md` (appearance)
5. `docs/architecture.md`
6. `docs/api-contracts.md`
7. `docs/native-audio.md`
8. `docs/coding-standards.md`
9. `docs/testing-strategy.md`
10. `docs/implementation-plan.md`
11. `docs/roadmap.md`

On task scope, the implementation plan is more specific than the roadmap and takes precedence.
