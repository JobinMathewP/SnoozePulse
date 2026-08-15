# Performance & soak notes (Task 5.6 / Phase 24)

## ADR-13 — audio stream must not thrash React

Verified in `src/store/__tests__/sessionLifecycle.test.ts`:

- Every `AudioLevelEvent` updates `liveAudioLevel` (Reanimated shared value).
- Zustand `currentDecibel` updates at most once per `DECIBEL_STORE_THROTTLE_MS` (250 ms).

Manual check on device: enable React Native performance monitor during Active Session and
confirm the waveform animates without a render storm on the Active route.

## 30+ minute locked-screen soak (carry-forward from 5.2 / 5.3)

**Procedure (Android Emulator or device):**

1. Start a sleep session; lock the screen.
2. Note start PSS: `adb shell dumpsys meminfo com.snoozepulse.app` (or the app’s
   applicationId from `android/app/build.gradle`).
3. Leave recording for ≥ 30 minutes.
4. Note end PSS from the same command.
5. Unlock, slide to end, open Summary — confirm events/buckets persisted.

**Status:** Code and crash-recovery paths are in place (FGS `START_NOT_STICKY`, boot
`recoverInterruptedSessions`, KeepAwake safe teardown). Record measured start/end PSS in
the RC notes when the soak is run; do not treat an unmeasured soak as a code defect if the
procedure has not been executed yet.

## 8-hour performance pass

Same tooling as the 30-minute soak, extended to 8 hours. Watch for:

- Monotonic PSS growth (leak)
- Dropped frames on unlock
- Battery % delta vs idle overnight

iOS soak items remain **deferred** (ADR-17 — Windows host).

## KeepAwake policy (Active Session)

`ActiveSessionScreen` does **not** hold `expo-keep-awake` while recording. The device screen is
allowed to dim and lock normally. Capture stays alive via `UIBackgroundModes: ["audio"]` on
iOS and `FOREGROUND_SERVICE_MICROPHONE` on Android. A nightlong wake-lock would burn OLED
budget for no functional gain and would contradict the on-screen hint that recording
continues in the background.

## Battery-hardening pipeline (post-M5)

Native detection uses a silence gate in front of YAMNet. There is no music / competitor
quality filter: once inference runs, the episode builder uses the original 0.55 enter /
0.35 exit hysteresis on `combined` (snoring + snort).

**Silence gate** (`CaptureEngine.classifyIfReady`) — once the rolling 60 s noise-floor
window is warm, YAMNet is only invoked when the current dB is at least
`silenceGateMarginDb` (default 6 dB) above the floor, or when `silenceGateMinIntervalMs`
(default 2 000 ms) has elapsed since the last inference. Skips are counted in
`skippedByGate`.

Every 60 s the engine logs one summary line:

```
SnoozePulse gate: windows=... skipped=... inferences=...
```

Capture these counters during the overnight iOS soak; they answer whether the defaults are
right for the target device.

## Low-power mode

`ActiveSessionScreen` consumes `useLowPowerMode()` from `expo-battery`. While the OS reports
low-power/power-saver mode, the Reanimated waveform is replaced by a static caption. Native
capture, silence-gate, and detection paths are unchanged; only the UI
animation is suppressed.

## App Store Review Notes

Paste the following into the App Review Information "Notes" field on submission:

> SnoozePulse records audio in the background during a user-initiated sleep session so it
> can detect snoring. All audio processing (log-mel features, TFLite classifier) and all
> recorded snippets stay on the device — nothing is uploaded. Background capture is enabled
> only after the user taps "Start Sleep Session" on the Home screen and ends when the user
> slides to end the session.

Privacy label mapping (App Store Connect → App Privacy):

- **Audio Data** → Collected → Not linked to user → Not used for tracking → Purpose: App
  Functionality.

## Overnight iOS soak (deferred)

Once a physical iOS device is available, fill in the fields below from a single 6–8 hour
recording session performed on a nightstand:

- Device model + iOS version:
- Start battery %:
- End battery %:
- Battery Δ vs idle-overnight control:
- Peak thermal state (Xcode Organizer → Energy Log):
- Average CPU % during idle recording:
- `SnoozePulse gate` counters averaged over the run:
  - windows/60 s:
  - skipped (silence gate):
  - inferences:

If Δ exceeds ~4 % / hour or the thermal state ever rises above `nominal`, tune
`silenceGateMarginDb` upward and re-run.
