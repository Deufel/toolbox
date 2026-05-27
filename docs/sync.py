#!/usr/bin/env python3
"""
sync.py — sync chrome elements across all docs pages from templates.

Edit the SECTIONS list below to add or remove chrome elements. Run from
the docs/ directory. Each entry must match exactly one file in
templates/ (named <section>.html) and one element in each page (matched
by class as a direct child of <body>).

How it works
------------
1. Read every template in templates/. Each file contains ONE root
   element with a class that matches the section name.
2. For each docs page (index.html files outside templates/):
   a. Parse <body>'s direct children.
   b. For each section in SECTIONS:
      - If the page has a matching direct-child element, REPLACE it.
      - Otherwise, INSERT it (in SECTIONS order at end of body).
   c. For any direct-child element whose class includes a `pg-*` token
      NOT in SECTIONS, REMOVE it.
3. Write the page back, preserving the doctype, head, and everything
   outside <body>'s direct children.

PROTECTED below is a safelist of classes the script refuses to touch
even if listed (chiefly `pg-main`, the per-page content slot — putting
it in SECTIONS would nuke every page's body).
"""

import sys
from pathlib import Path
from html.parser import HTMLParser

# ── EDIT THIS LIST ──────────────────────────────────────────────────
# Each entry is the class name of one chrome element to sync. The
# script expects a templates/<name>.html for each, and matches the
# element in each page by that class on a direct child of <body>.
SECTIONS = [
    'pg-header',
    'hud',
    'drawer',          # the <dialog class="drawer ..."> nav drawer
    'chrome-init',     # the inline <script> at the bottom of <body>
]

# Classes the script refuses to touch even if listed — guards against
# accidentally syncing per-page content.
PROTECTED = {'pg-main'}

# Void elements (no closing tag in HTML5).
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'source', 'track', 'wbr'}


class BodyChildrenParser(HTMLParser):
    """
    Parse a full HTML page and produce:
      - the byte ranges of each direct child of <body> (as offsets into
        the source string),
      - the class list of each such child,
      - the byte offset where new children should be inserted (just
        before </body>).

    We work with byte offsets rather than rebuilding the page because
    html.parser doesn't capture whitespace, attribute order, or
    formatting faithfully — reconstruction would lose the original
    indentation and comments.
    """

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.in_body = False
        self.body_depth = 0          # nesting depth INSIDE <body>
        self.children = []           # list of (start_offset, end_offset, tag, classes)
        self._current_child = None   # (start_offset, tag, classes) while inside one
        self.body_end_offset = None  # offset of </body> opening '<'

    def _offset(self):
        # html.parser reports line/col; convert to absolute offset.
        line, col = self.getpos()
        return self._line_offsets[line - 1] + col

    def feed(self, data):
        # Precompute line-start offsets so getpos() can map to absolute.
        self._source = data
        self._line_offsets = [0]
        for i, ch in enumerate(data):
            if ch == '\n':
                self._line_offsets.append(i + 1)
        super().feed(data)

    def handle_starttag(self, tag, attrs):
        off = self._offset()
        if tag == 'body':
            self.in_body = True
            return
        if not self.in_body:
            return

        if self.body_depth == 0:
            # Starting a new direct child of body.
            classes = ''
            for k, v in attrs:
                if k == 'class':
                    classes = v or ''
                    break
            self._current_child = (off, tag, classes.split())
        if tag not in VOID:
            self.body_depth += 1

    def handle_startendtag(self, tag, attrs):
        # Self-closing tag (rare in HTML5; treat as start+end).
        off = self._offset()
        if not self.in_body:
            return
        if self.body_depth == 0:
            # A self-closing void at body root — record and finish.
            classes = ''
            for k, v in attrs:
                if k == 'class':
                    classes = v or ''
                    break
            # Find end of this tag.
            tag_end = self._source.find('>', off) + 1
            self.children.append((off, tag_end, tag, classes.split()))

    def handle_endtag(self, tag):
        off = self._offset()
        if tag == 'body':
            self.body_end_offset = off
            self.in_body = False
            return
        if not self.in_body:
            return

        if tag not in VOID:
            self.body_depth -= 1
        if self.body_depth == 0 and self._current_child is not None:
            # Just closed a direct child of body. End offset is after '>'.
            tag_end = self._source.find('>', off) + 1
            start, t, classes = self._current_child
            self.children.append((start, tag_end, t, classes))
            self._current_child = None


def parse_page(html_text):
    """Return (children, body_end_offset). Raises if no <body>."""
    p = BodyChildrenParser()
    p.feed(html_text)
    if p.body_end_offset is None:
        raise ValueError("no </body> found")
    return p.children, p.body_end_offset


