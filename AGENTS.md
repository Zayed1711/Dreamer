# Rules for agents working on Dreamer

Read this first, then `docs/IMPLEMENTATION_PLAN.md` (the full plan and task list) and `docs/product-design.md` (the product decisions).

## What this is
Dreamer is a free study-abroad journey app for Bangladeshi students: a year-by-year plan, gamified with Dreamer ranks (E → S) and a flight progress bar. It is an npm workspace monorepo:

- `packages/journey-engine`: pure TypeScript logic, with vitest tests.
- `apps/web`: the Next.js 15 web app.
- `content/`: all content as JSON.
- `supabase/migrations`: the database schema.

## Commands
- `npm install`
- `npm test`: engine tests
- `npm run dev --workspace @dreamer/web`: the app at http://localhost:3000
- `npm run typecheck --workspace @dreamer/web`, `npm run lint --workspace @dreamer/web`, `npm run build --workspace @dreamer/web`

## Always
- Work on a branch (`phase-N/short-name`) and open a pull request. Never commit to `main` directly.
- Put logic in `packages/journey-engine` with tests. Put content in `content/` JSON. Screens only display and call.
- All data access goes through `apps/web/src/lib/store.ts`, with a Supabase path and a localStorage (preview mode) path.
- Every new table goes in a **new** migration with row-level security. Never edit `0001_init.sql`.
- Check every screen at 375 × 812.
- Before finishing, run the tests, typecheck, lint and build, and say what you could not test.

## Never
- Change the look. Keep the approved "System" theme: one accent colour (#4db5ff), `.window` cards whose corner brackets show on hover or focus, Chakra Petch, IBM Plex Mono and IBM Plex Sans fonts, lucide icons. **No gradients, glow, blur or emoji.**
- Commit `.env.local`, keys or tokens, or use the Supabase `service_role` key in the web app.
- Copy IELTS or Cambridge test material, or use unlicensed images.
- Give EXP for clicking ads, let EXP be bought or spent, or rank students by scores.
- Call any business "verified" or "safe".
- Add a dependency, change a business rule or delete data without asking the founder.
