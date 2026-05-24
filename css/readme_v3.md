# stick.css — color system

A parametric color system built on CSS custom properties and OKLCH. You
do not write colors. You set a small number of *knobs* — a hue, a
background level, a foreground level — and every surface, every ink
color, and every contrast decision is computed from them. Theme,
contrast, and depth flow through the cascade automatically.

The whole system is plain CSS: registered custom properties, `calc()`,
and OKLCH relative-color math. No build step, no preprocessor, no
JavaScript.

---

## The mental model

There are two kinds of property, and the distinction is the whole
system:

**Knobs** are per-element decisions. They do *not* inherit. You set
them on the element you are styling.

- `--hue` — the hue, 0–360 (this one *does* inherit; see below)
- `--bg` — background level, 0–1
- `--fg` — foreground (text) level, -1 → 0 → +1

**The surface context** is what an element sits *on*. A painted
surface publishes its resolved values; everything inside inherits
them. An element reads the surface context to decide how its text
should look — because text contrast is a property of the text *and*
the surface together, and only the surface knows the surface.

The one rule that ties it together: **you cannot send a formula
upward to ask the surface what it resolved to. So the surface sends
its resolved values downward, as inheriting custom properties.**

---

## Quick start

```html
<link rel="stylesheet" href="style.css">

<body>
  <div class="stage" style="--bg: 0.5; --hue: 220">
    <p style="--fg: -0.7">Readable text. Contrast is automatic.</p>
    <span class="chip stage" style="--bg: 0.8">a chip</span>
  </div>
</body>
```

- `body` is a stage. It always paints, so the page has a real,
  theme-correct background and every element below has a surface to
  sit on.
- The `div.stage` paints a colored surface at `--bg: 0.5`, hue 220.
- The `<p>` sets only `--fg`. It paints nothing. Its text color is
  computed to contrast the `div`'s surface.
- The `span` is its own stage — a brighter chip on the same surface.

---

## The three knobs

### `--hue` — 0 to 360

The OKLCH hue angle. Unlike the other knobs, `--hue` **inherits** — it
is a regional decision. Set it on a container and the whole subtree
shares it.

```css
--hue: 25     /* warm red    */
--hue: 145    /* green       */
--hue: 220    /* blue (default) */
```

Two modifiers refine it, both inheriting:

- `--hue-shift` — a delta added to the inherited hue. Lets a child
  rotate away from its region's base hue without redefining it.
- `--hue-lock` — when set, overrides hue + shift entirely. For branded
  or fixed-hue content that must ignore its surroundings.

### `--bg` — 0 to 1

The background level. `0` is the bare stage surface; `1` is the most
saturated, most prominent surface for that hue and theme. Values
between ramp smoothly through a perceptual curve.

`--bg` does **not** inherit, and setting it alone does **not** paint
anything — it only computes a color. Painting requires the `.stage`
class (see *Painting*, below). Think of `--bg` as *"the surface color
this element would have, if it is a stage."*

### `--fg` — -1 to +1

The foreground (text) level. It is signed, and the sign selects one of
two inks:

```
-1 ────────────── 0 ────────────── +1
strong neutral   invisible      strong chromatic
ink (auto B/W)   (matches bg)   ink (hue-tinted)
```

- **Negative `--fg`** → *neutral ink*. Black or white, automatically
  chosen to contrast the surface (see *Contrast flip*). `-0.2` is a
  faint neutral; `-1` is maximum-contrast neutral.
- **`--fg: 0`** → ink the same color as the surface. Invisible.
- **Positive `--fg`** → *chromatic ink*. Tinted toward the region's
  hue, ramping from subtle (`+0.2`) to saturated (`+1`).

`--fg` does not inherit — each text element states its own.

---

## Painting: the `.stage` class

This is the part that makes the system predictable.

**Most elements should not have a background.** A paragraph, a span, a
label — they have *text*, and the text needs to know what surface it
sits on, but the element itself paints nothing. Only deliberate
surfaces paint.

So painting is **opt-in, via the `.stage` class**:

- A `.stage` element resolves its surface from `--bg`/`--hue`, paints
  it as its `background-color`, and **publishes the surface context**
  to its descendants.
- A non-stage element never paints. It inherits the surface context
  from its nearest `.stage` ancestor and uses it to resolve its own
  text color.

```html
<div class="stage" style="--bg: 0.4">      <!-- paints -->
  <p style="--fg: -0.8">text, no background</p> <!-- inherits surface -->
  <button class="stage" style="--bg: 0.7">    <!-- paints, nested -->
    a button on its own surface
  </button>
</div>
```

If you set `--bg` on an element and it does not paint, it is because
the element is not a `.stage`. That is intended. Add the class.

`body` should always be (or carry) a stage so the document root has a
real surface and the context chain has somewhere to start.

---

## Depth: `.stage-0` … `.stage-3`

Stages can be ranked by depth. The metaphor is theatrical: **stage 0
is the front** — closest to the audience, brightest — and **stage 3 is
the back** — deepest, most recessed.

