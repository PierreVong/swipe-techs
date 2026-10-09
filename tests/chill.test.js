// Chill Mode content checks: structure, length limits (10–20 second reads), links into the main bank. Run: node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
global.window = global;
require("../data/helpers.js");
for (const f of ["accounting", "ev", "valuation", "dcf", "ma", "lbo", "modeling", "math"]) require(`../data/${f}.js`);
const TOPICS = { acct: "a", ev: "e", val: "v", dcf: "d", ma: "m", lbo: "l", model: "f" };
const FILES = { acct: "accounting", ev: "ev", val: "valuation", dcf: "dcf", ma: "ma", lbo: "lbo", model: "modeling" };
const present = Object.keys(FILES).filter(c => fs.existsSync(path.join(__dirname, "../data/chill", FILES[c] + ".js")));
present.forEach(c => require(`../data/chill/${FILES[c]}.js`));
const CB = global.CB, QB = global.QB;
const bankIds = new Set(QB.map(q => q.id));
const text = h => String(h).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const words = h => text(h).split(" ").filter(Boolean).length;
const sentences = h => (text(h).match(/[^.!?]+[.!?]+(?=\s|$)/g) || []).length;

test("all seven Chill topics are present", () => {
  assert.deepEqual(present, Object.keys(FILES));
});

// Ids from the first Chill release: seen and saved state is keyed on them, so none may disappear.
const V1_CHILL = "xa1 xa2 xa3 xa4 xa5 xa6 xa7 xa8 xa9 xa10 xa11 xa12 xa13 xa14 xa15 xa16 xa17 xa18 xa19 xa20 xe1 xe2 xe3 xe4 xe5 xe6 xe7 xe8 xe9 xe10 xe11 xe12 xe13 xe14 xe15 xe16 xe17 xe18 xv1 xv2 xv3 xv4 xv5 xv6 xv7 xv8 xv9 xv10 xv11 xv12 xv13 xv14 xv15 xv16 xv17 xv18 xv19 xd1 xd2 xd3 xd4 xd5 xd6 xd7 xd8 xd9 xd10 xd11 xd12 xd13 xd14 xd15 xd16 xd17 xd18 xd19 xd20 xm1 xm2 xm3 xm4 xm5 xm6 xm7 xm8 xm9 xm10 xm11 xm12 xm13 xm14 xm15 xm16 xm17 xm18 xm19 xm20 xl1 xl2 xl3 xl4 xl5 xl6 xl7 xl8 xl9 xl10 xl11 xl12 xl13 xl14 xl15 xl16 xl17 xl18 xl19 xl20 xf1 xf2 xf3 xf4 xf5 xf6 xf7 xf8 xf9 xf10 xf11 xf12 xf13 xf14 xf15 xf16 xf17 xf18".split(" ");
test("every original Chill card id is still present", () => {
  const ids = new Set(CB.map(x => x.id));
  assert.deepEqual(V1_CHILL.filter(id => !ids.has(id)), []);
});

test("ids are unique, stable-looking and match their topic", () => {
  const ids = CB.map(x => x.id);
  assert.equal(new Set(ids).size, ids.length);
  CB.forEach(x => { assert.match(x.id, /^x[a-z]\d+$/, x.id); assert.equal(x.id[1], TOPICS[x.c], `${x.id} topic letter`); assert.ok(!bankIds.has(x.id)); });
});

const isVisual = x => x.exk === "visual";

test("every card has a hook, a short explanation, an example and one takeaway", () => {
  for (const x of CB) {
    const at = x.id;
    assert.ok(["concept", "intuition", "example", "fact", "real", "myth", "analogy"].includes(x.t), at + " t");
    assert.ok(x.hook && x.hook.length >= 15 && x.hook.length <= 90, at + " hook length " + (x.hook || "").length);
    assert.ok(!/</.test(x.hook), at + " hook is plain text");
    if (x.t === "myth") assert.ok(["Myth", "Partly true", "True"].includes(x.v), at + " myth verdict");
    const s = sentences(x.body);
    assert.ok(s >= 1 && s <= 3, `${at} body has ${s} sentences`);
    assert.ok(words(x.body) <= 40, `${at} body ${words(x.body)} words`);
    assert.ok(["numbers", "analogy", "scenario", "visual"].includes(x.exk), at + " exk");
    assert.ok(x.ex && words(x.ex) <= (isVisual(x) ? 40 : 30), `${at} example ${words(x.ex || "")} words`);
    if (isVisual(x)) assert.match(x.ex, /class="viz /, at + " visual example uses a diagram helper");
    assert.ok(x.take && !/</.test(x.take) && words(x.take) <= 14 && sentences(x.take) === 1, `${at} takeaway`);
    assert.ok(words(x.hook) + words(x.body) + (isVisual(x) ? 0 : words(x.ex)) + words(x.take) <= 75, `${at} too long for a 10–20 second read`);
    assert.ok(x.more && x.more.d && words(x.more.d) >= 15 && words(x.more.d) <= 110, at + " learn more");
    if (x.more.f) assert.ok(!/</.test(x.more.f), at + " formula is plain text");
    assert.ok(Array.isArray(x.rel) && x.rel.length >= 1 && x.rel.length <= 3, at + " rel");
    x.rel.forEach(id => assert.ok(bankIds.has(id), `${at} rel ${id} not in the question bank`));
    assert.ok(Array.isArray(x.k) && x.k.length >= 1 && x.k.length <= 3, at + " k tags");
    x.k.forEach(k => assert.ok(k in global.CHILL_TAGS, `${at} unknown tag ${k}`));
    if ("core" in x) assert.equal(x.core, true, at + " core");
  }
});

test("each topic has plenty of cards, a mix of card types and some diagrams", () => {
  for (const c of present) {
    const cards = CB.filter(x => x.c === c);
    assert.ok(cards.length >= 22, `${c}: ${cards.length} cards`);
    assert.ok(new Set(cards.map(x => x.t)).size >= 5, `${c}: card types`);
    assert.ok(cards.filter(isVisual).length >= 4, `${c}: diagrams`);
    assert.ok(cards.some(x => x.core), `${c}: core ideas`);
  }
  assert.ok(CB.filter(isVisual).length >= 35, "diagrams overall");
});

test("Rabbit hole: every card shares a tag with at least two other cards", () => {
  for (const x of CB) {
    const n = CB.filter(y => y !== x && y.k.some(k => x.k.includes(k))).length;
    assert.ok(n >= 2, `${x.id} has ${n} related cards`);
  }
});

test("Chill HTML is well formed", () => {
  const voids = new Set(["br", "hr", "img"]);
  const check = (html, where) => {
    const stack = [];
    for (const m of String(html).matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)) {
      const tag = m[1].toLowerCase();
      if (voids.has(tag)) continue;
      if (m[0][1] === "/") assert.equal(stack.pop(), tag, `${where}: unexpected </${tag}>`); else stack.push(tag);
    }
    assert.deepEqual(stack, [], `${where}: unclosed ${stack.join(",")}`);
    assert.ok(!/&(?![a-z]+;|#\d+;)/i.test(html), `${where}: escape & as &amp;`);
  };
  for (const x of CB) { check(x.body, x.id + " body"); check(x.ex, x.id + " ex"); check(x.more.d, x.id + " more"); }
});
