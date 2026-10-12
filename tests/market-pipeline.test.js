// Market Feed pipeline (tools/market) against recorded-style responses: no network, no API key.
// Run: node --test tests/market-pipeline.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const NOW = Date.parse("2026-10-12T12:00:00Z");
const load = () => Promise.all([import("../tools/market/run.mjs"), import("../tools/market/lib/text.mjs"), import("../tools/market/lib/validate.mjs")]);

// ---------- fake web ----------
const FED_RSS = `<?xml version="1.0"?><rss><channel>
<item><title>Federal Reserve issues FOMC statement</title><link>https://www.federalreserve.gov/newsevents/pressreleases/monetary20261011a.htm</link><pubDate>Sun, 11 Oct 2026 18:00:00 GMT</pubDate></item>
<item><title>Federal Reserve Board announces approval of application</title><link>https://www.federalreserve.gov/x.htm</link><pubDate>Sun, 11 Oct 2026 17:00:00 GMT</pubDate></item>
</channel></rss>`;
const FED_PAGE = `<html><body><nav>menu</nav><p>For release at 2:00 p.m. EDT</p><p>Inflation remains elevated. The Committee decided to lower the target range for the federal funds rate by 1/4 percentage point to 3-1/2 to 3-3/4 percent, in support of the Federal Reserve's dual mandate.</p></body></html>`;
const BLS_RSS = `<rss><channel><item><title>Consumer Price Index - September 2026</title><link>https://www.bls.gov/news.release/cpi.nr0.htm</link><pubDate>Wed, 11 Oct 2026 12:30:00 GMT</pubDate></item></channel></rss>`;
const BLS_PAGE = `<p>The Consumer Price Index for All Urban Consumers (CPI-U) increased 0.3 percent on a seasonally adjusted basis in September, the U.S. Bureau of Labor Statistics reported today.</p>`;
const UST = ["Date,1 Mo,2 Yr,10 Yr,30 Yr", "10/09/2026,4.20,4.80,5.24,5.60", "10/08/2026,4.20,4.75,5.05,5.50", "10/07/2026,4.20,4.77,5.08,5.67", "10/06/2026,4.20,4.79,5.07,5.64", "10/05/2026,4.20,4.84,5.06,5.66", "10/02/2026,4.20,4.83,5.04,5.63"].join("\n");
const EFTS = { hits: { hits: [{ _id: "0000000001-26-000001:ex99-1.htm", _source: { adsh: "0000000001-26-000001", ciks: ["0000001111"], display_names: ["Target Co  (TGT) (CIK 0000001111)"], file_date: "2026-10-11", items: ["1.01", "9.01"] } }] } };
const DEAL_PR = `<p>Buyer Inc. and Target Co. today announced a definitive agreement under which Buyer will acquire Target for $40.00 per share in cash, or approximately $8.5 billion, pursuant to an Agreement and Plan of Merger. The transaction is expected to close in the first half of 2027, subject to regulatory approvals and Target shareholder approval.</p>`;
const GEMINI_GOOD = {
  include: true, reason: "large deal", cat: "ma", status: "announced", importance: 4,
  hook: "Buyer Inc agrees to buy Target Co for $8.5 billion",
  what: "Buyer will acquire Target for $40.00 per share in cash, about $8.5 billion.",
  uncertain: "Needs regulatory and shareholder approval; expected in the first half of 2027.",
  why: "Paying cash means Buyer takes on the financing risk, and Target holders get certainty.",
  ib: "A cash deal funded with debt is accretive if Target's earnings yield beats the after-tax cost of debt.",
  chain: ["Cash offer", "Debt financing", "Accretion/dilution"], ctx: "Cash deals put the financing burden on the buyer.",
  evergreen: false, hist: "", concepts: ["xm7", "zz9"], parties: ["Buyer Inc.", "Target Co."],
  evidence: ["Buyer will acquire Target for $40.00 per share in cash, or approximately $8.5 billion"], size_usd_billions: 8.5,
};

