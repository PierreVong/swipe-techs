/* Swipe Techs UI: feed, card flow, modes, collections, dashboard. Depends on js/srs.js, js/chill.js, js/private.js and data/*.js. */
(async function () {
  "use strict";
  const S = window.SRS;
  const P = window.PRIV;
  const BANK = window.QB;
  // A private collection imported on this device (Settings), kept apart from the built-in bank: own ids, own progress section.
  const priv = await P.ready;
  const PCOLL = priv.coll;
  const PBANK = PCOLL ? P.toCards(PCOLL) : [];
  const SIM = P.simMap(PBANK);
  const byId = Object.fromEntries(BANK.concat(PBANK).map(q => [q.id, q]));
  const CATS = {
    acct: { name: "Accounting" }, ev: { name: "EV & Equity Value", short: "EV & Equity" },
    val: { name: "Valuation" }, dcf: { name: "DCF" }, ma: { name: "M&A" }, lbo: { name: "LBO" },
    model: { name: "Financial Modeling", short: "Modeling" }, math: { name: "Mental Math" },
  };
  const CORE_CATS = Object.keys(CATS);
  if (PBANK.some(q => q.c === "brain")) CATS.brain = { name: "Brain Teasers", short: "Brain teasers" };
  const LEVELS = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
  const KINDS = { concept: "Concept", math: "Numbers", "3s": "3-Statement" };
  const RATES = ["Didn't know", "Partially", "Nailed it"];
  const INTERVIEW_N = 12;
  const DAY = S.DAY;

  const $ = sel => document.querySelector(sel);
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const storage = (() => { try { const k = "__st"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return localStorage; } catch (e) { return null; } })();

  let st = S.load(storage, Date.now());
  const persist = () => S.save(storage, st);

  // Chill Mode: passive concept cards with their own seen/saved store (never touches study progress).
  const CH = window.CHILLS;
  const CBANK = window.CB || [];
  const chillById = Object.fromEntries(CBANK.map(x => [x.id, x]));
  const CHILL_META = Object.fromEntries(CBANK.map(x => [x.id, { c: x.c, t: x.t, x: x.exk, k: x.k || [], core: !!x.core }]));
  const CHILL_TAGS = window.CHILL_TAGS || {};
  const CHILL_CATS = ["acct", "ev", "val", "dcf", "ma", "lbo", "model"].filter(c => CBANK.some(x => x.c === c));
  const CTYPES = { concept: ["💡", "Concept"], intuition: ["🧠", "Intuition"], example: ["🧮", "Quick example"], fact: ["😮", "Surprising"], real: ["🌍", "Real world"], myth: ["🤔", "Myth check"], analogy: ["🧩", "Analogy"], scenario: ["🎬", "Scenario"] };
  const EXK = { numbers: "Quick numbers", analogy: "Think of it like this", scenario: "Picture this", visual: "At a glance" };
  let ch = CH.load(storage);
  const persistChill = () => CH.save(storage, ch);

  // Stable order for new cards: Top 100 first, easier first, otherwise shuffled (same order every visit).
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const ORDER = {};
  BANK.slice().sort((a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0) || a.l - b.l || hash(a.id) - hash(b.id)).forEach((q, i) => { ORDER[q.id] = i / BANK.length; });
  // Private questions keep the guide's order within each section, with the sections interleaved
  // (so "all topics" mixes them) and spread evenly among the built-in ones when both are on.
  Object.assign(ORDER, P.mixOrder(PBANK));

  // Question source: built-in (core), the private collection (priv) or both.
  const src = () => PBANK.length && (st.prefs.src === "priv" || st.prefs.src === "both") ? st.prefs.src : "core";
  const pool = (s = src()) => s === "priv" ? PBANK : s === "both" ? BANK.concat(PBANK) : BANK;
  const srcName = s => s === "priv" ? PCOLL.name : s === "both" ? `Swipe Techs + ${PCOLL.short}` : "Swipe Techs";
  const PATH_NAMES = { seq: "Sequential", shuffle: "Shuffle", srs: "Spaced repetition" };
  function privPrefs() {
    const p = st.prefs.priv && typeof st.prefs.priv === "object" ? st.prefs.priv : (st.prefs.priv = {});
    if (!P.PATHS.includes(p.path)) p.path = "seq";
    if (!Array.isArray(p.cats)) p.cats = [];
    if (!Array.isArray(p.lvls) || !p.lvls.length) p.lvls = [1, 3];
    if (!p.cur || typeof p.cur !== "object") p.cur = {};
    return p;
  }
  const secName = q => `${CATS[q.c].short || CATS[q.c].name}${q.lvl && q.c !== "brain" ? " " + q.lvl : ""}`;
  const pageRef = q => q.pages.length > 1 ? `pp. ${q.pages[0]}–${q.pages[q.pages.length - 1]}` : q.page ? `p. ${q.page}` : "";

  const ICON_BM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
  const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const ICON_EYE = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const ICON_MIC = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  const ICON_CLOCK = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>';
  const ICON_CHECK = '<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  // ---------- numeric answers (Interview Mode) ----------
  // A card's number comes from an explicit n:{v,u,ap} or from the right option of a numbers quiz ("≈44%", "$2,300", "8.0x").
  function parseNum(t) {
    const raw = String(t);
    const s = raw.trim().replace(/[≈~]/g, "").replace(/−/g, "-").replace(/,/g, "").trim();
    const m = s.match(/^([+-]?)\s*(\$?)\s*(\d+(?:\.\d+)?)\s*(%|x|years?)?$/i);
    if (!m) return null;
    const u = m[2] ? "$" : (m[4] || "").toLowerCase().replace(/^year$/, "years");
    return { v: (m[1] === "-" ? -1 : 1) * parseFloat(m[3]), u, ap: /[≈~]/.test(raw) };
  }
  function numAnswer(q) {
    if (q.n) return { v: q.n.v, u: q.n.u || "", ap: !!q.n.ap, others: [] };
    if (q.k !== "math" || !q.o) return null;
    const r = parseNum(q.o[q.a]);
    if (!r) return null;
    r.others = q.o.map(parseNum).filter((x, i) => x && i !== q.a).map(x => x.v);
    return r;
  }
  // Close enough: rounding for exact answers, a few percent (or 1 point) for estimates, never as close to a wrong option.
  function checkNum(n, x) {
    let tol = n.ap ? Math.max(Math.abs(n.v) * 0.03, n.u === "%" ? 1 : 0) : Math.max(Math.abs(n.v) * 0.005, n.u === "%" ? 0.05 : 0);
    n.others.forEach(o => { tol = Math.min(tol, Math.abs(o - n.v) * 0.45); });
    if (Math.abs(x - n.v) <= tol + 1e-9) return true;
    return n.u === "%" && Math.abs(x) < 1 && Math.abs(x * 100 - n.v) <= tol + 1e-9;   // typed 0.44 for 44%
  }
  const readNum = t => { const v = parseFloat(String(t).replace(/[−–]/g, "-").replace(/[$,%x\s]/gi, "")); return Number.isFinite(v) ? v : null; };
  const fmtNum = (n, v, approx) => (approx ? "≈" : "") + (v < 0 ? "−" : "") + (n.u === "$" ? "$" : "") +
    Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: !approx ? 4 : Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2 }) +
    (n.u === "years" ? " years" : n.u === "$" ? "" : n.u);

  // How a card is answered: quiz options, typed number, out loud (interview), or think-then-reveal.
  function styleOf(q) {
    if (mode !== "interview") return q.o ? "mc" : "open";
    if (numAnswer(q)) return "num";
    if (q.o && /\bthese\b|mismatched|…$/.test(q.q)) return "mc";      // the question only makes sense with its options
    return "talk";
  }

  // ---------- session ----------
  const feed = $("#feed");
  let mode = ["foryou", "topic", "weak", "top100", "bookmarks", "chill"].includes(st.prefs.mode) || (st.prefs.mode === "priv" && PBANK.length) ? st.prefs.mode : "foryou";
  let slides = [];        // {kind:"card"|"chill"|"end"|"summary", id, seq, el, state, suggest, rating, t0, ms}
  let cur = 0;
  let ended = false;
  let interview = null;   // {ids, next, results:{id:{r,ms}}, saved}
  let timer = null;
  let chillSaved = false; // Chill feed limited to saved concepts
  let chillSession = [];  // concepts shown since the app opened, so a session doesn't repeat itself
  let chillQueue = [];    // concepts to show next before the picker: the card to resume on, or a Rabbit hole
  let chillChipAt = -99;  // session position of the last card that offered a Rabbit hole on its face
  let drill = null;       // {ids, next}: "Test me" from a Chill card
  let dwell = null, curEl = null;
  let privShuffle = null; // this session's shuffled order for the private collection

  function candidates() {
    const p = st.prefs;
    if (mode === "topic") return pool().filter(q => inTopic(p, q)).map(q => q.id);
    if (mode === "bookmarks") return st.bookmarks.filter(id => byId[id]);
    if (mode === "top100") return BANK.filter(q => q.top).map(q => q.id);
    return pool().map(q => q.id);
  }

  function nextCardId() {
    if (mode === "interview") return interview.next < interview.ids.length ? interview.ids[interview.next++] : null;
    if (mode === "drill") return drill.next < drill.ids.length ? drill.ids[drill.next++] : null;
    const pending = new Set(slides.slice(cur).filter(s => s.kind === "card" && s.state !== "rated").map(s => s.id));
    const recent = slides.filter(s => s.kind === "card").slice(-6).map(s => s.id);
    if (mode === "priv") return nextPriv(pending, recent);
    let ids = candidates();
    // Near-identical questions from the two banks never come back to back.
    if (PBANK.length) { const b = P.blocked(SIM, recent.slice(-3)); const ok = ids.filter(id => !b.has(id)); if (ok.length) ids = ok; }
    return S.pickNext(st, ids, { pos: st.seq, now: Date.now(), order: ORDER, exclude: pending, recent, mode: mode === "weak" ? "weak" : "foryou" });
  }

  // Private collection paths: Sequential (guide order, resumes where you stopped), Shuffle, or Spaced repetition.
  const privIds = () => { const f = privPrefs(); return PBANK.filter(q => P.inFilter(q, f)).map(q => q.id); };
  function nextPriv(pending, recent) {
    const f = privPrefs(), ids = privIds();
    if (!ids.length) return null;
    if (f.path === "srs") return S.pickNext(st, ids, { pos: st.seq, now: Date.now(), order: ORDER, exclude: pending, recent, mode: "foryou" });
    // Sequential and Shuffle still bring a missed question back a few cards later.
    const justSeen = new Set(recent.slice(-2));
    const learn = ids.filter(id => { const c = S.get(st, id); return c && c.dueN != null && c.dueN <= st.seq && !justSeen.has(id) && !pending.has(id); })
      .sort((a, b) => S.get(st, a).dueN - S.get(st, b).dueN);
    if (learn.length) return learn[0];
    const taken = new Set(slides.filter(s => s.kind === "card").map(s => s.id));
    if (f.path === "seq") return P.seqNext(ids.map(id => byId[id]), f.cur, taken);
    if (!privShuffle) privShuffle = shuffle(ids.slice());
    return privShuffle.find(id => !taken.has(id)) || null;
  }

  function chillIds() {
    if (chillSaved) return ch.bm.filter(id => chillById[id]);
    return CBANK.filter(x => !ch.cats.length || ch.cats.includes(x.c)).map(x => x.id);
  }
  function appendChill() {
    const ids = chillIds();
    // Saved concepts play through once; the main feed keeps going.
    let q = null;
    while (chillQueue.length && !q) { const x = chillQueue.shift(); if (chillById[x.id]) q = x; }
    const id = q ? q.id : chillSaved && ids.every(x => slides.some(s => s.id === x)) ? null : CH.pick(ch, ids, { session: chillSession, meta: CHILL_META, now: Date.now() });
    if (!id) { appendEnd(); return false; }
    const prev = chillSession[chillSession.length - 1];
    const s = { kind: "chill", id, first: !chillSession.length && !chillSaved, rh: q && q.rh };
    // Builds on the card before it: a short connected run from the picker (Rabbit holes have their own badge).
    if (!q && !chillSaved && prev !== id && CH.linked(CHILL_META[prev], CHILL_META[id])) s.link = true;
    // Now and then (a must-know idea, at most every fifth card) the card itself offers a Rabbit hole.
    if (!q && !chillSaved && !s.first && chillById[id].core && chillSession.length - chillChipAt >= 5) s.chip = true;
    if (prev !== id) chillSession.push(id);
    const chipBefore = chillChipAt;
    s.el = renderChill(s);
    feed.append(s.el); slides.push(s); observer.observe(s.el);
    // Go deeper is a bonus: drop it if it would make the card scroll on this screen.
    const chip = s.el.querySelector(".rh-chip"), sc = s.el.querySelector(".card-scroll");
    if (chip && sc.scrollHeight > sc.clientHeight + 2) { chip.remove(); s.chip = false; chillChipAt = chipBefore; }
    return true;
  }

  function append() {
    if (ended) return false;
    if (mode === "chill") return appendChill();
    const id = nextCardId();
    if (!id) { appendEnd(); return false; }
    const s = { kind: "card", id, seq: st.seq++, state: "ask", style: styleOf(byId[id]) };
    s.el = renderCard(s);
    feed.append(s.el); slides.push(s); observer.observe(s.el);
    persist();
    return true;
  }
  function ensureAhead() { while (!ended && slides.length - cur - 1 < 2) if (!append()) break; }

  function appendEnd() {
    ended = true;
    const s = { kind: mode === "interview" ? "summary" : "end" };
    s.el = document.createElement("section"); s.el.className = "slide";
    if (s.kind === "summary") s.el.innerHTML = `<article class="card panel" style="--topic: var(--accent)"><div class="card-scroll"></div></article>`;
    else s.el.innerHTML = endHTML();
    feed.append(s.el); slides.push(s); observer.observe(s.el);
  }

  function endHTML() {
    if (mode === "chill") return `<article class="card panel" style="--topic: var(--accent)"><div class="card-scroll">
      <h2 class="q">${chillSaved ? (ch.bm.length ? "That's all your saved concepts." : "No saved concepts yet.") : "Nothing in this selection."}</h2>
      <p class="think">${chillSaved ? "Tap the bookmark on any Chill card to keep it here." : "Pick another topic or go back to the mixed feed."}</p>
      <div class="rowbtns"><button class="primary" data-act="chill">Back to the Chill feed</button></div>
    </div></article>`;
    if (mode === "drill") return `<article class="card panel" style="--topic: var(--accent)"><div class="card-scroll">
      <h2 class="q">Nice. That's the related question${drill.ids.length > 1 ? "s" : ""}.</h2>
      <p class="think">Your answer counts toward your normal study progress.</p>
      <div class="rowbtns"><button class="primary" data-act="chill">Back to Chill 🌙</button><button class="ghost" data-act="foryou">Keep studying</button></div>
    </div></article>`;
    if (mode === "priv") {
      const f = privPrefs(), n = privIds().length;
      const msg = !n ? ["No questions match.", "Pick at least one section on the collection page."]
        : f.path === "seq" ? ["You've reached the end of this selection.", "Start over from the first question, or switch to Spaced repetition to review what's due."]
          : ["That's every question in this shuffle.", "Shuffle again, or switch to Spaced repetition to review what's due."];
      return `<article class="card panel" style="--topic: var(--accent)"><div class="card-scroll" style="justify-content:center">
      <h2 class="q">${msg[0]}</h2><p class="think">${msg[1]}</p>
      <div class="rowbtns">${n ? `<button class="primary" data-act="priv-again">${f.path === "seq" ? "Start over" : "Shuffle again"}</button>` : ""}<button class="ghost" data-act="priv">Collection page</button></div>
    </div></article>`;
    }
    const msg = {
      weak: ["Nothing to review right now.", "Cards you rate Didn't know or Partially show up here until you nail them consistently."],
      bookmarks: ["No bookmarks yet.", "Tap the bookmark on any card to save it to this collection."],
      topic: ["No cards match these filters.", "Pick at least one category and level."],
    }[mode] || ["You're all caught up.", "Nothing new or due in this selection."];
    return `<article class="card panel" style="--topic: var(--accent)"><div class="card-scroll" style="justify-content:center">
      <h2 class="q">${msg[0]}</h2><p class="think">${msg[1]}</p>
      <div class="rowbtns"><button class="primary" data-act="foryou">Go to For You</button>${mode === "topic" ? '<button class="ghost" data-act="topic">Change topics</button>' : ""}</div>
    </div></article>`;
  }

  // ---------- card rendering ----------
  function badgesFor(q) {
    const out = [];
    if (mode === "interview") out.push(`<span class="badge">Q${interview.ids.indexOf(q.id) + 1} of ${interview.ids.length}</span>`);
    else {
      const c = S.get(st, q.id);
      if (!S.isSeen(c)) out.push('<span class="badge new">New</span>');
      else if (S.isWeak(c)) out.push('<span class="badge weak">Weak</span>');
      else if (c.dueN != null) out.push('<span class="badge due">Again</span>');
      else if (c.dueT != null && c.dueT <= Date.now()) out.push('<span class="badge due">Due</span>');
    }
    if (q.top && mode !== "top100") out.push('<span class="badge top">Top 100</span>');
    return out.join("");
  }

  function renderCard(s) {
    const q = byId[s.id];
    const el = document.createElement("section");
    el.className = "slide";
    const bm = st.bookmarks.includes(q.id);
    const size = q.q.length <= 60 ? "qs" : q.q.length <= 110 ? "qm" : "ql";     // shorter questions set larger
    let body = "";
    if (s.style === "mc") body = `<div class="opts">${q.o.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join("")}</div>`;
    else if (s.style === "num") {
      const n = numAnswer(q);
      const suf = n.u === "years" ? "years" : n.u === "$" ? "" : n.u;
      body = `<form class="numform" novalidate>
        <div class="numrow">
          <button type="button" class="sign" aria-label="Make negative or positive">±</button>
          <label class="numbox">${n.u === "$" ? '<span class="aff">$</span>' : ""}<input class="numin" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="Answer" aria-label="Your answer${suf ? " in " + esc(suf === "%" ? "percent" : suf === "x" ? "times" : suf) : ""}">${suf ? `<span class="aff">${esc(suf)}</span>` : ""}</label>
          <button type="submit" class="check">Check</button>
        </div>
        <p class="think">${ICON_MIC}<span>Talk through the math out loud, then enter your number.</span></p>
      </form>`;
    } else if (s.style === "talk") body = `<p class="think">${ICON_MIC}<span>Answer out loud as if you're in the room, then reveal.</span></p>`;
    else body = `<p class="think">Answer in your head, then tap to check.</p>`;
    const kind = q.src === "priv" ? `<span class="dot">·</span><span class="srctag">${esc(PCOLL.short)} #${q.num}${q.page ? " · p." + q.page : ""}</span>`
      : q.k !== "concept" ? `<span class="dot">·</span><span>${KINDS[q.k]}</span>` : "";
    const lvl = q.src === "priv" ? esc(q.lvl || "Brain teaser") : LEVELS[q.l];
    el.innerHTML = `<article class="card ask ${size}${q.src === "priv" ? " pv" : ""}" style="--topic: var(--t-${q.c})" aria-label="${esc(CATS[q.c].name)} question">
      <div class="card-head">
        <div class="meta"><span class="cat">${esc(CATS[q.c].name)}</span><span class="dot">·</span><span>${lvl}</span>${kind}${badgesFor(q)}</div>
        <button class="bm" aria-pressed="${bm}" aria-label="Bookmark this card" title="Bookmark">${ICON_BM}</button>
      </div>
      <div class="card-scroll">
        <div class="ask-group">
          <h2 class="q">${esc(q.q)}</h2>
          ${body}
        </div>
        <div class="answer" hidden></div>
      </div>
      <div class="foot">${footAsk(s)}</div>
    </article>`;
    return el;
  }

  // ---------- Chill cards ----------
  function renderChill(s) {
    const x = chillById[s.id];
    const el = document.createElement("section");
    el.className = "slide";
    const saved = ch.bm.includes(x.id);
    const seenBefore = ch.seen[x.id];
    const ty = CTYPES[x.t] || CTYPES.concept;
    const exBlock = `<div class="cex ${x.exk}"><div class="lbl">${EXK[x.exk] || "Example"}</div><div class="prose">${x.ex}</div></div>`;
    const verdict = x.t === "myth" ? `<span class="verdict-pill v-${x.v === "Myth" ? "no" : x.v === "True" ? "ok" : "mid"}">${esc(x.v)}</span>` : "";
    const body = `<div class="explain prose">${x.body}</div>`;
    // Vary the layout: numbers, diagrams and analogies lead on their cards; everything else explains first.
    const main = x.t === "example" || x.t === "analogy" || x.exk === "visual" ? exBlock + body : body + exBlock;
    const stat = x.stat ? `<div class="stat"><b>${esc(x.stat.n)}</b><span>${esc(x.stat.l)}</span></div>` : "";
    const hook = x.t === "myth" ? `<h2 class="hook claim">“${esc(x.hook.replace(/[.!]$/, ""))}”</h2>` : `<h2 class="hook">${esc(x.hook)}</h2>`;
    const rel = (x.rel || []).filter(id => byId[id]);
    const rabbit = chillSaved ? [] : rabbitIds(x.id);
    if (s.chip && rabbit.length < 3) s.chip = false;
    if (s.chip) chillChipAt = chillSession.lastIndexOf(x.id);
    const more = `<div class="more-body" hidden>
        <div class="prose">${x.more.d}</div>
        ${x.more.f ? `<div class="prose"><div class="formula">${esc(x.more.f)}</div></div>` : ""}
        ${rel.length ? `<div class="iq"><div class="lbl">Related interview question</div><p>${esc(byId[rel[0]].q)}</p></div>` : ""}
        <div class="more-acts">
          ${rabbit.length ? `<button class="rh-btn"><span aria-hidden="true">🕳️</span> Rabbit hole <small>${rabbit.length} related</small></button>` : ""}
          <button class="like-btn" aria-pressed="${!!ch.like[x.id]}"><span aria-hidden="true">👍</span> More like this</button>
        </div>
      </div>`;
    el.innerHTML = `<article class="card chill-card t-${x.t}${x.stat ? " has-stat" : ""}" style="--topic: var(--t-${x.c})" aria-label="${esc(CATS[x.c].name)} concept">
      <div class="card-head">
        <div class="meta"><span class="cat">${esc(CATS[x.c].name)}</span><span class="dot">·</span><span class="ctype"><span aria-hidden="true">${ty[0]}</span> ${ty[1]}</span>${verdict}${s.rh ? `<button class="badge rh rh-exit" aria-label="Rabbit hole ${s.rh.i} of ${s.rh.n}. Leave the Rabbit hole">🕳️ ${s.rh.i} of ${s.rh.n} <span aria-hidden="true">✕</span></button>` : s.link ? '<span class="badge linked">🔗 Builds on the last one</span>' : seenBefore ? '<span class="badge">Seen before</span>' : ""}</div>
      </div>
      <div class="card-scroll">
        <div class="chill-body">
          ${stat}${hook}
          ${main}
          <div class="take"><div class="lbl">Takeaway</div><p>${esc(x.take)}</p></div>
          ${s.chip ? `<button class="rh-chip"><span aria-hidden="true">🕳️</span> Go deeper <small>${rabbit.length} related ideas</small></button>` : ""}
          ${s.first ? '<p class="swipe-hint" aria-hidden="true">Swipe up for the next one</p>' : ""}
          ${more}
        </div>
      </div>
      <div class="foot chill-foot">
        <button class="more-btn" aria-expanded="false"><span>Learn more</span>${ICON_CHEV}</button>
        <button class="bm" aria-pressed="${saved}" aria-label="Save this concept" title="Save">${ICON_BM}</button>
        ${rel.length ? `<button class="try-btn" title="Answer a related interview question in study mode">Test me <span aria-hidden="true">→</span></button>` : ""}
      </div>
    </article>`;
    return el;
  }

  function toggleMore(s) {
    const b = s.el.querySelector(".more-btn"), body = s.el.querySelector(".more-body");
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", open); body.hidden = !open;
    b.querySelector("span").textContent = open ? "Show less" : "Learn more";
    if (open) { markChillSeen(s); CH.interest(ch, s.id); persistChill(); const sc = s.el.querySelector(".card-scroll"); sc.scrollTo({ top: body.offsetTop - sc.offsetTop - 12, behavior: reduced() ? "auto" : "smooth" }); }
  }
  // Rabbit hole: related concepts (shared tags, any topic) not already shown this session.
  function rabbitIds(id) {
    const done = new Set(chillSession);
    return CH.related(ch, id, CBANK.map(x => x.id).filter(x => !done.has(x)), CHILL_META, 4);
  }
  function startRabbit(s) {
    const ids = rabbitIds(s.id);
    if (!ids.length) return;
    CH.interest(ch, s.id); persistChill();
    // Drop the cards already lined up after this one, then put the related concepts next.
    slides.splice(cur + 1).forEach(x => { observer.unobserve(x.el); x.el.remove(); const k = chillSession.lastIndexOf(x.id); if (k > -1) chillSession.splice(k, 1); });
    ended = false;
    chillQueue = ids.map((id, i) => ({ id, rh: { i: i + 1, n: ids.length } }));
    ensureAhead();
    announce(`Rabbit hole: ${ids.length} related concepts next`);
    goTo(cur + 1);
  }
  // Leave a Rabbit hole: drop the related cards still lined up and carry on with the normal feed.
  function leaveRabbit(s) {
    chillQueue = chillQueue.filter(x => !x.rh);
    slides.splice(cur + 1).forEach(x => { observer.unobserve(x.el); x.el.remove(); const k = chillSession.lastIndexOf(x.id); if (k > -1) chillSession.splice(k, 1); });
    slides.filter(x => x.rh).forEach(x => { x.rh = null; const b = x.el.querySelector(".rh-exit"); if (b) b.remove(); });
    ended = false;
    ensureAhead();
    announce("Back to your feed");
    goTo(cur + 1);
  }
  // One-time hint, on the third Chill card: double tap means More like this.
  function tipDoubleTap(s) {
    if (ch.tips.dt || chillSaved || chillSession.indexOf(s.id) < 2) return;
    ch.tips.dt = Date.now(); persistChill();
    if (Object.keys(ch.like).length) return;   // already found it
    const tip = document.createElement("div"); tip.className = "tip-dt"; tip.setAttribute("role", "status");
    tip.innerHTML = '<span class="taps" aria-hidden="true">👆</span><span>Double-tap a card you like<br><small>to see more like it</small></span>';
    s.el.querySelector(".card").append(tip);
    const off = () => { tip.classList.add("out"); setTimeout(() => tip.remove(), 400); };
    tip.addEventListener("click", off); setTimeout(off, 5000);
  }
  // More like this: from the button in Learn more, or a double tap on the card (which only ever turns it on).
  function likeChill(s, on) {
    const now = !!ch.like[s.id];
    if (on === now) return;
    CH.toggleLike(ch, s.id, Date.now()); persistChill();
    slides.filter(x => x.id === s.id && x.kind === "chill").forEach(x => { const b = x.el.querySelector(".like-btn"); if (b) b.setAttribute("aria-pressed", on); });
    if (on) {
      const pop = document.createElement("span"); pop.className = "likepop"; pop.setAttribute("aria-hidden", "true"); pop.textContent = "👍";
      s.el.querySelector(".card").append(pop); setTimeout(() => pop.remove(), 900);
    }
    announce(on ? "More like this" : "Removed");
  }
  function toggleChillBm(s) {
    const on = CH.toggleBm(ch, s.id); persistChill();
    slides.filter(x => x.id === s.id && x.kind === "chill").forEach(x => x.el.querySelector(".bm").setAttribute("aria-pressed", on));
    announce(on ? "Saved" : "Removed from saved");
  }
  function markChillSeen(s) {
    if (s.counted) return;
    s.counted = true; CH.markSeen(ch, s.id, Date.now()); persistChill();
  }
  // "Test me": answer the related interview question(s) as normal study cards, then come back.
  function startDrill(s) {
    const ids = (chillById[s.id].rel || []).filter(id => byId[id]);
    if (!ids.length) return;
    markChillSeen(s); CH.interest(ch, s.id); persistChill();
    mode = "drill"; interview = null; drill = { ids, next: 0, from: s.id };
    rebuild();
  }

  function timerBtn() {
    const on = st.prefs.timer !== false;
    return `<button class="timer${on ? "" : " off"}" aria-pressed="${on}" title="Interview timer: tap to turn ${on ? "off" : "on"}" aria-label="Interview timer ${on ? "on" : "off"}">${ICON_CLOCK}<span class="t">${on ? "0:00" : "Off"}</span></button>`;
  }
  function footAsk(s) {
    if (s.style === "mc") return `<button class="reveal-btn subtle">Not sure? Show the answer <kbd>Space</kbd></button>`;
    const t = mode === "interview" ? timerBtn() : "";
    if (s.style === "num") return `<div class="foot-row">${t}<button class="reveal-btn subtle">Skip, show the answer <kbd>Space</kbd></button></div>`;
    return `<div class="foot-row">${t}<button class="reveal-btn">${ICON_EYE}<span>Show answer</span><kbd>Space</kbd></button></div>`;
  }

  function layer(key, title, html, k) {
    return `<div class="layer"><button class="layer-toggle" data-layer="${key}" aria-expanded="false"><span>${title}</span><kbd>${k}</kbd>${ICON_CHEV}</button><div class="layer-body prose" hidden>${html}</div></div>`;
  }
  const fuHTML = (f, extra) => `<div class="fu${extra ? " " + extra : ""}">${extra ? '<div class="lbl">Likely follow-up</div>' : ""}<p class="fq">${esc(f[0])}</p>${extra ? '<p class="think">Answer it out loud first.</p>' : ""}<button class="fu-show" aria-expanded="false">Show answer</button><div class="prose fa" hidden>${f[1]}</div></div>`;

  // Private cards: the original answer word for word, with anything written for Swipe Techs in separate, labelled tabs.
  function privAnswerHTML(q) {
    const ad = q.added;
    const tabs = [["orig", "Original"]];
    if (ad.simple) tabs.push(["simple", "Simplified"]);
    if (ad.example) tabs.push(["example", "Example"]);
    if (ad.update) tabs.push(["update", "Updated"]);
    const pane = (k, title, inner) => `<div class="apane" data-pane="${k}" hidden><div class="added"><div class="lbl">${title}<span class="newtag">Written for Swipe Techs</span></div>${inner}</div></div>`;
    let h = "";
    if (ad.update) h += `<button class="upd-flag" data-tab="update"><span aria-hidden="true">⚑</span> Updated explanation available</button>`;
    if (tabs.length > 1) h += `<div class="atabs" role="tablist" aria-label="Answer versions">${tabs.map(([k, t], i) => `<button role="tab" class="atab${k === "update" ? " upd" : ""}" data-tab="${k}" aria-selected="${i === 0}">${t}</button>`).join("")}</div>`;
    h += `<div class="apane" data-pane="orig"><div class="orig"><div class="lbl">Original answer · ${esc(PCOLL.short)}${pageRef(q) ? " " + pageRef(q) : ""}</div><div class="prose srctext">${P.rich(q.a) || "<p><em>No answer text was extracted for this question.</em></p>"}</div>${q.notes ? `<p class="anote">${esc(q.notes)}</p>` : ""}</div></div>`;
    if (ad.simple) h += pane("simple", "Simplified explanation", `<div class="prose">${P.rich(ad.simple)}</div>`);
    if (ad.example) h += pane("example", "Numerical example", `<div class="prose">${P.rich(ad.example)}</div>`);
    if (ad.update) h += pane("update", "Updated explanation", `${ad.update.why ? `<p class="why"><b>Why:</b> ${P.inline(ad.update.why)}</p>` : ""}<div class="prose">${P.rich(ad.update.text)}</div><p class="anote">The original answer is unchanged under Original.</p>`);
    return h;
  }
  function selTab(s, k) {
    const t = s.el.querySelector(`.atab[data-tab="${k}"]`);
    if (!t) return;
    s.el.querySelectorAll(".atab").forEach(b => b.setAttribute("aria-selected", b === t));
    s.el.querySelectorAll(".apane").forEach(p => { p.hidden = p.dataset.pane !== k; });
    const sc = s.el.querySelector(".card-scroll"), bar = s.el.querySelector(".atabs");
    if (bar.offsetTop - sc.offsetTop < sc.scrollTop) sc.scrollTo({ top: bar.offsetTop - sc.offsetTop - 8, behavior: reduced() ? "auto" : "smooth" });
  }

  function answerHTML(q, s) {
    if (q.src === "priv") return privAnswerHTML(q);
    let h = "";
    if (s.style === "mc" && s.pick != null) h += `<div class="verdict ${s.pick === q.a ? "ok" : "no"}">${s.pick === q.a ? "Correct" : "Not quite"}</div>`;
    if (s.style === "num") {
      const n = numAnswer(q);
      h += s.guess == null ? `<div class="numres"><span>Answer <b>${fmtNum(n, n.v, n.ap)}</b></span></div>`
        : `<div class="numres ${s.numOk ? "ok" : "no"}"><b class="v">${s.numOk ? "Correct" : "Not quite"}</b><span>You said <b>${fmtNum(n, s.guess)}</b> · answer <b>${fmtNum(n, n.v, n.ap)}</b></span></div>`;
    }
    h += `<div class="quick"><div class="lbl">${mode === "interview" ? "Interview answer" : "Quick answer"}</div><div class="prose">${q.quick}</div></div>`;
    // Interview Mode puts the first follow-up up front, the way an interviewer would ask it.
    const fus = (q.fu || []).slice();
    if (mode === "interview" && fus.length) h += fuHTML(fus.shift(), "fu-int");
    if (q.detail) h += layer("detail", "Detailed explanation", q.detail, "E");
    if (q.ex) h += layer("ex", "Numerical example", q.ex, "X");
    if (fus.length) {
      h += `<button class="deeper" aria-expanded="false">Go deeper · ${fus.length} follow-up${fus.length > 1 ? "s" : ""} <kbd>D</kbd></button>
        <div class="fus" hidden>${fus.map(f => fuHTML(f)).join("")}</div>`;
    }
    return h;
  }

  function footRate(s) {
    const prev = S.preview(st, s.id, Date.now());
    return `<div class="rates" role="group" aria-label="How well did you know it?">${[0, 1, 2].map(r => `<button class="rate r${r}${s.suggest === r ? " suggest" : ""}" data-r="${r}"><span class="rl">${RATES[r]}</span><small><kbd>${r + 1}</kbd>${prev[r]}</small></button>`).join("")}</div>`;
  }

  // Short "when is it back" text for the chosen rating button.
  function whenShort(s) {
    const c = S.get(st, s.id);
    if (!c) return "";
    if (c.dueN != null) return `back in ≈${Math.max(1, c.dueN - s.seq)} cards`;
    const d = Math.round((c.dueT - S.startOfDay(Date.now())) / DAY);
    return d <= 1 ? "back tomorrow" : `back in ${d} days`;
  }

  // ---------- card actions ----------
  const slideOf = el => slides.find(s => s.el === el.closest(".slide"));

  function reveal(s) {
    if (s.kind !== "card" || s.state !== "ask") return;
    const q = byId[s.id];
    s.state = "revealed";
    if (s.t0) s.ms = Date.now() - s.t0;
    const card = s.el.querySelector(".card");
    card.classList.remove("ask"); card.classList.add("revealed");
    if (s.style === "mc") {
      // Keep the right option and a wrong pick; fold away the rest so the answer sits close to the question.
      s.el.querySelectorAll(".opt").forEach(b => { const i = +b.dataset.i; b.disabled = true; if (i === q.a) b.classList.add("right"); else if (i !== s.pick) b.classList.add("dim"); });
      if (s.pick == null) s.suggest = 0;
    }
    if (s.style === "num") s.el.querySelectorAll(".numform input, .numform button").forEach(x => { x.disabled = true; });
    const think = s.el.querySelector(".think"); if (think) think.remove();
    const ans = s.el.querySelector(".answer");
    ans.innerHTML = answerHTML(q, s); ans.hidden = false;
    s.el.querySelector(".foot").innerHTML = footRate(s);
    // Quizzes record a provisional rating right away (wrong or skipped = Didn't know, right = Nailed it),
    // so swiping on keeps it; tapping a rating button replaces it.
    if (s.style === "mc") record(s, s.suggest);
    announce("Answer shown. Rate how well you knew it.");
  }

  // Interview number entry: check the typed answer, then reveal with a suggested rating.
  function submitNum(s) {
    if (s.state !== "ask") return;
    const inp = s.el.querySelector(".numin");
    const v = readNum(inp.value);
    if (v == null) { inp.classList.add("bad"); inp.focus(); announce("Enter a number, or skip to see the answer."); return; }
    const n = numAnswer(byId[s.id]);
    s.guess = v; s.numOk = checkNum(n, v);
    s.suggest = s.numOk ? 2 : 0;
    inp.classList.remove("bad"); inp.parentElement.classList.add(s.numOk ? "right" : "wrong");
    inp.blur();
    reveal(s);
  }
  function flipSign(s) {
    const inp = s.el.querySelector(".numin");
    const t = inp.value.trim();
    inp.value = /^[-−]/.test(t) ? t.replace(/^[-−]\s*/, "") : "−" + t;
    inp.focus();
  }

  function record(s, r) {
    const now = Date.now();
    s.undo = { card: S.get(st, s.id) ? JSON.parse(JSON.stringify(S.get(st, s.id))) : null, day: S.dayKey(now) };
    S.rate(st, s.id, r, now, s.seq);
    if (interview && mode === "interview") interview.results[s.id] = { r, ms: s.ms || 0 };
    persist(); updateHeader();
  }
  function unrecord(s) {
    if (!s.undo) return;
    if (s.undo.card) st.cards[s.id] = s.undo.card; else delete st.cards[s.id];
    st.log[s.undo.day] = Math.max(0, (st.log[s.undo.day] || 1) - 1);
    s.undo = null;
  }

  function pick(s, i) {
    if (s.state !== "ask" || s.style !== "mc") return;
    const q = byId[s.id];
    s.pick = i;
    s.suggest = i === q.a ? 2 : 0;
    const b = s.el.querySelector(`.opt[data-i="${i}"]`);
    if (i !== q.a && b) b.classList.add("wrong");
    reveal(s);
  }

  function rate(s, r, advance) {
    if (s.kind !== "card" || s.state !== "revealed") return;
    unrecord(s);
    record(s, r);
    s.undo = null;
    s.state = "rated"; s.rating = r;
    if (mode === "priv" && privPrefs().path === "seq") { P.advance(privPrefs().cur, byId[s.id]); persist(); }   // Sequential resumes after the last question rated
    s.el.querySelector(".card").classList.add("rated");
    // Confirmation in place: the chosen button fills and says when the card is back; the others fade.
    s.el.querySelectorAll(".rate").forEach(b => {
      const on = +b.dataset.r === r;
      b.disabled = true; b.classList.remove("suggest"); b.classList.toggle("sel", on); b.classList.toggle("dim", !on);
      if (on) b.innerHTML = `<span class="rl">${ICON_CHECK}${RATES[r]}</span><small>${whenShort(s)}</small>`;
    });
    updateHeader(); updateCtx();
    announce(`Rated ${RATES[r]}, ${whenShort(s)}.`);
    if (advance) setTimeout(() => { const i = slides.indexOf(s); if (i === cur) goTo(i + 1); }, reduced() ? 150 : 420);
  }

  function toggleTimer() {
    st.prefs.timer = st.prefs.timer === false;
    persist();
    feed.querySelectorAll(".timer").forEach(b => { b.outerHTML = timerBtn(); });
    if ($("#timerChips") && openId === "setSheet") drawSettings();
    tick();
  }

  function toggleBookmark(s) {
    const on = !st.bookmarks.includes(s.id);
    st.bookmarks = on ? [...st.bookmarks, s.id] : st.bookmarks.filter(x => x !== s.id);
    persist();
    slides.filter(x => x.id === s.id).forEach(x => x.el.querySelector(".bm").setAttribute("aria-pressed", on));
    announce(on ? "Bookmarked" : "Bookmark removed");
  }

  function toggleLayer(s, key) {
    const t = s.el.querySelector(`.layer-toggle[data-layer="${key}"]`);
    if (!t) return;
    const open = t.getAttribute("aria-expanded") !== "true";
    t.setAttribute("aria-expanded", open);
    t.nextElementSibling.hidden = !open;
  }
  function toggleDeeper(s) {
    const b = s.el.querySelector(".deeper"); if (!b) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", open);
    b.nextElementSibling.hidden = !open;
    // Scroll inside the card only: scrollIntoView would also move the feed and skip to the next card.
    if (open) { const sc = s.el.querySelector(".card-scroll"); sc.scrollTo({ top: b.offsetTop - sc.offsetTop - 12, behavior: reduced() ? "auto" : "smooth" }); }
  }

  feed.addEventListener("click", e => {
    const act = e.target.closest("[data-act]");
    if (act) return panelAction(act.dataset.act);
    const s = slideOf(e.target); if (!s) return;
    const t = e.target;
    if (s.kind === "chill") {
      if (t.closest(".bm")) return toggleChillBm(s);
      if (t.closest(".more-btn")) return toggleMore(s);
      if (t.closest(".try-btn")) return startDrill(s);
      if (t.closest(".rh-btn, .rh-chip")) return startRabbit(s);
      if (t.closest(".rh-exit")) return leaveRabbit(s);
      if (t.closest(".like-btn")) return likeChill(s, !ch.like[s.id]);
      if (!t.closest("button, a, .tip-dt") && t.closest(".card")) {
        const now = Date.now();
        if (s.tap && now - s.tap < 350) { s.tap = 0; likeChill(s, true); } else s.tap = now;
      }
      return;
    }
    if (s.kind !== "card") return;
    if (t.closest(".bm")) return toggleBookmark(s);
    const opt = t.closest(".opt"); if (opt) return pick(s, +opt.dataset.i);
    if (t.closest(".reveal-btn")) return reveal(s);
    const r = t.closest(".rate"); if (r) return rate(s, +r.dataset.r, true);
    const lt = t.closest(".layer-toggle"); if (lt) return toggleLayer(s, lt.dataset.layer);
    const at = t.closest("[data-tab]"); if (at) return selTab(s, at.dataset.tab);
    if (t.closest(".deeper")) return toggleDeeper(s);
    if (t.closest(".timer")) return toggleTimer();
    if (t.closest(".sign")) return flipSign(s);
    const fs = t.closest(".fu-show");
    if (fs) { const open = fs.getAttribute("aria-expanded") !== "true"; fs.setAttribute("aria-expanded", open); fs.textContent = open ? "Hide answer" : "Show answer"; fs.nextElementSibling.hidden = !open; return; }
    // Tap anywhere on an unanswered think-then-reveal card to reveal.
    if (s.state === "ask" && (s.style === "open" || s.style === "talk") && !t.closest("button, a, .foot") && t.closest(".card")) reveal(s);
  });
  feed.addEventListener("submit", e => { e.preventDefault(); const s = slideOf(e.target); if (s) submitNum(s); });
  feed.addEventListener("input", e => { if (e.target.classList.contains("numin")) e.target.classList.remove("bad"); });

  // ---------- navigation ----------
  function goTo(i) {
    if (i < 0) return;
    if (i >= slides.length) ensureAhead();
    const s = slides[Math.min(i, slides.length - 1)];
    if (s) s.el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }

  function setCur(i) {
    if (i === cur && slides[i] && slides[i].seen) return;
    cur = i;
    const s = slides[i];
    if (!s) return;
    s.seen = true;
    if (curEl && curEl !== s.el) curEl.classList.remove("cur");
    s.el.classList.add("cur"); curEl = s.el;
    clearTimeout(dwell);
    // A concept counts as seen once it has been on screen for a couple of seconds (fast flicks don't count).
    if (s.kind === "chill") dwell = setTimeout(() => { if (slides[cur] === s) markChillSeen(s); }, 2000);
    if (s.kind === "chill" && mode === "chill") tipDoubleTap(s);
    if (s.kind === "chill" && !chillSaved) { CH.setPos(ch, s.id, chillSession.slice(0, chillSession.lastIndexOf(s.id) + 1), Date.now()); persistChill(); }
    if (s.kind === "card" && mode === "interview" && !s.t0) s.t0 = Date.now();
    if (s.kind === "summary") renderSummary(s);
    ensureAhead();
    updateCtx();
    tick();
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { const i = slides.findIndex(s => s.el === en.target); if (i > -1) setCur(i); } });
  }, { root: feed, threshold: 0.6 });

  // Interview timer on the visible card.
  function tick() {
    clearInterval(timer);
    const s = slides[cur];
    if (mode !== "interview" || !s || s.kind !== "card" || s.state !== "ask" || st.prefs.timer === false) return;
    const draw = () => {
      const b = s.el.querySelector(".timer");
      if (s.state !== "ask" || !b) return clearInterval(timer);
      const sec = Math.floor((Date.now() - s.t0) / 1000);
      b.querySelector(".t").textContent = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
      b.classList.toggle("long", sec >= 120);          // most technical answers should land inside two minutes
    };
    draw(); timer = setInterval(draw, 1000);
  }

  // ---------- modes ----------
  function rebuild() {
    clearInterval(timer);
    observer.disconnect();
    clearTimeout(dwell);
    feed.innerHTML = ""; slides = []; cur = 0; ended = false;
    if (mode !== "interview" && mode !== "drill") { st.prefs.mode = mode; persist(); }
    if (mode !== "chill") chillSaved = false;
    if (mode !== "drill") drill = null;
    chillQueue = []; chillChipAt = -99;
    if (mode === "chill" && !chillSaved) {
      // Pick up where you left off: same card, and no repeats of what you saw before closing the app.
      const r = CH.resume(ch, Date.now());
      if (r && chillIds().includes(r.id)) { chillSession = r.session; chillQueue = [{ id: r.id }]; }
    }
    privShuffle = null;
    applyTheme();
    ensureAhead();
    feed.scrollTop = 0;
    if (slides[0]) setCur(0);
    updateTabs(); updateCtx();
  }

  function setMode(m) {
    if (m === "progress") return openSheet("progSheet");
    if (m === "topic") return openSheet("topicSheet");
    if (m === "interview") return startInterview();
    if (m === "chill") chillSaved = false;
    mode = m; interview = null; rebuild();
  }

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startInterview() {
    // 12 mixed questions: every category once, then extra picks from the six core technical areas; mostly intermediate/advanced.
    const pools = {};
    pool().forEach(q => { if (q.l === 1 && Math.random() < 0.65) return; (pools[q.c] = pools[q.c] || []).push(q.id); });
    Object.values(pools).forEach(shuffle);
    const core = shuffle(["acct", "ev", "val", "dcf", "ma", "lbo"]);
    const order = [...core, ...shuffle(Object.keys(pools).filter(c => !core.includes(c))), ...core];
    const ids = [];
    // Skip a question too similar to one already picked (built-in vs private).
    const take = p => { const b = P.blocked(SIM, ids); for (let i = p.length - 1; i >= 0; i--) if (!b.has(p[i])) return ids.push(p.splice(i, 1)[0]); };
    for (const c of order) { if (ids.length >= INTERVIEW_N) break; const p = pools[c]; if (p && p.length) take(p); }
    for (let c; ids.length < INTERVIEW_N && (c = Object.keys(pools).find(k => pools[k].length));) { const n = ids.length; take(pools[c]); if (ids.length === n) pools[c] = []; }   // small selections
    mode = "interview";
    interview = { ids: shuffle(ids), next: 0, results: {}, saved: false, start: Date.now() };
    rebuild();
  }

  function renderSummary(s) {
    const res = interview.ids.map(id => ({ id, q: byId[id], r: interview.results[id] ? interview.results[id].r : null, ms: interview.results[id] ? interview.results[id].ms : 0 }));
    const rated = res.filter(x => x.r != null);
    const pts = rated.reduce((a, x) => a + x.r, 0);
    const pct = rated.length ? Math.round(100 * pts / (2 * res.length)) : 0;
    const byCat = {};
    res.forEach(x => { const b = byCat[x.q.c] || (byCat[x.q.c] = { n: 0, pts: 0 }); b.n++; b.pts += x.r || 0; });
    const avgSec = rated.length ? Math.round(rated.reduce((a, x) => a + x.ms, 0) / rated.length / 1000) : 0;
    const misses = res.filter(x => x.r == null || x.r < 2).map(x => x.id);
    if (!interview.saved && rated.length) {
      st.interviews = [{ t: Date.now(), pct, n: res.length, nailed: rated.filter(x => x.r === 2).length }, ...(st.interviews || [])].slice(0, 20);
      interview.saved = true; persist();
    }
    const verdict = pct >= 85 ? "Superday ready on these." : pct >= 65 ? "Solid. Tighten the misses below." : pct >= 40 ? "Getting there. Drill the weak spots." : "Rough round. That's what practice is for.";
    s.el.querySelector(".card-scroll").innerHTML = `
      <div class="meta"><span class="cat">Interview complete</span></div>
      <div class="score"><b>${pct}%</b><span>${rated.filter(x => x.r === 2).length} nailed · ${rated.filter(x => x.r === 1).length} partial · ${res.length - rated.filter(x => x.r >= 1).length} missed</span></div>
      <p class="think" style="margin:0">${verdict}${avgSec ? ` Average ${avgSec}s before revealing.` : ""}</p>
      <div><div class="lbl">By category</div><div class="mastery">${Object.keys(byCat).map(c => { const b = byCat[c]; const p = Math.round(100 * b.pts / (2 * b.n)); return `<div class="mrow" style="--c: var(--t-${c})"><span>${esc(CATS[c].short || CATS[c].name)}</span><span class="track"><span class="mastered" style="width:${p}%"></span></span><span class="pct">${p}%</span></div>`; }).join("")}</div></div>
      <div><div class="lbl">Questions</div><ul class="qlist">${res.map(x => `<li><span class="mk ${x.r == null ? "rx" : "r" + x.r}">${x.r == null ? "–" : ["✗", "½", "✓"][x.r]}</span><span>${esc(x.q.q)}</span></li>`).join("")}</ul></div>
      <div class="rowbtns">
        ${misses.length ? `<button class="ghost" data-act="bm-misses">Bookmark the ${misses.length} misses</button>` : ""}
        <button class="primary" data-act="interview">New interview</button>
        <button class="ghost" data-act="foryou">Back to For You</button>
      </div>`;
    s.misses = misses;
  }

  function panelAction(a) {
    if (a === "foryou") return setMode("foryou");
    if (a === "chill") return setMode("chill");
    if (a === "priv") return openSheet("privSheet");
    if (a === "priv-again") {
      if (privPrefs().path === "seq") { P.restart(privPrefs().cur, privIds().map(id => byId[id])); persist(); }
      return rebuild();
    }
    if (a === "topic") return openSheet("topicSheet");
    if (a === "interview") return startInterview();
    if (a === "bm-misses") {
      const s = slides.find(x => x.kind === "summary");
      st.bookmarks = [...new Set([...st.bookmarks, ...(s.misses || [])])]; persist();
      const b = s.el.querySelector('[data-act="bm-misses"]'); b.textContent = "Saved to Bookmarks"; b.disabled = true;
    }
  }

  // ---------- header, tabs, context ----------
  function updateHeader() {
    const now = Date.now();
    const today = st.log[S.dayKey(now)] || 0;
    const frac = Math.min(1, today / S.DAILY_GOAL);
    $("#goalFill").style.strokeDashoffset = String(94.25 * (1 - frac));
    $("#goalNum").textContent = today;
    $("#goalBtn").classList.toggle("done", today >= S.DAILY_GOAL);
    $("#goalBtn").setAttribute("aria-label", `Daily goal: ${today} of ${S.DAILY_GOAL} cards today. Open progress.`);
    $("#goalBtn").title = `Daily goal: ${today} of ${S.DAILY_GOAL} cards`;
    const sk = S.streak(st, now);
    $("#streakNum").textContent = sk;
    $("#streak").classList.toggle("on", today > 0);
    $("#streak").title = `${sk}-day streak${today > 0 ? "" : ". Study today to keep it going"}`;
    $("#streak").setAttribute("aria-label", `${sk}-day streak. Open progress.`);
  }

  function updateTabs() {
    const m = mode === "top100" || mode === "bookmarks" || mode === "priv" ? null : mode === "drill" ? "chill" : mode;   // Test me is part of Chill
    document.querySelectorAll(".tab").forEach(t => { if (t.dataset.mode === m) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
  }

  function updateCtx() {
    const ctx = $("#ctx"), label = $("#ctxLabel"), btn = $("#ctxBtn");
    let text = "", b = "Exit";
    const from = src() === "core" ? "" : ` · ${srcName(src())}`;
    if (mode === "foryou" && from) {
      text = `For You${from}`; b = "Change";
    } else if (mode === "topic") {
      const p = st.prefs;
      const nCats = new Set(pool().map(q => q.c)).size;
      const cats = p.cats.length && p.cats.length < nCats ? p.cats.filter(c => CATS[c]).map(c => CATS[c].short || CATS[c].name).join(", ") : "All categories";
      const lv = p.lvls.length === 3 || (src() === "priv" && p.lvls.includes(1) && p.lvls.includes(3)) ? "" : " · " + p.lvls.map(l => lvlName(l, src())).filter(Boolean).join(", ");
      text = `Topic Focus${from} · ${cats}${lv}`; b = "Change";
    } else if (mode === "weak") {
      const n = pool().filter(q => S.isWeak(S.get(st, q.id))).length;
      text = `Review${from} · ${n} weak question${n === 1 ? "" : "s"} to fix`;
    } else if (mode === "priv") {
      const s = slides[cur], q = s && s.kind === "card" ? byId[s.id] : null;
      text = `${PCOLL.short} · ${PATH_NAMES[privPrefs().path]}${q && q.src === "priv" ? ` · ${secName(q)} Q${q.num}` : ""}`; b = "Change";
    } else if (mode === "interview") {
      const s = slides[cur];
      const n = s && s.kind === "card" ? interview.ids.indexOf(s.id) + 1 : interview.ids.length;
      text = `Interview · question ${n} of ${interview.ids.length}`; b = "End";
    } else if (mode === "top100") {
      const m = BANK.filter(q => q.top && S.isMastered(S.get(st, q.id))).length;
      text = `Top 100 · ${m} mastered`;
    } else if (mode === "bookmarks") {
      text = `Bookmarks · ${st.bookmarks.filter(id => byId[id]).length} saved`;
    } else if (mode === "chill") {
      const sel = chillSaved ? "Saved concepts" : ch.cats.length ? ch.cats.map(c => CATS[c].short || CATS[c].name).join(", ") : "Mixed feed";
      text = `🌙 Chill · ${sel}`; b = chillSaved ? "Exit" : "Topics";
    } else if (mode === "drill") {
      const s = slides[cur];
      const n = s && s.kind === "card" ? drill.ids.indexOf(s.id) + 1 : drill.ids.length;
      text = `Test me · question ${n} of ${drill.ids.length}`; b = "Back to Chill";
    }
    ctx.hidden = !text;
    label.textContent = text; btn.textContent = b;
  }
  $("#ctxBtn").addEventListener("click", () => {
    if (mode === "topic") openSheet("topicSheet");
    else if (mode === "priv") openSheet("privSheet");
    else if (mode === "foryou") openSheet("setSheet");
    else if (mode === "chill" && !chillSaved) openSheet("chillSheet");
    else if (mode === "chill" || mode === "drill") setMode("chill");
    else setMode("foryou");
  });

  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => setMode(t.dataset.mode)));
  $("#goalBtn").addEventListener("click", () => openSheet("progSheet"));
  $("#streak").addEventListener("click", () => openSheet("progSheet"));
  $("#collectionsBtn").addEventListener("click", () => openSheet("collSheet"));
  $("#settingsBtn").addEventListener("click", () => openSheet("setSheet"));
  $("#toSettings").addEventListener("click", () => openSheet("setSheet"));

  // ---------- sheets ----------
  const shade = $("#shade");
  let openId = null, lastFocus = null;
  function openSheet(id) {
    if (openId) closeSheet();
    lastFocus = document.activeElement;
    if (lastFocus && lastFocus.blur) lastFocus.blur();
    if (id === "topicSheet") { draft = null; drawTopic(); }
    if (id === "collSheet") drawColl();
    if (id === "progSheet") drawDash();
    if (id === "setSheet") drawSettings();
    if (id === "chillSheet") { chillDraft = ch.cats.slice(); drawChillTopics(); }
    if (id === "privSheet") { privDraft = null; drawPriv(); }
    const el = document.getElementById(id);
    el.hidden = false; shade.hidden = false; openId = id;
    el.scrollTop = 0;
    el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true });      // focus the panel, not its first row
  }
  function closeSheet() {
    if (!openId) return;
    document.getElementById(openId).hidden = true; shade.hidden = true; openId = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  shade.addEventListener("click", closeSheet);
  document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeSheet));

  function chip(label, pressed, onClick, color) {
    const b = document.createElement("button");
    b.className = "chip" + (color ? " cat" : ""); b.setAttribute("aria-pressed", pressed);
    if (color) b.style.setProperty("--c", `var(${color})`);
    b.innerHTML = (color ? '<span class="sw"></span>' : "") + ICON_CHECK + `<span>${esc(label)}</span>`;
    b.addEventListener("click", onClick);
    return b;
  }

  // Topic Focus picker works on a draft so closing without Start changes nothing. No categories picked = all of them.
  // Brain teasers have no level, so level filters never hide them.
  let draft = null;
  const inTopic = (d, q) => (!d.cats.length || d.cats.includes(q.c)) && (q.c === "brain" || d.lvls.includes(q.l));
  // A private guide's own level names (Basic / Advanced) when studying it alone.
  const lvlName = (l, s) => s === "priv" ? ({ 1: "Basic", 3: "Advanced" })[l] : LEVELS[l];
  function srcChips(el, cur, onPick) {
    el.innerHTML = "";
    ["core", "priv", "both"].forEach(k => el.append(chip(k === "both" ? "Both" : srcName(k), cur === k, () => onPick(k))));
  }
  function drawTopic() {
    if (!draft) draft = { cats: st.prefs.cats.slice(), lvls: st.prefs.lvls.slice(), src: src() };
    $("#topicSrc").hidden = !PBANK.length;
    if (PBANK.length) srcChips($("#srcChips"), draft.src, k => { draft.src = k; drawTopic(); });
    const all = pool(draft.src);
    const cats = Object.keys(CATS).filter(k => all.some(q => q.c === k));
    draft.cats = draft.cats.filter(k => cats.includes(k));
    const cc = $("#catChips"); cc.innerHTML = "";
    cc.append(chip("All topics", !draft.cats.length, () => { draft.cats = []; drawTopic(); }));
    cats.forEach(k => cc.append(chip(CATS[k].name, draft.cats.includes(k), () => {
      draft.cats = draft.cats.includes(k) ? draft.cats.filter(x => x !== k) : [...draft.cats, k];
      if (draft.cats.length === cats.length) draft.cats = [];
      drawTopic();
    }, `--t-${k}`)));
    const lc = $("#lvlChips"); lc.innerHTML = "";
    const lvls = draft.src === "priv" ? [1, 3] : [1, 2, 3];
    lvls.forEach(l => lc.append(chip(lvlName(l, draft.src), draft.lvls.includes(l), () => {
      draft.lvls = draft.lvls.includes(l) ? draft.lvls.filter(x => x !== l) : [...draft.lvls, l].sort(); drawTopic();
    })));
    const now = Date.now();
    const sel = all.filter(q => inTopic(draft, q));
    const due = sel.filter(q => { const c = S.get(st, q.id); return c && (c.dueN != null || (c.dueT != null && c.dueT <= now)); }).length;
    const fresh = sel.filter(q => !S.isSeen(S.get(st, q.id))).length;
    const catTxt = draft.cats.length ? draft.cats.map(c => CATS[c].short || CATS[c].name).join(", ") : "All topics";
    const shown = draft.lvls.filter(l => lvls.includes(l));
    const lv = !shown.length ? "pick a level" : shown.length === lvls.length ? "all levels" : shown.map(l => lvlName(l, draft.src)).join(", ");
    $("#topicSel").textContent = `${catTxt} · ${lv}`;
    $("#topicCount").textContent = sel.length ? `${sel.length} questions · ${due} due · ${fresh} new` : "No questions match";
    $("#topicStart").disabled = !sel.length;
  }
  $("#topicStart").addEventListener("click", () => {
    st.prefs.cats = draft.cats; st.prefs.lvls = draft.lvls.length ? draft.lvls : [1, 2, 3];
    if (PBANK.length) st.prefs.src = draft.src;
    draft = null;
    closeSheet(); mode = "topic"; interview = null; rebuild();
  });

  function drawColl() {
    const topM = BANK.filter(q => q.top && S.isMastered(S.get(st, q.id))).length;
    const topS = BANK.filter(q => q.top && S.isSeen(S.get(st, q.id))).length;
    $("#collTopSub").textContent = `The most-asked IB technicals · ${topS} studied, ${topM} mastered`;
    const nb = st.bookmarks.filter(id => byId[id]).length;
    $("#collBmSub").textContent = nb ? `${nb} saved card${nb > 1 ? "s" : ""}` : "Tap the bookmark on any card to save it";
    const n = ch.bm.filter(id => chillById[id]).length;
    $("#collChillSub").textContent = n ? `${n} saved concept${n > 1 ? "s" : ""} to scroll back through` : "Save a Chill card to find it here";
    $("#collPriv").hidden = !PBANK.length;
    if (PBANK.length) {
      const x = S.stats(st, PBANK, Date.now());
      $("#collPrivName").textContent = PCOLL.name;
      $("#collPrivSub").textContent = `Private · ${x.studied} of ${x.total} reviewed, ${x.mastered} mastered`;
    }
  }
  $("#collPriv").addEventListener("click", () => openSheet("privSheet"));
  $("#collTop").addEventListener("click", () => { closeSheet(); mode = "top100"; interview = null; rebuild(); });
  $("#collBm").addEventListener("click", () => { closeSheet(); mode = "bookmarks"; interview = null; rebuild(); });
  $("#collChill").addEventListener("click", () => { closeSheet(); mode = "chill"; chillSaved = true; interview = null; rebuild(); });

  // Chill topic picker: Mixed feed (default) or chosen topics.
  let chillDraft = [];
  function drawChillTopics() {
    const cc = $("#chillChips"); cc.innerHTML = "";
    cc.append(chip("Mixed feed", !chillDraft.length, () => { chillDraft = []; drawChillTopics(); }));
    CHILL_CATS.forEach(k => cc.append(chip(CATS[k].name, chillDraft.includes(k), () => {
      chillDraft = chillDraft.includes(k) ? chillDraft.filter(x => x !== k) : [...chillDraft, k];
      if (chillDraft.length === CHILL_CATS.length) chillDraft = [];
      drawChillTopics();
    }, `--t-${k}`)));
    const pool = CBANK.filter(x => !chillDraft.length || chillDraft.includes(x.c));
    const fresh = pool.filter(x => !ch.seen[x.id]).length;
    $("#chillSel").textContent = chillDraft.length ? chillDraft.map(c => CATS[c].short || CATS[c].name).join(", ") : "Mixed feed · every topic";
    $("#chillCount").textContent = `${pool.length} concepts · ${fresh} not seen yet`;
  }
  $("#chillStart").addEventListener("click", () => {
    ch.cats = chillDraft.slice(); persistChill();
    closeSheet(); mode = "chill"; chillSaved = false; interview = null; rebuild();
  });

  // ---------- private collection page: progress, study path, filters ----------
  let privDraft = null;
  function drawPriv() {
    if (!PBANK.length) return;
    const f = privPrefs();
    if (!privDraft) privDraft = { path: f.path, cats: f.cats.slice(), lvls: f.lvls.slice() };
    const d = privDraft, now = Date.now();
    const x = S.stats(st, PBANK, now);
    const pct = x.total ? Math.round(100 * x.mastered / x.total) : 0;
    $("#privTitle").textContent = PCOLL.name;
    $("#privSub").textContent = `Private · stored on this device only · ${x.total} questions${PCOLL.source ? " from " + PCOLL.source : ""}`;
    const cats = Object.keys(CATS).filter(k => PBANK.some(q => q.c === k));
    $("#privDash").innerHTML = `
      <div class="hero">
        <div class="big-ring">${ring(x.total ? x.mastered / x.total : 0)}<div class="in"><b>${pct}%</b><span>mastered</span></div></div>
        <div class="hero-txt">
          <div class="hero-n"><b>${x.mastered}</b> of ${x.total} questions mastered</div>
          <div class="stackbar" aria-hidden="true"><i class="m" style="width:${100 * x.mastered / x.total}%"></i><i class="l" style="width:${100 * (x.studied - x.mastered) / x.total}%"></i></div>
          <p class="note">Tracked separately from your Swipe Techs mastery.</p>
        </div>
      </div>
      <div class="tiles five">
        <div class="tile"><span class="tl">Total</span><b>${x.total}</b><small>questions</small></div>
        <div class="tile"><span class="tl">Reviewed</span><b>${x.studied}</b><small>at least once</small></div>
        <div class="tile"><span class="tl">Mastered</span><b>${x.mastered}</b><small>${pct}%</small></div>
        <div class="tile"><span class="tl">Remaining</span><b>${x.total - x.studied}</b><small>not reviewed yet</small></div>
        <div class="tile"><span class="tl">Due now</span><b>${x.dueNow}</b><small>${x.weak} weak</small></div>
      </div>`;
    // Study path
    const pc = $("#privPaths"); pc.innerHTML = "";
    const sel = PBANK.filter(q => P.inFilter(q, d));
    const nextId = P.seqNext(sel, f.cur, null);
    const desc = {
      seq: nextId ? `The guide in order. Next up: ${secName(byId[nextId])} Q${byId[nextId].num}.` : sel.length ? "The guide in order. You've finished this selection." : "The guide in order.",
      shuffle: "Every question in your selection once, in random order.",
      srs: "Due reviews and weak questions first, then new ones in guide order.",
    };
    P.PATHS.forEach(k => {
      const b = document.createElement("button");
      b.className = "path"; b.setAttribute("aria-pressed", d.path === k);
      b.innerHTML = `<span class="pn">${PATH_NAMES[k]}</span><span class="pd">${esc(desc[k])}</span>`;
      b.addEventListener("click", () => { d.path = k; drawPriv(); });
      pc.append(b);
    });
    const started = sel.some(q => (f.cur[P.secKey(q)] || 0) > 0);
    $("#privRestart").hidden = d.path !== "seq" || !started;
    // Filters
    const cc = $("#privCats"); cc.innerHTML = "";
    cc.append(chip("All sections", !d.cats.length, () => { d.cats = []; drawPriv(); }));
    cats.forEach(k => cc.append(chip(CATS[k].name, d.cats.includes(k), () => {
      d.cats = d.cats.includes(k) ? d.cats.filter(c => c !== k) : [...d.cats, k];
      if (d.cats.length === cats.length) d.cats = [];
      drawPriv();
    }, `--t-${k}`)));
    const lc = $("#privLvls"); lc.innerHTML = "";
    [[1, "Basic"], [3, "Advanced"]].forEach(([l, name]) => lc.append(chip(name, d.lvls.includes(l), () => {
      d.lvls = d.lvls.includes(l) ? d.lvls.filter(v => v !== l) : [...d.lvls, l].sort();
      if (!d.lvls.length) d.lvls = [1, 3].filter(v => v !== l);    // keep at least one level
      drawPriv();
    })));
    // Mastery by section
    $("#privByCat").innerHTML = cats.map(c => {
      const qs = PBANK.filter(q => q.c === c);
      const by = l => { const z = qs.filter(q => q.l === l); return z.length ? `${CATS[c].short || CATS[c].name} ${l === 1 ? "Basic" : "Advanced"} ${z.filter(q => S.isMastered(S.get(st, q.id))).length}/${z.length}` : ""; };
      const b = x.byCat[c] || { total: 0, studied: 0, mastered: 0 };
      const p = b.total ? Math.round(100 * b.mastered / b.total) : 0;
      const split = c === "brain" ? "" : [by(1), by(3)].filter(Boolean).join(" · ") + " mastered";
      return `<button class="mrow" data-pcat="${c}" style="--c: var(--t-${c})" aria-label="${esc(CATS[c].name)}: ${b.mastered} of ${b.total} mastered. Study this section.">
        <span class="mname">${esc(CATS[c].name)}</span><span class="pct">${p}%</span>
        <span class="track"><i class="m" style="width:${b.total ? 100 * b.mastered / b.total : 0}%"></i><i class="l" style="width:${b.total ? 100 * (b.studied - b.mastered) / b.total : 0}%"></i></span>
        <span class="msub">${b.studied} of ${b.total} reviewed${split ? " · " + esc(split) : ""}</span></button>`;
    }).join("");
    $("#privByCat").querySelectorAll("[data-pcat]").forEach(b => b.addEventListener("click", () => { d.cats = [b.dataset.pcat]; drawPriv(); $("#privSheet").scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); }));
    const due = sel.filter(q => { const c = S.get(st, q.id); return c && (c.dueN != null || (c.dueT != null && c.dueT <= now)); }).length;
    const fresh = sel.filter(q => !S.isSeen(S.get(st, q.id))).length;
    $("#privSel").textContent = `${PATH_NAMES[d.path]} · ${d.cats.length ? d.cats.map(c => CATS[c].short || CATS[c].name).join(", ") : "All sections"}${d.lvls.length === 1 ? (d.lvls[0] === 1 ? " · Basic" : " · Advanced") : ""}`;
    $("#privCount").textContent = sel.length ? `${sel.length} questions · ${due} due · ${fresh} new` : "No questions match";
    $("#privStart").disabled = !sel.length;
  }
  $("#privStart").addEventListener("click", () => {
    const f = privPrefs();
    f.path = privDraft.path; f.cats = privDraft.cats.slice(); f.lvls = privDraft.lvls.slice(); privDraft = null;
    closeSheet(); mode = "priv"; interview = null; rebuild();
  });
  $("#privRestart").addEventListener("click", () => {
    P.restart(privPrefs().cur, PBANK.filter(q => P.inFilter(q, privDraft))); persist(); drawPriv();
    announce("Sequential starts again from the first question in this selection.");
  });

  // ---------- settings ----------
  function drawSettings() {
    drawPrivBox();
    const tc = $("#themeChips"); tc.innerHTML = "";
    [["system", "Match device"], ["light", "Light"], ["dark", "Dark"]].forEach(([k, l]) => tc.append(chip(l, st.prefs.theme === k, () => { st.prefs.theme = k; persist(); applyTheme(); drawSettings(); })));
    const tm = $("#timerChips"); tm.innerHTML = "";
    [[true, "Show timer"], [false, "Hide timer"]].forEach(([v, l]) => tm.append(chip(l, (st.prefs.timer !== false) === v, () => { if ((st.prefs.timer !== false) !== v) toggleTimer(); drawSettings(); })));
  }
  // Private collection: import, replace, delete, and where questions come from.
  let privMsg = null, privConfirm = false;
  function drawPrivBox() {
    const box = $("#privBox");
    const msg = privMsg ? `<p class="note${privMsg.bad ? " bad" : ""}" role="status">${esc(privMsg.text)}</p>` : "";
    if (!PBANK.length) {
      const lost = priv.status === "missing" ? "Your private collection is no longer stored in this browser. Import the file again; your progress on it is still here."
        : priv.status === "error" ? "This browser's storage for private collections couldn't be opened. Reload to try again." : "";
      box.innerHTML = `<p class="note">Study a question file you made from your own copy of a guide (tools/private-import in the repo). It's stored in this browser only, never uploaded or published.</p>
        ${lost ? `<p class="note bad">${lost}</p>` : ""}${msg}<div class="rowbtns"><button class="ghost" data-pv="import">Import question file</button></div>`;
      return;
    }
    const when = PCOLL.imported ? new Date(PCOLL.imported).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
    box.innerHTML = `<div class="crow"><div>${esc(PCOLL.name)}<small>${PCOLL.count} questions${when ? " · imported " + esc(when) : ""} · this device only</small></div><button data-pv="open">Open</button></div>
      <p class="sublbl">Questions from</p><div class="chips" id="privSrcChips"></div>
      <p class="note">Applies to For You, Topics, Review and Interview. Your Swipe Techs mastery always counts the built-in questions only.</p>
      ${msg}
      ${privConfirm ? `<div class="confirm"><p>Delete ${esc(PCOLL.name)} from this device?</p><div class="rowbtns">
          <button class="ghost" data-pv="del-keep">Delete, keep my progress</button><button class="ghost bad" data-pv="del-all">Delete with its progress</button><button class="link" data-pv="cancel">Cancel</button></div>
          <p class="note">Keeping progress means re-importing the same file later picks up where you left off.</p></div>`
        : `<div class="rowbtns"><button class="ghost" data-pv="import">Replace file</button><button class="link danger" data-pv="delete">Delete collection</button></div>`}`;
    srcChips($("#privSrcChips"), src(), k => {
      st.prefs.src = k; persist();
      if (["foryou", "topic", "weak"].includes(mode)) rebuild(); else updateCtx();
      drawSettings();
    });
  }
  $("#privBox").addEventListener("click", e => {
    const b = e.target.closest("[data-pv]"); if (!b) return;
    const a = b.dataset.pv;
    if (a === "import") return $("#privFile").click();
    if (a === "open") return openSheet("privSheet");
    if (a === "delete" || a === "cancel") { privConfirm = a === "delete"; privMsg = null; return drawPrivBox(); }
    if (a === "del-keep" || a === "del-all") return deletePriv(a === "del-all");
  });
  $("#privFile").addEventListener("change", async e => {
    const inp = e.currentTarget, f = inp.files && inp.files[0];
    inp.value = "";
    if (!f) return;
    const fail = text => { privMsg = { bad: true, text }; drawPrivBox(); };
    if (f.size > 30e6) return fail("That file is too large to be a question collection.");
    let obj;
    try { obj = JSON.parse(await f.text()); } catch (err) { return fail("Not imported: that file isn't valid JSON. Pick the .json file the import tool wrote."); }
    const v = P.validate(obj, new Set([...BANK.map(q => q.id), ...CBANK.map(x => x.id)]));
    if (!v.ok) return fail("Not imported. " + v.errors.slice(0, 3).join(" ") + (v.errors.length > 3 ? ` And ${v.errors.length - 3} more problems.` : ""));
    try { await P.save(v.coll); } catch (err) { return fail("Couldn't save it in this browser: " + (err && err.message || err)); }
    st.prefs.mode = "priv"; persist();     // open straight into the collection
    privMsg = { text: `Imported ${v.coll.count} questions. Opening ${v.coll.name}…` }; drawPrivBox();
    setTimeout(() => location.reload(), 500);
  });
  async function deletePriv(withProgress) {
    try { await P.remove(); } catch (err) { privMsg = { bad: true, text: "Couldn't delete it: " + (err && err.message || err) }; return drawPrivBox(); }
    if (withProgress) {
      const ids = new Set(PBANK.map(q => q.id));
      ids.forEach(id => { delete st.cards[id]; });
      st.bookmarks = st.bookmarks.filter(id => !ids.has(id));
      delete st.prefs.priv;
    }
    st.prefs.src = "core";
    if (st.prefs.mode === "priv") st.prefs.mode = "foryou";
    persist();
    location.reload();
  }

  function applyTheme() {
    const t = mode === "chill" || mode === "drill" ? "dark" : st.prefs.theme;   // Chill, and its Test me cards, always use the night palette
    document.body.classList.toggle("in-chill", mode === "chill");   // no study goal or streak in the header while scrolling Chill
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }

  // ---------- progress dashboard ----------
  function ring(frac, cls) {
    const C = 2 * Math.PI * 42;
    return `<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="track" cx="48" cy="48" r="42"/><circle class="fill ${cls || ""}" cx="48" cy="48" r="42" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - Math.min(1, frac))).toFixed(1)}"/></svg>`;
  }
  function drawDash() {
    const now = Date.now();
    const x = S.stats(st, BANK, now);
    const pct = x.total ? Math.round(100 * x.mastered / x.total) : 0;
    const learning = x.studied - x.mastered;
    const maxW = Math.max(x.goal, ...x.week.map(w => w.n));
    const dayLetter = k => "SMTWTFS"[new Date(k + "T12:00:00").getDay()];
    const last = (st.interviews || [])[0];
    const weakest = x.weakest.slice(0, 3);
    const goalLeft = Math.max(0, x.goal - x.today);
    $("#dash").innerHTML = `
      <div class="hero">
        <div class="big-ring">${ring(x.mastered / x.total)}<div class="in"><b>${pct}%</b><span>mastered</span></div></div>
        <div class="hero-txt">
          <div class="hero-n"><b>${x.mastered}</b> of ${x.total} questions mastered</div>
          <div class="stackbar" aria-hidden="true"><i class="m" style="width:${100 * x.mastered / x.total}%"></i><i class="l" style="width:${100 * learning / x.total}%"></i></div>
          <p class="note">${learning} in progress · ${x.total - x.studied} not started</p>
        </div>
      </div>
      <div class="tiles">
        <div class="tile"><span class="tl">Studied</span><b>${x.studied}</b><small>of ${x.total}</small></div>
        <div class="tile"><span class="tl">Mastered</span><b>${x.mastered}</b><small>${pct}% of all</small></div>
        <div class="tile${x.today > 0 ? " hot" : ""}"><span class="tl">Streak</span><b>${x.streak}</b><small>${x.streak === 1 ? "day" : "days"} · best ${x.best}</small></div>
        <div class="tile"><span class="tl">Due now</span><b>${x.dueNow}</b><small>${x.weak} weak</small></div>
      </div>
      <h3>Today</h3>
      <div class="today">
        <div class="goal-line"><b>${x.today}</b><span>/ ${x.goal} cards</span><em>${x.today >= x.goal ? "Goal hit" : `${goalLeft} to go`}</em></div>
        <div class="goalbar${x.today >= x.goal ? " done" : ""}"><i style="width:${100 * Math.min(1, x.today / x.goal)}%"></i></div>
        <div class="week" aria-label="Cards reviewed in the last 7 days">${x.week.map(w => `<div class="wk" title="${w.day}: ${w.n}"><i class="${w.n >= x.goal ? "goal-hit" : ""}" style="height:${Math.round(100 * w.n / maxW)}%"></i><span>${dayLetter(w.day)}</span></div>`).join("")}</div>
      </div>
      <h3>Mastery by topic</h3>
      <div class="legend"><span><i class="m"></i>Mastered</span><span><i class="l"></i>In progress</span><span><i class="n"></i>Not started</span></div>
      <div class="mastery">${CORE_CATS.map(c => {
        const b = x.byCat[c] || { total: 0, studied: 0, mastered: 0 };
        const p = b.total ? Math.round(100 * b.mastered / b.total) : 0;
        return `<button class="mrow" data-cat="${c}" style="--c: var(--t-${c})" aria-label="${esc(CATS[c].name)}: ${b.mastered} of ${b.total} mastered, ${b.studied - b.mastered} in progress. Study this topic.">
          <span class="mname">${esc(CATS[c].name)}</span><span class="pct">${p}%</span>
          <span class="track"><i class="m" style="width:${b.total ? 100 * b.mastered / b.total : 0}%"></i><i class="l" style="width:${b.total ? 100 * (b.studied - b.mastered) / b.total : 0}%"></i></span>
          <span class="msub">${b.mastered} mastered · ${b.studied - b.mastered} in progress · ${b.total - b.studied} new</span></button>`;
      }).join("")}</div>
      <p class="note">Mastered means nailed on 3 separate days. Tap a topic to study it.</p>
      <h3>Weakest topics</h3>
      ${weakest.length ? `<div class="weakest">${weakest.map(w => `<div class="wrow"><div>${esc(CATS[w.cat].name)}<small>${Math.round(w.rate * 100)}% recall</small></div><button data-cat="${w.cat}">Practice</button></div>`).join("")}</div>` : `<p class="note">Review at least 5 cards in a topic to see how it compares.</p>`}
      ${last ? `<h3>Last interview</h3><p class="note">${last.pct}% · ${last.nailed} of ${last.n} nailed · ${new Date(last.t).toLocaleDateString()}</p>` : ""}
      ${CBANK.length ? (() => { const c = CH.stats(ch, CBANK); return `<h3>Chill Mode</h3><div class="crow"><div>🌙 ${c.seen} of ${c.total} concepts seen<small>${c.saved} saved · separate from mastery</small></div><button data-go="chill">Open</button></div>`; })() : ""}
      ${PBANK.length ? (() => { const p = S.stats(st, PBANK, now); return `<h3>${esc(PCOLL.name)}</h3><div class="crow"><div>${p.studied} of ${p.total} reviewed · ${p.mastered} mastered<small>${p.dueNow} due · private · separate from mastery</small></div><button data-go="priv">Open</button></div>`; })() : ""}`;
    const go = $("#dash").querySelector('[data-go="chill"]');
    if (go) go.addEventListener("click", () => { closeSheet(); setMode("chill"); });
    const gp = $("#dash").querySelector('[data-go="priv"]');
    if (gp) gp.addEventListener("click", () => openSheet("privSheet"));
    $("#dash").querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
      st.prefs.cats = [b.dataset.cat]; st.prefs.lvls = [1, 2, 3]; closeSheet(); mode = "topic"; interview = null; rebuild();
    }));
  }

  let armed = false;
  $("#reset").addEventListener("click", e => {
    const b = e.currentTarget;
    if (!armed) { armed = true; b.textContent = "Tap again to erase review history (bookmarks stay)"; setTimeout(() => { armed = false; b.textContent = "Reset progress"; }, 3500); return; }
    const keep = { bookmarks: st.bookmarks, prefs: st.prefs };
    if (st.prefs.priv) st.prefs.priv.cur = {};
    st = Object.assign(S.blankState(), keep);
    persist(); armed = false; b.textContent = "Progress reset";
    updateHeader(); rebuild();
  });

  // ---------- keyboard ----------
  document.addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (openId) { if (e.key === "Escape") closeSheet(); return; }
    if (e.target.matches && e.target.matches("input, textarea")) { if (e.key === "Escape") e.target.blur(); return; }   // typing a number
    const s = slides[cur];
    const k = e.key.toLowerCase();
    const onButton = e.target.closest && e.target.closest("button");
    if (k === "arrowdown" || k === "j" || k === "pagedown") { e.preventDefault(); goTo(cur + 1); return; }
    if (k === "arrowup" || k === "k" || k === "pageup") { e.preventDefault(); goTo(cur - 1); return; }
    if (s && s.kind === "chill") {
      if ((k === " " || k === "enter") && !onButton) { e.preventDefault(); goTo(cur + 1); }
      else if (k === "b") toggleChillBm(s);
      else if (k === "l" || k === "e") toggleMore(s);
      else if (k === "t") startDrill(s);
      return;
    }
    if (!s || s.kind !== "card") return;
    const q = byId[s.id];
    if ((k === " " || k === "enter") && !onButton) {
      e.preventDefault();
      if (s.state === "ask" && s.style === "num" && k === "enter") { const i = s.el.querySelector(".numin"); i.focus(); }
      else if (s.state === "ask") reveal(s); else if (s.state === "rated") goTo(cur + 1);
      return;
    }
    if (k === " " && onButton) return;
    if (/^[1-4]$/.test(k)) {
      const n = +k - 1;
      if (s.state === "ask" && s.style === "mc" && n < q.o.length) pick(s, n);
      else if (s.state === "revealed" && n <= 2) rate(s, n, true);
      return;
    }
    if (k === "b") return toggleBookmark(s);
    if (s.state === "ask") return;
    if (q.src === "priv") { const tab = { o: "orig", e: "simple", x: "example", u: "update" }[k]; if (tab) selTab(s, tab); return; }
    if (k === "e") return toggleLayer(s, "detail");
    if (k === "x") return toggleLayer(s, "ex");
    if (k === "d") return toggleDeeper(s);
  });

  // Keep the visible card in place when the viewport changes (rotation, desktop resize).
  window.addEventListener("resize", () => { const s = slides[cur]; if (s) s.el.scrollIntoView({ block: "start" }); });

  let liveT = null;
  function announce(t) { clearTimeout(liveT); const l = $("#live"); l.textContent = ""; liveT = setTimeout(() => { l.textContent = t; }, 50); }

  // ---------- boot ----------
  applyTheme();
  updateHeader();
  rebuild();
  window.__swipe = { get st() { return st; }, get slides() { return slides; }, get cur() { return cur; }, get mode() { return mode; }, get chill() { return ch; }, renderChill: (id, o) => renderChill({ id, ...o }), priv: { status: priv.status, count: PBANK.length, src } };   // for tests
})();
