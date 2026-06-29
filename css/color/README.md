# Colour — set intent, not colour

The point of this system's colour model is that you **never track colours**. No hex
values, no shade names, no palette to keep in sync across a large project. You
declare *intent* — how loud, neutral or chromatic, which hue — and one declarative
engine derives the actual OKLCH colour, with correct contrast, in light and dark,
automatically. Add a hundred screens and there is still nothing to maintain: every
surface and every bit of ink re-derives itself from the numbers it inherits.

Two knobs carry almost everything: **`--bg`** paints surfaces; **`--fg`** inks the
content sitting on them.

---

## The signed scale

`--bg` and `--fg` both run **`-1 … 0 … +1`**, and the sign is the whole trick:

- **Sign picks the palette.** Negative = the **neutral** scale (greys / the theme's
  surface tones). Positive = the **colour** scale (the current hue).
- **Magnitude is loudness.** `0` is *quiet* — it blends into whatever is behind it.
  Toward `±1` is *loud* — maximum depth (for a surface) or contrast (for ink).

So the only decision you make: loud-and-neutral → toward **`-1`**; loud-and-colourful
→ toward **`+1`**; quiet → toward **`0`**.

---

## `--bg` — surfaces

The **neutral** half (`-1 … 0`) is a depth stack: `-1` is the **floor** (the recessed
base), `0` is the **top** — the most-raised neutral surface. (An unset element
defaults to `0`, which is why a popover or drawer reads as "on top" for free.)
Content surfaces climb from the floor up toward `0`.

The **colour** half (`0 … +1`) makes a surface *be* colour — a banner, an accent
rail — by pulling in the current hue.

You only ever say "more recessed", "more raised", or "more colourful"; the engine
flips the real lightness between light and dark themes for you.

### Standard page surfaces (baked in, overridable)

`.page` regions ship with defaults, so an app has depth out of the box:

| region | `--bg` | intent |
|---|---|---|
| `body` | `-1` | the floor |
| `.pg-footer`, `.pg-aside` | `-0.8` | just above the floor |
| `.pg-main` (+ `pg-main-header`/`-footer`) | `-0.6` | neutral content, headroom to climb toward `0` |
| `.pg-header`, `.pg-subheader` | `-1` | blend into the body |
| `.pg-navigation` | `0.1` | a touch of colour |
| `.pg-banner` | `0.2` | colourful — attention |

Cards, popovers, and nested panels set their own `--bg` higher (toward `0`) to lift
off the region they sit in. Override any default at the call site.

---

## `--fg` — ink

Intensity is `abs(--fg)`. `0` paints the ink the *same* as its surface (invisible —
handy for "reveal on hover"); `±1` is maximum contrast. Negative = neutral ink (the
default body ink is `-0.85`); positive = chromatic ink in the current hue. You never
choose light-vs-dark text — the engine compares the surface lightness to a flip
point and picks the legible side automatically.

```html
<p style="--fg:-0.6">quiet, neutral caption</p>
<strong style="--fg:0.9">loud, chromatic emphasis</strong>
```

**Practical ranges.** Body text sits near the default `-0.85`. For *muted / secondary*
text reach for about **`-0.5` to `-0.7`** — still clearly legible. `-0.2`/`-0.3` is
**not** "slightly muted," it's nearly invisible: magnitude *is* contrast, so a small
absolute value means almost no contrast with the surface. For chromatic emphasis,
`+0.6` to `+0.9`.

---

## The surface contract

Components are **borderless**; separation comes from **surface difference**. Two
touching surfaces must differ in `--bg`, or the edge vanishes. A surface element
paints itself and exports both its lightness *and* its position so its ink and
descendants resolve against it — the canonical three-line painter:

```css
background-color: var(--_bg);
--surf-l:  var(--_bg-l);   /* lightness — the ink-contrast target */
--surf-bg: var(--bg);      /* position — the anchor for relative --lift */
```

For an ad-hoc surface in markup, the class **`.bg`** is exactly those lines.
Real surface components inline them, so you rarely type `.bg`.

> Two touching surfaces at the same `--bg` are invisible to each other. Differentiate
> them, or — only when two same-level surfaces genuinely must touch — opt into a
> `--border`.

## Relative lift — `--lift`

`--bg` places a surface at an *absolute* position. `--lift` places a control at a
position *relative to whatever surface it sits on*: its surface resolves to
`--surf-bg + --lift`. That keeps a control a consistent step of contrast on any
host — a button at `--bg:0.6` vanishes on a `0.6` panel and inverts past it; a
button at `--lift:0.5` always sits a step above its host. The engine resolves an
effective position from the two: `--lift` set → `--surf-bg + --lift`; unset →
absolute `--bg`.

