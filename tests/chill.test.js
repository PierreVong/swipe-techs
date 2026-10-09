// Chill Mode content checks: structure, length limits (10–20 second reads), links into the main bank. Run: node --test tests/
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

test("ids are unique, stable-looking and match their topic", () => {
  const ids = CB.map(x => x.id);
  assert.equal(new Set(ids).size, ids.length);
  CB.forEach(x => { assert.match(x.id, /^x[a-z]\d+$/, x.id); assert.equal(x.id[1], TOPICS[x.c], `${x.id} topic letter`); assert.ok(!bankIds.has(x.id)); });
});

test("every card has a hook, a short explanation, an example and one takeaway", () => {
  for (const x of CB) {
    const at = x.id;
    assert.ok(["concept", "intuition", "example", "fact", "real", "myth"].includes(x.t), at + " t");
    assert.ok(x.hook && x.hook.length >= 15 && x.hook.length <= 110, at + " hook length " + (x.hook || "").length);
    assert.ok(!/</.test(x.hook), at + " hook is plain text");
    if (x.t === "myth") assert.ok(["Myth", "Partly true", "True"].includes(x.v), at + " myth verdict");
    const s = sentences(x.body);
    assert.ok(s >= 2 && s <= 4, `${at} body has ${s} sentences`);
    assert.ok(words(x.body) <= 60, `${at} body ${words(x.body)} words`);
    assert.ok(["numbers", "analogy", "scenario"].includes(x.exk), at + " exk");
    assert.ok(x.ex && words(x.ex) <= 45, `${at} example ${words(x.ex || "")} words`);
    assert.ok(x.take && !/</.test(x.take) && words(x.take) <= 24 && sentences(x.take) === 1, `${at} takeaway`);
    assert.ok(words(x.hook) + words(x.body) + words(x.ex) + words(x.take) <= 120, `${at} too long for a 10–20 second read`);
    assert.ok(x.more && x.more.d && words(x.more.d) >= 15, at + " learn more");
    if (x.more.f) assert.ok(!/</.test(x.more.f), at + " formula is plain text");
    assert.ok(Array.isArray(x.rel) && x.rel.length >= 1 && x.rel.length <= 3, at + " rel");
    x.rel.forEach(id => assert.ok(bankIds.has(id), `${at} rel ${id} not in the question bank`));
  }
});

test("each topic has plenty of cards and a mix of card types", () => {
  for (const c of present) {
    const cards = CB.filter(x => x.c === c);
    assert.ok(cards.length >= 15, `${c}: ${cards.length} cards`);
    assert.ok(new Set(cards.map(x => x.t)).size >= 4, `${c}: card types`);
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
