// Private collection helpers: import validation, safe rendering, study paths, similar-question spacing. Run: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../js/private.js");
const SAMPLE = require("./fixtures/private-sample.json");
const clone = x => JSON.parse(JSON.stringify(x));

test("a valid file imports with every question, sorted in guide order", () => {
  const v = P.validate(clone(SAMPLE), new Set(["a1"]));
  assert.equal(v.ok, true, v.errors.join(" "));
  assert.equal(v.coll.count, SAMPLE.questions.length);
  assert.deepEqual(v.coll.questions.map(q => q.order), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(v.coll.name, "Sample Guide");
  assert.equal(v.coll.short, "Sample");
});

test("original question and answer text pass through unchanged", () => {
  const v = P.validate(clone(SAMPLE));
  SAMPLE.questions.forEach((q, i) => { assert.equal(v.coll.questions[i].q, q.q.trim()); assert.equal(v.coll.questions[i].a, q.a); });
});

test("added explanations are kept apart from the original", () => {
  const q = P.validate(clone(SAMPLE)).coll.questions.find(x => x.id === "pv-acct-b03");
  assert.equal(q.added.update.topic, "Lease accounting");
  assert.match(q.a, /Only long leases/);
  assert.ok(!q.a.includes(q.added.update.text));
});

test("bad files are rejected as a whole, with a reason", () => {
  assert.equal(P.validate(null).ok, false);
  assert.equal(P.validate({ format: "other", version: 1, questions: [] }).ok, false);
  assert.equal(P.validate(Object.assign(clone(SAMPLE), { version: 2 })).ok, false);
  const dup = clone(SAMPLE); dup.questions[1].id = dup.questions[0].id;
  assert.match(P.validate(dup).errors[0], /repeats an id/);
  const clash = P.validate(clone(SAMPLE), new Set(["pv-ev-b01"]));
  assert.equal(clash.ok, false); assert.match(clash.errors[0], /built-in card/);
  const cat = clone(SAMPLE); cat.questions[2].c = "crypto";
  assert.match(P.validate(cat).errors[0], /unknown category/);
  const noq = clone(SAMPLE); noq.questions[3].q = " ";
  assert.match(P.validate(noq).errors[0], /no question text/);
  const badId = clone(SAMPLE); badId.questions[0].id = "<img>";
  assert.match(P.validate(badId).errors[0], /invalid id/);
});

test("unknown fields are dropped and strings are capped", () => {
  const x = clone(SAMPLE);
  x.questions[0].onclick = "alert(1)";
  x.questions[0].notes = "n".repeat(5000);
  const q = P.validate(x).coll.questions[0];
  assert.equal(q.onclick, undefined);
  assert.equal(q.notes.length, 2000);
});

test("rich text escapes HTML and allows only the small markup", () => {
  const h = P.rich('Hi <script>alert(1)</script> **bold** *it* 3 \\* 4 \\\\ done\n\n- a\n- b\n\n2. x\n3. y');
  assert.ok(!h.includes("<script>"));
  assert.match(h, /&lt;script&gt;/);
  assert.match(h, /<strong>bold<\/strong>/);
  assert.match(h, /<em>it<\/em>/);
  assert.match(h, /3 \* 4 \\ done/);
  assert.match(h, /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(h, /<ol start="2"><li>x<\/li><li>y<\/li><\/ol>/);
  assert.equal(P.rich('<img src=x onerror=alert(1)>').includes("<img"), false);
  assert.equal(P.rich('**"x" onmouseover="y"**').includes('"x"'), false);
});

test("tables render with merged cells and header row and column", () => {
  const h = P.rich("```table\n | A | B | C\nRow: | 1 | < | 3\n```");
  assert.match(h, /<table class="grid">/);
  assert.match(h, /<th scope="col">A<\/th>/);
  assert.match(h, /<th scope="row">Row:<\/th><td colspan="2">1<\/td><td>3<\/td>/);
  assert.match(P.rich("```\na  b\n```"), /<pre class="tbl">a  b<\/pre>/);
});

test("filters: categories and levels, brain teasers ignore the level filter", () => {
  const cards = P.toCards(P.validate(clone(SAMPLE)).coll);
  const ids = f => cards.filter(q => P.inFilter(q, f)).map(q => q.id);
  assert.equal(ids({ cats: [], lvls: [1, 3] }).length, 8);
  assert.deepEqual(ids({ cats: ["ev"], lvls: [3] }), ["pv-ev-a01"]);
  assert.deepEqual(ids({ cats: ["brain"], lvls: [1] }), ["pv-brain-x01"]);
  assert.deepEqual(ids({ cats: ["acct"], lvls: [1] }), ["pv-acct-b01", "pv-acct-b02", "pv-acct-b03"]);
  assert.equal(cards[0].lvl, "Basic"); assert.equal(cards[7].src, "priv");
});

test("sequential path follows the guide and resumes after the last question rated, per section", () => {
  const cards = P.toCards(P.validate(clone(SAMPLE)).coll);
  const cur = {};
  assert.equal(P.seqNext(cards, cur, new Set()), "pv-acct-b01");
  P.advance(cur, cards[0]); P.advance(cur, cards[1]);
  assert.equal(P.seqNext(cards, cur, new Set()), "pv-acct-b03");
  assert.equal(P.seqNext(cards, cur, new Set(["pv-acct-b03"])), "pv-acct-a01");   // already in the feed
  // Rating an earlier card again doesn't move the cursor back.
  P.advance(cur, cards[0]);
  assert.equal(cur["acct:1"], 2);
  // Advanced has its own cursor, so studying it doesn't skip the rest of Basic.
  P.advance(cur, cards[4]);
  const basic = cards.filter(q => q.c === "acct" && q.l === 1);
  assert.equal(P.seqNext(basic, cur, new Set()), "pv-acct-b03");
  // End of a selection, then start over.
  P.advance(cur, cards[2]);
  assert.equal(P.seqNext(basic, cur, new Set()), null);
  P.restart(cur, basic);
  assert.equal(P.seqNext(basic, cur, new Set()), "pv-acct-b01");
  assert.equal(cur["acct:3"], 5);
});

test("similar questions are linked both ways and blocked right after each other", () => {
  const cards = P.toCards(P.validate(clone(SAMPLE)).coll);
  const m = P.simMap(cards);
  assert.ok(m["a1"].has("pv-acct-b01"));
  assert.ok(m["pv-ev-b01"].has("e1"));
  assert.deepEqual([...P.blocked(m, ["a1", "x9"])], ["pv-acct-b01"]);
  assert.deepEqual([...P.blocked(m, ["pv-ev-b01"])], ["e1"]);
  assert.equal(P.blocked(m, []).size, 0);
});

test("mixed sections: new questions interleave sections, each in guide order", () => {
  const cards = [];
  for (let i = 1; i <= 80; i++) cards.push({ id: "acct" + i, c: "acct" });
  for (let i = 1; i <= 20; i++) cards.push({ id: "ev" + i, c: "ev" });
  for (let i = 1; i <= 40; i++) cards.push({ id: "lbo" + i, c: "lbo" });
  const o = P.mixOrder(cards);
  const first = cards.slice().sort((a, b) => o[a.id] - o[b.id]).slice(0, 14).map(q => q.c);
  assert.ok(new Set(first).size === 3, "all sections show up early: " + first.join(","));
  assert.ok(first.filter(c => c === "acct").length <= 9, "the biggest section doesn't crowd the rest out");
  ["acct", "ev", "lbo"].forEach(c => {
    const ids = cards.filter(q => q.c === c).map(q => q.id);
    assert.deepEqual(ids.slice().sort((a, b) => o[a] - o[b]), ids, c + " keeps guide order");
  });
  Object.values(o).forEach(v => assert.ok(v >= 0 && v < 1));
});
