/* Swipe Techs spaced repetition + progress store.
   Pure logic, no DOM: runs in the browser (window.SRS) and in Node tests (module.exports). */
(function (root) {
  "use strict";

  const DAY = 86400000;
  const LADDER = [1, 3, 7, 14, 30, 60, 120];   // days after each successive "Nailed it" on a new day
  const AGAIN = [3, 5];                         // Didn't know: comes back after 3–5 cards
  const HARD = [10, 15];                        // Partially knew: comes back after 10–15 cards
  const EASE_MIN = 0.6, EASE_MAX = 1.0;          // ease shrinks intervals for cards you struggle with and recovers as you nail them
  const MASTER_DAYS = 3, MASTER_STEP = 3;       // mastered = nailed on 3+ separate days, last review a success
  const V1_KEY = "swipetechs.v1", KEY = "swipetechs.v2";
  const DAILY_GOAL = 20;

  const dayKey = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  // Local midnight N days after t's day (DST-safe: built from calendar fields, not +N*24h).
  const daysLater = (t, n) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d.getTime(); };
  const randInt = (lo, hi, rnd) => lo + Math.floor((rnd || Math.random)() * (hi - lo + 1));
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  function blankCard() {
    return { n: 0, lapses: 0, partials: 0, nails: 0, step: 0, ease: 1, dueN: null, dueT: null, last: null, lastT: 0, firstT: 0, nailDays: 0, lastNailDay: null };
  }

  function blankState() {
    return { v: 2, seq: 0, cards: {}, bookmarks: [], log: {}, prefs: { mode: "foryou", cats: [], lvls: [1, 2, 3], theme: "system" }, interviews: [], migratedFromV1: false };
  }

  /* Convert v1 progress ({rec:{id:{g,m,streak,due,last}}, saved:[]}) without losing anything. */
  function migrateV1(v1, now) {
    const s = blankState();
    if (!v1 || typeof v1 !== "object") return s;
    const rec = v1.rec || {};
    Object.keys(rec).forEach(id => {
      const r = rec[id];
      if (!r || r.last == null) return;
      const c = blankCard();
      c.n = (r.g || 0) + (r.m || 0);
      c.nails = r.g || 0;
      c.lapses = r.m || 0;
      c.firstT = c.lastT = now;
      if (r.last === "m") { c.last = 0; c.dueN = 0; }           // weak: due right away
      else { c.last = 2; c.dueT = startOfDay(now); c.nailDays = 1; c.lastNailDay = "v1"; } // known before: confirm today
      s.cards[id] = c;
    });
    s.bookmarks = Array.isArray(v1.saved) ? v1.saved.slice() : [];
    s.migratedFromV1 = true;
    return s;
  }

  function load(storage, now) {
    now = now || Date.now();
    let s = null;
    try { const raw = storage && storage.getItem(KEY); if (raw) s = JSON.parse(raw); } catch (e) { s = null; }
    if (!s || s.v !== 2) {
      let v1 = null;
      try { const raw = storage && storage.getItem(V1_KEY); if (raw) v1 = JSON.parse(raw); } catch (e) { v1 = null; }
      s = v1 ? migrateV1(v1, now) : blankState();
      save(storage, s);                       // v1 key is left untouched on purpose
    }
    const b = blankState();
    for (const k in b) if (!(k in s)) s[k] = b[k];
    for (const k in b.prefs) if (!(k in s.prefs)) s.prefs[k] = b.prefs[k];
    return s;
  }

  function save(storage, s) { try { storage && storage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: keep in memory */ } }

  const get = (s, id) => s.cards[id] || null;
  const ensure = (s, id) => s.cards[id] || (s.cards[id] = blankCard());

  /* What each rating would schedule, for the hint under each button. */
  function preview(s, id, now) {
    const c = get(s, id) || blankCard();
    return [0, 1, 2].map(r => {
      const t = rateCard(JSON.parse(JSON.stringify(c)), r, now, 0, () => 0.5);
      if (t.dueN != null) return "~" + t.dueN + " cards";
      const d = Math.round((t.dueT - startOfDay(now)) / DAY);
      return d <= 1 ? "tomorrow" : d + " days";
    });
  }

  /* Core scheduler. pos = feed position of the card being rated; dueN is stored as an absolute position. */
  function rateCard(c, r, now, pos, rnd) {
    const today = dayKey(now);
    if (!c.firstT) c.firstT = now;
    const prev = c.last;
    c.n++; c.lastT = now; c.last = r;
    if (r === 0) {
      c.lapses++; c.step = 0; c.ease = clamp(c.ease - 0.2, EASE_MIN, EASE_MAX);
      c.dueN = pos + randInt(AGAIN[0], AGAIN[1], rnd); c.dueT = null;
    } else if (r === 1) {
      c.partials++; c.step = Math.max(0, c.step - 1); c.ease = clamp(c.ease - 0.05, EASE_MIN, EASE_MAX);
      c.dueN = pos + randInt(HARD[0], HARD[1], rnd); c.dueT = null;
    } else {
      c.nails++;
      const learning = c.dueN != null || c.dueT == null;      // new card, or recovering from a miss/partial
      const early = !learning && c.dueT > now;                // reviewed before it was due (e.g. from a collection)
      if (c.lastNailDay !== today) { c.nailDays++; c.lastNailDay = today; }
      if (learning) {
        c.dueT = daysLater(now, Math.max(1, Math.round(LADDER[0] * Math.min(c.ease, 1))));
        c.step = Math.max(c.step, 1);
      } else if (!early) {
        const days = Math.max(1, Math.round(LADDER[Math.min(c.step, LADDER.length - 1)] * c.ease));
        c.dueT = daysLater(now, days);
        c.step++;
        if (prev === 2) c.ease = clamp(c.ease + 0.05, EASE_MIN, EASE_MAX);   // recover slowly after a rough patch
      }
      // early success keeps the existing schedule: cramming doesn't inflate intervals
      c.dueN = null;
    }
    return c;
  }

  function rate(s, id, r, now, pos, rnd) {
    const c = rateCard(ensure(s, id), r, now, pos, rnd);
    const k = dayKey(now);
    s.log[k] = (s.log[k] || 0) + 1;
    return c;
  }

  const isMastered = c => !!c && c.last === 2 && c.nailDays >= MASTER_DAYS && c.step >= MASTER_STEP;
  const isSeen = c => !!c && c.n > 0;
  const weakness = c => {
    if (!c || !c.n) return 0;
    const bad = 2 * c.lapses + c.partials;
    if (!bad) return 0;
    if (isMastered(c)) return 0;
    return bad / c.n + (c.last !== 2 ? 1 : 0) + Math.min(c.lapses, 5) * 0.1;
  };
  const isWeak = c => weakness(c) >= 0.6;

  /* Pick the next card id from candidate ids.
     Order: learning cards whose position has come up → reviews due today (mixed with new) → new → extra practice. */
  function pickNext(s, ids, opts) {
    const { pos, now, recent = [], rnd = Math.random, order = null, mode = "foryou", exclude = null } = opts;
    if (exclude) ids = ids.filter(id => !exclude.has(id));   // cards already waiting in the feed
    if (!ids.length) return null;

    if (mode === "weak") {
      const w = ids.filter(id => isWeak(get(s, id))).sort((a, b) => weakness(get(s, b)) - weakness(get(s, a)));
      if (!w.length) return null;
      const avoidW = new Set(recent.slice(-Math.min(6, w.length - 1)));
      const ok = w.filter(id => !avoidW.has(id));
      const from = ok.length ? ok : w;
      return from[Math.floor(rnd() * Math.min(3, from.length))];
    }

    const avoid = new Set(recent.slice(-Math.min(6, ids.length - 1)));
    const ok = ids.filter(id => !avoid.has(id));
    const pool = ok.length ? ok : ids;

    // Learning cards ignore the repeat-avoidance window (they're meant to come back after 3–5 cards).
    const justSeen = new Set(recent.slice(-2));
    const learn = ids.filter(id => { const c = get(s, id); return c && c.dueN != null && c.dueN <= pos && !justSeen.has(id); })
      .sort((a, b) => get(s, a).dueN - get(s, b).dueN);
    if (learn.length) return learn[0];

    const due = pool.filter(id => { const c = get(s, id); return c && c.dueN == null && c.dueT != null && c.dueT <= now; })
      .sort((a, b) => weakness(get(s, b)) - weakness(get(s, a)) || get(s, a).dueT - get(s, b).dueT);
    let fresh = pool.filter(id => !isSeen(get(s, id)));
    if (order) fresh.sort((a, b) => (order[a] ?? 1e9) - (order[b] ?? 1e9));

    if (due.length && fresh.length) return rnd() < 0.6 ? due[0] : pickFresh(fresh, rnd, order);
    if (due.length) return due[0];
    if (fresh.length) return pickFresh(fresh, rnd, order);

    // Nothing due and nothing new: extra practice. Learning cards not yet due first, then weakest, then oldest.
    const rest = pool.slice().sort((a, b) => {
      const ca = get(s, a), cb = get(s, b);
      const la = ca && ca.dueN != null ? 0 : 1, lb = cb && cb.dueN != null ? 0 : 1;
      return la - lb || weakness(cb) - weakness(ca) || (ca ? ca.lastT : 0) - (cb ? cb.lastT : 0);
    });
    return rest[0];
  }
  // New cards: follow the given order loosely (top of the list first) so it still feels varied.
  function pickFresh(fresh, rnd, order) {
    if (!order) return fresh[Math.floor(rnd() * fresh.length)];
    return fresh[Math.floor(rnd() * Math.min(5, fresh.length))];
  }

  function streak(s, now) {
    let n = 0, t = now;
    if (!s.log[dayKey(t)]) t = daysLater(t, -1);             // today not started yet: streak still alive from yesterday
    while (s.log[dayKey(t)]) { n++; t = daysLater(t, -1); }
    return n;
  }
  function bestStreak(s) {
    const days = Object.keys(s.log).filter(k => s.log[k] > 0).sort();
    let best = 0, cur = 0, prev = null;
    days.forEach(k => {
      const t = new Date(k + "T12:00:00").getTime();
      cur = prev != null && Math.round((t - prev) / DAY) === 1 ? cur + 1 : 1;
      best = Math.max(best, cur); prev = t;
    });
    return best;
  }

  function stats(s, bank, now) {
    const byCat = {};
    let studied = 0, mastered = 0, dueNow = 0, weak = 0;
    bank.forEach(q => {
      const c = get(s, q.id);
      const b = byCat[q.c] || (byCat[q.c] = { total: 0, studied: 0, mastered: 0, n: 0, score: 0 });
      b.total++;
      if (!isSeen(c)) return;
      studied++; b.studied++; b.n += c.n; b.score += c.nails + 0.5 * c.partials;
      if (isMastered(c)) { mastered++; b.mastered++; }
      if ((c.dueN != null) || (c.dueT != null && c.dueT <= now)) dueNow++;
      if (isWeak(c)) weak++;
    });
    const today = s.log[dayKey(now)] || 0;
    const week = [];
    for (let i = 6; i >= 0; i--) { const t = daysLater(now, -i); week.push({ day: dayKey(t), n: s.log[dayKey(t)] || 0 }); }
    const weakest = Object.keys(byCat).filter(k => byCat[k].n >= 5)
      .map(k => ({ cat: k, rate: byCat[k].score / byCat[k].n })).sort((a, b) => a.rate - b.rate);
    return { total: bank.length, studied, mastered, dueNow, weak, today, goal: DAILY_GOAL, streak: streak(s, now), best: bestStreak(s), byCat, week, weakest };
  }

  const api = { DAY, LADDER, AGAIN, HARD, KEY, V1_KEY, DAILY_GOAL, dayKey, startOfDay, daysLater, blankState, blankCard, migrateV1, load, save, get, rate, rateCard, preview, isMastered, isSeen, isWeak, weakness, pickNext, streak, bestStreak, stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.SRS = api;
})(typeof window !== "undefined" ? window : globalThis);
