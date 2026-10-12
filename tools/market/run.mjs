#!/usr/bin/env node
/* Market Feed pipeline: collect official sources -> new stories and verified updates -> write market.json.
   Runs on GitHub Actions every few hours (.github/workflows/market-feed.yml) and publishes to the market-data branch.

   node tools/market/run.mjs --prev <last market.json> --out <dir> [--seed data/market.json] [--now ISO] [--only fed,bls]
   Env: GEMINI_API_KEY (summaries), SEC_CONTACT (email for SEC's required User-Agent), GUARDIAN_API_KEY (optional).

   Safety: a story is only added when its card passes validate.mjs (figures found in the source, a verbatim quote,
   allowed status for that kind of source). If a source or the summarizer fails, nothing is invented: the previous
   stories are kept and simply keep aging. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { makeGet } from "./lib/http.mjs";
import { SOURCES, NEEDS_SEC } from "./lib/sources.mjs";
import { makeWriter } from "./lib/llm.mjs";
import { check } from "./lib/validate.mjs";
import { dollars } from "./lib/text.mjs";
import { loadConcepts, defaultConcepts } from "./lib/concepts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MK = createRequire(import.meta.url)(path.join(ROOT, "js/market.js"));
const DAY = 86400000;
const MAX_NEW = 8;          // stories written per run (keeps well inside the free summarizer limits)
const MIN_SIG = 55;         // below this a story isn't worth a card
const MIN_IPO = 200e6;      // an IPO raising less than this isn't news an IB candidate needs
const REVERIFY = DAY;       // re-check that each live story's source still resolves about once a day

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
// Offering size of an IPO card: the largest dollar figure in What happened (its figures are already checked against
// the filing). No stated total means it can't be shown to be big enough.
const offering = x => Math.max(0, ...dollars(x.what));
const hash = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 6);
const ymd = t => new Date(t).toISOString().slice(0, 10).replace(/-/g, "");

export async function run({ prev, seed, now = Date.now(), env = process.env, fetchImpl = globalThis.fetch, only = null, log = console.log, retryMs }) {
  const base = prev && Array.isArray(prev.stories) && prev.stories.length ? prev : seed || { stories: [] };
  const stories = (base.stories || []).map(x => ({ ...x, updates: [...(x.updates || [])] }));
  const seen = { ...((prev && prev.seenKeys) || {}) };
  const status = { generated: new Date(now).toISOString(), sources: {}, written: [], rejected: [], updates: [], reverified: 0, writer: env.GEMINI_API_KEY ? "gemini" : "none (fixed wording only)" };
  const concepts = loadConcepts(ROOT), conceptIds = new Set(concepts.map(c => c.id));
  const get = makeGet({ contact: env.SEC_CONTACT, fetchImpl, log, retryMs });
  const writer = makeWriter({ key: env.GEMINI_API_KEY, fetchImpl, log, concepts });

  // 1. Collect.
  const cands = [];
  for (const [name, fn] of Object.entries(SOURCES)) {
    if (only && !only.includes(name)) continue;
    if (NEEDS_SEC.has(name) && !env.SEC_CONTACT) { status.sources[name] = { ok: false, skipped: "SEC_CONTACT not set" }; continue; }
    const t0 = Date.now();
    try {
      const got = await fn({ get, now, log, env, stories });
      cands.push(...got);
      status.sources[name] = { ok: true, items: got.length, ms: Date.now() - t0 };
    } catch (e) {
      status.sources[name] = { ok: false, error: String(e.message || e).slice(0, 200), ms: Date.now() - t0 };
      log(`source ${name} failed: ${e.message}`);
    }
  }

  // 2. Verified updates to stories already in the feed.
  for (const c of cands.filter(c => c.update)) {
    const u = c.update, x = stories.find(s => s.id === u.match);
    if (!x || x.updates.some(v => v.src.url === u.src.url)) continue;
    x.updates.push({ t: u.t, text: u.text, src: u.src });
    if (u.status) x.status = u.status;
    x.verified = new Date(now).toISOString();
    status.updates.push({ id: x.id, status: u.status, src: u.src.url });
  }

  // 3. New stories, most significant first, skipping anything already covered.
  const known = new Set(stories.map(s => s.key).filter(Boolean));
  const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\b(inc|corp|corporation|co|ltd|plc|holdings?|group|company|the)\b/g, "").trim();
  const covered = c => stories.some(s => now - Date.parse(s.published) < 45 * DAY && (
    (c.thread && s.thread === c.thread && (c.thread.startsWith("cik:") || c.thread.startsWith("deal:") || c.thread.startsWith("ipo:"))) ||
    ((c.ciks || []).some(k => (s.ciks || []).includes(k)) && s.cat === "ma") ||
    ((c.parties || []).some(p => norm(p).length > 2 && (s.parties || []).some(q => norm(q) === norm(p))) && ["ma", "pe", "ipo"].includes(s.cat))));
  const fresh = cands.filter(c => !c.update && !known.has(c.key) && !seen[c.key] && !covered(c)).sort((a, b) => b.sig - a.sig);
  for (const c of fresh.slice(0, MAX_NEW)) {
    let card = null, how = "";
    if (writer) {
      const w = await writer.write(c);
      if (w) {
        w.concepts = (w.concepts || []).filter(id => conceptIds.has(id)).slice(0, 3);
        if (!w.concepts.length) w.concepts = defaultConcepts(concepts, w.cat);
        if (!w.include) { seen[c.key] = now; status.rejected.push({ key: c.key, why: "not significant: " + (w.reason || "").slice(0, 120) }); continue; }
        const errs = check(w, c, conceptIds);
        if (errs.length) { status.rejected.push({ key: c.key, why: errs.join("; ") }); continue; }   // may be retried next run
        card = w; how = w.model;
      }
    }
    if (!card && c.template) {
      // No summarizer (or it failed): only public-domain sources with fixed explanations, quoting the source itself.
      const t = c.template(c);
      if (t) {
        t.cat = c.cats[0]; t.concepts = defaultConcepts(concepts, t.cat); t.evidence = t.evidence || [t.what]; t.ctx = t.ctx || t.why;
        const errs = check(t, c, conceptIds);
        if (errs.length) { status.rejected.push({ key: c.key, why: "template: " + errs.join("; ") }); continue; }
        card = t; how = "fixed wording";
      }
    }
    if (!card) { status.rejected.push({ key: c.key, why: writer ? "summarizer unavailable" : "needs a summarizer (GEMINI_API_KEY)" }); continue; }
    if (c.needSize && offering(card) < MIN_IPO) {
      seen[c.key] = now; status.rejected.push({ key: c.key, why: `offering $${Math.round(offering(card) / 1e6)}M below $${MIN_IPO / 1e6}M` }); continue;
    }
    const size = +card.size_usd_billions || 0;
    const sig = Math.round(Math.max(1, Math.min(100, c.sig + ((card.importance || 3) - 3) * 5 + (size >= 50 ? 10 : size >= 10 ? 6 : size >= 2 ? 3 : 0))));
    if (sig < MIN_SIG) { seen[c.key] = now; status.rejected.push({ key: c.key, why: `significance ${sig} below ${MIN_SIG}` }); continue; }
    const story = {
      id: `${card.cat}-${ymd(c.event || c.published)}-${hash(c.key)}`, key: c.key, cat: card.cat, status: card.status, sig,
      hook: card.hook, what: card.what, why: card.why, ib: card.ib, chain: card.chain, ctx: card.ctx,
      concepts: card.concepts, src: c.src, published: c.published, event: c.event || null, verified: new Date(now).toISOString(),
      thread: c.thread || null, origin: "auto", writer: how, updates: [],
    };
    if (card.uncertain) story.uncertain = card.uncertain;
    if (card.evergreen) { story.evergreen = true; if (card.hist) story.hist = card.hist; }
    if ((c.ciks || []).length) story.ciks = c.ciks;
    const parties = (card.parties && card.parties.length ? card.parties : c.parties) || [];
    if (parties.length) story.parties = parties.slice(0, 4);
    stories.push(story); known.add(c.key); seen[c.key] = now;
    status.written.push({ id: story.id, sig, how, hook: story.hook });
  }

  // 4. Re-check that live stories' sources still resolve (last verified timestamp), a few per run.
  const due = stories.filter(x => MK.stage(x, now) && now - Date.parse(x.verified || 0) > REVERIFY && (!/sec\.gov/.test(x.src.url) || env.SEC_CONTACT)).slice(0, 10);
  for (const x of due) {
    try { await get(x.src.url, { timeout: 15000 }); x.verified = new Date(now).toISOString(); delete x.broken; status.reverified++; }
    catch (e) { if (e.status === 404 || e.status === 410) x.broken = new Date(now).toISOString(); }
  }

  // 5. Archive: drop stories well past their window (evergreen ones stay for a year), small IPOs, and old rejection memory.
  const keep = stories.filter(x => {
    if (x.origin === "auto" && x.cat === "ipo" && offering(x) < MIN_IPO) return false;   // published before the size rule
    const age = now - Date.parse(x.published), p = MK.PROFILES[x.cat] || MK.PROFILES.default;
    return x.evergreen ? age < 400 * DAY : age < (p[3] + 30) * DAY;
  });
  for (const k of Object.keys(seen)) if (now - seen[k] > 14 * DAY) delete seen[k];
  keep.sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  status.live = keep.filter(x => MK.stage(x, now)).length;
  status.total = keep.length;
  return { data: { v: 1, generated: new Date(now).toISOString(), stories: keep, seenKeys: seen }, status };
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = arg("out", "market-out");
  const prev = readJSON(arg("prev", "")), seed = readJSON(arg("seed", path.join(ROOT, "data/market.json")));
  const now = arg("now") ? Date.parse(arg("now")) : Date.now();
  const only = arg("only") ? arg("only").split(",") : null;
  const { data, status } = await run({ prev, seed, now, only });
  // Nothing changed: keep the old timestamp so the file (and the data branch) stays the same.
  if (prev && prev.generated && JSON.stringify(prev.stories) === JSON.stringify(data.stories)) data.generated = prev.generated;
  // Never publish a file the app would reject.
  const ok = MK.clean(data).length === data.stories.length;
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "status.json"), JSON.stringify({ ...status, valid: ok }, null, 1));
  if (!ok) { console.error("Refusing to publish: some stories failed the app's own checks."); process.exit(1); }
  fs.writeFileSync(path.join(out, "market.json"), JSON.stringify(data, null, 1));
  console.log(`stories: ${data.stories.length} (${status.live} live); new: ${status.written.length}; updates: ${status.updates.length}; rejected: ${status.rejected.length}`);
  console.log(JSON.stringify(status.sources));
}
