# 🎯 SnoozePulse

> **Privacy-first sleep monitoring that stays on your device**

A privacy-first sleep monitoring app that detects snoring overnight, records only the audio that matters, and turns it into sleep insights. All processing and storage happen on the device — **no audio is ever uploaded**.

**Android** • **iOS** (Expo Development Builds) • **Privacy-First** • **Native Performance**

---

## 📸 App Preview

<div align="center">

| Overview | Sleep Tracking | Analytics |
|----------|---|---|
| ![Home Screen](docs/home-screen.png) | ![Sleep Recording](docs/sleep-recording.png) | ![Analytics Dashboard](docs/analytics.png) |

| Snore Detection | Settings |
|---|---|
| ![Snore Detection](docs/snore-detection.png) | ![Settings](docs/settings.png) |

</div>

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| 🎙️ **Smart Snore Detection** | Real-time audio analysis using native DSP on your device |
| 🔒 **100% Private** | Zero cloud uploads. All audio processing & storage stays local |
| 📊 **Sleep Insights** | Turn audio snapshots into actionable sleep quality metrics |
| 📱 **Cross-Platform** | Native iOS & Android built with Expo Development Builds |
| ⚡ **Native Performance** | All audio DSP runs on native threads (Swift + Kotlin) |
| 🎨 **Modern UI** | Clean, intuitive interface with design tokens & accessibility |

---

## 🚀 Quick Start (5 minutes)

### Prerequisites

```bash
# Minimum requirements
Node.js 20+
Android Studio + Emulator (or physical Android device)
Expo Development Build (⚠️ Expo Go will NOT work)
```

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server on Android
npm run android

# ✅ Done! App opens automatically
```

### Available Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start the Expo dev server |
| `npm run android` | Build & run on Android emulator/device |
| `npm run ios` | Build & run on iOS (requires Mac) |
| `npm run typecheck` | Type check with TypeScript (`tsc --noEmit`) |
| `npm run lint` | Lint code with ESLint |

**⚠️ Important:** Both `typecheck` and `lint` must pass before any phase is considered complete.

---

## 🏗️ Architecture

Strict **unidirectional layering** with all audio DSP on native threads:

```
┌─────────────────────────────────────────┐
│              UI Layer                   │ React Native + Expo Router
├─────────────────────────────────────────┤
│          Zustand Store                  │ Global state management
├─────────────────────────────────────────┤
│          Business Services              │ Use cases & business logic
├─────────────────────────────────────────┤
│          Repositories                   │ Data access (SQL only)
├─────────────────────────────────────────┤
│   SQLite + Native Audio Module          │ Device-local storage & DSP
└─────────────────────────────────────────┘
```

### Golden Rules ✅

- ✔️ UI → Store → Services → Repositories → SQLite / Native (strict flow)
- ✔️ Store never calls Repository directly
- ✔️ UI never touches SQLite or native modules
- ✔️ No DSP runs in JavaScript
- ✔️ Dependency injection at composition root

---

## 📂 Project Structure

```
src/
├── app/              Expo Router routes & navigation
├── components/ui/    Shared presentational primitives (buttons, cards, etc.)
├── features/         Screen-level composition & containers
├── hooks/            Custom React hooks
├── native/           JS-side interface for native audio module
├── repositories/     Data access layer (SQL only, no business logic)
├── services/         Business logic & use cases (no SQL)
├── store/            Zustand state slices
├── theme/            Design tokens (colors, typography, spacing)
├── types/            TypeScript definitions
└── utils/            Utility functions

modules/
└── snoozepulse-audio/  Expo local module (Swift + Kotlin)
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native + Expo
- **Navigation:** Expo Router
- **State Management:** Zustand
- **Type Safety:** TypeScript
- **Styling:** Design tokens + theme system

### Backend (Device-Local)
- **Database:** SQLite
- **DSP:** Swift (iOS) + Kotlin (Android)
- **Module Bridge:** Expo local modules

### Development
- **Linting:** ESLint
- **Build Tool:** Expo Development Builds
- **Package Manager:** npm

