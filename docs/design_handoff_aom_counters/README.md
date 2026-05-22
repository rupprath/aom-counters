# Handoff: AoM Counters — Companion App

## Overview

A small **always-on-top desktop overlay** that helps an Age of Mythology: Retold
player remember which units to build to counter the opponent's pantheon. The
user picks two gods (their own + the opponent's) and the overlay shows, in
two stacked rows, every threat the opponent's civ can field above the unit
they should be queueing in response.

This handoff covers three screens:

1. **Setup · first launch** — initial god picker with welcome banner.
2. **Strip · in-game overlay** — the always-on-top two-row matchup readout.
3. **Collapsed pip / pill** — minimised state (designed but not currently
   shown on the canvas; component code exists in `app.jsx`).

The intended runtime is **Tauri** (Rust shell + web UI), but the design is
framework-agnostic: it works in any window-managed web shell that supports
always-on-top.

---

## About the Design Files

The files in `design_prototype/` are **design references created in HTML/React-via-Babel**.
They are *prototypes showing intended look and behaviour*, not production code
to copy verbatim.

Your job is to **recreate these designs in the target codebase's environment**
using its established patterns and libraries. For the planned Tauri shell that
means a real React + Vite (or Svelte/Solid/etc.) build with proper module
bundling — drop the `<script type="text/babel">` runtime, lift the JSX into
real source files, and replace the inline `window.AOM` data bridge with a
proper import of the canonical `counter-data.json`.

If no environment exists yet, **React + Vite + TypeScript** inside the Tauri
crate is the most appropriate choice (small bundle, fits the always-on-top
overlay constraints).

## Fidelity

**High-fidelity.** Colours, spacing, type scale, border-radii, hover states
and motion are final. Recreate pixel-perfectly. The only intentional
placeholder is unit and god *imagery* — see "Image Slots" below.

---

## Image Slots

Every unit tile and god portrait in the design is a **fixed-size image slot**
with a neutral silhouette standing in. Real screenshots from Age of Mythology:
Retold (used under Microsoft's Game Content Usage Rules — licensing is
**resolved**) drop into:

```
images/units/{id}.png   e.g.  images/units/gr_hoplite.png
images/gods/{id}.png    e.g.  images/gods/zeus.png
```

The `id` keys already match the canonical data — see `data.js` and the
shipped `counter-data.json`. **Slot dimensions are the contract** and will
not change when art lands; just swap the silhouette `<svg>` for an
`<img src="images/units/${id}.png">` with `object-fit: cover` and
`border-radius` inherited from the slot.

The silhouette component in the prototype (`app.jsx` → `Silhouette`) renders
a generic head + shoulders shape at low opacity; in the real app you can keep
it as the fallback for missing assets.

---

## Screens / Views

### 1. Setup · first launch (empty state)

**Purpose** — shown the first time the app opens or whenever the user clicks
**New match** with an empty slate. Walks them through picking their god,
then the opponent's.

**Layout** — a 360×600 window. From top to bottom:

```
┌─ Title bar (32px) ─────────────────────────────────────────┐
│  • grip dots   "AOM COUNTERS · WELCOME"           [ × ]    │
├─ Welcome banner (~110px) ──────────────────────────────────┤
│  WELCOME — FIRST MATCH                                     │
│  Pick the god you're playing first, then your opponent's.  │
│  ① Your god  ──  ② Opponent                                │
├─ Vs strip (~64px) ─────────────────────────────────────────┤
│  [○] YOU PLAY          VS         [○] OPPONENT             │
│      Tap to pick                     Tap to pick           │
├─ Scrollable pantheon list (flex: 1) ───────────────────────┤
│  GREEK ────── 4                                            │
│  [ Zeus ][ Poseidon ][ Hades ][ Demeter ]                  │
│  EGYPTIAN ─── 3                                            │
│  [ Ra ][ Isis ][ Set ]                                     │
│  … Norse · Atlantean · Chinese · Japanese · Aztec          │
├─ Footer (~48px) ───────────────────────────────────────────┤
│  [ Cancel ]                          [ Pick both gods ]    │
└────────────────────────────────────────────────────────────┘
```

**Components**

- **Title bar** — 32 px tall, dark gradient, grip-dot drag handle (left),
  monospace caps title (centre), close button (right). The title reads
  "AOM COUNTERS · WELCOME" on first launch and "AOM COUNTERS · SETUP" when
  re-entered from the strip.
- **Welcome banner** — soft cyan tint over `--bg-1`, with:
  - **Eyebrow** ("WELCOME — FIRST MATCH" or "NEW MATCH") in Geist Mono 9.5 px,
    letter-spacing 0.16em, colour `--select`.
  - **Message** ("Pick the god **you're playing** first, then your
    opponent's.") in Geist 14 px regular. The bolded phrase has a horizontal
    cyan highlighter bar (40% opacity, sitting at 62–92% of the line height).
  - **Step indicator** — two 16 px numbered circles ("1 Your god"
    → "2 Opponent") joined by a 1 px line. States:
    - `idle` — text `--text-faint`, circle border `--line`, bg `--bg-0`.
    - `active` — text `--text`, circle border `--select`, bg cyan-tinted,
      with a 3 px cyan halo (`box-shadow: 0 0 0 3px ...`).
    - `done` — text `--text-dim`, circle border green (`--counter`),
      bg green-tinted, foreground `--counter`.
  - A 1 px cyan glow line sits at the banner's bottom edge as a soft
    affordance pointing down to the picker.
- **Vs strip** — two slot cards split by a "VS" label.
  - Each slot: 32 px circular portrait + label stack ("YOU PLAY" /
    "OPPONENT" eyebrow caps + name). Empty name reads "Tap to pick" in
    italic, `--text-faint`.
  - **Active slot** has a 2 px left-edge: cyan (`--select`) for the player,
    orange (`--threat`) for the opponent. This colour also rings the
    portrait when a god is picked.
- **Pantheon list** — 7 pantheons (Greek, Egyptian, Norse, Atlantean,
  Chinese, Japanese, Aztec). Each pantheon header is a sticky monospace
  caps row with a thin rule to the right and the god count. Gods are laid
  out in a 4-column grid (`grid-template-columns: repeat(4, 1fr)`, gap 6 px,
  padding 6 px 10 px 12 px).
- **God cell** — vertical stack of a 40 px circular portrait + 11 px god
  name. Default: `--bg-1` background, `--line-soft` border. Hover: bg
  `--bg-2`, border `--line`. Selected: cyan border, 9% cyan-tinted bg, and
  a small `✓` glyph top-right. A god that's already been picked for the
  *other* slot is rendered at 32% opacity and disabled.
- **Footer** — sticky bar with `--bg-1` bg and top border. Left: ghost
  `[ Cancel ]`. Right: primary `[ Pick both gods ]` (disabled until both
  slots are filled, then becomes `[ Start matchup → ]`).

**Copy**

| Element            | Text                                                      |
|--------------------|-----------------------------------------------------------|
| Banner eyebrow     | `WELCOME — FIRST MATCH` (first launch) / `NEW MATCH`      |
| Banner body        | `Pick the god you're playing first, then your opponent's` |
| Step 1             | `Your god`                                                |
| Step 2             | `Opponent`                                                |
| Player slot label  | `YOU PLAY`                                                |
| Opponent slot      | `OPPONENT`                                                |
| Empty slot name    | `Tap to pick`                                             |
| Footer cancel      | `Cancel`                                                  |
| Footer primary     | `Pick both gods` (disabled) → `Start matchup →` (ready)   |

### 2. Strip · in-game always-on-top overlay

**Purpose** — sits along the top or bottom of the game screen. Two rows:
"Enemy uses" above, "Counter with" below. Each *column* is a matchup pair —
read down a column to know what to queue against the unit above.

**Layout** — fluid width (≈760 px minimum, scrolls horizontally for the
full pool), height ≈228 px (24 px title bar + 2× 102 px rows).

```
┌─ Strip bar (24px) ─────────────────────────────────────────────────────────┐
│ • grip  [○]Zeus → Set[○]   PATCH 19.10195 · 8 threats · 7 myth   ⟲ NEW MATCH  −  × │
├──────────────────┬─────────────────────────────────────────────────────────┤
│ THEY BUILD       │ Spear  ChAr  Camel  Axe   Sling  Eleph  Cata  Tower │ ⋯ Myth ▾│
│ Enemy uses       │ [img]  [img]  [img]  [img] [img]  [img]  [img] [img]│  [stack×7]│
├──────────────────┼─────────────────────────────────────────────────────────┤
│ YOU BUILD        │ Hypa.  Pelt. Prod.  Hypa. Pelt.  Prod.  Hipp. Hipp.│ ⋯ Greek Hero │
│ Counter with     │ [img]  [img]  [img]  [img] [img]  [img]  [img] [img]│  (beats every myth) │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

**Components**

- **Strip title bar** — 24 px tall, dark gradient. Left to right:
  - Grip dots (drag handle).
  - **Mini vs** — 16 px ringed god avatars + "Zeus → Set" in Geist 11 px.
    Player ring is cyan (`--select`), opponent ring is orange-red
    (`--threat`).
  - **Meta** — `PATCH 19.10195 · 8 threats · 7 myth` in Geist Mono 9.5 px,
    right-aligned via `margin-left: auto`, colour `--text-faint`.
  - **New match button** *(this is the primary action)* — labelled pill with
    swap-arrows icon + "NEW MATCH" text. Cyan-tinted (border
    `color-mix(in oklab, var(--select) 55%, var(--line))`, background
    `color-mix(in oklab, var(--select) 14%, transparent)`). Geist Mono
    9.5 px / 0.10em tracking, uppercase. 18 px tall, 999 px border-radius.
    Hover ramps the tint to 24% / 75%.
  - Minimise (−) and Close (×) icon buttons (`.win-btn`, 18 × 18).
- **Row label column** — fixed 110 px wide, vertically centred:
  - Top row: kicker "THEY BUILD" (orange-red caps mono 9 px), head
    "Enemy uses" (Geist 14 px semibold, orange `oklch(0.86 0.10 25)`).
  - Bottom row: kicker "YOU BUILD" (green caps mono 9 px), head
    "Counter with" (Geist 14 px semibold, green `oklch(0.88 0.10 150)`).
  - Background `oklch(0.155 0.005 250)`, right border `--line-soft`.
- **Row track** — horizontally scrollable flex container. Each cell is a
  64 px-wide column with a 44 × 44 px image slot on top + two-line unit
  name centred below (Geist 10.5 px, line-clamp 2). Adjacent columns are
  separated by a 1 px `--line-soft` left border. Hovering a column adds a
  `--bg-1` tinted bg.
- **Category edge stripe** — every image slot has a 3 px-wide left edge
  coloured by the unit's category (`--c-infantry` etc.). Plus the slot
  itself uses `color: var(--c-*)` so the silhouette inside picks up the
  category tone subtly.
- **Myth divider** — a vertical dashed line (`1px dashed --line-strong`,
  6 px top/bottom margins, 8 px horizontal margins) separates the 8 core
  threats from the myth pool.
- **Myth summary column** (collapsed default) — 78 px wide, shows a stack of
  3 dashed-border tiles (rotated -5°/+2°/0°) with a violet `×7` badge.
  Caption: `Myth units · 7 possible ▾`. Click expands to the full list of
  myth units inline.
- **Hero zone** (counter row, opposite the myth pool) — one wide cell with
  a gold-tinted bg (`color-mix(in oklab, var(--c-hero) 6%, transparent)`),
  hero image slot, name "Greek Hero", and uppercase caption
  "BEATS EVERY MYTH UNIT". Hover ramps gold tint to 16%.
- **Pair hover** — hovering any enemy column highlights *the same column*
  in the counter row (and vice versa). Tracked via a `hovered` state keyed
  on `pairKey` (the enemy unit id, or `"myth"` for the myth↔hero pair).

**Copy**

| Element             | Text                                            |
|---------------------|-------------------------------------------------|
| Enemy row kicker    | `THEY BUILD`                                    |
| Enemy row head      | `Enemy uses`                                    |
| Counter row kicker  | `YOU BUILD`                                     |
| Counter row head    | `Counter with`                                  |
| Meta line           | `PATCH {n} · {threats} threats · {myth} myth`   |
| Strip CTA           | `NEW MATCH`                                     |
| Myth summary        | `Myth units` / `{n} possible ▾`                 |
| Hero zone caption   | `Beats every myth unit` (or `Beats all {n} myth units` when expanded) |

### 3. Collapsed pip / pill (designed; not on canvas)

Two minimised forms exist as components (`CollapsedState` in `app.jsx`)
but aren't currently on the design canvas. Match them when implementing the
minimise (−) flow:

- **Round pip** — 56 × 56 px circle, two overlapping 22 px ringed god
  portraits (cyan + orange-red), tiny "VS" caption underneath. Click expands
  to the strip.
- **Horizontal pill** — 36 px pill, twin god portraits + "Zeus VS Set" text
  in Geist Mono 10 px caps tracking 0.08em. Same click behaviour.

---

## Interactions & Behaviour

### Setup flow
- Click a slot card (`YOU PLAY` / `OPPONENT`) to make it the *active* slot.
  The active slot gets a 2 px cyan ring around its avatar.
- Click a god cell to fill the active slot.
  - If the active slot is `player` and `opponent` is still empty, the
    selection **auto-advances** to `opponent`.
  - A god already picked in the *other* slot is greyed-out (32% opacity)
    and not clickable.
- Once both slots are filled, the primary footer button enables and reads
  `Start matchup →`. Clicking it transitions to the strip overlay.
- `Cancel` and the title-bar `×` both close the setup window without
  changing the current matchup.

### Strip flow
- `NEW MATCH` (title-bar pill) → opens the setup window. **This is the primary
  action** — the labelled pill exists specifically because the small gear
  icon it replaced was not discoverable enough.
- `−` (minimise) → collapse to pip / pill.
- `×` → quit the overlay.
- Hovering any unit column highlights its paired column in the other row.
- Clicking the myth summary expands the myth pool inline (all 7 myth
  threats rendered as narrower 56 px columns with dashed image slots and a
  "via {minor-god}" caption). A "▴" fold button appears at the end to
  collapse again. The single Greek Hero counter cell remains opposite the
  whole myth section regardless of expand/collapse state.

### Transitions
- All hovers / state changes use `transition: background 0.12s, border-color
  0.12s` (already wired in `styles.css`).
- No bespoke entrance / exit animation specified — keep it instantaneous to
  match the always-on-top utility feel.

---

## State Management

```ts
type AppState =
  | { mode: "setup",     player: God | null, opponent: God | null, firstLaunch: boolean }
  | { mode: "strip",     player: God,        opponent: God,        mythExpanded: boolean }
  | { mode: "collapsed", player: God,        opponent: God,        variant: "pip" | "pill" };
```

- **`firstLaunch`** persists in app storage (Tauri's `app_data_dir` JSON or
  `localStorage` in dev). True until the user successfully starts their
  first matchup.
- **Picked gods** persist so the strip restores the last matchup on relaunch.
- **`mythExpanded`** is ephemeral (component-local).
- **`hovered`** (pair-hover) is ephemeral.

No data fetching is needed at runtime — the entire counter-graph ships as a
static `counter-data.json` bundled with the binary. Loading the JSON once
at startup is sufficient.

---

## Design Tokens

Defined in `:root` in `styles.css`. All colours are **OKLCH** — same chroma
across category accents, varying hue, so they read at a glance without one
dominating.

### Surfaces (cool near-black, slight blue tint)

| Token           | Value                              | Use                                |
|-----------------|------------------------------------|------------------------------------|
| `--bg-0`        | `oklch(0.135 0.005 250)`           | Window background                  |
| `--bg-1`        | `oklch(0.180 0.006 250)`           | Cards, banners, footer             |
| `--bg-2`        | `oklch(0.220 0.007 250)`           | Image-slot fill, hovered cells     |
| `--bg-3`        | `oklch(0.270 0.008 250)`           | Scrollbar thumb                    |
| `--bg-hover`    | `oklch(0.250 0.008 250)`           | Icon-button hover                  |

### Borders

| Token            | Value                              |
|------------------|------------------------------------|
| `--line`         | `oklch(0.300 0.009 250)`           |
| `--line-soft`    | `oklch(0.240 0.008 250)`           |
| `--line-strong`  | `oklch(0.420 0.012 250)`           |

### Text

| Token          | Value                                |
|----------------|--------------------------------------|
| `--text`       | `oklch(0.965 0.003 250)`             |
| `--text-2`     | `oklch(0.820 0.005 250)`             |
| `--text-dim`   | `oklch(0.640 0.007 250)`             |
| `--text-faint` | `oklch(0.480 0.008 250)`             |

### Category accents (same chroma, varied hue)

| Token          | Hue value                            | Use            |
|----------------|--------------------------------------|----------------|
| `--c-infantry` | `oklch(0.78 0.11 245)` — steel blue  | Infantry tiles |
| `--c-ranged`   | `oklch(0.80 0.11 165)` — teal-green  | Ranged tiles   |
| `--c-cavalry`  | `oklch(0.80 0.11 75)` — amber        | Cavalry tiles  |
| `--c-siege`    | `oklch(0.78 0.11 35)` — burnt orange | Siege tiles    |
| `--c-myth`     | `oklch(0.78 0.11 305)` — violet      | Myth tiles     |
| `--c-hero`     | `oklch(0.86 0.10 95)` — gold         | Hero zone      |

### Semantic

| Token       | Value                              | Use                   |
|-------------|------------------------------------|-----------------------|
| `--threat`  | `oklch(0.74 0.13 25)` — orange-red | Enemy row, opp ring   |
| `--counter` | `oklch(0.78 0.12 150)` — green     | Counter row, "done"   |
| `--select`  | `oklch(0.82 0.12 220)` — cyan      | Selection, primary CTA|
| `--warn`    | `oklch(0.80 0.13 80)`              | (unused, reserved)    |

### Typography

```css
--font-ui:   "Geist", "Helvetica Neue", system-ui, sans-serif;
--font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
font-feature-settings: "ss01", "cv11";
```

Type scale used in the design:

| Size  | Where                                           |
|-------|-------------------------------------------------|
| 14 px | Row heads ("Enemy uses"), setup intro body      |
| 13 px | Unit-row name, vs-slot name (12.5)              |
| 11 px | God cell name                                   |
| 10.5 px | Strip unit name, win-title                    |
| 10 px | Pantheon header, region header                  |
| 9.5 px | Strip meta, kicker labels, step indicator      |
| 9 px  | Row kickers ("THEY BUILD"), counter chip ct     |
| 8.5 px | Strip mini-vs glyphs, myth caption             |

Letter-spacing is `0.08–0.18em` for all monospace caps eyebrows / kickers,
`-0.005em` for the row heads, default for body.

### Radii

```css
--r-xs: 3px;   /* tiny — pill stripes, icon buttons */
--r-sm: 5px;   /* unit tile, image slot */
--r-md: 7px;   /* cards, slot containers, god cell */
--r-lg: 10px;  /* window shell, strip */
```

### Shadows

```css
--shadow-window:
  0 18px 40px -12px rgba(0,0,0,0.55),
  0 2px 0 rgba(255,255,255,0.04) inset;
```

Used on every floating element (`.win`, `.strip`, `.pip`, `.pip-pill`).

### Spacing scale

The design uses a loose 2/4/6/8/10/12/14 px progression. No formal scale
variable; values are inline. If you want a token system, normalise to a
**4 px base** with half-step (2 px) and 1.5× step (6 px) allowances.

---

## Assets

- **Fonts** — Geist + Geist Mono, loaded from Google Fonts in `styles.css`.
  In production, **self-host** the WOFF2 files (Geist is OFL — no licensing
  blocker) so the offline Tauri build doesn't need network.
- **Unit & god imagery** — **not** in this bundle. Drop into
  `images/units/{id}.png` and `images/gods/{id}.png` at the project root.
  IDs match `counter-data.json`. Source: Age of Mythology: Retold
  screenshots under Microsoft's Game Content Usage Rules (licensing
  resolved).
- **Icons** — three inline SVG glyphs (close, minimise, swap-arrows) live
  inline in `app.jsx`. Lift them into an `icons/` module when porting.
  No external icon set is used.
- **`counter-data.json`** — the canonical data file (not bundled in this
  handoff; see your repo). The prototype's `data.js` is a curated subset
  exposing `PANTHEONS`, `GODS`, `THREAT_ROWS`, `MYTH_ROWS`,
  `ZEUS_COUNTERS`, `COUNTER_MAP`. In the real app you'll resolve threats /
  counters dynamically from the full JSON given any (player, opponent)
  pair.

---

## Files

Everything under `design_prototype/`:

| File                | What it is                                                          |
|---------------------|---------------------------------------------------------------------|
| `index.html`        | Entry point + design-canvas host. Renders the three artboards.      |
| `app.jsx`           | All product components (`SetupState`, `StripState`, `CollapsedState`, `Silhouette`, icons). |
| `data.js`           | Curated subset of `counter-data.json` for the Zeus-vs-Set worked example. |
| `styles.css`        | Full token system + every component's styles. Single source of truth for visuals. |
| `design-canvas.jsx` | The presentation harness only (pan/zoom canvas with artboards). **Not part of the product** — discard when porting. |

To view the prototype, open `design_prototype/index.html` in any modern
browser. The page hosts the components inside the design canvas — you can
drag, zoom, and double-click any artboard to focus it.

---

## Implementation notes / gotchas

- **Don't ship `design-canvas.jsx`.** It's only the presentation harness.
  Render `StripState`, `SetupState`, and `CollapsedState` directly into the
  Tauri window.
- **Window chrome** — the design has its own title bar (grip dots + title +
  close). In Tauri, configure the window with `decorations: false` so the
  designed title bar *is* the chrome, and wire the grip area as the drag
  region with `data-tauri-drag-region`.
- **Always-on-top** — set the Tauri window `alwaysOnTop: true` and a
  reasonable default size (~860 × 230 px for the strip).
- **Sizing the strip to content** — the strip's `.row-track` scrolls
  horizontally when the threat list overflows. Keep `min-width: 760px` on
  the strip and let the window resize; do not lock the strip width.
- **The "New match" pill is the primary action** in the strip — it was
  intentionally made labelled-and-coloured rather than icon-only because the
  previous icon-only treatment was not discoverable. Don't quietly demote it
  back to an icon during the port.
- **Image slot fallback** — keep the `Silhouette` component as the
  graceful fallback when an `images/units/{id}.png` is missing (e.g. a
  unit added in a patch before art ships).
- **Accessibility** — every interactive element is currently a `<button>`,
  hover states are colour-only. Add focus-visible rings (re-use
  `.ring`'s style: 2 px `--select` outer + 2 px 25% cyan halo) and
  `aria-label` on the silhouette-only buttons when porting.
