/* Chill Mode store and picker. Passive exposure only: nothing here touches the spaced repetition state in srs.js.
   Saved separately under its own key so Chill never counts toward mastery, streaks or the daily goal. */
(function (root) {
  "use strict";
  const KEY = "swipetechs.chill.v1";
  const DAY = 86400000;
  const RESUME = 12 * 3600000;  // reopening Chill within this long continues where you left off
  const RESURFACE = 0.2;        // share of picks that bring back a concept seen on an earlier day, once unseen ones remain
  const RECENT = 60;            // ids kept to avoid repeats when a session is resumed

  // seen: id -> {n, t}; bm: saved ids; cats: topic filter; like: id -> time ("More like this");
  // int: id -> small interest score (Learn more, Test me); pos: {id, t} last card on screen; recent: this session's ids.
  const blank = () => ({ v: 1, seen: {}, bm: [], cats: [], like: {}, int: {}, pos: null, recent: [] });

  function load(storage) {
    let c = null;
    try { const raw = storage && storage.getItem(KEY); if (raw) c = JSON.parse(raw); } catch (e) { c = null; }
    if (!c || c.v !== 1) c = blank();
    const b = blank();
    for (const k in b) if (!(k in c)) c[k] = b[k];
    return c;
  }
  function save(storage, c) { try { storage && storage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* storage full or blocked */ } }

  function markSeen(c, id, now) {
    const x = c.seen[id] || (c.seen[id] = { n: 0, t: 0 });
    x.n++; x.t = now;
    return x;
  }
  function toggleBm(c, id) {
    const on = !c.bm.includes(id);
    c.bm = on ? [...c.bm, id] : c.bm.filter(x => x !== id);
    return on;
  }
  function toggleLike(c, id, now) {
    const on = !c.like[id];
    if (on) c.like[id] = now || Date.now(); else delete c.like[id];
    return on;
  }
  function interest(c, id) { c.int[id] = Math.min(3, (c.int[id] || 0) + 1); }

  // Where you were: the last card on screen and the session so far, if it was recent enough to continue.
  function setPos(c, id, session, now) {
    c.pos = { id, t: now || Date.now() };
    c.recent = session.slice(-RECENT);
  }
  function resume(c, now) {
    const t = now || Date.now();
    return c.pos && t - c.pos.t < RESUME ? { id: c.pos.id, session: c.recent.slice() } : null;
  }

  /* What you've shown interest in, as weights per tag and per topic: saves and More like this count most,
     Learn more and Test me a little. Used to tilt (never fill) the feed toward related concepts. */
  function taste(c, meta) {
    const tag = {}, cat = {};
    const add = (id, w) => { const m = meta[id]; if (!m) return; cat[m.c] = (cat[m.c] || 0) + w; (m.k || []).forEach(k => { tag[k] = (tag[k] || 0) + w; }); };
    c.bm.forEach(id => add(id, 2));
    Object.keys(c.like).forEach(id => add(id, 3));
    Object.keys(c.int).forEach(id => add(id, c.int[id] * 0.5));
    return { tag, cat };
  }
  const affinity = (m, t) => m ? Math.min(3, 0.5 * (m.k || []).reduce((a, k) => a + (t.tag[k] || 0), 0) + 0.2 * (t.cat[m.c] || 0)) : 0;

  /* Next concept for the feed.
     ids: the concepts in the current selection; meta: id -> {c, t, x, k, core}; session: ids already shown, in order.
     Order of preference: unseen (varied, tilted toward what you've liked) -> seen on an earlier day (saved, liked and
     core ideas first, sometimes mixed in early for reinforcement) -> anything not in the last few cards. Never repeats
     within a session until the whole selection has been shown. */
  function pick(c, ids, opts) {
    const o = opts || {};
    const now = o.now || Date.now(), rnd = o.rnd || Math.random, session = o.session || [], meta = o.meta || {};
    if (!ids.length) return null;
    const shown = new Set(session);
    const recent = session.slice(-3).map(id => meta[id]).filter(Boolean);
    const fresh = ids.filter(id => !c.seen[id] && !shown.has(id));
    const old = ids.filter(id => c.seen[id] && !shown.has(id));
    const stale = old.filter(id => now - c.seen[id].t >= DAY);
    if (fresh.length && !(stale.length && rnd() < RESURFACE)) {
      const t = taste(c, meta);
      return weighted(varied(fresh, recent, meta), id => 1 + affinity(meta[id], t), rnd);
    }
    if (stale.length) {
      const score = id => (c.bm.includes(id) ? 3 : 0) + (c.like[id] ? 3 : 0) + (meta[id] && meta[id].core ? 2 : 0) + Math.min(2, (now - c.seen[id].t) / (7 * DAY));
      const top = varied(stale, recent, meta).sort((a, b) => score(b) - score(a));
      return top[Math.floor(rnd() * Math.min(3, top.length))];
    }
    if (old.length) return varied(old.sort((a, b) => c.seen[a].t - c.seen[b].t), recent, meta)[0];
    // Everything in this selection was shown this session: start over, avoiding the most recent cards.
    const last = new Set(session.slice(-Math.min(8, ids.length - 1)));
    const pool = ids.filter(id => !last.has(id));
    return pool.length ? varied(pool, recent, meta)[Math.floor(rnd() * Math.min(pool.length, 3))] : ids[0];
  }

  /* Keep the feed from feeling repetitive: prefer a different topic from the last two cards, a different card type
     and example style from the last one, and no shared concept with the last three. Relaxes one rule at a time. */
  function varied(pool, recent, meta) {
    if (!recent.length) return pool;
    const prev = recent[recent.length - 1], two = recent.slice(-2);
    const tags = new Set(recent.flatMap(m => m.k || []));
    const rules = [
      m => !two.some(r => r.c === m.c),
      m => m.t !== prev.t,
      m => !(m.k || []).some(k => tags.has(k)),
      m => m.x !== prev.x,
    ];
    for (let n = rules.length; n > 0; n--) {
      const ok = pool.filter(id => meta[id] && rules.slice(0, n).every(r => r(meta[id])));
      if (ok.length) return ok;
    }
    return pool;
  }
  function weighted(pool, w, rnd) {
    const ws = pool.map(w), tot = ws.reduce((a, b) => a + b, 0);
    let r = rnd() * tot;
    for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r < 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  /* Rabbit hole: concepts that share the most tags with this one, unseen ones first, then the core ideas. */
  function related(c, id, ids, meta, n) {
    const m = meta[id]; if (!m) return [];
    const mine = new Set(m.k || []);
    return ids.filter(x => x !== id && meta[x] && (meta[x].k || []).some(k => mine.has(k)))
      .map(x => ({ x, s: (meta[x].k || []).filter(k => mine.has(k)).length * 2 + (c.seen[x] ? 0 : 1.5) + (meta[x].core ? 0.5 : 0) + (meta[x].c === m.c ? 0 : 0.25) }))
      .sort((a, b) => b.s - a.s || (a.x < b.x ? -1 : 1))
      .slice(0, n || 4).map(r => r.x);
  }

  function stats(c, cards) {
    const ids = new Set(cards.map(x => x.id));
    return { total: cards.length, seen: Object.keys(c.seen).filter(id => ids.has(id)).length, saved: c.bm.filter(id => ids.has(id)).length };
  }

  const api = { KEY, RESUME, blank, load, save, markSeen, toggleBm, toggleLike, interest, setPos, resume, taste, pick, related, stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CHILLS = api;
})(typeof window !== "undefined" ? window : globalThis);
