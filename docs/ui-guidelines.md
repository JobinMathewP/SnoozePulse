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

### Ratified deviations

Only two elements of the reference images are deliberately not reproduced:

- The product name renders as **SnoozePulse**, not "SnoreCare" (ADR-08).
- The **Insights** and **Profile** tabs are not part of the product (ADR-09).

## Design Language

Modern AMOLED-first interface with minimal visual noise.

## Colors

### Base tokens

| Token      | Value   |
| ---------- | ------- |
| Background | #0B0F17 |
| Surface    | #161F30 |
| Primary    | #6366F1 |
| Alert      | #F43F5E |
| Success    | #10B981 |

Never hardcode colors. Use theme tokens.

### Extending the palette: sample, never invent

The reference images contain colors the five base tokens do not cover. These are **sampled
directly from the design images**, pixel by pixel. No token value may be guessed, eyeballed,
or generated (ADR-06).

Procedure, performed in Phase 2:

1. Open the relevant reference image in `docs/`.
2. Sample the pixel at the element in question.
3. Record the token name, the hex value, the source image, and the element sampled.
4. Add it to `src/theme/colors.ts` with that provenance in a comment.

Tokens that must be sampled before any screen work begins:

| Token group     | Sampled from                                   |
| --------------- | ---------------------------------------------- |
| Warning / amber | `summary-screen.jpg` — "Moderate" snore score and its dot scale |
| Text tints      | All four images — value white, body gray, caption gray |
| Card border     | `summary-screen.jpg`, `history-screen.jpg` — card edges |
| OLED background | `active-session.jpg` — screen background        |
| Active accent   | `active-session.jpg` — status text and waveform |
| Hero gradient   | `home-screen.jpg` — start button fill, ring, glow |
| Timeline gradient | `summary-screen.jpg` — bar stops, low through peak |
| Tab bar         | `home-screen.jpg` — bar background, active and inactive icons |

The Active Session screen uses its own background token rather than the standard
`Background`. This is intentional AMOLED power saving, matches the image, and is required by
PRD §4 ("OLED-friendly UI").

## Typography

- Font: **Inter**, bundled via `expo-font` and `@expo-google-fonts/inter` so Android and iOS
  render identically (ADR-07). The earlier "Inter / SF Pro / Roboto" wording described a
  fallback stack, not a per-platform choice.
- Large metric values
- Minimum body size: 14sp
- Support dynamic font scaling

## Spacing

Use spacing tokens only:

- xs = 4
- sm = 8
- md = 16
- lg = 24
- xl = 32

## Components

Build reusable primitives:

- Screen
- Button
- Card
- StatusCard
- MetricCard
- SectionHeader
- Waveform
- TimelineChart

Styling uses NativeWind. The Tailwind config is generated from `src/theme/`, so tokens stay
the single source of truth and no raw value ever appears in a className.

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

Verification target is the Android Emulator first, then a physical Android device. iOS
verification is deferred (ADR-17).
