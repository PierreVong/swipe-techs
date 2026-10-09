// Spaced repetition and progress tests. Run: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../js/srs.js");

const T0 = new Date(2026, 9, 9, 15, 0, 0).getTime();       // Oct 9 2026, 3pm local
const at = (days, hour = 15) => { const d = new Date(T0); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.getTime(); };
const mem = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; };
const daysUntil = (c, now) => Math.round((c.dueT - S.startOfDay(now)) / S.DAY);

test("Didn't know comes back after 3-5 cards", () => {
  for (const r of [0, 0.5, 0.999]) {
    const s = S.blankState();
    const c = S.rate(s, "x", 0, T0, 100, () => r);
    assert.ok(c.dueN >= 103 && c.dueN <= 105, `dueN ${c.dueN}`);
    assert.equal(c.dueT, null);
  }
});

test("Partially knew comes back after 10-15 cards", () => {
  for (const r of [0, 0.999]) {
    const s = S.blankState();
    const c = S.rate(s, "x", 1, T0, 50, () => r);
    assert.ok(c.dueN >= 60 && c.dueN <= 65, `dueN ${c.dueN}`);
  }
});

test("Nailed it on a new card schedules tomorrow, then 3, 7, 14, 30 days", () => {
  const s = S.blankState();
  let c = S.rate(s, "x", 2, T0, 1);
  assert.equal(daysUntil(c, T0), 1);
  const expected = [3, 7, 14, 30, 60];
  let now = c.dueT + 9 * 3600e3;                            // review on the due day
  for (const want of expected) {
    c = S.rate(s, "x", 2, now, 2);
    assert.equal(daysUntil(c, now), want);
    now = c.dueT + 9 * 3600e3;
  }
});

test("Reviewing early does not stretch the interval", () => {
  const s = S.blankState();
  let c = S.rate(s, "x", 2, T0, 1);                         // due tomorrow
  const due = c.dueT;
  c = S.rate(s, "x", 2, at(0, 18), 2);                      // nailed again same evening
  assert.equal(c.dueT, due);
  assert.equal(c.step, 1);
});

test("Lapses shrink future intervals; nailing recovers them", () => {
  const s = S.blankState();
  S.rate(s, "x", 2, T0, 1);
  let c = S.rate(s, "x", 0, at(1), 2);                      // forgot it on review day
  assert.ok(c.ease < 1);
  c = S.rate(s, "x", 2, at(1, 16), 6);                      // relearned same day
  assert.equal(daysUntil(c, at(1, 16)), 1);
  c = S.rate(s, "x", 2, c.dueT + 3600e3, 7);
  assert.ok(daysUntil(c, c.lastT) < 3, "interval after a lapse is shorter than the clean 3 days");
});

test("Mastery needs success on 3 separate days, not 3 taps in one sitting", () => {
  const s = S.blankState();
  S.rate(s, "x", 2, at(0, 10), 1);
  S.rate(s, "x", 2, at(0, 11), 2);
  S.rate(s, "x", 2, at(0, 12), 3);
  assert.equal(S.isMastered(S.get(s, "x")), false);
  let c = S.get(s, "x");
  c = S.rate(s, "x", 2, c.dueT + 3600e3, 4);
  assert.equal(S.isMastered(c), false);
  c = S.rate(s, "x", 2, c.dueT + 3600e3, 5);
  assert.equal(S.isMastered(c), true);
  c = S.rate(s, "x", 0, c.dueT + 3600e3, 6);
  assert.equal(S.isMastered(c), false, "a miss removes mastery");
});

test("Weak detection and ranking", () => {
  const s = S.blankState();
  S.rate(s, "a", 0, T0, 1); S.rate(s, "a", 0, T0, 5);
  S.rate(s, "b", 1, T0, 2);
  S.rate(s, "c", 2, T0, 3);
  assert.ok(S.isWeak(S.get(s, "a")));
  assert.ok(S.isWeak(S.get(s, "b")));
  assert.ok(!S.isWeak(S.get(s, "c")));
  assert.ok(S.weakness(S.get(s, "a")) > S.weakness(S.get(s, "b")));
  const pick = S.pickNext(s, ["a", "b", "c"], { pos: 10, now: T0, mode: "weak", rnd: () => 0 });
  assert.equal(pick, "a");
  assert.equal(S.pickNext(S.blankState(), ["a"], { pos: 0, now: T0, mode: "weak" }), null);
});

