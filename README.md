# Swipe Techs

A swipe feed for investment banking technical interview prep: TikTok-style scrolling, spaced repetition, and 220 original questions across Accounting, EV & Equity Value, Valuation, DCF, M&A, LBO, Financial Modeling and Mental Math.

Live: https://pierrevong.github.io/swipe-techs/ (add it to your iPhone home screen from Safari's Share menu).

## How it works

- **Card flow:** question → tap to reveal → Quick Answer → expandable Detailed Explanation and Numerical Example → rate Didn't Know / Partially / Nailed It → next card. Each card has 1–3 Go Deeper follow-ups.
- **Spaced repetition** (`js/srs.js`): Didn't Know returns in 3–5 cards, Partially in 10–15, Nailed It tomorrow, then 3, 7, 14, 30, 60 days. Lapses shrink a card's intervals. Mastered = nailed on 3+ separate days with the last review a success.
- **Modes:** For You, Chill, Topic Focus, Review (your weak questions), Interview, plus Bookmarks, Top 100 and Chill saves collections.
- **Interview Mode:** 12 mixed questions without answer choices. Concept questions are answered out loud with an optional timer; number questions take a typed answer. Each reveal shows an interview-ready answer and a likely follow-up, and the round ends with a breakdown.
- **Chill Mode 🌙:** a no-pressure feed for tired evenings. Each card is a 10–15 second read: a hook (a story, a striking number, a claim to check or a "you're in the room" scenario), one or two short sentences, one example (often a small diagram: bridges, bars, splits, flows), and one takeaway. No quizzes, timers or ratings. Learn more holds the technical depth and the related interview question, with Rabbit hole (related concepts next in the feed) and More like this (also a double tap, explained once by a hint). Now and then a must-know card offers Go deeper itself, and the Rabbit hole badge leaves it in one tap. The feed shows unseen concepts first, varies topic, card type and concept, sometimes lets two or three connected ideas follow each other, tilts gently toward what you save or like, brings back saved and core ideas now and then, and reopens on the card you left within 12 hours. Chill progress is kept apart from study progress and never counts toward mastery, streaks or the daily goal.
- **Private collections:** study questions from a guide you own (for example your BIWS 400 questions) in the same card flow, without putting them on this site. Extract them on your computer with `tools/private-import/`, then import the JSON in Settings → Private collection. The file is stored only in that browser (IndexedDB) and never passes through this repo, the service worker or GitHub Pages. A source switch (Swipe Techs / the collection / Both) applies to For You, Topics, Review and Interview; the collection's own page offers Sequential (guide order), Shuffle and Spaced repetition, with section and difficulty filters and its own progress. Answers show the original text word for word with its page number; simplified explanations, numerical examples and updated explanations (for answers current standards have changed) sit in separate, labelled tabs. In Both, near-duplicate questions are kept apart in the feed. Deleting the collection can keep or erase its progress; built-in progress is never touched. See `tools/private-import/README.md`.
- **Progress** is stored in the browser (`localStorage` key `swipetechs.v2`; Chill Mode uses its own key, `swipetechs.chill.v1`). Data from the first version (`swipetechs.v1`) is migrated automatically and left in place.

## Project layout

```
index.html        app shell
css/app.css       styles (light and dark)
js/srs.js         scheduler + progress store (no DOM; unit tested)
js/chill.js       Chill Mode picker + its own store (no DOM; unit tested)
js/private.js     private collection: import checks, safe text rendering, study paths, IndexedDB store (unit tested)
js/app.js         feed, cards, modes, dashboard
data/*.js         question bank, one file per category (schema in data/helpers.js)
data/chill/*.js   Chill Mode concept cards, one file per topic (schema in data/helpers.js)
sw.js             offline cache (network first for app files; bump CACHE when shipping)
tests/            node --test unit/content tests and a Playwright browser test
tools/private-import/  local PDF extractor and merge tool for private collections (outputs stay out of git)
```

No build step and no dependencies. To add a question, append a card to the right `data/*.js` file with a new, never-reused `id`.

## Tests

```
node --test tests/*.test.js     # scheduler, migration, question bank, Chill and private collection checks
node tests/e2e.js               # browser test (needs Playwright + Chromium)
```
