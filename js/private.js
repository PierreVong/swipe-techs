/* Private question collections: a question file you made from a guide you own (see tools/private-import),
   imported in Settings and kept in this browser only (IndexedDB). Nothing here is fetched from or sent to the website.
   Pure helpers (validate, rich, filters, paths) run in Node tests too. */
(function (root) {
  "use strict";

  const FORMAT = "swipetechs-private-collection";
  const DB = "swipetechs-private", STORE = "collections";
  const FLAG = "swipetechs.private";           // set while a collection is stored, so most visitors never open IndexedDB
  const CATS = ["acct", "ev", "val", "dcf", "ma", "lbo", "model", "math", "brain"];
  const LEVEL_NAMES = { 1: "Basic", 2: "", 3: "Advanced" };
  const PATHS = ["seq", "shuffle", "srs"];

  const str = (v, max) => (typeof v === "string" ? v : "").slice(0, max || 20000);
  const isInt = v => Number.isInteger(v) && v >= 0 && v < 1e6;

  /* Check an imported file and return a clean copy with known fields only. Any problem rejects the whole file,
     so a question can never go missing quietly. reserved = ids already used by built-in cards. */
  function validate(obj, reserved) {
    const errors = [];
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { ok: false, errors: ["This file isn't a question collection."] };
    if (obj.format !== FORMAT) errors.push("This file isn't a Swipe Techs private collection.");
    else if (obj.version !== 1) errors.push(`This collection uses version ${obj.version}, which this app can't read.`);
    const qs = Array.isArray(obj.questions) ? obj.questions : [];
    if (!qs.length) errors.push("The file has no questions.");
    if (qs.length > 3000) errors.push("The file has more than 3,000 questions.");
    if (errors.length) return { ok: false, errors };
    const seen = new Set(), out = [];
    qs.forEach((q, i) => {
      const where = `Question ${i + 1}${q && typeof q.id === "string" ? ` (${q.id.slice(0, 40)})` : ""}`;
      if (!q || typeof q !== "object") return errors.push(`${where} isn't readable.`);
      if (typeof q.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,47}$/.test(q.id)) return errors.push(`${where} has a missing or invalid id.`);
      if (seen.has(q.id)) return errors.push(`${where} repeats an id.`);
      if (reserved && reserved.has(q.id)) return errors.push(`${where} uses the id of a built-in card.`);
      if (!CATS.includes(q.c)) return errors.push(`${where} has an unknown category.`);
      if (![1, 2, 3].includes(q.l)) return errors.push(`${where} has a level other than 1, 2 or 3.`);
      if (typeof q.q !== "string" || !q.q.trim()) return errors.push(`${where} has no question text.`);
      if (typeof q.a !== "string") return errors.push(`${where} has no answer text.`);
      seen.add(q.id);
      const pages = (Array.isArray(q.pages) ? q.pages : []).filter(isInt).slice(0, 20);
      const ad = q.added && typeof q.added === "object" ? q.added : {};
      const upd = ad.update && typeof ad.update === "object" && str(ad.update.text).trim() ? { topic: str(ad.update.topic, 80), why: str(ad.update.why, 2000), text: str(ad.update.text) } : null;
      out.push({
        id: q.id, c: q.c, l: q.l, lvl: str(q.lvl, 30), sec: str(q.sec, 80), num: isInt(q.num) ? q.num : 0,
        page: isInt(q.page) ? q.page : (pages[0] || 0), pages: pages.length ? pages : (isInt(q.page) ? [q.page] : []),
        q: str(q.q, 2000).trim(), a: str(q.a), notes: str(q.notes, 2000),
        flags: (Array.isArray(q.flags) ? q.flags : []).filter(f => typeof f === "string").map(f => f.slice(0, 40)).slice(0, 10),
        order: isInt(q.order) ? q.order : i + 1,
        added: {
          simple: str(ad.simple).trim(), example: str(ad.example).trim(), update: upd,
          similar: (Array.isArray(ad.similar) ? ad.similar : []).filter(x => typeof x === "string").slice(0, 10),
        },
      });
    });
    if (errors.length) return { ok: false, errors };
    out.sort((a, b) => a.order - b.order);
    return {
      ok: true, errors: [],
      coll: {
        format: FORMAT, version: 1, id: /^[a-z0-9-]{1,40}$/.test(obj.id) ? obj.id : "private",
        name: str(obj.name, 40).trim() || "My collection", short: str(obj.short, 12).trim() || str(obj.name, 12).trim() || "Private",
        source: str(obj.source, 300), created: str(obj.created, 40), imported: new Date().toISOString(),
        count: out.length, questions: out,
      },
    };
  }

  /* Collection questions as feed cards. They keep the guide's level label and order. */
  function toCards(coll) {
    return coll.questions.map(q => Object.assign({}, q, { src: "priv", k: "concept", lvl: q.lvl || LEVEL_NAMES[q.l] }));
  }

  /* Answer text -> HTML. Escapes everything first, then allows only: paragraphs (blank line), "1. " and "- " lists,
     ```table blocks (cells split by "|", a "<" cell merges into the cell on its left; first row and column are headers),
     other ``` blocks (preformatted), **bold**, *italic*, and \* / \\ for literal characters. */
  const escHTML = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function inline(s) {
    let t = escHTML(s).replace(/\\\\/g, "\u0001").replace(/\\\*/g, "\u0002");
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*([^*\s](?:[^*]*?[^*\s])?)\*/g, "<em>$1</em>");
    return t.replace(/\u0001/g, "\\").replace(/\u0002/g, "*");
  }
  function table(rows) {
    const trs = rows.filter(r => r.trim()).map((r, ri) => {
      const cells = [];
      r.split("|").map(c => c.trim()).forEach(c => { if (c === "<" && cells.length) cells[cells.length - 1].span++; else cells.push({ t: c, span: 1 }); });
      return "<tr>" + cells.map((c, ci) => {
        const tag = ri === 0 || ci === 0 ? "th" : "td";
        const scope = ri === 0 ? (c.t ? ' scope="col"' : "") : ci === 0 ? ' scope="row"' : "";
        return `<${tag}${c.span > 1 ? ` colspan="${c.span}"` : ""}${scope}>${inline(c.t)}</${tag}>`;
      }).join("") + "</tr>";
    });
    if (!trs.length) return "";
    return `<div class="tblwrap"><table class="grid"><thead>${trs[0]}</thead><tbody>${trs.slice(1).join("")}</tbody></table></div>`;
  }
  function rich(text) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let para = [], list = null;
    const flushP = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para = []; };
    const flushL = () => {
      if (list) out.push(`<${list.tag}${list.start !== 1 ? ` start="${list.start}"` : ""}>${list.items.map(x => `<li>${inline(x)}</li>`).join("")}</${list.tag}>`);
      list = null;
    };
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^```/.test(l)) {
        flushP(); flushL();
        const rows = [];
        for (i++; i < lines.length && !/^```/.test(lines[i]); i++) rows.push(lines[i]);
        out.push(/^```table\s*$/.test(l) ? table(rows) : `<pre class="tbl">${escHTML(rows.join("\n"))}</pre>`);
        continue;
      }
      if (!l.trim()) { flushP(); flushL(); continue; }
      const mn = l.match(/^(\d{1,3})\.\s+(.*)$/), mb = l.match(/^[-•]\s+(.*)$/);
      if (mn || mb) {
        flushP();
        const tag = mn ? "ol" : "ul";
        if (!list || list.tag !== tag) { flushL(); list = { tag, start: mn ? +mn[1] : 1, items: [] }; }
        list.items.push(mn ? mn[2] : mb[1]);
        continue;
      }
      if (list) { list.items[list.items.length - 1] += " " + l.trim(); continue; }
      para.push(l.trim());
    }
    flushP(); flushL();
    return out.join("");
  }

  /* Filters for the collection page. Brain teasers have no level, so level filters never hide them. */
  const inFilter = (q, f) => (!f.cats || !f.cats.length || f.cats.includes(q.c)) && (q.c === "brain" || !f.lvls || !f.lvls.length || f.lvls.includes(q.l));
  const secKey = q => q.c + ":" + q.l;
  /* Sequential path: the first question, in guide order, after the last one you rated in its section.
     cards must be sorted by order; cur = {section key: order of the last question rated}; taken = ids already in the feed. */
  function seqNext(cards, cur, taken) {
    for (const q of cards) if (q.order > (cur[secKey(q)] || 0) && !(taken && taken.has(q.id))) return q.id;
    return null;
  }
  function advance(cur, q) { const k = secKey(q); cur[k] = Math.max(cur[k] || 0, q.order); return cur; }
  function restart(cur, cards) { cards.forEach(q => { delete cur[secKey(q)]; }); return cur; }

  /* Questions marked as similar (private <-> built-in), both directions. */
  function simMap(cards) {
    const m = {};
    const add = (a, b) => { (m[a] = m[a] || new Set()).add(b); };
    cards.forEach(q => (q.added && q.added.similar || []).forEach(id => { add(q.id, id); add(id, q.id); }));
    return m;
  }
  function blocked(map, recent) {
    const b = new Set();
    recent.forEach(id => (map[id] || []).forEach(x => b.add(x)));
    return b;
  }

  // ---------- storage (browser only) ----------
  const ls = () => { try { return root.localStorage; } catch (e) { return null; } };
  function idb() {
    return new Promise((res, rej) => {
      if (!root.indexedDB) return rej(new Error("This browser has no IndexedDB."));
      const r = root.indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error("Storage is busy in another tab."));
    });
  }
  function tx(mode, fn) {
    return idb().then(db => new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), req = fn(t.objectStore(STORE));
      t.oncomplete = () => { db.close(); res(req && req.result); };
      t.onerror = t.onabort = () => { db.close(); rej(t.error || new Error("Storage error")); };
    }));
  }
  // One collection at a time: saving replaces whatever was there.
  function save(coll) {
    return tx("readwrite", s => { s.clear(); return s.put(coll); }).then(() => {
      try { ls().setItem(FLAG, JSON.stringify({ id: coll.id, name: coll.name, count: coll.count })); } catch (e) { /* flag is only a shortcut */ }
      if (root.navigator && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    });
  }
  function remove() {
    return tx("readwrite", s => s.clear()).then(() => { try { ls().removeItem(FLAG); } catch (e) { /* ignore */ } });
  }
  function load(timeoutMs) {
    let flag = null;
    try { flag = ls() && ls().getItem(FLAG); } catch (e) { flag = null; }
    if (!flag) return Promise.resolve({ coll: null, status: "none" });
    const read = tx("readonly", s => s.getAll()).then(all => {
      const v = all && all[0] ? validate(all[0]) : null;
      return v && v.ok ? { coll: Object.assign(v.coll, { imported: all[0].imported || v.coll.imported }), status: "ok" } : { coll: null, status: "missing" };
    });
    const late = new Promise(res => setTimeout(() => res({ coll: null, status: "error", error: "Timed out opening storage" }), timeoutMs || 4000));
    return Promise.race([read, late]).catch(e => ({ coll: null, status: "error", error: String(e && e.message || e) }));
  }

  const api = { FORMAT, CATS, PATHS, validate, toCards, rich, inline, inFilter, secKey, seqNext, advance, restart, simMap, blocked, save, remove, load };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.PRIV = api; api.ready = load(); }
})(typeof window !== "undefined" ? window : globalThis);
