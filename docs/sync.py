#!/usr/bin/env python3
"""
sync.py — sync chrome elements across all docs pages from templates.

Standard library only. Edit the SECTIONS list below.

How it works
------------
1. HEAD SYNC (optional): if templates/head.html exists, the entire
   <head> of every page is replaced with its content. The token
   {{TITLE}} in the template is substituted with the page's first
   <h1> inside <main class="pg-main">.

2. For each section in SECTIONS, look for templates/<section>.html:
     - If present: install mode (clean + insert from template).
     - If absent:  clean-only mode (remove from pages, don't reinstall).
   This is how you retire a section: keep it in SECTIONS for one
   sync run with the template deleted, then remove it from SECTIONS.

3. For each page (every index.html under docs/, excluding templates/):
   a. CLEANUP PASS — scan with html.parser. For every element whose
      class includes a managed section, record its byte range. Delete
      those ranges. Works at ANY depth: a misplaced element nested
      inside another gets found and removed regardless of where it sits.
   b. PLACEMENT PASS — insert one fresh copy of each section's template
      (install mode only) just before </body>, in SECTIONS order.

PROTECTED is a safelist of classes the script refuses to touch even
if listed (notably pg-main, the per-page content slot).
"""

import sys
from pathlib import Path
from html.parser import HTMLParser


# ── EDIT THIS LIST ──────────────────────────────────────────────────
# Each entry is a class name. The script:
#   - installs the template (templates/<name>.html) if it exists,
#   - cleans up elements of that class regardless (so removing a
#     template AND keeping the entry here = retire the section).
#
# After a successful migration, remove retired entries from this list.
SECTIONS = [
    'pg-header',
    'pg-navigation',
    'pg-footer',
    # retired (no template — clean-only). Remove after one sync run:
    'hud',
    'drawer',
    'chrome-init',
]

PROTECTED = {'pg-main'}

# Void elements have no closing tag in HTML5.
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'source', 'track', 'wbr'}


class _Locator(HTMLParser):
    """
    Single-pass parser. Records byte ranges of elements whose class
    matches a managed section, AT ANY DEPTH. Also records the offset
    of </body> for insertion.
    """

    def __init__(self, managed_classes):
        super().__init__(convert_charrefs=False)
        self.managed = managed_classes
        self.matches = []        # list of (start, end) byte ranges
        self.body_end = None
        self._stack = []         # (tag, start_offset, is_managed)
        self._source = ''
        self._line_offsets = [0]

    def feed(self, data):
        self._source = data
        self._line_offsets = [0]
        for i, ch in enumerate(data):
            if ch == '\n':
                self._line_offsets.append(i + 1)
        super().feed(data)

    def _offset(self):
        line, col = self.getpos()
        return self._line_offsets[line - 1] + col

    def _is_managed(self, attrs):
        for k, v in attrs:
            if k == 'class' and v:
                for c in v.split():
                    if c in self.managed:
                        return True
        return False

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            if self._is_managed(attrs):
                start = self._offset()
                end = self._source.find('>', start) + 1
                self.matches.append((start, end))
            return
        start = self._offset()
        managed = self._is_managed(attrs)
        self._stack.append((tag, start, managed))

    def handle_startendtag(self, tag, attrs):
        if self._is_managed(attrs):
            start = self._offset()
            end = self._source.find('>', start) + 1
            self.matches.append((start, end))

    def handle_endtag(self, tag):
        if tag == 'body':
            self.body_end = self._offset()
            return
        # Pop the matching opening from the stack.
        for i in range(len(self._stack) - 1, -1, -1):
            if self._stack[i][0] == tag:
                _, start, managed = self._stack.pop(i)
                if managed:
                    end = self._source.find('>', self._offset()) + 1
                    self.matches.append((start, end))
                break


