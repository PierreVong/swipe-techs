/* Where stories come from. Every source here allows automated access (checked 2026-10-12; see README):
   Federal Reserve, BLS and Treasury (US public domain), SEC EDGAR (public; needs a contact in the User-Agent),
   ECB and Bank of England (reuse with credit; we keep only title, link, date and our own summary),
   GlobeNewswire press releases (feeds allowed by robots.txt; we link, never copy), and optionally the Guardian
   Open Platform (free key, non-commercial use).

   A source returns candidates: {key, thread, cats, statuses, src:{name,url}, published, event, title, text,
   sig, parties, ciks, template?, trusted?} or updates to stories already published: {update:{match, status, text, src, t}}.
   `text` is only used to write and check the summary; it is never published. */
import { feedItems, htmlText, csvRows, squash, sentences } from "./text.mjs";

const DAY = 86400000;
const iso = t => new Date(t).toISOString();
const ymd = t => iso(t).slice(0, 10);
const recent = (it, now, days) => it.published && now - Date.parse(it.published) < days * DAY && Date.parse(it.published) <= now + 3600000;
const clip = (s, n = 14000) => String(s || "").slice(0, n);
const cap = (s, n = 28) => { const w = s.split(/\s+/); return w.length <= n ? s : w.slice(0, n).join(" ").replace(/[,;:]$/, "") + "…"; };

// ---------- Federal Reserve ----------
export async function fed({ get, now }) {
  const xml = await get("https://www.federalreserve.gov/feeds/press_monetary.xml");
  const out = [];
  for (const it of feedItems(xml).filter(x => recent(x, now, 3))) {
    const t = it.title.toLowerCase();
    const statement = /fomc statement/.test(t), minutes = /minutes of the federal open market committee/.test(t);
    if (!statement && !minutes) continue;
    const text = htmlText(await get(it.url)).replace(/^[\s\S]*?(For release at|For immediate release)/i, "$1");
    out.push({
      key: "fed:" + it.url, thread: statement ? "fomc" : "fomc-minutes", cats: ["fed"], statuses: [statement ? "decision" : "report"],
      src: { name: "Federal Reserve", url: it.url }, published: it.published, title: it.title, text: clip(text),
      sig: statement ? 95 : 70, pd: true, template: statement ? fedTemplate : null,
    });
  }
  return out;
}
// Without a summarizer: the Fed's own sentence about the target range (public domain), with fixed explanations.
function fedTemplate(c) {
  const sent = sentences(c.text).find(x => /target range for the federal funds rate/i.test(x));
  if (!sent) return null;
  const s = sent.trim().replace(/\s+/g, " ").replace(/,\s*in support of[^.]*\./i, ".");
  const act = /\b(lower|reduce|cut)\b/i.test(s) ? "cut" : /\b(raise|increase)\b/i.test(s) ? "raise" : /\bmaintain\b/i.test(s) ? "hold" : null;
  if (!act) return null;
  return {
    hook: act === "cut" ? "The Fed cuts interest rates" : act === "raise" ? "The Fed raises interest rates" : "The Fed holds interest rates steady",
    what: cap(s),
    why: act === "hold" ? "Borrowing costs stay where they are for now, so markets focus on what the Fed signals for its next meetings."
      : act === "cut" ? "Cheaper short-term borrowing tends to pull other rates down and supports stock and bond prices."
        : "Costlier borrowing tends to push other rates up and weigh on stock and bond prices.",
    ib: "Policy rates feed the risk-free rate and cost of debt, moving WACC, DCF values and LBO debt capacity.",
    chain: ["Fed policy rate", "Cost of debt", "WACC", "Valuation"], evergreen: act !== "hold", status: "decision", evidence: [sent],
  };
}

