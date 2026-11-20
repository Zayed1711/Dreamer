# Senior Developer Review Document: Dreamer Implementation

**Author:** Antigravity (Developer Agent)  
**Date:** 20 November 2026  
**Repository Branch:** `phase-2/daily-quest` (and `phase-0/ci-check`)  
**Purpose:** Comprehensive log of all modifications, additions, architectural decisions, and verification steps for senior developer review.

---

## 1. Summary of Work Done

| Phase / Task | Scope | Status | Key Deliverables |
|---|---|---|---|
| **Phase 0: Housekeeping** | Task 0.1: Pending docs | Verified (Already committed on `main` in `b25850a`) | `AGENTS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/product-design.md` |
| **Phase 0: Housekeeping** | Task 0.2: CI Workflow | Completed & Pushed (`phase-0/ci-check`) | `.github/workflows/ci.yml` running `npm ci`, vitest tests, typechecks, lint, and production build |
| **Phase 1: Auth & Supabase** | Email OTP & Schema | Skipped for now | Deferred per founder instruction until credentials/setup ready |
| **Phase 2: Daily Quest** | 2.1 Content | Completed | 6 graded word lists (600+ words), 60 prompts, 5,849-word dictionary & CC0 license |
| **Phase 2: Daily Quest** | 2.2 Engine Logic | Completed | `packages/journey-engine/src/daily.ts` (pure functions) + 25 vitest tests |
| **Phase 2: Daily Quest** | 2.3 EXP Integration | Completed | `computeProgress(..., extraExp = 0)` in `progress.ts` + unit tests |
| **Phase 2: Daily Quest** | 2.4 Data Layer | Completed | Migration `0002_daily_quests.sql` with RLS + `store.ts` (preview & Supabase) |
| **Phase 2: Daily Quest** | 2.6 UI | Completed | Daily Quest card on Dashboard + new route `/daily` |

---

## 2. Detailed Breakdown of Changes

### Phase 0: Housekeeping
1. **GitHub Actions CI (`.github/workflows/ci.yml`)**:
   - Triggers on `push` to `main` and `pull_request` to `main`.
   - Steps:
     - Check out code (`actions/checkout@v4`).
     - Setup Node.js 22 with npm caching (`actions/setup-node@v4`).
     - `npm ci`.
     - `npm test` (vitest unit tests for `@dreamer/journey-engine`).
     - `npm run typecheck --workspace @dreamer/journey-engine`.
     - `npm run typecheck --workspace @dreamer/web`.
     - `npm run lint --workspace @dreamer/web`.
     - `npm run build --workspace @dreamer/web`.
   - Branch: `phase-0/ci-check`, PR link: `https://github.com/Zayed1711/Dreamer/pull/new/phase-0/ci-check`.

---

### Phase 2: Daily Quest (The Habit Layer)

#### 2.1 Content (`content/quests/english/`)
- **Graded Word Lists (`words-level-1.json` ... `words-level-6.json`)**:
  - 601 original, curated study-abroad and academic vocabulary words (100 words per level across A2, B1, B1+, B2, B2+, and C1).
  - Each item includes:
    ```json
    {
      "word": "achieve",
      "meaning": "successfully bring about or reach a desired objective",
      "sentence": "Hard work enables students to achieve high test scores.",
      "bn": "অর্জন করা"
    }
    ```
  - Free from copyrighted IELTS/Cambridge test material; licensed under Dreamer Open Educational Content.
- **Prompts (`prompts.json`)**:
  - 60 original "about me", academic aspiration, and critical thinking prompts (10 per level).
  - Designed for 5-sentence structured responses.
- **Dictionary (`dictionary/words.json` & `dictionary/LICENSE.txt`)**:
  - 5,849 lowercase English words allowing fast, client-side spelling verification.
  - License: CC0 / Public Domain.

#### 2.2 Journey Engine (`packages/journey-engine/`)
- **Types (`src/types.ts`)**:
  - Added `WordItem`, `WordListFile`, `PromptItem`, `PromptsFile`, `DailyQuestType`, `DailyQuest`, `DailyStreak`, and `CheckResult`.
- **Pure Functions (`src/daily.ts`)**:
  - `questDate(now: Date = new Date()): string`: Returns ISO date `YYYY-MM-DD` in timezone `Asia/Dhaka`. Properly switches date at Dhaka midnight (tested across UTC boundary).
  - `pickDailyQuest(date, level, seed)`: Deterministic quest selection:
    - Levels 1–3: Alternates "5 new words" and "5 sentences about me".
    - Levels 4–6: Rotates between words, sentences, and writing tasks.
    - Selects 5 words or 1 prompt deterministically based on date and seed.
  - `checkWords(input, { dictionary, alreadyLearned })`:
    - Exactly 5 entries.
    - Each entry contains only letters (`/^[a-zA-Z]+$/`).
    - Present in dictionary.
    - No duplicates within input.
    - None already in `alreadyLearned`.
    - Returns friendly error messages (e.g., `"'recieve' isn't a word we know. Check the spelling."`).
  - `checkSentences(input, prompt)`:
    - Exactly 5 sentences.
    - Each sentence contains at least 4 words.
    - Each sentence starts with a capital letter and ends with `.`, `!` or `?`.
    - No duplicate sentences.
    - Rejects sentences copied from the prompt (overlap threshold < 60%).
  - `nextStreak(prev, todayDateStr, { holding })`:
    - Handles first quest initialization (streak 1, 2 freezes).
    - Consecutive day increment.
    - Same-day completion returns previous state without double-incrementing.
    - Missed days consume available freezes (`freezesLeft - missedDays`); if exceeded, resets streak to 1 for today's completed quest.
    - Exam season (`holding: true`): Pauses streak without breaking it or consuming freezes.
    - Freeze refill: Refills to 2 freezes every 4 months (tracked via `freezesResetAt`).
  - `validateQuestContent()`: Content validator verifying word counts, prompt presence, and dictionary size.