def first_element_class(html_text, expected_class):
    """
    Verify the template's root element has the expected class, and
    return the trimmed template text (everything from the first '<' to
    the matching closing '>').
    """
    # Find the first non-whitespace, non-comment opening tag.
    p = BodyChildrenParser()
    # Wrap the template in <body>...</body> so the parser treats its
    # root as a body child.
    wrapped = f"<body>{html_text}</body>"
    p.feed(wrapped)
    if not p.children:
        raise ValueError(f"template has no root element")
    start, end, tag, classes = p.children[0]
    if expected_class not in classes:
        raise ValueError(
            f"template root <{tag}> has classes {classes!r}, "
            f"expected to include {expected_class!r}")
    if len(p.children) > 1:
        raise ValueError(
            f"template has multiple root elements; must have exactly one")
    # Strip the wrapping <body>...</body> we added.
    return wrapped[start:end]


def sync_page(page_path, templates):
    """
    Sync one page in place.

    templates: dict of class_name -> rendered_html_string (already
    trimmed to the element itself, no doctype/body wrapping).
    """
    text = page_path.read_text(encoding='utf-8')
    children, body_end = parse_page(text)

    # Plan: build a list of (start, end, replacement) edits.
    # An edit can be:
    #   - replace an existing child: (start, end, new_text)
    #   - delete an existing child: (start, end, '')
    #   - insert new content: (body_end, body_end, new_text)
    # We apply edits from the END of the document toward the start, so
    # earlier offsets stay valid.

    edits = []
    matched_sections = set()
    body_indent = '  '  # standard 2-space indent for body children

    # Classify each existing child.
    for start, end, tag, classes in children:
        # Does any class match a section in SECTIONS?
        match = None
        for c in classes:
            if c in SECTIONS:
                match = c
                break
        if match is not None:
            # Sync: replace with template.
            edits.append((start, end, templates[match]))
            matched_sections.add(match)
            continue

        # Does any class look like chrome (pg-* or in PROTECTED set)
        # but isn't in SECTIONS? Remove if a pg-*; preserve protected.
        is_protected = any(c in PROTECTED for c in classes)
        if is_protected:
            continue
        # Remove only if it looks like a chrome class (pg-*) that we
        # actively manage. Other elements (the page's <main>, scripts
        # not tagged chrome-init, etc.) we leave alone.
        is_pg = any(c.startswith('pg-') for c in classes)
        if is_pg:
            # Remove. Include trailing newline if present.
            trailing = end
            while trailing < len(text) and text[trailing] == '\n':
                trailing += 1
            # Also include preceding indent on the line.
            leading = start
            while leading > 0 and text[leading - 1] in ' \t':
                leading -= 1
            edits.append((leading, trailing, ''))

    # Sections not matched in the page → insert before </body>.
    # Find the indent on the </body> line so insertions match.
    insertions = []
    for sec in SECTIONS:
        if sec not in matched_sections:
            insertions.append(templates[sec])

    if insertions:
        # Build a single inserted block with indentation.
        block = '\n'.join(body_indent + line if line else line
                          for tmpl in insertions
                          for line in (tmpl + '\n').split('\n'))
        # The </body> line: find the start of its indent.
        be_line_start = text.rfind('\n', 0, body_end) + 1
        insert_at = be_line_start
        edits.append((insert_at, insert_at, block))

    # Apply edits in reverse offset order.
    edits.sort(key=lambda e: e[0], reverse=True)
    new_text = text
    for start, end, replacement in edits:
        new_text = new_text[:start] + replacement + new_text[end:]

    if new_text != text:
        page_path.write_text(new_text, encoding='utf-8')
        return True
    return False


def main():
    docs = Path(__file__).resolve().parent
    templates_dir = docs / 'templates'

    if not templates_dir.is_dir():
        sys.exit(f"missing templates directory: {templates_dir}")

    # Guard: no PROTECTED class in SECTIONS.
    bad = [s for s in SECTIONS if s in PROTECTED]
    if bad:
        sys.exit(f"refusing to sync protected classes: {bad}")

    # Load all templates.
    templates = {}
    for sec in SECTIONS:
        tmpl_path = templates_dir / f'{sec}.html'
        if not tmpl_path.is_file():
            sys.exit(f"missing template: {tmpl_path}")
        raw = tmpl_path.read_text(encoding='utf-8')
        templates[sec] = first_element_class(raw, sec)

    # Find all index.html under docs/, excluding templates/.
    pages = [p for p in docs.rglob('index.html')
             if templates_dir not in p.parents]

    if not pages:
        sys.exit("no pages found")

    print(f"syncing {len(pages)} page(s) from {len(SECTIONS)} template(s):")
    for sec in SECTIONS:
        print(f"  - {sec}")
    print()

    changed = 0
    for page in sorted(pages):
        rel = page.relative_to(docs)
        try:
            if sync_page(page, templates):
                print(f"  updated  {rel}")
                changed += 1
            else:
                print(f"  unchanged {rel}")
        except Exception as e:
            print(f"  ERROR    {rel}: {e}", file=sys.stderr)

    print(f"\n{changed} page(s) changed.")


if __name__ == '__main__':
    main()
