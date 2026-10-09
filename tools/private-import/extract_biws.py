#!/usr/bin/env python3
"""Extract numbered interview questions and answers from your own copy of a BIWS-style
"Questions & Answers" PDF into a private Swipe Techs collection (JSON).

Runs only on your computer. The PDF and the JSON it writes are copyrighted material for
your personal study: never commit them to the repo (tools/private-import/.gitignore
ignores the usual names) and never put them on the website. Import the JSON in the app
under Settings, where it stays in your browser.

    pip install pdfplumber
    python3 extract_biws.py "BIWS 76-164.pdf" -o private/biws-extracted.json --report private/report.txt
    python3 extract_biws.py "BIWS 76-164.pdf" -o private/test5.json --only acct:Basic --limit 5

How it reads the PDF:
- Section headers are the largest font ("Accounting Questions & Answers – Basic").
- A question is a bold line starting "N. " where N is the next number in that section;
  bold lines right below it continue the question.
- Everything after it, up to the next question or header, is the answer, joined across
  page breaks. Footers (site URLs, logo, page number) are dropped; the printed page
  number is kept as the question's source page.
- Paragraphs come from line spacing and from lines the author ended early; words split
  over a line break with a hyphen ("non-" / "cash") are joined back together.
- Bold and italic words become **bold** and *italic*; literal asterisks are escaped
  as \\*. Numbered and bulleted lists become "1. " / "- " lines. Tables become ```table
  blocks: one row per line, cells split by " | ", and "<" for a cell merged into the
  one on its left.
- Anything that can't be extracted reliably is flagged instead of guessed.
"""
import argparse
import collections
import datetime
import json
import re
import sys

try:
    import pdfplumber
except ImportError:
    sys.exit("This needs pdfplumber: pip install pdfplumber")

# Section header text -> category key used by the app
SECTIONS = [
    (r"^Accounting\b", "acct"),
    (r"^Enterprise\s*/\s*Equity Value\b", "ev"),
    (r"^Valuation\b", "val"),
    (r"^Discounted Cash Flow\b", "dcf"),
    (r"^Merger Model\b", "ma"),
    (r"^LBO Model\b", "lbo"),
    (r"^Brain Teaser", "brain"),
]
SECTION_NAMES = {"acct": "Accounting", "ev": "Enterprise / Equity Value", "val": "Valuation", "dcf": "Discounted Cash Flow",
                 "ma": "Merger Models", "lbo": "LBO Models", "brain": "Brain Teasers"}
LEVELS = {"Basic": 1, "Advanced": 3, "": 2}
FOOTER = re.compile(r"^https?://|breakingintowallstreet|mergersandinquisitions", re.I)
END_PUNCT = tuple(".?!:;”\"')")
LIST_START = re.compile(r"^(\d+)\.\s|^[•●▪◦–-]\s")
WORD_GAP = 1.0      # words closer than this (pt) belong together, e.g. a word and the period after it in another font
CELL_GAP = 4.5      # inside a table row, a gap this wide separates cells
WIDE_GAP = 8.0      # a line with a gap this wide (not right after a list number) may be a table row


def classify_fonts(pdf):
    """Work out which font is body text, bold, italic and the section header, from character counts."""
    counts = collections.Counter()
    first_word = collections.Counter()
    folio = collections.Counter()
    for pg in pdf.pages:
        for c in pg.chars:
            counts[(c["fontname"], round(c["size"]))] += 1
        for w in pg.extract_words(extra_attrs=["fontname", "size"]):
            if re.fullmatch(r"\d+\.", w["text"]):
                first_word[w["fontname"]] += 1
            if w["top"] > pg.height * 0.85 and re.fullmatch(r"\d{1,4}", w["text"]):
                folio[w["fontname"]] += 1          # page-number font
    by_size = collections.Counter()
    for (f, s), n in counts.items():
        by_size[s] += n
    body_size = by_size.most_common(1)[0][0]
    by_font = collections.Counter()
    for (f, s), n in counts.items():
        if s == body_size:
            by_font[f] += n
    body = by_font.most_common(1)[0][0]
    others = [f for f in by_font if f != body and f not in folio and "symbol" not in f.lower()]
    # The bold font is the one numbered question lines use most; other body-size fonts are italic.
    bold = max(others, key=lambda f: first_word[f]) if others else None
    italic = {f for f in others if f != bold and by_font[f] > 20}
    header_sizes = [s for (f, s), n in counts.items() if s >= body_size + 2]
    header_size = max(header_sizes) if header_sizes else None
    return {"body": body, "bold": bold, "italic": italic, "body_size": body_size, "header_size": header_size}