function fakeFetch({ gemini, completion, failAll, contact } = {}) {
  const calls = [];
  const json = (o, status = 200) => ({ ok: status < 400, status, json: async () => o, text: async () => JSON.stringify(o) });
  const text = (t, status = 200) => ({ ok: status < 400, status, text: async () => t, json: async () => JSON.parse(t) });
  const fn = async (url, opts = {}) => {
    calls.push({ url, opts });
    if (failAll) throw new Error("network down");
    if (/generativelanguage/.test(url)) return gemini ? json({ candidates: [{ content: { parts: [{ text: JSON.stringify(gemini(JSON.parse(opts.body))) }] } }] }) : json({}, 500);
    if (/press_monetary\.xml/.test(url)) return text(FED_RSS);
    if (/monetary20261011a/.test(url)) return text(FED_PAGE);
    if (/bls_latest\.rss/.test(url)) return text(BLS_RSS);
    if (/cpi\.nr0/.test(url)) return text(BLS_PAGE);
    if (/daily-treasury-rates\.csv/.test(url)) return text(UST);
    if (/efts\.sec\.gov.*8-K/.test(url)) return json(EFTS);
    if (/efts\.sec\.gov/.test(url)) return json({ hits: { hits: [] } });
    if (/EntityPublicFloat/.test(url)) return json({ units: { USD: [{ val: 6e9 }] } });
    if (/000000000126000001\/index\.json/.test(url)) return json({ directory: { item: [{ name: "form8-k.htm" }, { name: "ex99-1.htm" }] } });
    if (/ex99-1\.htm/.test(url)) return text(DEAL_PR);
    if (/company_tickers\.json/.test(url)) return json({});
    if (/data\.sec\.gov\/submissions\/CIK0000001111/.test(url)) return json({ name: "Target Co", filings: { recent: completion ? { form: ["8-K"], items: ["2.01,3.01"], filingDate: ["2026-10-12"], acceptanceDateTime: ["2026-10-12T10:00:00.000Z"], accessionNumber: ["0000000001-26-000099"], primaryDocument: ["close.htm"] } : { form: [], items: [], filingDate: [], acceptanceDateTime: [], accessionNumber: [], primaryDocument: [] } } });
    if (/close\.htm/.test(url)) return text(completion === "unrelated" ? "<p>Target Co completed its purchase of a warehouse from Acme.</p>" : "<p>Target Co completed its merger with Buyer Inc. today.</p>");
    if (/ecb\.europa\.eu|bankofengland|globenewswire|guardianapis/.test(url)) return text("<rss></rss>");
    return text("not found", 404);
  };
  fn.calls = calls;
  return fn;
}
const quiet = () => {};

// ---------- helpers ----------
test("feeds, numbers and quotes parse the way the checks rely on", async () => {
  const [, T] = await load();
  const items = T.feedItems(FED_RSS);
  assert.equal(items.length, 2);
  assert.equal(items[0].url, "https://www.federalreserve.gov/newsevents/pressreleases/monetary20261011a.htm");
  assert.equal(items[0].published, "2026-10-11T18:00:00.000Z");
  const atom = T.feedItems(`<feed><entry><title>8-K - Acme</title><link href="https://www.sec.gov/a"/><updated>2026-10-11T10:00:00-04:00</updated><summary>Item 1.01</summary></entry></feed>`);
  assert.equal(atom[0].url, "https://www.sec.gov/a");
  assert.deepEqual(T.numbers("$8.5 billion, 3-1/2 to 3-3/4 percent, 1/4 point, 1,250 shares"), [8.5, 3.5, 3.75, 0.25, 1250]);
  assert.deepEqual(T.unsupported("30 million shares at $18.00, $8.5 billion", "30,000,000 shares at $18.00 per share; $8,500 million"), []);
  assert.deepEqual(T.unsupported("up 45 basis points to 5.24%", "yield 5.24"), [45]);
  assert.ok(T.quoted("the  committee decided to LOWER", "The Committee decided to lower the target"));
  assert.ok(!T.quoted("decided to raise", "The Committee decided to lower the target"));
});

