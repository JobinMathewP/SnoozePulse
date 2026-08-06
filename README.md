# SnoozePulse

A privacy-first sleep monitoring app that detects snoring overnight, records only the audio
that matters, and turns it into sleep insights. All processing and storage happen on the
device — no audio is ever uploaded.

Android and iOS, built with Expo Development Builds. Web is not a supported target.

## Requirements

- Node.js 20+
- An Expo Development Build. **Expo Go will not work** — the app depends on a custom native
  audio module.
- Android Studio with an emulator, or a physical Android device. Android is the primary
  development target; iOS is built via EAS.

## Getting started

```bash
npm install
npx expo start --android
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run android` | Start and open on Android |
| `npm run ios` | Start and open on iOS |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint via `expo lint` |

`npm run typecheck` and `npm run lint` must both pass before any phase is considered
complete.

## Architecture

Strict unidirectional layering, with all audio DSP on native threads:

```text
UI → Store → Services → Repositories → SQLite / Native
```

The store never calls a repository directly, the UI never touches SQLite or a native module,
and no DSP runs in JavaScript. Concrete implementations are constructed once at a composition
root and injected as interfaces.

## Project structure

```text
src/
  app/            Expo Router routes
  components/ui/  shared presentational primitives
  features/       screen-level composition
  hooks/
  native/         JS-side interface and wrapper for the audio module
  repositories/   SQL only
  services/       business logic only
  store/          Zustand slices
  theme/          design tokens
  types/
  utils/

modules/
  snoozepulse-audio/   Expo local module: Swift + Kotlin
```

## Documentation

Start with `docs/decisions.md` — it records the ratified architecture decisions and is the
tie-breaker whenever any other document disagrees.

| Document | Contents |
| --- | --- |
| `docs/decisions.md` | Architecture decision record |
| `docs/implementation-plan.md` | Task-by-task execution plan |
| `docs/roadmap.md` | Phase definitions |
| `docs/architecture.md` | System topology and layering |
| `docs/api-contracts.md` | Interfaces and event payloads |
| `docs/native-audio.md` | Native audio pipeline |
| `docs/ui-guidelines.md` | Design tokens and rules |
| `docs/design-spec.md` | Screen references and navigation map |
| `docs/coding-standards.md` | Code conventions |
| `docs/testing-strategy.md` | Test pyramid and QA checklist |
| `docs/SnoreTracker_App_PRD_Specification.md` | Product requirements |

## License

See `LICENSE`.
