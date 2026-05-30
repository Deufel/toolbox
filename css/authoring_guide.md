# Component Authoring Guide

This system is not like Tailwind, Bootstrap, or Material. Those ship a
*palette* of pre-made decisions — `btn-primary`, `text-lg`, `bg-blue-500`.
This system ships *engines* that compute the decision from a few inherited
numbers. A component's job is therefore almost nothing: arrange a little
geometry and let the engines do the color, the contrast, the states, the
type, and the spacing.

**If you find yourself writing a lot of CSS for a component, you have
misunderstood the system.** The best line of CSS is the one you never
write.

---

## The one mental shift

> A component does not *have* colors or sizes. It has a **shape**, and it
> sits at a **position** on scales the author controls at the call site.

`--hue`, `--bg`, `--fg`, `--type`, `--scale` are all set by *whoever uses
the component*, inline or via a parent. The component only defines what
can't be expressed that way: its internal geometry (padding in `em`/`lh`,
border-radius, flex layout) and which engine positions it occupies by
default.

```html
<!-- the entire API. no variant classes. -->
<button>Default</button>
<button style="--hue:25">Danger-hued</button>
<button style="--bg:0">Quiet</button>
<button style="--hue-shift:45; --type:-1">Secondary, small</button>
```

---

## The Laws

### 1 — Style the semantic element when the element *is* the component

If one HTML element maps cleanly to one component, **style the element,
not a class.** A button is `<button>`; an input is `<input>`. No `.btn`,
no `.field`. A class is only for things HTML has no element for (a card, a
tag, a segmented control). This makes the common case classless and the
markup semantic.

### 2 — No variant classes for what the scales already express

**Never write `.btn-primary`, `.btn-sm`, `.btn-red`, `.card-lg`.** Size is
`--type`. Color is `--hue` / `--bg` / `--fg`. Emphasis is `--bg` position.
A variant class for any of these is a second source of truth fighting the
engine.

If a *project* wants a named shorthand, that's a one-line **config helper**
the project writes — never something the component ships:

```css
/* project-level, optional — aliases for a number, nothing more */
.pri    { --hue: 255 }
.sec    { --hue-shift: 45 }
.danger { --hue: 25 }
```

The component knows nothing about these.

### 3 — Detect content with `:has()`, don't branch with classes

The component should read its own markup and shape itself, rather than
asking the author to pick a variant. The button does all of this with no
classes:

```css
button:has(> svg:only-child)          /* but see Law 6 — text nodes! */
button[aria-label]:has(> svg)         /* icon-only → square            */
button:has(> svg):has(> small)        /* svg + caption → dock          */
/* svg + text → falls through to the inline default                    */
```

This is the *positive* form of Law 2: not just "don't add variants," but
"let the markup speak."

**Nest by structure — strongly preferred.** Because the system targets by
structure rather than by class, write rules as a nested tree that mirrors the
markup, not as flat sibling selectors that each restate the prefix. Nesting is
preferred for three concrete reasons:

1. **It removes prefix repetition.** A base selector written once, with
   `&:hover`, `& > svg`, `&:has(…)` inside it, beats three flat rules that
   each repeat a long `:where(…)` prefix. One edit, not three (Law 4).
2. **It fixes `:has()` targeting.** Nested `&:has(…)` resolves *relative to the
   already-matched element*, so the scope is unambiguous. Flat sibling rules
   re-queried from an outer scope can match the wrong element — this is a real
   bug we hit and fixed by nesting the field rules.
3. **It reads as the component's anatomy.** Top to bottom: the element, then
   its parts (`& > span`, `& > small`), then its state reactions
   (`&:has([aria-invalid="true"])`). The rule *is* an outline of the markup.

```css
/* prefer */                          /* over */
:where(button) {                      :where(button) { … }
  --bg: 0.6;                           :where(button):hover  { … }
  & > svg { … }                        :where(button):active { … }
  &:hover  { … }                       :where(button) > svg  { … }
  &:active { … }
}
```

Nest until it stops adding clarity — independent shape variants keyed by
*different* `:has()` tests (the icon vs. dock buttons) can stay as sibling
rules when nesting them would hide that they're independent detections, not
parent/child. Structure that exists in the markup → nest it; structure that
doesn't → don't manufacture it.

### 4 — One setting, one home

Every value lives in exactly **one** place. A component should not restate
a default `base` already set, should not set `--type` if the `base` default
is right, should not set `color` (the engine computes it), should not set a
border color (`var(--border)` exists). Before adding a line, ask: *does
something upstream already own this?* If yes, delete the line.

### 5 — No defensive CSS

No rules guarding against situations the cascade already handles. No resets
inside a component, no re-declaring inherited values "to be safe," no
`!important`. Trust the layer order (components sit above `base`/`theme`,
below `utility`/`viewport`). Let the cascade do its job.

### 6 — Accessibility signals are styling signals

When a visual branch needs a condition that accessibility *also* requires,
key the style to the a11y attribute — you get correctness and styling from
one signal. The square icon-button is keyed to `[aria-label]`, not
`:only-child`, because (a) `:only-child` can't see the text node in
`<button><svg/>Label</button>` and would false-positive, and (b) an
icon-only button needs the label anyway. Now you can't get the shape
without the label.

