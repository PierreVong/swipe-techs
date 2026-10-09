// Chill Mode picker and store: unseen first, gentle resurfacing, no repeats within a session, kept apart from SRS progress.
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../js/chill.js");
const S = require("../js/srs.js");

const T0 = new Date(2026, 9, 9, 23, 30).getTime();
const DAY = 86400000;
const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; };
const meta = { a: { c: "acct", t: "myth" }, b: { c: "acct", t: "concept" }, c: { c: "lbo", t: "concept" }, d: { c: "lbo", t: "fact" }, e: { c: "dcf", t: "myth" } };
const ids = Object.keys(meta);

test("unseen concepts come first", () => {
  const c = C.blank();
  ["a", "b", "c"].forEach(id => C.markSeen(c, id, T0 - 3 * DAY));
  for (const r of [0.5, 0.9]) assert.ok(["d", "e"].includes(C.pick(c, ids, { now: T0, rnd: () => r, meta })));
});

test("concepts seen on an earlier day sometimes come back for reinforcement", () => {
  const c = C.blank();
  C.markSeen(c, "a", T0 - 5 * DAY); C.markSeen(c, "b", T0 - 2 * DAY);
  assert.equal(C.pick(c, ids, { now: T0, rnd: () => 0.01, meta }), "a", "oldest first when resurfacing");
  C.markSeen(c, "c", T0 - 3600e3);
  assert.ok(!["a", "b", "c"].includes(C.pick(c, ["a", "b", "c", "d"], { now: T0, rnd: () => 0.99, meta })), "mostly new cards");
});

test("no repeats within a session until the whole selection has been shown", () => {
  const c = C.blank();
  const session = [];
  for (let i = 0; i < ids.length; i++) { const id = C.pick(c, ids, { now: T0, session, meta }); session.push(id); C.markSeen(c, id, T0); }
  assert.equal(new Set(session).size, ids.length);
  const next = C.pick(c, ids, { now: T0, session, meta });
  assert.ok(next && next !== session[session.length - 1], "starts over without repeating the last card");
});

test("the feed varies topic and card type from one card to the next", () => {
  const c = C.blank();
  for (let k = 0; k < 20; k++) {
    const id = C.pick(c, ids, { now: T0, session: ["a"], rnd: Math.random, meta });
    assert.ok(meta[id].c !== "acct" && meta[id].t !== "myth", id);
  }
});

test("empty selection returns nothing; bookmarks toggle", () => {
  const c = C.blank();
  assert.equal(C.pick(c, [], { now: T0 }), null);
  assert.equal(C.toggleBm(c, "a"), true); assert.deepEqual(c.bm, ["a"]);
  assert.equal(C.toggleBm(c, "a"), false); assert.deepEqual(c.bm, []);
});

test("Chill progress is stored apart from study progress and survives bad storage", () => {
  const store = mem();
  const st = S.load(store, T0);
  const before = JSON.stringify(st);
  const c = C.load(store);
  C.markSeen(c, "a", T0); C.toggleBm(c, "b"); c.cats = ["lbo"];
  C.save(store, c);
  assert.ok(store.getItem(C.KEY));
  assert.equal(store.getItem(S.KEY), before, "study progress untouched");
  const again = C.load(store);
  assert.equal(again.seen.a.n, 1); assert.deepEqual(again.bm, ["b"]); assert.deepEqual(again.cats, ["lbo"]);
  const broken = { getItem: () => "{nope", setItem: () => { throw new Error("blocked"); } };
  assert.deepEqual(C.load(broken), C.blank());
  assert.doesNotThrow(() => C.save(broken, again));
});

test("stats count seen and saved within the deck", () => {
  const c = C.blank();
  C.markSeen(c, "a", T0); C.markSeen(c, "zzz", T0); C.toggleBm(c, "b");
  assert.deepEqual(C.stats(c, ids.map(id => ({ id }))), { total: 5, seen: 1, saved: 1 });
});

