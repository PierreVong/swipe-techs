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
  assert.deepEqual(c.like, {}); assert.deepEqual(c.int, {}); assert.equal(c.pos, null); assert.deepEqual(c.recent, []); assert.deepEqual(c.tips, {});
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
    const id = C.pick(c, tids, { now: T0, session: ["w1"], rnd: () => 0.5 + Math.random() / 2, meta: tagged });   // no connected run this time
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

test("now and then the next card builds on the last one, in runs of at most three", () => {
  const c = C.blank();
  assert.equal(C.runLength(["w1", "w2", "w3", "l1"], tagged), 1);
  assert.equal(C.runLength(["l1", "w1", "w2", "w3"], tagged), 3);
  const next = C.pick(c, tids, { now: T0, session: ["w1"], rnd: () => 0.1, meta: tagged });
  assert.ok(C.linked(tagged.w1, tagged[next]), `connected pick ${next}`);
  // A run of three never grows: the picker goes back to varied, unconnected concepts.
  const after = C.pick(c, [...tids, "w4"], { now: T0, session: ["w1", "w2", "w3"], rnd: () => 0.1, meta: { ...tagged, w4: { c: "ev", t: "real", x: "numbers", k: ["cost-of-equity"] } } });
  assert.ok(!["w4"].includes(after), `run of three stops (${after})`);
  // Runs only use unseen concepts.
  C.markSeen(c, "w2", T0 - 3 * DAY); C.markSeen(c, "w3", T0 - 3 * DAY);
  const r = C.pick(c, tids, { now: T0, session: ["w1"], rnd: () => 0.21, meta: tagged });   // above the resurfacing share, below the run chance
  assert.ok(!["w2", "w3"].includes(r), `seen concepts don't extend a run (${r})`);
});