test("For You: due learning card beats everything, even if shown recently", () => {
  const s = S.blankState();
  S.rate(s, "miss", 0, T0, 10, () => 0);                    // due at 13
  const ids = ["miss", "n1", "n2", "n3"];
  assert.notEqual(S.pickNext(s, ids, { pos: 12, now: T0, recent: ["miss", "n1"], rnd: () => 0.9 }), "miss");
  assert.equal(S.pickNext(s, ids, { pos: 13, now: T0, recent: ["miss", "n1", "n2", "n3"], rnd: () => 0.9 }), "miss");
});

test("For You mixes reviews due today with new cards", () => {
  const s = S.blankState();
  S.rate(s, "old", 2, at(-1), 1);                           // due today
  const ids = ["old", "new1", "new2"];
  assert.equal(S.pickNext(s, ids, { pos: 5, now: T0, rnd: () => 0.1 }), "old");
  assert.notEqual(S.pickNext(s, ids, { pos: 5, now: T0, rnd: () => 0.9 }), "old");
});

test("Excluded cards (already waiting in the feed) are never picked", () => {
  const s = S.blankState();
  assert.equal(S.pickNext(s, ["a", "b"], { pos: 0, now: T0, exclude: new Set(["a"]) }), "b");
  assert.equal(S.pickNext(s, ["a"], { pos: 0, now: T0, exclude: new Set(["a"]) }), null);
});

test("Streak counts consecutive days and survives until the day ends", () => {
  const s = S.blankState();
  S.rate(s, "a", 2, at(-2), 1); S.rate(s, "a", 2, at(-1), 2);
  assert.equal(S.streak(s, at(0)), 2, "today not studied yet, streak still alive");
  S.rate(s, "b", 2, at(0), 3);
  assert.equal(S.streak(s, at(0)), 3);
  assert.equal(S.streak(s, at(2)), 0, "a missed day breaks it");
  assert.equal(S.bestStreak(s), 3);
});

test("Migrates v1 progress without erasing it", () => {
  const store = mem();
  const v1 = { rec: { a3: { g: 2, m: 0, streak: 2, due: 40, last: "g" }, e8: { g: 0, m: 1, streak: 0, due: 9, last: "m" }, a1: { g: 0, m: 0, streak: 0, due: 0, last: null } }, saved: ["a3", "l5"], prefs: {} };
  store.setItem(S.V1_KEY, JSON.stringify(v1));
  const s = S.load(store, T0);
  assert.deepEqual(s.bookmarks, ["a3", "l5"]);
  assert.equal(s.cards.a3.last, 2);
  assert.equal(s.cards.a3.dueT, S.startOfDay(T0), "known cards are due for a confirming review");
  assert.equal(s.cards.e8.last, 0);
  assert.equal(s.cards.e8.dueN, 0);
  assert.ok(S.isWeak(s.cards.e8));
  assert.equal(s.cards.a1, undefined);
  assert.equal(store.getItem(S.V1_KEY), JSON.stringify(v1), "v1 data left untouched");
  assert.ok(store.getItem(S.KEY), "v2 saved");
  // Second load reads v2 and does not re-migrate.
  s.bookmarks.push("m1"); S.save(store, s);
  assert.deepEqual(S.load(store, T0).bookmarks, ["a3", "l5", "m1"]);
});

test("Survives broken or blocked storage", () => {
  const broken = { getItem: () => "{not json", setItem: () => { throw new Error("blocked"); } };
  const s = S.load(broken, T0);
  assert.equal(s.v, 2);
  assert.doesNotThrow(() => S.save(broken, s));
  assert.equal(S.load(null, T0).v, 2);
});

test("Stats: today, mastery by category, weakest topics", () => {
  const bank = [{ id: "a", c: "acct" }, { id: "b", c: "acct" }, { id: "c", c: "lbo" }];
  const s = S.blankState();
  for (let i = 0; i < 5; i++) S.rate(s, "a", 0, T0, i * 10);
  for (let i = 0; i < 5; i++) S.rate(s, "c", 2, at(i - 5), i);
  const x = S.stats(s, bank, T0);
  assert.equal(x.today, 5);
  assert.equal(x.studied, 2);
  assert.equal(x.byCat.acct.total, 2);
  assert.equal(x.weakest[0].cat, "acct");
  assert.equal(x.week.length, 7);
});

test("Rating hints match the schedule", () => {
  const s = S.blankState();
  assert.deepEqual(S.preview(s, "new", T0), ["~4 cards", "~13 cards", "tomorrow"]);
  S.rate(s, "x", 2, T0, 1);
  const p = S.preview(s, "x", S.get(s, "x").dueT + 3600e3);
  assert.equal(p[2], "3 days");
});
