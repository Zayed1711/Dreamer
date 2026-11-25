# Keeping deadlines, fees and scholarships current

A wrong deadline can cost a student a year, so no automated step publishes facts. The watcher only tells a person *where to look*.

## How it works

1. Every university and scholarship in `content/` lists its official `sources` and a `lastChecked` date (`null` until a person has checked it).
2. Every Monday, `.github/workflows/watch-sources.yml` runs `scripts/watch-sources.mjs`. It:
   - reads each site's robots.txt and skips pages it may not fetch;
   - visits each source page, 3 seconds apart, as `WayPointFactWatcher/1.0`;
   - keeps only the lines that state facts (deadlines, fees, intakes, months, amounts) and compares them with last week's.
3. If anything changed, it opens a pull request titled **Source watch YYYY-MM-DD** whose description is the report.
4. BDT amounts are not part of this: they are converted from the official currency with the day's exchange rate (`/api/rates`).

## Reviewing a watch pull request

For each item under **Changed**:

1. Open the source link and find the changed fact.
2. If a deadline, fee or requirement really changed, edit the record in `content/universities/universities.json` or `content/scholarships/scholarships.json` on the same branch:
   - tuition goes in its official currency (`"amount": 1500, "currency": "EUR", "per": "semester"`);
   - a deadline that is one exact date each year is `"date": "MM-DD"`; one that varies is `"date": null` with the official wording in `note`.
3. Set that record's `"lastChecked"` to today's date (`"2026-11-30"`), even if nothing changed: the student sees it.
4. Merge. The site updates on the next deploy.

Under **Could not read**, check the listed pages by hand. `no-facts-found` usually means the page is built by JavaScript or has moved: find the page that actually states the facts and replace the URL in that record's `sources`. `blocked-by-robots` means the site asks bots not to fetch it: always check those by hand, never work around them.

Noise such as a news ticker or a cookie notice that mentions a date may show up as a change. Merge without content edits; the new snapshot becomes the baseline.

## Running it yourself

```
npm run watch:sources
npm run test:watch
```

The first run takes a snapshot of every page and lists them all as "first snapshot": check each record once and set `lastChecked`.

## One-time GitHub setting

For the workflow to open pull requests: repository **Settings → Actions → General → Workflow permissions**, select *Read and write permissions* and tick *Allow GitHub Actions to create and approve pull requests*.

## Later

- An AI step that reads each changed page and proposes the new value, so the pull request already contains the edit to approve.
- Pages built by JavaScript need a headless browser; until then they are listed under "Could not read".
