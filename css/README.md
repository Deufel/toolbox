*purge CDN* 

1. [go here](https://www.jsdelivr.com/tools/purge)
2. past this; 
```
https://cdn.jsdelivr.net/gh/Deufel/toolbox@latest/css/style.css
```
----  
# stick.css

A design system for HTML. Compose interfaces from a small set of tokens, layout primitives, and components. The system handles theming, dark mode, hue rotation, and contrast automatically.

## Setup

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Deufel/toolbox@<commit>/css/style.css">
```

Use a commit hash during development, a tag for production.

Set the theme on `<html>`:

```html
<html data-ui-theme="light">  <!-- or "dark", omit for system preference -->
```

The keywords **MUST**, **MUST NOT**, **SHOULD**, and **MAY** in this document follow [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). They appear only where authors hit real failure modes if ignored.

## Mental model

Three concepts.

**Color** has two axes:
- `--bg` (0 to 1) — surface presence. 0 blends in, 1 is loud chromatic.
- `--fg` (-1 to 1) — ink contrast. -1 is neutral high contrast, 0 is dim, positive is chromatic.

Hue is set by `--hue` (brand, cascades), `--hue-shift` (relative rotation, for variety), or `--hue-lock` (absolute, overrides everything).

**Scale** has two control knobs:
- `--type` — local scale step. Integer; 0 is body, +N is bigger, -N is smaller. Does not inherit.
- `--scale` — regional multiplier. Set on a region to rescale everything inside. Inherits.

Everything spacing-related derives from these — component padding (em), component height (lh), layout gap (lh). There is no separate spacing API.

**Structure** has two layers:
- `.stage` paints a background. Nested stages auto-cascade depth.
- Layout primitives (`.row`, `.column`, `.grid`, `.hud-overlay`, `.hero`, etc.) arrange children.

That's the system. The rest is reference.

## Color

### `--bg` [0, 1]

Surface presence. As `--bg` rises, the element paints with progressively more chromatic surface.

```html
<div style="--bg: 0">        <!-- transparent on parent stage -->
<div style="--bg: 0.2">      <!-- soft chromatic tint -->
<div style="--bg: 0.55">     <!-- moderate -->
<div style="--bg: 0.8">      <!-- loud (tags, primary CTAs) -->
<div style="--bg: 1">        <!-- maximum chromatic -->
```

Stages always paint. Non-stage elements only paint when `--bg > 0`.

Use `--bg` for single-purpose painted elements: buttons, tags, accents. Use `.stage` for content regions that hold multiple related items.

### `--fg` [-1, 1]

Ink contrast for text and SVG `currentColor`.

```html
<span style="--fg: -1">      <!-- body text, full contrast -->
<span style="--fg: -0.5">    <!-- secondary text -->
<span style="--fg: -0.3">    <!-- captions -->
<span style="--fg: 0.5">     <!-- chromatic accent -->
<span style="--fg: 0.8">     <!-- vivid links, primary -->
<span style="--fg: 1">       <!-- maximum chromatic -->
```

Negative values are neutral ink (gray-scale through theme contrast). Positive values are chromatic ink (colored).

### Hue

Three tokens, all inheriting:

```html
<style>:root { --hue: 18 }</style>            <!-- brand: applies everywhere -->

<div style="--hue-shift: 90">                  <!-- rotated +90° from brand -->
<div style="--hue-shift: -120">                <!-- rotated -120° from brand -->

<div style="--hue-lock: 145">                  <!-- absolute, ignores brand -->
```

`--hue-shift` is relative — use it for chart series, KPI variety, decorative differentiation. `--hue-lock` is absolute and wins over both `--hue` and `--hue-shift` — use it for semantic colors (success, danger) or branded sub-trees.

### Semantic helpers

Built-in `--hue-lock` shortcuts:

```html
<span class="suc">      <!-- green: success, live -->
<span class="inf">      <!-- blue: info, neutral status -->
<span class="wrn">      <!-- yellow: warning -->
<span class="dgr">      <!-- red: danger, error -->
<span class="bw">       <!-- grayscale (zero chroma) -->
```

### Borders

Two derived border colors, computed from each element's current `--bg`:

- `var(--border)` — quiet, low chroma. Default borders.
- `var(--Border)` — louder, slightly chromatic. Focus, hover, emphasis.

```html
<div style="border: 1px solid var(--border)">
<input style="border: 1px solid var(--Border)">
```

Authors **MUST NOT** assign these directly. They derive from `--bg`; overriding desyncs them from their surface.
## Scale

### `--type` (local)

Adjusts the scale step for a single element. Does not inherit — set it on each element that needs sizing.

```html
<span style="--type: 3">     <!-- display heading -->
<span style="--type: 2">     <!-- page title -->
<span style="--type: 1">     <!-- section title -->
<span style="--type: 0">     <!-- body (default) -->
<span style="--type: -1">    <!-- secondary text -->
<span style="--type: -1.5">  <!-- captions -->
<span style="--type: -2">    <!-- micro labels, all-caps tags -->
```

Integer steps are recommended for uniform UI; decimals work for fine-tuning.

Letter-spacing and line-height adjust automatically — bigger text gets tighter spacing.

### `--scale` (regional)

A multiplier that inherits. Set on a region to rescale everything inside — type, padding, gaps, component sizing.

```html
<div style="--scale: 1.25">  <!-- everything 1.25× bigger -->
<div style="--scale: 0.85">  <!-- everything 0.85× -->
```

Use `--scale` to make a section, card, or the whole page bigger or smaller while preserving internal hierarchy. Use `--type` to adjust a single element's place in the hierarchy.

### The convergence

Everything spacing-related derives from these two knobs:

- Component padding uses `em` — scales with the component's `--type`.
- Component sizing uses `lh` — scales with line-height, which scales with `--type`.
- Layout primitive gaps use `lh` — scales with the ambient `--type`.

There is no `--gap` token, no separate spacing scale, no padding utility classes. Change `--type` or `--scale` and the whole composition rescales coherently.

## Stage

A stage is a region that paints its own background. Wrap content regions in `.stage`:

```html
<body class="stage">
  <main class="stage">
    <div class="card stage">       <!-- leaf, brightest -->
      <div class="stage">…</div>   <!-- deepest, brightest -->
    </div>
  </main>
</body>
```

Depth auto-cascades. Stages nested inside other stages get progressively brighter (closer to the audience) — the leaf stage is the most prominent. The system infers depth via `:has()` and assigns `--depth` from 0 (deepest body) to 3 (leaf, frontmost).

The metaphor is theater: stage-0 is closest to the audience.

### Explicit pinning

Use `.stage-0` through `.stage-3` when you need a specific depth regardless of nesting:

```html
<div class="stage-0">    <!-- pinned closest -->
<div class="stage-1">
<div class="stage-2">
<div class="stage-3">    <!-- pinned deepest -->
```

Pinned stages stay outside the auto-cascade — a `.stage-2` inside a bare `.stage` does not inflate its parent's depth. Use pinned stages for overlays, legends, or cards in a grid that should paint identically regardless of context.

Pick one staging mode per region. Mixing auto-cascade and pinned stages in the same subtree produces inconsistent results.

### Glass

Add `.glass` to any stage to make it translucent. The surface paints at reduced opacity and a backdrop blur kicks in. Composes with `.stage` and `.stage-N` normally — the alpha flows through the formula and everything downstream (borders, depth ramp, hue) keeps working.

```html
<div class="stage glass">…</div>             <!-- translucent stage -->
<div class="stage-2 glass">…</div>           <!-- pinned + translucent -->
```

Tune transparency per instance with `--cfg-color-alpha`:

```html
<div class="stage glass" style="--cfg-color-alpha: 0.35">…</div>   <!-- more transparent -->
<div class="stage glass" style="--cfg-color-alpha: 0.85">…</div>   <!-- subtle -->
```

Use for sticky chrome over scrolling content, modal overlays, drawers over the page, or any context where you want the surface present but not blocking visual context. Text contrast continues to work because the foreground formula reads the surface lightness, not its alpha.

## SVG

SVG paints through `currentColor`, which derives from `--fg`. Any SVG element using `stroke="currentColor"` or `fill="currentColor"` participates in the system — theme switches, hue rotation, and contrast flipping propagate automatically.

Three conventions:

**Use `--fg` for ink.** Strokes, fills, data lines, icons. Negative values give neutral ink (gridlines, baselines), positive values give chromatic ink (data, accents).

```html
<g style="--fg: -0.4" stroke="currentColor">       <!-- muted baseline -->
<g style="--fg: 0.8" stroke="currentColor">        <!-- vivid foreground -->
```

**Use `var(--border)` for chrome.** Grid lines, axes, decorative rules — anything that's structure, not data.

```html
<line x1="0" y1="50" x2="600" y2="50" stroke="var(--border)"/>
```

**Use `--hue-shift` for variety.** Per-series differentiation in charts, or accent variation in icon sets. Set on the `<g>` that contains the series.

```html
<g style="--fg: 0.9; --hue-shift: 200" stroke="currentColor">  <!-- shifted series -->
```

Authors **MUST** color SVG via `--fg`. `--bg` is the background axis and does not propagate through `currentColor`.

### Practical guidance

Keep geometry in SVG; put text in HTML. Labels, legend entries, axis titles, and value annotations should be HTML elements positioned with `.hud-overlay` slots or absolute positioning, styled with `--type` and `--fg` like any other text. SVG `<text>` doesn't participate in the type system and creates a parallel styling path you'll fight forever.

```html
<div class="hud-overlay">
  <svg viewBox="0 0 600 200">…paths and lines…</svg>
  <div class="↘">…legend, HTML, styled with --fg…</div>
</div>
```

See "Putting it together" for a full chart example.
## Layout primitives

Stateless containers that arrange children. No opinions about what the children are. Gaps derive from `1lh` so spacing scales with the ambient `--type`.

Use primitives intentionally. A `<div class="column">` is a positive choice; wrapping everything in primitives by default obscures structure.

### Flow

```html
<div class="row">      <!-- horizontal flex with wrap, gap absorbs slack -->
<div class="column">   <!-- vertical flex with gap -->
```

### Distribute

```html
<div class="split">    <!-- rigid 50/50 grid, two columns -->
<div class="spread">   <!-- flex with space-between -->
```

Use `.spread` by default — it sizes children to content and absorbs slack in the gap. Use `.split` only when you need exactly 50/50 at all sizes.

### Three-region

```html
<div class="lcr">      <!-- left, center, right -->
<div class="tmb">      <!-- top, middle, bottom -->
```

### Flank (one fixed, one fills)

```html
<div class="flank">       <!-- first child fixed, last fills -->
<div class="flank-end">   <!-- first fills, last fixed -->
```

### Grid (responsive auto-fit)

```html
<div class="grid" style="--grid-min: 14rem">
```

Children fill the row, wrapping to new rows when they'd shrink below `--grid-min`.

### `.hud-overlay` (floating anchors)

Children occupy a shared cell, anchored by directional class. Siblings are geometrically independent — a giant `↖` panel cannot push a centered `•` child off-axis.

```html
<div class="hud-overlay">
  <span class="↖">top-left</span>
  <span class="↑">top-center</span>
  <span class="↗">top-right</span>
  <span class="←">middle-left</span>
  <span class="•">center</span>
  <span class="→">middle-right</span>
  <span class="↙">bottom-left</span>
  <span class="↓">bottom-center</span>
  <span class="↘">bottom-right</span>
</div>
```

Use for overlays on content: KPI cards (label `↖`, badge `↗`, big number `•`), chart legends pinned over the chart, floating controls on media, badges, watermarks.

### `.hud-grid` (spatial nine-cell)

Same anchor classes, but children occupy distinct cells. The middle row stretches; left/right/center scroll independently; corners pin.

```html
<div class="hud-grid">
  <header class="↖">…</header>
  <div class="↑">…</div>
  <header class="↗">…</header>
  <aside class="←">…</aside>
  <main class="•">…</main>
  <aside class="→">…</aside>
  <footer class="↙">…</footer>
  <div class="↓">…</div>
  <footer class="↘">…</footer>
</div>
```

Use for editor shells, media viewers with persistent controls, or any layout where corners and edges hold real chrome around a scrollable center.

The two HUD primitives share the same `↖ ↑ ↗ ← • → ↙ ↓ ↘` vocabulary — pick `.hud-overlay` to float children on one cell, `.hud-grid` to distribute children into nine cells.

### `.hero` (5-slot panel)

A panel primitive with optional top, bottom, left, right, and a scrolling main:

```html
<div class="hero">
  <div class="top">…</div>
  <div class="left">…</div>
  <div class="main">…</div>
  <div class="right">…</div>
  <div class="bottom">…</div>
</div>
```

All slots except `.main` are optional — omit any and its track collapses. Use inside drawers, modals, or any container that needs "chrome around scrolling content" without taking the whole viewport.

### `.frame` (aspect ratio)

```html
<div class="frame">     <!-- 16:9 ratio, child fills with object-fit: cover -->
  <img>
</div>
```

## Page layout

Wrap your application root in `body.page` to get an eleven-slot grid:

```html
<body class="page stage">
  <div class="pg-banner">…</div>
  <div class="pg-header">…</div>
  <div class="pg-subheader">…</div>
  <div class="pg-navigation-header">…</div>
  <nav class="pg-navigation">…</nav>
  <div class="pg-navigation-footer">…</div>
  <div class="pg-main-header">…</div>
  <main class="pg-main">…</main>
  <div class="pg-main-footer">…</div>
  <aside class="pg-aside">…</aside>
  <div class="pg-footer">…</div>
</body>
```

The grid is fixed. Banner, header, subheader stack at the top. Navigation column on the left, main column in the middle, aside on the right share the middle band. Footer pins at the bottom. Only the navigation, main, and aside columns scroll; chrome slots pin.

A page using `body.page` **MUST** contain a `pg-main`. All other slots are optional — omit any and its track collapses. The grid only assigns positions to direct children with `pg-*` classes, so drawers and scripts can live as direct children of `<body>` without leaking into the layout.

### Slot roles

Defaults, not requirements. Content can live wherever fits a breakpoint.

- **`pg-banner`** — full-width topmost strip. Announcements, environment indicators.
- **`pg-header`** — primary chrome. Brand, top nav, account.
- **`pg-subheader`** — secondary chrome. Breadcrumbs, page title, filters.
- **`pg-navigation-header`** — top of nav column. Workspace switcher, search.
- **`pg-navigation`** — primary navigation. Vertical, scrolls.
- **`pg-navigation-footer`** — bottom of nav column. User profile, version.
- **`pg-main-header`** — above main content. Page title, tabs, toolbar.
- **`pg-main`** — the reason the user is here. Scrolls.
- **`pg-main-footer`** — below main content. Status bar, persistent actions.
- **`pg-aside`** — right-side metadata. Vertical, scrolls.
- **`pg-footer`** — bottom dock. Copyright, footer links.

### Paired chrome slots

The chrome rows above and below `pg-main` share a grid row across columns. Each row sizes to the tallest child at that vertical position.

This means `pg-navigation-header` and `pg-main-header` **MUST** be used together. Using one without the other leaves the other column's top edge at a different baseline, producing a jagged chrome strip. The same applies to `pg-navigation-footer` and `pg-main-footer`.

Most pages don't need these paired chrome slots at all. Use them only when you specifically want the nav column and main column to share a coherent chrome band — a search input next to a tabs strip, both at the same height; a user info row next to a status bar, both at the same baseline.

For independent column chrome — a tall header above the nav with no header above main, for example — **MUST** use a nested `.hero` inside the column instead:

```html
<nav class="pg-navigation hero">
  <div class="top">…nav-only header…</div>
  <div class="main">…links…</div>
</nav>

<main class="pg-main">…</main>
```

The nav column now owns its internal chrome without affecting main. The tradeoff is that the nav chrome is decoupled from any chrome strip above main — which is correct when the two columns don't want to share a baseline.

### Responsive viewport classes

Three additive classes:

```html
<element class="mobile">          <!-- < 480px -->
<element class="tablet">          <!-- 480px – 1024px -->
<element class="desktop">         <!-- ≥ 1024px -->
<element class="mobile tablet">   <!-- < 1024px (combined) -->
<element>                         <!-- always visible -->
```

Adding a class restricts the element to matching viewports. Combine to express ranges.

Classes work on any element regardless of native display type. The system flips the element to its natural display when it should appear:

```html
<button aria-label="Save">
  <span class="mobile desktop" aria-hidden="true">💾</span>
  <span class="tablet desktop">Save</span>
</button>
```

At mobile only the icon shows; at tablet only the label; at desktop both.

Authors **MUST NOT** put a layout primitive class on the same element as a viewport class. Viewport classes carry `!important` and will silently override the primitive's `display`. Wrap content in a child element and put the primitive on the wrapper.

### Coverage

Viewport classes partition the viewport range. When gating an element with `.mobile`, decide what fills the slot at tablet and desktop. Most layouts settle into two shapes:

**Two-way split** — one version persists across two breakpoints, another takes the third.

```html
<nav class="pg-navigation desktop">…sidebar…</nav>
<div id="nav-drawer" popover class="drawer left mobile tablet">…drawer…</div>
```

**Three-way split** — a different shape per breakpoint, all sharing the slot's grid track when possible.

```html
<nav class="pg-navigation">
  <section class="desktop">…full sidebar…</section>
  <section class="tablet">…icon-only rail…</section>
</nav>
<div id="nav-drawer" popover class="drawer left mobile">…drawer…</div>
```

Both desktop and tablet variants are vertical because `pg-navigation`'s track is vertical. A horizontal shape (e.g. a top nav bar at tablet) doesn't belong in `pg-navigation` — move it to a slot with a horizontal track and let `pg-navigation` collapse.

### Migrating content across slots

A single concept — a nav, a toolbar, a search input — can live in different slots at different breakpoints. Each slot has a fixed orientation; the *shape* of the content changes to fit the slot.

```html
<div class="pg-header">
  <span class="brand">stick.css</span>
  <nav class="tablet">…horizontal pill bar…</nav>   <!-- tablet shape lives here -->
</div>

<nav class="pg-navigation desktop">…vertical sidebar…</nav>  <!-- desktop shape -->

<main class="pg-main">…</main>

<div class="pg-footer">
  <nav class="mobile">…bottom toolbar…</nav>        <!-- mobile shape -->
</div>
```

Exactly one shape participates at each breakpoint. Slots whose only content is hidden at the current viewport collapse to zero.

## Drawers

Two flavors, distinguished by element type and chosen by intent.

**Modal drawer** — `<dialog class="drawer ...">`. Opens with `showModal()`, dims the backdrop, traps focus, makes the page inert. Use when the drawer demands full attention: navigation on mobile, confirmations, focused tasks.

```html
<dialog class="drawer left">…</dialog>
<button onclick="document.querySelector('dialog.drawer.left').showModal()">
  open
</button>
```

**Non-modal drawer** — `<div popover class="drawer ...">`. Opens via `popovertarget` (no JS), lets the user keep working on the page. Use when the user needs the page as context — filters, settings, an authoring form referencing visible content.

```html
<div id="filters" popover class="drawer right">…</div>
<button popovertarget="filters">Filters</button>
```

Animation and positioning are identical; only modality differs.

### Positions

```html
<dialog class="drawer left">     <!-- slides from left, full height -->
<dialog class="drawer right">    <!-- slides from right -->
<dialog class="drawer top">      <!-- slides from top, full width -->
<dialog class="drawer bottom">   <!-- slides from bottom -->
```

Same classes apply to popover drawers. Override sizing per-instance:

```html
<dialog class="drawer bottom" style="block-size: 75svh">
```

### Internal layout

For a drawer with its own header, scrolling body, and footer, compose with `.hero`:

```html
<dialog id="nav-drawer" class="drawer left hero stage">
  <div class="top">…search + close…</div>
  <div class="main">…scrolling links…</div>
  <div class="bottom">…user info…</div>
</dialog>
```

`.drawer` handles positioning and animation; `.hero` handles internal layout. They compose cleanly.

For a drawer that lets the page behind it show through, add `.glass`:

```html
<dialog id="filters" class="drawer right hero stage glass">
  <div class="top">…filter title + close…</div>
  <div class="main">…controls…</div>
  <div class="bottom">…apply / reset buttons…</div>
</dialog>
```

The drawer slides in over the page, backdrop-filter blurs what's behind it, and the surface paints translucently. Especially useful for non-modal popover drawers where the page underneath is visible context.

Drawers **SHOULD** live as direct children of `<body>`, not nested inside page slots — they exist in the top layer (or as positioned popovers) and don't need a place in the grid.
## Components

### Button

```html
<button class="btn">Action</button>
<button class="icon-btn"><svg>…</svg></button>     <!-- square, icon-only -->
```

For a chromatic primary CTA, raise `--bg`:

```html
<button class="btn" style="--bg: var(--cfg-bg-loud); --fg: -1; border-color: transparent">
  Save
</button>
```

### Tag

Labeled chip. Element type chooses the mode.

```html
<span class="tag">NEW</span>                       <!-- static, always vivid -->
<span class="tag suc">live</span>

<button class="tag" aria-pressed="false">filter</button>   <!-- toggle -->
<button class="tag" aria-pressed="true">filter</button>    <!-- on state -->
```

### Tabs

```html
<div class="tabs" role="tablist">
  <button role="tab" aria-selected="true">First</button>
  <button role="tab" aria-selected="false">Second</button>
</div>

<div class="tabs underline" role="tablist">…</div>     <!-- underline variant -->
```

Tab click handler (generic across all tab groups):

```html
<script>
  document.querySelectorAll('.tabs').forEach(group => {
    const buttons = group.querySelectorAll('button');
    buttons.forEach(btn => btn.addEventListener('click', () =>
      buttons.forEach(b => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'))));
  });
</script>
```

### Card

```html
<div class="card">…</div>              <!-- quiet border (var(--border)) -->
<div class="Card">…</div>              <!-- louder border (var(--Border)) -->
<div class="card stage">…</div>        <!-- paints its own background -->
```

### Input

```html
<input class="input" type="text">
<select class="input">…</select>
<textarea class="input"></textarea>
```

Inside a `<form>`, inputs auto-stretch to full width. Inside a `<fieldset>`, inputs arrange as flex children:

```html
<form>
  <input class="input">
  <fieldset>
    <div><label>First</label><input class="input"></div>
    <div><label>Last</label><input class="input"></div>
  </fieldset>
</form>
```

### Check / radio

```html
<input class="check" type="checkbox">
<input class="radio" type="radio" name="x">
```

### Avatar

```html
<span class="avatar">MD</span>                       <!-- initials -->
<span class="avatar" style="--type: 1">JM</span>     <!-- larger -->
<span class="avatar" style="--hue-shift: 90">PK</span>
```

### Crumbs

Auto-renders separators between children.

```html
<nav class="crumbs">
  <a href="#">Home</a>
  <a href="#">Section</a>
  <span aria-current="page">Current</span>
</nav>
```

### Link

```html
<a class="link" href="#">read more</a>
```

### Progress

```html
<progress value="65" max="100"></progress>     <!-- determinate -->
<progress></progress>                           <!-- indeterminate, pulses -->
```

### kbd

```html
<p>Press <kbd>⌘K</kbd> to search.</p>
```

### hr

```html
<hr>                                            <!-- divider in border tone -->
```

### Code blocks

Syntax-highlighted code blocks with CRT-glass styling. Wrap source in `<pre><code class="lang">`. The system supplies the frame, the chip label, the hue, and the selection treatment.

```html
<pre><code class="python">def greet(name): return f"Hi, {name}"</code></pre>
```

Include the highlighter script once on the page:

```html
<script src="https://cdn.jsdelivr.net/gh/Deufel/toolbox@<commit>/js/highlight.js"></script>
```

Supported languages: `go`, `python`, `html`, `css`, `javascript` (alias `js`), `rust`, `ruby`, `bash` (alias `sh`). Each has a brand-derived `--hue`.

Override the hue per-instance if needed:

```html
<pre style="--hue: 200"><code class="python">…</code></pre>
```

Add an optional copy button as a direct child of `<pre>`. The system positions it; wire the click handler yourself.

```html
<pre>
  <code class="python">…</code>
  <button class="icon-btn" onclick="navigator.clipboard.writeText(
    this.previousElementSibling.textContent)">
    <svg>…</svg>
  </button>
</pre>
```

The whole block is `user-select: all` by default — one click selects everything for copy.

### CRT wrapper

`.crt` applies the same glass-screen treatment to any container. Use for terminal output, status panels, retro chrome — anywhere the code-block aesthetic fits non-code content.

```html
<div class="crt" style="--hue: 130">
  <pre>SYSTEM STATUS — nominal</pre>
</div>
```

Chromium only. The squircle frame falls back to standard rounded corners elsewhere.

### Text flow utilities

```html
<span class="nowrap">never wraps</span>
<span class="truncate">overflow ellipsized…</span>
```

`.truncate` requires a constrained width — use inside grid cells, flex children with `min-inline-size: 0`, or fixed-width containers.

## Authoring discipline

Order of preference for layout work:

1. **Composition primitives.** `.row`, `.column`, `.spread`, `.split`, `.lcr`, `.tmb`, `.flank`, `.grid`, `.hud-overlay`, `.hud-grid`, `.hero`. Primitives cover ~99% of layouts. They're stateless, predictable, and read at a glance.

2. **Inline `@scope`** for sections that need atomic refinements (a one-off grid template, scoped typography rules). Co-locates styles with structure.

3. **Real components** only for genuinely reusable patterns. The same `@scope` block in three places is the signal to lift it into a component.

### The `@scope` rule

Authors **MUST NOT** style `:scope` directly. Layout properties (especially `display`) belong on a wrapper child:

```html
<section>
  <style>
    @scope {
      :scope > div {
        display: grid;
        grid-template:
          "title    actions" auto
          "summary  detail"  1fr /
           12rem    1fr;
      }
      :scope > div > h2       { grid-area: title }
      :scope > div > .actions { grid-area: actions }
      :scope > div > .summary { grid-area: summary }
      :scope > div > .detail  { grid-area: detail }
    }
  </style>
  <div>
    <h2>…</h2>
    <div class="actions">…</div>
    <div class="summary">…</div>
    <div class="detail">…</div>
  </div>
</section>
```

The wrapper `<div>` carries the grid; the outer `<section>` is free for semantic roles, viewport classes, and page slot classes without conflicting with the layout.

Why: viewport classes and `.page` slot classes set `display` on the outer element. Styling `:scope` competes with them and loses silently. Wrapping in a child sidesteps the conflict entirely.

### Targeting children

Inside `@scope`, target by structure: tags (`:scope > div > h2`), composition primitives (`:scope > div > .row`), or semantic elements (`:scope > div > footer`). Avoid inventing class names just to style something — if the structure can't be targeted cleanly, the scope is too large or the component should be extracted.

Use `grid-template-areas` over numeric tracks. Named areas picture the layout; readers see the shape immediately.

Keep scopes shallow. `:scope > div > h2` is fine. `:scope > section > article > div > .x` is a smell — break the scope up or extract a component.

## Theme attributes

Set on `<html>` or any ancestor:

```html
<html data-ui-theme="light">     <!-- "light", "dark", or omit for system -->
<html data-ui-motion="off">      <!-- "off", "on", or "debug" (10× slow) -->
<html data-ui-type="md">         <!-- "sm", "md", or "lg" -->
```

Toggling an attribute is enough — the formula recomputes everything downstream.

## Putting it together

Worked examples. Each is self-contained — read in isolation, copy, modify.

### KPI row

`.grid` wraps responsively; `.Card.stage.hud-overlay` is the per-card composition. Each card's `--hue-shift` gives it its own chromatic identity without a class name.

```html
<div class="grid" style="--grid-min: 14rem">
  <style>
    @scope {
      :scope .Card { padding: 1rem; min-block-size: 6.5rem }
      :scope .↖ { --type: -2; --fg: -0.5; text-transform: uppercase;
                  letter-spacing: 0.08em; font-weight: 600 }
      :scope .•  { --type: 3; font-family: var(--font-display) }
    }
  </style>

  <div class="Card stage hud-overlay">
    <span class="↖">Revenue</span>
    <span class="↗"><span class="tag suc">+12.4%</span></span>
    <span class="•">$284k</span>
  </div>

  <div class="Card stage hud-overlay" style="--hue-shift: 90">
    <span class="↖">Orders</span>
    <span class="↗"><span class="tag inf">live</span></span>
    <span class="•">1,847</span>
  </div>

  <div class="Card stage hud-overlay" style="--hue-shift: 200">
    <span class="↖">Avg ticket</span>
    <span class="↗"><span class="tag wrn">−3.1%</span></span>
    <span class="•">$153</span>
  </div>
</div>
```

### Multi-line chart with legend

SVG geometry in the chart; HTML legend pinned to `↘` via `.hud-overlay`. Series colors via `--fg` and `--hue-shift`. The "today" marker uses `var(--Border)` — louder than data gridlines because it's a phase boundary, not chrome.

```html
<div class="hud-overlay stage" style="block-size: 16rem; padding: 0.75rem;
     border: 1px solid var(--border); border-radius: var(--cfg-radius)">

  <svg viewBox="0 0 600 200" preserveAspectRatio="none"
       style="inline-size: 100%; block-size: 100%">

    <g stroke="var(--border)" stroke-width="1">
      <line x1="0" y1="50"  x2="600" y2="50"/>
      <line x1="0" y1="100" x2="600" y2="100"/>
      <line x1="0" y1="150" x2="600" y2="150"/>
    </g>

    <g style="--fg: -0.4" stroke="currentColor" stroke-width="1.5" fill="none">
      <path d="M 0,158 C 60,150 100,160 160,150 S 260,140 320,142
               S 440,130 500,120 S 580,110 600,108"/>
    </g>

    <g style="--fg: 0.9" stroke="currentColor" stroke-width="2.5" fill="none">
      <path d="M 0,170 C 50,160 90,165 140,140 S 220,105 280,110
               S 360,72 400,70"/>
    </g>

    <g style="--hue-shift: 200; --fg: 0.9" stroke="currentColor"
       stroke-width="2.5" fill="none" stroke-dasharray="6 5">
      <path d="M 400,70 C 440,58 480,60 520,42 S 580,28 600,22"/>
    </g>

    <line x1="400" y1="0" x2="400" y2="200" stroke="var(--Border)"
          stroke-width="1" stroke-dasharray="2 4"/>
  </svg>

  <div class="↘ stage-2 column" style="--fg: -1; padding: 0.5em 0.7em;
       border: 1px solid var(--border); border-radius: var(--cfg-radius);
       align-items: flex-start">
    <div class="row" style="align-items: center">
      <div style="--fg: 0.9; inline-size: 0.9em; block-size: 0.9em;
                  background: currentColor; border-radius: 0.25em"></div>
      <span>Sales</span>
    </div>
    <div class="row" style="align-items: center">
      <div style="--hue-shift: 200; --fg: 0.9; inline-size: 0.9em;
                  block-size: 0.9em; background: currentColor;
                  border-radius: 0.25em"></div>
      <span>Forecast</span>
    </div>
    <div class="row" style="align-items: center">
      <div style="--fg: -0.4; inline-size: 0.9em; block-size: 0.9em;
                  background: currentColor; border-radius: 0.25em"></div>
      <span>Last year</span>
    </div>
  </div>
</div>
```

Legend swatches are filled squares, not lines — they survive low contrast, print, and small sizes. Legend container is pinned a step deeper (`.stage-2`) so it reads as a chip on top of the chart.

### Form with mixed full-width and side-by-side inputs

```html
<form class="column">
  <div>
    <label>Email</label>
    <input class="input" type="email">
  </div>

  <fieldset>
    <div><label>First</label><input class="input"></div>
    <div><label>Last</label><input class="input"></div>
  </fieldset>

  <fieldset>
    <div><label>City</label><input class="input"></div>
    <div><label>State</label><select class="input"><option>IL</option></select></div>
    <div><label>Zip</label><input class="input"></div>
  </fieldset>

  <div>
    <label>Notes</label>
    <textarea class="input"></textarea>
  </div>

  <div class="row">
    <button class="btn" type="submit"
            style="--bg: var(--cfg-bg-loud); --fg: -1; border-color: transparent">
      Submit
    </button>
    <button class="btn" type="button">Cancel</button>
  </div>
</form>
```

### Drawer with internal chrome

Modal drawer with its own header, scrolling body, and footer. `.drawer` handles positioning and animation; `.hero` handles internal layout.

```html
<button class="icon-btn"
        onclick="document.getElementById('nav-drawer').showModal()">
  <svg>…</svg>
</button>

<dialog id="nav-drawer" class="drawer left hero stage">
  <div class="top row">
    <input class="input" placeholder="Search…">
    <button class="icon-btn" onclick="this.closest('dialog').close()">×</button>
  </div>
  <div class="main column">
    <a href="#" aria-current="page">Overview</a>
    <a href="#">Accounts</a>
    <a href="#">Settings</a>
  </div>
  <div class="bottom row">
    <span class="avatar">MD</span>
    <span>Maria Diaz</span>
  </div>
</dialog>
```

### Navigation across breakpoints

One nav, three shapes, three slots. Exactly one participates at each breakpoint.

```html
<body class="page stage">
  <div class="pg-header">
    <span class="brand">stick.css</span>
    <nav class="tablet">                       <!-- horizontal pill bar -->
      <a href="#" aria-current="page">Overview</a>
      <a href="#">Accounts</a>
    </nav>
  </div>

  <nav class="pg-navigation desktop">          <!-- vertical sidebar -->
    <a href="#" aria-current="page">Overview</a>
    <a href="#">Accounts</a>
  </nav>

  <main class="pg-main">…</main>

  <div class="pg-footer">
    <nav class="mobile">                       <!-- bottom thumb bar -->
      <a href="#" aria-current="page">Home</a>
      <a href="#">Accounts</a>
    </nav>
  </div>
</body>
```

At desktop, `pg-footer`'s only child is hidden, and its row collapses. At mobile, `pg-header`'s nav is hidden but the brand still shows. At tablet, both nav and brand share the header row.
## What NOT to do

Hard rules and common smells. Each one signals that a different tool fits the job better.

**MUST NOT:**

- Write hex codes or `oklch(...)` / `rgb(...)` directly. Use the token system; for a specific color, use `--hue-lock` or `--hue-shift`.
- Override `--_*` tokens. The underscore prefix marks internal state.
- Assign `var(--border)` or `var(--Border)` directly — they derive from `--bg`.
- Color SVG via `--bg`. SVG paints through `currentColor`, which derives from `--fg`.
- Style `:scope` directly. Wrap content in a child and target `:scope > div`.
- Combine a layout primitive class (`.row`, `.column`, `.grid`, `.flank`, `.hero`, etc.) with a viewport class (`.mobile`, `.tablet`, `.desktop`) on the same element. Viewport classes win silently. Wrap in a child element.
- Use `pg-navigation-header` without `pg-main-header` (or `pg-navigation-footer` without `pg-main-footer`). They share a grid row; using one without the other produces a jagged chrome strip. For independent column chrome, use `.hero` inside the column.
- Set inline `padding` on `pg-*` slots. The system provides slot padding; override from a more specific selector if a slot needs different spacing.

**Anti-patterns:**

- Reaching for `@scope` when a composition primitive would do.
- Long selector chains inside `@scope` (`:scope > div > .x > .y > .z`). Break the scope up or extract a component.
- Numeric `grid-row` / `grid-column` inside `@scope`. Use `grid-template-areas`.
- Inventing class names just to style something inside `@scope`. Target semantic tags or composition primitives.
- Setting `font-size` in pixels or rems. Use `--type`.
- Setting `padding` or `gap` to specific values when the primitive's default would do.
- Hardcoded borders. Use `var(--border)` or `var(--Border)`.
- Fighting the depth cascade. If nested stages don't render as expected, set `--depth` explicitly rather than restructuring DOM.
- Building tab logic from scratch. Use `.tabs` with `aria-selected`.
- Building drawers from scratch. Use `<dialog class="drawer ...">` (modal) or `<div popover class="drawer ...">` (non-modal).
- Reinventing components that already exist. Compose from primitives first.

## Summary card

```
COLOR        --bg [0,1]      --fg [-1,1]       --hue, --hue-shift, --hue-lock
SCALE        --type (local)  --scale (regional)
STAGE        .stage          .stage-0 .. .stage-3 (explicit)  .glass (translucent)
LAYOUT       .row .column .split .spread .lcr .tmb .flank .grid
             .hud-overlay .hud-grid .hero .frame
PAGE LAYOUT  body.page + .pg-banner .pg-header .pg-subheader
                          .pg-navigation-header .pg-navigation .pg-navigation-footer
                          .pg-main-header .pg-main .pg-main-footer
                          .pg-aside .pg-footer  (opt-in; only pg-main required)
HERO PANEL   .hero with .top .bottom .left .right .main
DRAWERS      dialog.drawer.{left|right|top|bottom}     (modal)
             div[popover].drawer.{left|right|top|bottom}  (non-modal)
COMPONENTS   .btn .icon-btn .tag .tabs(.underline) .card .Card
             .input .check .radio .avatar .crumbs .link .progress .kbd .hr
SEMANTIC     .suc .inf .wrn .dgr .bw
RESPONSIVE   .mobile .tablet .desktop  (additive)
THEME        [data-ui-theme] [data-ui-motion] [data-ui-type]
INK BORDER   var(--border)  var(--Border)
SVG COLOR    stroke="currentColor" — paints from --fg
             use --hue-shift or --hue-lock on <g> for variety
```

That's the system. Stop here, start building.
