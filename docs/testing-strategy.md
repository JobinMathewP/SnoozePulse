# Testing Strategy

## Definition of Done
A feature is complete only if:

- TypeScript passes
- ESLint passes
- No runtime warnings
- Accessibility labels added
- Theme tokens used
- No duplicated components

## Tooling

| Command             | Purpose                        |
| ------------------- | ------------------------------ |
| `npm run typecheck` | `tsc --noEmit`                 |
| `npm run lint`      | `expo lint`                    |
| `npm test`          | Jest (added in Milestone 5)    |

Test files are colocated with the code under test in `__tests__` folders. Every phase's
allowed-files list implicitly includes the `__tests__` folders of the paths it may touch.

Dependency injection makes this pyramid possible: services take a fake repository and
stores take a fake `IAudioEngine`, so no test needs a device or a real database.

## Test Pyramid

### Unit Tests
Test:
- Analytics calculations
- Date utilities
- Sleep scoring
- Repository methods
- State machine transition guards, including rejection of illegal transitions
- Retention policy (30 days / 500 MB)

### Component Tests
Verify:
- Rendering
- User interactions
- Accessibility
- Theme compliance

### Integration Tests
Verify:
- Recording lifecycle
- SQLite persistence
- Zustand state updates
- Navigation

### Manual QA Checklist

Primary target is the Android Emulator, then a physical Android device. iOS verification is
deferred because the development machine is Windows (ADR-17).

- Android Development Build (emulator, then device)
- Background recording with the screen locked
- Screen rotation
- Permission denial flow
- Low battery behavior
- System interruption: incoming call pauses and resumes the session
- Long (8+ hour) recording stability
- Retention cleanup fires at 30 days / 500 MB
- iOS Development Build — deferred

## Performance
- Monitor memory stability across an 8-hour session.
- Check for dropped frames.
- Verify UI updates remain responsive.
- Confirm the audio level stream does not trigger React renders: the waveform must animate
  from a Reanimated shared value, not from store state (ADR-13).

See `docs/performance-rc.md` for the Task 5.6 soak procedure and ADR-13 Jest coverage.

## Classifier Regression (M6)

> **Status: deferred (ADR-29).** The corpus and the automated gate described below are
> postponed to post-M6 hardening. Until ADR-29's trigger fires (app distributed outside
> the development team, or any change to the detection pipeline), the section stands as
> the target design, not an active test path. On-device smoke tests are the current
> substitute.

The M6 detector is validated against a labelled corpus of public audio clips (ADR-27). The
Task 6.6 gate fails a release if the classifier falls below its precision or recall bar.

### Corpus

- Location: `modules/snoozepulse-audio/__fixtures__/audio/`
- Composition:
  - ≥ 50 labelled snore clips
  - ≥ 100 non-snore clips covering: cough, speech, fan / HVAC, TV / music, rain, blanket
    or cloth rustle, phone vibration, dog bark
- Sources permitted: Google AudioSet (redistributable subset), Freesound.org (CC0 or
  CC-BY-4.0), other public-domain sleep-lab recordings. Every clip carries its license
  and attribution in `modules/snoozepulse-audio/__fixtures__/LICENSES.md` and, where
  required, in the repository-root `NOTICES.md`.

### Golden-Audio Suite

- Runs from Jest via a platform-parity harness. Each clip is fed through the log-mel
  front-end and the YAMNet classifier, then through the episode builder, exactly as
  `CaptureEngine` would at runtime.
- Assertions per clip: expected episode count, expected total duration bounds, and
  expected class label.
- Aggregate assertions across the corpus:
  - **Precision ≥ 0.85** — episodes labelled as snores that were actually snores.
  - **Recall ≥ 0.90** — snore clips for which at least one episode fired.
- The suite prints a full confusion matrix on completion; the RC report captures it.

### Log-Mel Parity

Task 6.2 ships a byte-parity fixture at `modules/snoozepulse-audio/__fixtures__/mel/`.
The platform-specific parity tests must stay green with mean absolute error `≤ 1e-4`
against the reference patch. A regression there is a Task 6.2 defect, not a corpus issue.

## Cursor Workflow
After every phase:
1. Run `npm run typecheck`
2. Run `npm run lint`
3. Run `npm test`
4. Fix issues
5. Summarize changed files
6. Commit before next phase