// ---------- BLS: inflation and jobs ----------
const BLS = [[/consumer price index/i, 80, "Consumer prices"], [/employment situation/i, 80, "Jobs report"], [/producer price index/i, 60, "Producer prices"], [/job openings/i, 58, "Job openings"]];
export async function bls({ get, now }) {
  const xml = await get("https://www.bls.gov/feed/bls_latest.rss");
  const out = [];
  for (const it of feedItems(xml).filter(x => recent(x, now, 3))) {
    const hit = BLS.find(([re]) => re.test(it.title));
    if (!hit) continue;
    const text = htmlText(await get(it.url));
    out.push({
      key: "bls:" + it.url, thread: "bls:" + hit[2], cats: ["macro"], statuses: ["data"], src: { name: "U.S. Bureau of Labor Statistics", url: it.url },
      published: it.published, title: it.title, text: clip(text), sig: hit[1], pd: true, template: c => blsTemplate(c, hit[2]),
    });
  }
  return out;
}
function blsTemplate(c, what) {
  const all = sentences(c.text);
  const sent = all.find(x => /\b(increased|decreased|rose|fell|was unchanged|changed little|edged)\b.*percent/i.test(x)) || all.find(x => /nonfarm payroll employment/i.test(x));
  if (!sent) return null;
  const s = sent.trim().replace(/\s+/g, " ").replace(/,\s*the U\.S\. Bureau of Labor Statistics reported today\./i, ".");
  const prices = /price/i.test(what);
  return {
    hook: prices ? `New ${what === "Consumer prices" ? "inflation" : "producer price"} numbers are out` : `The latest ${what.toLowerCase()} is out`,
    what: cap(s),
    why: prices ? "Inflation decides how far and how fast the Fed can move rates, which sets the cost of money for everyone."
      : "The job market tells the Fed whether the economy needs support or cooling, which drives where rates go next.",
    ib: "Rate expectations feed the risk-free rate in WACC and the cost of LBO debt, so this moves valuations.",
    chain: [prices ? "Inflation" : "Jobs", "Fed rate path", "Discount rates", "Valuation"], status: "data", evidence: [sent],
  };
}

