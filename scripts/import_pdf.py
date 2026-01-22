#!/usr/bin/env python3
import PyPDF2, json, re, sys

pdf_path = "/Users/brettschoeneck/Desktop/New_Testament_Reading_Plan_with_Dates_2025.pdf"
out_path = "/Users/brettschoeneck/Desktop/bible reading plan/plan.json"

def extract_text(path):
    reader = PyPDF2.PdfReader(path)
    parts = []
    for p in reader.pages:
        try:
            parts.append(p.extract_text() or '')
        except Exception:
            parts.append('')
    return '\n'.join(parts)

def main():
    txt = extract_text(pdf_path)
    lines = [l.strip() for l in txt.splitlines() if l.strip()]

    books = [
        'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
        '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther',
        'Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel',
        'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
        'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
        '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
    ]

    candidates = []
    for l in lines:
        for b in books:
            if b.lower() in l.lower():
                cleaned = re.sub(r'\s{2,}', ' ', l)
                candidates.append(cleaned)
                break

    # dedupe preserving order
    seen = set(); dedup = []
    for c in candidates:
        if c not in seen:
            seen.add(c); dedup.append(c)

    # group into weeks of 5 days (Mon-Fri)
    weeks = []
    for i in range(0, len(dedup), 5):
        week_days = dedup[i:i+5]
        if not week_days:
            break
        weeks.append({"name": f"Week {len(weeks)+1}", "days": week_days})

    out = {"weeks": weeks}
    with open(out_path, 'w') as f:
        json.dump(out, f, indent=2)

    print(f"Wrote {out_path} — {len(weeks)} weeks, {sum(len(w['days']) for w in weeks)} readings imported")
    print('\nFirst 20 imported readings:')
    for r in dedup[:20]:
        print('-', r)

if __name__ == '__main__':
    main()