def ruled_tables(pg):
    """Tables drawn with filled cell boxes: [{bbox, rows: [[(text, colspan)]]}]. Inner padding boxes are ignored."""
    rs = [r for r in pg.rects if r["width"] > 15 and r["height"] > 8]
    boxes = sorted({(round(r["x0"]), round(r["top"]), round(r["x1"]), round(r["bottom"])) for r in rs})
    outer = [b for b in boxes if not any(o != b and o[0] <= b[0] + 1 and o[1] <= b[1] + 1 and o[2] >= b[2] - 1 and o[3] >= b[3] - 1 for o in boxes)]
    if len(outer) < 6:
        return []
    rows = collections.defaultdict(list)
    for b in outer:
        rows[b[1]].append(b)
    tops = sorted(rows)
    header = sorted(rows[tops[0]]) if tops else []
    if len(tops) < 2 or len(header) < 3:
        return []
    cols = [(b[0] + b[2]) / 2 for b in header]
    words = pg.extract_words(extra_attrs=["fontname", "size"])
    out_rows = []
    for t in tops:
        row = []
        for b in sorted(rows[t]):
            inside = [w for w in words if b[0] <= (w["x0"] + w["x1"]) / 2 <= b[2] and b[1] <= (w["top"] + w["bottom"]) / 2 <= b[3]]
            inside.sort(key=lambda w: (round(w["top"] / 3), w["x0"]))
            span = max(1, sum(1 for c in cols if b[0] <= c <= b[2]))
            row.append((" ".join(w["text"] for w in inside), span))
        out_rows.append(row)
    bbox = (min(b[0] for b in outer), min(b[1] for b in outer), max(b[2] for b in outer), max(b[3] for b in outer))
    return [{"bbox": bbox, "rows": out_rows}]


