/* Swipe Techs UI: feed, card flow, modes, collections, dashboard. Depends on js/srs.js and data/*.js. */
(function () {
  "use strict";
  const S = window.SRS;
  const BANK = window.QB;
  const byId = Object.fromEntries(BANK.map(q => [q.id, q]));
  const CATS = {
    acct: { name: "Accounting" }, ev: { name: "EV & Equity Value", short: "EV & Equity" },
    val: { name: "Valuation" }, dcf: { name: "DCF" }, ma: { name: "M&A" }, lbo: { name: "LBO" },
    model: { name: "Financial Modeling", short: "Modeling" }, math: { name: "Mental Math" },
  };
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

  // Stable order for new cards: Top 100 first, easier first, otherwise shuffled (same order every visit).
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const ORDER = {};
  BANK.slice().sort((a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0) || a.l - b.l || hash(a.id) - hash(b.id)).forEach((q, i) => { ORDER[q.id] = i; });

  const ICON_BM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
  const ICON_CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  // ---------- session ----------
  const feed = $("#feed");
  let mode = ["foryou", "topic", "weak", "top100", "bookmarks"].includes(st.prefs.mode) ? st.prefs.mode : "foryou";
  let slides = [];        // {kind:"card"|"end"|"summary", id, seq, el, state, suggest, rating, t0, ms}
  let cur = 0;
  let ended = false;
  let interview = null;   // {ids, next, results:{id:{r,ms}}, saved}
  let timer = null;

  function candidates() {
    const p = st.prefs;
    if (mode === "topic") return BANK.filter(q => (!p.cats.length || p.cats.includes(q.c)) && p.lvls.includes(q.l)).map(q => q.id);
    if (mode === "bookmarks") return st.bookmarks.filter(id => byId[id]);
    if (mode === "top100") return BANK.filter(q => q.top).map(q => q.id);
    return BANK.map(q => q.id);
  }

  function nextCardId() {
    if (mode === "interview") return interview.next < interview.ids.length ? interview.ids[interview.next++] : null;
    const pending = new Set(slides.slice(cur).filter(s => s.kind === "card" && s.state !== "rated").map(s => s.id));
    return S.pickNext(st, candidates(), {
      pos: st.seq, now: Date.now(), order: ORDER, exclude: pending,
      recent: slides.filter(s => s.kind === "card").slice(-6).map(s => s.id),
      mode: mode === "weak" ? "weak" : "foryou",
    });
  }

  function append() {
    if (ended) return false;
    const id = nextCardId();
    if (!id) { appendEnd(); return false; }
    const s = { kind: "card", id, seq: st.seq++, state: "ask" };
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
    const msg = {
      weak: ["No weak questions right now.", "Cards you rate Didn't know or Partially show up here until you nail them consistently."],
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
    if (mode === "interview") out.push(`<span class="badge">Q ${interview.ids.indexOf(q.id) + 1} of ${interview.ids.length}</span>`);
    else {
      const c = S.get(st, q.id);
      if (!S.isSeen(c)) out.push('<span class="badge new">New</span>');
      else if (S.isWeak(c)) out.push('<span class="badge weak">Weak</span>');
      else if (c.dueN != null) out.push('<span class="badge due">Again</span>');
      else if (c.dueT != null && c.dueT <= Date.now()) out.push('<span class="badge due">Review</span>');
    }
    if (q.top && mode !== "top100") out.push('<span class="badge top">Top 100</span>');
    return out.join("");
  }

  function renderCard(s) {
    const q = byId[s.id];
    const el = document.createElement("section");
    el.className = "slide";
    const bm = st.bookmarks.includes(q.id);
    const think = mode === "interview" ? "Answer out loud as if you were in the room, then reveal." : "Form your answer first, then tap to check.";
    const body = q.o
      ? `<div class="opts">${q.o.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join("")}</div>`
      : `<p class="think">${think}</p>`;
    el.innerHTML = `<article class="card ask" style="--topic: var(--t-${q.c})" aria-label="${esc(CATS[q.c].name)} question">
      <div class="card-head">
        <div class="meta"><span class="cat">${esc(CATS[q.c].name)}</span><span class="dot">·</span><span>${LEVELS[q.l]}</span><span class="dot">·</span><span>${KINDS[q.k]}</span>${badgesFor(q)}</div>
        <button class="bm" aria-pressed="${bm}" aria-label="Bookmark this card">${ICON_BM}</button>
      </div>
      <div class="card-scroll">
        <h2 class="q">${esc(q.q)}</h2>
        ${body}
        <div class="answer" hidden></div>
      </div>
      <div class="foot">${footAsk(q)}</div>
    </article>`;
    return el;
  }

  function footAsk(q) {
    const t = mode === "interview" ? '<div class="timer" aria-hidden="true">0:00</div>' : "";
    const label = q.o ? (mode === "interview" ? "Not sure? Show the answer" : "Show answer without guessing") : (mode === "interview" ? "I've answered. Show me" : "Tap to reveal");
    return `${t}<button class="reveal-btn">${label} <kbd>Space</kbd></button>`;
  }

  function layer(key, title, html, k) {
    return `<div class="layer"><button class="layer-toggle" data-layer="${key}" aria-expanded="false">${title}<kbd>${k}</kbd>${ICON_CHEV}</button><div class="layer-body prose" hidden>${html}</div></div>`;
  }

  function answerHTML(q, s) {
    let h = "";
    if (q.o && s.pick != null) h += `<div class="verdict ${s.pick === q.a ? "ok" : "no"}">${s.pick === q.a ? "Correct" : "Not quite. Answer: " + esc(q.o[q.a])}</div>`;
    else if (q.o) h += `<div class="verdict">Answer: ${esc(q.o[q.a])}</div>`;
    h += `<div class="quick"><div class="lbl">Quick answer</div><div class="prose">${q.quick}</div></div>`;
    if (q.detail) h += layer("detail", "Detailed explanation", q.detail, "E");
    if (q.ex) h += layer("ex", "Numerical example", q.ex, "X");
    if (q.fu && q.fu.length) {
      h += `<button class="deeper" aria-expanded="false">Go deeper · ${q.fu.length} follow-up${q.fu.length > 1 ? "s" : ""} <kbd>D</kbd></button>
        <div class="fus" hidden>${q.fu.map(f => `<div class="fu"><p class="fq">${esc(f[0])}</p><button class="fu-show" aria-expanded="false">Show answer</button><div class="prose fa" hidden>${f[1]}</div></div>`).join("")}</div>`;
    }
    return h;
  }

  function footRate(s) {
    const prev = S.preview(st, s.id, Date.now());
    return `<div class="rates">${[0, 1, 2].map(r => `<button class="rate r${r}${s.suggest === r ? " suggest" : ""}" data-r="${r}">${RATES[r]}<small>${r + 1} · ${prev[r]}</small></button>`).join("")}</div>`;
  }

  function whenText(s) {
    const c = S.get(st, s.id);
    if (!c) return "";
    if (c.dueN != null) return `back in about ${Math.max(1, c.dueN - s.seq)} cards`;
    const d = Math.round((c.dueT - S.startOfDay(Date.now())) / DAY);
    return d <= 1 ? "next review tomorrow" : `next review in ${d} days`;
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
    s.el.querySelectorAll(".opt").forEach(b => { b.disabled = true; if (+b.dataset.i === q.a) b.classList.add("right"); });
    if (q.o && s.pick == null) s.suggest = 0;
    const think = s.el.querySelector(".think"); if (think) think.remove();
    const ans = s.el.querySelector(".answer");
    ans.innerHTML = answerHTML(q, s); ans.hidden = false;
    s.el.querySelector(".foot").innerHTML = footRate(s);
    // Quizzes record a provisional rating right away (wrong or skipped = Didn't know, right = Nailed it),
    // so swiping on keeps it; tapping a rating button replaces it.
    if (q.o) record(s, s.suggest);
    announce("Answer shown. Rate how well you knew it.");
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
    if (s.state !== "ask") return;
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
    s.el.querySelector(".foot").innerHTML = `<div class="rated">Rated <b>${RATES[r]}</b> · ${whenText(s)}</div>${advance ? "" : '<div class="hint-swipe">Swipe up for the next card</div>'}`;
    updateHeader(); updateCtx();
    announce(`Rated ${RATES[r]}, ${whenText(s)}.`);
    if (advance) setTimeout(() => { const i = slides.indexOf(s); if (i === cur) goTo(i + 1); }, 260);
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
    const s = slideOf(e.target); if (!s || s.kind !== "card") return;
    const t = e.target;
    if (t.closest(".bm")) return toggleBookmark(s);
    const opt = t.closest(".opt"); if (opt) return pick(s, +opt.dataset.i);
    if (t.closest(".reveal-btn")) return reveal(s);
    const r = t.closest(".rate"); if (r) return rate(s, +r.dataset.r, true);
    const lt = t.closest(".layer-toggle"); if (lt) return toggleLayer(s, lt.dataset.layer);
    if (t.closest(".deeper")) return toggleDeeper(s);
    const fs = t.closest(".fu-show");
    if (fs) { const open = fs.getAttribute("aria-expanded") !== "true"; fs.setAttribute("aria-expanded", open); fs.textContent = open ? "Hide answer" : "Show answer"; fs.nextElementSibling.hidden = !open; return; }
    // Tap anywhere on an unanswered (non-quiz) card to reveal.
    if (s.state === "ask" && !byId[s.id].o && !t.closest("button, a, .foot") && t.closest(".card")) reveal(s);
  });

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
    if (mode !== "interview" || !s || s.kind !== "card" || s.state !== "ask") return;
    const el = s.el.querySelector(".timer");
    const draw = () => { if (s.state !== "ask" || !el) return clearInterval(timer); const sec = Math.floor((Date.now() - s.t0) / 1000); el.textContent = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); };
    draw(); timer = setInterval(draw, 1000);
  }

  // ---------- modes ----------
  function rebuild() {
    clearInterval(timer);
    observer.disconnect();
    feed.innerHTML = ""; slides = []; cur = 0; ended = false;
    if (mode !== "interview") { st.prefs.mode = mode; persist(); }
    ensureAhead();
    feed.scrollTop = 0;
    if (slides[0]) setCur(0);
    updateTabs(); updateCtx();
  }

  function setMode(m) {
    if (m === "progress") return openSheet("progSheet");
    if (m === "topic") return openSheet("topicSheet");
    if (m === "interview") return startInterview();
    mode = m; interview = null; rebuild();
  }

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startInterview() {
    // 12 mixed questions: every category once, then extra picks from the six core technical areas; mostly intermediate/advanced.
    const pools = {};
    BANK.forEach(q => { if (q.l === 1 && Math.random() < 0.65) return; (pools[q.c] = pools[q.c] || []).push(q.id); });
    Object.values(pools).forEach(shuffle);
    const core = shuffle(["acct", "ev", "val", "dcf", "ma", "lbo"]);
    const order = [...core, ...shuffle(["model", "math"]), ...core];
    const ids = [];
    for (const c of order) { if (ids.length >= INTERVIEW_N) break; const p = pools[c]; if (p && p.length) ids.push(p.pop()); }
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
      <div><div class="lbl">Questions</div><ul class="qlist">${res.map(x => `<li><span class="mk ${x.r == null ? "rx" : "r" + x.r}">${x.r == null ? "–" : ["✗", "~", "✓"][x.r]}</span><span>${esc(x.q.q)}</span></li>`).join("")}</ul></div>
      <div class="rowbtns">
        ${misses.length ? `<button class="ghost" data-act="bm-misses">Bookmark the ${misses.length} misses</button>` : ""}
        <button class="primary" data-act="interview">New interview</button>
        <button class="ghost" data-act="foryou">Back to For You</button>
      </div>`;
    s.misses = misses;
  }

  function panelAction(a) {
    if (a === "foryou") return setMode("foryou");
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
    $("#goalBtn").setAttribute("aria-label", `${today} of ${S.DAILY_GOAL} cards today. Open progress.`);
    const sk = S.streak(st, now);
    $("#streakNum").textContent = sk;
    $("#streak").classList.toggle("on", today > 0);
    $("#streak").title = `${sk}-day streak`;
  }

  function updateTabs() {
    const m = mode === "top100" || mode === "bookmarks" ? null : mode;
    document.querySelectorAll(".tab").forEach(t => { if (t.dataset.mode === m) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
  }

  function updateCtx() {
    const ctx = $("#ctx"), label = $("#ctxLabel"), btn = $("#ctxBtn");
    let text = "", b = "Exit";
    if (mode === "topic") {
      const p = st.prefs;
      const cats = p.cats.length && p.cats.length < 8 ? p.cats.map(c => CATS[c].short || CATS[c].name).join(", ") : "All categories";
      const lv = p.lvls.length === 3 ? "" : " · " + p.lvls.map(l => LEVELS[l]).join(", ");
      text = `Topic Focus · ${cats}${lv}`; b = "Change";
    } else if (mode === "weak") {
      text = `Weak questions · ${BANK.filter(q => S.isWeak(S.get(st, q.id))).length} to fix`;
    } else if (mode === "interview") {
      const s = slides[cur];
      const n = s && s.kind === "card" ? interview.ids.indexOf(s.id) + 1 : interview.ids.length;
      text = `Interview · question ${n} of ${interview.ids.length}`; b = "End";
    } else if (mode === "top100") {
      const m = BANK.filter(q => q.top && S.isMastered(S.get(st, q.id))).length;
      text = `Top 100 · ${m} mastered`;
    } else if (mode === "bookmarks") {
      text = `Bookmarks · ${st.bookmarks.length} saved`;
    }
    ctx.hidden = !text;
    label.textContent = text; btn.textContent = b;
  }
  $("#ctxBtn").addEventListener("click", () => { if (mode === "topic") openSheet("topicSheet"); else setMode("foryou"); });

  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => setMode(t.dataset.mode)));
  $("#goalBtn").addEventListener("click", () => openSheet("progSheet"));
  $("#collectionsBtn").addEventListener("click", () => openSheet("collSheet"));

  // ---------- sheets ----------
  const shade = $("#shade");
  let openId = null, lastFocus = null;
  function openSheet(id) {
    if (openId) closeSheet();
    lastFocus = document.activeElement;
    if (id === "topicSheet") { draft = null; drawTopic(); }
    if (id === "collSheet") drawColl();
    if (id === "progSheet") { drawDash(); drawTheme(); }
    const el = document.getElementById(id);
    el.hidden = false; shade.hidden = false; openId = id;
    const f = el.querySelector("button"); if (f) f.focus({ preventScroll: true });
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
    b.className = "chip"; b.setAttribute("aria-pressed", pressed);
    b.innerHTML = (color ? `<span class="sw" style="--c: var(${color})"></span>` : "") + esc(label);
    b.addEventListener("click", onClick);
    return b;
  }

  // Topic Focus picker works on a draft so closing without Start changes nothing.
  let draft = null;
  function drawTopic() {
    if (!draft) draft = { cats: st.prefs.cats.slice(), lvls: st.prefs.lvls.slice() };
    const cc = $("#catChips"); cc.innerHTML = "";
    Object.keys(CATS).forEach(k => cc.append(chip(CATS[k].name, draft.cats.includes(k), () => {
      draft.cats = draft.cats.includes(k) ? draft.cats.filter(x => x !== k) : [...draft.cats, k]; drawTopic();
    }, `--t-${k}`)));
    const lc = $("#lvlChips"); lc.innerHTML = "";
    [1, 2, 3].forEach(l => lc.append(chip(LEVELS[l], draft.lvls.includes(l), () => {
      draft.lvls = draft.lvls.includes(l) ? draft.lvls.filter(x => x !== l) : [...draft.lvls, l].sort(); drawTopic();
    })));
    const n = BANK.filter(q => (!draft.cats.length || draft.cats.includes(q.c)) && draft.lvls.includes(q.l)).length;
    $("#topicCount").textContent = `${n} cards${draft.cats.length ? "" : " · all categories"}`;
    $("#topicStart").disabled = !n;
  }
  $("#topicStart").addEventListener("click", () => {
    st.prefs.cats = draft.cats; st.prefs.lvls = draft.lvls.length ? draft.lvls : [1, 2, 3]; draft = null;
    closeSheet(); mode = "topic"; interview = null; rebuild();
  });

  function drawColl() {
    const topM = BANK.filter(q => q.top && S.isMastered(S.get(st, q.id))).length;
    const topS = BANK.filter(q => q.top && S.isSeen(S.get(st, q.id))).length;
    $("#collTopSub").textContent = `The most-asked IB technicals · ${topS} studied, ${topM} mastered`;
    $("#collBmSub").textContent = st.bookmarks.length ? `${st.bookmarks.length} saved card${st.bookmarks.length > 1 ? "s" : ""}` : "Tap the bookmark on any card to save it";
  }
  $("#collTop").addEventListener("click", () => { closeSheet(); mode = "top100"; interview = null; rebuild(); });
  $("#collBm").addEventListener("click", () => { closeSheet(); mode = "bookmarks"; interview = null; rebuild(); });

  function drawTheme() {
    const tc = $("#themeChips"); tc.innerHTML = "";
    [["system", "Match device"], ["light", "Light"], ["dark", "Dark"]].forEach(([k, l]) => tc.append(chip(l, st.prefs.theme === k, () => { st.prefs.theme = k; persist(); applyTheme(); drawTheme(); })));
  }
  function applyTheme() {
    const t = st.prefs.theme;
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }

  function drawDash() {
    const now = Date.now();
    const x = S.stats(st, BANK, now);
    const frac = Math.min(1, x.today / x.goal);
    const C = 2 * Math.PI * 42;
    const maxW = Math.max(x.goal, ...x.week.map(w => w.n));
    const dayLetter = k => "SMTWTFS"[new Date(k + "T12:00:00").getDay()];
    const last = (st.interviews || [])[0];
    const weakest = x.weakest.slice(0, 3);
    $("#dash").innerHTML = `
      <div class="dash-top">
        <div class="big-ring ${x.today >= x.goal ? "done" : ""}"><svg viewBox="0 0 96 96" aria-hidden="true"><circle class="track" cx="48" cy="48" r="42"/><circle class="fill" cx="48" cy="48" r="42" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - frac)).toFixed(1)}"/></svg>
          <div class="in"><div><b>${x.today}</b><span>of ${x.goal} today</span></div></div></div>
        <div>
          <div class="week" aria-label="Cards reviewed in the last 7 days">${x.week.map(w => `<div class="wk" title="${w.day}: ${w.n}"><i class="${w.n >= x.goal ? "goal-hit" : ""}" style="height:${Math.round(100 * w.n / maxW)}%"></i><span>${dayLetter(w.day)}</span></div>`).join("")}</div>
          <p class="note">${x.streak ? `${x.streak}-day streak` : "No streak yet"} · best ${x.best}${x.today >= x.goal ? " · goal hit today" : ` · ${Math.max(0, x.goal - x.today)} to go today`}</p>
        </div>
      </div>
      <div class="tiles">
        <div class="tile"><b>${x.studied}</b><span>studied of ${x.total}</span></div>
        <div class="tile"><b>${x.mastered}</b><span>mastered</span></div>
        <div class="tile"><b>${x.dueNow}</b><span>due now</span></div>
        <div class="tile"><b>${x.weak}</b><span>weak</span></div>
      </div>
      <h3>Mastery by category</h3>
      <div class="mastery">${Object.keys(CATS).map(c => { const b = x.byCat[c] || { total: 0, studied: 0, mastered: 0 }; return `<button class="mrow" data-cat="${c}" style="--c: var(--t-${c})" aria-label="${esc(CATS[c].name)}: ${b.mastered} of ${b.total} mastered. Study this topic."><span>${esc(CATS[c].short || CATS[c].name)}</span><span class="track"><span class="studied" style="width:${b.total ? 100 * b.studied / b.total : 0}%"></span><span class="mastered" style="width:${b.total ? 100 * b.mastered / b.total : 0}%"></span></span><span class="pct">${b.mastered}/${b.total}</span></button>`; }).join("")}</div>
      <div class="legend"><span><i></i>mastered</span><span><i class="s"></i>studied</span><span>Tap a row to study it</span></div>
      <h3>Weakest topics</h3>
      ${weakest.length ? `<div class="weakest">${weakest.map(w => `<div class="wrow"><div>${esc(CATS[w.cat].name)}<small>${Math.round(w.rate * 100)}% recall</small></div><button data-cat="${w.cat}">Practice</button></div>`).join("")}</div>` : `<p class="note">Review at least 5 cards in a category to see how it compares.</p>`}
      ${last ? `<h3>Last interview</h3><p class="note">${last.pct}% · ${last.nailed} of ${last.n} nailed · ${new Date(last.t).toLocaleDateString()}</p>` : ""}`;
    $("#dash").querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
      st.prefs.cats = [b.dataset.cat]; st.prefs.lvls = [1, 2, 3]; closeSheet(); mode = "topic"; interview = null; rebuild();
    }));
  }

  let armed = false;
  $("#reset").addEventListener("click", e => {
    if (!armed) { armed = true; e.target.textContent = "Tap again to erase review history (bookmarks stay)"; setTimeout(() => { armed = false; e.target.textContent = "Reset progress"; }, 3500); return; }
    const keep = { bookmarks: st.bookmarks, prefs: st.prefs };
    st = Object.assign(S.blankState(), keep);
    persist(); armed = false; e.target.textContent = "Progress reset";
    drawDash(); updateHeader(); rebuild();
  });

  // ---------- keyboard ----------
  document.addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (openId) { if (e.key === "Escape") closeSheet(); return; }
    const s = slides[cur];
    const k = e.key.toLowerCase();
    const onButton = e.target.closest && e.target.closest("button");
    if (k === "arrowdown" || k === "j" || k === "pagedown") { e.preventDefault(); goTo(cur + 1); return; }
    if (k === "arrowup" || k === "k" || k === "pageup") { e.preventDefault(); goTo(cur - 1); return; }
    if (!s || s.kind !== "card") return;
    const q = byId[s.id];
    if ((k === " " || k === "enter") && !onButton) {
      e.preventDefault();
      if (s.state === "ask") reveal(s); else if (s.state === "rated") goTo(cur + 1);
      return;
    }
    if (k === " " && onButton) return;
    if (/^[1-4]$/.test(k)) {
      const n = +k - 1;
      if (s.state === "ask" && q.o && n < q.o.length) pick(s, n);
      else if (s.state === "revealed" && n <= 2) rate(s, n, true);
      return;
    }
    if (k === "b") return toggleBookmark(s);
    if (s.state === "ask") return;
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
  window.__swipe = { get st() { return st; }, get slides() { return slides; }, get cur() { return cur; }, get mode() { return mode; } };   // for tests
})();