### 7 — State the engine and ARIA don't cover uses `data-ui-state` *(living standard)*

This law is evolving as we build stateful components; treat it as the
current best practice, not a finished spec.

A component's state is expressed through, in order of preference:

1. **The engine** — hover / active / disabled on interactive elements come
   from `color.css` for free (Law 9). Write nothing.
2. **A real ARIA attribute** — when the state *is* an accessibility fact
   the platform already models: `aria-disabled`, `aria-expanded`,
   `aria-selected`, `aria-current`, `aria-invalid`. Key the style to it
   (Law 6) so the visual and the announced state are the same signal.
3. **`data-ui-state="…"`** — for state that has no honest ARIA home: a
   value-bearing status that isn't an interaction and isn't one of the
   platform's modeled states (a tag's `on` / `off`, a row's `stale`, a
   step's `done`). `data-ui-state` is the namespaced escape hatch for
   exactly this gap.

```css
.tag[data-ui-state="off"] { --bg: 0.1; --fg: -0.4; --surface-chroma: 0; }
.tag[data-ui-state="on"]  { outline: 1px solid var(--focus); }
.tag[aria-disabled="true"] { --bg: 0.05; --fg: -0.6; }  /* a real a11y state, keeps its ARIA attr */
```

**`data-ui-state` is mostly reserved for state the *server* sets.** This
system is server-driven: state is *reflected*, never *performed*. The
server stamps `data-ui-state` and the style follows. Do not invent
front-end state the server hasn't confirmed, and do not animate a state on
a loop to *assert* it (we removed a pulsing "live" tag for exactly this — a
standing client animation claims a fact the front end can't know). A
"saving…" look should reflect a real in-flight request, not a decorative
spinner the component runs on its own.

Two rules that keep this honest:

- **Don't reach for `data-ui-state` when ARIA fits.** If the platform
  models the state, use the ARIA attribute — it carries meaning to
  assistive tech that `data-*` never will. `data-ui-state` is the
  *last* resort, not the first.
- **The meaning must survive without the color.** If a state is conveyed
  *only* by `data-ui-state` driving a color, a screen-reader user gets
  nothing. Put the meaning in the text (an "on-air" sign says the words;
  the styling is just emphasis) or use the proper ARIA state. Color is
  never the sole carrier of meaning.

> Namespace note: every UI signal this framework owns lives under
> `data-ui-*` — `data-ui-theme`, `data-ui-size`, `data-ui-motion`, and now
> `data-ui-state`. That prefix is our reserved namespace so framework
> signals never collide with the host app's own `data-*` attributes.

### 8 — Spacing is `em` / `lh`, never `px` / `rem`; weight is the engine's

The type-is-space law. Internal padding, gaps, margins are `em` (tracks
font-size) or `lh` (tracks line-height); radius is `var(--cfg-radius)`. A
component then scales with `--type` / `--scale` for free, no media queries.
The one allowed `px` is the touch-target floor (Law 10).

**`font-weight` is also a function of `--type` — never set it.** The type
engine ramps weight optically: at `--type 0` it's the base weight (400), and
it climbs with each positive step so display sizes carry more weight
gracefully, while a clamp floor keeps body and small text at base weight no
matter the ramp. Setting `--type` gives you the right *size, line-height,
letter-spacing, and weight* together. So a heading is just `--type: 4`; you
do not add `font-weight: 700`. Tune the ramp globally with `--cfg-wght-base`
/ `--cfg-wght-step` / `--cfg-wght-max`, not per element.

The only legitimate `font-weight` declarations:

- **`b` / `strong`** — fixed inline emphasis (700), independent of type. The
  engine ramp is about *optical sizing*; inline bold is a separate axis.
- **A deliberate UI-affordance weight** on a small control where the
  convention overrides the optical ramp — e.g. a button or tag label at 600
  for presence. Treat this as a considered exception, not a default, and
  reach for it rarely.

If you're setting `font-weight` to distinguish *hierarchy*, you're fighting
the engine — change `--type` instead.

### 9 — Let color.css drive interaction; don't reach for helpers

Interactive elements (`button`, `a`, `[role=button]`) already get
hover / active / disabled from the engine automatically. **Do not add
`.clickable` / `.hoverable` to components** — for authoring they are
effectively deprecated. A `<button>` is already an island and already
responds. Write nothing.

### 10 — The touch-hardening recipe (canonical)

Every interactive component repeats this exact recipe — copy it, don't
re-derive it. The `max(16px, …)` clamp is the entire reason the type engine
captured `--_font-size`.

```css
.thing {
  user-select: none; -webkit-user-select: none;   /* label not selectable */
}
/* 16px font floor on ANY coarse pointer — iOS focus-zooms a control whose
   font is < 16px, on phone AND tablet, so this is NOT screen-size-gated. */
@media (pointer: coarse) {
  .thing { font-size: max(16px, var(--_font-size)); }
}
/* 44px target on coarse + small screen. max() never shrinks a taller one. */
@media (pointer: coarse) and (max-width: 768px) {
  .thing { min-block-size: max(44px, 2lh); min-inline-size: max(44px, 2lh); }
}
```

### 11 — Don't touch transitions (for now)

The only transition that matters right now is the drawer's, which exists.
**Do not add transitions or standing animations to components.** Motion is a
deliberate later pass — and per Law 7, a looping animation must never be
used to *assert* a state the server hasn't confirmed. Components ship
static.

---

## Surfaces: the painter, and borderless-by-default

### The painter is inlined

A surface component paints itself and exports its lightness so its ink and
children resolve correctly. This is the canonical two-line painter — inline
it, don't make the author remember a class:

```css
background-color: var(--_bg);
--surf-l: var(--_bg-l);
```

> `.bg` does exactly these two lines. It exists for **ad-hoc author
> surfaces in markup** — when you want to paint something from the HTML
> without writing a component. A real surface *component* inlines the
> painter so the author doesn't have to add `.bg`. You shouldn't need `.bg`
> very often; reach for it when you want that control from the markup.

### Borderless by default

Components do **not** ship a border. Separation comes from **surface
difference** — adjacent surfaces sit at different `--bg`, and the lightness
gap reads as an edge. This is the depth model the whole system is built on.

The contract this creates: **two touching surfaces must differ in `--bg`.**
A `--bg: 0` button on a `--bg: 0` container is invisible (same surface) —
put the button on a different surface, or, only when two same-level
surfaces genuinely must touch, opt into a line at the call site:

```css
border: 1px solid var(--border);   /* call-site opt-in, not a default */
```

---

## What a component IS allowed to define

A short, closed list. If it's not here, reconsider.

- **Geometry** — `display`, flex/grid arrangement, `gap`, `padding`,
  `border-radius` (`em`/`lh` spacing, `var(--cfg-radius)`).
- **Default engine position** — the `--bg` / `--fg` a bare instance sits at
  (set the *number*, the engine makes the color), plus the inlined painter.
- **Content detection** — `:has()` branches that reshape by markup.
- **Touch/size floor** — the Law 10 recipe.
- **Structural relationships** — how its own children lay out.

Must **not** define: any literal color, any `px`/`rem` spacing (except the
44px floor), `color` itself, a border by default, variant classes,
transitions, or defensive resets.

---

## The shape of a good component

The real button, complete — themeable, dark-correct, stateful, accessible,
touch-hardened, borderless, **zero color literals**:

```css
@layer classAPI.components {
  :where(button) {
    --bg: 0.6;                                    /* default position */
    display: inline-flex; align-items: center; justify-content: center;
    gap: 0.45em;
    min-block-size: 2lh; min-inline-size: 2lh;
    padding: 0.35em 0.8em;
    border-radius: var(--cfg-radius);
    font-weight: 600;
    user-select: none; -webkit-user-select: none;
    background-color: var(--_bg); --surf-l: var(--_bg-l);   /* painter */
    & > svg { inline-size: 1.15em; block-size: 1.15em; flex: 0 0 auto; }
  }
  @media (pointer: coarse) {
    :where(button) { font-size: max(16px, var(--_font-size)); }
  }
  @media (pointer: coarse) and (max-width: 768px) {
    :where(button) { min-block-size: max(44px, 2lh); min-inline-size: max(44px, 2lh); }
  }
  :where(button[aria-label]:has(> svg):not(:has(> small))) { padding: 0; aspect-ratio: 1; }
  :where(button:has(> svg):has(> small)) {
    flex-direction: column; gap: 0.15em; padding: 0.3em; aspect-ratio: 1;
    & > small { --type: -2; font-weight: 600; line-height: 1; }
  }
}
```

The author themes it entirely at the call site. Notice it sets no `--type`
(base gives `<button>` a sensible default) and no `color` (the engine
computes it). If your component is much longer than this, you're probably
encoding decisions the call site should own.

---

## Quick check before shipping a component

1. Literal color anywhere? → delete it, use the engine.
2. `px`/`rem` spacing (other than the 44px floor)? → convert to `em`/`lh`.
3. Set `font-weight` for hierarchy? → delete it; change `--type` (the engine
   ramps weight). Only `b`/`strong` or a rare UI-affordance weight survive.
4. A `-primary` / `-sm` / `-red` variant? → delete it; call-site number or
   project alias.
5. A class where the semantic element would do? → style the element.
6. Restated something `base`/`theme` already sets? → delete it.
7. Added `.clickable` / `.hoverable` / a transition? → remove it.
8. Branched on a variant where `:has()` could read the markup? → use
   `:has()`.
9. Wrote flat sibling rules that repeat a prefix, or a `:has()` that targets
   from an outer scope? → nest them under the element (Law 3).
10. Interactive but missing the Law 10 touch recipe? → add it.
11. Shipped a border by default? → remove it; lean on surface difference.
12. Used `data-ui-state` where a real ARIA attribute fits, or made color
    the *only* carrier of a state's meaning? → fix it (Law 7).
13. Could this be shorter? → it almost always can.
