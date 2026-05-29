# color.css

A small color system. **Color is a function of a few inherited numbers.**
You set the numbers; one formula computes every surface, every piece of
contrasting text, hue reflow, and hover/active/disabled states — all in
OKLCH, all theme-correct, because they re-run the same math.

There is no palette to maintain. There are no `--blue-500` tokens. There
is one scale per axis and a position on it.

```html
<link rel="stylesheet" href="color.css">
```

---

## The whole API

Six numbers you set. Everything else is derived.

| Variable           | Range        | Meaning |
|--------------------|--------------|---------|
| `--bg`             | `-1 … 0 … 1` | Surface. `<0` neutral (pages/cards/wells), `>0` color (chips/heat), `0` = base/top. |
| `--fg`             | `-1 … 0 … 1` | Ink **on** the surface. `0` = the surface itself, `<0` neutral ink, `>0` chromatic ink, `\|fg\|` = strength. |
| `--hue`            | `0 … 360`    | Base hue. Inherits — set it on a container to recolor the whole subtree. |
| `--hue-shift`      | `0 … 360`    | Per-element offset from the base hue. |
| `--hue-lock`       | `0 … 360`    | Absolute hue; overrides hue + shift. Unset = follows context. |
| `--surface-chroma` | `0 … 1`      | Neutral tint (`0` = pure grey, up = a hint of the hue). |

Two classes do the painting:

| Class       | Effect |
|-------------|--------|
| `.bg`       | Paints the computed surface and hands it down to children as the contrast target. |
| `.hoverable` / `.clickable` | Marks a non-interactive surface as a unit that lifts on hover / presses on active. |

`button`, `a`, and `[role=button]` are interactive automatically.

---

## The two roads

`--bg` is a single signed axis with `0` in the middle:

```
   neutral road            color road
  -1 ........... 0 ........... 1
 floor        base/top      full color
 (darkest    (brightest    (saturated,
  surface)    surface)      marches to color end)
```

- **Negative** = a neutral surface. `0` sits on top (brightest in light
  mode); `-1` is the floor. Use it for pages, cards, panels, wells.
- **Positive** = the color road. Chroma and lightness climb toward the
  color end. Use it for chips, badges, and data-viz heat.

```html
<div class="bg" style="--bg:-0.3">a card</div>
<div class="bg" style="--bg:-0.6">  a well inside it</div>
<span class="bg" style="--bg:0.65">a chip</span>
```

---

## Ink

`--fg` is the same idea, pointed at the text. `0` is the surface itself
(so text disappears); walk negative for neutral contrast, positive for
chromatic. Ink always contrasts the **surface it sits on** (it reads the
inherited surface lightness), and the black/white flip is biased to favor
light ink — tune with `--fg-flip`.

```html
<div class="bg" style="--bg:-0.3">
  <h3 style="--fg:-0.95">Heading</h3>      <!-- strong neutral -->
  <p  style="--fg:-0.55">Body copy</p>     <!-- softer neutral -->
  <a  style="--fg:0.85">A chromatic link</a>
</div>
```

Default text is `--fg: -0.85` — readable neutral ink — so you usually only
set `--fg` where you want something other than that.

---

## Hue: reflow, shift, lock

One resolved hue per element:

```
--_h = var(--hue-lock, calc(--hue + --hue-shift))
```

- **`--hue`** inherits. Set it on a container and the whole subtree
  reflows — surfaces, chips, ink, all of it — from one variable.
- **`--hue-shift`** offsets relative to that base, so chart series or a
  relative palette rotate *together* when you rebrand.
- **`--hue-lock`** ignores both — for semantics that must stay put.
  `--hue-lock: initial` re-unlocks a subtree.

```html
<section style="--hue:25">…everything in here is warm…</section>

<div style="--hue-shift:0">series A</div>
<div style="--hue-shift:45">series B</div>   <!-- relative to base hue -->

<span class="bg is-danger" style="--bg:0.65">always red</span>
```

Semantic locks ship as helpers: `.is-success` `.is-info` `.is-warning`
`.is-danger`.

> `--hue-shift` is a single-level offset, not an accumulator: a child's
> shift replaces a parent's rather than adding to it.

---

## States

Interaction is just a nudge on the inputs, driven by one inheriting
`--state`:

