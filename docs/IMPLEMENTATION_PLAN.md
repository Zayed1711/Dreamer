# Dreamer: implementation plan

**Audience:** the developer agent (Antigravity) building Dreamer from here on.
**Author:** the senior developer, writing the founder's decisions down as of 20 November 2026.
**How to use this file:**
1. Read sections 1 to 6 once. They describe the product, the code as it is, and the rules that apply to every task.
2. Then work through the phases in section 7 in order, one task at a time.
3. Each task lists the files to touch, what "done" means, and how to test it. A task is not done until its tests pass and its checks are met.

Also read `AGENTS.md` (short rules) and `docs/product-design.md` (the product decisions this plan builds on).

---

## 1. The product in one page

**Dreamer is a free study-abroad journey app for Bangladeshi students.** A student joins at any stage (HSC year 1 through to graduated), answers five questions, and gets a year-by-year plan ending on the day they fly abroad.

| Concept | What it means in the app |
|---|---|
| **Journey** | A dated plan built from the student's profile: phases containing milestones, each milestone containing tasks |
| **Milestone** | A step such as "Get your passport" or "IELTS Gate". It has tasks, a due window, help text, EXP, and optionally a stamp, a sponsored slot and an advisor topic |
| **EXP and level** | Every task earns EXP. Level = `floor(sqrt(EXP / 10)) + 1`. EXP is **never spent** and never goes down |
| **Dreamer ranks** | E → D → C → B → A → S-Rank Dreamer. A rank needs its **Rank-Up Gate** (named milestones); EXP alone never ranks you up |
| **Flight bar** | The main progress bar: a flight from the student's home airport (by division) to their destination airport. Rank stops E to S sit along the route. Status: on time, delayed, rerouting, holding |
| **Scam Shield / Scam Check** | A red-flag questionnaire about an agent or offer, plus a Spot-the-scam quiz. It earns the Scam Spotter stamp |
| **Sponsored slot** | A milestone may carry one labelled ad slot, **always shown with a free option beside it** |
| **Mentors** | Verified students who made it abroad. Later they run paid group sessions and keep 70% |

**Business model:** free for students. Revenue comes from labelled ads (agencies and IELTS providers that meet published standards) and paid advisor sessions. **We never take tuition commission.**

**Decided on 20 November 2026** (details in `docs/product-design.md`, "Learning layer"):
- **Daily quest:** a habit layer: one short practice quest a day, resetting at midnight Asia/Dhaka.
- **Founder's IELTS course:** recorded videos. Lessons **unlock at EXP milestones**.
- **Language tracks:** German and Japanese first. Others only when a fluent reviewer commits.
- **Sign-in:** moves to **email OTP with JWT sessions** (Supabase Auth). Phone OTP is dropped.
- **Founding Mentors:** friends abroad act as mentors, language reviewers and creators.

---

## 2. The code as it is today

### Repository layout

```
Dreamer/
├─ AGENTS.md                      short rules for agents (read first)
├─ CLAUDE.md                      graphify rules for Claude Code
├─ docs/
│  ├─ product-design.md           product decisions (source of truth for "why")
│  ├─ supabase-setup.md           how to create and connect Supabase
│  └─ IMPLEMENTATION_PLAN.md      this file
├─ content/journeys/              ALL journey content, as JSON data
│  ├─ milestones.json             30 milestones: tasks, EXP, help, stat, stamp, slot, advisorTopic
│  ├─ templates/*.json            3 journeys: when each milestone happens (anchor + offset)
│  ├─ ranks.json                  E..S ranks and their Rank-Up Gates
│  └─ airports.json               home airports by division, destination airports by country
├─ packages/journey-engine/       pure TypeScript, no UI, no network
│  ├─ src/generate.ts             generateJourney(profile, today) -> Journey
│  ├─ src/progress.ts             computeProgress(journey, completedTaskIds, today) -> Progress
│  ├─ src/content.ts              loads content/*.json, validateContent()
│  ├─ src/months.ts               month arithmetic ("YYYY-MM")
│  ├─ src/types.ts                all shared types
│  └─ test/engine.test.ts         24 tests (vitest)
├─ apps/web/                      Next.js 15 + React 19 + Tailwind 4, mobile-first web app (PWA later)
│  ├─ src/app/                    routes: / , /onboarding, /signin, /journey, /milestone/[key], /scam-check, /credits
│  ├─ src/components/             Dashboard, FlightBar, Flag, MilestoneIcon (+StatIcon), Plane, ui (PrimaryButton, ErrorLine)
│  ├─ src/lib/                    store.ts (all data access), student.ts (useStudent hook), supabase.ts,
│  │                              options.ts, slots.ts, scam.ts, photos.ts, format.ts, phone.ts
│  └─ public/destinations/        18 credited city photos (Wikimedia Commons)
└─ supabase/migrations/0001_init.sql   full schema with row-level security (NOT yet run anywhere)
```

