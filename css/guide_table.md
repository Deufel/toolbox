# Tables — HTML authoring guide

How to write table markup for this system. Like the rest of the system: **you
write semantic HTML; the CSS styles the element.** A `<table>` is the component
— no class, no wrappers. The look is academic / LaTeX `booktabs`: no vertical
rules, no body row lines, just whitespace and two emphatic horizontal rules.

---

## The one rule

A bare `<table>` is already the styled component. Write ordinary table markup —
`<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` — and you get the full treatment:

```html
<table>
  <thead>
    <tr><th>Method</th><th class="num">Top-1</th></tr>
  </thead>
  <tbody>
    <tr><td>Baseline</td><td class="num">76.1</td></tr>
    <tr><td>Ours</td><td class="num">88.7</td></tr>
  </tbody>
</table>
```

No `.table`, no `.data-grid`, no wrapper `<div>`. Use the semantic sections —
`<thead>` and `<tbody>` aren't optional decoration here, they're what the rules
attach to.

---

## What you get

- **A quiet card-style frame** — a `--border` hairline with `--cfg-radius`
  corners around the whole table.
- **One vibrant rule under the header** (`thead`'s bottom edge) — the
  `\midrule`, in `--focus`.
- **One vibrant rule closing the body** (`tbody`'s bottom edge) — the
  `\bottomrule`, in `--focus`.
- **No vertical rules, no inter-row lines.** Rows are separated by rhythm.
- **Tight academic padding** that scales with `--type`.

Restraint is the aesthetic. Don't add row striping or cell borders — the two
rules and the whitespace are the design.

---

## Numeric columns

Numbers should use tabular figures (so digits line up) and sit right-aligned.
Mark the numeric **cells** — both the header and the body cells — with `.num`:

```html
<thead>
  <tr><th>Region</th><th class="num">Q3</th><th class="num">Q4</th></tr>
</thead>
<tbody>
  <tr><td>APAC</td><td class="num">2,011,008</td><td class="num">2,540,773</td></tr>
</tbody>
```

`.num` gives the cell `font-variant-numeric: tabular-nums` and right alignment,
so a column of figures stacks digit-over-digit.

> **Why the cell and not the column?** It would read nicely to mark a whole
> column once (`<col class="num">`), but CSS can't propagate text alignment or
> font-variant from a `<col>` to its cells — a `<col>` can only carry
> background, border, width, and visibility. So alignment must live on the
> cells. Mark every `<th>`/`<td>` in the numeric column.

---

## Caption

An optional `<caption>` renders as a small, quiet figure-label above the table:

```html
<table>
  <caption>Top-1 accuracy (%) on the held-out test split.</caption>
  …
</table>
```

---

## Tuning at the call site

Everything visual is a value, not a class:

| knob        | what it does                          | example                              |
|-------------|---------------------------------------|--------------------------------------|
| `--type`    | size the whole table (and its padding)| `<table style="--type: -1">`         |
| `--hue`     | recolour the rules / ink              | `<table style="--hue: 262">`         |
| `--bg`      | place the table's surface in the depth stack | `<table style="--bg: 0.1">`   |
| `.num`      | tabular + right-aligned numeric cell  | `<td class="num">3.14</td>`          |

A narrower table is just a width on the call site:
`<table style="max-inline-size: 24rem">`.

---

## Don'ts

- ❌ a `.table` / `.data-grid` class — the bare `<table>` is the component
- ❌ a wrapper `<div>` around the table — style the element
- ❌ vertical rules or per-row borders — the design is rule-less by intent
- ❌ row striping (`:nth-child` zebra) — whitespace separates rows
- ❌ `.num` on a `<col>` to align — it can't; mark the cells
- ❌ skipping `<thead>` / `<tbody>` — the two rules attach to those sections
