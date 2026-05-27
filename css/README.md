# ui.css

A small CSS design system built from first principles. Single-hue OKLCH
colour engine, fluid type, structural layout primitives, and a tier of
components — all expressed through a tiny number of signed numeric knobs
rather than named tokens.

Three files, ~1500 lines total, no JavaScript, no build step required.
Drop in, theme via `data-` attributes, and consume.

---

## Quick start

Three stylesheets, in this order:

```html
<link rel="stylesheet" href="reset.css">
<link rel="stylesheet" href="color.css">
<link rel="stylesheet" href="components.css">
```

> Load order is shown for clarity. `reset.css` declares the complete
> `@layer` spine for the whole system, so the cascade is **structural
> not positional** — concatenate the three files in any order and the
> precedence still holds. For distribution, `cat reset.css color.css
> components.css > ui.css` and serve the bundle.

Then write markup that uses the system:

```html
<body class="bg fg" data-ui-theme="dark">
  <main class="pad">
    <h1>Hello</h1>
    <p>Body text on a stage surface.</p>
    <button class="btn" style="--bg:0.7">Action</button>
  </main>
</body>
```

That's it. The body paints a neutral surface, text contrasts
automatically, the button is a "loud" surface.

---

## The mental model

Two ideas carry everything else.

### 1. Colour is a value + a paint switch

```
--bg: 0.5    // a VALUE — picks where on the colour ramp this element sits
class="bg"   // a SWITCH — actually paints the background
```

Setting `--bg` alone does nothing visible; it just establishes where
this element *would be* on the depth axis. Adding `class="bg"` tells
the system to actually paint that background. Same for `--fg` + `.fg`
for text.

This separation is the whole API:

- `--bg` and `--fg` **inherit**. Set them on a container; descendants
  receive the value automatically.
- `.bg` and `.fg` **do not inherit**. They paint only the element
  they're on.

Most elements don't need both. A wrapper passes `--bg` down; the
content children inherit it and add `.fg` when they want to paint
text. See [`color.html`](./color.html) for the full explainer.

### 2. The depth axis (`--bg`)

A signed number, `-1` to `+1`, that picks a surface:

| `--bg`        | Zone        | Reads as                              |
| ------------- | ----------- | ------------------------------------- |
| `-1` … `0`    | **house**   | recessed, low-chroma neutral          |
| `0`           | **stage**   | the default neutral surface           |
| `0` … `+1`    | **spotlight** | loud, chromatic, draws attention      |

Theatre metaphor: house is the seating area (behind the action), stage
is where things happen, spotlight is where attention goes. Nest them
freely — a card on a page, a button on the card, a badge on the
button. Each step deeper picks a value relative to the same neutral
zero.

### 3. The foreground axis (`--fg`)

Also signed, `-1` to `+1`, with two semantic regions:

| `--fg`     | Region        | Result                                  |
| ---------- | ------------- | --------------------------------------- |
| `-1` … `0` | **contrast**  | text contrasts the background (B/W pole) |
| `0`        | —             | invisible (matches background)          |
| `0` … `+1` | **mirror**    | hue-tinted ink (carries the palette hue) |

`--fg: -1` is maximum contrast — use for body text, headings, primary
labels. `--fg: 0.6` gives a chromatic link or accent.

### 4. The paint rule for components

Any element that paints its own surface must set **both** `--bg` and
`--fg` explicitly. Don't inherit `--fg` from an ancestor — an
inherited foreground was computed for the *ancestor's* depth and only
contrasts your surface by luck.

```css
.my-component {
  --bg: 0.7;             /* surface depth */
  --fg: -1;              /* explicit, not inherited */
  background: var(--_bg-color);
  color: var(--_fg-color);
}
```

This rule is the spine of every component in the system. Three failed
to follow it during the rewrite (`badge`, `nav-link[aria-current]`,
`thead th`) and each produced the same bug: mid-tone text on mid-tone
surface, low contrast. The rule prevents the bug class entirely.

---

## Sizing — `--type` and `--scale`

Two independent knobs, separate jobs:

