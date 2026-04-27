# Layers

The toolbox CSS uses cascade layers to make every rule's role explicit. The order is fixed; the meaning of each layer is fixed; deciding where a new rule goes should be a 10-second decision.

```css
@layer
    reset.fix,
    reset.opinion,
    core.color,
    core.type,
    core.space,
    theme,
    layout.app,
    layout.doc,
    layout.composition,
    component.base,
    component.simple,
    component.complex,
    utility.layout,
    utility.exceptions,
    utility.important;
```

Read top to bottom. Every layer assumes the ones above it have already happened.

---

## reset.fix

Browser bug fixes and ancient-CSS workarounds. Things that are objectively wrong defaults — `box-sizing`, default margins, baseline-aligned images, table isolation. If a rule could be defended as "this is what the spec should have done," it goes here.

**Belongs:** universal selectors, baseline element fixes, `:where(html)` font-smoothing.
**Doesn't belong:** anything that reflects taste. If two reasonable people would disagree, it's `reset.opinion`.

## reset.opinion

Project-level structural preferences applied across all elements. Still resets, but driven by taste, not by spec correctness — `text-wrap: balance` on headings, scrollbar-width, link `text-decoration: none`. Think of these as "the structural defaults I want every project to inherit."

Rules in this layer **must not consume custom properties from the core system** (`--_bg`, `--s`, `--type`, etc.). It's structural baseline only — properties like `text-wrap`, `cursor`, `box-sizing`, `overflow-wrap`. Anything that needs `--_bg` or computes against `--s` goes in `theme` (visual) or `component.base` (per-element typography).

**Belongs:** structural baseline rules using `:where(...)` for zero specificity.
**Doesn't belong:** anything that consumes a core token. Anything that requires a class (that's `component.*` or `utility.*`).

## core.color

The color formula. One layer, one job: take a small set of inputs (`--bg`, `--hue`, `--depth`, `--fg-contrast`, etc.) and compute one output (`--_bg`, plus `color`, `--border`, `--Border`). Every other layer consumes those outputs.

Also includes the rules that resolve `--_bg` into actual paint — the `:where(*) { background-color: ... }` rule, the `.surface` cascade, and the SVG color-bridge rules that translate the same outputs to `fill`/`stroke`.

**Belongs:** color math, `--_bg` painting, surface depth tracking, SVG color bridging.
**Doesn't belong:** semantic hue presets (`.suc`/`.inf`) — those are theme decisions about *which* hue means success, not how the math works. Theme blocks (`@media prefers-color-scheme`, `[data-ui-theme="dark"]`) — those are also theme.

## core.type

The fluid-type formula. `--cfg-type-min`, `--cfg-type-max`, `--cfg-fluid-min-vp`, `--cfg-fluid-max-vp`, plus the `:where(*)` rule that interpolates `font-size` against viewport width. The `--type` step variable composes through `pow()` against the configured ratio.

**Belongs:** the type formula, type config tokens, line-height and letter-spacing derived from `--type`.
**Doesn't belong:** font-family declarations (those are `theme`), per-element type sizing (that's `component.base` for default elements, or per-component for everything else).

## core.space

Same shape as `core.type`, but for spacing. The `--s` length is a fluid value derived from `--space` step + base + ratio + viewport clamp. Utility shorthands `.m/.p/.mx/.my/.px/.py` apply `--s` to the conventional axes.

**Belongs:** the space formula, the four shorthand classes.
**Doesn't belong:** layout primitives that *use* `--s` for `gap` (those are `layout.composition`).

## theme

Project-level visual decisions. This is where the "vibe" of the page lives — anything you'd change to give the whole project a different mood without touching component logic.

Concretely:
- **Theme blocks**: `@media (prefers-color-scheme)`, `[data-ui-theme="light"]`, `[data-ui-theme="dark"]` — the values for `--cfg-color-top-l` etc. that make light/dark possible.
- **Semantic hue presets**: `.suc`, `.inf`, `.wrn`, `.dgr` — fixed-hue overrides for success/info/warning/danger contexts.
- **State classes**: `.hover`, `.active`, `.disabled` — color-formula nudges (`--l-shift`, `--c-shift`, `--fg-contrast` adjustments) that the pointer-events script applies. These look like component logic, but they're not — they're pure visual deltas to the existing color math, applied uniformly across every component. Lives here because (a) the math is theme-level, and (b) consistent state appearance across components is a theme concern.
- **Visual decoration helpers**: `.shadow`, `.glow` — drop-shadow filters that respond to the current `--_bg`.
- **Density/motion presets**: `[data-ui-size="sm/md/lg"]`, `[data-ui-motion="off/on"]`, `[data-ui-space="sm/md/lg"]`.
- **Font family declarations**: `--font-heading`, `--font-body`, `--font-mono`, `--font-kbd`.
- **Selection and focus visuals**: `::selection`, `:focus-visible` — the styling, not the JS.

**Belongs:** vibe. If swapping it changes how the page *feels* without changing what it *does*, it's theme.
**Doesn't belong:** color math (that's `core.color`). Layout decisions (`layout.*`). Per-component visual choices (those live with the component).

## layout.app

The application shell layout. A 3×3 grid (header / nav · main · aside / footer) with drawer-style nav and aside that collapse to fixed-position modal drawers below a container-query breakpoint. Opt-in via `<body class="app">`.

**Belongs:** the app-shell grid template, drawer behavior, container-query breakpoint logic.
**Doesn't belong:** anything that assumes a different page shape — that's `layout.doc`. Composition primitives (`layout.composition`). Components that live *inside* a slot.

## layout.doc