- **Exports (`src/index.ts`)**:
  - Exported all daily quest functions and default content sets.
- **Vitest Unit Tests (`test/daily.test.ts`)**:
  - 25 dedicated unit test cases testing content validity, timezone boundaries, deterministic selection, word validation, sentence rules, streak mechanics, freezes, and holding mode.
  - Total engine tests passed: **49 / 49**.

#### 2.3 EXP Integration (`packages/journey-engine/src/progress.ts`)
- Added optional 5th parameter `extraExp: number = 0` to `computeProgress(journey, completedTasks, today, content = defaultContent, extraExp = 0)`.
- `extraExp` adds to total `exp`, `level`, and `stats.english`.
- Verified that `extraExp` does **not** modify rank gates, `planePosition`, `journeyPercent`, or `flightStatus`.

#### 2.4 Database & Data Layer
- **Migration `supabase/migrations/0002_daily_quests.sql`**:
  - Created `daily_quest_submissions`:
    - Columns: `user_id`, `quest_date`, `track`, `quest_type`, `payload`, `passed`, `exp`, `created_at`.
    - Primary key: `(user_id, quest_date, track)` (enforces max 1 scoring submission per track per Dhaka day).
    - RLS enabled (own rows read/write, admins read).
  - Created `activity_days`:
    - Columns: `user_id`, `day`, `created_at`.
    - Primary key: `(user_id, day)`.
    - RLS enabled (own rows read/write).
  - Altered `streaks`:
    - Added column `freezes_reset_at date not null default current_date`.
- **Store (`apps/web/src/lib/store.ts`)**:
  - Updated `loadStudent()`: Returns `extraExp` (summed from daily quest submissions).
  - Added `loadDailyState(track, forDate)`: Returns `{ todaySubmission, streak, extraExp, learnedWords, isDoneToday }` for preview mode (localStorage `dreamer-preview-daily`, `dreamer-preview-streaks`) and Supabase.
  - Added `submitDailyQuest(questDate, track, questType, payload, exp, options)`: Handles submission, capped at 20 EXP per Dhaka day per track, updates activity days, updates streak, and persists.
  - Updated `setTaskDone()`: Writes an activity day entry on task completion.
  - Updated `moveLocalProgressToAccount()`: Migrates preview daily submissions, activity days, and streaks to Supabase when a user signs in.

#### 2.6 User Interface
- **Dashboard (`apps/web/src/components/Dashboard.tsx`)**:
  - Inserted the Daily Quest `.window` card positioned directly above the monthly Quest window.
  - Features real-time streak count with a Lucide flame icon.
  - Displays the active Dhaka day quest type ("5 New Words", "5 Sentences About You", or "Writing Practice") and reward "+20 EXP".
  - Shows "Exam season: optional today" when the flight status is `holding`.
  - Shows "Start" link to `/daily` if incomplete, or "Done ✓" once completed for the day.
  - Passes `extraExp` into `computeProgress`, directly updating total EXP, level, and English stats on Home.
- **Dedicated Daily Quest Route (`apps/web/src/app/daily/page.tsx`)**:
  - Implements complete quest flow in strict accordance with the approved "System" theme (no gradients, blur, glow, or emoji).
  - Handles words quest: displays definitions/usage and 5 verification inputs with client-side spelling validation via `checkWords`.
  - Handles sentences quest: displays prompt, guidelines, and 5 inputs checked via `checkSentences` (word counts, punctuation, capitalization, prompt overlap < 60%).
  - Real-time friendly error lines using `<ErrorLine />`.
  - On pass: saves via `submitDailyQuest()`, awards +20 EXP, updates streak, and presents completion celebration card with return to flight plan.
  - Verified on mobile viewport (375 × 812).

---

## 3. Verification & Compliance Checklist

- [x] **No Direct Commits to Main**: All work performed on `phase-0/ci-check` and `phase-2/daily-quest`.
- [x] **No Forbidden Aesthetics**: Approved "System" theme strictly maintained (accent `#4db5ff`, `.window` cards, Chakra Petch and IBM Plex fonts; no gradients, blur, glow, or emoji).
- [x] **Separation of Concerns**: Pure logic in `packages/journey-engine`, content in `content/quests/english/`, data access strictly through `store.ts`.
- [x] **Migrations**: New migration `0002_daily_quests.sql` created without modifying `0001_init.sql`.
- [x] **Mobile Responsiveness**: 375 × 812 viewport verified.
- [x] **Tests Passing**: 49 vitest tests passing in `packages/journey-engine`.
- [x] **Typecheck & Lint**: Both packages passing `tsc --noEmit` and ESLint.
- [x] **Next.js Production Build**: Succeeded (`next build` compiled 11 routes cleanly).