const tagged = {
  w1: { c: "dcf", t: "concept", x: "numbers", k: ["wacc"], core: true }, w2: { c: "val", t: "myth", x: "visual", k: ["wacc", "cost-of-equity"] },
  w3: { c: "dcf", t: "fact", x: "analogy", k: ["cost-of-equity"] }, l1: { c: "lbo", t: "concept", x: "visual", k: ["leverage"] },
  l2: { c: "lbo", t: "real", x: "numbers", k: ["leverage", "returns"] }, g1: { c: "acct", t: "analogy", x: "scenario", k: ["goodwill"] },
};
const tids = Object.keys(tagged);

test("a store saved by the first Chill release loads with the new fields and keeps its progress", () => {
  const store = mem();
  store.setItem(C.KEY, JSON.stringify({ v: 1, seen: { a: { n: 2, t: T0 } }, bm: ["a"], cats: ["lbo"] }));
  const c = C.load(store);
  assert.equal(c.seen.a.n, 2); assert.deepEqual(c.bm, ["a"]); assert.deepEqual(c.cats, ["lbo"]);
  assert.deepEqual(c.like, {}); assert.deepEqual(c.int, {}); assert.equal(c.pos, null); assert.deepEqual(c.recent, []);
});

test("reopening Chill within 12 hours resumes on the last card without repeating the session", () => {
  const c = C.blank();
  C.setPos(c, "w2", ["w1", "w2"], T0);
  assert.deepEqual(C.resume(c, T0 + 3600e3), { id: "w2", session: ["w1", "w2"] });
  assert.equal(C.resume(c, T0 + 13 * 3600e3), null, "a new night starts a fresh feed");
  assert.equal(C.resume(C.blank(), T0), null);
});

test("the next card avoids the topics, card types and concepts just shown", () => {
  const c = C.blank();
  for (let k = 0; k < 30; k++) {
    const id = C.pick(c, tids, { now: T0, session: ["w1"], rnd: Math.random, meta: tagged });
    assert.ok(tagged[id].c !== "dcf" && tagged[id].t !== "concept" && !tagged[id].k.includes("wacc"), id);
  }
});

test("saves and More like this tilt the feed toward related concepts without taking it over", () => {
  const c = C.blank();
  C.toggleLike(c, "l1", T0); C.toggleBm(c, "l1"); C.markSeen(c, "l1", T0);
  const n = { l2: 0, other: 0 };
  let r = 0; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let k = 0; k < 400; k++) { const id = C.pick(c, tids.filter(x => x !== "l1"), { now: T0, rnd, meta: tagged }); id === "l2" ? n.l2++ : n.other++; }
  assert.ok(n.l2 > 400 / 5 * 1.5, `liked topic picked more often (${n.l2})`);
  assert.ok(n.other > n.l2, "other concepts still come up");
  assert.equal(C.toggleLike(c, "l1"), false); assert.deepEqual(c.like, {});
  C.interest(c, "w1"); C.interest(c, "w1"); C.interest(c, "w1"); C.interest(c, "w1");
  assert.equal(c.int.w1, 3, "interest is capped");
});

test("seen concepts that come back favour saved, liked and core ideas", () => {
  const c = C.blank();
  tids.forEach(id => C.markSeen(c, id, T0 - 3 * DAY));
  C.toggleBm(c, "g1");
  assert.equal(C.pick(c, tids, { now: T0, rnd: () => 0.01, meta: tagged }), "g1");
});

test("Rabbit hole lists concepts that share a tag, closest and unseen first", () => {
  const c = C.blank();
  assert.deepEqual(C.related(c, "w2", tids, tagged), ["w1", "w3"]);
  C.markSeen(c, "w1", T0);
  assert.deepEqual(C.related(c, "w2", tids, tagged, 1), ["w3"], "unseen first among equally close concepts");
  assert.deepEqual(C.related(c, "g1", tids, tagged), []);
});
