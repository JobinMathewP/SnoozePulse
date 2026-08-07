# Archive

These are the shipped-M5 plans. They are preserved for provenance so future
contributors can understand why the current native module contained a
loudness-based detector.

**Do not follow these as active plans.** They are superseded by Milestone 6
(Acoustic Recognition), which is defined in the top-level `docs/roadmap.md` and
`docs/implementation-plan.md`.

## What is here

| File | Original path | Snapshot taken at |
| ---- | ------------- | ----------------- |
| `roadmap-m1-m5.md` | `docs/roadmap.md` | End of M5 (Task 5.6 RC-1) |
| `implementation-plan-m1-m5.md` | `docs/implementation-plan.md` | End of M5 (Task 5.6 RC-1) |

## Why M1–M5 was archived

M5 shipped a working native audio engine on Android and iOS debug builds. The
DSP layer, however, was a loudness-over-baseline threshold detector
(`db >= ambientBaselineDb + SNORE_MARGIN_DB`) that could not distinguish snores
from any other sound above the noise floor: coughs, speech, fans, blanket
rustling, and rain all triggered episodes.

M6 replaces that detector with an on-device YAMNet classifier running through
the native TFLite runtime, with NNAPI (Android) and Core ML (iOS) hardware
delegates. See ADR-21 through ADR-28 in `docs/decisions.md` for the ratified
decisions that drove the rewrite.

## Which parts of M1–M5 survive verbatim

- The strict layering `UI → Store → Services → Repositories → SQLite / Native`.
- `IAudioEngine`, `SnoreEvent`, and `AudioLevelEvent` as the only crossing
  points between native and JS (event payloads grow new fields but their
  shapes remain assignable).
- Every ADR from ADR-01 through ADR-20.
- The theme system, navigation shell, UI primitives, all four screens, SQLite,
  repositories, the Zustand store, playback, retention, and accessibility work.

Only the detection algorithm inside `modules/snoozepulse-audio/` and the
scoring functions that depend on its inaccurate output are being replaced.
