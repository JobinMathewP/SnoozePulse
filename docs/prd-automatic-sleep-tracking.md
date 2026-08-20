# PRD — Automatic Sleep Tracking & Smart Night Monitoring

**Product:** SnoozePulse  
**Feature:** Automatic Sleep Tracking  
**Product version:** v2 (App Store next)  
**Feature version:** first ship of this feature  
**Architecture:** On-device / no backend  
**Platforms:** Android + iOS (Android primary, ADR-17)  
**Status:** Active  
**Parent:** `docs/prd.md`  
**ADRs:** ADR-31 (product), ADR-32 (background), ADR-33 (docs), ADR-34 (battery save)

This is the feature specification. Product-level vision and non-goals live in
`docs/prd.md`. Ratified constraints live in `docs/decisions.md` and win if they
disagree with anything below.

---

## 1. Product goal

SnoozePulse should minimize daily user interaction.

Instead of requiring the user to manually press **Start Sleep Session** every night,
the user configures their normal sleep schedule once.

SnoozePulse then uses:

- Scheduled bedtime / wake time
- Device motion
- Device activity
- Environmental audio
- Phone interaction
- Existing native audio monitoring

to determine when the user is likely settling down for sleep and when the overnight
monitoring session should begin and end.

The feature must operate **entirely on the device**. No backend or cloud service is
required.

Manual **Start Sleep Session** remains as an override (naps, travel, nights when
automatic tracking does not fire). It is no longer the intended nightly habit.

---

## 2. User experience

### 2.1 Initial setup

During onboarding or Sleep Settings:

### Sleep Schedule

> **When do you usually sleep?**

**Bedtime**

`11:30 PM`

**Wake-up**

`7:00 AM`

Then:

> **Automatic Sleep Tracking**
>
> SnoozePulse can automatically start monitoring around your usual bedtime when your
> phone appears to be settled for the night.

**[ Enable Automatic Tracking ]**

The user can change these settings later. Automatic tracking is **off** until the
user turns it on.

---

## 3. Nightly experience

Once enabled, the user should not normally need to manually start a session.

Example:

```text
11:30 PM
Scheduled bedtime
        ↓
SnoozePulse enters readiness window
        ↓
Phone still being actively used?
        │
       YES
        ↓
Continue waiting
        │
       NO
        ↓
Phone becomes stationary
        ↓
Environment becomes sufficiently quiet
        ↓
User appears to have settled
        ↓
Begin overnight monitoring
        ↓
Snore detection
        ↓
Morning session completion
```

The system should **not** assume that the configured bedtime is the actual sleep time.

---

## 4. Sleep readiness window

The configured bedtime represents an **expected bedtime**, not an exact recording
start time. Readiness opens 30 minutes before that time and **stays open until 2
hours before the wake window starts**. The system does not give up an hour after
bedtime — late nights can still auto-start.

Example (bedtime 11:30 PM, wake 7:00 AM):

```text
Expected bedtime     11:30 PM
Expected wake         7:00 AM

Readiness window
11:00 PM → 4:30 AM

Wake window
6:30 AM → 7:30 AM
```

A 2:00 AM settle can still start. ~5:00 AM cannot (too close to wake). Window
offsets are internal constants (`READINESS` in code), not user-facing settings,
until a later task proves they need to be. During this period SnoozePulse
evaluates whether the device appears settled.

---

## 5. Signals used

SnoozePulse may combine several on-device signals.

### 5.1 Sleep schedule

Primary contextual signal.

```text
Expected bedtime: 11:30 PM
Expected wake:     7:00 AM
```

This establishes when automatic monitoring should be considered. Times are device
local time. Weekday/weekend splits and travel intelligence are out of this ship.

### 5.2 Device motion

Use native accelerometer / device-motion APIs to determine whether the phone has
become relatively stationary.

```text
Continuous movement
        ↓
User may still be active

Low movement for sustained period
        ↓
Phone appears settled
```

### Important limitation

Motion measures the **phone**, not the person. The system must **never** claim that
accelerometer data proves the user is in bed or asleep.

```text
Phone sitting on desk
        ↓
Stationary
        ↓
Does NOT necessarily mean user is sleeping
```

Motion is a supporting signal only.

### 5.3 Phone in another room

Do **not** claim we can detect that the phone was left in another room from sleep
breathing. The classifier is snore/snort (YAMNet), not quiet respiration. A quiet
empty room and a quiet non-snorer are indistinguishable on this pipeline. A later
heuristic may use other signals; it is out of this ship.

---

## 6. Phone interaction

If the user is actively interacting with the phone around bedtime, automatic
monitoring should be delayed.

Examples:

- Screen actively used
- User interacting with SnoozePulse
- Device movement suggesting active use

