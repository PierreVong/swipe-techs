// Market Feed in the app (js/market.js): aging, ranking, repetition rules, the Mixed rhythm, and the starter stories.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const MK = require("../js/market.js");

const H = 3600000, D = 24 * H, NOW = Date.parse("2026-10-12T12:00:00Z");
const iso = t => new Date(t).toISOString();
const story = (o = {}) => ({ id: "s", cat: "ma", status: "announced", sig: 70, hook: "h", what: "w", why: "y", ib: "i", src: { name: "S", url: "https://e.com" }, published: iso(NOW - 2 * H), updates: [], ...o });
const seq = xs => { let i = 0; return () => xs[i++ % xs.length]; };

test("stages follow age and the kind of news; labels never claim news that didn't happen", () => {
  const at = (cat, age, o) => MK.stage(story({ cat, published: iso(NOW - age), ...o }), NOW);
  assert.equal(at("fed", 5 * H).label, "Recent news");
  assert.equal(at("fed", 2 * D).label, "Past few days", "no update: just its age");
  assert.equal(at("fed", 2 * D, { updates: [{ t: iso(NOW - H), text: "x", src: { name: "S", url: "https://e.com/2" } }] }).label, "Developing story");
  assert.equal(at("fed", 5 * D).label, "Weekly context");
  assert.equal(at("fed", 20 * D).label, "Bigger picture");
  assert.equal(at("fed", 40 * D), null, "archived after 30 days");
  assert.equal(at("fed", 40 * D, { evergreen: true }).label, "Historical context");
  // Deals stay current longer than a market move.
  assert.equal(at("ma", 5 * D).key, "developing");
  assert.equal(at("equity", 5 * D).key, "big");
  assert.equal(at("ma", 50 * D).key, "big");
  // An update dated in the future (clock skew) doesn't count yet.
  assert.equal(at("fed", 2 * D, { updates: [{ t: iso(NOW + H), text: "x", src: { name: "S", url: "https://e.com/2" } }] }).label, "Past few days");
});

test("ranking: significance first, then freshness; an unseen update lifts a story back up", () => {
  const big = story({ id: "big", sig: 90, published: iso(NOW - 3 * D) });
  const small = story({ id: "small", sig: 40, published: iso(NOW - H) });
  assert.ok(MK.score(big, NOW) > MK.score(small, NOW), "a big deal from 3 days ago beats a small one from today");
  const old = story({ id: "o", cat: "fed", sig: 90, published: iso(NOW - 10 * D), updates: [{ t: iso(NOW - H), text: "u", src: { name: "S", url: "https://e.com/u" } }] });
  assert.ok(MK.score(old, NOW, { u: 0 }) > MK.score(old, NOW, { u: 1 }));
  assert.equal(MK.score(story({ cat: "fed", published: iso(NOW - 60 * D) }), NOW), 0, "archived stories never rank");
});

test("repetition: never twice in a session; back only with a new update or a new angle, after a rest", () => {
  const c = MK.blank();
  const x = story({ id: "x", cat: "fed", published: iso(NOW - 5 * H), ctx: "Broader context" });
  assert.ok(MK.eligible(c, x, NOW, new Set()));
  assert.ok(!MK.eligible(c, x, NOW, new Set(["x"])), "not twice in one session");
  MK.markSeen(c, x, NOW);
  assert.ok(!MK.eligible(c, x, NOW + 2 * D, new Set()), "same stage, nothing new: stays away");
  assert.ok(MK.eligible(c, x, NOW + 5 * D, new Set()), "weekly stage with its own context: a new angle");
  const y = story({ id: "y", cat: "fed", published: iso(NOW - 5 * H) });
  MK.markSeen(c, y, NOW);
  assert.ok(!MK.eligible(c, y, NOW + 5 * D, new Set()), "no context written for the later stage: nothing new to say");
  const z = story({ id: "z", published: iso(NOW - 5 * H), updates: [{ t: iso(NOW + 3 * H), text: "closed", src: { name: "S", url: "https://e.com/z" } }] });
  MK.markSeen(c, z, NOW);
  assert.ok(!MK.eligible(c, z, NOW + 4 * H, new Set()), "update, but too soon after reading it");
  assert.ok(MK.eligible(c, z, NOW + 13 * H, new Set()), "update you haven't read, after the rest");
});

