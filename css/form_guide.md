# Forms — HTML authoring guide

How to write form markup for this system. The rule that explains everything
below: **you write semantic HTML; the CSS reads its structure.** No component
classes, no wrapper `<div>`s, no `appearance` hacks. If you find yourself
reaching for a class on a control, stop — the element almost certainly already
works.

---

## The one rule

A `<label>` inside a `<form>` **is** a field. The system detects the shape from
what the label wraps:

- wraps a text `<input>` / `<select>` / `<textarea>` → **stacked field**
  (label above, control below)
- wraps a checkbox / radio `<input>` → **inline field** (control beside label)

You never declare which; the markup decides.

---

## The field

```html
<form>
  <label>
    <span>Email address</span>
    <small>We'll never share it.</small>
    <input type="email" placeholder="you@example.com">
  </label>
</form>
```

Three children, always in this order:

| child       | role                                                    |
|-------------|---------------------------------------------------------|
| `<span>`    | the label text (neutral ink)                            |
| `<small>`   | feedback / helper text — **always include it, even empty** |
| control     | `<input>`, `<select>`, or `<textarea>`                  |

**Always include the `<small>`, even when there's no message** (`<small></small>`).
It holds a fixed line whether full or empty, so showing or hiding feedback never
shifts the layout. Leaving it out means text appearing later will push the
control down.

The `<form>` itself becomes a recessed panel and the controls inside sit raised
against it — so inside a form, inputs are borderless by design. Outside a form,
the same input keeps a border (it has no panel to sit against). You don't style
either; just use `<form>`.

### Stacking fields

Fields are block-level and stack on their own. For consistent gaps, wrap them in
a `.column`:

```html
<form class="column">
  <label>…</label>
  <label>…</label>
</form>
```

---

## Validation & state

State is driven by **real attributes**, never by adding classes to fake a look.

### Required

Put `required` on the control. The label gets a danger-hued asterisk
automatically:

```html
<label>
  <span>Password</span>
  <small></small>
  <input type="password" required>
</label>
```

### Invalid (error)

Set `aria-invalid="true"` on the control — this is the one real, announced
validation state, so it's the one we hook. The feedback text and the control's
edge both go danger-red:

```html
<input type="email" aria-invalid="true">
<!-- with: <small>That email is already taken.</small> -->
```

