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
```text
src/
  components/ui/
  features/
  services/
  repositories/
  native/
  store/
  hooks/
  theme/
  types/
  utils/
```

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
UI → Zustand Store → Services → Repository → SQLite / Native.

## Error Handling
- Never swallow errors.
- Return typed errors.
- Log only meaningful diagnostics.

## Imports
1. React
2. Third-party libraries
3. Internal aliases
4. Relative imports

## Cursor Rules
- Modify only requested files.
- No TODO placeholders.
- Explain planned changes before editing.
- Run typecheck and lint after implementation.