- **`--type`** — sets the size **of this element**. Local (`inherits: false`).
  Set on the element you want resized.
- **`--scale`** — multiplies a **subtree**. Regional (`inherits: true`).
  Set on a wrapper; everything inside scales together.

```html
<!-- a big heading; does NOT make body text big -->
<h1 style="--type:2">Title</h1>

<!-- everything inside scales up by 1.18 -->
<section style="--scale:1.18">
  <h2>Heading</h2>
  <p>Body — also scaled, with the heading staying proportional.</p>
</section>
```

Every component in the system is built in `lh` and `em` units, so they
all respond to `--type` and `--scale` automatically. A `.btn` sized at
`--type: -1` and a `.btn` sized at `--type: 2` are the same component
— different size.

### Page-level type switching

```html
<body data-ui-type="md">   <!-- sm | md | lg -->
```

Sets `--scale` on the body, which inherits to the whole page. Useful
for accessibility (a "make text larger" button toggles `data-ui-type`).

---

## Theming

Two themes shipped, `light` and `dark`. Switch via `data-ui-theme`:

```html
<body data-ui-theme="dark">   <!-- or "light" -->
```

> **`data-ui-theme` goes on `<body>`, not `<html>`.** On `<html>` it
> collides with the engine's `:root` rules. The `<body>` choice is
> deliberate — kept it on `body` after a real bug.

Themes are **islands**: set `data-ui-theme` on any element, and that
subtree gets that theme. Useful for a dark navbar inside a light page,
a light tooltip inside a dark dashboard, etc.

### Hue

Default palette hue is blue (`265`). Override globally:

```css
:root { --hue: 200 }      /* teal-ish */
```

Or per-subtree, per-element:

```html
<div style="--hue-shift: 60">  <!-- drift 60° from base -->
<div style="--hue-lock: 145">  <!-- pin to green, regardless of context -->
```

The semantic helpers (`.suc .inf .wrn .dgr`) are just named `--hue-lock`s.

### Motion

`--cfg-motion` scales every transition in the system. Three states:

```html
<body data-ui-motion="off">    <!-- 0 — instant -->
<body data-ui-motion="on">     <!-- 1 — normal (default) -->
<body data-ui-motion="debug">  <!-- 10 — slow, for visual debugging -->
```

The OS's `prefers-reduced-motion: reduce` setting wins over any
`data-ui-motion` value — accessibility settings beat dev tooling.

---

## Apply classes — the painting switches

| Class      | What it does                                     |
| ---------- | ------------------------------------------------ |
| `.bg`      | Paint background using resolved `--bg`           |
| `.fg`      | Paint text colour using resolved `--fg`          |
| `.edge`    | Loud border (structural — high prominence)       |
| `.edge-q`  | Quiet hairline border                            |

These compose — `class="bg fg edge"` paints a fully-styled surface.

---

## Semantic hue helpers

Hue-only modifiers; they retint whatever they touch, painting nothing.
Compose with `.bg`/`.fg` to paint.

| Class    | Hue   | Use                          |
| -------- | ----- | ---------------------------- |
| `.suc`   | 145°  | success (green)              |
| `.inf`   | 240°  | info (blue)                  |
| `.wrn`   | 75°   | warning (amber)              |
| `.dgr`   | 25°   | danger (red)                 |
| `.bw`    | n/a   | drop chroma to zero (greyscale subtree) |

Examples:

```html
<!-- a green button -->
<button class="btn suc" style="--bg:0.7">Save</button>

<!-- a red-tinted label — only the .dgr label's feedback small turns red -->
<label class="dgr">
  <span>Tax ID</span>
  <small>required</small>
  <input type="text" required>
</label>

<!-- a neutral greyscale region -->
<section class="bw">...</section>
```

---

## Layout primitives

Composition utilities — pure geometry, no colour:

