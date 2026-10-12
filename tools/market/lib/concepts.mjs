// The Chill concept cards, so each story can point at the ideas behind it (and open them in a Rabbit hole).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export function loadConcepts(root) {
  const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "data/helpers.js"), "utf8"), ctx);
  for (const f of fs.readdirSync(path.join(root, "data/chill")).sort()) vm.runInContext(fs.readFileSync(path.join(root, "data/chill", f), "utf8"), ctx);
  return ctx.CB.map(x => ({ id: x.id, c: x.c, p: x.p, k: x.k || [], core: !!x.core, hook: String(x.hook).replace(/<[^>]+>/g, "") }));
}

// Fallback when a story names no concepts: the core cards for the ideas each kind of news usually touches.
const TAGS = {
  fed: ["wacc", "discounting", "cost-of-equity"], macro: ["discounting", "wacc"], credit: ["debt-types", "wacc", "deal-financing"],
  ma: ["accretion-dilution", "synergies", "control-premium"], pe: ["leverage", "returns", "debt-paydown"],
  ipo: ["comps", "valuation-methods", "equity-value"], earnings: ["multiples", "comps"], equity: ["multiples", "valuation-methods"],
  intl: ["wacc", "discounting"],
};
export function defaultConcepts(concepts, cat) {
  const want = TAGS[cat] || TAGS.fed;
  const out = [];
  for (const t of want) {
    const hit = concepts.filter(x => x.k.includes(t)).sort((a, b) => (b.core - a.core) || (a.id < b.id ? -1 : 1))[0];
    if (hit && !out.includes(hit.id)) out.push(hit.id);
  }
  return out.slice(0, 3);
}
