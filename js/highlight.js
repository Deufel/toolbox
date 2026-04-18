/**
 * highlight.js
 * Minimal, opt-in syntax highlighting via the CSS Custom Highlight API.
 * No dependencies, no DOM mutation, no wrapping <span>s.
 *
 * Usage — opt-in per block via a language class or data attribute:
 *   <pre class="css"><code>a { color: red; }</code></pre>
 *   <pre class="html"><code>&lt;div&gt;...&lt;/div&gt;</code></pre>
 *   <pre data-highlight="css">...</pre>
 *
 * Register additional languages:
 *   import { register, highlightAll } from './highlight.js';
 *   register('json', [
 *     ['json-key',    /"[^"]*"(?=\s*:)/g],
 *     ['json-string', /"[^"]*"/g],
 *     ['json-number', /-?\b\d+(\.\d+)?\b/g],
 *   ]);
 *   highlightAll();
 *
 * Style via the ::highlight() pseudo-element:
 *   ::highlight(css-property) { color: teal; }
 *   ::highlight(html-tag)     { color: crimson; }
 */

// ─── Token definitions ───────────────────────────────────────────────────
// ORDER MATTERS: most specific first. Earlier tokens claim ranges; later
// tokens that overlap are skipped. This mirrors how every mature
// highlighter (TextMate, Prism, Shiki) resolves overlap.

const CSS = [
  ['css-comment',   /\/\*[\s\S]*?\*\//g],
  ['css-string',    /"[^"]*"|'[^']*'/g],
  ['css-atrule',    /@[\w-]+/g],
  ['css-var-name',  /--[\w-]+/g],
  ['css-unit',      /\b\d*\.?\d+(?:px|rem|em|%|vw|vh|svh|svw|dvh|dvw|ch|ex|fr|deg|rad|turn|ms|s)\b/g],
  ['css-number',    /\b\d*\.?\d+\b/g],
  ['css-property',  /(?:^|(?<=[{;])\s*)[\w-]+(?=\s*:)/gm],
  ['css-selector',  /^[ \t]*([^{};@/][^{};]*?)(?=\s*\{)/gm],
  ['css-punctuation', /[{}();]/g],
];

const HTML = [
  ['html-comment',   /<!--[\s\S]*?-->/g],
  ['html-doctype',   /<!DOCTYPE[^>]*>/gi],
  ['html-entity',    /&[#\w]+;/g],
  ['html-value',     /(?<==\s*)"[^"]*"|(?<==\s*)'[^']*'/g],
  ['html-tag',       /(?<=<\/?)[\w-]+/g],
  ['html-attribute', /\b[\w-]+(?=\s*=|\s*\/?>)/g],
  ['html-bracket',   /<\/?|\/?>/g],
];

// ─── Registry ────────────────────────────────────────────────────────────

const languages = new Map([
  ['css',  CSS],
  ['html', HTML],
]);

/** Register a new language. Tokens must be in most-specific-first order. */
export function register(name, tokens) {
  languages.set(name, tokens);
}

/** Return all token names ever registered — used to clear previous highlights. */
function allTokenNames() {
  const names = new Set();
  for (const tokens of languages.values())
    for (const [name] of tokens) names.add(name);
  return names;
}

// ─── Language detection ──────────────────────────────────────────────────

function detectLang(el) {
  const explicit = el.dataset.highlight;
  if (explicit && languages.has(explicit)) return explicit;
  for (const name of languages.keys())
    if (el.classList.contains(name)) return name;
  return null;  // no match → do not highlight (explicit opt-in)
}

// ─── Overlap tracking ────────────────────────────────────────────────────
// A token claim is [start, end). We track claimed intervals per block and
// skip any new match that overlaps an existing claim.

function overlapsAny(claims, start, end) {
  for (const [s, e] of claims) if (start < e && end > s) return true;
  return false;
}

// ─── Main pass ───────────────────────────────────────────────────────────

/**
 * Scan `root` for elements opted into highlighting and apply highlights.
 * Safe to call repeatedly; previous highlights are cleared first.
 */
export function highlightAll(root = document) {
  if (!window.CSS?.highlights || typeof Highlight === 'undefined') return;

  // Clear any existing highlights we previously registered.
  for (const name of allTokenNames()) window.CSS.highlights.delete(name);

  // Group opted-in blocks by language.
  const byLang = new Map();
  for (const el of root.querySelectorAll('pre, [data-highlight]')) {
    const lang = detectLang(el);
    if (!lang) continue;
    const code = el.querySelector('code') ?? el;
    const node = code.firstChild;
    if (node?.nodeType !== Node.TEXT_NODE) continue;
    if (!byLang.has(lang)) byLang.set(lang, []);
    byLang.get(lang).push({ src: node.textContent, textNode: node, claims: [] });
  }

  // Process each language's token set in specificity order.
  for (const [lang, blocks] of byLang) {
    const tokens = languages.get(lang);
    for (const [name, pattern] of tokens) {
      const highlight = new Highlight();
      for (const block of blocks) {
        // Fresh regex to avoid state leakage between blocks.
        const re = new RegExp(pattern.source, pattern.flags);
        for (const match of block.src.matchAll(re)) {
          const start = match.index;
          const end   = start + match[0].length;
          if (overlapsAny(block.claims, start, end)) continue;
          const range = new Range();
          range.setStart(block.textNode, start);
          range.setEnd(block.textNode, end);
          highlight.add(range);
          block.claims.push([start, end]);
        }
      }
      if (highlight.size > 0) window.CSS.highlights.set(name, highlight);
    }
  }
}

// ─── Auto-run on load ────────────────────────────────────────────────────
// Module scripts are deferred, so the DOM is typically ready by the time
// this executes. Fall back to DOMContentLoaded just in case.

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => highlightAll());
} else {
  highlightAll();
}
