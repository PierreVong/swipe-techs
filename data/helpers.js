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
     body   1–3 short sentences (HTML; <b> highlights a key term)
     exk    "numbers" | "analogy" | "scenario" | "visual" (omit exk and ex on a card the story alone carries)
     ex     the example (HTML: <p>, TB() table, <div class="calc"> lines, or a diagram: WF, BARS, SPLIT, FLOW, VS)
     take   optional one-sentence takeaway (plain text)
     more   {d: deeper explanation (HTML), f: optional formula (plain text)}
     rel    1–3 ids of related interview questions in the main bank (for "Test me")
     k      1–3 concept tags from CHILL_TAGS (Rabbit hole and More like this follow them)
     p      the big idea behind the card, a key of CHILL_IDEAS. Several cards share each idea, each from its own angle,
            so the feed can bring the idea back in a new context (passive repetition)
     iv     optional interview connection, a key of CHILL_IV, shown as a small label ("Interview connection: …")
     hyp    true when the card's company, deal or numbers are made up (shown as "Hypothetical"); never on real stories
     core   true for must-know ideas the feed brings back more often */
window.CHILL_IDEAS = {
  "profit-not-cash": "Profit isn't cash", "growth-needs-cash": "Growth has to be paid for", "tax-shields": "Non-cash costs still save tax",
  "statements-tie": "The three statements always tie", "whole-vs-owners": "Whole business vs what owners get", "claims-ladder": "Lenders get paid before owners",
  "leverage-magnifies": "Debt magnifies wins and losses", "time-value": "A dollar today beats a dollar later", "risk-price": "More risk, higher required return",
  "multiples-shortcut": "A multiple is shorthand for growth and risk", "far-future": "Most value sits far in the future", "control-costs": "Buyers pay up for control",
  "deal-math": "A deal helps EPS only if it earns more than it costs", "every-claim": "Every claim on the shares counts", "expectations": "Prices reflect expectations, not results",
  "assumptions": "A model is only as good as its assumptions"
};
window.CHILL_IV = {
  "three-statements": "Three-statement accounting", "cash-flow": "Cash flow and working capital", "ev-equity": "Enterprise vs equity value",
  "multiples": "Valuation multiples", "comps": "Comps and precedent deals", "methods": "Choosing a valuation method", "dcf": "DCF",
  "wacc": "WACC and cost of capital", "terminal": "Terminal value", "accretion": "Accretion / dilution", "purchase": "Purchase accounting",
  "deal-structure": "Deal structure and financing", "lbo-returns": "LBO returns", "lbo-debt": "LBO debt and leverage",
  "diluted-shares": "Diluted share count", "taxes": "Taxes and deferred taxes", "modeling": "Model building"
};
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
/* Bridges: short hand-picked paths where one concept leads naturally into the next, usually across topics
   (accounting -> LBO -> DCF). Now and then the feed follows one as a connected run; no ids here are required to exist
   in a filtered selection. Each path is 2-3 card ids, in reading order. */