- **Hover** moves `--bg` *toward 0* — everything lightens, as if it rises
  off the page — and nudges contrast up.
- **Active** moves *away from 0* (deeper), twice as far as hover came
  forward, and relaxes contrast.
- **Disabled** drains ink toward the surface and washes chroma to grey
  (set `[disabled]` or `[aria-disabled="true"]`).

Because `--state` inherits, a `.hoverable` card lifts *with* its
non-interactive children as one unit. Anything interactive resets
`--state`, so a button inside a hovered card stays its own island.

```html
<div class="bg hoverable" style="--bg:-0.25">…lifts as a unit on hover…</div>
<button class="bg" style="--bg:0.65">deepens on press</button>
<button class="bg" style="--bg:0.65" disabled>drained</button>
```

---

## Border & focus

Two colors the engine always computes from the current surface. They're
not applied to anything by default — components opt in:

- **`--border`** — a neutral-ish line, one step off the surface lightness
  (inky-darker in light, lifted-lighter in dark) with a sliver of the
  surface hue. Use it for outlines, dividers, input edges.
- **`--focus`** — the surface pushed up the color road: same hue, turned
  loud. The one deliberately attention-grabbing color. Use it for rings.

```css
.card  { border: 1px solid var(--border); }
.divider { height: 1px; background: var(--border); }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
```

Because both read the inherited surface, a border on a chip, a card, and a
dark well each resolve correctly against their own surface — no variants.

---

## Theming

A theme is a flat block of constants — no per-element overrides. Light
values are the working defaults; dark values live once in a `--dk-*` bank;
two value-free blocks switch the bank in.

```
System  → follows prefers-color-scheme (default)
Light   → <html data-theme="light">
Dark    → <html data-theme="dark">
```

To tune a theme, edit only its value block:

```css
:root {
  --l-base: 98%; --l-floor: 85%; --l-color: 50%; --c-peak: 0.08; --surf-curve: 1; --st-neut: 1;
  --dk-l-base: 24%; --dk-l-floor: 6%; /* … */ --dk-st-neut: 3;
}
```

`color-scheme` follows the theme, so native controls and scrollbars match.

---

## The constants (rarely touched)

These shape *how* the scales feel. The defaults are tuned for a premium,
understated, low-chroma look; reach for them only to re-tune a theme.

**Surface** — `--l-base` `--l-floor` `--l-color` (the three lightness
anchors), `--c-peak` (chroma at the color end), `--c-tint` (neutral tint),
`--surf-curve` (eases the neutral ramp; dark compresses the band so it
runs steeper).

**Ink** — `--fg-flip` (black/white flip point; higher favors light),
`--fg-ink-d/-l` (neutral ink poles), `--fg-chr-d/-l` (chromatic ink
lightness poles), `--fg-chroma` (chromatic ink saturation).

**State** — `--st-hover` (the one feel driver; active and the `bg=0` kick
derive from it), `--st-fg-gain` (contrast coupling), `--st-neut`
(per-theme neutral-road boost — dark's compressed band needs more push).

**Tokens** — `--border-step` (border's lightness step off the surface),
`--border-chroma` (how much surface hue the border keeps), `--focus-bg`
(where `--focus` sits on the color road), `--focus-chroma` (its chroma as
a multiple of `--c-peak`). `--cfg-dark` is `1` in dark themes / `0` in
light — infrastructure that flips the border direction.

---

## Notes & edges

- Surfaces are explicit: add `.bg` to anything that should paint a fill.
  An element without `.bg` is transparent but still contributes its `--fg`
  ink against whatever surface it inherits.
- `--surf-l` is the inherited surface lightness that ink contrasts. `.bg`
  exports it; that is what lets a heading and body on one card each choose
  their own `--fg` while both contrasting the card.
- The `.is-*` hue angles are sRGB-ish defaults; eyeball them against your
  own `--c-peak` if you lower the chroma a lot.
- A large `--st-hover` can push a pressed chip into the top of the color
  road (clamped), and a strong dark `--st-neut` can lift a neutral surface
  a hair past `0` into faint color. Both are usually fine; clamp the
  neutral result at `0` if it ever shows.

---

## One line to remember

> Pick a surface with `--bg`, pick ink with `--fg`, pick a hue with
> `--hue`. Everything else — contrast, states, dark mode — is the formula
> doing its job.
