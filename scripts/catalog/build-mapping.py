#!/usr/bin/env python3
"""Map GLZ's site categories onto GLZ's Omny programs.

Joins glz-menu.json (see extract-glz-menu.py) to the live Omny program list by
normalized name and writes src/catalog/glzCategories.json, which the app uses to
group programs and to migrate show selections saved by the old version.

Usage: build-mapping.py
"""

import json
import re
import urllib.request
from pathlib import Path

OMNY_ORG_ID = '6dcbc33f-1fb6-49de-9ae2-ad8a00c01523'
MENU = Path(__file__).with_name('glz-menu.json')
OUT = Path(__file__).parents[2] / 'src' / 'catalog' / 'glzCategories.json'

# GLZ menu title -> Omny program name, where the two are named differently.
ALIASES = {
    'שבת בבוקר עם ירדן ודידי': 'ירדן ודידי',
    'בטלים בשישי': 'אודיה קורן ונתן דטנר בטלים בשישי',
    'גוני כהן ושחר גליק': 'גוני כהן',
    '100 שנה להולדתה של יפה ירקוני': 'ארכיון גל״צ : 100 שנה להולדתה של יפה ירקוני',
    '20 שנה ללכתה של שושנה דמארי': 'ארכיון גל״צ: 20 שנה ללכתה של שושנה דמארי',
    '30 שנה לציון מותו של סשה ארגוב': '30 שנה לציון לכתו של סשה ארגוב',
    'אוצרות ארכיון גלי צה״ל': 'ארכיון גלי צה״ל',
    'ארכיון גלצ: מתי כספי ז״ל': 'מתי כספי: ארכיון גל"צ',
    "ארכיון גלצ: קורין אלאל ז''ל": 'ארכיון גלצ: קורין אלאל',
    'באופן מילולי': 'באופן מילולי עם אבשלום קור',
    'גילוי דעת': "גילוי דעת עם הצ'ייסר",
    'סיון רהב מאיר וידידיה מאיר': 'סוף שבוע זוגי - סיון רהב מאיר וידידיה מאיר',
    'חטיבת המרום – פתרונות מבצעיים': 'מאזינים מרום חטיבת המרום – פתרונות מבצעיים',
    'פעם היו כאן חיים - סיפורן של קהילות בשואה': 'פעם היו כאן חיים',
    '55 שנה לפסטיבל שירי הילדים': '55 שנה לפסטיבל שירי ילדים',
    "ציפורי לילה בממ''ד עם דודו ארז ואבי אטינגר": 'ציפורי לילה בהגשת דודו ארז ואבי אטינגר',
    'במוצאי יום מנוחה': 'במוצאי יום המנוחה',
    'הפרעת קשב': 'הפרעת קשב - פודקאסט ביקורת התקשורת',
    # Omny has a single program for all of the broadcast university's series
    'מארכיון האוניברסיטה המשודרת': 'האוניברסיטה המשודרת',
}

# Omny program name -> category, where GLZ's own menu files a show somewhere misleading
CATEGORY_OVERRIDES = {
    # Ilana Dayan's current Thursday show; GLZ's menu still lists it under the archive
    'נכון להבוקר': 'חדשות',
}


def normalize(name: str) -> str:
    """Keep only Hebrew letters, latin letters and digits. Must match normalizeName() in src/catalog/catalog.ts."""
    return re.sub(r'[^א-תa-z0-9]', '', name.lower())


def fetch_programs() -> list[dict]:
    url = f'https://api.omny.fm/orgs/{OMNY_ORG_ID}/programs'
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)['Programs']


def main() -> None:
    menu = json.loads(MENU.read_text(encoding='utf-8'))
    programs = [p for p in fetch_programs() if not p['Archived'] and not p['Hidden']]

    ids_by_name: dict[str, list[str]] = {}
    for program in programs:
        ids_by_name.setdefault(normalize(program['Name']), []).append(program['Id'])

    program_categories: dict[str, str] = {}
    legacy_paths: dict[str, str] = {}
    unmatched: list[str] = []

    for category in menu:
        for item in category['programs']:
            ids = ids_by_name.get(normalize(ALIASES.get(item['title'], item['title'])), [])
            if not ids:
                unmatched.append(f"{category['name']}: {item['title']}")
                continue
            for program_id in ids:
                program_categories.setdefault(program_id, category['name'])
            if len(ids) == 1:
                legacy_paths[item['path']] = ids[0]

    for program in programs:
        if program['Name'] in CATEGORY_OVERRIDES:
            program_categories[program['Id']] = CATEGORY_OVERRIDES[program['Name']]

    OUT.write_text(
        json.dumps(
            {
                'categories': [c['name'] for c in menu],
                'programCategories': program_categories,
                'legacyPaths': legacy_paths,
            },
            ensure_ascii=False,
            indent=1,
        )
        + '\n',
        encoding='utf-8',
    )

    total = sum(len(c['programs']) for c in menu)
    print(f'matched {total - len(unmatched)}/{total} menu programs -> {OUT}')
    print('unmatched (these fall back to network groups in the app):')
    for line in unmatched:
        print(f'  {line}')


if __name__ == '__main__':
    main()
