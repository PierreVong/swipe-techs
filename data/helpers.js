/* Question bank helpers. Each data file calls Q(category, [cards]).
   Card fields:
     id     stable id (never change: progress is keyed on it)
     l      level 1 Beginner, 2 Intermediate, 3 Advanced
     k      "concept" | "math" | "3s" (three-statement walkthrough)
     q      question
     o, a   optional multiple-choice options and index of the right one
     n      optional typed answer for Interview Mode on open number questions: {v: value, u: "%"|"x"|"$"|"", ap: 1 if approximate}
     quick  interview-ready answer (HTML). Starts with a one-sentence <p> lead; then optional
            <ol class="steps">, <ul>, <div class="formula"> or <ul class="s3q"> (IS / CFS / BS lines)
     detail detailed explanation (HTML)
     ex     numerical example (HTML, optional)
     fu     follow-ups: [[question, answer HTML], ...]
     top    1 if in the "Top 100" collection */
window.QB = [];
window.Q = function (cat, cards) { cards.forEach(function (q) { q.c = cat; window.QB.push(q); }); };
/* Three-statement walkthrough table. */
window.S3 = function (is, cfs, bs) {
  return '<table class="s3"><tr><th>IS</th><td>' + is + '</td></tr><tr><th>CFS</th><td>' + cfs + '</td></tr><tr><th>BS</th><td>' + bs + '</td></tr></table>';
};
/* Simple two-column table: [[label, value], ...]. */
window.TB = function (rows) {
  return '<table class="kv">' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join("") + '</table>';
};

/* Chill Mode concept cards: a passive feed, separate from the question bank and its progress.
   Each data/chill/<topic>.js calls CHILL(category, [cards]). Card fields:
     id     stable id: "x" + topic letter + number, e.g. "xa1" (never change or reuse: seen/saved state is keyed on it)
     t      "concept" | "intuition" | "example" | "fact" | "real" | "myth"
     hook   the curiosity question or statement (plain text)
     v      myth cards only: "Myth" | "Partly true" | "True"
     body   2–4 short sentences (HTML; <b> highlights a key term)
     exk    "numbers" | "analogy" | "scenario"
     ex     the example (HTML: <p>, TB() table, or <div class="calc"> lines)
     take   one-sentence takeaway (plain text)
     more   {d: deeper explanation (HTML), f: optional formula (plain text)}
     rel    1–3 ids of related interview questions in the main bank (for "Test me") */
window.CB = [];
window.CHILL = function (cat, cards) { cards.forEach(function (x) { x.c = cat; window.CB.push(x); }); };