### Commands

| Task | Command (from the repo root unless noted) |
|---|---|
| Install | `npm install` |
| Engine tests | `npm test` |
| Engine demo | `npm run demo` |
| Run the app | `npm run dev --workspace @dreamer/web`, then open http://localhost:3000 |
| Typecheck the app | `npm run typecheck --workspace @dreamer/web` |
| Lint the app | `npm run lint --workspace @dreamer/web` |
| Production build | `npm run build --workspace @dreamer/web` |
| Refresh the code graph | `graphify update .` (if graphify is installed; optional) |

### How data flows

1. **`useStudent()`** (`apps/web/src/lib/student.ts`) loads the profile and the completed task IDs through **`store.ts`**, then builds the journey with `generateJourney(profile, currentMonth())`.
2. **Screens** call `computeProgress(journey, completedTaskIds, today)` to get EXP, level, rank, plane position and flight status.
3. **Ticking a task** calls `setTaskDone(taskId, done, allCompleted)`. A task ID is `"milestoneKey.taskKey"`, for example `"passport.apply"`.
4. **`store.ts` is the only data layer.** With Supabase keys set and a user signed in, it uses Supabase tables. Otherwise it uses `localStorage` (**preview mode**). Never read or write Supabase or `localStorage` directly from a screen: add a function to `store.ts`.

### What works and what doesn't

| Area | Status |
|---|---|
| Journey engine and content | ✅ Done and tested |
| Onboarding (stage, path, English level, country, division → flight plan) | ✅ Done |
| Home: status, flight bar with photo, quest, next gate, coming up | ✅ Done |
| Milestone detail screen, sponsored slot plus free option | ✅ Done (no real ads yet) |
| Flight plan page | ✅ Done |
| Scam Check and the Scam Shield milestone | ✅ Done |
| Flags, icons, destination photos, credits | ✅ Done (18 countries including Poland) |
| Sign-in screen | ✅ Done: Google 1-Click OAuth + 6-digit Email OTP (Phase 1) |
| Supabase | ⚠️ Schema written but never run; no project connected; the data layer has never run against a real database |
| Streaks | ❌ Not built (the `streaks` table exists) |
| Daily quest, course, language tracks | ❌ Not built |
| Admin, ads, advisors, payments | ❌ Not built (tables exist) |
| Bangla text | ❌ English only. Content has an optional `bn` field |
| PWA install, Play Store | ❌ Not built |

---

## 3. Rules for every task

### 3.1 Workflow
1. **Before coding**, read the files you will change and the files that call them. If the graphify graph exists, `graphify query "<question>"` finds them faster.
2. **One task = one branch = one pull request.** Name branches `phase-N/short-name`, for example `phase-2/daily-quest`. Never commit straight to `main`.
3. **Small commits** with clear messages. Never commit `.env.local`, keys or tokens. Only `.env.example` with empty values belongs in git.
4. **Done means:** `npm test` passes, the app typechecks, lints and builds, and you checked the screen at **375 × 812** (a phone) in a browser. Say in the pull request what you tested and what you could not test.
5. **Ask the founder before:** adding a dependency, changing the business rules in section 4, deleting data or migrations, or changing anything in `docs/product-design.md`.