The document/paper layout. Used when the consumer wants a fixed-aspect "piece of paper" centered on a backdrop, with print awareness. Opt-in via `<body class="doc">` or applied directly via a `.paper` class on a child article. Sets up the backdrop, the paper's aspect-ratio container, the print `@page` rules.

**Belongs:** paper sizing math, backdrop centering, print media rules for fixed-page documents.
**Doesn't belong:** the paper's *contents* — that's per-document `me {}`. App-shell behavior (`layout.app`).

## layout.composition

Stateless layout primitives that compose with anything. `.stack`, `.row`, `.split`, `.cluster`, `.grid`, `.flank`, `.flank-end`, `.span`. Plus a few small positioning helpers like `.fab-row` (fixed bottom-right action row) and the directional grid-overlap classes (`.↖`, `.↗`, etc.).

**Belongs:** classes that arrange children with no opinion about what the children are.
**Doesn't belong:** classes that style their children. Classes that assume a specific page structure (those are `layout.app/doc`).

## component.base

Default-element styling. `h1`–`h6`, `p`, `small`, `code`, `pre`, `figcaption`, `blockquote`, `address`, `cite`, `mark`, `hr`.

These rules apply via tag selectors (`h1 { ... }`) so consumers get reasonable typography by default without classes. Each rule sets `--type`, `--contrast`, `font-family` — the formula does the rest.

**Belongs:** styling for unclassed HTML elements.
**Doesn't belong:** anything requiring a class. Class-based versions of the same idea (`.badge`, `.tag`) are `component.simple`.

## component.simple

Generic, reusable components keyed by class. `.btn`, `.tag`, `.card`, `.popover`, etc. Each composes with the color/type/space systems and works in any context.

A component qualifies as "simple" if (a) it's small (one or two visual units), (b) it's general enough that the same class makes sense in any project, and (c) it doesn't assume a particular surrounding structure.

**Belongs:** generic components.
**Doesn't belong:** anything project-specific. If the class name has a domain noun in it (`.timeline`, `.xp`, `.aside`, `.invoice`), it's not simple — it's app code, and it lives with the app as a `me {}` block.

## component.complex

Complex generic components — modal dialogs, calendars, data tables. Same purity rule as `component.simple`: project-specific things don't belong here.

This layer should usually be small. Most things that feel "complex" turn out to be either (a) a `component.simple` doing too much and needing decomposition, or (b) app code that belongs in a `me {}` block.

**Belongs:** generic complex components.
**Doesn't belong:** see `component.simple`.

## utility.layout

Display-context utilities. `.mobile`, `.tablet`, `.desktop` for responsive show/hide. `.nowrap`, `.truncate`. `@media print { ... }` rules that adjust general behavior for print.

**Belongs:** small classes that flip layout-related properties.
**Doesn't belong:** anything visual or behavioral beyond layout.

## utility.exceptions

Reserved for cases where a rule must override the cascade in a way that doesn't fit elsewhere. `.vh` (visually hidden) lives here.

**Belongs:** rare exceptions.
**Doesn't belong:** anything you can put in another layer.

## utility.important

Rules that use `!important` to override inline styles or other cases where the cascade legitimately can't reach. `[hidden] { display: none !important }`, `@media print { .np { display: none !important } }`.

In practice this layer should be very small — often empty. It exists so that *when* you do need `!important`, there's a defined place for it instead of scattering high-priority rules through the rest of the system.

**Belongs:** rules that legitimately need `!important` for cascade reasons.
**Doesn't belong:** anything that could work without `!important`. If you reach for this layer, ask why first.

---

## Decision rules

When adding a new rule, ask in order:

1. **Is it stylistically opinionated?** No → `reset.fix`. Yes → continue.
2. **Is it a structural baseline that doesn't consume any core tokens?** Structural and token-free → `reset.opinion`. Anything that reads `--_bg`, `--s`, `--type`, etc. is not a reset — it's `theme` (project-wide visual) or `component.base` (per-element typography). Continue.
3. **Is it color/type/space math?** Yes → the matching `core.*` layer. No → continue.
4. **Is it a project-wide visual decision?** Yes → `theme`. No → continue.
5. **Does it shape the page layout?** Yes → `layout.app` (drawer shell), `layout.doc` (paper), or `layout.composition` (primitives). No → continue.
6. **Is it a default-element rule?** Yes → `component.base`. No → continue.
7. **Is it a class-keyed component?** Yes — and is it generic? Yes → `component.simple` or `.complex`. No → it's app code, write a `me {}` block.
8. **Is it a small layout flag?** Yes → `utility.layout`.
9. **Does it genuinely fit nowhere else but is still legitimate?** `utility.exceptions`. This layer is intentionally a buffer — expected to be empty in practice, kept declared so the scaffold is in place for the rare case you need it.
10. **Does it need `!important`?** Yes → `utility.important`. Otherwise → reconsider — most rules don't need this layer.

If a rule doesn't fit any layer, the answer is almost always "it's not generic; it should be a `me {}` block in the app code."

## Declarations outside layers

Nothing should be declared outside a layer except things that the language requires to be unlayered: `@property` declarations, `@font-face`, `@import`. Everything else — every selector, every `@media`, every `@container` — goes inside a `@layer` block. This is what makes the cascade predictable; rules outside layers always win, which silently breaks the whole order.

## What does *not* belong in any layer

App-specific components. Anything with a domain noun in the class name. The resume's timeline, sidebar, role cards, header — none of these are toolbox concerns. They're app code, expressed as `me {}` blocks scoped to the elements they belong to.

The toolbox is the substrate; the app is what you build on it. Keeping that line clean is what makes the toolbox reusable.
