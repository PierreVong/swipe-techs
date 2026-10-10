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

/* Small diagrams for Chill cards: plain HTML + CSS, no images or libraries. Values only set bar lengths;
   labels are shown exactly as written, so put units and signs in the label text.
     WF(rows)      bridge / waterfall: [label, value, "base" | "add" | "sub" | "total", shown?]
     BARS(rows)    comparison bars: [label, value, shown?, highlight?] (negative values draw in red)
     SPLIT(rows)   one 100% bar with a legend: [label, value, shown?]
     FLOW(steps)   steps joined by arrows: ["Revenue", "EBITDA", ...] (a step can be [title, small note])
     VS(a, b)      two columns: {t: title, p: [short lines]} */
(function () {
  var fmt = function (r, i) { return r[i] != null ? r[i] : String(r[1]); };
  window.WF = function (rows) {
    var run = 0, segs = rows.map(function (r) {
      var k = r[2] || "add", v = Math.abs(r[1]), lo, hi;
      if (k === "base" || k === "total") { lo = 0; hi = v; run = v; }
      else if (k === "sub") { hi = run; lo = run - v; run = lo; }
      else { lo = run; hi = run + v; run = hi; }
      return { r: r, k: k, lo: lo, hi: hi };
    });
    var max = Math.max.apply(null, segs.map(function (s) { return s.hi; })) || 1;
    return '<div class="viz wf" role="img" aria-label="' + rows.map(function (r) { return r[0] + " " + fmt(r, 3); }).join(", ") + '">' + segs.map(function (s) {
      return '<div class="wr ' + s.k + '"><span class="wl">' + s.r[0] + '</span><span class="wt"><i style="left:' + (100 * s.lo / max).toFixed(1) + '%;width:' + Math.max(1.5, 100 * (s.hi - s.lo) / max).toFixed(1) + '%"></i></span><span class="wv">' + fmt(s.r, 3) + '</span></div>';
    }).join("") + '</div>';
  };
  window.BARS = function (rows) {
    var max = Math.max.apply(null, rows.map(function (r) { return Math.abs(r[1]); })) || 1;
    return '<div class="viz bars" role="img" aria-label="' + rows.map(function (r) { return r[0] + " " + fmt(r, 2); }).join(", ") + '">' + rows.map(function (r) {
      return '<div class="wr' + (r[3] ? " hi" : "") + (r[1] < 0 ? " neg" : "") + '"><span class="wl">' + r[0] + '</span><span class="wt"><i style="width:' + Math.max(1.5, 100 * Math.abs(r[1]) / max).toFixed(1) + '%"></i></span><span class="wv">' + fmt(r, 2) + '</span></div>';
    }).join("") + '</div>';
  };
  window.SPLIT = function (rows) {
    var tot = rows.reduce(function (a, r) { return a + Math.abs(r[1]); }, 0) || 1;
    return '<div class="viz split" role="img" aria-label="' + rows.map(function (r) { return r[0] + " " + fmt(r, 2); }).join(", ") + '"><div class="sb">' + rows.map(function (r, i) {
      return '<i class="s' + i + '" style="flex:' + Math.abs(r[1]) + '"></i>';
    }).join("") + '</div><div class="sl">' + rows.map(function (r, i) {
      return '<span><b class="s' + i + '"></b>' + r[0] + ' <em>' + fmt(r, 2) + '</em></span>';
    }).join("") + '</div></div>';
  };
  window.FLOW = function (steps) {
    return '<div class="viz flow">' + steps.map(function (x) {
      return Array.isArray(x) ? '<span class="st">' + x[0] + '<small>' + x[1] + '</small></span>' : '<span class="st">' + x + '</span>';
    }).join('<span class="ar" aria-hidden="true">→</span>') + '</div>';
  };
  window.VS = function (a, b) {
    var col = function (x) { return '<div class="vc"><div class="vt">' + x.t + '</div>' + x.p.map(function (l) { return '<p>' + l + '</p>'; }).join("") + '</div>'; };
    return '<div class="viz vs">' + col(a) + col(b) + '</div>';
  };
})();

/* Chill Mode concept cards: a passive feed, separate from the question bank and its progress.
   Each data/chill/<topic>.js calls CHILL(category, [cards]). Card fields:
     id     stable id: "x" + topic letter + number, e.g. "xa1" (never change or reuse: seen/saved state is keyed on it)
     t      "concept" | "intuition" | "example" | "fact" | "real" | "myth" | "analogy" | "scenario" (you're in the room: what happens?)
     hook   the opener (plain text): a question, a bold statement, a number or a story start. Myth cards state the claim itself.
     v      myth cards only: "Myth" | "Partly true" | "True"
     stat   optional headline number shown big above the hook: {n: "75%", l: "short label, up to 8 words"} (plain text)
     body   1–2 short sentences (HTML; <b> highlights a key term)
     exk    "numbers" | "analogy" | "scenario" | "visual"
     ex     the example (HTML: <p>, TB() table, <div class="calc"> lines, or a diagram: WF, BARS, SPLIT, FLOW, VS)
     take   one-sentence takeaway (plain text)
     more   {d: deeper explanation (HTML), f: optional formula (plain text)}
     rel    1–3 ids of related interview questions in the main bank (for "Test me")
     k      1–3 concept tags from CHILL_TAGS (Rabbit hole and More like this follow them)
     core   true for must-know ideas the feed brings back more often */
window.CHILL_TAGS = {
  "three-statements": "The three statements", "cash-vs-profit": "Cash vs profit", "depreciation": "Depreciation", "working-capital": "Working capital",
  "deferred-revenue": "Deferred revenue", "deferred-tax": "Deferred taxes", "goodwill": "Goodwill", "leases": "Leases", "sbc": "Stock-based pay",
  "inventory": "Inventory", "debt-accounting": "Debt on the statements", "ev-bridge": "The EV bridge", "equity-value": "Equity value",
  "dilution": "Share dilution", "multiples": "Multiples", "comps": "Comparable companies", "precedents": "Precedent deals",
  "valuation-methods": "Valuation methods", "control-premium": "Control premiums", "fcf": "Free cash flow", "wacc": "WACC",
  "cost-of-equity": "Cost of equity", "terminal-value": "Terminal value", "discounting": "Discounting", "accretion-dilution": "Accretion / dilution",
  "synergies": "Synergies", "purchase-accounting": "Purchase accounting", "deal-structure": "Deal structure", "deal-financing": "Paying for a deal",
  "leverage": "Leverage", "returns": "IRR & MOIC", "debt-paydown": "Paying down debt", "exit": "Exits", "debt-types": "Kinds of debt",
  "modeling": "Model building", "circularity": "Circular references", "scenarios": "Scenarios", "taxes": "Taxes",
  "capital-structure": "Capital structure", "risk-return": "Risk & return"
};
window.CB = [];
window.CHILL = function (cat, cards) { cards.forEach(function (x) { x.c = cat; window.CB.push(x); }); };
