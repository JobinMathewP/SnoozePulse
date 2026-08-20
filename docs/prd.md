# SnoozePulse — Product Requirements (v2)

**Product version:** 2  
**Store baseline:** 1.0.0 shipped (product v1)  
**Status:** Active  
**Platforms:** Android + iOS (Android first, ADR-17)  
**Backend:** None

This is the product contract for v2. Behavior for automatic tracking is detailed in
`docs/prd-automatic-sleep-tracking.md`. Shipped v1 behavior is archived at
`docs/archive/prd-v1.md`.

Where this file disagrees with `docs/decisions.md`, the ADR wins.

---

## 1. Product vision

SnoozePulse is a privacy-first sleep monitoring app. It detects snoring on the device,
saves short snore snippets, and shows a morning summary. Nothing is uploaded.

**Product v1** asked the user to press **Start Sleep Session** every night.

**Product v2** asks the user to set a usual sleep schedule once. SnoozePulse then
decides when overnight monitoring should begin and end, using on-device signals.

> Set your sleep schedule once. SnoozePulse takes care of the rest.

---

## 2. What v1 already is

Do not rebuild these. V2 starts and stops them.

- Home, Active Session, Summary, History, Settings, first-run onboarding.
- Native YAMNet capture pipeline (`modules/snoozepulse-audio`).
- Local SQLite sessions, events, buckets, 30-day / 500 MB snippet retention.
- Confidence-weighted scores (ADR-26 — internally still called "V2 scoring").
- Wellness positioning: not a medical device, no apnea/diagnosis claims (ADR-30).
- Manual start, slide-to-end, system-only pause (ADR-14).

---

## 3. V2 goal

Minimize daily interaction.

The user configures **bedtime**, **wake time**, and **Automatic Sleep Tracking**.
When that is on, the default night is:

```text
Evening → readiness window → phone appears settled → START SESSION
        → existing snore monitoring → wake window → STOP SESSION
        → local morning notification → Summary
```

The configured bedtime is an **expected** time, not a recording start timestamp.
Readiness stays open until two hours before the wake window so late nights can
still auto-start. The system never claims that phone motion proves the user is in
bed or asleep. The internal name for the decision is **Sleep Readiness** (ADR-31).

---

## 4. Goals

- The user does not have to remember to press Start on a typical night.
- Automatic start and stop use only on-device data.
- Automatic start reuses the existing audio engine.
- Failed nights are visible as failed, never as fake analytics.
- Automatic microphone use requires an explicit opt-in and a clear explanation.

## 5. Non-goals (this ship)

- Backend, accounts, cloud sync, silent push.
- Medical diagnosis, apnea detection, clinical scoring.
- Wearables, AEC, a learned readiness model.
- Inferring actual sleep/wake from sensors as a hard requirement.
- Detecting "phone in another room" from sleep breathing.
- Redesigning the four v1 screens without a new reference image.
- A second native capture pipeline.

Manual start stays. Insights and Profile tabs stay out (ADR-09). Web stays out.

---

## 6. Core surfaces

Unchanged from v1, with these v2 additions:

| Surface | V2 change |
| ------- | --------- |
| Onboarding and/or Settings | Sleep schedule + automatic tracking opt-in |
| Home | When auto is on, status for tonight replaces Start as the primary daily message. Start remains as an override. |
| Active Session / Summary / History | Same as v1 once a session exists |
| Morning notification | Local, deep-links to that night's Summary |

Until a dedicated v2 Home mock exists, evolve copy and status through existing
primitives and tokens. Do not invent a new visual language (ADR-06).

---

## 7. Architecture (unchanged layering)

```text
UI → Store → Services → Repositories → SQLite / Native
```

Automatic tracking is a **scheduler / readiness** service that calls
`IAudioService.startSession()` and `stopSession()`. It does not own DSP.

See `docs/architecture.md` and ADR-31, ADR-32.

---

## 8. Privacy

All processing stays on the device. The user must opt in to automatic tracking.
Copy must explain that the microphone is used during the scheduled sleep window.

---

## 9. Definition of done

A v2 feature is complete when:

- TypeScript, ESLint, and tests pass
- No runtime warnings or placeholder implementations
- Accessibility labels on interactive controls
- Theme tokens used
- Strict layering and interface injection
- Automatic tracking cannot turn on without explicit opt-in
- Documentation updated
