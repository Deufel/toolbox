#!/usr/bin/env python3
"""
sync.py — sync chrome elements across all docs pages from templates.

Standard library only. Edit the SECTIONS list below.

How it works
------------
1. For each section, look for templates/<section>.html:
     - If present: install mode (clean + insert from template).
     - If absent:  clean-only mode (remove from pages, don't reinstall).
   This is how you retire a section: keep it in SECTIONS for one
   sync run with the template deleted, then remove it from SECTIONS.

2. For each page (every index.html under docs/, excluding templates/):
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
    'pg-nav',
    'pg-footer',
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


def sync_page(page_path, templates):
    """Sync one page in place. Returns True if the file changed."""
    original = page_path.read_text(encoding='utf-8')

    # CLEANUP — find and delete all managed elements anywhere.
    managed = set(templates.keys())
    ranges, _ = find_managed_ranges(original, managed)
    cleaned = delete_ranges(original, ranges)

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
            templates[section] = validate_template(tmpl_path, section)
        else:
            # Section listed but no template — clean-only mode.
            templates[section] = None

    pages = [p for p in docs.rglob('index.html')
             if templates_dir not in p.parents]

    if not pages:
        sys.exit("no pages found")

    print(f"syncing {len(pages)} page(s):")
    for s in SECTIONS:
        kind = 'install' if templates[s] is not None else 'clean-only'
        print(f"  - {s:<14} {kind}")
    print()

    changed = 0
    for page in sorted(pages):
        rel = page.relative_to(docs)
        try:
            if sync_page(page, templates):
                print(f"  updated   {rel}")
                changed += 1
            else:
                print(f"  unchanged {rel}")
        except Exception as e:
            print(f"  ERROR     {rel}: {e}", file=sys.stderr)

    print(f"\n{changed} page(s) changed.")


if __name__ == '__main__':
    main()
