# SnoozePulse – Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Draft  
**Platform:** React Native (Expo Development Build)  
**Target Devices:** Android & iOS

---

# Design Reference

The official UI specification is:

Primary References

- docs/home-screen.jpg
- docs/active-session.jpg
- docs/summary-screen.jpg
- docs/history-screen.jpg

Secondary Reference

- docs/mockup.jpg

All screens should match this visual language.

The mockup defines:

- layout
- spacing
- typography
- colors
- navigation
- card hierarchy
- icon placement

The PRD describes behavior.

The mockup describes appearance.

If there is a conflict:

Behavior comes from the PRD.

Appearance comes from the mockup.

# 1. Product Vision

SnoozePulse is a privacy-first sleep monitoring application that detects snoring during sleep, records important snore events, analyzes sleep quality, and presents meaningful insights without uploading audio to the cloud.

All processing and storage occur locally on the device unless a future cloud sync feature is enabled.

---

# 2. Goals

## Primary Goals

- Detect snoring accurately
- Record only relevant snore audio snippets
- Operate throughout an entire night's sleep
- Minimize battery consumption
- Provide actionable sleep analytics

## Non-Goals

- Medical diagnosis
- Sleep apnea diagnosis
- Cloud storage in V1

---

# 3. Target Users

People who:

- Snore regularly
- Want to understand sleep quality
- Need overnight monitoring
- Prefer privacy-first local processing

---

# 4. Core Features

## Home

- Start Sleep Session
- Device readiness checks
- Battery warning
- Microphone permission status
- Ambient noise calibration

## Active Sleep

- OLED-friendly UI
- Live clock
- Audio waveform visualization
- Slide to end session
- Background recording indicator

## Morning Summary

Display:

- Sleep duration
- Snore count
- Snore score
- Total snoring time
- Peak loudness
- Loudest event
- Interactive timeline
- Playable audio snippets

## History

- Weekly trends
- Monthly trends
- Sleep score history
- Snore reduction comparison
- Calendar overview

---

# 5. Functional Requirements

## Recording

- Start monitoring manually
- Continue while screen is locked
- Foreground service on Android
- Background audio mode on iOS

## Detection

Native audio engine should:

- Calculate RMS
- Estimate dB
- Detect snore events
- Ignore noise below threshold
- Save only significant snippets

## Storage

Persist locally using SQLite.

Suggested tables:

- sleep_sessions
- snore_events

---

# 6. UI Theme

Background:
#0B0F17

Surface:
#161F30

Primary:
#6366F1

Alert:
#F43F5E

Success:
#10B981

Typography:

- Inter
- SF Pro
- Roboto

Rounded corners:
16px+

Spacing:
8 / 16 / 24 / 32 token system

---

# 7. Architecture

Native Audio Engine

↓

React Native Bridge

↓

Zustand Store

↓

Repository Layer

↓

SQLite

↓

UI

---

# 8. Performance Targets

- Stable overnight recording
- Memory usage should remain stable
- UI updates throttled to approximately 100–200ms
- No unnecessary allocations
- Smooth 60 FPS UI

---

# 9. Accessibility

- accessibilityLabel for all controls
- Minimum touch size 44x44
- Dynamic font scaling support
- High contrast color usage

---

# 10. Future Enhancements

- Cloud backup
- AI snore classification
- Wearable integration
- Smart alarm
- Sleep apnea risk estimation
- PDF report export

---

# 11. Definition of Done

A feature is complete when:

- TypeScript passes
- ESLint passes
- No runtime warnings
- Accessibility verified
- Theme tokens used
- Repository pattern followed
- No placeholder implementations
- Documentation updated