```text
11:30 PM
User watching YouTube

↓

Do not start monitoring

↓

12:05 AM
Phone becomes stationary

↓

Environment becomes quiet

↓

Consider starting monitoring
```

---

## 7. Environmental audio

The existing native audio pipeline should provide environmental information.

The system can consider:

- Overall sound level
- Noise floor
- Continuous background audio
- Speech / music presence
- Significant environmental changes

The purpose is **not** to determine sleep solely from audio. Audio is another
supporting signal.

Do not open a second capture pipeline. If a short sample is needed before
`START SESSION`, it goes through `modules/snoozepulse-audio` (ADR-32).

---

## 8. Music / playback awareness

SnoozePulse should recognize that continuous playback can make microphone-based
snore detection less reliable.

```text
Phone speaker
      ↓
Music
      ↓
Microphone
      ↓
Music dominates recording
```

The system should not simply lower the snore detection threshold.

Instead, playback-dominant periods should be treated as **lower-quality monitoring
conditions**. The detection pipeline remains capable of processing meaningful audio,
while the episode builder applies stricter evidence requirements when the acoustic
environment is unreliable.

This is **not** required to exit the first M7 tasks. Changing native detection
reopens the ADR-29 corpus gate. Prefer a quality flag on the session / episode
path before touching YAMNet.

---

## 9. Readiness state machine

This machine is **separate** from the recording machine in `docs/architecture.md`.
Readiness decides *when* to call `startSession()` / `stopSession()`. Recording
still owns capture.

```text
SCHEDULED
    ↓
READINESS_WINDOW
    ↓
SETTLING
    ↓
MONITORING          → calls existing START SESSION
    ↓
WAKE_WINDOW
    ↓
COMPLETED           → calls existing STOP SESSION
```

Error path:

```text
Any State
    ↓
ERROR
```

### 9.1 SCHEDULED

Waiting for the user's configured bedtime window. No overnight audio monitoring yet.

### 9.2 READINESS_WINDOW

The app begins evaluating low-cost signals: motion, device interaction,
environmental conditions, time, charging.

### 9.3 SETTLING

The device appears to be becoming inactive.

```text
No active interaction
+
Appropriate time
+
Phone stationary when motion data exists
+
Reasonably quiet environment when a sample exists
```

The system can transition toward monitoring. Stationary alone is not enough.
Missing motion does not block this path.

---

## 10. Starting monitoring

The app should **not** start solely because the phone becomes stationary.

```text
Scheduled window
        +
No obvious active phone use
        +
Phone appears settled (when motion data exists)
        +
Acceptable environment (when a sample exists)
        ↓
START MONITORING
```

If motion data is missing (permission denied, sensor unavailable, or the process
was not alive to sample), auto-start continues using the other readiness signals.
Same for a missing pre-start environment sample. A **known** moving phone or a
**known** noisy room still delays start. Stationary phone alone is never enough.

Exact thresholds stay in one named constants block and are tuned through
real-world testing.

---

## 11. Monitoring phase

Once monitoring starts, the existing native audio architecture takes over.

```text
Microphone
    ↓
Native audio capture
    ↓
RMS / signal analysis
    ↓
Noise gate
    ↓
YAMNet / audio classifier
    ↓
Snore classification
    ↓
Temporal / episode processing
    ↓
SQLite
```

The automatic-start system should **not** duplicate the audio engine. It should
tell the audio engine:

```text
START SESSION
```

That is `IAudioService.startSession()` on the existing path, including the
five-minute minimum and discard rules from ADR-30.

---

## 12. Morning completion

The configured wake time defines the expected end of the monitoring period.

```text
Expected wake: 7:00 AM

Wake window:
6:30 AM → 7:30 AM
```

The system should avoid treating the exact configured wake time as proof that the
user woke up. Default end of monitoring is the **end of the wake window**
(time-based).

A later improvement may **extend** past that window when recent snores are still
firing, with a hard cap (for example wake + 2 hours, or the user picking up the
phone). Sleep breathing is **not** a keep-going signal — YAMNet does not reliably
hear quiet respiration. That extend path is out of this ship.

---

## 13. Session completion

When the monitoring period ends:

```text
Recording
    ↓
Stop native audio
    ↓
Finalize session
    ↓
Calculate analytics
    ↓
Persist results
    ↓
Mark session COMPLETED
```

The Summary screen becomes available.

---

## 14. Morning notification

After a successful completed session, SnoozePulse should schedule/show a **local
notification**.

> 🌤️ **Your sleep summary is ready**
>
> See how you slept last night.

Tapping the notification should deep-link to Morning Summary. No backend is
required. The notification is generated and scheduled locally by the operating
system.

---

## 15. Missed / failed session

SnoozePulse should not silently claim that tracking happened if it did not.

### Microphone permission unavailable

```text
Tonight's tracking couldn't start.
Microphone permission is required.
```

