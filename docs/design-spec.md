# Screen References

## Scope

The product is four screens: **Home**, **Active Session**, **Summary**, **History**, plus
**Settings** (from the Home gear) and first-run **Onboarding**.

The reference images show a four-tab bottom bar including **Insights** and **Profile**.
Those two are not part of the product. They are not built and not stubbed — the images are
stale on this point (ADR-09).

Product v2 does not add a tab. It adds a Sleep Schedule section in Settings (and
optionally an onboarding step) and changes Home copy when automatic tracking is on.
Until a dedicated v2 Home mock exists, reuse existing primitives and tokens. Do not
invent a new visual language (ADR-06, ADR-31).

## Navigation Map

```text
Tabs (src/app/(tabs)/)
  Home        (tabs)/index.tsx      ← gear icon in header opens Settings
  History     (tabs)/history.tsx

Outside the tab bar
  Active Session   session/active.tsx        full screen, no tab bar, no back
  Summary          session/[id]/summary.tsx  pushed, has back + share
  Settings         settings.tsx              pushed from the Home header gear
```

Active Session deliberately hides the tab bar: it is a full-screen, dimmed, lock-friendly
surface intended to be glanceable in a dark room.

---

Home Screen

Reference Image:

docs/home-screen.jpg

Description

Landing page.

Contains:

- Hero button (manual Start). When automatic tracking is on, tonight's status is the
  primary daily message and Start remains as an override (product v2).
- Status cards
- Bottom navigation

---

Active Session

Reference Image:

docs/active-session.jpg

Contains:

- Digital clock
- Live waveform
- Slide to stop

The only control is "slide to end session". There is no pause button: `PAUSED` is a
system-only state (ADR-14).

---

Summary Screen

Reference:

docs/summary-screen.jpg

Contains:

- Metrics
- Timeline
- Audio snippets

---

History Screen

Reference:

docs/history-screen.jpg

Contains:

- Weekly trends
- Calendar
- Comparison cards

---

Settings

No dedicated reference image for Sleep Schedule yet. Add the v2 section using existing
Settings rows, cards, and tokens (`src/features/settings/`). Bedtime, wake time, automatic
tracking opt-in, and the microphone privacy sentence from
`docs/prd-automatic-sleep-tracking.md` §17.

Onboarding

ADR-30's four slides stay. A schedule / opt-in step may be added later in M7; Settings-only
is acceptable for Task 7.2.

Do NOT:

- redesign layouts
- invent new colors — sample them from the images instead (ADR-06)
- move navigation
- replace cards
- simplify charts
- build Insights or Profile

Allowed:

- responsive scaling
- platform-specific adjustments
- accessibility improvements
- performance optimizations
- the two ratified deviations: SnoozePulse branding, and dropping Insights/Profile

When implementing screens:

1. Study docs/\*.jpg image files.
2. Build reusable components.
3. Compare the rendered screen with the mockup.
4. Iterate until visually close.
