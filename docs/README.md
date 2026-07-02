# system.css — living documentation

An interactive, self-documenting design system: an OKLCH color engine, a
type-driven spacing scale, a layered architecture, and a full component set —
all in one small stylesheet (`system.css`). This folder is the docs site, built
with the system itself.

## ⚠️ Read this first — it must be the WHOLE folder

This is **not a single file.** `index.html` is just the shell; it loads the
`section-*` / `demo-*` documents and `support.js` / `system.css` /
`highlight.js` next to it at runtime. If you copy only `index.html` (the way a
one-file page works), the main panel will be **blank** because those fetches
404. **Commit every file in this folder, together, in the same directory.**

## What's here

| File | Role |
|------|------|
| `index.html` | The docs shell — header controls + nav; swaps sections in |
| `system.css` | **The design system** (the thing you'd ship in your app) |
| `highlight.js` | Syntax highlighting for the code blocks |
| `support.js` | Runtime for the `.dc.html` documents |
| `section-*.dc.html` | The doc sections (type, color, layers, layout, components, demos) |
| `demo-*.dc.html` | Standalone full-page demos (dashboard, calendar, marketing) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is (no Jekyll processing) |

100% static — no build step, no dependencies (fonts load from Google Fonts).

## Host on GitHub Pages — from a `docs/` folder

Since you keep your site under `docs/`, put **all** of these files inside
`docs/` (so you have `docs/index.html`, `docs/system.css`,
`docs/section-color.dc.html`, … all siblings):

1. Copy the entire contents of this folder into `docs/` in your repo.
2. Commit and push to `main`.
3. Repo → **Settings → Pages**.
4. **Source: Deploy from a branch**, **Branch: `main` / `docs`**, then **Save**.
5. Wait ~1 minute → visit `https://<you>.github.io/<repo>/`.

The `.nojekyll` file is included so Pages serves every file verbatim.

### Why "just index.html" didn't work

A normal single-page site is one self-contained file, so dropping `index.html`
into `docs/` is enough. This site is a shell **plus** its section documents and
assets, fetched at runtime — so `docs/` needs the shell *and* its siblings. Same
folder, all files. (It also must be served over http(s), which Pages does; note
that opening `index.html` straight off your disk with `file://` will also show a
blank panel, because browsers block `fetch` there. Use the Pages URL, or run
`python3 -m http.server` in the folder locally.)

## Using the system in your own app

Link the one stylesheet and set two optional switches on `<html>`:

```html
<link rel="stylesheet" href="system.css">
<html data-ui-theme="dark" data-ui-size="md" data-ui-motion="on">
```

Then write plain, mostly class-free HTML — bare `<button>`, `<table>`,
`<details>`, a `<label>` inside a `<form>`, etc. are already components. See the
**Components** and **Layout** sections of the docs for the full API.

### Bonus: view transitions

`system.css` ships motion helpers over the View Transitions API (see the bottom
of the file). Set `data-vt` on `<html>` to `"fade"` / `"slide-left"` /
`"slide-right"` / `"scale"` right before calling
`document.startViewTransition(update)`, and the swap animates in that direction.
Duration rides `--cfg-motion`, so `data-ui-motion` (off/on/debug) and
`prefers-reduced-motion` govern it automatically. The docs shell uses this for
section switches (slide) and theme/skin flips (fade). For zero-JS transitions
between separate pages, add `@view-transition { navigation: auto; }`.
