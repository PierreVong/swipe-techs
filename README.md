# Swipe Techs

A swipe feed for investment banking technical interview prep: TikTok-style scrolling, spaced repetition, and 220 original questions across Accounting, EV & Equity Value, Valuation, DCF, M&A, LBO, Financial Modeling and Mental Math.

Live: https://pierrevong.github.io/swipe-techs/ (add it to your iPhone home screen from Safari's Share menu).

## How it works

- **Card flow:** question → tap to reveal → Quick Answer → expandable Detailed Explanation and Numerical Example → rate Didn't Know / Partially / Nailed It → next card. Each card has 1–3 Go Deeper follow-ups.
- **Spaced repetition** (`js/srs.js`): Didn't Know returns in 3–5 cards, Partially in 10–15, Nailed It tomorrow, then 3, 7, 14, 30, 60 days. Lapses shrink a card's intervals. Mastered = nailed on 3+ separate days with the last review a success.
- **Modes:** For You, Chill, Topic Focus, Review (your weak questions), Interview, plus Bookmarks, Top 100 and Chill saves collections.
- **Interview Mode:** 12 mixed questions without answer choices. Concept questions are answered out loud with an optional timer; number questions take a typed answer. Each reveal shows an interview-ready answer and a likely follow-up, and the round ends with a breakdown.
- **Chill Mode 🌙:** a no-pressure feed for tired evenings. Each card shows a concept with its explanation already open: a hook, a plain-language explanation, a small example and one takeaway, readable in about 15 seconds. No quizzes, timers or ratings. Learn more adds depth, a formula and the related interview question; Test me opens that question in normal study mode. The feed shows unseen concepts first, brings back older ones now and then, and never repeats within a session. Save concepts, or narrow the feed to a few topics. Chill progress is kept apart from study progress and never counts toward mastery, streaks or the daily goal.
- **Progress** is stored in the browser (`localStorage` key `swipetechs.v2`; Chill Mode uses its own key, `swipetechs.chill.v1`). Data from the first version (`swipetechs.v1`) is migrated automatically and left in place.

## Project layout

```
index.html        app shell
css/app.css       styles (light and dark)
js/srs.js         scheduler + progress store (no DOM; unit tested)
js/chill.js       Chill Mode picker + its own store (no DOM; unit tested)
js/app.js         feed, cards, modes, dashboard
data/*.js         question bank, one file per category (schema in data/helpers.js)
data/chill/*.js   Chill Mode concept cards, one file per topic (schema in data/helpers.js)
sw.js             offline cache (network first for app files; bump CACHE when shipping)
tests/            node --test unit/content tests and a Playwright browser test
```

No build step and no dependencies. To add a question, append a card to the right `data/*.js` file with a new, never-reused `id`.

## Tests

```
node --test tests/*.test.js     # scheduler, migration, question bank and Chill card checks
node tests/e2e.js               # browser test (needs Playwright + Chromium)
```
