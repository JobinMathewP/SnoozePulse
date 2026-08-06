# UI Guidelines

# Design Authority

The visual source of truth is:

1. docs/home-screen.jpg
2. docs/active-session.jpg
3. docs/summary-screen.jpg
4. docs/history-screen.jpg

The composite image

docs/mockup.jpg

exists only to show how the screens relate to one another.

Never infer layout from the composite if an individual screen exists.

Every screen implementation should visually match this design unless explicitly instructed otherwise.

The mockup has higher priority than AI-generated design decisions.

When uncertain about spacing, typography, component hierarchy, sizing or colors:

1. Compare against the visual source of truth.
2. Explain any unavoidable deviations.
3. Never redesign the interface unless requested.

## Design Language

Modern AMOLED-first interface with minimal visual noise.

## Colors

| Token      | Value   |
| ---------- | ------- |
| Background | #0B0F17 |
| Surface    | #161F30 |
| Primary    | #6366F1 |
| Alert      | #F43F5E |
| Success    | #10B981 |

Never hardcode colors. Use theme tokens.

## Typography

- Font: Inter / SF Pro / Roboto
- Large metric values
- Minimum body size: 14sp

## Spacing

Use spacing tokens only:

- xs = 4
- sm = 8
- md = 16
- lg = 24
- xl = 32

## Components

Build reusable primitives:

- Button
- Card
- StatusCard
- MetricCard
- SectionHeader
- Waveform
- TimelineChart

## Accessibility

- Minimum touch target 44x44.
- Every interactive element requires `accessibilityLabel`.
- Respect safe areas.

## Animation

- Reanimated only.
- Use subtle transitions (150–250ms).
- Avoid excessive motion during sleep monitoring.

## Pixel Accuracy

Target:

- Layout within ±4 px
- Border radius within ±2 px
- Correct visual hierarchy
- Consistent spacing
- Same information density

Use screenshots during development to compare with the mockup.
