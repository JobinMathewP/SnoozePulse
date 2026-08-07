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
