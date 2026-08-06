# Coding Standards

## Purpose
These standards ensure Cursor generates consistent, maintainable, production-quality code.

## General Principles
- Use TypeScript **strict** mode.
- Never use `any`; prefer explicit types or `unknown`.
- Prefer composition over inheritance.
- Keep components under ~200 lines where practical.
- One responsibility per file.

## Folder Structure

This is the authoritative structure. It supersedes the shorter list in
`.cursor/rules/02-tech-stack.mdc`.

```text
src/
  app/            # Expo Router routes
  components/ui/  # shared presentational primitives
  features/       # screen-level composition, one folder per screen
  hooks/
  native/         # JS-side interface + wrapper for the native audio module
  repositories/   # SQL only
  services/       # business logic only
  store/          # Zustand slices
  theme/
  types/
  utils/

modules/
  snoozepulse-audio/   # Expo local module: Swift + Kotlin
```

`services/` and `repositories/` are never merged. A repository contains no business rule; a
service contains no SQL.

## Naming
- Components: `PascalCase`
- Hooks: `useSomething`
- Interfaces: `IInterfaceName`
- Enums: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

## React
- Functional components only.
- Prefer custom hooks for reusable logic.
- No business logic inside components.
- No direct database or native module access from UI.

## State
UI → Zustand Store → Services → Repository → SQLite / Native

The store never calls a repository directly.

## Dependency Injection
- Depend on interfaces (`IAudioEngine`, `ISleepRepository`, …), never on concrete classes.
- Never write `new SomeConcreteClass()` inside a store, hook, or component.
- A single composition root constructs the object graph at app start and injects it downward.
- Every service and repository receives its collaborators through its constructor..

## Error Handling
- Never swallow errors.
- Return typed errors.
- Log only meaningful diagnostics.

## Imports
1. React
2. Third-party libraries
3. Internal aliases
4. Relative imports

## Styling
- NativeWind v5 with Tailwind CSS 4 is the styling layer (ADR-20).
- Tailwind 4 defines theme in CSS via `@theme`, not a JavaScript config. There is no
  `tailwind.config.js`.
- The `@theme` block is generated from `src/theme/`, so theme tokens remain the single source
  of truth. Never write a raw color or spacing value into the CSS theme or into a className.

## Cursor Rules
- Modify only requested files.
- No TODO placeholders.
- Explain planned changes before editing.
- Run `npm run typecheck` and `npm run lint` after implementation.

## Deferred Implementations
"No TODO placeholders" forbids unfinished code, not deliberately simple V1 logic.

Where a document defers an algorithm to V2 (currently only sleep and snore scoring, ADR-10),
implement a complete, working, documented V1: a pure function with its weighting constants in
one named block, and a doc comment stating that it is a V1 heuristic scheduled for
replacement. Do not leave a `TODO`, do not throw, and do not return a stub value.
