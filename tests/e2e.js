// Browser test of the full app. Needs Playwright with Chromium.
// Run: node tests/e2e.js   (serves the repo on a local port; screenshots go to tests/shots/ if SHOTS=1)
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const ROOT = path.resolve(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

const SHOTS = process.env.SHOTS ? path.join(__dirname, "shots") : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + ".png") }); };
let passed = 0;
const step = async (name, fn) => { await fn(); passed++; console.log("  ✓ " + name); };

(async () => {
  await new Promise(r => server.listen(0, r));
  const URL = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const errors = [];
  const watch = page => { page.on("pageerror", e => errors.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/fonts\.g|net::ERR_FAILED/.test(m.text())) errors.push(m.text()); }); };

  // ---------- phone ----------
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block" });
  // Block Google Fonts so tests don't depend on the network.
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const page = await ctx.newPage(); watch(page);
  const app = () => page.evaluate(() => { const a = window.__swipe; return { mode: a.mode, cur: a.cur, st: a.st, slides: a.slides.map(s => ({ kind: s.kind, id: s.id, state: s.state, seq: s.seq, style: s.style })) }; });
  const curSlide = () => page.locator(".slide").nth(0).evaluate(() => 0).then(async () => { const a = await app(); return { ...a.slides[a.cur], idx: a.cur }; });
  const curEl = async () => { const a = await app(); return page.locator(".slide").nth(a.cur); };
  const waitCur = async idx => page.waitForFunction(i => window.__swipe.cur === i, idx, { timeout: 4000 });
  const bank = await (async () => { await page.goto(URL); return page.evaluate(() => Object.fromEntries(window.QB.map(q => [q.id, { c: q.c, l: q.l, o: !!q.o, a: q.a, top: !!q.top }]))); })();

  // Answer the visible card: reveal (tap, quiz pick or the reveal button) then rate r. Returns the card id.
  const answer = async (r, viaKeys) => {
    const s = await curSlide();
    const el = await curEl();
    if (viaKeys) await page.keyboard.press(s.style === "mc" ? String(bank[s.id].a + 1) : "Space");
    else if (s.style === "mc") await el.locator(`.opt[data-i="${bank[s.id].a}"]`).click();
    else if (s.style === "open") await el.locator(".q").click();
    else await el.locator(".reveal-btn").click();
    await el.locator(".rates").waitFor();
    if (viaKeys) await page.keyboard.press(String(r + 1)); else await el.locator(`.rate[data-r="${r}"]`).click();
    await waitCur(s.idx + 1);
    return s.id;
  };

  console.log("Phone");
  await step("loads with a card, no errors, nothing overflowing sideways", async () => {
    const s = await curSlide();
    assert.equal(s.kind, "card");
    assert.equal(await page.locator("#ctx").isHidden(), true);
    assert.equal(await page.locator("#goalNum").textContent(), "0");
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(ov <= 0, "horizontal overflow " + ov);
    await shot(page, "phone-1-question");
  });

  await step("short questions sit in the middle of the card, not stuck at the top", async () => {
    const el = await curEl();
    const r = await el.evaluate(n => { const c = n.querySelector(".card-scroll").getBoundingClientRect(), g = n.querySelector(".ask-group").getBoundingClientRect(); return { above: g.top - c.top, below: c.bottom - g.bottom, fits: g.height < c.height - 40 }; });
    if (r.fits) assert.ok(r.above > 30 && r.below > r.above * 0.9, JSON.stringify(r));
  });

  await step("reveal shows Quick answer, layers expand, Go deeper shows follow-ups", async () => {
    const s = await curSlide(); const el = await curEl();
    if (bank[s.id].o) await el.locator(`.opt[data-i="${bank[s.id].a}"]`).click(); else await el.locator(".card-scroll").click({ position: { x: 30, y: 200 } });
    await el.locator(".quick").waitFor();
    assert.ok(await el.locator(".answer").isVisible());
    await el.locator('.layer-toggle[data-layer="detail"]').click();
    assert.ok(await el.locator('.layer-toggle[data-layer="detail"] + .layer-body').isVisible());
    await el.locator(".deeper").click();
    assert.ok(await el.locator(".fus").isVisible());
    await page.waitForTimeout(600);
    assert.equal((await app()).cur, s.idx, "Go deeper must not move the feed to the next card");
    await el.locator(".fu-show").first().click();
    assert.ok(await el.locator(".fa").first().isVisible());
    assert.equal(await el.locator(".rate").count(), 3);
    assert.ok(await el.locator(".quick .prose > p:first-child").count(), "quick answer opens with a lead sentence");
    await shot(page, "phone-2-revealed");
  });

  await step("scrolling to the end of a long explanation doesn't jump to the next card", async () => {
    // Find a card with more to read than fits on screen (open every layer), rating short ones along the way.
    let s, el;
    for (let i = 0; i < 12; i++) {
      s = await curSlide(); el = await curEl();
      if (s.state === "ask") { if (s.style === "mc") await el.locator(`.opt[data-i="${bank[s.id].a}"]`).click(); else await el.locator(".q").click(); }
      await el.locator(".rates").waitFor();
      if (await el.locator(".deeper").count() && await el.locator('.deeper[aria-expanded="false"]').count()) await el.locator(".deeper").click();
      await el.evaluate(n => n.querySelectorAll('.layer-toggle[aria-expanded="false"], .fu-show[aria-expanded="false"]').forEach(b => b.click()));
      if (await el.locator(".card-scroll").evaluate(n => n.scrollHeight > n.clientHeight + 100)) break;
      await el.locator('.rate[data-r="2"]').click(); await waitCur(s.idx + 1);
    }
    assert.ok(await el.locator(".card-scroll").evaluate(n => n.scrollHeight > n.clientHeight + 100), "no long card found");
    const box = await el.locator(".card-scroll").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(60); }
    await page.waitForTimeout(700);
    assert.equal((await app()).cur, s.idx, "feed moved while scrolling inside the card");
  });

  let missed;
  await step("Didn't know auto-advances and schedules the card 3-5 cards later", async () => {
    const s = await curSlide(); const el = await curEl();
    await el.locator('.rate[data-r="0"]').click();
    await waitCur(s.idx + 1);
    const a = await app();
    missed = s.id;
    const c = a.st.cards[missed];
    assert.equal(c.last, 0);
    assert.ok(c.dueN - s.seq >= 3 && c.dueN - s.seq <= 5, "gap " + (c.dueN - s.seq));
    const prev = page.locator(".slide").nth(s.idx);
    assert.equal(await prev.locator(".rate.sel").count(), 1, "chosen rating stays highlighted");
    assert.match(await prev.locator(".rate.sel").textContent(), /back in ≈\d cards/);
    assert.equal(await prev.locator(".rate:not([disabled])").count(), 0);
  });

  await step("the missed card comes back within 3-5 cards", async () => {
    let back = -1;
    for (let i = 0; i < 6 && back < 0; i++) {
      const s = await curSlide();
      if (s.id === missed) { back = i; break; }
      await answer(2, i % 2 === 1);    // alternate mouse and keyboard
    }
    assert.ok(back >= 2 && back <= 5, "came back after " + (back + 1) + " cards");
    const el = await curEl();
    assert.ok(await el.locator(".badge.weak, .badge.due").count(), "flagged as weak/again");
  });

  await step("bookmark toggles and persists", async () => {
    const el = await curEl(); const s = await curSlide();
    await el.locator(".bm").click();
    assert.equal(await el.locator(".bm").getAttribute("aria-pressed"), "true");
    const a = await app();
    assert.ok(a.st.bookmarks.includes(s.id));
    assert.ok((await page.evaluate(() => localStorage.getItem("swipetechs.v2"))).includes(s.id));
    await answer(0);
  });

  await step("header ring counts today's reviews", async () => {
    const a = await app();
    const today = Object.values(a.st.log)[0];
    assert.equal(await page.locator("#goalNum").textContent(), String(today));
    assert.ok(today >= 4);
  });

  await step("keyboard: arrows move between cards", async () => {
    const before = (await app()).cur;
    await page.keyboard.press("ArrowUp"); await waitCur(before - 1);
    await page.keyboard.press("ArrowDown"); await waitCur(before);
  });

  await step("Review tab (weak questions) shows the cards you missed", async () => {
    assert.equal((await page.locator('.tab[data-mode="weak"]').textContent()).trim(), "Review");
    await page.locator('.tab[data-mode="weak"]').click();
    await page.waitForFunction(() => window.__swipe.mode === "weak");
    assert.match(await page.locator("#ctxLabel").textContent(), /Review · \d+ weak questions? to fix/);
    const s = await curSlide();
    const a = await app();
    const wk = a.st.cards[s.id];
    assert.ok(wk && (wk.lapses > 0 || wk.partials > 0));
  });

  await step("Topic Focus filters by category and level", async () => {
    await page.locator('.tab[data-mode="topic"]').click();
    await page.locator("#topicSheet").waitFor();
    const lbo = page.locator("#catChips .chip", { hasText: "LBO" });
    await lbo.click();
    await page.locator("#lvlChips .chip", { hasText: "Beginner" }).click();
    await page.locator("#lvlChips .chip", { hasText: "Intermediate" }).click();
    assert.equal(await lbo.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("#catChips .chip", { hasText: "All topics" }).getAttribute("aria-pressed"), "false");
    assert.equal(await page.locator("#topicSel").textContent(), "LBO · Advanced");
    assert.match(await page.locator("#topicCount").textContent(), /^\d+ questions · \d+ due · \d+ new$/);
    await page.locator("#topicStart").click();
    await page.waitForFunction(() => window.__swipe.mode === "topic");
    for (let i = 0; i < 5; i++) {      // 5 reviews in one topic also makes it eligible for "weakest topics"
      const s = await curSlide();
      assert.equal(bank[s.id].c, "lbo"); assert.equal(bank[s.id].l, 3);
      await answer(1);
    }
    assert.match(await page.locator("#ctxLabel").textContent(), /LBO · Advanced/);
  });

  await step("Top 100 and Bookmarks collections", async () => {
    await page.locator("#collectionsBtn").click();
    await page.locator("#collTop").click();
    await page.waitForFunction(() => window.__swipe.mode === "top100");
    assert.ok(bank[(await curSlide()).id].top);
    await page.locator("#collectionsBtn").click();
    assert.match(await page.locator("#collBmSub").textContent(), /1 saved card/);
    await page.locator("#collBm").click();
    await page.waitForFunction(() => window.__swipe.mode === "bookmarks");
    const a = await app();
    assert.ok(a.st.bookmarks.includes((await curSlide()).id));
  });

  await step("Interview Mode: 12 questions, spoken or typed answers, follow-ups, breakdown at the end", async () => {
    await page.locator('.tab[data-mode="interview"]').click();
    await page.waitForFunction(() => window.__swipe.mode === "interview");
    const ids = new Set();
    let typed = 0, spoken = 0;
    for (let i = 0; i < 12; i++) {
      const el = await curEl(); const s = await curSlide();
      assert.ok(await el.locator(".answer").isHidden(), "answer hidden before attempt");
      if (i === 0) { assert.match(await el.locator(".timer .t").textContent(), /^0:0\d$/); await shot(page, "phone-3-interview"); }
      if (s.style === "talk") { spoken++; assert.equal(await el.locator(".opt").count(), 0, "no answer choices on spoken questions"); }
      if (s.style === "num" && !typed) {
        typed++;
        const right = await page.evaluate(id => { const q = window.QB.find(x => x.id === id); return q.n ? q.n.v : parseFloat(q.o[q.a].replace(/[^0-9.\-]/g, "")); }, s.id);
        await el.locator(".numin").fill(String(right));
        await el.locator(".check").click();
        await el.locator(".rates").waitFor();
        assert.ok(await el.locator(".numres.ok").count(), "typed the right number");
        assert.ok(await el.locator('.rate[data-r="2"].suggest').count());
        await el.locator('.rate[data-r="2"]').click(); await waitCur(s.idx + 1);
        ids.add(s.id); continue;
      }
      if (s.style !== "mc") {
        await el.locator(".reveal-btn").click();
        assert.ok(await el.locator(".fu-int .fq").isVisible(), "follow-up question shown with the answer");
        await el.locator('.rate[data-r="' + (i % 3) + '"]').click(); await waitCur(s.idx + 1);
        ids.add(s.id); continue;
      }
      ids.add(await answer(i % 3));
    }
    assert.ok(spoken >= 6, "most interview questions are answered out loud");
    assert.equal(ids.size, 12);
    const el = await curEl();
    await el.locator(".score").waitFor();
    assert.match(await el.textContent(), /Interview complete/);
    assert.equal(await el.locator(".qlist li").count(), 12);
    await shot(page, "phone-4-summary");
    await el.locator('[data-act="bm-misses"]').click();
    const a = await app();
    assert.ok(a.st.bookmarks.length >= 5);
    assert.equal(a.st.interviews.length, 1);
  });

  await step("Progress dashboard shows today, streak, mastery by category, weakest topics", async () => {
    await page.locator('.tab[data-mode="progress"]').click();
    await page.locator("#progSheet").waitFor();
    assert.equal(await page.locator("#dash .mrow").count(), 8);
    assert.match(await page.locator("#dash .big-ring").textContent(), /\d+%\s*mastered/);
    assert.match(await page.locator("#dash .tiles").textContent(), /Streak\s*1\s*day/);
    assert.match(await page.locator("#dash .goal-line").textContent(), /\/ 20 cards/);
    assert.equal(await page.locator("#progSheet #themeChips").count(), 0, "appearance lives in Settings");
    assert.ok(await page.locator("#dash .wrow").count() >= 1, "weakest topics listed");
    assert.match(await page.locator("#dash").textContent(), /Last interview/);
    await shot(page, "phone-5-progress");
    await page.locator("#toSettings").click();
    await page.locator("#setSheet").waitFor();
    await page.locator("#themeChips .chip", { hasText: "Dark" }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
    await shot(page, "phone-6-progress-dark");
    await page.keyboard.press("Escape");
    assert.ok(await page.locator("#setSheet").isHidden());
    await shot(page, "phone-7-dark-feed");
  });

  await step("progress survives a reload", async () => {
    const before = await app();
    await page.reload();
    await page.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
    const after = await app();
    assert.deepEqual(after.st.bookmarks, before.st.bookmarks);
    assert.equal(Object.keys(after.st.cards).length, Object.keys(before.st.cards).length);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
    assert.ok(after.st.seq >= before.st.seq);
  });

  await step("changing a quiz's suggested rating replaces it instead of counting twice", async () => {
    await page.locator('.tab[data-mode="foryou"]').click();
    await page.waitForFunction(() => window.__swipe.mode === "foryou");
    for (let i = 0; i < 40; i++) {
      const s = await curSlide();
      if (s.style === "mc") {
        const el = await curEl();
        const before = await app();
        const day = Object.keys(before.st.log).pop(), n0 = before.st.log[day], c0 = before.st.cards[s.id] ? before.st.cards[s.id].n : 0;
        await el.locator(`.opt[data-i="${bank[s.id].a}"]`).click();
        assert.ok(await el.locator('.rate[data-r="2"].suggest').count());
        await el.locator('.rate[data-r="1"]').click();
        await waitCur(s.idx + 1);
        const a = await app();
        assert.equal(a.st.log[day], n0 + 1);
        assert.equal(a.st.cards[s.id].n, c0 + 1);
        assert.equal(a.st.cards[s.id].last, 1);
        return;
      }
      await answer(2);
    }
    throw new Error("no quiz card found");
  });

  await step("a quiz answered but not rated gets its suggested rating when you swipe on", async () => {
    await page.locator('.tab[data-mode="foryou"]').click();
    await page.waitForFunction(() => window.__swipe.mode === "foryou");
    for (let i = 0; i < 40; i++) {
      const s = await curSlide();
      if (s.style === "mc") {
        const el = await curEl();
        const wrong = (bank[s.id].a + 1) % 2;
        await el.locator(`.opt[data-i="${wrong}"]`).click();
        assert.ok(await el.locator('.rate[data-r="0"].suggest').count());
        await page.keyboard.press("ArrowDown"); await waitCur(s.idx + 1);
        const a = await app();
        assert.equal(a.st.cards[s.id].last, 0);
        return;
      }
      await answer(2);
    }
    throw new Error("no quiz card found");
  });
  await ctx.close();

  // ---------- small phone ----------
  console.log("Small phone");
  const ctxS = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, serviceWorkers: "block" });
  await ctxS.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const pS = await ctxS.newPage(); watch(pS);
  await pS.goto(URL);
  await pS.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
  await step("320px wide: nothing overflows, controls stay big enough to tap", async () => {
    const r = await pS.evaluate(() => {
      const small = [...document.querySelectorAll(".bar button, .tab, .slide:first-child .foot button, .slide:first-child .bm, .slide:first-child .opt")]
        .map(b => b.getBoundingClientRect()).filter(b => b.width && (b.height < 34 || b.width < 34));
      return { ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: small.length, settings: document.querySelector("#settingsBtn").getBoundingClientRect().right <= innerWidth };
    });
    assert.equal(r.ov, 0); assert.equal(r.small, 0); assert.ok(r.settings, "settings button on screen");
    await shot(pS, "small-1");
  });
  await ctxS.close();

  // ---------- migration from v1 ----------
  console.log("Migration");
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await ctx2.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const v1 = { rec: { a3: { g: 3, m: 0, streak: 3, due: 50, last: "g" }, e8: { g: 0, m: 2, streak: 0, due: 7, last: "m" } }, saved: ["l5", "m4"], prefs: { topics: ["acct"], level: "all", mode: "feed" } };
  await ctx2.addInitScript(d => { if (!localStorage.getItem("swipetechs.v1")) localStorage.setItem("swipetechs.v1", d); }, JSON.stringify(v1));
  const p2 = await ctx2.newPage(); watch(p2);
  await p2.goto(URL);
  await p2.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
  await step("v1 saved cards become bookmarks and missed cards become weak", async () => {
    const st = await p2.evaluate(() => window.__swipe.st);
    assert.deepEqual(st.bookmarks, ["l5", "m4"]);
    assert.equal(st.cards.e8.last, 0);
    assert.equal(st.cards.a3.last, 2);
    assert.equal(await p2.evaluate(() => localStorage.getItem("swipetechs.v1")), JSON.stringify(v1));
    const first = await p2.evaluate(() => window.__swipe.slides[0].id);
    assert.equal(first, "e8", "the previously missed card comes first");
  });
  await ctx2.close();

  // ---------- desktop ----------
  console.log("Desktop");
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block", colorScheme: "dark" });
  await ctx3.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const p3 = await ctx3.newPage(); watch(p3);
  await p3.goto(URL);
  await p3.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
  await step("keyboard-only flow: reveal, explanation, rate, next", async () => {
    const q = await p3.evaluate(() => { const s = window.__swipe.slides[window.__swipe.cur]; return window.QB.find(x => x.id === s.id); });
    await p3.keyboard.press(q.o ? String(q.a + 1) : "Space");
    assert.ok(await p3.locator(".slide").first().locator(".rate kbd").first().isVisible(), "shortcut hints shown on desktop");
    await p3.locator(".slide").first().locator(".rates").waitFor();
    await p3.keyboard.press("e");
    assert.ok(await p3.locator(".slide").first().locator(".layer-body").first().isVisible());
    await shot(p3, "desktop-1-dark");
    await p3.keyboard.press("3");
    await p3.waitForFunction(() => window.__swipe.cur === 1);
    const w = await p3.locator(".card").first().evaluate(e => e.getBoundingClientRect().width);
    assert.ok(w <= 600, "card width capped on desktop");
  });
  await ctx3.close();

  await browser.close(); server.close();
  if (errors.length) { console.error("Page errors:\n" + errors.join("\n")); process.exit(1); }
  console.log(`\n${passed} checks passed`);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
