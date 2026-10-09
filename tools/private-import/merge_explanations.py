#!/usr/bin/env python3
"""Add study aids (simplified explanation, numerical example, updated explanation, similar built-in
questions) to a private collection made by extract_biws.py, without touching the original text.

    python3 merge_explanations.py private/biws-extracted.json private/explanations/*.json -o private/biws-400q.json

Each explanations file is a JSON object keyed by question id:
    {"bw-acct-b01": {"simple": "...", "example": "...", "update": null | {"topic", "why", "text"},
                     "similar": ["a1"], "note": "optional extra note"}}

The original question ("q") and answer ("a") are copied byte for byte; the study aids go under "added",
which the app shows in separate, labelled tabs. Keep every file this writes out of git.
"""
import argparse
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FIELDS = ("simple", "example", "update", "similar", "note")


def core_ids():
    """Ids of the built-in bank (data/*.js), so "similar" can only point at cards that exist."""
    ids = set()
    for f in glob.glob(os.path.join(HERE, "..", "..", "data", "*.js")):
        with open(f, encoding="utf-8") as fh:
            ids.update(re.findall(r'\{id:"([a-z0-9]+)"', fh.read()))
    return ids


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("collection", help="JSON written by extract_biws.py")
    ap.add_argument("explanations", nargs="+", help="one or more explanation files")
    ap.add_argument("-o", "--out", required=True)
    a = ap.parse_args()

    with open(a.collection, encoding="utf-8") as f:
        coll = json.load(f)
    extra = {}
    for path in a.explanations:
        with open(path, encoding="utf-8") as f:
            part = json.load(f)
        clash = set(part) & set(extra)
        if clash:
            sys.exit(f"{path} repeats ids already given: {', '.join(sorted(clash)[:5])}")
        extra.update(part)

    known = core_ids()
    ids = {q["id"] for q in coll["questions"]}
    problems = [f"explanation for unknown id {k}" for k in sorted(set(extra) - ids)]
    counts = {"simple": 0, "example": 0, "update": 0, "similar": 0}
    topics = {}
    for q in coll["questions"]:
        e = extra.get(q["id"])
        if not e:
            problems.append(f"no explanations for {q['id']}")
            continue
        bad = set(e) - set(FIELDS)
        if bad:
            problems.append(f"{q['id']}: unexpected fields {sorted(bad)}")
        upd = e.get("update")
        if upd is not None and not (isinstance(upd, dict) and str(upd.get("text", "")).strip()):
            problems.append(f"{q['id']}: update needs a text")
            upd = None
        sim = [s for s in e.get("similar") or [] if s in known] if known else list(e.get("similar") or [])
        for s in set(e.get("similar") or []) - set(sim):
            problems.append(f"{q['id']}: similar id {s} isn't a built-in card")
        q["added"] = {
            "simple": (e.get("simple") or "").strip(),
            "example": (e.get("example") or "").strip(),
            "update": {k: str(upd.get(k, "")).strip() for k in ("topic", "why", "text")} if upd else None,
            "similar": sim,
        }
        if e.get("note"):
            q["notes"] = (q.get("notes", "") + " " + e["note"].strip()).strip()
        for k in ("simple", "example"):
            counts[k] += bool(q["added"][k])
        counts["update"] += bool(q["added"]["update"])
        counts["similar"] += bool(sim)
        if q["added"]["update"]:
            t = q["added"]["update"]["topic"] or "Updated"
            topics[t] = topics.get(t, 0) + 1

    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(coll, f, ensure_ascii=False, indent=1)
    n = len(coll["questions"])
    print(f"{n} questions: {counts['simple']} simplified, {counts['example']} examples, "
          f"{counts['update']} updated explanations, {counts['similar']} with similar built-in questions")
    for t, k in sorted(topics.items(), key=lambda x: -x[1]):
        print(f"  {k:3d}  {t}")
    if problems:
        print(f"\n{len(problems)} problems:")
        for p in problems:
            print("  " + p)


if __name__ == "__main__":
    main()