test("a big idea met a while ago comes back through a new, unseen card; never right after it was shown", () => {
  const meta = {
    i1: { c: "acct", t: "concept", x: "numbers", k: ["working-capital"], p: "profit-not-cash", core: true },
    i2: { c: "lbo", t: "real", x: "visual", k: ["debt-paydown"], p: "profit-not-cash" },
    i3: { c: "ma", t: "fact", x: "analogy", k: ["synergies"], p: "control-costs" },
  };
  for (let i = 0; i < 10; i++) meta["f" + i] = { c: "val", t: "myth", x: "scenario", k: ["multiples"], p: "multiples-shortcut" };
  const ids = Object.keys(meta);
  const c = C.blank();
  C.markSeen(c, "i1", T0 - 2 * DAY);
  const out = {};
  let k = 0; const seq = [0.9, 0.9, 0.1, 0.5, 0.5]; const rnd = () => seq[k++ % seq.length];   // no revisit, no connected run, then the echo
  assert.equal(C.pick(c, ids, { now: T0, session: ["f0"], rnd, meta, out }), "i2");
  assert.equal(out.why, "echo");
  // Shown three cards ago: too soon for the same idea.
  const session = ["i1", "f1", "f2"];
  assert.equal(C.echo(c, ["i2", "i3"], session, meta, session.map(id => meta[id]), () => 0.5), null);
  const later = ["i1", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"];
  assert.equal(C.echo(c, ["i2", "i3"], later, meta, later.slice(-3).map(id => meta[id]), () => 0.5), "i2");
});

test("cards teaching the same big idea count as connected, for runs and the Rabbit hole", () => {
  const a = { c: "acct", k: ["inventory"], p: "profit-not-cash" }, b = { c: "lbo", k: ["leverage"], p: "profit-not-cash" };
  assert.ok(C.linked(a, b));
  assert.ok(!C.linked(a, { c: "lbo", k: ["leverage"], p: "time-value" }));
  const c = C.blank(), out = {};
  const meta = { a, b, z: { c: "dcf", t: "fact", k: ["wacc"], p: "risk-price" } };
  assert.deepEqual(C.related(c, "a", ["b", "z"], meta), ["b"]);
  assert.equal(C.pick(c, ["b", "z"], { now: T0, session: ["a"], rnd: () => 0.1, meta, out }), "b");
  assert.equal(out.why, "run");
});

test("a connected run follows a hand-picked bridge into another topic when there is one", () => {
  const meta = {
    a: { id: "a", c: "acct", t: "concept", k: ["depreciation"], p: "tax-shields", nx: ["b"] },
    b: { id: "b", c: "lbo", t: "scenario", k: ["leverage"], p: "claims-ladder", nx: ["d"] },
    s: { id: "s", c: "acct", t: "example", k: ["depreciation"], p: "tax-shields" },
    d: { id: "d", c: "dcf", t: "fact", k: ["wacc"], p: "risk-price" },
  };
  assert.ok(C.bridged(meta.a, meta.b) && C.linked(meta.a, meta.b), "a bridge counts as connected");
  const out = {};
  for (let i = 0; i < 20; i++) assert.equal(C.pick(C.blank(), ["b", "s", "d"], { now: T0, session: ["a"], rnd: () => 0.1, meta, out }), "b");
  assert.equal(out.why, "run");
  assert.equal(C.pick(C.blank(), ["s", "d"], { now: T0, session: ["a", "b"], rnd: () => 0.1, meta }), "d", "the bridge carries on to a third card");
  assert.deepEqual(C.related(C.blank(), "a", ["b", "d"], meta), ["b"], "the Rabbit hole includes bridges too");
});

test("runs lean toward a related card from another topic", () => {
  const meta = {
    a: { id: "a", c: "acct", t: "concept", k: ["working-capital"] },
    same: { id: "same", c: "acct", t: "example", k: ["working-capital"] },
    other: { id: "other", c: "lbo", t: "example", k: ["working-capital"] },
  };
  let r = 0; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const n = { same: 0, other: 0 };
  for (let i = 0; i < 400; i++) {
    const out = {}; const id = C.pick(C.blank(), ["same", "other"], { now: T0, session: ["a"], rnd, meta, out });
    if (out.why === "run") n[id]++;
  }
  assert.ok(n.other > n.same * 1.5, `cross-topic picked more often (${n.other} vs ${n.same})`);
  assert.ok(n.same > 0, "same-topic runs still happen");
});

test("once everything is seen, the feed favours rested, less-viewed cards from less-explored ideas", () => {
  const meta = {
    r1: { id: "r1", c: "acct", t: "concept", k: ["a"], p: "profit-not-cash" },
    r2: { id: "r2", c: "lbo", t: "concept", k: ["b"], p: "time-value" },
    r3: { id: "r3", c: "dcf", t: "concept", k: ["c"], p: "profit-not-cash" },
    r4: { id: "r4", c: "ma", t: "concept", k: ["d"], p: "deal-math" },
  };
  const c = C.blank();
  C.markSeen(c, "r1", T0 - 1.5 * DAY);                                   // seen yesterday: still resting
  for (let i = 0; i < 4; i++) C.markSeen(c, "r2", T0 - 10 * DAY);        // seen four times
  C.markSeen(c, "r3", T0 - 10 * DAY); C.markSeen(c, "r3", T0 - 10 * DAY);
  C.markSeen(c, "r4", T0 - 10 * DAY);                                     // once, and its idea is the least explored
  const ids = Object.keys(meta);
  assert.equal(C.pick(c, ids, { now: T0, rnd: () => 0, meta }), "r4");
  assert.ok(C.exposure(c, meta)["profit-not-cash"] === 3 && C.exposure(c, meta)["deal-math"] === 1);
  const n = {};
  for (let i = 0; i < 50; i++) { const id = C.pick(c, ids, { now: T0, rnd: Math.random, meta }); n[id] = (n[id] || 0) + 1; }
  assert.ok(!n.r1, "a card seen yesterday waits while rested ones remain");
  assert.equal(C.pick(c, ["r1"], { now: T0, rnd: () => 0, meta }), "r1", "but still comes back if it's the only one");
});

test("the next card avoids the same kind of picture as the last one", () => {
  const meta = {
    p: { id: "p", c: "acct", t: "concept", v: "bars", k: ["a"] },
    b1: { id: "b1", c: "lbo", t: "fact", v: "bars", k: ["b"] },
    w1: { id: "w1", c: "dcf", t: "fact", v: "wf", k: ["c"] },
  };
  for (let i = 0; i < 20; i++) assert.equal(C.pick(C.blank(), ["b1", "w1"], { now: T0, session: ["p"], rnd: () => 0.5 + Math.random() / 2, meta }), "w1");
});
