// TEMPORARY diagnostic: why do SEC, BLS and GlobeNewswire answer 403 from GitHub's runners? Removed before merge.
import https from "node:https";
const c = process.env.SEC_CONTACT || "";
const UA = {
  old: `SwipeTechs-MarketFeed/1.0 (personal study app; https://github.com/PierreVong/swipe-techs; ${c})`,
  sec: `SwipeTechs MarketFeed ${c}`,
};
const URLS = [
  "https://www.sec.gov/files/company_tickers.json",
  "https://data.sec.gov/submissions/CIK0000320193.json",
  "https://efts.sec.gov/LATEST/search-index?q=%22Agreement%20and%20Plan%20of%20Merger%22&forms=8-K",
  "https://www.bls.gov/feed/bls_latest.rss",
  "https://www.globenewswire.com/RssFeed/subjectcode/27-Mergers%20and%20Acquisitions/feedTitle/GlobeNewswire%20-%20Mergers%20and%20Acquisitions",
];
const snip = t => t.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 110);
async function viaFetch(url, ua) {
  const r = await fetch(url, { headers: { "User-Agent": ua, "Accept-Encoding": "gzip, deflate" } });
  const t = await r.text();
  return `${r.status} server=${r.headers.get("server")} ${r.ok ? t.length + " chars" : snip(t)}`;
}
function viaHttps(url, ua) {
  return new Promise((res) => {
    const q = https.get(url, { headers: { "User-Agent": ua, "Accept": "*/*" } }, r => {
      let t = ""; r.setEncoding("utf8"); r.on("data", d => { if (t.length < 4000) t += d; });
      r.on("end", () => res(`${r.statusCode} server=${r.headers.server} ${r.statusCode < 400 ? "ok" : snip(t)}`));
    });
    q.on("error", e => res("error " + e.message)); q.setTimeout(15000, () => q.destroy(new Error("timeout")));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const url of URLS) {
  console.log("\n" + new URL(url).host + new URL(url).pathname.slice(0, 40));
  for (const [name, fn, ua] of [["fetch old UA", viaFetch, UA.old], ["fetch SEC-style UA", viaFetch, UA.sec], ["https SEC-style UA", viaHttps, UA.sec]]) {
    try { console.log(`  ${name}: ${await fn(url, ua)}`); } catch (e) { console.log(`  ${name}: error ${e.message}`); }
    await sleep(400);
  }
}
