# Screen References

## Scope

The product is four screens: **Home**, **Active Session**, **Summary**, **History**.

The reference images show a four-tab bottom bar including **Insights** and **Profile**.
Those two are not part of the product. They are not built and not stubbed — the images are
stale on this point (ADR-09).

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

- Hero button
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
