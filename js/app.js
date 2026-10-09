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
    const kind = q.k !== "concept" ? `<span class="dot">·</span><span>${KINDS[q.k]}</span>` : "";
    el.innerHTML = `<article class="card ask ${size}" style="--topic: var(--t-${q.c})" aria-label="${esc(CATS[q.c].name)} question">
      <div class="card-head">
        <div class="meta"><span class="cat">${esc(CATS[q.c].name)}</span><span class="dot">·</span><span>${LEVELS[q.l]}</span>${kind}${badgesFor(q)}</div>
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

  function answerHTML(q, s) {
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
    const s = slideOf(e.target); if (!s || s.kind !== "card") return;
    const t = e.target;
    if (t.closest(".bm")) return toggleBookmark(s);
    const opt = t.closest(".opt"); if (opt) return pick(s, +opt.dataset.i);
    if (t.closest(".reveal-btn")) return reveal(s);
    const r = t.closest(".rate"); if (r) return rate(s, +r.dataset.r, true);
    const lt = t.closest(".layer-toggle"); if (lt) return toggleLayer(s, lt.dataset.layer);
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
      const n = BANK.filter(q => S.isWeak(S.get(st, q.id))).length;
      text = `Review · ${n} weak question${n === 1 ? "" : "s"} to fix`;
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
  let draft = null;
  const inTopic = (d, q) => (!d.cats.length || d.cats.includes(q.c)) && d.lvls.includes(q.l);
  function drawTopic() {
    if (!draft) draft = { cats: st.prefs.cats.slice(), lvls: st.prefs.lvls.slice() };
    const cc = $("#catChips"); cc.innerHTML = "";
    cc.append(chip("All topics", !draft.cats.length, () => { draft.cats = []; drawTopic(); }));
    Object.keys(CATS).forEach(k => cc.append(chip(CATS[k].name, draft.cats.includes(k), () => {
      draft.cats = draft.cats.includes(k) ? draft.cats.filter(x => x !== k) : [...draft.cats, k];
      if (draft.cats.length === Object.keys(CATS).length) draft.cats = [];
      drawTopic();
    }, `--t-${k}`)));
    const lc = $("#lvlChips"); lc.innerHTML = "";
    [1, 2, 3].forEach(l => lc.append(chip(LEVELS[l], draft.lvls.includes(l), () => {
      draft.lvls = draft.lvls.includes(l) ? draft.lvls.filter(x => x !== l) : [...draft.lvls, l].sort(); drawTopic();
    })));
    const now = Date.now();
    const pool = BANK.filter(q => inTopic(draft, q));
    const due = pool.filter(q => { const c = S.get(st, q.id); return c && (c.dueN != null || (c.dueT != null && c.dueT <= now)); }).length;
    const fresh = pool.filter(q => !S.isSeen(S.get(st, q.id))).length;
    const cats = draft.cats.length ? draft.cats.map(c => CATS[c].short || CATS[c].name).join(", ") : "All topics";
    const lv = !draft.lvls.length ? "pick a level" : draft.lvls.length === 3 ? "all levels" : draft.lvls.map(l => LEVELS[l]).join(", ");
    $("#topicSel").textContent = `${cats} · ${lv}`;
    $("#topicCount").textContent = pool.length ? `${pool.length} questions · ${due} due · ${fresh} new` : "No questions match";
    $("#topicStart").disabled = !pool.length;
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

  // ---------- settings ----------
  function drawSettings() {
    const tc = $("#themeChips"); tc.innerHTML = "";
    [["system", "Match device"], ["light", "Light"], ["dark", "Dark"]].forEach(([k, l]) => tc.append(chip(l, st.prefs.theme === k, () => { st.prefs.theme = k; persist(); applyTheme(); drawSettings(); })));
    const tm = $("#timerChips"); tm.innerHTML = "";
    [[true, "Show timer"], [false, "Hide timer"]].forEach(([v, l]) => tm.append(chip(l, (st.prefs.timer !== false) === v, () => { if ((st.prefs.timer !== false) !== v) toggleTimer(); drawSettings(); })));
  }
  function applyTheme() {
    const t = st.prefs.theme;
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
      <div class="mastery">${Object.keys(CATS).map(c => {
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
      ${last ? `<h3>Last interview</h3><p class="note">${last.pct}% · ${last.nailed} of ${last.n} nailed · ${new Date(last.t).toLocaleDateString()}</p>` : ""}`;
    $("#dash").querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
      st.prefs.cats = [b.dataset.cat]; st.prefs.lvls = [1, 2, 3]; closeSheet(); mode = "topic"; interview = null; rebuild();
    }));
  }

  let armed = false;
  $("#reset").addEventListener("click", e => {
    const b = e.currentTarget;
    if (!armed) { armed = true; b.textContent = "Tap again to erase review history (bookmarks stay)"; setTimeout(() => { armed = false; b.textContent = "Reset progress"; }, 3500); return; }
    const keep = { bookmarks: st.bookmarks, prefs: st.prefs };
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