window.CHILL_BRIDGES = [
  ["xa2", "xl26", "xd10"],   // depreciation saves tax -> LBO interest cap -> after-tax cost of debt in WACC
  ["xa16", "xd20"],          // deferred taxes -> past losses (NOLs) add value
  ["xa6", "xa18", "xl33"],   // grocers run on suppliers' money -> growth eats cash -> cash left to repay buyout debt
  ["xa18", "xv32"],          // growth eats working capital -> a fast-growing taco chain runs short
  ["xd4", "xv9", "xl33"],    // free cash flow -> why capex changes multiples -> what can repay LBO debt
  ["xe4", "xe29", "xm32"],   // EV -> a headline deal price is equity value -> cash-free, debt-free small deals
  ["xe15", "xm11"],          // shareholders get equity value -> how takeover premiums are measured
  ["xa10", "xa11", "xm22"],  // goodwill -> impairment costs no cash -> AOL / Time Warner write-off
  ["xa11", "xm20"],          // a goodwill write-down costs no cash -> buyers' "cash EPS"
  ["xl1", "xe26", "xl10"],   // LBO basics -> the club carries the Glazers' debt -> lenders, not the PE firm, take the hit
  ["xl2", "xe31", "xd31"],   // leverage doubles a gain -> a house's equity wiped out -> a car wash's swings
  ["xd10", "xm7", "xm8"],    // after-tax cost of debt -> debt-funded deals can lift EPS -> cash is cheapest
  ["xd5", "xd7", "xv31"],    // terminal value dominates -> growth can't stay high forever -> slower growth, lower multiple
  ["xd8", "xv30", "xl14"],   // rising rates hit far-off cash -> building values fall -> buyouts slow down
  ["xa14", "xe6", "xf16"],   // stock pay isn't free -> count diluted shares -> SBC in a model
  ["xa32", "xv26"],          // "adjusted" profit leaves out stock pay -> add-backs get multiplied in a sale
  ["xa9", "xe30", "xm33"],   // deferred revenue -> prepaid work is debt-like in a deal -> a yoga studio's prepaid members
  ["xa29", "xf6"],           // Starbucks gift cards -> software cash ahead of revenue
  ["xa30", "xd21", "xv16"],  // Netflix burned cash while profitable -> growth needs reinvestment -> growth isn't always value
  ["xa19", "xa33", "xl17"],  // repaying a loan isn't an expense -> the landscaper's cash squeeze -> the LBO cash sweep
  ["xa23", "xl23"],          // PIK interest on the statements -> a PIK loan that grows every year
  ["xe8", "xv24", "xe9"],    // match EV with EBITDA -> one price, three multiples -> debt changes P/E but not EV/EBITDA
  ["xm1", "xv3", "xm13"],    // buyers pay above market -> control premium -> strategic vs PE bidder
  ["xv7", "xd6", "xv22"],    // growth sets the multiple -> pricing cash that never stops -> earnings yield
  ["xl16", "xm13"],          // LBO as a valuation floor -> why strategics can outbid funds
  ["xf8", "xd28"],           // capex below depreciation -> a laundromat's real replacement cost
  ["xa22", "xe22"],          // leases on the balance sheet -> IFRS 16 lifts EBITDA
  ["xe12", "xe25", "xv14"],  // only excess cash comes off EV -> Berkshire's cash -> idle cash skews P/E vs EV/EBITDA
  ["xd27", "xv30"],          // cap rate is a DCF -> the same building reprices when rates rise
  ["xl4", "xf12", "xl5"],    // where buyout returns come from -> modeling the cash sweep -> paper LBO
  ["xa37", "xd4"],           // $10 of depreciation through the statements -> unlevered free cash flow
  ["xa36", "xl33"],          // a shrinking grocer hands supplier cash back -> what's left to repay buyout debt
  ["xa39", "xe30"],          // festival tickets as deferred revenue -> a buyer treats prepaid work like debt
  ["xa35", "xd33"],          // a big order ties up working capital -> building UFCF for a bike shop
  ["xv7", "xd35"],           // growth sets the multiple -> an exit multiple implies a growth rate
  ["xd36", "xm21"],          // later money is worth less -> an earnout bridges a price gap
  ["xe32", "xm32"],          // two cafés, same EV, different asking prices -> a cash-free, debt-free sale
  ["xa14", "xe34", "xe24"],  // stock pay isn't free -> treasury stock method -> a higher offer adds options
  ["xa2", "xe33", "xv24"],   // depreciation -> book depreciation moves P/E, not EV/EBITDA -> one price, three multiples
  ["xv22", "xm3"],           // P/E flipped is an earnings yield -> pricey stock buys cheaper earnings accretively
  ["xa10", "xm35", "xm12"],  // goodwill basics -> purchase price allocation -> goodwill isn't amortized
  ["xe24", "xm25"],          // a takeover adds diluted shares -> the exchange ratio uses them
  ["xa5", "xf31", "xd4"],    // a sale booked, not collected -> paying later moves only cash -> FCF subtracts it
  ["xf32", "xl17"],          // the revolver covers a bad year -> after a buyout, spare cash goes to lenders
  ["xf11", "xf33", "xl17"],  // beginning vs average interest -> Excel's loop settles -> the LBO cash sweep behind it
  ["xv33", "xm11"],          // precedents include a control premium -> how a premium is measured
  ["xv35", "xl16"],          // the football field -> why the LBO bar is the floor
  ["xe4", "xl36"],           // EV = equity + debt - cash -> a seller's owners pocket only equity value
  ["xd4", "xl33", "xl37"]    // UFCF in a DCF -> cash that repays LBO debt -> paydown alone makes 1.75x
];
window.CB = [];
window.CHILL = function (cat, cards) { cards.forEach(function (x) { x.c = cat; window.CB.push(x); }); };
