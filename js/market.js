/* Market Feed: short news stories inside Chill Mode. Story aging, ranking and the news side of the feed.
   Its own store, separate from Chill concepts and from srs.js: reading news never counts toward mastery,
   streaks or the daily goal. Stories come from data/market.json (built by tools/market/, see README). */
(function (root) {
  "use strict";
  const KEY = "swipetechs.market.v1";
  const DATA_KEY = "swipetechs.market.data";
  const HOUR = 3600000, DAY = 24 * HOUR;
  const TTL = HOUR;             // reuse the downloaded stories for this long before asking the network again
  const COOLDOWN = 12 * HOUR;   // a story you've read waits at least this long before it can come back with something new

  // Stage boundaries in days since publication (end of each stage), by kind of news. Deals move slowly and stay
  // relevant for weeks; a market move is old news in days. The last number is when a story leaves the active feed:
  // educational ones become Historical context, the rest are archived.
  const STAGES = ["recent", "developing", "weekly", "big", "hist"];
  const PROFILES = {
    default: [1, 3, 7, 30],
    fed: [1, 3, 7, 30], macro: [1, 3, 7, 30], intl: [1, 3, 7, 30], credit: [1, 3, 7, 30],
    ma: [2, 7, 14, 60], pe: [2, 7, 14, 60], ipo: [2, 7, 14, 45],
    earnings: [1, 4, 10, 30], equity: [1, 2, 5, 14],
  };
  const STAGE_WEIGHT = { recent: 1, developing: 0.8, weekly: 0.55, big: 0.35, hist: 0.2 };
  // Pierre's priority order for an investment banking reader.
  const CAT_WEIGHT = { ma: 1, fed: 0.95, pe: 0.9, equity: 0.8, ipo: 0.75, earnings: 0.7, credit: 0.7, intl: 0.65, macro: 0.75 };
  const CATS = {
    ma: "M&A", fed: "Fed & rates", pe: "Private equity", equity: "Stocks", ipo: "IPOs", earnings: "Earnings",
    credit: "Credit & bonds", intl: "Global", macro: "Economy",
  };
  // What kind of fact this is. Rumors are never presented as done deals.
  const STATUS = {
    rumor: "Reported, not confirmed", announced: "Announced", pending: "Pending approval", completed: "Completed",
    terminated: "Called off", decision: "Decision", data: "Data release", filed: "Filed", priced: "Priced", report: "Reported",
  };
  const FEEDS = ["concepts", "markets", "mixed"];

  // seen: story id -> {t, n, u (updates you'd seen), s (stage index you saw it in)}; feed: last selector choice.
  const blank = () => ({ v: 1, feed: "mixed", seen: {} });
  function load(storage) {
    let c = null;
    try { const raw = storage && storage.getItem(KEY); if (raw) c = JSON.parse(raw); } catch (e) { c = null; }
    if (!c || c.v !== 1) c = blank();
    const b = blank();
    for (const k in b) if (!(k in c)) c[k] = b[k];
    if (!FEEDS.includes(c.feed)) c.feed = "mixed";
    return c;
  }
  function save(storage, c) { try { storage && storage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* storage full or blocked */ } }

  const time = s => { const t = Date.parse(s); return isNaN(t) ? null : t; };
  const updatesOf = (x, now) => (x.updates || []).filter(u => time(u.t) != null && time(u.t) <= now);

  /* Where a story is in its life. Age decides the stage; content only changes when a verified update exists.
     Returns {key, i, label, age (ms), fresh (has an update newer than the original)} or null if archived. */
  function stage(x, now) {
    const pub = time(x.published);
    if (pub == null) return null;
    const age = Math.max(0, now - pub);
    const p = PROFILES[x.cat] || PROFILES.default;
    let i = p.findIndex(d => age < d * DAY);
    if (i === -1) i = 4;
    if (i === 4 && !x.evergreen) return null;                 // past its window and not worth keeping: archived
    const ups = updatesOf(x, now);
    const key = STAGES[i];
    // "Developing story" only when something new was actually reported; otherwise just say how old it is.
    const label = key === "recent" ? "Recent news" : key === "developing" ? (ups.length ? "Developing story" : "Past few days")
      : key === "weekly" ? "Weekly context" : key === "big" ? "Bigger picture" : "Historical context";
    return { key, i, label, age, fresh: ups.length > 0 };
  }

  // Ranked by financial significance first, then how current it is; an update you haven't read lifts it back up.
  function score(x, now, seen) {
    const s = stage(x, now);
    if (!s) return 0;
    const sig = Math.max(1, Math.min(100, +x.sig || 50));
    const ups = updatesOf(x, now).length;
    const newUpdate = seen && ups > (seen.u || 0);
    const w = newUpdate ? Math.max(STAGE_WEIGHT[s.key], 0.8) : STAGE_WEIGHT[s.key];
    return sig * w * (CAT_WEIGHT[x.cat] || 0.6);
  }

  /* Can this story be shown now? Never twice in a session. A story you've read only comes back when there is a
     verified update you haven't seen, or when it has moved to a later stage with its own explanation (a genuinely
     different angle), and not within COOLDOWN of the last time. */
  function eligible(c, x, now, shown) {
    if (!x || shown.has(x.id)) return false;
    const s = stage(x, now);
    if (!s) return false;
    const seen = c.seen[x.id];
    if (!seen) return true;
    if (now - seen.t < COOLDOWN) return false;
    if (updatesOf(x, now).length > (seen.u || 0)) return true;
    return s.i > (seen.s || 0) && s.i >= 2 && !!lens(x, s);
  }

  // The explanation for this stage: later stages use the broader context written with the story (interpretation,
  // never new facts). Returns null when the story has nothing new to say at this stage.
  function lens(x, s) {
    if (s.key === "hist") return x.hist || x.ctx || null;
    if (s.key === "weekly" || s.key === "big") return x.ctx || null;
    return null;
  }

  /* Next story for the feed. stories: all stories; shown: ids already on screen this session;
     prev: the previous news story (to vary the kind of news and never show two on the same thread back to back). */
  function pick(c, stories, opts) {
    const o = opts || {};
    const now = o.now || Date.now(), rnd = o.rnd || Math.random, shown = new Set(o.shown || []);
    const prev = o.prev || null;
    let pool = stories.filter(x => eligible(c, x, now, shown));
    if (!pool.length) return null;
    if (prev) {
      const notThread = pool.filter(x => !(prev.thread && x.thread === prev.thread));
      if (notThread.length) pool = notThread;
      const otherCat = pool.filter(x => x.cat !== prev.cat);
      // Keep variety without burying a much more important story of the same kind.
      if (otherCat.length) {
        const best = Math.max(...pool.map(x => score(x, now, c.seen[x.id])));
        const bestOther = Math.max(...otherCat.map(x => score(x, now, c.seen[x.id])));
        if (bestOther >= best * 0.6) pool = otherCat;
      }
    }
    const ranked = pool.map(x => ({ x, s: score(x, now, c.seen[x.id]) })).sort((a, b) => b.s - a.s || (a.x.id < b.x.id ? -1 : 1));
    // Mostly the top story, sometimes the second or third, so two visits don't feel identical.
    const r = rnd();
    const k = ranked.length > 2 && r > 0.85 ? 2 : ranked.length > 1 && r > 0.6 ? 1 : 0;
    return ranked[k].x;
  }

  function markSeen(c, x, now) {
    const s = stage(x, now);
    const prev = c.seen[x.id] || { n: 0 };
    c.seen[x.id] = { t: now, n: (prev.n || 0) + 1, u: updatesOf(x, now).length, s: s ? s.i : 0 };
  }

  /* Mixed feed: after a couple of concept cards, a news story (if one is available), never two stories in a row.
     sinceNews: concept cards since the last story (Infinity at the start). */
  function newsTurn(sinceNews, available, rnd) {
    if (!available) return false;
    if (sinceNews === Infinity) return rnd() < 0.5;
    if (sinceNews < 2) return false;
    return sinceNews >= 4 || rnd() < 0.55;
  }

  // Keep only well-formed stories, so a bad file can never break the feed.
  function clean(data) {
    const ok = x => x && typeof x.id === "string" && CATS[x.cat] && STATUS[x.status] && x.hook && x.what && x.why && x.ib
      && x.src && /^https:\/\//.test(x.src.url || "") && x.src.name && time(x.published) != null;
    const list = data && Array.isArray(data.stories) ? data.stories : [];
    const seen = new Set();
    return list.filter(x => ok(x) && !seen.has(x.id) && seen.add(x.id)).map(x => ({
      ...x, updates: (x.updates || []).filter(u => u && u.text && u.src && /^https:\/\//.test(u.src.url || "") && time(u.t) != null),
    }));
  }

  // Cached download: {t (when fetched), generated, stories}.
  function cached(storage) {
    try { const raw = storage && storage.getItem(DATA_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function cache(storage, data, now) {
    try { storage && storage.setItem(DATA_KEY, JSON.stringify({ t: now, generated: data.generated || null, stories: data.stories })); } catch (e) { /* full */ }
  }
  const stale = (entry, now) => !entry || now - entry.t > TTL;

  function stats(c, stories, now) {
    const live = stories.filter(x => stage(x, now));
    return { live: live.length, unread: live.filter(x => !c.seen[x.id]).length };
  }

  const api = { KEY, DATA_KEY, TTL, COOLDOWN, PROFILES, STAGES, CATS, STATUS, FEEDS, blank, load, save, stage, score, eligible, lens, pick, markSeen, newsTurn, clean, cached, cache, stale, stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.MARKET = api;
})(typeof window !== "undefined" ? window : globalThis);
