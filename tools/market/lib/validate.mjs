/* The gate every automatically written card must pass before it is published. Anything that fails is dropped
   (and logged in status.json); nothing is "fixed up" by guessing. */
import { words, unsupported, quoted } from "./text.mjs";

const CATS = ["ma", "fed", "pe", "equity", "ipo", "earnings", "credit", "intl", "macro"];
const STATUSES = ["rumor", "announced", "pending", "completed", "terminated", "decision", "data", "filed", "priced", "report"];
const LIMITS = { hook: [4, 14], what: [6, 30], uncertain: [0, 14], why: [5, 20], ib: [5, 22], ctx: [5, 24], hist: [0, 24] };
const FRONT = 72;   // hook + what + uncertain + why + ib: what fits one phone screen
const LOUD = /!|shocking|stunning|massive|huge|insane|crazy|bombshell|skyrocket|plummet|mind-blowing|you won't believe|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/iu;

export function check(card, cand, conceptIds) {
  const errs = [];
  if (!card) return ["no card"];
  for (const [f, [lo, hi]] of Object.entries(LIMITS)) {
    const n = words(card[f]);
    if ((lo > 0 || card[f]) && (n < lo || n > hi)) errs.push(`${f}: ${n} words (want ${lo}-${hi})`);
  }
  if ((card.hook || "").length > 80) errs.push("hook over 80 characters");
  const front = ["hook", "what", "uncertain", "why", "ib"].reduce((a, f) => a + words(card[f]), 0);
  if (front > FRONT) errs.push(`front ${front} words (max ${FRONT})`);
  if (!CATS.includes(card.cat) || !cand.cats.includes(card.cat)) errs.push(`category ${card.cat} not allowed here`);
  if (!STATUSES.includes(card.status) || !cand.statuses.includes(card.status)) errs.push(`status ${card.status} not allowed for this source`);
  for (const f of ["hook", "what", "uncertain", "why", "ib", "ctx", "hist"]) if (LOUD.test(card[f] || "")) errs.push(`${f}: clickbait or emoji`);
  if (!Array.isArray(card.chain) || card.chain.length < 2 || card.chain.length > 4 || card.chain.some(s => !s || s.length > 24)) errs.push("chain must be 2-4 short steps");
  // Every figure anywhere on the card must appear in the source (interpretation may not invent numbers either).
  if (!cand.trusted) {
    for (const f of ["hook", "what", "uncertain", "why", "ib", "ctx", "hist"]) {
      const bad = unsupported(card[f], cand.title + "\n" + cand.text);
      if (bad.length) errs.push(`${f}: figures not in the source: ${bad.join(", ")}`);
    }
    const ev = (card.evidence || []).filter(q => quoted(q, cand.title + "\n" + cand.text));
    if (!ev.length) errs.push("no evidence quote found verbatim in the source");
  }
  const bad = (card.concepts || []).filter(id => !conceptIds.has(id));
  if (bad.length) errs.push(`unknown concepts: ${bad.join(", ")}`);
  return errs;
}

export const CHECK = { CATS, STATUSES, LIMITS, FRONT };
