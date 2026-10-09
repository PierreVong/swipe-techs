# Private question collections

Study questions from a guide you own (for example your copy of the BIWS 400 questions) in Swipe Techs,
without putting that material on the website or in this repo.

1. **Extract** the questions from your PDF, on your computer:

   ```
   pip install pdfplumber
   python3 extract_biws.py "BIWS 76-164.pdf" -o private/biws-extracted.json --report private/report.txt
   ```

   The report lists the question count per section and anything flagged for a manual check
   (tables, margin notes, unusual layout). Nothing is guessed: a question the tool can't read
   cleanly is flagged, not filled in. Try a small batch first with `--only acct:Basic --limit 5`.

2. **Add study aids** (optional): simplified explanations, numerical examples, updated explanations
   for answers that current standards have changed, and links to similar built-in questions.
   They live in separate files and are merged next to the original text, never into it:

   ```
   python3 merge_explanations.py private/biws-extracted.json private/explanations/*.json -o private/biws-400q.json
   ```

3. **Import** the JSON in the app: Settings → Private collection → Import question file. It's stored
   in that browser only (IndexedDB). On iPhone, import inside the home-screen app, since it keeps its own storage.
   Replace or delete it from the same place; deleting can keep or erase your progress on it.

The PDF and every JSON file here are your private copies. `.gitignore` keeps `*.pdf`, `*.json` and `private/`
out of git in this folder; don't commit them anywhere else either.

## File format

```json
{
  "format": "swipetechs-private-collection", "version": 1,
  "id": "biws400", "name": "BIWS 400Q", "short": "BIWS", "source": "…",
  "questions": [
    {
      "id": "bw-acct-b01", "c": "acct", "l": 1, "lvl": "Basic", "sec": "Accounting", "num": 1,
      "page": 76, "pages": [76], "order": 1,
      "q": "Question text", "a": "Answer text", "notes": "", "flags": [],
      "added": { "simple": "", "example": "", "update": null, "similar": [] }
    }
  ]
}
```

- `c`: acct, ev, val, dcf, ma, lbo, model, math or brain. `l`: 1 basic, 2 (no level), 3 advanced.
- Ids are progress keys: keep them stable so re-importing a corrected file keeps your progress.
- Text uses a small markup: blank line between paragraphs, `- ` and `1. ` lists, `**bold**`, `*italic*`,
  `\*` for a literal asterisk, and ```` ```table ```` blocks (cells split by `|`, `<` merges a cell into the one on its left).
  The app escapes everything else, so a file can't inject HTML.