```html
<div class="stage stage-0">front / brightest
  <div class="stage stage-1">one step back
    <div class="stage stage-2">deeper</div>
  </div>
</div>
```

Depth shifts the stage's base lightness along a ramp between two
theme-dependent endpoints (front and back). A plain `.stage` with no
`.stage-N` sits at depth 0.

---

## Theme

Theme is the `data-ui-theme` attribute. It is **not** a class, and it
can go on **any** element — not just the root.

```html
<html data-ui-theme="dark">     <!-- whole page -->
<div  data-ui-theme="light">    <!-- this subtree only -->
```

- `data-ui-theme="light"` / `"dark"` — explicit.
- No attribute — follows the OS via `prefers-color-scheme`.

Because the attribute works on any element, a single card can carry
its own theme while the page around it stays as it is. The theme an
element resolves under is published as part of the surface context, so
text inside a self-themed card contrasts that card's surface *as the
card was themed* — even if the page is the opposite theme.

---

## Configuration tokens

Everything is tuned through `--cfg-*` tokens. All inherit, so you can
override them globally on `:root` or locally on any subtree. Defaults:

### Color

| Token | Default | Meaning |
|---|---|---|
| `--cfg-dark` | `0` | Theme scalar, 0 = light, 1 = dark. Usually set via `data-ui-theme`, not directly. |
| `--cfg-fg-flip` | `0.7` | Lightness threshold (0–1) for the neutral-ink black/white flip. Higher = white ink appears on lighter surfaces = stronger white-on-dark bias. |
| `--cfg-floor` | `0.06` | Smallest `--bg` step that still reads as visible. |
| `--cfg-stage-chroma` | `0.018` | Chroma of the bare stage surface (`--bg: 0`). |
| `--cfg-fg-tint` | `0.02` | Chroma carried by neutral ink — a hint of the hue, not pure gray. |
| `--cfg-color-alpha` | `1` | Alpha of painted surfaces. |

### Surface lightness endpoints

The stage depth ramp runs between a *front* and *back* lightness, per
theme:

| Token | Default |
|---|---|
| `--cfg-stage-front-light` | `97` |
| `--cfg-stage-back-light` | `90` |
| `--cfg-stage-front-dark` | `28` |
| `--cfg-stage-back-dark` | `10` |

### Chroma ramp

| Token | Default | Meaning |
|---|---|---|
| `--cfg-chroma-max-l-light` / `-dark` | `50%` / `70%` | Max-saturation lightness endpoint. |
| `--cfg-chroma-max-c-light` / `-dark` | `0.22` / `0.22` | Max chroma. |
| `--cfg-chroma-exp-light` / `-dark` | `1.5` / `1.8` | Ramp curve exponent. Dark is higher because equal OKLCH chroma reads hotter on a dark background. |

### Interaction

| Token | Default | Meaning |
|---|---|---|
| `--cfg-hover-bg-shift` | `0.12` | `--bg` shift applied on hover. |
| `--cfg-active-bg-shift` | `-0.06` | `--bg` shift applied on active/press. |
| `--cfg-active-fg-mul` | `0.7` | Foreground multiplier on active. |

Interactive elements (`button`, `a`, `[role="button"]`, …) pick these
up automatically — hovering shifts `--bg` along the ramp and the text
re-resolves its contrast against the shifted surface.

---

## Semantic helper classes

Shortcuts that lock the hue to a conventional meaning:

| Class | Effect |
|---|---|
| `.suc` | success — locks hue to green (145) |
| `.wrn` | warning — locks hue to amber (75) |
| `.dgr` | danger — locks hue to red (25) |
| `.bw` | neutral — strips chroma for a pure grayscale subtree |

```html
<button class="stage suc" style="--bg: 0.5">Confirmed</button>
```

---

## How it works, briefly

At heart the system is linear interpolation in OKLCH. `--bg` is pushed
through a perceptual curve and used to interpolate a surface color
between the bare stage and the theme's most-saturated endpoint.
Neutral ink picks black or white by comparing the surface lightness
against `--cfg-fg-flip`. Chromatic ink runs the same ramp, tinted
toward the hue.

The one idea worth holding onto: a `.stage` publishes its resolved
surface — lightness, chroma, hue, theme — as inheriting properties, so
nested text can contrast the surface it sits on without recomputing
it. Knobs flow down as knobs; the surface flows down as resolved
values.

The contrast flip uses Lea Verou's relative-color technique
(<https://lea.verou.me/blog/2024/contrast-color/>); the default
threshold of `0.7` follows her readability recommendation.

---

## Constraints

- Requires CSS `@property`, OKLCH color, and relative-color syntax
  (`oklch(from …)`). These are broadly supported in current browsers.
- No `@function` is used — the system predates wide support and works
  entirely with `calc()` and registered properties.
- Painting is opt-in: an element with `--bg` set but no `.stage` class
  computes a color and does not paint it. This is by design.