| Class           | Layout                                                  |
| --------------- | ------------------------------------------------------- |
| `.column`       | Flex column, gap                                        |
| `.row`          | Flex row with wrap, vertically centred                  |
| `.split`        | Two equal columns                                       |
| `.spread`       | Flex row, space-between (header/toolbar pattern)        |
| `.spread-column` | Vertical space-between                                 |
| `.lcr`          | Three-up: left / centre / right                         |
| `.flank`        | Fixed lead + flexible tail (icon + text)                |
| `.flank-end`    | Flexible lead + fixed tail                              |
| `.frame`        | 16:9 media box, child cover-crops                       |
| `.grid`         | Auto-fit responsive grid; set `--grid-min` to control   |
| `.ngrid`        | Explicit grid; set `--cols` and `--rows`                |
| `.stack`        | All children share one grid cell (layered)              |
| `.hero`         | 5-slot panel: top/bottom bars, left/right rails, main   |

Gaps everywhere are `calc(0.25 * 1lh)` — they scale with type.

---

## Components

### Surfaces (no interaction)

| Component | Notes                                                     |
| --------- | --------------------------------------------------------- |
| `.avatar` | Square monogram/icon/image chip. Set `--bg`/`--hue` inline. |
| `.badge`  | Small count/status pill. Pin to corner via `:has(> .badge)`. |
| `kbd`     | Keyboard-key marker (bare element styling).               |
| `hr`, `hr.vr` | Divider lines, horizontal / vertical.                 |
| `table`   | Quiet row rules, loud header rule. No zebra.              |

### Interactive

| Component   | Notes                                                                 |
| ----------- | --------------------------------------------------------------------- |
| `.btn`      | Solid button. Hover/active drive via `--bg-shift` on bare `<button>`. |
| `.icon-btn` | Square button, icon scales via container queries.                     |
| `.nav-link` | Grid-based nav item; icon + label + sub + optional badge.             |

All three resolve to the same height (`2.4lh`) so they line up in rows.

### Composite

| Component     | Notes                                                       |
| ------------- | ----------------------------------------------------------- |
| `.tabs`       | Segmented control; the selected tab is a loud surface.      |
| `.glass`      | Translucent surface; sets `--alpha: 50%`.                   |
| `progress`    | Track + vivid fill from one element.                        |
| `.crumbs`     | Breadcrumb trail; last child styled as "current".           |

