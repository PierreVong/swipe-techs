/* Writes a story card from one source with Google's Gemini API (free tier, key in the GEMINI_API_KEY Actions secret).
   The model only sees the source text, must quote the sentences it relied on, and every figure it writes is checked
   against the source afterwards (validate.mjs). Model names are aliases so a retired model doesn't break the job. */
const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"];
const API = m => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    include: { type: "BOOLEAN" }, reason: { type: "STRING" },
    cat: { type: "STRING" }, status: { type: "STRING" }, importance: { type: "INTEGER" },
    hook: { type: "STRING" }, what: { type: "STRING" }, uncertain: { type: "STRING" },
    why: { type: "STRING" }, ib: { type: "STRING" }, chain: { type: "ARRAY", items: { type: "STRING" } },
    ctx: { type: "STRING" }, evergreen: { type: "BOOLEAN" }, hist: { type: "STRING" },
    concepts: { type: "ARRAY", items: { type: "STRING" } }, parties: { type: "ARRAY", items: { type: "STRING" } },
    evidence: { type: "ARRAY", items: { type: "STRING" } }, size_usd_billions: { type: "NUMBER" },
  },
  required: ["include", "reason", "cat", "status", "importance", "hook", "what", "why", "ib", "chain", "ctx", "evergreen", "concepts", "parties", "evidence"],
};

const RULES = `You write one card for "Market Feed", a calm, scrollable feed that helps college students preparing for investment banking interviews understand financial news. The reader is in bed, tired: each card must be understood in 10-20 seconds.

Use ONLY the SOURCE below. Never add facts, figures, dates, names, market reactions or developments that the source does not state. If the source does not say something happened, do not say it happened. Facts go in "what"; interpretation goes in "why", "ib", "ctx", "hist" and must not introduce new figures.

Fields:
- include: false if this is not significant news for an investment banking student (small or routine filings, internal reorganizations, debt refinancings, lawsuits, marketing, non-financial news, or the source is too thin to be sure). When false, still fill the other fields minimally.
- cat: one of {CATS}. status: one of {STATUSES}. "rumor" only when the source itself says talks are reported/unconfirmed. "announced" = signed agreement, not yet closed; "pending" = awaiting approvals; "completed" = closed.
- importance: 1-5 for an IB student (5 = a Fed decision or a $20B+ deal; 1 = minor).
- hook: 6-12 words, a calm, specific headline that creates curiosity without clickbait. No "!", no emoji, no questions unless natural, no words like shocking/huge/massive/stunning.
- what: 1-2 short sentences, at most 26 words: who did what, with the key figures exactly as the source states them (price per share, deal or offering size, rate, percent). If the source gives no figure, give none.
- uncertain: if anything is not final (approvals pending, expected closing date, reported but unconfirmed), say it in at most 12 words; else "".
- why: at most 16 words: why it matters for markets or the economy, intuitively.
- ib: at most 18 words: the investment banking connection, naming the real concept (WACC, DCF, accretion/dilution, synergies, premium, LBO, IRR, leverage, multiples, equity capital markets, cost of debt...).
- chain: 3-4 short steps (1-3 words each) from this event to the IB concept, e.g. ["Rate cut","Cost of debt","WACC","DCF value"].
- ctx: at most 20 words: the broader context for readers a week or a month later (why this kind of event matters), interpretation only.
- evergreen: true only if this event will still be taught in a year (a Fed turning point, a $50B+ deal, a landmark IPO). hist: if evergreen, at most 20 words on why it is still worth knowing; else "".
- concepts: 1-3 ids from CONCEPTS that best explain the idea behind the story.
- parties: company or institution names involved, as written in the source.
- evidence: 1-3 sentences copied EXACTLY, word for word, from the source, that support "what".
- size_usd_billions: deal or offering size in US$ billions if the source states it (or it is shares x price stated in the source), else 0.
Write plain, professional English. American spelling.`;

export function makeWriter({ key, fetchImpl = globalThis.fetch, log = () => {}, concepts }) {
  if (!key) return null;
  const list = concepts.map(c => `${c.id} | ${c.c} | ${c.hook}`).join("\n");
  let calls = 0;
  async function write(cand) {
    const prompt = RULES.replace("{CATS}", cand.cats.join(", ")).replace("{STATUSES}", cand.statuses.join(", "))
      + `\n\nCONCEPTS (id | topic | card hook):\n${list}\n\nSOURCE (${cand.src.name}, published ${cand.published}):\nTitle: ${cand.title}\n${cand.text}`;
    const body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: SCHEMA } };
    let lastErr;
    for (const m of MODELS) {
      try {
        calls++;
        const r = await fetchImpl(API(m), { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
        if (r.status === 404) { lastErr = new Error(`${m}: not found`); continue; }
        if (r.status === 429) { lastErr = new Error(`${m}: rate limited`); await new Promise(res => setTimeout(res, 15000)); continue; }
        if (!r.ok) { lastErr = new Error(`${m}: HTTP ${r.status}`); continue; }
        const j = await r.json();
        const text = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts.map(p => p.text || "").join("");
        if (!text) { lastErr = new Error(`${m}: empty answer`); continue; }
        return { ...JSON.parse(text), model: m };
      } catch (e) { lastErr = e; }
    }
    log(`writer failed for ${cand.key}: ${lastErr && lastErr.message}`);
    return null;
  }
  return { write, get calls() { return calls; } };
}