// ---------- Treasury yields ----------
export async function treasury({ get, now }) {
  const y = new Date(now).getUTCFullYear();
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${y}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${y}&page&_format=csv`;
  const rows = csvRows(await get(url));
  const head = rows[0] || [], i10 = head.indexOf("10 Yr"), i2 = head.indexOf("2 Yr");
  const data = rows.slice(1).map(r => ({ d: r[0], t: Date.parse(r[0]), y10: parseFloat(r[i10]), y2: parseFloat(r[i2]) }))
    .filter(r => !isNaN(r.t) && !isNaN(r.y10)).sort((a, b) => b.t - a.t);
  if (data.length < 6 || i10 < 0) return [];
  const [a, b] = data, d1 = Math.round((a.y10 - b.y10) * 100), d5 = Math.round((a.y10 - data[5].y10) * 100);
  if (now - a.t > 4 * DAY || (Math.abs(d1) < 12 && Math.abs(d5) < 30)) return [];
  const big = Math.abs(d1) >= 12 ? d1 : d5, span = Math.abs(d1) >= 12 ? "in a day" : "in a week";
  const up = big > 0, date = new Date(a.t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const page = "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=" + ymd(a.t).slice(0, 7).replace("-", "");
  return [{
    key: "ust10:" + ymd(a.t), thread: "ust10", cats: ["credit"], statuses: ["data"], src: { name: "U.S. Department of the Treasury", url: page },
    published: iso(a.t + 22 * 3600000), event: iso(a.t), title: "Treasury par yield curve", text: rows.slice(0, 7).map(r => r.join(",")).join("\n"),
    sig: Math.min(85, 58 + Math.abs(big) / 2), pd: true, trusted: true,
    template: () => ({
      hook: `The 10-year Treasury yield ${up ? "jumps" : "drops"} ${Math.abs(big)} basis points ${span}`,
      what: `The 10-year yield ${up ? "rose" : "fell"} to ${a.y10.toFixed(2)}% on ${date}, ${up ? "up" : "down"} ${Math.abs(big)} basis points ${span}. The 2-year ended at ${a.y2.toFixed(2)}%.`,
      why: up ? "Higher long-term yields raise borrowing costs for companies and homebuyers and make future cash flows worth less today."
        : "Lower long-term yields make borrowing cheaper and make future cash flows worth more today.",
      ib: "The 10-year is the usual risk-free rate in a DCF, so it moves the cost of equity, WACC and borrowing costs.",
      chain: ["10-year yield", "Risk-free rate", "WACC", "DCF value"], status: "data",
    }),
  }];
}

// ---------- SEC EDGAR ----------
const edgarUrl = (cik, acc, file) => `https://www.sec.gov/Archives/edgar/data/${+cik}/${acc.replace(/-/g, "")}/${file || ""}`;
const pad = cik => String(+cik).padStart(10, "0");

// Public float from the company's last annual report: a free, official proxy for company size.
async function float(get, cik) {
  try {
    const j = await get(`https://data.sec.gov/api/xbrl/companyconcept/CIK${pad(cik)}/dei/EntityPublicFloat.json`, { type: "json" });
    const vals = (j.units && j.units.USD) || [];
    return vals.length ? vals[vals.length - 1].val : 0;
  } catch (e) { return 0; }
}
// The press release attached to a filing (EX-99.1), else the filing itself.
async function filingText(get, cik, acc, primary) {
  let files = [];
  try { files = ((await get(edgarUrl(cik, acc, "index.json"), { type: "json" })).directory.item || []).map(x => x.name); } catch (e) { /* fall through */ }
  const pr = files.find(f => /ex-?99(\.|_|-)?0?1|dex991|ex991/i.test(f) && /\.htm/i.test(f));
  const file = pr || primary || files.find(f => /\.htm/i.test(f) && !/index/i.test(f));
  if (!file) return { text: "", url: edgarUrl(cik, acc) };
  return { text: htmlText(await get(edgarUrl(cik, acc, file))), url: edgarUrl(cik, acc, file) };
}
const names = src => (src.display_names || []).map(n => n.replace(/\s*\(CIK.*$/i, "").replace(/\s*\([A-Z.\-, ]+\)\s*$/, "").trim());

// New merger agreements (8-K item 1.01 with "Agreement and Plan of Merger"), sized by the companies' public float.
export async function edgarDeals({ get, now, log }) {
  const q = encodeURIComponent('"Agreement and Plan of Merger"');
  const j = await get(`https://efts.sec.gov/LATEST/search-index?q=${q}&forms=8-K&dateRange=custom&startdt=${ymd(now - 3 * DAY)}&enddt=${ymd(now)}`, { type: "json" });
  const hits = (j.hits && j.hits.hits) || [];
  const byAcc = new Map();
  for (const h of hits) {
    const s = h._source || {}, acc = (s.adsh || String(h._id).split(":")[0]);
    if (!(s.items || []).includes("1.01") || byAcc.has(acc)) continue;
    byAcc.set(acc, s);
  }
  const out = [];
  for (const [acc, s] of [...byAcc].slice(0, 25)) {
    const cik = (s.ciks || [])[0];
    if (!cik) continue;
    const size = await float(get, cik);
    if (size < 1e9) continue;                                   // small companies: not IB headline news
    const { text, url } = await filingText(get, cik, acc);
    if (!/merger/i.test(text)) continue;
    out.push({
      key: "sec:" + acc, thread: "cik:" + +cik, cats: ["ma", "pe"], statuses: ["announced", "pending"],
      src: { name: `SEC filing (${names(s)[0] || "8-K"})`, url }, published: iso(Date.parse(s.file_date) + 21 * 3600000), title: `8-K: ${names(s).join(", ")}`,
      text: clip(text), sig: size >= 50e9 ? 90 : size >= 10e9 ? 80 : size >= 2e9 ? 70 : 62, ciks: (s.ciks || []).map(c => +c), parties: names(s),
    });
    log(`edgar deal ${acc} ${names(s)[0]} float ${Math.round(size / 1e6)}M`);
  }
  return out;
}

// IPO pricings: final prospectuses (424B4). Size and whether it is an IPO come from the summary step.
export async function edgarIpos({ get, now }) {
  const j = await get(`https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent('"initial public offering"')}&forms=424B4&dateRange=custom&startdt=${ymd(now - 3 * DAY)}&enddt=${ymd(now)}`, { type: "json" });
  const seen = new Set(), out = [];
  for (const h of ((j.hits && j.hits.hits) || []).slice(0, 15)) {
    const s = h._source || {}, acc = s.adsh || String(h._id).split(":")[0], file = String(h._id).split(":")[1];
    const cik = (s.ciks || [])[0];
    if (!cik || seen.has(acc)) continue;
    seen.add(acc);
    const url = edgarUrl(cik, acc, file);
    const text = htmlText(await get(url)).slice(0, 9000);       // the cover page has the price, share count and size
    out.push({
      key: "sec:" + acc, thread: "ipo:" + +cik, cats: ["ipo"], statuses: ["priced"], src: { name: `SEC filing (${names(s)[0] || "424B4"})`, url },
      published: iso(Date.parse(s.file_date) + 21 * 3600000), title: `424B4: ${names(s)[0]}`, text, sig: 62, ciks: [+cik], parties: names(s), needSize: true,
    });
  }
  return out;
}

// Earnings releases (8-K item 2.02) from the largest companies and banks.
export const EARNINGS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "BRK-B", "AVGO", "JPM", "BAC", "WFC", "C", "GS", "MS", "BLK", "KKR", "BX", "APO", "V", "MA", "UNH", "XOM", "WMT", "NFLX", "ORCL", "LLY", "JNJ", "PG", "COST"];
const BANKS = new Set(["JPM", "BAC", "WFC", "C", "GS", "MS", "BLK", "KKR", "BX", "APO"]);
export async function edgarEarnings({ get, now }) {
  const map = await get("https://www.sec.gov/files/company_tickers.json", { type: "json" });
  const cikOf = {};
  Object.values(map).forEach(x => { cikOf[x.ticker] = x.cik_str; });
  const out = [];
  for (const tk of EARNINGS) {
    const cik = cikOf[tk];
    if (!cik) continue;
    const sub = await get(`https://data.sec.gov/submissions/CIK${pad(cik)}.json`, { type: "json" });
    const r = sub.filings && sub.filings.recent;
    if (!r) continue;
    for (let i = 0; i < Math.min(r.form.length, 15); i++) {
      if (r.form[i] !== "8-K" || !String(r.items[i] || "").split(",").includes("2.02")) continue;
      if (now - Date.parse(r.filingDate[i]) > 2 * DAY) break;
      const { text, url } = await filingText(get, cik, r.accessionNumber[i], r.primaryDocument[i]);
      out.push({
        key: "sec:" + r.accessionNumber[i], thread: "earn:" + tk, cats: ["earnings"], statuses: ["report"], src: { name: `${sub.name} (SEC filing)`, url },
        published: iso(Date.parse(r.acceptanceDateTime[i] || r.filingDate[i])), title: `${sub.name} results`, text: clip(text, 10000),
        sig: BANKS.has(tk) ? 72 : 66, ciks: [+cik], parties: [sub.name],
      });
      break;
    }
  }
  return out;
}

/* Updates to deals already in the feed: a later 8-K from one of the companies reporting the deal closed (item 2.01)
   or the agreement ended (item 1.02). Only counted when the filing names the other company, so an unrelated
   acquisition or a terminated credit line never updates the wrong story. Wording is fixed: the filing is the fact. */
export async function edgarDealUpdates({ get, now, stories }) {
  const out = [];
  const live = stories.filter(x => (x.cat === "ma" || x.cat === "pe") && (x.ciks || []).length && !["completed", "terminated"].includes(x.status) && now - Date.parse(x.published) < 400 * DAY);
  for (const x of live.slice(0, 12)) {
    for (const cik of x.ciks.slice(0, 2)) {
      const sub = await get(`https://data.sec.gov/submissions/CIK${pad(cik)}.json`, { type: "json" });
      const r = sub.filings && sub.filings.recent;
      if (!r) continue;
      for (let i = 0; i < Math.min(r.form.length, 20); i++) {
        if (Date.parse(r.filingDate[i]) <= Date.parse(x.published)) break;
        if (r.form[i] !== "8-K") continue;
        const items = String(r.items[i] || "").split(",");
        const done = items.includes("2.01"), ended = items.includes("1.02");
        if (!done && !ended) continue;
        const url = edgarUrl(cik, r.accessionNumber[i], r.primaryDocument[i]);
        if ((x.updates || []).some(u => u.src.url === url)) continue;
        const text = squash(htmlText(await get(url)));
        const others = (x.parties || []).filter(p => squash(p) !== squash(sub.name)).map(p => squash(p).split(" ").slice(0, 2).join(" "));
        if (!others.some(p => p.length > 3 && text.includes(p)) || (ended && !/merger/.test(text))) continue;
        out.push({ update: { match: x.id, status: done ? "completed" : "terminated", t: iso(Date.parse(r.acceptanceDateTime[i] || r.filingDate[i])),
          text: done ? `${sub.name} reported in an SEC filing that the deal has closed.` : `${sub.name} reported in an SEC filing that the merger agreement was terminated.`,
          src: { name: `SEC filing (${sub.name})`, url } } });
        break;
      }
    }
  }
  return out;
}

// ---------- Central banks abroad ----------
export async function ecb({ get, now }) {
  const out = [];
  for (const it of feedItems(await get("https://www.ecb.europa.eu/rss/press.html")).filter(x => recent(x, now, 3))) {
    if (!/monetary policy decisions/i.test(it.title) || !/\/press\/pr\//.test(it.url)) continue;
    out.push({ key: "ecb:" + it.url, thread: "ecb", cats: ["intl"], statuses: ["decision"], src: { name: "European Central Bank", url: it.url },
      published: it.published, title: it.title, text: clip(htmlText(await get(it.url))), sig: 72 });
  }
  return out;
}
export async function boe({ get, now }) {
  const out = [];
  for (const it of feedItems(await get("https://www.bankofengland.co.uk/rss/news")).filter(x => recent(x, now, 3))) {
    if (!/bank rate/i.test(it.title)) continue;
    out.push({ key: "boe:" + it.url, thread: "boe", cats: ["intl"], statuses: ["decision"], src: { name: "Bank of England", url: it.url },
      published: it.published, title: it.title, text: clip(htmlText(await get(it.url))), sig: 68 });
  }
  return out;
}

// ---------- Company press releases ----------
const GNW = {
  "Mergers and Acquisitions": ["ma", "pe"], "Initial Public Offerings": ["ipo"],
};
const NOISE = /investigat|class action|lawsuit|shareholder alert|investor alert|law firm|securities fraud|deadline|reminds|halper|rosen|pomerantz|levi & korsinsky|kahn swick/i;
export async function globenewswire({ get, now }) {
  const out = [];
  for (const [subject, cats] of Object.entries(GNW)) {
    const url = `https://www.globenewswire.com/RssFeed/subjectcode/${subject === "Mergers and Acquisitions" ? "27" : "21"}-${encodeURIComponent(subject)}/feedTitle/${encodeURIComponent("GlobeNewswire - " + subject)}`;
    for (const it of feedItems(await get(url)).filter(x => recent(x, now, 2))) {
      const blob = it.title + " " + it.summary;
      if (NOISE.test(blob) || !/billion/i.test(blob)) continue;   // only deals and offerings big enough to matter
      let text = it.summary;
      try { text = htmlText(await get(it.url)); } catch (e) { /* the feed summary is enough to check facts against */ }
      out.push({ key: "gnw:" + it.url, cats, statuses: cats.includes("ipo") ? ["priced", "filed", "announced"] : ["announced", "pending", "completed", "terminated"],
        src: { name: "GlobeNewswire", url: it.url }, published: it.published, title: it.title, text: clip(it.title + "\n" + text), sig: 64 });
    }
  }
  return out;
}

// ---------- Guardian Open Platform (optional, needs GUARDIAN_API_KEY) ----------
const MARKET_WORDS = /wall street|stocks?|shares|s&p 500|nasdaq|dow jones|ftse|bond|yields?|treasur|takeover|merger|acquisition|bid for|private equity|buyout|ipo|flotation|federal reserve|\bfed\b|interest rates?|central bank|ecb|bank of england/i;
export async function guardian({ get, now, env }) {
  if (!env.GUARDIAN_API_KEY) return [];
  const j = await get(`https://content.guardianapis.com/search?section=business&from-date=${ymd(now - 2 * DAY)}&order-by=newest&page-size=40&show-fields=trailText,bodyText&api-key=${encodeURIComponent(env.GUARDIAN_API_KEY)}`, { type: "json" });
  return ((j.response && j.response.results) || []).filter(r => MARKET_WORDS.test(r.webTitle)).slice(0, 12).map(r => ({
    key: "gdn:" + r.id, cats: ["equity", "ma", "pe", "ipo", "credit", "intl", "earnings", "fed", "macro"], statuses: ["rumor", "announced", "pending", "completed", "terminated", "report", "decision", "data", "priced"],
    src: { name: "The Guardian", url: r.webUrl }, published: r.webPublicationDate, title: r.webTitle,
    text: clip(r.webTitle + "\n" + htmlText((r.fields || {}).bodyText || (r.fields || {}).trailText || "")), sig: 58,
  }));
}

export const SOURCES = { fed, bls, treasury, edgarDeals, edgarIpos, edgarEarnings, edgarDealUpdates, ecb, boe, globenewswire, guardian };
export const NEEDS_SEC = new Set(["edgarDeals", "edgarIpos", "edgarEarnings", "edgarDealUpdates"]);