Toggle it from your validation script: `el.setAttribute('aria-invalid','true')`
on failure, `el.removeAttribute('aria-invalid')` when fixed. Update the
`<small>` text alongside it. (Note: `aria-invalid="false"` reads as *absent* to
screen readers — don't use it to mean "valid.")

### Semantic colour (success / info / warning / danger)

A "valid/green" cue has no ARIA backing, so it's just a visual helper — add one
of these classes to the **label**. The hue flows to the feedback and the
control's edge:

| class  | meaning  |
|--------|----------|
| `.suc` | success  |
| `.inf` | info     |
| `.wrn` | warning  |
| `.dgr` | danger   |

```html
<label class="suc">
  <span>Username</span>
  <small>Looks good — available.</small>
  <input value="ada">
</label>
```

Feedback text is neutral at rest and only takes colour when a semantic class or
`aria-invalid` is present.

### Disabled

Use the native `disabled` attribute. Ink drains toward the surface
automatically.

---

## Controls

### Text inputs & textarea

Bare elements. No class.

```html
<input type="email" placeholder="you@example.com">
<input type="search" placeholder="Search…">
<textarea rows="3" placeholder="Tell us about yourself…"></textarea>
```

### Select

A plain `<select>` with plain `<option>`s. **Do not** add a
`<button><selectedcontent>` — the browser renders the selected value itself.
Options may contain an SVG icon plus text:

```html
<select>
  <option value="">Choose a fruit…</option>
  <option value="apple">
    <svg viewBox="0 0 24 24" width="16" height="16" …>…</svg>Apple
  </option>
  <option value="banana">Banana</option>
</select>
```

The styled dropdown is progressive: browsers without customizable-select fall
back to the native picker, which still works.

### Datalist (autocomplete)

Native text-with-suggestions. The input is themed; the suggestion popup is
OS-rendered (not stylable — that's expected):

```html
<input list="browsers" placeholder="Type a browser…">
<datalist id="browsers">
  <option>Chrome</option><option>Firefox</option><option>Safari</option>
</datalist>
```

### Checkbox & radio

Bare `<input type="checkbox">` / `<input type="radio">`. Wrap each in a `<label>`
with a `<span>` and a `<small>` — it becomes an inline field (control beside the
text) with the same feedback + validation as any other field:

```html
<label>
  <input type="checkbox">
  <span>I accept the terms and conditions</span>
  <small></small>
</label>
```

Validation works identically — set `aria-invalid="true"` on the checkbox to flag
"you must accept":

```html
<label id="terms">
  <input type="checkbox" aria-invalid="true">
  <span>I accept the terms and conditions</span>
  <small>You must accept to continue.</small>
</label>
```

The control is the native checkbox, themed to the page hue (and recoloured by a
semantic class or `aria-invalid`). There is **no switch** — a checkbox is the
clearer control, and on some platforms the native checkbox already renders as a
polished toggle.

---

## Groups & rows

### Field group on one row — `<fieldset>`

Wrap fields in a `<fieldset>` to force them onto a single row. Each field's share
of the row is set with `--row-width` (a ratio — no need to make them sum to
anything). Omit it for an equal split:

```html
<fieldset>
  <label style="--row-width: 2">   <!-- 2/3 of the row -->
    <span>Street address</span><small></small>
    <input placeholder="123 Main St">
  </label>
  <label>                          <!-- 1/3 -->
    <span>Unit</span><small></small>
    <input placeholder="Apt 4">
  </label>
</fieldset>
```

`--row-width: 2` next to a default `1` means "twice as wide." Add a third field
and the row just re-splits.

### Radio group with a label — `<fieldset>` + `<legend>`

Radios group natively by shared `name`. Wrap them in a `<fieldset>` with a
`<legend>` for the group label:

```html
<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" name="plan" checked><span>Free</span><small></small></label>
  <label><input type="radio" name="plan"><span>Pro</span><small></small></label>
  <label><input type="radio" name="plan"><span>Team</span><small></small></label>
</fieldset>
```

---

## Tuning at the call site

Everything visual is a value you set inline, not a class you pick. Common knobs:

| knob          | what it does                          | example                          |
|---------------|---------------------------------------|----------------------------------|
| `--hue`       | recolour a control or region          | `<button style="--hue: 262">`    |
| `--type`      | size step (−2 small … +2 display)     | `<span style="--type: 1">`       |
| `--row-width` | a field's share of a fieldset row     | `<label style="--row-width: 3">` |
| `.suc/.inf/.wrn/.dgr` | lock a semantic hue           | `<label class="dgr">`            |

A "primary" button is not a variant class — it's a hue at the call site:
`<button style="--hue: 262">Confirm</button>`. If you use the same value often,
make a one-line project alias (`.pri { --hue: 262 }`) — but that's *your*
shorthand, not a system component.

---

## Quick reference

```html
<form class="column">

  <!-- text field -->
  <label>
    <span>Label</span>
    <small></small>            <!-- always present -->
    <input type="text">
  </label>

  <!-- required + error -->
  <label>
    <span>Email</span>
    <small>Invalid address.</small>
    <input type="email" required aria-invalid="true">
  </label>

  <!-- select -->
  <label>
    <span>Country</span><small></small>
    <select><option>…</option></select>
  </label>

  <!-- two fields on a row, 2:1 -->
  <fieldset>
    <label style="--row-width: 2"><span>City</span><small></small><input></label>
    <label><span>ZIP</span><small></small><input></label>
  </fieldset>

  <!-- checkbox with validation -->
  <label>
    <input type="checkbox" required>
    <span>I accept the terms</span>
    <small></small>
  </label>

  <!-- radio group -->
  <fieldset>
    <legend>Plan</legend>
    <label><input type="radio" name="p" checked><span>Free</span><small></small></label>
    <label><input type="radio" name="p"><span>Pro</span><small></small></label>
  </fieldset>

</form>
```

### Don'ts

- ❌ a class on a control (`<input class="…">`) — bare elements are styled
- ❌ wrapper `<div>`s around a field — the `<label>` is the field
- ❌ `<button><selectedcontent>` inside a select — let the browser render it
- ❌ a `.field`, `.input`, or `.form-control` class — none exist; use the element
- ❌ omitting an empty `<small>` — you lose the no-shift guarantee
- ❌ a class to fake an error/success — use `aria-invalid` / the `.suc` helper