test("pick: top story first, varied kinds, never the same thread twice in a row", () => {
  const c = MK.blank();
  const xs = [story({ id: "a", sig: 95, thread: "t1" }), story({ id: "b", sig: 90, thread: "t1" }), story({ id: "c", cat: "fed", sig: 80 }), story({ id: "d", cat: "ipo", sig: 30 })];
  assert.equal(MK.pick(c, xs, { now: NOW, rnd: () => 0 }).id, "a");
  const next = MK.pick(c, xs, { now: NOW, rnd: () => 0, shown: ["a"], prev: xs[0] });
  assert.equal(next.id, "c", "not b: same thread and same kind as the story before");
  // A much more important story of the same kind still wins over a minor one of another kind.
  const ys = [story({ id: "m1", sig: 95 }), story({ id: "m2", sig: 90 }), story({ id: "f", cat: "intl", sig: 20 })];
  assert.equal(MK.pick(c, ys, { now: NOW, rnd: () => 0, shown: ["m1"], prev: ys[0] }).id, "m2");
  assert.equal(MK.pick(c, xs, { now: NOW, shown: ["a", "b", "c", "d"] }), null);
});

test("Mixed rhythm: a story after a couple of concepts, at most every few cards, never back to back", () => {
  assert.equal(MK.newsTurn(0, true, () => 0), false);
  assert.equal(MK.newsTurn(1, true, () => 0), false);
  assert.equal(MK.newsTurn(2, true, () => 0), true);
  assert.equal(MK.newsTurn(3, true, () => 0.99), false);
  assert.equal(MK.newsTurn(4, true, () => 0.99), true);
  assert.equal(MK.newsTurn(9, false, () => 0), false, "nothing to show");
  // Over a long session, roughly one card in four is a story.
  const r = seq([0.1, 0.7, 0.3, 0.9, 0.5, 0.2, 0.8]);
  let since = Infinity, n = 0;
  for (let i = 0; i < 200; i++) { if (since > 0 && MK.newsTurn(since, true, r)) { n++; since = 0; } else since = since === Infinity ? 1 : since + 1; }
  assert.ok(n > 30 && n < 75, `stories: ${n}/200`);
});

test("store: Mixed by default, remembers the choice, and is separate from study progress", () => {
  const mem = { d: {}, getItem(k) { return this.d[k] || null; }, setItem(k, v) { this.d[k] = v; } };
  const c = MK.load(mem);
  assert.equal(c.feed, "mixed");
  c.feed = "markets"; MK.save(mem, c);
  assert.equal(MK.load(mem).feed, "markets");
  mem.setItem(MK.KEY, JSON.stringify({ v: 1, feed: "bogus" }));
  assert.equal(MK.load(mem).feed, "mixed");
  assert.deepEqual(Object.keys(mem.d), [MK.KEY], "only its own key: never the SRS or Chill stores");
});

test("clean: a malformed or unsafe story can't reach the screen", () => {
  const ok = story({ id: "ok" });
  const out = MK.clean({ stories: [ok, { ...ok, id: "ok" }, { ...ok, id: "http", src: { name: "S", url: "http://e.com" } }, { ...ok, id: "js", src: { name: "S", url: "javascript:alert(1)" } },
    { ...ok, id: "nocat", cat: "celebrity" }, { ...ok, id: "nostatus", status: "maybe" }, { ...ok, id: "nowhy", why: "" }, { ...ok, id: "nodate", published: "soon" },
    { ...ok, id: "badupd", updates: [{ t: iso(NOW), text: "x", src: { name: "S", url: "ftp://x" } }, { t: iso(NOW), text: "y", src: { name: "S", url: "https://e.com/y" } }] }] });
  assert.deepEqual(out.map(x => x.id), ["ok", "badupd"]);
  assert.equal(out[1].updates.length, 1);
  assert.deepEqual(MK.clean(null), []);
});

test("starter stories: valid, sourced, within the card limits, linked to real concepts", async () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/market.json"), "utf8"));
  assert.equal(MK.clean(data).length, data.stories.length);
  const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../data/helpers.js"), "utf8"), ctx);
  for (const f of fs.readdirSync(path.join(__dirname, "../data/chill"))) vm.runInContext(fs.readFileSync(path.join(__dirname, "../data/chill", f), "utf8"), ctx);
  const ids = new Set(ctx.CB.map(x => x.id));
  const { check } = await import("../tools/market/lib/validate.mjs");
  for (const x of data.stories) {
    assert.ok(x.src.url.startsWith("https://") && x.src.name, x.id);
    assert.ok(x.verified && x.published, x.id);
    assert.ok((x.concepts || []).length && x.concepts.every(id => ids.has(id)), `${x.id} concepts`);
    // Same limits as the pipeline (figures were checked by hand against each source, so skip that part here).
    const errs = check({ ...x, evidence: ["-"] }, { cats: [x.cat], statuses: [x.status], trusted: true, title: "", text: "" }, ids);
    assert.deepEqual(errs, [], x.id);
  }
});