test("validation: invented figures, missing quotes, wrong status and clickbait are all rejected", async () => {
  const [, , V] = await load();
  const cand = { cats: ["ma", "pe"], statuses: ["announced", "pending"], title: "8-K", text: DEAL_PR };
  const ids = new Set(["xm7"]);
  const good = { ...GEMINI_GOOD, concepts: ["xm7"] };
  assert.deepEqual(V.check(good, cand, ids), []);
  assert.match(V.check({ ...good, what: "Buyer will pay $42.00 per share, about $8.5 billion." }, cand, ids).join(), /figures not in the source: 42/);
  assert.match(V.check({ ...good, why: "Shares of Target jumped 25% on the news." }, cand, ids).join(), /why: figures not in the source: 25/);
  assert.match(V.check({ ...good, evidence: ["Buyer will pay a lot"] }, cand, ids).join(), /no evidence quote/);
  assert.match(V.check({ ...good, status: "completed" }, cand, ids).join(), /status completed not allowed/);
  assert.match(V.check({ ...good, status: "rumor" }, cand, ids).join(), /status rumor not allowed/);
  assert.match(V.check({ ...good, hook: "Huge deal shakes Wall Street!" }, cand, ids).join(), /clickbait/);
  assert.match(V.check({ ...good, what: "word ".repeat(31) }, cand, ids).join(), /what: 31 words/);
});

// ---------- the whole run ----------
test("no summarizer key: public-domain sources still publish with fixed wording; others wait", async () => {
  const [{ run }] = await load();
  const fetchImpl = fakeFetch();
  const { data, status } = await run({ prev: { stories: [] }, now: NOW, env: {}, fetchImpl, log: quiet, retryMs: 0 });
  const byKey = Object.fromEntries(data.stories.map(x => [x.key.split(":")[0], x]));
  // Fed: the Fed's own sentence, the right direction, a decision.
  assert.equal(byKey.fed.hook, "The Fed cuts interest rates");
  assert.match(byKey.fed.what, /^The Committee decided to lower the target range/);
  assert.equal(byKey.fed.status, "decision");
  assert.equal(byKey.fed.writer, "fixed wording");
  // Treasury: computed from the table, 19 basis points in a day.
  assert.match(byKey.ust10.hook, /jumps 19 basis points in a day/);
  assert.match(byKey.ust10.what, /5\.24%/);
  // BLS: verbatim first finding.
  assert.match(byKey.bls.what, /increased 0\.3 percent/);
  // SEC sources need a contact, and nothing was written without a summarizer.
  assert.equal(status.sources.edgarDeals.skipped, "SEC_CONTACT not set");
  assert.ok(data.stories.every(x => x.src.url.startsWith("https://") && x.concepts.length && x.verified));
  // No request went to the summarizer.
  assert.ok(!fetchImpl.calls.some(c => /generativelanguage/.test(c.url)));
});

test("with a summarizer: a grounded card is published; invented numbers and non-news are not", async () => {
  const [{ run }] = await load();
  const env = { GEMINI_API_KEY: "test", SEC_CONTACT: "test@example.com" };
  // Grounded: published, unknown concept ids dropped, size bonus applied, the SEC contact sent in the User-Agent.
  let fetchImpl = fakeFetch({ gemini: () => GEMINI_GOOD });
  let { data, status } = await run({ prev: { stories: [] }, now: NOW, env, fetchImpl, log: quiet, retryMs: 0, only: ["edgarDeals"] });
  assert.equal(data.stories.length, 1);
  const x = data.stories[0];
  assert.equal(x.status, "announced");
  assert.deepEqual(x.concepts, ["xm7"]);
  assert.equal(x.uncertain, GEMINI_GOOD.uncertain);
  assert.deepEqual(x.ciks, [1111]);
  assert.ok(x.sig >= 70, "a $8.5B deal ranks high");
  assert.ok(fetchImpl.calls.filter(c => /sec\.gov/.test(c.url)).every(c => /test@example\.com/.test(c.opts.headers["User-Agent"])));
  const sent = JSON.parse(fetchImpl.calls.find(c => /generativelanguage/.test(c.url)).opts.body).contents[0].parts[0].text;
  assert.match(sent, /Only the SOURCE|ONLY the SOURCE/);
  assert.ok(!/test@example/.test(sent) && !/"test"/.test(fetchImpl.calls.find(c => /generativelanguage/.test(c.url)).url), "key goes in a header, not the URL");
  // Same filing next run: not written twice.
  const again = await run({ prev: data, now: NOW + 3600000, env, fetchImpl: fakeFetch({ gemini: () => GEMINI_GOOD }), log: quiet, retryMs: 0, only: ["edgarDeals"] });
  assert.equal(again.data.stories.length, 1);
  assert.equal(again.status.written.length, 0);

  // Invented figure: rejected with the reason, nothing published.
  ({ data, status } = await run({ prev: { stories: [] }, now: NOW, env, fetchImpl: fakeFetch({ gemini: () => ({ ...GEMINI_GOOD, what: "Buyer will pay $44 per share, a 30% premium." }) }), log: quiet, retryMs: 0, only: ["edgarDeals"] }));
  assert.equal(data.stories.length, 0);
  assert.match(status.rejected[0].why, /figures not in the source/);
  // Model says it isn't significant: skipped and remembered so it isn't asked again.
  ({ data, status } = await run({ prev: { stories: [] }, now: NOW, env, fetchImpl: fakeFetch({ gemini: () => ({ ...GEMINI_GOOD, include: false, reason: "internal reorganization" }) }), log: quiet, retryMs: 0, only: ["edgarDeals"] }));
  assert.equal(data.stories.length, 0);
  assert.ok(data.seenKeys["sec:0000000001-26-000001"]);
});

