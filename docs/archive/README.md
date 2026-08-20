# Archive

Shipped plans and the product-v1 PRD. They are preserved so future contributors
can see how App Store 1.0.0 was built.

**Do not follow these as active plans.** Active work is **M7 — Automatic Sleep
Tracking** (product v2), defined in `docs/roadmap.md` and
`docs/implementation-plan.md`. See ADR-33.

## What is here

| File | Original path | Snapshot taken at |
| ---- | ------------- | ----------------- |
| `prd-v1.md` | `docs/SnoreTracker_App_PRD_Specification.md` | App Store 1.0.0 (product v1) |
| `roadmap-m1-m5.md` | `docs/roadmap.md` | End of M5 (Task 5.6 RC-1) |
| `implementation-plan-m1-m5.md` | `docs/implementation-plan.md` | End of M5 (Task 5.6 RC-1) |
| `roadmap-m6.md` | `docs/roadmap.md` | End of M6 / product v1 release |
| `implementation-plan-m6.md` | `docs/implementation-plan.md` | End of M6 / product v1 release |

## Product v1 (what shipped)

App Store / Play Store **1.0.0** is product v1. It includes:

- Four screens: Home, Active Session, Summary, History, plus Settings and first-run onboarding (ADR-09, ADR-30).
- Manual **Start Sleep Session** as the nightly interaction.
- On-device YAMNet snore classification inside `modules/snoozepulse-audio` (ADR-21–ADR-25).
- Confidence-weighted scoring functions historically named "V2 scoring" (ADR-26). That name is a scoring-version label, **not** the App Store version.
- Local SQLite, no backend, wellness positioning (not a medical device).

## M1–M5 vs M6

M5 shipped a loudness-over-baseline detector that could not tell snores from other sounds. M6 replaced it with YAMNet and shipped with product v1.

Task 6.6 (public regression corpus and precision/recall gate) remains **deferred** under ADR-29. The App Store release fired ADR-29's "distributed outside the development team" trigger; the corpus is a **hardening backlog** item, not the product-v2 headline. Re-open it before changing the detection pipeline.

## What remains in force from v1

- Strict layering `UI → Store → Services → Repositories → SQLite / Native`.
- `IAudioEngine`, `SnoreEvent`, and `AudioLevelEvent` as the only audio crossing points.
- Every ADR from ADR-01 through ADR-30, except where a later ADR explicitly supersedes it.
- The native audio engine. Product v2 **starts** that engine; it does not replace it.