def page_lines(pg, fonts):
    """Words grouped into lines, each word tagged with a style: b (bold), i (italic) or '' (regular).
    A ruled table comes back as one line of kind "table"."""
    tables = ruled_tables(pg)
    def in_table(w):
        return any(t["bbox"][0] - 2 <= w["x0"] and w["x1"] <= t["bbox"][2] + 2 and t["bbox"][1] - 2 <= w["top"] and w["bottom"] <= t["bbox"][3] + 2 for t in tables)
    words = [w for w in pg.extract_words(extra_attrs=["fontname", "size"], keep_blank_chars=False, use_text_flow=True) if not in_table(w)]
    # Bullet glyphs sit a little higher than their text, so they're attached to the nearest line afterwards.
    is_bullet = lambda w: w["text"] in ("•", "●", "▪", "◦", "\uf0b7")
    rows = []
    for w in sorted((w for w in words if not is_bullet(w)), key=lambda w: (round(w["top"]), w["x0"])):
        if rows and abs(rows[-1]["top"] - w["top"]) <= 3:
            rows[-1]["words"].append(w)
        else:
            rows.append({"top": w["top"], "words": [w]})
    for b in (w for w in words if is_bullet(w)):
        mid = (b["top"] + b["bottom"]) / 2
        near = min(rows, key=lambda r: abs((r["words"][0]["top"] + r["words"][0]["bottom"]) / 2 - mid), default=None)
        if near and abs((near["words"][0]["top"] + near["words"][0]["bottom"]) / 2 - mid) <= 6:
            near["words"].append(dict(b, text="•", fontname=near["words"][0]["fontname"]))
    label = None
    out = []
    text_fonts = {fonts["body"], fonts["bold"]} | fonts["italic"]
    for r in rows:
        ws = sorted(r["words"], key=lambda w: w["x0"])
        text = " ".join(w["text"] for w in ws)
        sizes = [round(w["size"]) for w in ws]
        fontset = {w["fontname"] for w in ws}
        if re.fullmatch(r"\d{1,4}", text) and r["top"] > pg.height * 0.85:
            label = int(text)            # printed page number in the footer
            continue
        is_header = bool(fonts["header_size"] and max(sizes) >= fonts["header_size"] - 0.5)
        if FOOTER.search(text):
            continue                     # site URLs
        if not fontset & text_fonts and not is_header:
            # Text in another font out in the page margin is a note someone added to this copy; anything else is the logo.
            if ws[0]["x0"] < pg.width * 0.1 or ws[0]["x0"] > pg.width * 0.86:
                out.append({"top": r["top"], "bottom": max(w["bottom"] for w in ws), "x0": ws[0]["x0"], "x1": ws[-1]["x1"], "text": text,
                            "words": [], "header": False, "bold": False, "kind": "margin"})
            continue
        styled = []
        for w in ws:
            st = "b" if w["fontname"] == fonts["bold"] else "i" if w["fontname"] in fonts["italic"] else ""
            styled.append((w["text"], st, w["x0"], w["x1"]))
        out.append({"top": r["top"], "bottom": max(w["bottom"] for w in ws), "x0": ws[0]["x0"], "x1": ws[-1]["x1"], "text": text,
                    "words": styled, "header": is_header, "bold": all(s == "b" for _, s, _, _ in styled), "kind": "text"})
    for t in tables:
        out.append({"top": t["bbox"][1], "bottom": t["bbox"][3], "x0": t["bbox"][0], "x1": t["bbox"][2], "text": "[table]",
                    "words": [], "header": False, "bold": False, "kind": "table", "rows": t["rows"]})
    out.sort(key=lambda l: l["top"])
    return out, label


def esc(t):
    return t.replace("\\", "\\\\").replace("*", "\\*").replace("`", "'")


def tokens_of(lines):
    """Words of consecutive lines as (text, style, glue before). Glue is "" inside a word that changes font,
    and across a line break after a hyphenated word part ("non-" + "cash")."""
    toks = []
    for li, l in enumerate(lines):
        for wi, (text, st, x0, x1) in enumerate(l["words"]):
            if wi:
                glue = "" if x0 - l["words"][wi - 1][3] < WORD_GAP else " "
            elif toks:
                prev = toks[-1][0]
                glue = "" if re.search(r"[A-Za-z]-$", prev) and len(prev) > 2 and re.match(r"[A-Za-z]", text) else " "
            else:
                glue = ""
            toks.append((text, st, glue))
    return toks


def styled_text(toks):
    """Tokens -> text with **bold** / *italic* runs."""
    parts = []           # [glue, style, text]
    for text, st, glue in toks:
        if parts and parts[-1][1] == st:
            parts[-1][2] += glue + esc(text)
        else:
            parts.append([glue if parts else "", st, esc(text)])
    mark = {"b": "**", "i": "*", "": ""}
    return "".join(g + mark[st] + t + mark[st] for g, st, t in parts).strip()


def table_block(rows):
    """Rows of (text, colspan) -> a ```table block."""
    lines = []
    for row in rows:
        cells = []
        for text, span in row:
            cells.append(text.replace("|", "/").replace("`", "'").strip())
            cells += ["<"] * (span - 1)
        lines.append(" | ".join(cells))
    return "```table\n" + "\n".join(lines) + "\n```"


def cells_of(words):
    """Split a table row's words into cells at wide gaps: [(text, x0)]."""
    cells = []
    for text, _, x0, x1 in words:
        if cells and x0 - cells[-1][2] < CELL_GAP:
            cells[-1][0] += " " + text
            cells[-1][2] = x1
        else:
            cells.append([text, x0, x1])
    return [(c[0], c[1]) for c in cells]


