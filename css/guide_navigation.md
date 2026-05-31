# Navigation — HTML authoring guide

How to write navigation markup for this system. Like everywhere else: **you
write semantic HTML; the CSS does the rest.** This guide currently covers the
breadcrumb trail (`.crumbs`).

---

## Breadcrumbs — `.crumbs`

A breadcrumb trail shows the path to the current page: a row of links ending in
the page you're on. It follows the W3C ARIA Authoring Practices breadcrumb
pattern — a labelled `<nav>` landmark, links, and the current page marked with
`aria-current="page"`.

### The one rule

Wrap the trail in `<nav class="crumbs" aria-label="Breadcrumb">`. Inside, write
`<a>` links for the ancestors and a `<span aria-current="page">` for the current
page:

```html
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
  <span aria-current="page">Calendar</span>
</nav>
```

That's the whole component. Three things make it correct:

- **`<nav>`** makes it a navigation landmark — easy to jump to with assistive
  tech.
- **`aria-label="Breadcrumb"`** names that landmark, so it's distinguishable
  from the page's other `<nav>`s (primary nav, footer, …). This is the
  ARIA-recommended label and the wording assistive tech expects.
- **`aria-current="page"`** on the final crumb marks where you are. It's a
  `<span>`, not a link — you don't link to the page you're on.

Don't put the separators in the markup — they're generated (see below).

### What you get

- **Coloured links** — each `<a>` reads as a normal link (chromatic underlined
  ink), and on hover brightens and shifts hue, the same feedback every link in
  the system gets.
- **An emphasized current page** — the `aria-current` crumb is neutral, bold,
  and not interactive.
- **Generated separators** — a quiet chevron between crumbs, drawn with CSS, so
  it never appears in the markup and is never announced by screen readers.
- **Wrapping** — a long trail wraps to the next line rather than overflowing.

### Separators are silent by design

The separator is a masked SVG chevron painted with `--border` (the system's
quiet-line token). It has **no text content**, which matters for two reasons:

1. A text separator (CSS `content: "/"`) gets announced by some screen readers
   ("slash") and can even take focus. A masked shape is purely decorative and
   silent — the accessibility best practice.
2. The crumb links are underlined, and an ancestor's underline is painted
   *through* its descendants — a text separator inside a link can't shed that
   underline. A masked box has no text to underline, so it stays clean.

### Icons in a crumb

A crumb may carry an inline `<svg>` — alongside its label, or on its own. The
icon sizes to the text (`1em`) and inherits the crumb's ink (via
`currentColor`), so it colours and hovers exactly like the label:

```html
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/" aria-label="Home"><svg>…</svg></a>          <!-- icon-only -->
  <a href="/dashboard"><svg>…</svg> Dashboard</a>          <!-- icon + text -->
  <span aria-current="page"><svg>…</svg> Calendar</span>
</nav>
```

For an icon-only crumb, give the `<a>` an `aria-label` so it still has an
accessible name.

### Tuning at the call site

Everything visual is a value, not a class:

| knob          | what it does                                   | example                                                       |
|---------------|------------------------------------------------|---------------------------------------------------------------|
| `--type`      | size the **whole** trail — text, gaps, chevrons scale together | `<nav class="crumbs" style="--type: 0">`      |
| `--hue`       | recolour the links (and their hover shift)     | `<nav class="crumbs" style="--hue: 145">`                     |
| `--crumb-sep` | swap the separator glyph (takes a mask URL)    | `<nav class="crumbs" style="--crumb-sep: url('…')">`          |

`--type` is the one to know: the component is built so the wrapper's type step
flows to every crumb and the separator, so a single `--type` on the `<nav>`
rescales the entire trail proportionally.

### Don'ts

- ❌ separators in the markup (`<span>/</span>`, ` / ` text) — they're generated
- ❌ a link for the current page — use `<span aria-current="page">`
- ❌ dropping `aria-label="Breadcrumb"` — the landmark needs its name
- ❌ a `--crumb-sep` character (e.g. `'›'`) — the separator is a masked image
  now, so the override takes a `url(...)` mask, not a glyph
- ❌ an icon-only crumb with no `aria-label` — it'd have no accessible name