> Forms get [their own section](#forms) — large enough subsystem to
> warrant it.

### Page-level

| Class       | Notes                                                          |
| ----------- | -------------------------------------------------------------- |
| `.page`     | Full-viewport application shell, 9 slots. Each `pg-*` child opt-in. |
| `.drawer`   | Edge-anchored overlay (`<dialog>` slides in via transition).   |
| `.hud`      | Full-viewport overlay; 9 corner/edge slots (`.tl` through `.br`). |

### `.page` slots

A `.page` is a 9-slot grid; each slot is a child class:

```
┌─────────────────────────────────────┐
│             pg-banner               │
├─────────────────────────────────────┤
│             pg-header               │
├─────────────────────────────────────┤
│            pg-subheader             │
├──────────┬─────────────────┬────────┤
│          │  pg-main-header │        │
│  pg-     ├─────────────────┤  pg-   │
│  naviga- │     pg-main     │ aside  │
│  tion    ├─────────────────┤        │
│          │  pg-main-footer │        │
├──────────┴─────────────────┴────────┤
│             pg-footer               │
└─────────────────────────────────────┘
```

Only `pg-navigation`, `pg-main`, and `pg-aside` scroll. The shell
itself never scrolls. Empty slots collapse.

### `.hud` slots

A full-viewport overlay; the container is `pointer-events: none`
(click-through), children take their own clicks back. Use for FABs,
toasts, mobile nav triggers, dev overlays.

Position children with a slot class:

```
.tl   .tc   .tr
.cl   .cc   .cr
.bl   .bc   .br
```

(`t/c/b` = top/centre/bottom row, `l/c/r` = left/centre/right column.)

---

## Forms

Forms are the largest single subsystem in the design — non-obvious
behaviours, multiple `@scope` blocks, and a strong markup convention.
This section covers all of it.

### The well-and-pop model

A `<form>` is itself a recessed surface (`--bg: -1` — the deepest
"house" zone). Inputs inside it sit at `--bg: 0.1` — just into the
spotlight, so the hue is faintly visible. The depth contrast is what
separates them visually, so **inputs inside a form have no border**;
the well's recessed surface is enough.

```html
<form>
  <input type="text" placeholder="...">   <!-- borderless, lifted out of the well -->
</form>

<input type="text" placeholder="...">     <!-- standalone, gets a border -->
```

The `@scope (form)` rule handles this: inputs *inside* a form drop
their border; inputs *outside* (loose on a page) keep it. Same
component, two visual treatments based on context.

### The faint hue is intentional

`--bg: 0.1` on inputs (instead of `0` neutral) means a hue-lock on
the field tints the input itself, not just the feedback text:

```html
<label class="dgr">                   <!-- danger hue -->
  <span>Tax ID</span>
  <small>required</small>
  <input type="text" required>        <!-- faintly red — visible error -->
</label>
```

Set `--bg: 0` if you want pure neutral inputs.

### The labelled-field convention

A `<label>` wrapping a `<span>`, a `<small>`, and an input becomes a
**labelled field** automatically. No class:

```html
<label>
  <span>Account name</span>
  <small>shown on invoices</small>
  <input type="text" required>
</label>
```

The structure is the selector (`label:has(> span)`). You get:

- `<span>` rendered as the label text (semibold, full contrast)
- `<small>` rendered below as the feedback line, hue-tinted
- The input below both, full width
- Reserved space for the `<small>` so its absence doesn't shift layout

Skip the `<span>`, and the label reverts to its default (checkbox
labels, etc.). The convention is *opt-in by structure*.

### Required asterisk — automatic

Any field whose input has `required` gets a red asterisk after the
label text:

```html
<span>Tax ID</span>            <!-- no asterisk -->
<input type="text">

<span>Tax ID</span>            <!-- ' *' added automatically -->
<input type="text" required>
```

The selector is `label:has(input:required) > span::after` — `:has()`
reaches the sibling input. No class, no manual asterisk in markup.
Tint is the danger hue.

### Fieldsets — equal-width groups

A `<fieldset>` becomes a flex row of equal-width children. Use for
related inputs that should sit side-by-side:

```html
<fieldset>
  <label><span>First name</span><input type="text" required></label>
  <label><span>Last name</span><input type="text" required></label>
</fieldset>
```

Inside a fieldset, inputs do NOT stretch to fill the form (a donut
`@scope (form) to (fieldset)` excludes them). Each labelled field
takes equal width.

### Checkbox and radio surfaces

Unchecked checkboxes and radios sit at `--bg: 0` — the *same surface
as the text inputs*, not the form well. This is deliberate: an empty
checkbox should read as "a thing you can fill in," matching the input
fields visually.

Checked state paints a loud `--bg: 0.8` surface with the check/dot
mark stroked in `currentColor`. Both colours come from the engine,
follow the hue, theme correctly in light and dark modes.

### Form max-width

A form caps at `max-inline-size: 45ch`. Reading research consistently
puts the comfortable line length around 45–75 characters; 45ch keeps
forms scannable without forcing wraps. Override if needed:

```css
form { max-inline-size: 60ch }     /* wider form */
```

### Focus rings

All inputs get a focus ring on `:focus-visible`. The ring's hue
follows the input's own resolved hue (`--_h`), so a `.dgr` input
gets a red ring automatically. No extra rule needed; the existing
ring colour formula reads `--_h` from the focused element.

### What the form does NOT do

- **Validation styling.** `:user-invalid` and `:user-valid` are not
  styled by default. Add them in your project if you want red borders
  on touched-but-empty required fields:

  ```css
  :user-invalid { --bg: 0.15; --hue-lock: 25 }   /* danger tint */
  ```

- **Custom date / file / colour pickers.** The system styles
  `text`, `email`, `password`, `number`, `select`, `textarea`,
  `checkbox`, `radio`. Other input types render with native chrome.

- **Server-side or client-side validation.** Use the browser's
  built-in (`required`, `pattern`, `type="email"`) or your own JS.

### Complete example

```html
<form>
  <fieldset>
    <label>
      <span>First name</span>
      <small>given name</small>
      <input type="text" required>
    </label>
    <label>
      <span>Last name</span>
      <small>family name</small>
      <input type="text" required>
    </label>
  </fieldset>

  <label>
    <span>Email</span>
    <small>we'll never share it</small>
    <input type="email" required>
  </label>

  <label class="dgr">
    <span>Tax ID</span>
    <small>required by law</small>
    <input type="text" required>
  </label>

  <label>
    <span>Notes</span>
    <small>optional, multi-line</small>
    <textarea></textarea>
  </label>

  <fieldset>
    <label><input type="checkbox" checked> Active</label>
    <label><input type="checkbox"> Archived</label>
  </fieldset>

  <button class="btn" style="--bg:0.7">Save</button>
</form>
```

That's a full form with one class on the entire markup (`dgr` for the
tinted Tax ID field). The convention does the rest.

