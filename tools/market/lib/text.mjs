// Small parsing helpers with no dependencies: RSS/Atom items, HTML to plain text, CSV rows, number matching.

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", rsaquo: "›", laquo: "«", raquo: "»" };
export function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}

// Visible text of an HTML page or fragment, whitespace collapsed.
export function htmlText(html) {
  return decode(String(html || "")
    .replace(/<(script|style|noscript|svg|head|nav|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|td|th|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t\r\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]).trim() : "";
};
const attr = (xml, name, a) => {
  const m = xml.match(new RegExp(`<${name}\\b[^>]*\\b${a}="([^"]*)"`, "i"));
  return m ? decode(m[1]) : "";
};

// Items of an RSS 2.0, RDF or Atom feed: {title, url, published (ISO), summary, id, cats}.
export function feedItems(xml) {
  const out = [];
  const blocks = String(xml || "").match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  for (const b of blocks) {
    const title = htmlText(tag(b, "title"));
    let url = tag(b, "link");
    if (!url || /^</.test(url)) url = attr(b, "link", "href");
    const date = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date");
    const t = Date.parse(date);
    out.push({
      title, url: url.trim(),
      published: isNaN(t) ? null : new Date(t).toISOString(),
      summary: htmlText(tag(b, "description") || tag(b, "summary") || tag(b, "content")),
      id: tag(b, "guid") || tag(b, "id") || url.trim(),
      cats: (b.match(/<category[^>]*>([\s\S]*?)<\/category>/gi) || []).map(c => htmlText(c)).concat((b.match(/<category[^>]*term="([^"]*)"/gi) || []).map(c => decode(c.replace(/^.*term="|"$/g, "")))),
    });
  }
  return out;
}

export function csvRows(text) {
  const rows = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ",") { cells.push(cur); cur = ""; } else cur += ch;
    }
    cells.push(cur); rows.push(cells.map(c => c.trim()));
  }
  return rows;
}

export const words = s => (String(s || "").match(/\S+/g) || []).length;
export const squash = s => String(s || "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[‐-―]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();

/* Every number a summary states, as values: "$12.5 billion" -> 12.5, "4-1/4" -> 4.25, "1/4" -> 0.25, "45%" -> 45.
   Used to check that each figure on a card also appears in the source. */
export function numbers(s) {
  const t = String(s || "").replace(/(\d),(?=\d{3}\b)/g, "$1");
  const out = [];
  const re = /(\d+)\s*-\s*(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(t))) {
    if (m[1]) out.push(+m[1] + m[2] / m[3]);
    else if (m[4]) { out.push(m[4] / m[5]); }
    else out.push(+m[6]);
  }
  return out;
}
// Numbers in `claim` that the source never mentions (scaled forms count: 12,000 million = 12 billion).
export function unsupported(claim, source) {
  const have = numbers(source);
  // Same value at another scale counts: "30 million" vs 30,000,000, "$1.6 billion" vs 1,600 million, 25 basis points vs 1/4 point.
  const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a));
  const ok = v => have.some(h => [1, 1e3, 1e6, 1e9, 1e-3, 1e-6, 1e-9, 100, 1e-2].some(f => close(h, v * f)));
  return [...new Set(numbers(claim))].filter(v => !ok(v));
}
// True when `quote` appears in the source (ignoring case, curly quotes and spacing).
export const quoted = (quote, source) => { const q = squash(quote); return q.length >= 12 && squash(source).includes(q); };

// Sentences of plain text, keeping decimals ("0.3 percent") and common abbreviations ("U.S.") intact.
export function sentences(text) {
  const keep = String(text || "").replace(/(\d)\.(\d)/g, "$1\u0000$2").replace(/\b(U\.S|U\.K|Inc|Corp|Co|Ltd|No|Mr|Ms|Dr|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|vs|e\.g|i\.e)\./g, m => m.replace(/\./g, "\u0001"));
  return keep.split(/(?<=[.!?])\s+|\n+/).map(x => x.replace(/\u0000/g, ".").replace(/\u0001/g, ".").trim()).filter(Boolean);
}
