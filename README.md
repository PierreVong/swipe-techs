# Swipe Techs

A swipe feed for investment banking technical interview prep: TikTok-style scrolling, spaced repetition, and 220 original questions across Accounting, EV & Equity Value, Valuation, DCF, M&A, LBO, Financial Modeling and Mental Math.

Live: https://pierrevong.github.io/swipe-techs/ (add it to your iPhone home screen from Safari's Share menu).

## How it works

- **Card flow:** question → tap to reveal → Quick Answer → expandable Detailed Explanation and Numerical Example → rate Didn't Know / Partially / Nailed It → next card. Each card has 1–3 Go Deeper follow-ups.
- **Spaced repetition** (`js/srs.js`): Didn't Know returns in 3–5 cards, Partially in 10–15, Nailed It tomorrow, then 3, 7, 14, 30, 60 days. Lapses shrink a card's intervals. Mastered = nailed on 3+ separate days with the last review a success.
- **Modes:** For You, Chill, Topic Focus, Review (your weak questions), Interview, plus Bookmarks, Top 100 and Chill saves collections.
- **Interview Mode:** 12 mixed questions without answer choices. Concept questions are answered out loud with an optional timer; number questions take a typed answer. Each reveal shows an interview-ready answer and a likely follow-up, and the round ends with a breakdown.
- **Chill Mode 🌙:** a no-pressure feed for tired evenings: short, friendly cards (a hook, a sentence or three, often an example or small diagram, sometimes a takeaway), with real business stories (sports teams, tech, restaurants, retail, buyouts, real estate) and clearly labelled hypothetical scenarios. No quizzes, timers or ratings. Each card teaches one of 16 big ideas ("Profit isn't cash", "Debt magnifies wins and losses"…), and the feed brings an idea back now and then through a different example. Some cards carry a small "Interview connection" label. Learn more holds the technical depth and the related interview question, with Rabbit hole and More like this (also a double tap, explained once by a hint). Now and then a must-know card offers Go deeper itself. Fronts are written to stand alone (any assumption that changes the takeaway is on the card), read in 10–15 seconds, show numbers as results rather than sums, and name the real IB terms (WACC, UFCF, working capital, accretion/dilution, IRR…). The feed shows unseen concepts first, varies topic, card type, picture and concept, sometimes lets two or three connected ideas follow each other like related videos (often across topics, using hand-picked bridges in data/helpers.js, labelled e.g. "🔗 Accounting → LBO"), tilts gently toward what you save or like, and reopens on the card you left within 12 hours. Once most cards are seen, repeats favour cards you haven't seen for a few days, have seen least, and ideas you've explored least, with saved and core ideas ahead. Chill progress is kept apart from study progress and never counts toward mastery, streaks or the daily goal.
- **Private collections:** study questions from a guide you own (for example your BIWS 400 questions) in the same card flow, without putting them on this site. Extract them on your computer with `tools/private-import/`, then import the JSON in Settings → Private collection. The file is stored only in that browser (IndexedDB) and never passes through this repo, the service worker or GitHub Pages. A source switch (Swipe Techs / the collection / Both) applies to For You, Topics, Review and Interview; the collection's own page offers Sequential (guide order), Shuffle and Spaced repetition, with section and difficulty filters and its own progress. Answers show the original text word for word with its page number; simplified explanations, numerical examples and updated explanations (for answers current standards have changed) sit in separate, labelled tabs. In Both, near-duplicate questions are kept apart in the feed. Deleting the collection can keep or erase its progress; built-in progress is never touched. See `tools/private-import/README.md`.
- **Market Feed 📈 (inside Chill):** a small Concepts · Markets · Mixed selector at the top of Chill (Mixed by default, remembered). Market cards are short, sourced news stories: a calm headline, What happened (facts only), Why it matters and IB connection (interpretation, with a concept chain like "Rate cut → Cost of debt → WACC → DCF value"), the source and date, Read more to the original, and Related concepts to open the Chill cards behind the story as a Rabbit hole. Deal status is always explicit (Reported, not confirmed · Announced · Pending approval · Completed · Called off). Stories age by kind of news (`PROFILES` in js/market.js): Recent news, Developing story (only when a verified, sourced update exists; otherwise just "Past few days"), Weekly context, Bigger picture, then Historical context for educational ones, the rest archived. A story you've read only comes back with a new update or a later stage's own explanation. Mixed slips a story in after a couple of concepts, never two in a row. Reading news never counts toward mastery.
- **Where market stories come from:** `.github/workflows/market-feed.yml` runs `tools/market/run.mjs` every 4 hours on GitHub Actions. It reads official, automation-friendly sources (Federal Reserve, BLS, Treasury yields, SEC EDGAR filings for deals, IPO pricings of $200M or more, completions and terminations and big-company earnings, ECB, Bank of England, optionally the Guardian), writes each card with Google's Gemini API (free tier), and checks it before publishing: every figure must appear in the source, a sentence must be quoted word for word from it, and the status must fit the kind of source (an SEC item 2.01 filing is what makes a deal "Completed"). Anything that fails is dropped and logged; when a source or the summarizer is down nothing is invented, the existing stories just keep aging. Without a Gemini key only Fed, BLS and Treasury stories go out, in fixed wording that quotes the source. Results go to the `market-data` branch (`market.json`, plus `status.json` with per-source health), which the app reads from raw.githubusercontent.com at most once an hour, with `data/market.json` (hand-checked starter stories) as the fallback. Settings: secret `GEMINI_API_KEY`, `SEC_CONTACT` (an email; SEC and BLS require one in automated requests; store it as a secret rather than a variable, since variables show up in the public run logs), optional secret `GUARDIAN_API_KEY`. No source text is stored or published, only our own summaries, links and dates.
- **Progress** is stored in the browser (`localStorage` key `swipetechs.v2`; Chill Mode uses its own key, `swipetechs.chill.v1`, and Market Feed `swipetechs.market.v1`). Data from the first version (`swipetechs.v1`) is migrated automatically and left in place.

## Project layout

```
index.html        app shell
css/app.css       styles (light and dark)
js/srs.js         scheduler + progress store (no DOM; unit tested)
js/chill.js       Chill Mode picker + its own store (no DOM; unit tested)
js/market.js      Market Feed: story aging, ranking, repeats, Mixed rhythm, its own store (no DOM; unit tested)
js/private.js     private collection: import checks, safe text rendering, study paths, IndexedDB store (unit tested)
js/app.js         feed, cards, modes, dashboard
data/*.js         question bank, one file per category (schema in data/helpers.js)
data/chill/*.js   Chill Mode concept cards, one file per topic (schema in data/helpers.js)
data/market.json  starter market stories (the live ones are on the market-data branch)
sw.js             offline cache (network first for app files; bump CACHE when shipping)
tests/            node --test unit/content tests and a Playwright browser test
tools/private-import/  local PDF extractor and merge tool for private collections (outputs stay out of git)
tools/market/     Market Feed pipeline: sources, Gemini writer, validation, aging/archive (run by GitHub Actions)
```

No build step and no dependencies. To add a question, append a card to the right `data/*.js` file with a new, never-reused `id`.

## Tests

```
node --test tests/*.test.js     # scheduler, migration, question bank, Chill, Market Feed and private collection checks
node tools/market/run.mjs --prev market.json --out out   # one pipeline run by hand (same env vars as the workflow)
node tests/e2e.js               # browser test (needs Playwright + Chromium)
```