---

## 📋 Core Entities

### SleepSession
```typescript
{
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  snoreEvents: SnoreEvent[];
  totalSnoreCount: number;
  averageSnoreIntensity: number;
  createdAt: Date;
}
```

### SnoreEvent
```typescript
{
  id: string;
  sessionId: string;
  timestamp: Date;
  intensity: number; // 0-100
  duration: number; // milliseconds
  audioClip: Blob; // stored locally
}
```

### SessionBucket
```typescript
{
  id: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  snoreCount: number;
  averageIntensity: number;
}
```

---

## 🎨 Design System

### Colors
| Purpose | Value |
|---------|-------|
| Primary | `#6366F1` (Indigo) |
| Success | `#10B981` (Emerald) |
| Warning | `#F59E0B` (Amber) |
| Error | `#EF4444` (Red) |
| Background | `#F9FAFB` (Light Gray) |

### Typography
- **Heading:** Inter Bold
- **Body:** Inter Regular
- **Mono:** JetBrains Mono

### Spacing
`4px → 8px → 12px → 16px → 24px → 32px → 48px`

---

## 📚 Documentation

Start with **`docs/decisions.md`** — it records all ratified architecture decisions and is the tie-breaker for any disagreements.

| Document | Purpose |
|----------|---------|
| `docs/decisions.md` | ⭐ Architecture Decision Record (start here!) |
| `docs/architecture.md` | System topology, layering, and design patterns |
| `docs/implementation-plan.md` | Task-by-task execution roadmap |
| `docs/roadmap.md` | Development phases 0-24 |
| `docs/api-contracts.md` | Interfaces, types, and event payloads |
| `docs/native-audio.md` | Audio pipeline, DSP, and snore detection algorithm |
| `docs/ui-guidelines.md` | Design tokens, rules, and accessibility |
| `docs/design-spec.md` | Screen mockups, navigation map, and user flows |
| `docs/coding-standards.md` | Code conventions, naming, and style |
| `docs/testing-strategy.md` | Test pyramid, QA checklist, and best practices |
| `docs/SnoreTracker_App_PRD_Specification.md` | Full product requirements document |

---

## 🔐 Privacy & Security

✅ **Zero-Knowledge Architecture**
- Audio is captured, analyzed, and discarded **entirely on-device**
- Only metadata (timestamp, intensity, duration) is stored locally
- No audio files are sent to servers or cloud
- Device is the only source of truth

✅ **Device-Local Processing**
- Snore detection runs on native threads
- SQLite database encrypted at rest
- No network requests for audio analysis

---

## 🎯 Development Phases

SnoozePulse is built in 25 phases across 5 major releases:

| Phase | Status | Focus |
|-------|--------|-------|
| **Phase 0-4** | In Progress | Core architecture & audio pipeline |
| **Phase 5-9** | Planned | UI framework & basic recording |
| **Phase 10-14** | Planned | Snore detection & analytics |
| **Phase 15-19** | Planned | Sleep insights & reporting |
| **Phase 20-24** | Planned | Polish, testing, and launch |

See `docs/roadmap.md` for detailed breakdown.

---

## 🤝 Contributing

### Before You Start
1. Read `docs/decisions.md` to understand the architecture
2. Check `docs/coding-standards.md` for style conventions
3. Review the relevant feature document in `docs/`
4. Ensure `npm run typecheck` and `npm run lint` pass

### Development Workflow
1. Create a feature branch from `dev`
2. Make your changes
3. Run `npm run typecheck` and `npm run lint` (both must pass ✅)
4. Commit with clear messages
5. Open a PR to `dev`

### Never ❌
- Bypass type checking or linting
- Put business logic in components
- Call repositories directly from UI
- Run DSP in JavaScript
- Upload audio to any server

---

## 📄 License

See `LICENSE` for details.

---

## 💡 Questions?

- 📖 Read the docs in `docs/`
- 🏗️ Check the architecture decision record: `docs/decisions.md`
- 💬 Open an issue for bugs or feature requests

---

**Built with ❤️ for better sleep** 😴