The contract is a strict split, and it's what keeps it cycle-free:

- **Surfaces publish.** Every painter exports `--surf-bg: var(--bg)` (the third
  painter line above) — the inheriting twin of `--surf-l`. A plain layout wrapper
  (`.column`/`.row`) doesn't paint, so it passes the nearest real surface straight
  through.
- **Controls read.** `<button>`, `.nav-item`, `.nav-icon` set `--lift` and **omit**
  the `--surf-bg` line. A control that both read `--surf-bg` and re-published it
  would form a `--bg ↔ --surf-bg` cycle and compute to invalid — so lift is a
  *control* concept; surfaces place themselves absolutely with `--bg`.

```css
:where(button) { --lift: 0.5; }                 /* a step above its host, set at the call site with --lift */
:where(.nav-item, .nav-icon) { --lift: 0.06; }  /* quiet at rest; --lift:0.4 when live */
```

Caveat: a constant `--lift` is **not** a constant *perceived* step. The surface
curve is non-linear — the negative side compresses toward the floor, far more in
the dark bank (`--surf-curve` is higher) — so the same `--lift` reads stronger near
`0` than down near `-1`. For truly uniform visual lift you'd step in `--surf-l`
(lightness) space, but that severs lift from the ink/border/chroma derivation, so
the system keeps it in `--bg`/position space.

---

## Hue — `--hue`, `--hue-shift`, `--hue-lock`

The hue resolves as `--hue-lock` if set, otherwise `--hue + --hue-shift`.

- **`--hue`** (0–360, default 255) re-themes a whole subtree. Set it on a section
  and everything under it — surfaces, ink, borders, focus — recolours. A fall
  calendar goes autumnal with a single `--hue`.
- **`--hue-shift`** rotates *relative* to the inherited hue — the right basis for
  project roles: define `.pri`/`.sec`/`.ter` as hue-shifts, then changing the page
  `--hue` rolls the whole palette while keeping the relationships intact. (Use
  absolute hues instead if you'd rather pin fixed roles — it's flexible either way,
  with no setup.)
- **`--hue-lock`** is a hard override: invalid by default (so resolution falls
  through to hue + shift), but when set it **pins the entire subtree** to that hue
  regardless of ambient values. This is what makes global helper classes possible.
  Reach for it on small branches and leaves (a tag, an alert) where the colour must
  never drift.

### Semantic hues — `.suc` / `.inf` / `.wrn` / `.dgr`

Four helpers lock to a meaning's hue — success (145), info (255), warning (75),
danger (25) — defined once as `--hue-suc`/`--hue-inf`/`--hue-wrn`/`--hue-dgr`. They
set `--hue-lock`, so the element *and its subtree* hold that hue no matter the
ambient `--hue`. Alerts, tags, and form validation all consume the same four.

```html
<div class="alert dgr" role="alert">Couldn't save.</div>
<span class="tag suc">Active</span>
```

A "primary" colour is **not** a helper — it's a hue at the call site
(`<button style="--hue:262">`), or a one-line project alias (`.pri { --hue:262 }`).
Never a system class.

---

## SVG

Icons have no surface of their own. They ride the `color: currentColor` bridge and
are inked by `--fg` (plus the hue trio) exactly like text — so
`stroke="currentColor"` / `fill="currentColor"` always lands the right contrast.

---

## Typed tokens — for *building* components

When you author a component you may read two tokens the engine always computes:

- **`--border`** — a quiet neutral line, offset from the surface by theme (lighter
  in dark, darker in light).
- **`--focus`** — the chromatic accent: focus rings, the `.Card` edge, the `.tabs`
  selection.

These are component-author tools, not end-user colour knobs.

---

## Don'ts

- ❌ a literal colour (hex/rgb/named) anywhere — declare intent with `--bg`/`--fg`/`--hue`
- ❌ reaching for `--surface-chroma` to colour a surface — it is a **configuration**
  knob (the neutral-tint baseline; the engine also zeroes it to wash disabled
  controls). To make a surface colourful, raise `--bg` into the positive range with
  a `--hue`. Don't set it in application code.
- ❌ choosing light-vs-dark text — the engine flips ink for you
- ❌ two touching surfaces at the same `--bg`
- ❌ a `.primary`/`.danger` *variant* class — colour is a hue; meaning is a semantic
  hue-lock helper
- ❌ publishing `--surf-bg` on a control that sets `--lift` (or reading `--lift` on a
  surface that publishes) — one element doing both cycles; surfaces publish, controls read
