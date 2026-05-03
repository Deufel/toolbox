// v1.2 🎨 highlight.js — Custom Highlight API syntax highlighting
// Pattern: <pre><code class="language">…</code></pre>
// Languages registered: css, html, python, js
// By: Michael Deufel 

const CSS_LANG = [
  ['css-comment',     /\/\*[\s\S]*?\*\//g],
  ['css-string',      /"[^"]*"|'[^']*'/g],
  ['css-atrule',      /@[\w-]+/g],
  ['css-var-name',    /--[\w-]+/g],
  ['css-unit',        /\b\d*\.?\d+(?:px|rem|em|%|vw|vh|svh|svw|dvh|dvw|ch|ex|fr|deg|rad|turn|ms|s)\b/g],
  ['css-number',      /\b\d*\.?\d+\b/g],
  ['css-property',    /(?:^|(?<=[{;])\s*)[\w-]+(?=\s*:)/gm],
  ['css-selector',    /^[ \t]*([^{};@/][^{};]*?)(?=\s*\{)/gm],
  ['css-punctuation', /[{}();]/g],
];

const HTML_LANG = [
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

const PYTHON_LANG = [
  ['python-string',     /(?:[fFrRbB]{1,2})?(?:"""[\s\S]*?"""|'''[\s\S]*?''')/g],
  ['python-string',     /(?:[fFrRbB]{1,2})?(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/g],
  ['python-comment',    /#[^\n]*/g],
  ['python-decorator',  /@[\w.]+/g],
  ['python-function',   /(?<=\bdef\s+)[a-zA-Z_]\w*/g],
  ['python-class',      /(?<=\bclass\s+)[a-zA-Z_]\w*/g],
  ['python-keyword',    new RegExp(`\\b(?:${PY_KEYWORDS})\\b`, 'g')],
  ['python-builtin',    new RegExp(`\\b(?:${PY_BUILTINS})\\b`, 'g')],
  ['python-number',     /\b(?:0[xX][\da-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)\b/g],
  ['python-operator',   /->|:=|==|!=|<=|>=|\*\*|\/\/|<<|>>|[+\-*\/%@<>=&|^~]/g],
  ['python-punctuation', /[{}()[\],;]/g],
];

const JS_KEYWORDS =
  'as|async|await|break|case|catch|class|const|continue|debugger|default|'
  + 'delete|do|else|export|extends|finally|for|from|function|if|import|in|'
  + 'instanceof|let|new|of|return|static|super|switch|this|throw|try|'
  + 'typeof|var|void|while|with|yield';

const JS_BUILTINS =
  'true|false|null|undefined|NaN|Infinity|globalThis|'
  + 'Array|Boolean|Date|Error|JSON|Map|Math|Number|Object|Promise|RegExp|'
  + 'Set|String|Symbol|WeakMap|WeakSet|'
  + 'Function|Reflect|Proxy|Intl|'
  + 'console|document|window|self';

const JAVASCRIPT_LANG = [
  ['javascript-string',     /`(?:\\.|[^`\\])*`/g],
  ['javascript-string',     /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g],
  ['javascript-comment',    /\/\/[^\n]*|\/\*[\s\S]*?\*\//g],
  ['javascript-decorator',  /@[\w.]+/g],
  ['javascript-function',   /(?<=\bfunction\s+)[a-zA-Z_$][\w$]*/g],
  ['javascript-class',      /(?<=\bclass\s+)[a-zA-Z_$][\w$]*/g],
  ['javascript-keyword',    new RegExp(`\\b(?:${JS_KEYWORDS})\\b`, 'g')],
  ['javascript-builtin',    new RegExp(`\\b(?:${JS_BUILTINS})\\b`, 'g')],
  ['javascript-number',     /\b(?:0[xX][\da-fA-F_]+n?|0[oO][0-7_]+n?|0[bB][01_]+n?|\d[\d_]*n?(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)\b/g],
  ['javascript-operator',   /=>|\?\.|\?\?|===|!==|<=|>=|\*\*|<<|>>>|>>|&&|\|\||\.\.\.|[+\-*\/%<>=&|^~!?]/g],
  ['javascript-punctuation', /[{}()[\],;:]/g],
];

const languages = new Map([
  ['css',        CSS_LANG],
  ['html',       HTML_LANG],
  ['python',     PYTHON_LANG],
  ['javascript', JAVASCRIPT_LANG],
]);

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

function highlightAll(root = document) {
  if (!window.CSS?.highlights || typeof Highlight === 'undefined') return;

  for (const name of allTokenNames()) window.CSS.highlights.delete(name);

  const byLang = new Map();
  for (const code of root.querySelectorAll('pre > code')) {
    const lang = detectLang(code);
    if (!lang) continue;
    const node = code.firstChild;
    if (node?.nodeType !== Node.TEXT_NODE) continue;
    if (!byLang.has(lang)) byLang.set(lang, []);
    byLang.get(lang).push({ src: node.textContent, textNode: node, claims: [] });
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