### 3.2 Code
- **TypeScript strict.** No `any` without a one-line comment saying why.
- **Logic goes in `packages/journey-engine`** as pure functions with vitest tests. This applies to anything that decides, scores, schedules or validates. Screens only display and call.
- **Content is data:** milestones, quests, word lists, lessons and scenarios live in `content/` JSON, not inside components. Extend `validateContent()` (or a sibling validator) for every new content file, and add a test that the shipped content validates.
- **One data layer:** add new reads and writes to `apps/web/src/lib/store.ts`, with both the Supabase path and the localStorage path.
- **Every new table gets row-level security** in a **new** migration file (`supabase/migrations/000N_name.sql`). Never edit `0001_init.sql`, because it may already be applied.
- **Never put the Supabase `service_role` key in the web app.** Anything that needs it runs in a Supabase Edge Function.
- **Comment only the "why".** No dead code, no "for later" options.

### 3.3 Design system: the "System" theme (approved; do not change the look)
The founder approved a restrained, game-like **"System window"** style. They rejected a glowing gradient version as "looking AI-generated" and a comic version as "too complex". Keep it this way:

- **Tokens:** in `apps/web/src/app/globals.css`, under `:root`. Use only these: `--bg`, `--window`, `--line`, `--line-soft`, `--accent` (#4db5ff, the **only** accent), `--text`, `--muted`. Status colours: green #4ade80, amber #fbbf24, red #f87171, used only for status. Rank colours come from `ranks.json` and appear only on rank marks.
- **Windows:** use the `.window` class for every card. Its **corner brackets appear only on hover, focus or tap**, like a game's selection cursor. Add `.window-active` to keep them on, for a selected option or a pop-up. Use `.window-title` for centred titles between two rules, and `.track` for thin progress bars.
- **Custom CSS goes inside `@layer components`**, so Tailwind utilities (such as `fixed`) can override it. This already caused one bug.
- **Fonts:** Chakra Petch (`font-title`) for titles, IBM Plex Mono (`font-mono`) for numbers and labels, IBM Plex Sans for body text.
- **Never use** gradients, glow, blur or glassmorphism, **emoji**, or rounded "bubbly" cards.
- **Icons:** `lucide-react`, `strokeWidth={1.5}`. Map milestones to icons in `MilestoneIcon.tsx`. **Flags:** `components/Flag.tsx`; add a country to its import list when needed.
- **Layout:** mobile-first, `max-w-md`, `px-4`. Keep each screen short: it should mostly fit a phone screen, so put detail on its own page.
- **Motion:** small and quick (≤ 220 ms), with a `prefers-reduced-motion` fallback.

### 3.4 Product rules that code must enforce
1. **Ads:** at most one sponsored slot per milestone. It is always labelled "Sponsored", always shown beside a free option, and never ranked above free options.
2. **Never call a business "verified" or "safe".** Say "meets our standards as of [date]".
3. **No EXP for clicking ads, and no EXP that can be bought.**
4. **EXP is never spent.** Unlocks happen at EXP thresholds.
5. **No leaderboards by scores or GPA.** If leaderboards ever exist, they rank effort, inside a squad only.
6. **Under-18s:** no public profiles and no chat with strangers.
7. **HSC exam season (the "holding" window):** daily quests become optional and streaks pause.
8. **Copyright:** every IELTS passage, prompt and quiz is **written by us**. Never copy Cambridge or IELTS test material. Photos must be openly licensed, saved in `apps/web/public/destinations/`, and added with their credit to `apps/web/src/lib/destination-photos.json` (shown on `/credits`).
9. **Student data:** advertisers see counts only, never names or phone numbers or emails. `ad_events` has no user ID by design.

---

## 4. Data model summary

Existing tables (`0001_init.sql`): `profiles`, `journeys`, `task_completions`, `streaks`, `advisors`, `advisor_sessions`, `bookings`, `payments`, `payouts`, `advertisers`, `ads`, `ad_events`, `scam_checks`, `reports`. All have row-level security. A trigger creates a `profiles` row on sign-up. `is_admin()` checks `profiles.role = 'admin'`.

New tables are added phase by phase below, each in its own migration file.

---

## 5. Decisions you must not reopen

These were settled by the founder. Build to them; don't propose alternatives unless something is impossible:
- Web app first (Next.js PWA). No Flutter.
- The System theme as in 3.3.
- The Dreamer rank names (E-Rank Dreamer … S-Rank Dreamer), never "hunter". Mechanics are inspired by Solo Leveling; never use its names, characters, art or catchphrases.
- The flight-bar progress concept.
- Free for students. Ads plus advisor sessions pay for it.
- Email OTP sign-in.
- Course lessons unlock by EXP. German and Japanese first.

---

## 6. Open questions (ask the founder; don't guess)

1. **AI checking** for writing quests: Google AI Studio free tier, or a small self-hosted model? Until decided, writing is checked by rules only (Phase 2).
2. **Where the course videos are hosted:** unlisted YouTube (free) or paid video hosting? (Phase 4)
3. **EXP thresholds for course lessons:** the plan proposes one lesson per 200 EXP. Confirm.
4. **Custom email sender for OTP:** which provider and domain? (Phase 1, needed before the pilot)
5. **Bangla:** who reviews translations? (Phase 9)

---

## 7. Phases and tasks

Work in this order. Each phase ends with a working, deployable app. **This order replaces the older "Build order" list in `docs/product-design.md`.** The founder moved the learning layer (daily quest, course, languages) ahead of admin, ads and advisor sessions, because retention comes first.

### Phase 0: Housekeeping (small)

**0.1 Commit the pending doc change.** `docs/product-design.md` has an uncommitted "Learning layer" section. Commit it on a branch together with this plan and `AGENTS.md`.

**0.2 Add a CI check.** Create `.github/workflows/ci.yml` that runs `npm ci`, `npm test`, and the web app's typecheck, lint and build on every pull request.
*Done when:* a pull request shows the checks passing.

---

### Phase 1: Email OTP sign-in and Supabase connection

**Needs from the founder:** a Supabase project URL and anon key in `apps/web/.env.local`, with email sign-in enabled. Follow `docs/supabase-setup.md`, updated in this phase.

**1.1 Switch sign-in from phone to email OTP**
- **Files:** `apps/web/src/app/signin/page.tsx`. Delete `apps/web/src/lib/phone.ts` and its import.
- **Flow:**
  1. Ask for the email address (`type="email"`, `autoComplete="email"`). Validate it lightly; Supabase does the real check.
  2. Call `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`.
  3. Show a 6-digit code input (keep the existing code UI, the resend timer and the friendly errors).
  4. Call `supabase.auth.verifyOtp({ email, token, type: "email" })`.
  5. Then keep the existing flow: `moveLocalProgressToAccount()`, then go to `/` if a profile exists, otherwise `/onboarding`.
- **Sessions are JWTs:** Supabase Auth issues and refreshes them. Don't build your own JWT handling. Row-level security uses `auth.uid()` from that JWT.
- **Supabase setting (document it):** by default, Supabase's email template sends a magic **link**. To send a **6-digit code**, edit the "Magic Link" email template in Authentication → Email Templates to include `{{ .Token }}`. Verify this against the current Supabase docs and write the exact steps into `docs/supabase-setup.md`.
- **Rate limit:** Supabase's built-in email sender is limited to a few emails per hour and is for testing only. Before the pilot, the founder must set up a custom SMTP sender (open question 4). Note this in the setup doc.
- **Rewrite `docs/supabase-setup.md` for email:**
  - Remove the phone provider and test-phone-number steps.
  - Add the email provider and template steps above.
  - Change the "make yourself an admin" SQL to find the user by email: `where id = (select id from auth.users where email = 'you@example.com')`.
- **Done when:** a real email address can sign in, sign out, and sign in again. A wrong code shows the friendly error. Preview-mode progress moves into the account on first sign-in.

**1.2 Run and verify the schema**
- Apply `0001_init.sql` to the Supabase project, as the founder or through the Supabase CLI.
- Write a short manual test script in `docs/supabase-setup.md`:
  1. Sign up and check that a `profiles` row exists.
  2. Finish onboarding, then check the `profiles` columns and that one active `journeys` row exists.
  3. Tick and untick a task, and check `task_completions`.
  4. Sign in as a second user and confirm that user can't read the first user's rows (row-level security).
- Fix any bug you find in `store.ts` or the SQL with a **new** migration, never by editing `0001`.
- **Done when:** all four checks pass, and the result is noted in the pull request.

**1.3 Record Scam Check results (optional, small)**
The `scam_checks` table exists but the app doesn't write to it. Add `saveScamCheck(answers, risk)` to `store.ts` (Supabase only; skip in preview mode) and call it from the result screen. This is useful for knowing which red flags appear most often.

---

### Phase 2: Daily quest (the habit layer)

**Goal:** one short practice quest every day, checked by rules, earning EXP and a daily streak. **This is the most important phase for retention.**

**2.1 Content: `content/quests/english/`**
- `words-level-1.json` … `words-level-N.json`: graded vocabulary lists. Each entry has `word`, a simple `meaning`, an example `sentence`, and optionally `bn`. Start with about 600 common academic and everyday words split into 6 levels (A2 → C1). **Write them originally**, or use a list with a licence that allows commercial use; record the source and licence in the file.
- `prompts.json`: "about me" sentence prompts by level, for example "Describe your hometown in 5 sentences". About 60 prompts.
- `dictionary/`: an English word list used to check that typed words are real. Use an openly licensed list (for example SCOWL size 50 or similar) and **put its licence in the repo**. Ship it compressed and load it only on the quest page.

**2.2 Engine: `packages/journey-engine/src/daily.ts`** (pure functions, with tests)
- `questDate(now: Date): string`: today's date in **Asia/Dhaka** (`YYYY-MM-DD`), using `Intl.DateTimeFormat` with `timeZone: "Asia/Dhaka"`. The quest resets at Dhaka midnight.
- `pickDailyQuest(date, level, seed)`: chooses the quest type and content **deterministically**, so the same student sees the same quest all day. Type rotation by level:
  - Levels 1–3: alternate "5 new words" and "5 sentences about me".
  - Levels 4–6: add "reading blanks" (Phase 4.3) once a week.
  - Later levels: add one writing task a week (see 2.5).
- `checkWords(input, { dictionary, alreadyLearned })` → `{ passed, problems[] }`:
  - exactly 5 entries;
  - each one a single word of letters;
  - each one in the dictionary;
  - no duplicates, and none already learned.
- `checkSentences(input, prompt)` → `{ passed, problems[] }`:
  - exactly 5 sentences;
  - each one at least 4 words;
  - each one starts with a capital letter and ends with `.`, `!` or `?`;
  - no duplicates;
  - not copied from the prompt (overlap under 60%).
- `nextStreak(prev, date, { holding })`: the daily streak. Doing today's quest extends it. A missed day uses a **freeze** if one is left, otherwise the streak resets to 0. On "holding" (HSC exam season) days the streak is paused, not broken.
- **Freezes:** both streaks (daily English and weekly journey) start with **2 freezes, refilled to 2 every 4 months** (one "term"). The refill date is stored in a new `streaks.freezes_reset_at date` column, added in migration `0002`. When `today >= freezes_reset_at + 4 months`, set `freezes_left = 2` and move `freezes_reset_at` forward.
- **Tests:** at least 15 cases (boundaries, Dhaka midnight, freezes, holding days, copied sentences).
- **Return problems as short sentences** the screen can show, for example "'recieve' isn't a word we know. Check the spelling."

**2.3 EXP from daily quests**
- A passed daily quest gives **20 EXP**.
- Add a **5th optional parameter** to `computeProgress`, after the existing `content` parameter: `computeProgress(journey, completedTasks, today, content = defaultContent, extraExp = 0)`. `extraExp` is the total EXP from daily quests and practice sets. It adds to `exp`, `level` and `stats.english`, and **does not** change rank, gates, `journeyPercent` or the plane position. Ranks still need gates. Existing callers keep working unchanged. Add tests.

**2.4 Data**
- **Migration `0002_daily_quests.sql`:**
  - `daily_quest_submissions (user_id, quest_date date, track text, quest_type text, payload jsonb, passed boolean, exp int, created_at)`. `track` is `'english'` or a language code (`'de'`, `'ja'`). **Primary key `(user_id, quest_date, track)`**, so each track scores at most once per Dhaka day. Row-level security: own rows only. Admins can read.
  - `activity_days (user_id, day date, primary key (user_id, day))`: one row per day the student did anything (ticked a task or passed a quest). It drives the weekly streak (Phase 3), and it survives unticking a task.
  - Add `freezes_reset_at date` to `streaks`. Use the existing `streaks` table (`kind = 'daily_english'` and `'weekly_journey'`).
- **`store.ts`:** add `loadDailyState()`, which returns today's submission, the streak, total extra EXP and the list of learned words, and `submitDailyQuest(...)`. Both need the localStorage path for preview mode.
- **Daily EXP cap:** 20 EXP per track per Dhaka day. That is 20 for English-only students, and 40 for a student with a language track. The primary key enforces it in the database, not just in the UI.
- **Preview mode:** store submissions under a localStorage key `dreamer-preview-daily` (keyed by date and track) and activity days under `dreamer-preview-activity` (a list of `YYYY-MM-DD`). Don't change the format of the existing `dreamer-preview-completed` key. Move both new keys into the account in `moveLocalProgressToAccount()`.

**2.5 Writing tasks (IELTS-style, later levels)**
- These are argumentative paragraphs, essays and bar-chart descriptions. Until AI checking is decided (open question 1), check only: **word count** in range, **paragraph count**, and that the text isn't copied from the prompt. Then show a **model answer** and a short **self-check list** based on the public IELTS band descriptor areas (task response, coherence, vocabulary, grammar).
- All prompts, charts and model answers must be original. Draw charts as simple SVGs from data in JSON.

**2.6 UI**
- **Home:** add a small "Daily quest" window above the Quest window. It shows today's quest type, a streak counter and a **Start** button. Done today → "Done ✓ · come back tomorrow".
- **New route `/daily`:** shows the quest, an input (5 text boxes, or one text area for sentences), a **Check** button, and the problems listed under the input. On pass, show the normal "+20 EXP" notification and save.
- **Holding days:** show "Exam season: optional today".
- **Done when:** a student can complete words and sentences quests for several days in preview mode and with Supabase; the streak counts correctly across Dhaka midnight; EXP shows on home; all engine tests pass.

---

### Phase 3: Streaks and reminders

**3.1 Weekly journey streak:** a week (Monday to Sunday, Dhaka time) counts if the student has at least one row in `activity_days` that week (in preview mode, `dreamer-preview-activity`). **Write an activity day** whenever a task is ticked or a quest is passed. Do this inside `setTaskDone` and `submitDailyQuest`, so every screen gets it. Compute the streak in the engine with tests, using the same freeze rules as 2.2. Show it in the status window, where "NEXT LV" currently sits.

**3.2 In-app reminders:** on home, a single line for the most urgent item, chosen in this order:
1. overdue required milestones (→ "Catch-up");
2. today's daily quest not done;
3. a fixed deadline within 30 days.

**3.3 Push notifications (later, optional):** web push via a service worker. Do this only after the PWA work in Phase 8.

---

### Phase 4: Founder's IELTS course (lessons unlocked by EXP)

**4.1 Content: `content/course/lessons.json`.** Each lesson has `id`, `title`, `section` (Reading / Writing / Listening / Speaking), `videoUrl`, `durationMin`, `unlockExp`, `summary`, and optionally `practiceId`.
- Proposed unlock rule: lesson *n* unlocks at **`n × 200` EXP**, with the first 2 lessons free. This needs the founder's confirmation (open question 3).
- The video host depends on open question 2. Build a small `<LessonVideo>` component that handles an unlisted YouTube embed. Keep it swappable.

**4.2 Engine:** `unlockedLessons(lessons, exp)` and `nextUnlock(lessons, exp)`, with tests.

**4.3 UI:**
- **New route `/course`:** a list of lessons grouped by section. Locked lessons show "Unlocks at 1,200 EXP · you have 860".
- **New route `/course/[id]`:** the video, summary, and a link to the practice set.
- **Home:** a one-line "Next lesson unlocks in 140 EXP" link.
- **Label it clearly as Dreamer's own course.** The "IELTS coaching" sponsored slot stays where it is.

**4.4 Reading practice:** original passages with fill-in-the-blank questions, auto-marked. Store them in `content/course/reading/*.json` (`passage`, `blanks[] {index, answer, alternatives[]}`). The marking function goes in the engine, with tests. A passed set gives 20 EXP through the same `extraExp` path, at most once per set.

**Note:** unlock checks run in the browser, which is fine while lessons are free. If lessons ever become paid, enforce unlocks on the server.

---

### Phase 5: Language tracks (German, then Japanese)

**5.1 Who gets a track:** students whose first target country is Germany (DE) get German, and Japan (JP) gets Japanese. Everyone keeps the English daily quest. Language quests are **extra**, and they appear on the same `/daily` screen as a second card.

**5.2 Content: `content/languages/de/` and `content/languages/ja/`.** Every language uses the same ladder:

| Level | Focus | Quest types |
|---|---|---|
| 1 | Alphabet and sounds (Japanese: hiragana, then katakana) | Match a character to its sound; listen and pick |
| 2 | Survival phrases | Phrase to meaning, multiple choice |
| 3 | Core words (about 300) | 5 words a day: meaning quiz |
| 4 | About me | Build or translate 3 simple sentences |
| 5 | Student life (housing, bank, university office) | Situation multiple choice |
| 6 | Test-ready basics (German A1/A2; JLPT N5 for Japanese) | Mixed quiz |

- **Every content file has `reviewedBy` and `reviewedAt`.** **Content without a review is hidden in production** and shown in development only. The reviewers are the Founding Mentors (a German and a Japanese speaker).
- Quizzes are **auto-marked** (multiple choice and matching), so this phase needs no AI checking.

**5.3 Pronunciation:** use the browser's built-in `window.speechSynthesis` with `lang: "de-DE"` and `"ja-JP"`. If no voice exists for that language, hide the play button. Don't add a paid text-to-speech service.

**5.4 Engine:** a generic `pickLanguageQuest(lang, level, date)` and `markQuiz(answers, key)`, with tests. Language progress is stored per language (migration `0003_language_progress.sql`, own rows only).

**Done when:** a Germany-bound student sees a German card on `/daily`, can pass level 1 and level 2 quizzes, and earns EXP. Unreviewed content doesn't appear in a production build.

---

### Phase 6: Mentors (Founding Mentors first)

**6.1 Mentor profiles:**
- **New route `/mentors`:** a list filtered by the student's target country. Each card shows the photo, name, university, country, subject and topics, plus a "Founding Mentor" badge.
- **`/mentors/[id]`:** the profile, plus content they made or reviewed.
- Use the `advisors` table (`status = 'approved'` only). **Never show the proof document.**

**6.2 Apply as a mentor:** an `/advisor/apply` form that writes an `advisors` row with `status = 'pending'` and uploads the proof to a **private** Supabase storage bucket. Only admins can read the bucket.

**6.3 Link mentors from milestones:** the "Advisor sessions" box on the milestone screen lists approved mentors whose topics match `advisorTopic`. It still says "No sessions open yet" until Phase 7.

---

### Phase 7: Admin panel, ads, advisor sessions and payments

**7.1 Admin area `/admin`** (only `profiles.role = 'admin'`; check on every page and rely on row-level security):
- **Advisors:** review the proof, approve or reject, and delete the proof file 30 days after verification.
- **Advertisers:** add an advertiser, record `standards_accepted_at`, suspend or remove.
- **Ads:** create an ad for a slot (`slot` matches the milestone slot keys in `apps/web/src/lib/slots.ts`) with targeting by stage, country and English level, plus dates and a referral code.
- **Content review queue:** list language and quest content without `reviewedBy`.
- **Reports:** counts of active students by stage, ad views and clicks per ad, and the most common Scam Check red flags.

**7.2 Show real ads:** on the milestone screen, replace "No sponsor in this slot yet" with the matching active ad (one at most). Record `view` and `click` in `ad_events` **without a user ID**. The free option stays below it.

**7.3 Advisor sessions:** mentors create sessions (2 a week, at most 25 seats, a price, a Meet/Zoom link). Students book. Seat limits are already enforced by the `enforce_capacity` trigger.

**7.4 Payments:** bKash, Nagad or SSLCommerz, **through Supabase Edge Functions only**. Write `payments` rows on the server; confirm bookings on a verified callback. Use the payment provider's **sandbox** until the founder approves going live. Payouts at 70% are marked paid by an admin.

---

### Phase 8: PWA and Play Store

- Add `app/manifest.ts` (name, icons, theme colour `#05080f`, `display: "standalone"`) and a service worker for offline caching of the shell and content JSON.
- Test "Add to Home Screen" on Android Chrome.
- Package it for the Play Store as a Trusted Web Activity (Bubblewrap). This needs a domain and Digital Asset Links. Ask the founder first.

---

### Phase 9: Bangla

- The content already allows `{ en, bn }`. Add a language switch in the profile (`profiles.language` already exists).
- Add a UI string file for both languages.
- Add a Bangla font (for example Noto Sans Bengali) next to the current fonts.
- A Bangla speaker reviews everything before release.

---

## 8. Known issues and debt (fix when you touch the area)

| # | Issue | Where |
|---|---|---|
| 1 | Rank-up and level-up pop-ups appear only on home. The milestone screen shows only "+EXP" | `Dashboard.tsx`, `milestone/[key]/page.tsx`: move pop-up logic into a shared hook or component |
| 2 | Toggle logic is duplicated on home, the milestone screen and Scam Check | Same: one shared `useTaskToggle()` hook |
| 3 | Weak-English HSC students get IELTS in January, after applications open in October: workable but tight | `content/journeys/templates/hsc-bachelors-abroad.json`: content decision, ask the founder |
| 4 | The free-option links in `slots.ts` haven't been checked recently | Open each link and fix any that fail |
| 5 | Graphify's hooks in `.claude/settings.json` point to a Windows path on the founder's computer | Ignore unless you use Claude Code |
| 6 | No Bangla content | Phase 9 |
| 7 | The SQL schema isn't in the code graph (graphify's SQL parser isn't installed) | Harmless |

---

## 9. Definition of done (every pull request)

- [ ] `npm test` passes; new logic has tests in `packages/journey-engine/test/`.
- [ ] The web app typechecks, lints and builds (`npm run typecheck|lint|build --workspace @dreamer/web`).
- [ ] Checked by hand at 375 × 812 in a browser, in preview mode and (from Phase 1 on) with Supabase.
- [ ] The look follows section 3.3: no new colours, gradients, glow or emoji.
- [ ] No secrets in the diff. New tables have row-level security in a new migration.
- [ ] The pull request says what changed, how it was tested, and what was **not** tested.
- [ ] `docs/` is updated if behaviour or setup changed.
