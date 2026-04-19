/**
 * highlight.js
 * Minimal, opt-in syntax highlighting via the CSS Custom Highlight API.
 * Unified pattern: <pre><code class="language">...</code></pre>
 */

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

const PY_KEYWORDS =
  'False|None|True|and|as|assert|async|await|break|class|continue|def|del|'
  + 'elif|else|except|finally|for|from|global|if|import|in|is|lambda|'
  + 'nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case';

const PY_BUILTINS =
  'abs|all|any|ascii|bin|bool|bytearray|bytes|callable|chr|classmethod|'
  + 'compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|'
  + 'float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|'
  + 'int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|'
  + 'next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|'
  + 'set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip|'
  + 'self|cls';

const PYTHON = [
  ['python-string',    /(?:[fFrRbB]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?''')/g],
  ['python-string',    /(?:[fFrRbB]{1,2})?(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/g],
  ['python-comment',   /#[^\n]*/g],
  ['python-decorator', /@[\w.]+/g],
  ['python-function',  /(?<=\bdef\s+)[a-zA-Z_]\w*/g],
  ['python-class',     /(?<=\bclass\s+)[a-zA-Z_]\w*/g],
  ['python-keyword',   new RegExp(`\\b(?:${PY_KEYWORDS})\\b`, 'g')],
  ['python-builtin',   new RegExp(`\\b(?:${PY_BUILTINS})\\b`, 'g')],
  ['python-number',    /\b(?:0[xX][\da-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)\b/g],
  ['python-operator',  /->|:=|==|!=|<=|>=|\*\*|\/\/|<<|>>|[+\-*\/%@<>=&|^~]/g],
  ['python-punctuation', /[{}()[\],;]/g],
];

const languages = new Map([
  ['css',    CSS],
  ['html',   HTML],
  ['python', PYTHON],
]);

export function register(name, tokens) {
  languages.set(name, tokens);
}

function allTokenNames() {
  const names = new Set();
  for (const tokens of languages.values())
    for (const [name] of tokens) names.add(name);
  return names;
}

function detectLang(codeEl) {
  for (const name of languages.keys())
    if (codeEl.classList.contains(name)) return name;
  return null;
}

function overlapsAny(claims, start, end) {
  for (const [s, e] of claims) if (start < e && end > s) return true;
  return false;
}

export function highlightAll(root = document) {
  if (!window.CSS?.highlights || typeof Highlight === 'undefined') return;

  for (const name of allTokenNames()) window.CSS.highlights.delete(name);

  const byLang = new Map();
  
  // Unified pattern: <pre><code class="language">
  for (const code of root.querySelectorAll('pre > code')) {
    const lang = detectLang(code);
    if (!lang) continue;
    
    const node = code.firstChild;
    if (node?.nodeType !== Node.TEXT_NODE) continue;
    
    if (!byLang.has(lang)) byLang.set(lang, []);
    byLang.get(lang).push({ 
      src: node.textContent, 
      textNode: node, 
      claims: [] 
    });
  }

  for (const [lang, blocks] of byLang) {
    const tokens = languages.get(lang);
    for (const [name, pattern] of tokens) {
      const highlight = new Highlight();
      for (const block of blocks) {
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => highlightAll());
} else {
  highlightAll();
}
