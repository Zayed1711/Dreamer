# Dreamer

A free, gamified study-abroad journey app for Bangladeshi students. A student joins at any stage (HSC, undergraduate or after graduation) and gets a year-by-year plan from today until they fly abroad. They rise from **E-Rank Dreamer** to **S-Rank Dreamer** while a plane crosses the flight path from their home airport to their destination.

Students never pay to use the app. Revenue comes from:

1. Labelled, milestone-targeted ads from IELTS providers and agencies that meet our published standards.
2. Paid small-group sessions with verified advisors (Mentors), who keep 70%.

See [docs/product-design.md](docs/product-design.md) for the full design.

## Repository layout

| Path | What it is |
|---|---|
| `content/journeys/` | The journey content as data: milestone library, journey templates, ranks, airports. Edited by the content editor and reviewed every season. |
| `packages/journey-engine/` | TypeScript engine: turns a student profile and a template into a dated journey, and computes EXP, level, rank and flight status. Has tests. |
| `supabase/migrations/` | Postgres schema with row-level security, for Supabase. |
| `apps/web/` | Next.js web app (installable PWA): student screens, advisor screens and the admin panel, in one codebase. Later published to the Play Store as a wrapper (TWA). |
| `docs/` | Product and design notes. |

## Getting started

### Journey engine

```bash
npm install
npm test
npm run demo
```

`npm run demo` prints a generated journey for a sample student.

### Database

Follow [docs/supabase-setup.md](docs/supabase-setup.md) to create the project, run the schema, turn on phone sign-in (with test numbers for development) and connect the app. Until then, the app runs in local preview mode.

### Web app

From the repository root, after `npm install`:

```bash
npm run dev --workspace @dreamer/web
```

Open http://localhost:3000. For now it shows a preview journey for a sample student, with the flight progress bar.
