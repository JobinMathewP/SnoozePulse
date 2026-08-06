# Testing Strategy

## Definition of Done
A feature is complete only if:

- TypeScript passes
- ESLint passes
- No runtime warnings
- Accessibility labels added
- Theme tokens used
- No duplicated components

## Test Pyramid

### Unit Tests
Test:
- Analytics calculations
- Date utilities
- Sleep scoring
- Repository methods

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
- Android Development Build
- iOS Development Build
- Background recording
- Screen rotation
- Permission denial flow
- Low battery behavior
- Long (8+ hour) recording stability

## Performance
- Monitor memory stability.
- Check for dropped frames.
- Verify UI updates remain responsive.

## Cursor Workflow
After every phase:
1. Run `npm run typecheck`
2. Run `npm run lint`
3. Fix issues
4. Summarize changed files
5. Commit before next phase
