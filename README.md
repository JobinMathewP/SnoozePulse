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
| `npm test` | Jest unit / component / integration suite |

`npm run typecheck`, `npm run lint`, and `npm test` must all pass before a release candidate
is cut (Milestone 5).

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

Start with `docs/README.md` for the map, then `docs/decisions.md` — it records the
ratified architecture decisions and is the tie-breaker whenever any other document
disagrees.

Product v1 (App Store 1.0.0) has shipped. Active work is product v2: Automatic Sleep
Tracking (`docs/prd.md`, `docs/prd-automatic-sleep-tracking.md`, M7 in
`docs/roadmap.md`). Shipped plans live in `docs/archive/`.

| Document | Contents |
| --- | --- |
| `docs/README.md` | Map, version names, documentation priority |
| `docs/decisions.md` | Architecture decision record |
| `docs/prd.md` | Product v2 requirements |
| `docs/prd-automatic-sleep-tracking.md` | Automatic tracking feature spec |
| `docs/implementation-plan.md` | Task-by-task execution plan (M7) |
| `docs/roadmap.md` | Phase definitions (M7) |
| `docs/architecture.md` | System topology and layering |
| `docs/api-contracts.md` | Interfaces and event payloads |
| `docs/native-audio.md` | Native audio pipeline |
| `docs/ui-guidelines.md` | Design tokens and rules |
| `docs/design-spec.md` | Screen references and navigation map |
| `docs/coding-standards.md` | Code conventions |
| `docs/testing-strategy.md` | Test pyramid and QA checklist |

## Public site

Legal and support pages live in `website/` and publish to GitHub Pages. Setup:
`website/README.md`.

| Page | URL |
| --- | --- |
| Home | https://jobinmathewp.github.io/SnoozePulse/ |
| Privacy Policy | https://jobinmathewp.github.io/SnoozePulse/privacy/ |
| Support | https://jobinmathewp.github.io/SnoozePulse/support/ |
| Terms of Use | https://jobinmathewp.github.io/SnoozePulse/terms/ |

## License

See `LICENSE`.
