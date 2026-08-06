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

## Cursor Workflow
After every phase:
1. Run `npm run typecheck`
2. Run `npm run lint`
3. Fix issues
4. Summarize changed files
5. Commit before next phase