def unruled_table(lines):
    """Rows of loosely aligned cells -> rows of (text, colspan), using the column positions the rows share."""
    rows = [cells_of(l["words"]) for l in lines]
    groups = []
    for x in sorted(x for r in rows for _, x in r):
        if groups and x - groups[-1][-1] <= 8:
            groups[-1].append(x)
        else:
            groups.append([x])
    anchors = [sum(g) / len(g) for g in groups]
    out = []
    for r in rows:
        slots = [""] * len(anchors)
        for text, x in r:
            i = min(range(len(anchors)), key=lambda k: abs(anchors[k] - x))
            slots[i] = (slots[i] + " " + text).strip()
        out.append([(s, 1) for s in slots])
    return out


def wide_gaps(l):
    ws = l["words"]
    gaps = [b[2] - a[3] for a, b in zip(ws, ws[1:])]
    if gaps and re.fullmatch(r"\d+\.|[•●▪◦]", ws[0][0]):
        gaps = gaps[1:]                  # the space after a list number isn't a column gap
    return sum(1 for g in gaps if g >= WIDE_GAP)


def answer_text(lines, margin, line_gap, right):
    """Answer lines -> (rich text with blocks separated by blank lines, table blocks found)."""
    def broke_early(a, b):
        # The author ended line a early if b's first word would have fitted after it.
        if not a["words"] or not b["words"] or a["text"].endswith("-"):
            return False
        first = b["words"][0]
        return right - a["x1"] > (first[3] - first[2]) + 6

    blocks = []          # {"kind": "p"|"li"|"table", "lines": [...]}
    prev = None
    i = 0
    while i < len(lines):
        l = lines[i]
        if l["kind"] == "table":
            blocks.append({"kind": "table", "rows": l["rows"]})
            prev = None; i += 1
            continue
        # Unruled table: a run of close lines with wide gaps, at least two of them with several.
        if wide_gaps(l):
            j = i + 1
            while j < len(lines) and lines[j]["kind"] == "text" and lines[j]["page"] == l["page"] and \
                    lines[j]["top"] - lines[j - 1]["bottom"] < line_gap * 1.5 and wide_gaps(lines[j]):
                j += 1
            run = lines[i:j]
            if len(run) >= 2 and sum(1 for x in run if wide_gaps(x) >= 2) >= 2:
                blocks.append({"kind": "table", "rows": unruled_table(run), "unruled": True})
                prev = None; i = j
                continue
        # A bullet always starts a list item; a number only when indented (at the margin it could be prose).
        list_start = bool(re.match(r"^[•●▪◦]\s", l["text"])) or (bool(LIST_START.match(l["text"])) and l["x0"] > margin + 6)
        if prev is None:
            new_para = True
        elif l["page"] != prev["page"]:
            # Page break: same paragraph unless the last line finished a sentence or stopped short.
            new_para = prev["text"].rstrip().endswith(END_PUNCT) or list_start or broke_early(prev, l)
        else:
            new_para = (l["top"] - prev["bottom"]) > line_gap * 1.25 or list_start or broke_early(prev, l)
        cur = blocks[-1] if blocks else None
        if list_start:
            blocks.append({"kind": "li", "num": bool(re.match(r"^\d+\.", l["text"])), "lines": [l]})
        elif not new_para and cur and cur["kind"] in ("p", "li"):
            cur["lines"].append(l)
        elif cur and cur["kind"] == "li" and l["x0"] > margin + 6 and (l["page"] != prev["page"] or (l["top"] - prev["bottom"]) <= line_gap * 1.25):
            cur["lines"].append(l)       # wrapped line of a list item (indented)
        else:
            blocks.append({"kind": "p", "lines": [l]})
        prev = l; i += 1
    out = []
    for b in blocks:
        if b["kind"] == "table":
            out.append(table_block(b["rows"]))
            continue
        text = styled_text(tokens_of(b["lines"]))
        if b["kind"] == "li":
            if b["num"]:
                text = re.sub(r"^(\*\*|\*)?(\d+)\.\s*", lambda m: f"{m.group(2)}. " + (m.group(1) or ""), text)
            else:
                text = "- " + re.sub(r"^(\*\*|\*)?[•●▪◦–-]\s*", lambda m: m.group(1) or "", text)
            # Consecutive items of the same kind share one block.
            last = out[-1].split("\n")[-1] if out else ""
            if (last.startswith("- ") and text.startswith("- ")) or (re.match(r"^\d+\. ", last) and re.match(r"^\d+\. ", text)):
                out[-1] += "\n" + text
                continue
        out.append(text)
    return "\n\n".join(out), [b for b in blocks if b["kind"] == "table"]


