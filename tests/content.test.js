// Question bank checks: structure, levels, Top 100, original ids kept, HTML well-formed. Run: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
global.window = global;
require("../data/helpers.js");
for (const f of ["accounting", "ev", "valuation", "dcf", "ma", "lbo", "modeling", "math"]) require(`../data/${f}.js`);
const QB = global.QB;

// Every id from the first version of the app: progress is keyed on these, so none may disappear.
const V1_IDS = "a1 a2 a3 a4 a5 a6 a7 a8 a9 a10 a11 a12 a13 a14 a15 a16 a17 a18 a19 a20 a21 a22 a23 a24 a25 a26 e1 e2 e3 e4 e5 e6 e7 e8 e9 e10 e11 e12 e13 e14 e15 e16 e17 v1 v2 v3 v4 v5 v6 v7 v8 v9 v10 v11 v12 v13 v14 v15 v16 v17 v18 v19 v20 v21 v22 v23 v24 v25 m1 m2 m3 m4 m5 m6 m7 m8 m9 m10 m11 m12 m13 m14 m15 m16 m17 l1 l2 l3 l4 l5 l6 l7 l8 l9 l10 l11 l12 l13 l14 l15 l16".split(" ");
const CATS = ["acct", "ev", "val", "dcf", "ma", "lbo", "model", "math"];

test("ids are unique and every original card is still present", () => {
  const ids = QB.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length);
  const missing = V1_IDS.filter(id => !ids.includes(id));
  assert.deepEqual(missing, []);
});

test("every category has beginner, intermediate and advanced cards", () => {
  for (const c of CATS) {
    for (const l of [1, 2, 3]) assert.ok(QB.some(q => q.c === c && q.l === l), `${c} level ${l}`);
    assert.ok(QB.filter(q => q.c === c).length >= 20, `${c} has 20+ cards`);
  }
});

test("each card has the three answer layers and 1-3 follow-ups", () => {
  for (const q of QB) {
    assert.ok(q.q && q.q.length > 5, q.id);
    assert.ok([1, 2, 3].includes(q.l), q.id);
    assert.ok(["concept", "math", "3s"].includes(q.k), q.id);
    assert.ok(q.quick && q.quick.length > 20, `${q.id} quick`);
    assert.ok(q.detail && q.detail.length > 20, `${q.id} detail`);
    assert.ok(Array.isArray(q.fu) && q.fu.length >= 1 && q.fu.length <= 3, `${q.id} follow-ups`);
    q.fu.forEach(f => assert.ok(f[0] && f[1] && f[1].length > 10, `${q.id} follow-up`));
    if (q.o) assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, `${q.id} answer index`);
  }
});

test("numbers and three-statement cards carry a worked example or are pure arithmetic", () => {
  const withoutEx = QB.filter(q => q.k === "3s" && !q.ex).map(q => q.id);
  assert.deepEqual(withoutEx, [], "3-statement cards need the statement table");
});

test("Top 100 has exactly 100 cards across all categories", () => {
  const top = QB.filter(q => q.top);
  assert.equal(top.length, 100);
  for (const c of CATS) assert.ok(top.some(q => q.c === c), c);
});

test("answer HTML is well formed", () => {
  const voids = new Set(["br", "hr", "img"]);
  const check = (html, where) => {
    const stack = [];
    for (const m of html.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)) {
      const tag = m[1].toLowerCase();
      if (voids.has(tag)) continue;
      if (m[0][1] === "/") { assert.equal(stack.pop(), tag, `${where}: unexpected </${tag}>`); }
      else stack.push(tag);
    }
    assert.deepEqual(stack, [], `${where}: unclosed ${stack.join(",")}`);
  };
  for (const q of QB) {
    check(q.quick, q.id + " quick"); check(q.detail, q.id + " detail");
    if (q.ex) check(q.ex, q.id + " ex");
    q.fu.forEach((f, i) => check(f[1], `${q.id} fu${i}`));
  }
});
