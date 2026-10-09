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

  // ---------- Chill Mode ----------
  console.log("Chill Mode");
  const ctxC = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block", colorScheme: "light" });
  await ctxC.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const pC = await ctxC.newPage(); watch(pC);
  await pC.goto(URL);
  await pC.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
  const chillApp = () => pC.evaluate(() => { const a = window.__swipe; return { mode: a.mode, cur: a.cur, ch: a.chill, st: { cards: a.st.cards, log: a.st.log, bookmarks: a.st.bookmarks }, slides: a.slides.map(s => ({ kind: s.kind, id: s.id })) }; });
  const chillCur = async () => { const a = await chillApp(); return { ...a.slides[a.cur], idx: a.cur, el: pC.locator(".slide").nth(a.cur) }; };
  const chillWait = idx => pC.waitForFunction(i => window.__swipe.cur === i, idx, { timeout: 4000 });
  const studyBefore = JSON.stringify((await chillApp()).st);

  await step("Chill tab opens straight into a concept: hook, explanation, example, takeaway; no reveal, quiz or rating", async () => {
    assert.equal(await pC.evaluate(() => document.documentElement.dataset.theme || "light"), "light");
    await pC.locator('.tab[data-mode="chill"]').click();
    await pC.waitForFunction(() => window.__swipe.mode === "chill");
    const s = await chillCur();
    assert.equal(s.kind, "chill");
    for (const sel of [".hook", ".explain", ".cex", ".take"]) assert.ok(await s.el.locator(sel).isVisible(), sel + " visible");
    assert.equal(await s.el.locator(".reveal-btn, .opt, .rates, .timer").count(), 0);
    assert.equal(await s.el.locator(".more-body").isHidden(), true, "Learn more starts closed");
    assert.equal(await pC.evaluate(() => document.documentElement.dataset.theme), "dark", "Chill uses the night palette");
    assert.match(await pC.locator("#ctxLabel").textContent(), /Chill · Mixed feed/);
    const ov = await pC.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(ov <= 0, "horizontal overflow " + ov);
    await shot(pC, "chill-1");
  });

  await step("a concept counts as seen after a pause, a quick flick doesn't, and study progress is untouched", async () => {
    const first = await chillCur();
    await pC.waitForTimeout(2300);
    let a = await chillApp();
    assert.ok(a.ch.seen[first.id], "first concept seen after 2 s");
    assert.ok((await pC.evaluate(() => localStorage.getItem("swipetechs.chill.v1"))).includes(first.id));
    await pC.keyboard.press("ArrowDown"); await chillWait(first.idx + 1);
    const flicked = await chillCur();
    await pC.waitForTimeout(300);
    await pC.keyboard.press("ArrowDown"); await chillWait(first.idx + 2);
    await pC.waitForTimeout(2300);
    a = await chillApp();
    assert.ok(!a.ch.seen[flicked.id], "a card flicked past isn't counted");
    assert.equal(JSON.stringify(a.st), studyBefore, "no reviews, mastery or bookmarks from Chill");
    assert.equal(await pC.locator("#goalNum").textContent(), "0");
  });

  await step("no concept repeats within a session, and topics and card types vary", async () => {
    for (let i = 0; i < 10; i++) { const c = await chillCur(); await pC.keyboard.press("ArrowDown"); await chillWait(c.idx + 1); }
    const a = await chillApp();
    const ids = a.slides.filter(s => s.kind === "chill").map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, "repeat in " + ids.join(","));
    const meta = await pC.evaluate(list => list.map(id => { const x = window.CB.find(y => y.id === id); return [x.c, x.t]; }), ids);
    for (let i = 1; i < meta.length; i++) assert.ok(meta[i][0] !== meta[i - 1][0] || meta[i][1] !== meta[i - 1][1], "same topic and type twice in a row");
  });

  await step("Learn more opens the deeper explanation and the related interview question", async () => {
    const s = await chillCur();
    await s.el.locator(".more-btn").click();
    assert.equal(await s.el.locator(".more-btn").getAttribute("aria-expanded"), "true");
    assert.ok(await s.el.locator(".more-body").isVisible());
    const q = await pC.evaluate(id => { const x = window.CB.find(y => y.id === id); return window.QB.find(y => y.id === x.rel[0]).q; }, s.id);
    assert.equal((await s.el.locator(".iq p").textContent()).trim(), q);
    await shot(pC, "chill-2-more");
  });

  let saved;
  await step("saving a concept keeps it in Chill saves, apart from study bookmarks, across a reload", async () => {
    const s = await chillCur(); saved = s.id;
    await s.el.locator(".bm").click();
    assert.equal(await s.el.locator(".bm").getAttribute("aria-pressed"), "true");
    let a = await chillApp();
    assert.deepEqual(a.ch.bm, [saved]);
    assert.ok(!a.st.bookmarks.includes(saved));
    await pC.reload();
    await pC.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
    a = await chillApp();
    assert.equal(a.mode, "chill", "reopens in Chill");
    assert.deepEqual(a.ch.bm, [saved]);
    await pC.locator("#collectionsBtn").click();
    assert.match(await pC.locator("#collChillSub").textContent(), /^1 saved concept /);
    await pC.locator("#collChill").click();
    await pC.waitForFunction(() => window.__swipe.slides.length > 0 && window.__swipe.slides[0].kind === "chill");
    a = await chillApp();
    assert.equal(a.slides[0].id, saved);
    assert.match(await pC.locator("#ctxLabel").textContent(), /Saved concepts/);
    await pC.locator("#ctxBtn").click();
    await pC.waitForFunction(() => window.__swipe.mode === "chill" && window.__swipe.slides.length > 0);
    assert.match(await pC.locator("#ctxLabel").textContent(), /Mixed feed/);
  });

  await step("Test me answers the related interview question in study mode, then returns to Chill", async () => {
    const s = await chillCur();
    const rel = await pC.evaluate(id => window.CB.find(y => y.id === id).rel.filter(r => window.QB.some(q => q.id === r)), s.id);
    await s.el.locator(".try-btn").click();
    await pC.waitForFunction(() => window.__swipe.mode === "drill");
    let c = await chillCur();
    assert.equal(c.kind, "card"); assert.equal(c.id, rel[0]);
    assert.match(await pC.locator("#ctxLabel").textContent(), new RegExp(`Test me · question 1 of ${rel.length}`));
    assert.equal(await pC.evaluate(() => document.documentElement.dataset.theme), "dark", "Test me stays in the night palette");
    assert.equal(await pC.locator('.tab[data-mode="chill"]').getAttribute("aria-current"), "page");
    const style = await pC.evaluate(() => { const a = window.__swipe; return a.slides[a.cur].style; });
    const q = await pC.evaluate(id => window.QB.find(y => y.id === id), c.id);
    if (style === "mc") await c.el.locator(`.opt[data-i="${q.a}"]`).click();
    else if (style === "open") await c.el.locator(".q").click();
    else await c.el.locator(".reveal-btn").click();
    await c.el.locator(".rates").waitFor();
    await c.el.locator('.rate[data-r="2"]').click();
    await chillWait(c.idx + 1);
    const a = await chillApp();
    assert.ok(a.st.cards[rel[0]], "the real answer counts as study");
    await pC.locator("#ctxBtn").click();
    await pC.waitForFunction(() => window.__swipe.mode === "chill");
    assert.equal(await pC.evaluate(() => document.documentElement.dataset.theme), "dark");
  });

  await step("Topics narrows the Chill feed and can go back to the mixed feed", async () => {
    await pC.locator("#ctxBtn").click();
    await pC.locator("#chillSheet").waitFor();
    await pC.locator("#chillChips .chip", { hasText: "LBO" }).click();
    assert.match(await pC.locator("#chillCount").textContent(), /^\d+ concepts · \d+ not seen yet$/);
    await pC.locator("#chillStart").click();
    await pC.waitForFunction(() => window.__swipe.mode === "chill" && window.__swipe.slides.length > 0);
    for (let i = 0; i < 4; i++) { const c = await chillCur(); await pC.keyboard.press("ArrowDown"); await chillWait(c.idx + 1); }
    let a = await chillApp();
    const cats = await pC.evaluate(ids => ids.map(id => window.CB.find(y => y.id === id).c), a.slides.filter(s => s.kind === "chill").map(s => s.id));
    assert.ok(cats.length >= 4 && cats.every(c => c === "lbo"), cats.join(","));
    assert.deepEqual(a.ch.cats, ["lbo"]);
    assert.match(await pC.locator("#ctxLabel").textContent(), /Chill · LBO/);
    await pC.locator("#ctxBtn").click();
    await pC.locator("#chillChips .chip", { hasText: "Mixed feed" }).click();
    await pC.locator("#chillStart").click();
    await pC.waitForFunction(() => window.__swipe.mode === "chill");
    a = await chillApp();
    assert.deepEqual(a.ch.cats, []);
  });

  await step("moving between Chill and the other modes keeps both working; Progress shows Chill apart from mastery", async () => {
    await pC.locator('.tab[data-mode="foryou"]').click();
    await pC.waitForFunction(() => window.__swipe.mode === "foryou");
    assert.equal((await chillCur()).kind, "card");
    assert.equal(await pC.evaluate(() => document.documentElement.dataset.theme || "light"), "light", "theme restored");
    await pC.locator('.tab[data-mode="topic"]').click(); await pC.keyboard.press("Escape");
    await pC.locator('.tab[data-mode="chill"]').click();
    await pC.waitForFunction(() => window.__swipe.mode === "chill");
    assert.equal((await chillCur()).kind, "chill");
    await pC.locator('.tab[data-mode="progress"]').click();
    const row = await pC.locator("#dash .crow").textContent();
    const a = await chillApp();
    const total = await pC.evaluate(() => window.CB.length);
    assert.match(row, new RegExp(`${Object.keys(a.ch.seen).length} of ${total} concepts seen`));
    assert.match(row, /1 saved · separate from mastery/);
    await pC.keyboard.press("Escape");
  });

  await step("Chill hides the study goal and streak; a double tap means More like this", async () => {
    await pC.locator('.tab[data-mode="chill"]').click();
    await pC.waitForFunction(() => window.__swipe.mode === "chill");
    assert.ok(await pC.locator("#goalBtn").isHidden()); assert.ok(await pC.locator("#streak").isHidden());
    const c = await chillCur();
    await c.el.locator(".hook").dblclick();
    await pC.waitForFunction(id => !!window.__swipe.chill.like[id], c.id);
    await c.el.locator(".more-btn").click();
    assert.equal(await c.el.locator(".like-btn").getAttribute("aria-pressed"), "true");
    await c.el.locator(".like-btn").click();
    assert.equal(await pC.evaluate(id => !!window.__swipe.chill.like[id], c.id), false, "the button turns it off again");
  });

  await step("Rabbit hole puts related concepts next, then the feed carries on", async () => {
    const c = await chillCur();
    const tags = await pC.evaluate(id => window.CB.find(x => x.id === id).k, c.id);
    await c.el.locator(".rh-btn").click();
    await chillWait(c.idx + 1);
    const n = await c.el.locator(".rh-btn small").textContent().then(t => parseInt(t));
    for (let i = 1; i <= n; i++) {
      const r = await chillCur();
      assert.match(await r.el.locator(".badge.rh").textContent(), new RegExp(`${i} of ${n}`));
      const k = await pC.evaluate(id => window.CB.find(x => x.id === id).k, r.id);
      assert.ok(k.some(t => tags.includes(t)), `${r.id} shares a concept with ${c.id}`);
      await pC.keyboard.press("ArrowDown"); await chillWait(r.idx + 1);
    }
    const after = await chillCur();
    assert.equal(after.kind, "chill"); assert.equal(await after.el.locator(".badge.rh").count(), 0);
  });

  await step("reopening the app goes back to the same Chill card, without repeating earlier ones", async () => {
    await pC.waitForTimeout(300);
    const before = await chillApp(), id = before.slides[before.cur].id;
    const shown = before.slides.slice(0, before.cur).map(s => s.id);
    await pC.reload();
    await pC.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
    const a = await chillApp();
    assert.equal(a.mode, "chill"); assert.equal(a.slides[0].id, id);
    assert.ok(a.slides.slice(1).every(s => !shown.includes(s.id)), "next cards are new to this session");
  });

  await step("most Chill cards fit on one phone screen without scrolling inside the card", async () => {
    const r = await pC.evaluate(() => {
      const feed = document.querySelector(".feed"); let fit = 0;
      for (const x of window.CB) {
        const el = window.__swipe.renderChill(x.id); el.classList.add("cur"); feed.appendChild(el);
        const sc = el.querySelector(".card-scroll"); if (sc.scrollHeight <= sc.clientHeight) fit++;
        el.remove();
      }
      return { fit, total: window.CB.length };
    });
    assert.ok(r.fit / r.total >= 0.9, `${r.fit} of ${r.total} fit`);
  });
  await ctxC.close();

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
  await step("320px wide: all six tabs and the Chill card fit", async () => {
    await pS.locator('.tab[data-mode="chill"]').click();
    await pS.waitForFunction(() => window.__swipe.mode === "chill");
    const r = await pS.evaluate(() => {
      const el = window.__swipe.slides[window.__swipe.cur].el;
      const small = [...el.querySelectorAll(".chill-foot button")].map(b => b.getBoundingClientRect()).filter(b => b.height < 34 || b.width < 34);
      const clipped = [...document.querySelectorAll(".tab span")].filter(s => s.scrollWidth > s.clientWidth + 1).map(s => s.textContent);
      return { ov: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: small.length, clipped, tabs: document.querySelectorAll(".tab").length };
    });
    assert.equal(r.tabs, 6); assert.equal(r.ov, 0); assert.equal(r.small, 0); assert.deepEqual(r.clipped, []);
    await shot(pS, "small-2-chill");
  });
  await ctxS.close();

  // ---------- private collection ----------
  // Uses a small synthetic file (tests/fixtures/private-sample.json), never real guide content.
  console.log("Private collection");
  const SAMPLE = path.join(__dirname, "fixtures", "private-sample.json");
  const ctxP = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block", colorScheme: "light" });
  await ctxP.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const pP = await ctxP.newPage(); watch(pP);
  await pP.goto(URL);
  await pP.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
  const pApp = () => pP.evaluate(() => { const a = window.__swipe; return { mode: a.mode, cur: a.cur, priv: { status: a.priv.status, count: a.priv.count, src: a.priv.src() }, st: { cards: a.st.cards, log: a.st.log, bookmarks: a.st.bookmarks, prefs: a.st.prefs }, slides: a.slides.map(s => ({ kind: s.kind, id: s.id, state: s.state })) }; });
  const pCur = async () => { const a = await pApp(); return { ...a.slides[a.cur], idx: a.cur, el: pP.locator(".slide").nth(a.cur) }; };
  const pWait = idx => pP.waitForFunction(i => window.__swipe.cur === i, idx, { timeout: 4000 });
  const pReady = () => pP.waitForFunction(() => window.__swipe && window.__swipe.slides.length > 0);
  const importFile = async () => {
    await pP.locator("#settingsBtn").click();
    await pP.locator("#setSheet").waitFor();
    await Promise.all([pP.waitForEvent("load"), pP.setInputFiles("#privFile", SAMPLE)]);
    await pReady();
  };

  await step("before an import the public app shows no private collection anywhere", async () => {
    // Some built-in progress first, so deleting the collection can be checked against it.
    await pP.evaluate(() => { const S = window.SRS, st = window.__swipe.st; S.rate(st, "a1", 2, Date.now(), 0); S.rate(st, "e1", 0, Date.now(), 0); S.save(localStorage, st); });
    const a = await pApp();
    assert.equal(a.priv.status, "none"); assert.equal(a.priv.count, 0);
    assert.equal(await pP.evaluate(() => localStorage.getItem("swipetechs.private")), null);
    await pP.locator("#collectionsBtn").click();
    assert.ok(await pP.locator("#collPriv").isHidden());
    await pP.keyboard.press("Escape");
    await pP.locator('.tab[data-mode="topic"]').click();
    assert.ok(await pP.locator("#topicSrc").isHidden());
    await pP.keyboard.press("Escape");
    await pP.locator("#settingsBtn").click();
    assert.match(await pP.locator("#privBox").textContent(), /Import question file/);
    await pP.keyboard.press("Escape");
  });

  await step("a file that isn't a collection is refused with a reason and nothing is stored", async () => {
    await pP.locator("#settingsBtn").click();
    await pP.setInputFiles("#privFile", { name: "notes.json", mimeType: "application/json", buffer: Buffer.from('{"hello": 1}') });
    await pP.locator("#privBox .note.bad").waitFor();
    assert.match(await pP.locator("#privBox .note.bad").textContent(), /Not imported/);
    assert.equal(await pP.evaluate(() => localStorage.getItem("swipetechs.private")), null);
    await pP.keyboard.press("Escape");
  });

  await step("importing opens the collection on its first question, in guide order", async () => {
    await importFile();
    const a = await pApp();
    assert.equal(a.priv.status, "ok"); assert.equal(a.priv.count, 8);
    assert.equal(a.mode, "priv");
    assert.deepEqual(a.slides.slice(0, 3).map(s => s.id), ["pv-acct-b01", "pv-acct-b02", "pv-acct-b03"]);
    assert.match(await pP.locator("#ctxLabel").textContent(), /Sample · Sequential · Accounting Basic Q1/);
    const meta = await pP.locator(".slide").first().locator(".meta").textContent();
    assert.match(meta, /Basic/); assert.match(meta, /Sample #1 · p\.10/);
    await shot(pP, "private-1-question");
  });

  await step("reveal shows the original answer word for word with its page; added text sits in its own labelled tab", async () => {
    const c = await pCur();
    await c.el.locator(".reveal-btn").click();
    await c.el.locator(".orig").waitFor();
    assert.match(await c.el.locator(".orig .lbl").textContent(), /Original answer · Sample p\. 10/);
    assert.match(await c.el.locator(".srctext").innerText(), /^The income statement shows revenue, expenses and profit over a period\./);
    assert.equal(await c.el.locator(".srctext strong").first().textContent(), "income statement");
    assert.deepEqual(await c.el.locator(".atab").allTextContents(), ["Original", "Simplified"]);
    await c.el.locator('.atab[data-tab="simple"]').click();
    assert.ok(await c.el.locator('[data-pane="simple"]').isVisible());
    assert.ok(await c.el.locator('[data-pane="orig"]').isHidden());
    assert.match(await c.el.locator('[data-pane="simple"] .lbl').textContent(), /Written for Swipe Techs/);
    await pP.waitForTimeout(300);
    await shot(pP, "private-2-simplified");
    await c.el.locator('.rate[data-r="2"]').click();
    await pWait(c.idx + 1);
    const a = await pApp();
    assert.equal(a.st.cards["pv-acct-b01"].last, 2);
    assert.equal(a.st.prefs.priv.cur["acct:1"], 1);
    assert.equal(await pP.locator("#goalNum").textContent(), "3", "counts toward the daily goal (2 built-in reviews seeded first)");
  });

  await step("a long answer scrolls inside the card; the rating buttons stay on screen", async () => {
    const c = await pCur();
    assert.equal(c.id, "pv-acct-b02");
    await c.el.locator(".reveal-btn").click();
    await c.el.locator(".rates").waitFor();
    const r = await c.el.evaluate(n => { const sc = n.querySelector(".card-scroll"), f = n.querySelector(".foot").getBoundingClientRect(); return { scrolls: sc.scrollHeight > sc.clientHeight + 50, footIn: f.bottom <= innerHeight && f.top > 0, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
    assert.ok(r.scrolls); assert.ok(r.footIn); assert.equal(r.ov, 0);
    await c.el.locator('.rate[data-r="0"]').click();
    await pWait(c.idx + 1);
  });

  await step("an outdated answer shows the indicator; the update opens beside the untouched original", async () => {
    const c = await pCur();
    assert.equal(c.id, "pv-acct-b03");
    await c.el.locator(".reveal-btn").click();
    await c.el.locator(".upd-flag").waitFor();
    assert.match(await c.el.locator(".upd-flag").textContent(), /Updated explanation available/);
    await c.el.locator(".upd-flag").click();
    const upd = c.el.locator('[data-pane="update"]');
    assert.ok(await upd.isVisible());
    assert.match(await upd.textContent(), /Written for Swipe Techs/);
    assert.match(await upd.textContent(), /right-of-use asset/);
    assert.match(await upd.textContent(), /original answer is unchanged/);
    await pP.waitForTimeout(300);
    await shot(pP, "private-3-updated");
    await c.el.locator('.atab[data-tab="orig"]').click();
    assert.match(await c.el.locator(".srctext").innerText(), /^Only long leases that work like a purchase go on the balance sheet\./);
    await c.el.locator('.rate[data-r="2"]').click();
    await pWait(c.idx + 1);
  });

  await step("the missed question comes back a few cards later, and tables render with merged cells", async () => {
    const seen = [];
    for (let i = 0; i < 4; i++) {
      const c = await pCur();
      seen.push(c.id);
      if (c.id === "pv-acct-a01") {
        await c.el.locator(".reveal-btn").click();
        await c.el.locator("table.grid").waitFor();
        assert.equal(await c.el.locator("table.grid td[colspan='3']").count(), 1);
        assert.equal(await pP.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
      } else await c.el.locator(".reveal-btn").click();
      await c.el.locator(".rates").waitFor();
      await c.el.locator('.rate[data-r="2"]').click();
      await pWait(c.idx + 1);
    }
    assert.ok(seen.includes("pv-acct-b02"), seen.join(","));
    assert.ok(seen.includes("pv-acct-a01"), seen.join(","));
  });

  await step("progress and the place in the guide survive a reload", async () => {
    const before = await pApp();
    await pP.reload(); await pReady();
    const a = await pApp();
    assert.equal(a.mode, "priv");
    assert.deepEqual(Object.keys(a.st.cards).sort(), Object.keys(before.st.cards).sort());
    assert.deepEqual(a.st.prefs.priv.cur, before.st.prefs.priv.cur);
    const next = a.slides[0].id;
    assert.ok(!["pv-acct-b01", "pv-acct-b03"].includes(next), "doesn't restart from the top: " + next);
  });

  await step("collection page: progress by section, three study paths, filters", async () => {
    await pP.locator("#ctxBtn").click();
    await pP.locator("#privSheet").waitFor();
    const tiles = await pP.locator("#privDash .tiles").textContent();
    assert.match(tiles, /Total\s*8/); assert.match(tiles, /Reviewed\s*\d/); assert.match(tiles, /Remaining\s*\d/); assert.match(tiles, /Due now/);
    assert.equal(await pP.locator("#privByCat .mrow").count(), 3);
    assert.deepEqual(await pP.locator("#privPaths .pn").allTextContents(), ["Sequential", "Shuffle", "Spaced repetition"]);
    await pP.waitForTimeout(300);
    await shot(pP, "private-4-collection");
    await pP.locator("#privCats .chip", { hasText: "EV & Equity" }).click();
    await pP.locator("#privLvls .chip", { hasText: "Basic" }).click();     // Advanced only
    assert.match(await pP.locator("#privCount").textContent(), /^1 questions?/);
    await pP.locator("#privPaths .path", { hasText: "Shuffle" }).click();
    await pP.locator("#privStart").click();
    await pP.waitForFunction(() => window.__swipe.slides.length > 0);
    const a = await pApp();
    assert.equal(a.st.prefs.priv.path, "shuffle");
    assert.deepEqual(a.slides.filter(s => s.kind === "card").map(s => s.id), ["pv-ev-a01"]);
    assert.equal(a.slides[a.slides.length - 1].kind, "end");
  });

  await step("the question source switch covers For You, Topics and Review; Both keeps similar questions apart", async () => {
    await pP.locator("#settingsBtn").click();
    await pP.locator("#privSrcChips .chip", { hasText: "Both" }).click();
    await pP.keyboard.press("Escape");
    await pP.locator('.tab[data-mode="foryou"]').click();
    await pP.waitForFunction(() => window.__swipe.mode === "foryou");
    assert.match(await pP.locator("#ctxLabel").textContent(), /For You · Swipe Techs \+ Sample/);
    await pP.locator('.tab[data-mode="topic"]').click();
    assert.ok(await pP.locator("#topicSrc").isVisible());
    assert.ok(await pP.locator("#catChips .chip", { hasText: "Brain Teasers" }).count());
    await pP.locator("#srcChips .chip", { hasText: "Sample Guide" }).click();
    assert.deepEqual(await pP.locator("#lvlChips .chip").allTextContents(), ["Basic", "Advanced"]);
    assert.match(await pP.locator("#topicCount").textContent(), /^8 questions/);
    await pP.locator("#srcChips .chip", { hasText: "Both" }).click();
    await pP.keyboard.press("Escape");
    // Bookmarks with a built-in question and its private near-duplicate: never shown back to back.
    await pP.evaluate(() => { window.__swipe.st.bookmarks = ["a1", "pv-acct-b01", "a2", "a3"]; });
    await pP.locator("#collectionsBtn").click();
    await pP.locator("#collBm").click();
    await pP.waitForFunction(() => window.__swipe.mode === "bookmarks");
    const ids = (await pApp()).slides.filter(s => s.kind === "card").map(s => s.id);
    const ia = ids.indexOf("a1"), ib = ids.indexOf("pv-acct-b01");
    if (ia > -1 && ib > -1) assert.ok(Math.abs(ia - ib) > 1, ids.join(","));
  });

  await step("Interview works on private questions: spoken answers, original answer on reveal", async () => {
    await pP.locator("#settingsBtn").click();
    await pP.locator("#privSrcChips .chip", { hasText: "Sample Guide" }).click();
    await pP.keyboard.press("Escape");
    await pP.locator('.tab[data-mode="interview"]').click();
    await pP.waitForFunction(() => window.__swipe.mode === "interview");
    const a = await pApp();
    const ids = a.slides.filter(s => s.kind === "card").map(s => s.id);
    assert.ok(ids.length && ids.every(id => id.startsWith("pv-")), ids.join(","));
    const c = await pCur();
    await c.el.locator(".reveal-btn").click();
    await c.el.locator(".orig").waitFor();
  });

  await step("Progress keeps built-in mastery separate and adds a row for the collection", async () => {
    await pP.keyboard.press("Escape");
    await pP.locator('.tab[data-mode="progress"]').click();
    await pP.locator("#progSheet").waitFor();
    assert.equal(await pP.locator("#dash .mastery .mrow").count(), 8, "built-in topics only");
    assert.match(await pP.locator("#dash .big-ring").textContent(), /0%/);
    assert.match(await pP.locator("#dash").textContent(), /Sample Guide/);
    assert.match(await pP.locator("#dash").textContent(), /of 8 reviewed/);
    await pP.keyboard.press("Escape");
  });

  await step("delete keeping progress, re-import picks up where it left off, delete with progress clears it", async () => {
    const before = await pApp();
    const mine = Object.keys(before.st.cards).filter(id => id.startsWith("pv-"));
    assert.ok(mine.length >= 3);
    await pP.locator("#settingsBtn").click();
    await pP.locator('#privBox [data-pv="delete"]').click();
    await Promise.all([pP.waitForEvent("load"), pP.locator('#privBox [data-pv="del-keep"]').click()]);
    await pReady();
    let a = await pApp();
    assert.equal(a.priv.count, 0); assert.notEqual(a.mode, "priv"); assert.equal(a.priv.src, "core");
    assert.deepEqual(Object.keys(a.st.cards).filter(id => id.startsWith("pv-")).sort(), mine.sort());
    assert.ok(a.slides.every(s => !String(s.id).startsWith("pv-")));
    await importFile();
    a = await pApp();
    assert.equal(a.priv.count, 8);
    assert.equal(a.st.cards["pv-acct-b01"].last, 2, "progress kept across delete + import");
    await pP.locator("#settingsBtn").click();
    await pP.locator('#privBox [data-pv="delete"]').click();
    await Promise.all([pP.waitForEvent("load"), pP.locator('#privBox [data-pv="del-all"]').click()]);
    await pReady();
    a = await pApp();
    assert.equal(a.priv.status, "none");
    assert.deepEqual(Object.keys(a.st.cards).filter(id => id.startsWith("pv-")), []);
    assert.ok(Object.keys(a.st.cards).length > 0, "built-in progress untouched");
    assert.equal(await pP.evaluate(() => new Promise(r => { const q = indexedDB.open("swipetechs-private"); q.onsuccess = () => { const t = q.result.transaction("collections").objectStore("collections").count(); t.onsuccess = () => r(t.result); }; })), 0);
  });
  await ctxP.close();

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
  await step("Chill on desktop: Space moves on, L opens Learn more, B saves", async () => {
    await p3.locator('.tab[data-mode="chill"]').click();
    await p3.waitForFunction(() => window.__swipe.mode === "chill");
    const i0 = await p3.evaluate(() => { document.activeElement.blur(); return window.__swipe.cur; });   // Space on the focused tab would press the tab
    await p3.keyboard.press("Space"); await p3.waitForFunction(i => window.__swipe.cur === i + 1, i0);
    const el = p3.locator(".slide").nth(i0 + 1);
    await p3.keyboard.press("l");
    assert.ok(await el.locator(".more-body").isVisible());
    await p3.keyboard.press("b");
    assert.equal(await el.locator(".bm").getAttribute("aria-pressed"), "true");
    await shot(p3, "desktop-2-chill");
  });
  await step("reduced motion: Chill cards show fully without fades", async () => {
    await p3.emulateMedia({ reducedMotion: "reduce" });
    const op = await p3.evaluate(() => { const s = window.__swipe.slides.find((x, i) => x.kind === "chill" && i !== window.__swipe.cur); return s ? getComputedStyle(s.el.querySelector(".hook")).opacity : "1"; });
    assert.equal(op, "1");
  });
  await ctx3.close();

  await browser.close(); server.close();
  if (errors.length) { console.error("Page errors:\n" + errors.join("\n")); process.exit(1); }
  console.log(`\n${passed} checks passed`);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