def find_managed_ranges(html_text, managed):
    """Return (sorted ranges to delete, body_end offset)."""
    p = _Locator(managed)
    p.feed(html_text)
    if p.body_end is None:
        raise ValueError("no </body> found")
    return sorted(p.matches), p.body_end


def delete_ranges(text, ranges):
    """
    Delete byte ranges from text. Handles overlapping ranges (an
    outer match that contains an inner one) by coalescing. Also eats
    the indent before each deleted range and the trailing newline so
    we don't leave blank lines behind.
    """
    if not ranges:
        return text

    # Coalesce overlapping/contained ranges.
    coalesced = [ranges[0]]
    for start, end in ranges[1:]:
        last_start, last_end = coalesced[-1]
        if start < last_end:
            coalesced[-1] = (last_start, max(last_end, end))
        else:
            coalesced.append((start, end))

    # Delete from end backward so earlier offsets stay valid.
    for start, end in reversed(coalesced):
        leading = start
        while leading > 0 and text[leading - 1] in ' \t':
            leading -= 1
        trailing = end
        if trailing < len(text) and text[trailing] == '\n':
            trailing += 1
        text = text[:leading] + text[trailing:]

    return text


def validate_template(path, expected_class):
    """
    Parse the template, verify its first element's class includes the
    expected class. Returns the raw template text (trimmed).
    """
    raw = path.read_text(encoding='utf-8').strip()

    class _Validator(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.first_tag = None
            self.first_classes = []
        def handle_starttag(self, tag, attrs):
            if self.first_tag is None:
                self.first_tag = tag
                for k, v in attrs:
                    if k == 'class':
                        self.first_classes = (v or '').split()
        def handle_startendtag(self, tag, attrs):
            self.handle_starttag(tag, attrs)

    v = _Validator()
    v.feed(raw)
    if v.first_tag is None:
        raise ValueError(f"{path}: no element found")
    if expected_class not in v.first_classes:
        raise ValueError(
            f"{path}: root <{v.first_tag}> classes "
            f"{v.first_classes!r} don't include {expected_class!r}")
    return raw


def extract_h1_text(html_text):
    """
    Find the first <h1> inside <main class="pg-main">. Return its text
    content (stripped). Returns None if not found.
    """
    class _H1Finder(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.in_main = False
            self.in_h1 = False
            self.depth = 0
            self.text = []
            self.found = None
        def handle_starttag(self, tag, attrs):
            if self.found is not None:
                return
            if tag == 'main':
                classes = ''
                for k, v in attrs:
                    if k == 'class':
                        classes = v or ''
                if 'pg-main' in classes.split():
                    self.in_main = True
            elif self.in_main and tag == 'h1' and not self.in_h1:
                self.in_h1 = True
                self.depth = 1
            elif self.in_h1:
                self.depth += 1
        def handle_endtag(self, tag):
            if self.in_h1:
                self.depth -= 1
                if self.depth == 0:
                    self.in_h1 = False
                    self.found = ''.join(self.text).strip()
            elif tag == 'main':
                self.in_main = False
        def handle_data(self, data):
            if self.in_h1:
                self.text.append(data)

    f = _H1Finder()
    f.feed(html_text)
    return f.found


def find_head_range(html_text):
    """
    Return (start, end) byte offsets of <head>...</head> in html_text,
    or None if not found. Start is position of '<' in <head>; end is
    position after '>' in </head>.
    """
    head_start = html_text.find('<head')
    if head_start == -1:
        return None
    head_open_end = html_text.find('>', head_start)
    if head_open_end == -1:
        return None
    head_close = html_text.find('</head>', head_open_end)
    if head_close == -1:
        return None
    end = head_close + len('</head>')
    return (head_start, end)


def sync_head(html_text, head_template):
    """
    Replace the <head> in html_text with head_template, substituting
    {{TITLE}} with the page's first h1 text from <main>. Returns the
    modified text. If no <head> or no template, returns unchanged.
    """
    if head_template is None:
        return html_text
    rng = find_head_range(html_text)
    if rng is None:
        return html_text

    title = extract_h1_text(html_text)
    if title is None:
        # No h1 found — fall back to a sensible default rather than
        # leaving the literal {{TITLE}} in the output.
        title = 'Untitled'

    new_head = head_template.replace('{{TITLE}}', title)
    start, end = rng
    return html_text[:start] + new_head + html_text[end:]


def sync_page(page_path, templates, head_template):
    """Sync one page in place. Returns True if the file changed."""
    original = page_path.read_text(encoding='utf-8')

    # HEAD — replace whole <head> with template, substituting {{TITLE}}
    # from the page's first <h1> in <main>.
    text = sync_head(original, head_template)

    # CLEANUP — find and delete all managed elements anywhere.
    managed = set(templates.keys())
    ranges, _ = find_managed_ranges(text, managed)
    cleaned = delete_ranges(text, ranges)

    # PLACEMENT — insert fresh templates just before </body>.
    body_end = cleaned.rfind('</body>')
    if body_end == -1:
        raise ValueError("no </body> after cleanup")

    line_start = cleaned.rfind('\n', 0, body_end) + 1
    body_indent = cleaned[line_start:body_end]
    child_indent = body_indent + '  '

    # Build the insertion block: each template indented one level
    # past the </body> indent. Skip sections with no template
    # (clean-only — they were removed but not reinstalled).
    parts = []
    for section in SECTIONS:
        tmpl = templates[section]
        if tmpl is None:
            continue
        indented = '\n'.join(
            (child_indent + line if line.strip() else line)
            for line in tmpl.split('\n')
        )
        parts.append(indented)
    insertion = '\n'.join(parts) + '\n' + body_indent

    new = cleaned[:line_start] + insertion + cleaned[line_start:]

    if new != original:
        page_path.write_text(new, encoding='utf-8')
        return True
    return False


def main():
    docs = Path(__file__).resolve().parent
    templates_dir = docs / 'templates'

    if not templates_dir.is_dir():
        sys.exit(f"missing templates directory: {templates_dir}")

    bad = [s for s in SECTIONS if s in PROTECTED]
    if bad:
        sys.exit(f"refusing to sync protected classes: {bad}")

    templates = {}
    for section in SECTIONS:
        tmpl_path = templates_dir / f'{section}.html'
        if tmpl_path.is_file():
            raw = tmpl_path.read_text(encoding='utf-8').strip()
            if not raw:
                # Empty file = same as no file: clean-only mode.
                templates[section] = None
            else:
                templates[section] = validate_template(tmpl_path, section)
        else:
            # Section listed but no template — clean-only mode.
            templates[section] = None

    # Load head template (optional — if present, full <head> gets
    # replaced with this content, {{TITLE}} substituted from the
    # page's first <h1> in <main>).
    head_path = templates_dir / 'head.html'
    head_template = None
    if head_path.is_file():
        head_template = head_path.read_text(encoding='utf-8').strip()
        if not head_template:
            head_template = None

    pages = [p for p in docs.rglob('index.html')
             if templates_dir not in p.parents]

    if not pages:
        sys.exit("no pages found")

    print(f"syncing {len(pages)} page(s):")
    if head_template is not None:
        print(f"  - head           install (full replacement, {{TITLE}} from h1)")
    for s in SECTIONS:
        kind = 'install' if templates[s] is not None else 'clean-only'
        print(f"  - {s:<14} {kind}")
    print()

    changed = 0
    for page in sorted(pages):
        rel = page.relative_to(docs)
        try:
            if sync_page(page, templates, head_template):
                print(f"  updated   {rel}")
                changed += 1
            else:
                print(f"  unchanged {rel}")
        except Exception as e:
            print(f"  ERROR     {rel}: {e}", file=sys.stderr)

    print(f"\n{changed} page(s) changed.")


if __name__ == '__main__':
    main()
