# Dreamer: product design

Decisions as of 19 November 2026. The longer background, including the market, partners and risks, is in the "Study Abroad Journey Tracker: Revised Plan and Partnership Strategy" document. The business model below replaces that document's subscription and partner-licence model.

## Business model

- **Free for students.** There is no subscription.
- **Ads.** Agencies and IELTS or English course providers buy labelled "Sponsored" slots attached to journey milestones, targeted by stage, country and English level. They are sold as a flat monthly fee per slot. Every ad carries a referral code so that results can be measured without sharing student data.
- **Advisor sessions.** Verified students who have made it abroad run online group sessions: 2 a week, at most 20–25 students each, at a low price. The advisor keeps 70% (a placeholder) and the platform keeps 30%.
- We never take commission on tuition. We don't sell other providers' courses. The founder's own IELTS course is **free, with lessons unlocked by EXP** (see "Learning layer").

### Trust rules

1. At most one sponsored slot per milestone. It is always labelled and always shown next to a free alternative.
2. Advertisers accept the published standards. The app says "meets our standards as of [date]", never "verified" or "safe".
3. No payment changes a milestone, advice, scam-check result or ordering.
4. Advisors take no commission from agencies or universities, give no guarantees and take no payments outside the app.

## Users

| User | Where |
|---|---|
| Student | Mobile app |
| Advisor (Mentor) | Mobile app, with advisor screens after verification |
| Advertiser | Managed by the admin at first; no self-service |
| Admin | Web admin panel |

## Journeys

There are three journeys, all ending in a shared application stage. They are defined as data in `content/journeys/`.

| Key | Journey | Entry stages |
|---|---|---|
| `hsc-bachelors-abroad` | J1: HSC → bachelor's abroad | HSC 1, HSC 2, after HSC |
| `hsc-bachelors-home` | J2: HSC → bachelor's at home, then moves into J3 | HSC 1, HSC 2 |
| `ug-masters-abroad` | J3: undergraduate → master's abroad | UG 1–4, graduated |

Dates come from **anchors**: HSC exam, HSC result, graduation, target intake and the journey start. The milestone library says *what* a milestone is. The template says *when* it happens. Fixed milestones (exams, deadlines) never move. Flexible ones move when a student falls behind.

### Adjustment rules

| Input | Effect |
|---|---|
| English self-rating "beginner" (below about 5.5) | Adds `english_foundation` (3 months) and pushes IELTS coaching and the test 3 months later |
| A US target | Adds SAT preparation (bachelor's) or GRE preparation (master's) |
| HSC exam season | "Holding pattern" quiet mode for the 3 months before the exam |
| Too little time before the intake | Status becomes `rerouting`, with a later intake suggested |
| A required milestone whose window has already passed when the student joins | Rescheduled to start now |
| An optional milestone whose window has already passed | Dropped |

## Gamification: Dreamer ranks

| Rank | Title | Rank-Up Gate |
|---|---|---|
| E | E-Rank Dreamer | The start |
| D | D-Rank Dreamer | Profile done, first quest, English habit, passport, document folder |
| C | C-Rank Dreamer | IELTS Gate: test taken and score logged (any score) |
| B | B-Rank Dreamer | Shortlist, documents, statement draft, referees |
| A | A-Rank Dreamer | Application Raid: applications submitted |
| S | S-Rank Dreamer | Visa Gate: offer accepted and visa granted, which unlocks the boarding pass |
| — | Mentor | An S-Rank Dreamer who becomes a verified advisor |

- **EXP and levels:** tasks earn EXP. The level is shown inside the rank, for example "C-Rank Dreamer · Lv. 27". A rank needs its gate; EXP alone is never enough.
- **Stats:** English, Academics, Documents, Profile and Funding.
- **Streaks:** a weekly journey streak (with 2 freezes a term) and a daily English quest streak.
- **System-style notifications:** "[Quest received]", "[RANK UP]".
- **Inspiration:** the mechanics are inspired by Solo Leveling. We never use its names, characters, art or catchphrases.

### Safety rules

- No EXP for clicking ads.
- No EXP that can be bought.
- No ranking by scores or GPA. Leaderboards are inside a squad only and based on effort.
- No penalties that take EXP away.
- For students under 18: no public profiles, no chat with strangers, and squads by invite code only.

## Flight progress bar

The main progress bar is a flight from the student's home airport in Bangladesh (DAC, CGP, ZYL and others, chosen by district) to the destination airport. The rank stops E → S sit along the route. The plane's position is the share of required EXP completed, so it does not move with time alone.

| Plan state | Flight status |
|---|---|
| On track | `on_time` |
| A required milestone is overdue | `delayed`, with a catch-up quest |
| The intake can no longer be reached | `rerouting` |
| HSC exam quiet window | `holding` |

At S-Rank the boarding pass unlocks. After the visa, the flight lands, and the student is invited to become a Mentor.

## Learning layer (decided 20 November 2026)

- **The daily quest is a habit layer,** not a course: one short quest a day, resetting at midnight Bangladesh time. Early levels are 5 new words or 5 sentences about yourself. Later levels add IELTS-style tasks (reading blanks, essays, chart descriptions) once or twice a week. Checking is rule-based at first; AI checking (Google AI Studio free tier or a small self-hosted model) is to be decided later.
- **The founder's own IELTS course** (recorded videos) is a separate section. **Lessons unlock at EXP milestones.** EXP is never spent, so levels never go down. The course is labelled as Dreamer's own, and the IELTS coaching ad slot stays.
- **Language tracks** for non-English destinations, alongside English: **German and Japanese first**, then Korean, Chinese and Polish if Founding Mentors commit to reviewing. Every language follows the same ladder: alphabet, survival phrases, core words, about me, student life, test-ready basics. Pronunciation uses the browser's built-in speech, at no cost.
- **Founding Mentors:** friends abroad (Germany, Japan, Korea, China, Poland, Australia; Finland unconfirmed) as mentors, language reviewers and creators, under the same advisor rules and verification.

## Technology

| Part | Choice |
|---|---|
| App | Next.js web app, installable as a PWA, mobile-first. Student, advisor and admin screens in one codebase. Play Store later as a TWA wrapper |
| Backend | Supabase (Postgres, row-level security, storage, edge functions) |
| Sign-in | **Email OTP** with JWT sessions (Supabase Auth issues JWTs). Decided 20 Nov 2026; replaces phone OTP, so no SMS cost. Not built yet: the current sign-in screen still asks for a phone number |
| Journey engine | TypeScript package, imported directly by the web app |
| Push | Web push (Android), via Firebase Cloud Messaging |
| SMS | Not needed for sign-in. A Bangladeshi SMS gateway only if SMS reminders are added later |
| Payments | bKash / Nagad / SSLCommerz, for session fees only |
| Video | Google Meet or Zoom links |

## Build order

> **Replaced on 20 November 2026** by the phases in `docs/IMPLEMENTATION_PLAN.md`, which put the learning layer before admin, ads and advisor sessions. The list below is kept for history.


1. Journey engine and content (this setup)
2. Student app: onboarding, journey, tasks, flight bar, reminders
3. Scam check
4. Admin: journeys and ads
5. Ad slots and view/click tracking
6. Advisors: apply, verify, sessions, booking, payment
7. Payouts and advertiser reports
