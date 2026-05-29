# type.css

A spacing system with no spacing scale. **Type *is* the spacing system.**

The one law: downstream, the only spacing units allowed are `em` and
`lh`. Since `em` resolves against `font-size` and `lh` against
`line-height` — and this file computes both — controlling type
automatically controls space. There's nothing to keep in sync, because
space isn't stored. It's derived.

```html
<link rel="stylesheet" href="type.css">
```

---

## The law

Never write a spacing value in `px` or `rem`. Write it in `em` or `lh`:
(**grey area = border radius**)

```css
.card   { padding: 0.9lh 1.1em; gap: 0.5lh; }
.btn    { padding: 0.55em 1em; }
.column { gap: 0.5lh; }
```

Now every one of those reflows automatically when the type scale changes —
no media queries, no spacing tokens, no second system.

---

## Three tiers

There are three ways to affect size, and they're orthogonal — they
compose by doing different jobs:

| Tier | Knob | Scope | Job |
|------|------|-------|-----|
| **Local** | `--type` | one element (non-inheriting) | this element's *role* on the scale |
| **Regional** | `--scale` | a subtree (inheriting) | a *uniform zoom* of a region |
| **Config** | `data-ui-size` | a subtree (inheriting) | the scale's *shape* (base + ratio) |

```html
<html data-ui-size="md">                 <!-- the scale's shape -->
  <section style="--scale: 0.875">        <!-- zoom this region down -->
    <h2 style="--type: 3">Heading</h2>     <!-- this element is display-size -->
    <p>Body.</p>                           <!-- default --type: 0 -->
    <small style="--type: -1">Fine print</small>
  </section>
</html>
```

### `--type` — local role

An integer step on a geometric scale: `-2` small, `0` body, `+2`/`+3`
display. **It does not inherit** — and that's deliberate. A heading at
`--type: 3` should be big *itself*, not drag its children up with it (the
same reason bumping a font size in a word processor doesn't resize the
rest of the document). A display heading can contain a `-1` caption and
the caption is genuinely small.

### `--scale` — regional zoom

A multiplier on the whole computed result. **It inherits**, so setting it
on a container rescales that entire subtree — type *and* all the `em`/`lh`
spacing — proportionally. This is "shrink this panel to 87.5%": one
declaration, the region follows.

### `data-ui-size` — the scale's shape

Re-points the four foundations (base sizes + ratios). This is **not** a
uniform zoom — it changes base size *and* step contrast. A bigger ratio
means the gap between body and heading grows, so `lg` reads as punchy and
editorial while `sm` reads as dense and compact — different typographic
*character*, not just a smaller copy. Because spacing derives from type,
the whole layout's density shifts with it.

```css
[data-ui-size="sm"] { /* tight base, gentle ratio  → dense   */ }
[data-ui-size="md"] { /* the defaults               → no-op   */ }
[data-ui-size="lg"] { /* large base, punchy ratio   → spacious */ }
```

It inherits, so it works on `<html>` for page config **or on any region**
— even nested. A dense `sm` sidebar can live inside a spacious `lg` page;
the nearest setter wins.

> **size ≠ scale.** `--scale` zooms uniformly (the body-to-heading ratio
> is unchanged). `data-ui-size` changes the ratio too. Same overall size,
> different feel. That's why size re-points the foundations instead of
> multiplying `--scale`.

---

## The formula

Per element:

1. The body size at each viewport endpoint is `base × ratio^type` —
   `--type` exponentiates the ratio, so the scale is geometric.
2. Those two endpoints are fluidly interpolated by viewport width
   (`100vi` between the fluid bounds) and clamped.
3. The regional `--scale` multiplies the result.

`letter-spacing` and `line-height` also track `--type`: bigger type gets
tighter tracking and tighter leading; small type gets the opposite —
correct typographic behavior, not just a scaled number.

The result is captured into `--_font-size` before being assigned, so an
input can honor the iOS 16px auto-zoom floor without throwing the formula
away:

```css
input { font-size: max(16px, var(--_font-size)); }
```

---

## Configuration

The scale's shape lives in four tokens (and two viewport bounds):

| Token | Meaning |
|-------|---------|
| `--cfg-type-min` / `--cfg-type-max` | body size at narrow / wide viewport |
| `--cfg-type-min-ratio` / `--cfg-type-max-ratio` | step ratio at each endpoint |
| `--cfg-fluid-min-vp` / `--cfg-fluid-max-vp` | viewport bounds for the fluid blend |

`md` in `[data-ui-size]` mirrors the `:root` defaults, so it's a no-op —
edit either to retune.

---

## A note on registration

`--type` is a registered `@property` because it **must be non-inheriting**
— locality is its whole purpose. `--scale` and the viewport bounds are
registered too (clean revert, transitionable, computationally
independent).

The four `--cfg-type-*` foundations are **deliberately not registered.** A
registered property's `initial-value` must be computationally independent,
and the min/max are `rem`-valued (device-dependent) — so registering them
would be invalid. They stay plain inheriting `:root` values, which is all
the formula needs.

---

## One line to remember

> Pick a role with `--type`, zoom a region with `--scale`, set the shape
> with `data-ui-size` — and never write a spacing value that isn't `em`
> or `lh`. Space takes care of itself.