def extract(path, only=None, limit=None):
    with pdfplumber.open(path) as pdf:
        fonts = classify_fonts(pdf)
        all_lines = []
        for pi, pg in enumerate(pdf.pages):
            lines, label = page_lines(pg, fonts)
            for l in lines:
                l["page"] = label if label is not None else pi + 1
                l["pdf_page"] = pi + 1
            all_lines.extend(lines)
    body = [l for l in all_lines if not l["header"] and l["kind"] == "text"]
    margin = collections.Counter(round(l["x0"]) for l in body).most_common(1)[0][0]
    ends = sorted(l["x1"] for l in body)
    right = ends[int(len(ends) * 0.99)]                       # right edge of a full line
    gaps = collections.Counter()
    for a, b in zip(body, body[1:]):
        if a["page"] == b["page"]:
            g = round(b["top"] - a["bottom"])
            if 0 < g < 40:
                gaps[g] += 1
    line_gap = max(4, gaps.most_common(1)[0][0]) if gaps else 5   # gap between lines inside a paragraph

    questions, problems = [], []
    sec = None
    q = None
    mode = None

    def close():
        nonlocal q
        if q is None:
            return
        q["a"], q["_tables"] = answer_text(q.pop("_lines"), margin, line_gap, right)
        questions.append(q)
        q = None

    for l in all_lines:
        if l["header"]:
            close()
            name = l["text"]
            cat = next((c for rx, c in SECTIONS if re.search(rx, name)), None)
            lvl = "Advanced" if re.search(r"Advanced\s*$", name) else "Basic" if re.search(r"Basic\s*$", name) else ""
            sec = {"name": name, "c": cat, "lvl": lvl, "next": 1}
            mode = "intro"
            if cat is None:
                problems.append(f"Unknown section header on p. {l['page']}: {name}")
            continue
        if sec is None:
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", l["text"]) if l["kind"] == "text" else None
        if m and l["words"][0][1] == "b":
            if int(m.group(1)) == sec["next"]:
                close()
                n = sec["next"]; sec["next"] += 1
                lv = "b" if sec["lvl"] == "Basic" else "a" if sec["lvl"] == "Advanced" else "x"
                q = {"id": f"bw-{sec['c']}-{lv}{n:02d}", "c": sec["c"], "sec": SECTION_NAMES.get(sec["c"], sec["name"]), "lvl": sec["lvl"],
                     "l": LEVELS[sec["lvl"]], "num": n, "page": l["page"], "pages": [l["page"]], "pdfPage": l["pdf_page"],
                     "q": "", "notes": "", "flags": [], "_qlines": [l], "_lines": [], "_margin": [], "_qbottom": l["bottom"], "_qpage": l["page"]}
                mode = "question"
                continue
            if mode != "intro":
                problems.append(f"p. {l['page']}: bold line numbered {m.group(1)} where question {sec['next']} of {sec['name']} was expected; kept as answer text")
        if mode == "intro" or q is None:
            continue
        if l["kind"] == "margin":
            q["_margin"].append(l["text"])
            continue
        mostly_bold = l["kind"] == "text" and sum(1 for w in l["words"] if w[1] == "b") >= 0.6 * len(l["words"])
        gap = l["top"] - q["_qbottom"]
        # A question can run on to a second bold paragraph (brain teasers) until it reaches its question mark.
        asked = q["_qlines"][-1]["text"].rstrip().endswith("?")
        if mode == "question" and mostly_bold and l["page"] == q["_qpage"] and (gap < line_gap * 1.6 or (gap < line_gap * 6 and not asked)):
            q["_qlines"].append(l)
            q["_qbottom"] = l["bottom"]
            continue
        mode = "answer"
        q["_lines"].append(l)
        if l["page"] not in q["pages"]:
            q["pages"].append(l["page"])
    close()

    for q in questions:
        # Plain text: the whole question is bold in the PDF.
        text = "".join(g + t for t, _, g in tokens_of(q.pop("_qlines")))
        q["q"] = re.sub(r"\s+", " ", re.sub(r"^\d+\.\s*", "", text)).strip()
        tables = q.pop("_tables")
        margin_notes = q.pop("_margin")
        for k in ("_qbottom", "_qpage"):
            q.pop(k, None)
        notes = []
        if margin_notes:
            q["flags"].append("margin-note")
            notes.append("Margin note in your copy of the PDF (not part of the original answer): " + "; ".join(margin_notes) + ".")
        words = len(re.findall(r"\w+", q["a"]))
        if words == 0:
            q["flags"].append("no-answer")
            notes.append("No answer text was found under this question. Check the PDF.")
        elif words < 4:
            q["flags"].append("short-answer")
            notes.append("The answer is unusually short. Check it against the PDF.")
        if tables:
            q["flags"].append("table")
            notes.append("This answer has a table rebuilt from the PDF" +
                         (": its columns were matched by position, so compare it with the page." if any(t.get("unruled") for t in tables) else "."))
        if not q["q"].endswith(("?", ".", ":", ")", "”")):
            q["flags"].append("question-end")
        if "�" in q["q"] + q["a"]:
            q["flags"].append("unreadable-characters")
            notes.append("Some characters couldn't be read. Check the PDF.")
        q["notes"] = " ".join(notes)

    sections = collections.OrderedDict()
    for q in questions:
        sections.setdefault((q["c"], q["lvl"]), 0)
        sections[(q["c"], q["lvl"])] += 1
    for i, q in enumerate(questions):
        q["order"] = i + 1
    if only:
        c, _, lv = only.partition(":")
        questions = [q for q in questions if q["c"] == c and (not lv or q["lvl"].lower() == lv.lower())]
    if limit:
        questions = questions[:limit]
    return questions, sections, problems, {"margin": margin, "line_gap": line_gap, "right": right}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf")
    ap.add_argument("-o", "--out", required=True, help="where to write the collection JSON (keep it out of git)")
    ap.add_argument("--only", help="limit to one section, e.g. acct:Basic")
    ap.add_argument("--limit", type=int, help="keep only the first N questions (for a test import)")
    ap.add_argument("--report", help="write a plain-text extraction report here")
    ap.add_argument("--name", default="BIWS 400Q")
    ap.add_argument("--short", default="BIWS", help="short label shown on each card")
    ap.add_argument("--source", default="BIWS 400 Investment Banking Interview Questions (your PDF)")
    a = ap.parse_args()
    qs, sections, problems, info = extract(a.pdf, a.only, a.limit)
    pages = sorted({p for q in qs for p in q["pages"]})
    coll = {
        "format": "swipetechs-private-collection", "version": 1, "id": "biws400", "name": a.name, "short": a.short,
        "source": a.source + (f", pp. {pages[0]}–{pages[-1]}" if pages else ""),
        "created": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "count": len(qs), "questions": qs,
    }
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(coll, f, ensure_ascii=False, indent=1)
    lines = [f"Extracted {len(qs)} questions from {a.pdf}",
             f"Layout: left margin {info['margin']}pt, right edge {info['right']:.0f}pt, line gap {info['line_gap']}pt", ""]
    lines += [f"{n:4d}  {SECTION_NAMES.get(c, c)} {lv}".rstrip() for (c, lv), n in sections.items()]
    lines.append(f"{sum(sections.values()):4d}  total in the PDF")
    flagged = [q for q in qs if q["flags"]]
    lines += ["", f"Flagged for a manual check: {len(flagged)}"] + [f"  {q['id']} p.{q['page']} {','.join(q['flags'])}: {q['q'][:70]}" for q in flagged]
    if problems:
        lines += ["", "Problems:"] + ["  " + p for p in problems]
    report = "\n".join(lines)
    if a.report:
        with open(a.report, "w", encoding="utf-8") as f:
            f.write(report + "\n")
    print(report)


if __name__ == "__main__":
    main()