---

## Responsive visibility

A small but unusual primitive: three classes control which elements
appear at which breakpoint, **declaratively from the markup**.

| Class      | Visible at      |
| ---------- | --------------- |
| `.mobile`  | `< 768px`       |
| `.tablet`  | `768–1024px`    |
| `.desktop` | `≥ 1024px`      |

Combine them to show across ranges:

```html
<p class="desktop">Shown only on wide screens</p>
<p class="mobile tablet">Shown only on narrow + mid screens</p>
<p class="mobile desktop">Hidden specifically on tablets</p>
```

That last example — `class="mobile desktop"` — is the part worth
calling out. **Hiding specifically on tablets is genuinely unusual in
CSS.** Most utility systems make you write three separate rules
(`hidden md:block lg:hidden` in Tailwind, for example) because their
breakpoint utilities are *positive* (`show at this size`) and don't
compose with each other naturally.

ui.css inverts that. The classes name *which breakpoints DO show
this element*. List the ones where you want it visible, in any
combination, and it's hidden everywhere else. The set is the
filter.

### How the trick works

The whole behaviour is six rules in `classAPI.viewport`, the **last
layer in the spine**:

```css
@layer classAPI.viewport {
  :where(.mobile, .tablet, .desktop) { display: none }
  @media (width < 768px)           { :where(.mobile)  { display: revert-layer } }
  @media (768px <= width < 1024px) { :where(.tablet)  { display: revert-layer } }
  @media (width >= 1024px)         { :where(.desktop) { display: revert-layer } }
}
```

The first rule **hides everything with any of these classes by
default**. Then each media query uses `revert-layer` to *undo* the
hiding for the matching class — which reverts to whatever `display`
the component had in an earlier layer (`inline-flex` for a button,
`block` for a div, etc.). Because viewport is the last layer,
`revert-layer` falls back to the natural display value the element
would otherwise have.

The "any combination works" property emerges automatically: a
`.mobile.desktop` element gets reverted in two of the three media
queries, hidden in the third, with zero extra rules to write.

`revert-layer` is the secret here. Without it, the rule would have to
re-state the right `display` value per element type, which would fail
the moment a consumer applied the class to something with an
unusual `display`. With it, the rule is element-agnostic — works on
buttons, divs, table rows, anything.

---

## Config knobs

Most projects won't touch these. When you do, set them on `:root` to
override globally, or on any element to scope to a subtree.

