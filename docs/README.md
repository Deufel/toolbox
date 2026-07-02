# system.css — living documentation

An interactive, self-documenting design system: an OKLCH color engine, a
type-driven spacing scale, a layered architecture, and a full component set —
all in one small stylesheet (`system.css`). This folder is the docs site, built
with the system itself.

## What's here

| File | Role |
|------|------|
| `index.html` | The docs shell — header controls + nav; swaps sections in |
| `system.css` | **The design system** (the thing you'd ship in your app) |
| `highlight.js` | Syntax highlighting for the code blocks (Custom Highlight API) |
| `support.js` | Runtime for the `.dc.html` documents |
| `section-*.dc.html` | The doc sections (type, color, layers, layout, components, demos) |
| `demo-*.dc.html` | Standalone full-page demos (dashboard, calendar, marketing) |

It's **100% static** — no build step, no dependencies (fonts load from Google
Fonts over CDN).

## Host it on GitHub Pages

1. Create a new repository and add these files at its root.
2. Push to the `main` branch.
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source: Deploy from a branch**, then
   **Branch: `main` / `(root)`** and **Save**.
5. Wait ~1 minute, then visit `https://<you>.github.io/<repo>/`.

That's it — `index.html` is the entry point.

> **Note:** the docs load their sections with `fetch()`, so they must be served
> over **http(s)** (GitHub Pages, or a local server like `python3 -m http.server`).
> Opening `index.html` directly from the file system (`file://`) will show a
> blank main panel because browsers block `fetch` there.

## Using the system in your own app

Link the one stylesheet and set two optional switches on `<html>`:

```html
<link rel="stylesheet" href="system.css">
<html data-ui-theme="dark" data-ui-size="md">
```

Then write plain, mostly class-free HTML — bare `<button>`, `<table>`,
`<details>`, a `<label>` inside a `<form>`, etc. are already components. See the
**Components** and **Layout** sections of the docs for the full API.