test("deal updates come only from filings that name the other party", async () => {
  const [{ run }] = await load();
  const env = { GEMINI_API_KEY: "test", SEC_CONTACT: "test@example.com" };
  const first = await run({ prev: { stories: [] }, now: NOW - 5 * 86400000, env, fetchImpl: fakeFetch({ gemini: () => GEMINI_GOOD }), log: quiet, retryMs: 0, only: ["edgarDeals"] });
  assert.equal(first.data.stories.length, 1);
  const done = await run({ prev: first.data, now: NOW, env, fetchImpl: fakeFetch({ completion: "merger" }), log: quiet, retryMs: 0, only: ["edgarDealUpdates"] });
  const x = done.data.stories[0];
  assert.equal(x.status, "completed");
  assert.equal(x.updates.length, 1);
  assert.match(x.updates[0].text, /SEC filing that the deal has closed/);
  assert.match(x.updates[0].src.url, /close\.htm$/);
  const other = await run({ prev: first.data, now: NOW, env, fetchImpl: fakeFetch({ completion: "unrelated" }), log: quiet, retryMs: 0, only: ["edgarDealUpdates"] });
  assert.equal(other.data.stories[0].status, "announced");
  assert.equal(other.data.stories[0].updates.length, 0);
});

test("when every source is down nothing is invented: stories are kept and keep aging", async () => {
  const [{ run }] = await load();
  const seed = require("../data/market.json");
  const { data, status } = await run({ prev: null, seed, now: NOW, env: { GEMINI_API_KEY: "k", SEC_CONTACT: "a@b.c" }, fetchImpl: fakeFetch({ failAll: true }), log: quiet, retryMs: 0 });
  assert.equal(data.stories.length, seed.stories.length);
  assert.equal(status.written.length, 0);
  for (const k of ["fed", "bls", "treasury", "edgarDeals", "ecb"]) assert.equal(status.sources[k].ok, false, k);
  for (const x of data.stories) {
    const y = seed.stories.find(s => s.id === x.id);
    assert.deepEqual({ ...x, verified: null }, { ...y, verified: null }, "content unchanged");
  }
});

test("archive: stories past their window drop out; evergreen ones stay for a year", async () => {
  const [{ run }] = await load();
  const base = { cat: "equity", status: "report", sig: 60, hook: "h", what: "w", why: "y", ib: "i", src: { name: "S", url: "https://e.com" }, verified: "2026-01-01T00:00:00Z", updates: [] };
  const prev = { stories: [
    { ...base, id: "old", published: "2026-07-01T00:00:00Z" },
    { ...base, id: "keep", cat: "fed", evergreen: true, published: "2026-03-01T00:00:00Z" },
    { ...base, id: "new", published: "2026-10-11T00:00:00Z" },
  ] };
  const { data } = await run({ prev, now: NOW, env: {}, fetchImpl: fakeFetch({ failAll: true }), log: quiet, retryMs: 0 });
  assert.deepEqual(data.stories.map(x => x.id).sort(), ["keep", "new"]);
});