| Token              | Default | Recommended | Effect                                            |
| ------------------ | ------- | ----------- | ------------------------------------------------- |
| `--cfg-chroma`     | `0.13`  | `0`–`0.2`   | Master chroma. `0` = greyscale; `0.2` = saturated |
| `--cfg-surface-l`  | `0.97`  | `0.92`–`0.99` | Stage (`--bg:0`) lightness in light theme       |
| `--cfg-house-l`    | `0.88`  | `0.80`–`0.94` | House zone (`--bg:-1`) lightness, light theme   |
| `--cfg-max-l`      | `0.42`  | `0.35`–`0.55` | Spotlight extreme (`--bg:+1`) lightness         |
| `--cfg-house-curve`| `1`     | `0.8`–`1.5` | Easing of the house ramp (1 = linear)             |
| `--cfg-spot-curve` | `1`     | `0.8`–`1.5` | Easing of the spotlight ramp (1 = linear)         |
| `--cfg-line-delta` | `0.05`  | `0.02`–`0.10` | L step for `--_line-color` (the quiet border)   |
| `--cfg-border-push`| `0.12`  | `0.08`–`0.20` | L step for `--_border-strong` (the loud border) |
| `--cfg-ring-l-push`| `0.22`  | `0.15`–`0.30` | Focus ring lightness offset from surface        |
| `--cfg-ring-min-c` | `0.16`  | `0.10`–`0.25` | Minimum chroma the focus ring must carry        |
| `--cfg-ring-width` | `2px`   | `1px`–`3px` | Focus outline width                               |
| `--cfg-ring-offset`| `2px`   | `0`–`4px`   | Focus outline gap from element                    |
| `--cfg-radius`     | `6px`   | `0`–`16px`  | Border radius for all rounded components          |
| `--cfg-motion`     | `1`     | `0`/`1`/`10` | Transition duration multiplier (see Motion)      |
| `--cfg-fluid-min-vp` | `320px` | `280px`–`480px` | Viewport floor for fluid type interpolation   |
| `--cfg-fluid-max-vp` | `1280px` | `1024px`–`1600px` | Viewport ceiling for fluid interpolation    |
| `--cfg-type-min-ratio` | `1.2` | `1.1`–`1.3` | Type step ratio at the small viewport            |
| `--cfg-type-max-ratio` | `1.28` | `1.2`–`1.4` | Type step ratio at the large viewport           |

Ranges are practical, not hard limits. Going outside them won't break
the engine; results just stop reading like a coherent system. Light-
theme L values (`surface-l`, `house-l`) flip to lower values for the
dark theme — those are set in `color.css`'s `theme` layer if you need
to retune both modes.

---

## Layer architecture

The cascade order, declared once in `reset.css`:

```
reset.fix          unopinionated normalisation
reset.opinion      light opinionated defaults
styleAPI.space     type + spacing engine
styleAPI.color     colour engine
theme              colour theme values
theme.config       project tokens
theme.base         bare-element rules
classAPI.page      full-page shells
classAPI.layout    composition primitives
classAPI.components buttons, cards, fields
classAPI.viewport  responsive visibility
classAPI.utility   single-purpose overrides (last = wins)
```

Layer order is set by the first `@layer` statement CSS sees;
`reset.css` declares the complete spine up front, so file load order
doesn't affect cascade precedence. `classAPI` deliberately sits after
`theme` — components override the bare-element defaults when they
target the same element (e.g. `.nav-link` is an `<a>` and must
override `theme.base`'s default link styling).

---

## What this system doesn't do

Real and deliberate omissions:

- **No JavaScript.** Theme switching, drawer open/close, focus rings
  all use native browser features (CSS custom properties, `<dialog>`,
  `:focus-visible`). You supply the JS for stateful pieces.
- **No build step.** No Sass, no PostCSS, no design-token compiler.
  Plain CSS with `@property`, `@layer`, `@scope`, `oklch()`. Modern
  browsers only (Chrome 111+, Safari 16.4+, Firefox 128+).
- **No utility classes for everything.** No Tailwind-style
  `.p-4 .text-lg`. Spacing comes from `lh` in the system; sizes from
  `--type`. The system is opinionated about *how* things are sized.
- **No icon library.** SVGs go inline in your markup; the system
  styles components that *contain* SVGs (`.btn`, `.icon-btn`,
  `.avatar`, `.nav-link`) but doesn't ship icons.

---

## See also

- [`color.html`](./color.html) — interactive explainer for the
  variable / class model
- [`demo.html`](./demo.html) — every component exercised in one page
- [`oklch-palette.html`](./oklch-palette.html) — palette explorer for
  the colour engine

## License

MIT.

```
Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
