#!/usr/bin/env python3
"""Extract GLZ's program categories from a saved glz.co.il page.

glz.co.il blocks automated access, so save the page from a real browser
(File > Save Page As, or copy document.documentElement.outerHTML from devtools)
and pass it here. Writes glz-menu.json next to this script.

Usage: extract-glz-menu.py <saved-glz-page.html>
"""

import html
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).with_name('glz-menu.json')


def extract(page: str) -> list[dict[str, object]]:
    # The programs menu is the first tab of the top menu; each category is a
    # subMenuListBtn button followed by its list of program links.
    start = page.find('class="tabContent ')
    end = page.find('class="menuList__item', start)
    if start == -1 or end == -1:
        raise SystemExit('could not find the programs menu in the page')

    chunks = re.split(r'<button type="button" class="subMenuListBtn[^"]*"[^>]*>', page[start:end])[1:]
    categories = []
    for chunk in chunks:
        name = html.unescape(chunk[: chunk.find('<')]).strip()
        programs = [
            {'title': html.unescape(title).strip(), 'path': path}
            for path, title in re.findall(r'<a href="(/גלצ/תוכניות/[^"]+)"[^>]*class="title"[^>]*>([^<]+)</a>', chunk)
        ]
        categories.append({'name': name, 'programs': programs})
    return categories


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)

    categories = extract(Path(sys.argv[1]).read_text(encoding='utf-8'))
    OUT.write_text(json.dumps(categories, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')

    total = sum(len(c['programs']) for c in categories)  # type: ignore[arg-type]
    print(f'{len(categories)} categories, {total} programs -> {OUT}')


if __name__ == '__main__':
    main()
