// Polite fetching: an identifying User-Agent (SEC and BLS require a contact), a timeout, one retry with backoff,
// and spacing between requests to the same host (SEC allows 10 per second; we stay far below).
const last = new Map();
const GAP = { "www.sec.gov": 250, "data.sec.gov": 250, "efts.sec.gov": 250 };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function makeGet({ contact, fetchImpl = globalThis.fetch, log = () => {}, retryMs = 2000 } = {}) {
  const ua = `SwipeTechs-MarketFeed/1.0 (personal study app; https://github.com/PierreVong/swipe-techs${contact ? "; " + contact : ""})`;
  return async function get(url, { type = "text", timeout = 20000, headers = {} } = {}) {
    const host = new URL(url).host;
    const gap = GAP[host] || 100;
    const wait = (last.get(host) || 0) + gap - Date.now();
    if (wait > 0) await sleep(wait);
    let err;
    for (let attempt = 0; attempt < 2; attempt++) {
      last.set(host, Date.now());
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeout);
      try {
        const r = await fetchImpl(url, { headers: { "User-Agent": ua, "Accept-Encoding": "gzip, deflate", ...headers }, signal: ctl.signal });
        if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
        if (!r.ok) { const e = new Error(`HTTP ${r.status}`); e.status = r.status; e.final = true; throw e; }
        return type === "json" ? await r.json() : await r.text();
      } catch (e) {
        err = e;
        if (e.final) break;
        log(`retry ${url}: ${e.message}`);
        await sleep(retryMs * (attempt + 1));
      } finally { clearTimeout(to); }
    }
    throw err;
  };
}