### Insufficient battery

Two different outcomes:

**Could not start** (already at or below 20% and unplugged at auto-start time):

```text
Tonight's tracking couldn't start.
Battery was too low.
```

That is a missed / failed night, not a Summary.

**Started, then hit 20% while unplugged** (ADR-34): stop through `stopSession()`,
**save** the scores, and treat it as a real (possibly short) completed night. Do
not discard. Do not invent analytics. Charging devices are not stopped.

```text
SnoozePulse saved last night's tracking before the battery ran out.
```

### Device unavailable / system interruption

Session should be marked appropriately rather than generating fake analytics.

---

## 16. Charger awareness

Because overnight recording can consume significant battery, SnoozePulse should
consider charging status.

If the user has automatic tracking enabled and the device is not charging:

```text
🌙 Tonight's tracking

Your phone isn't charging.
For the best experience, connect your charger before bed.
```

This is a **gentle reminder**, not a blocking requirement. `expo-battery` is
already in the app. The 20% save-and-stop guard (ADR-34) is separate: reminder is
advisory; running out of charge while recording is not.

---

## 17. Privacy

All automatic sleep detection and snore analysis remain on-device.

The feature should clearly communicate:

> SnoozePulse uses your microphone during your scheduled sleep window to detect
> snoring and analyze sleep sounds.

The user must explicitly enable automatic tracking. The app should never silently
enable overnight microphone monitoring.

---

## 18. No backend required

```text
User Settings
     ↓
SQLite
     ↓
Local Scheduler
     ↓
Native Motion / Audio Services
     ↓
Local Analysis
     ↓
SQLite
     ↓
Local Notification
```

No server is required for sleep schedule, automatic session start, audio
processing, snore detection, session storage, morning summary, or local
notifications.

---

## 19. Platform architecture

### Android

Primary development and validation platform (Windows host).

- Existing foreground service for long-running microphone monitoring (after start)
- Motion / sensor APIs for readiness
- Local notification APIs
- Existing native audio engine
- Exact-alarm / FGS wake at the start of the readiness window (ADR-32)

### iOS

Same TypeScript interfaces and architectural contracts.

- AVAudioEngine / existing native audio module
- Core Motion where appropriate
- Local notifications
- Existing background audio configuration

Killed-state auto-start on iOS is **best-effort** until compiled and validated on
macOS (ADR-32). Do not add a backend to compensate.

---

## 20. Important technical principle

**Do not make "bed detection" a hard requirement.**

Describe the result internally as **Sleep Readiness**, not **User is in bed**,
because the phone's sensors cannot reliably determine the user's physical location.

---

## 21. Future improvements

Not required for the first implementation:

- Acoustic echo cancellation
- Improved sleep / wake inference, including extending past the wake window when
  recent snores are still firing (hard cap required)
- Wearable integration
- A personalized sleep-readiness model (time + motion + interaction + audio + history)
- Heuristics for "phone left in another room" that do not pretend to hear sleep breathing

---

## 22. Acceptance criteria

### Automatic tracking

- [ ] User can configure bedtime and wake time.
- [ ] User can enable/disable automatic tracking.
- [ ] Settings persist locally (`app_settings`, migration V4).
- [ ] No backend is required.
- [ ] App enters a configurable readiness window around bedtime (open until 2 hours
      before the wake window; 2 AM can still start on a typical night).
- [ ] Motion is used as a supporting signal.
- [ ] Phone interaction can delay automatic monitoring.
- [ ] Audio environment can contribute to readiness decisions.
- [ ] Stationary phone alone cannot trigger monitoring.
- [ ] Automatic monitoring starts through the existing native audio engine.
- [ ] No duplicate audio capture pipeline is created.
- [ ] Manual start remains as an override.

### Morning

- [ ] Monitoring can be completed automatically.
- [ ] Session is persisted locally.
- [ ] Analytics are calculated locally.
- [ ] A local morning notification can be generated.
- [ ] Notification opens the Summary screen.
- [ ] Failed/incomplete sessions are clearly distinguished from successful sessions.
- [ ] An in-progress session at or below 20% unplugged is saved, not discarded (ADR-34).

### Privacy

- [ ] Automatic monitoring requires explicit user opt-in.
- [ ] Microphone usage is clearly explained.
- [ ] No backend is required for the feature.
- [ ] No claim is made that phone motion proves the user is in bed/asleep.

---

## 23. Product philosophy

The fundamental experience should be:

> **Set your sleep schedule once. SnoozePulse takes care of the rest.**

The user shouldn't have to remember:

> "I need to open SnoozePulse and press Start tonight."

Instead:

**Night → SnoozePulse quietly prepares → monitors → Morning → summary is ready.**

That is a stronger product direction for SnoozePulse than making
**Start Sleep Session** the primary daily interaction.
