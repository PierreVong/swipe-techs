/* Chill Mode store and picker. Passive exposure only: nothing here touches the spaced repetition state in srs.js.
   Saved separately under its own key so Chill never counts toward mastery, streaks or the daily goal. */
(function (root) {
  "use strict";
  const KEY = "swipetechs.chill.v1";
  const DAY = 86400000;
  const RESURFACE = 0.2;        // share of picks that bring back a concept seen on an earlier day, once unseen ones remain

  const blank = () => ({ v: 1, seen: {}, bm: [], cats: [] });

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

  /* Next concept for the feed.
     ids: the concepts in the current selection; meta: id -> {c, t}; session: ids already shown this session, in order.
     Order of preference: unseen (varied by topic and card type) -> seen on an earlier day (oldest first, sometimes
     mixed in early for reinforcement) -> anything not in the last few cards. Never repeats within a session until
     the whole selection has been shown. */
  function pick(c, ids, opts) {
    const o = opts || {};
    const now = o.now || Date.now(), rnd = o.rnd || Math.random, session = o.session || [], meta = o.meta || {};
    if (!ids.length) return null;
    const shown = new Set(session);
    const last = session.length ? meta[session[session.length - 1]] : null;
    const fresh = ids.filter(id => !c.seen[id] && !shown.has(id));
    const old = ids.filter(id => c.seen[id] && !shown.has(id)).sort((a, b) => c.seen[a].t - c.seen[b].t);
    const stale = old.filter(id => now - c.seen[id].t >= DAY);
    if (fresh.length && !(stale.length && rnd() < RESURFACE)) return varied(fresh, last, meta, rnd);
    if (stale.length) return stale[Math.floor(rnd() * Math.min(3, stale.length))];
    if (old.length) return old[0];
    // Everything in this selection was shown this session: start over, avoiding the most recent cards.
    const recent = new Set(session.slice(-Math.min(8, ids.length - 1)));
    const pool = ids.filter(id => !recent.has(id));
    return pool.length ? varied(pool, last, meta, rnd) : ids[0];
  }
  // Prefer a different topic and card type from the previous card so the feed doesn't feel repetitive.
  function varied(pool, last, meta, rnd) {
    if (last) {
      const both = pool.filter(id => meta[id] && meta[id].c !== last.c && meta[id].t !== last.t);
      const one = pool.filter(id => meta[id] && (meta[id].c !== last.c || meta[id].t !== last.t));
      pool = both.length ? both : one.length ? one : pool;
    }
    return pool[Math.floor(rnd() * pool.length)];
  }

  function stats(c, cards) {
    const ids = new Set(cards.map(x => x.id));
    return { total: cards.length, seen: Object.keys(c.seen).filter(id => ids.has(id)).length, saved: c.bm.filter(id => ids.has(id)).length };
  }

  const api = { KEY, blank, load, save, markSeen, toggleBm, pick, stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.CHILLS = api;
})(typeof window !== "undefined" ? window : globalThis);
