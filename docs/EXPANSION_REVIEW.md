# Senior Developer Review: WayPoint Platform Architecture & Expansion Master Plan

**Document:** `docs/EXPANSION_REVIEW.md`  
**Author:** Antigravity (Developer Agent)  
**Date:** 21 November 2026  
**Status:** Under Senior Review (Architectural Alignment & Planning Phase)  
**Branch:** `feature/country-guides-and-scholarships`  
**Domain:** `waypointbd.com`  
**Reference Docs:** [AGENTS.md](file:///e:/Dreamer/AGENTS.md), [IMPLEMENTATION_PLAN.md](file:///e:/Dreamer/docs/IMPLEMENTATION_PLAN.md), [DEV_REVIEW.md](file:///e:/Dreamer/docs/DEV_REVIEW.md)

---

## 1. Executive Summary & The Big Picture

The platform is officially rebranded to **WayPoint** (`waypointbd.com`) with the core motto:
> *"No dream is too big and no dreamer is too small"* (from *Turbo*)

The platform operates as a dual-engine ecosystem designed to capture, guide, and monetize the study-abroad journey for Bangladeshi students:

```
+-----------------------------------------------------------------------------------+
|                           WAYPOINT ECOSYSTEM (waypointbd.com)                     |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ PUBLIC DISCOVERY PORTAL (SEO Top-of-Funnel) ]                                  |
|  - 18 Country Hubs (Tuition in BDT, Dhaka VFS timelines, PSW rights)             |
|  - University Search & Application Timelines (Budget in BDT filter, CGPA/IELTS)   |
|  - Scholarship & Tuition Waiver Finder (DAAD, Chevening, MEXT, UGC Hungary)       |
|  - Common FAQs & Official Document Checklists                                     |
|  - Airport-Style Flight Information Display (FIDS) Tickerboard Ads                |
|                                     |                                             |
|                                     v ("Start My Journey")                        |
|                                                                                   |
|  [ PERSONAL JOURNEY TRACKER (Mobile PWA & Desktop) ]                              |
|  - Rank E -> S Progression & Flight Progress Bar                                  |
|  - Active Milestone Action Plan (One step at a time)                              |
|  - Daily Habit Engine (Vocab, Sentence Drills, IELTS Course, German/Japanese)     |
|  - Stage-Specific Milestone Contextual Sponsor Cards (Banks, IELTS Centres)       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Platform Architecture: Unified Next.js 15 Monorepo (Option A)

By founder decision, the platform adopts **Option A: A Unified Responsive Web App + Installable PWA** within the current npm workspace monorepo:

* **Single Codebase Efficiency**: Avoids maintaining separate web, iOS, and Android codebases. Zero App Store approval friction, zero 30% in-app transaction cuts.
* **Public Discovery (`waypointbd.com`)**: Next.js 15 Server-Side Rendered (SSR) and statically generated routes for maximum Google SEO ranking across Bangladesh for study-abroad queries.
* **Mobile Journey Tracker (PWA)**: When students log in or click *"Start My Journey"*, they access the interactive journey tracker. On iOS and Android, a prompt offers *"Install WayPoint to Home Screen"*, enabling standalone fullscreen execution, local caching, and offline support.

---

## 3. Monorepo Alignment & Strict Guardrails

All proposed developments strictly adhere to the fundamental rules defined in [AGENTS.md](file:///e:/Dreamer/AGENTS.md):

* **Pure Engine Separation**: All business logic (filtering, ranking, cost estimation, match scoring) resides in `packages/journey-engine` with 100% Vitest unit test coverage.
* **Content Layer**: All static destination, university, scholarship, and FAQ data resides in `content/` JSON files.
* **Data Access Layer**: All state, session bookings, and telemetry route through `apps/web/src/lib/store.ts` (with Supabase and `localStorage` preview fallback).
* **Approved "System" Theme**: 
  * Primary Accent: `#4db5ff`.
  * Cards: `.window` containers with responsive corner brackets.
  * Typography: Chakra Petch, IBM Plex Mono, IBM Plex Sans.
  * Icons: Lucide icons only.
  * **Zero gradients, glow, blur, or emoji.**
* **Ethical Guardrails & Anti-Deception**:
  * Never label any commercial partner or bank as "verified" or "safe" — always state *"Meets our standards as of [Date]"*.
  * Commercial ad placements must clearly carry the `[SPONSORED]` tag.
  * Free official alternatives (e.g., Bangladesh Bank guidelines) must permanently appear directly below every commercial offer.
  * Zero EXP awarded for ad engagement.
  * Privacy-first: Telemetry records anonymous view/click counts in `ad_events` without student PII.

---

## 4. UI Simplification: The 3-Hub Information Architecture

### 4.1 Problem
The current dashboard on mobile (375 × 812 viewport) has become vertically cluttered with rank cards, flight bars, milestone checklists, streak alerts, IELTS lessons, and language quests competing for attention.

### 4.2 The 3-Hub Model
The user interface is streamlined into three primary hubs accessible via a top navigation bar:

1. **Journey (Action-Oriented)**:
   * Rank status (Rank E → S) and Flight Progress Bar.
   * Single active milestone card with immediate daily tasks.
   * Progressive disclosure: Future milestones are collapsed under *"Upcoming Flight WayPoints"* to eliminate cognitive overload.
2. **Prep (Daily Habit)**:
   * Daily Quest (Graded vocabulary & sentence builders).
   * Language Ladder (German & Japanese pronunciation tracks).
   * Founder's IELTS Course (Video modules and reading comprehension tests).
3. **Explore (Public Discovery & Mentorship)**:
   * Country Hubs (`/countries`).
   * University Search & Timelines (`/universities`).
   * Scholarship Finder (`/scholarships`).
   * Founding Mentors Directory (`/mentors`).

### 4.3 Mobile Viewport Wireframe (375 × 812)
```
+------------------------------------------+
| [WAYPOINT]                  [RANK C] [✈] |
| "No dream is too big..."                 |
|------------------------------------------|
| [ JOURNEY ]    [ PREP ]    [ EXPLORE ]   |
|==========================================|
|                                          |
| ACTIVE WAYPOINT                          |
| +--------------------------------------+ |
| | [STAGE: AFTER HSC]                   | |
| | Standardized Tests & Language Prep   | |
| | Progress: 2 of 4 tasks complete      | |
| |                                      | |
| | [x] Register for IELTS test date     | |
| | [ ] Complete 5 practice mock tests   | |
| | [ ] Order official score report      | |
| |                                      | |
| | [CONTINUE TASK ->]                   | |
| +--------------------------------------+ |
|                                          |
| RECENT ACTIVITY & STREAK                 |
| +--------------------------------------+ |
| | Streak: 4 Weeks Active  |  EXP: +120 | |
| +--------------------------------------+ |
|                                          |
| [v] View All 8 Flight WayPoints          |
+------------------------------------------+
```

---

## 5. Public Discovery Portal: Country Hubs & FAQs

### 5.1 Architecture (`waypointbd.com/countries/[code]`)
Each of the 18 destination countries is rendered as an authoritative Country Hub featuring 5 dedicated tabs:

1. **Overview & Viability**: Target degree types, language requirement overview, tuition overview in BDT, and post-study work (PSW) visa rules.
2. **Document Required Checklist**: Attestation path (Board → Education Ministry → Foreign Ministry → Embassy), translations, police clearance, and notarization.
3. **Blocked Account & Banking**: Exact requirements (e.g., German Sperrkonto €11,904 ~ 15.5 Lakh BDT), approved providers (Expatrio, Coracle, Fintiba), and Bangladeshi Authorized Dealer bank student file rules.
4. **Universities & Intakes**: Direct integration with the University Search engine pre-filtered for this destination.
5. **Common FAQs & Embassy Reality**: Realistic appointment waiting times at VFS Dhaka, bank statement aging requirements, interview tips, and visa refusal mitigation.

### 5.2 Destination Coverage (18 Countries)
* **Europe**: Germany (DE), United Kingdom (GB), Finland (FI), Sweden (SE), Netherlands (NL), Ireland (IE), Hungary (HU), Italy (IT), France (FR), Poland (PL).
* **North America & Oceania**: United States (US), Canada (CA), Australia (AU), New Zealand (NZ).
* **Asia**: Japan (JP), Malaysia (MY), South Korea (KR), China (CN).

---

## 6. University Search & Application Timelines Engine

### 6.1 Interactive Search Filters (Including Budget in BDT)
The search interface is designed specifically for Bangladeshi applicant realities:

* **Budget in BDT Filter (Founder Mandate)**:
  * `Free / Low (< 2 Lakh BDT/yr)`: German public universities, Italian regional DSU waivers, Hungarian Stipendium.
  * `Moderate (5 - 15 Lakh BDT/yr)`: Asian hubs (Malaysia, China), low-cost European universities, partial tuition waivers in the US/UK.
  * `Self-Funded (15 - 30+ Lakh BDT/yr)`: Full tuition UK/US/Canada/Australia programs.
* **Country Filter**: Multi-select across the 18 supported countries.
* **Degree Level**: Bachelor's or Master's.
* **Eligibility Filters**:
  * Minimum CGPA slider (e.g., 2.50 to 4.00).
  * Minimum IELTS filter (e.g., 6.0, 6.5, 7.0, or "MOI / Duolingo Accepted").
* **Intake Timeline Filter**:
  * Upcoming Fall/Winter Intake (Deadlines between April – July).
  * Upcoming Spring/Summer Intake (Deadlines between October – January).

### 6.2 Data Schema (`content/universities/universities.json`)
```typescript
export interface UniversityItem {
  id: string;
  name: string;
  countryCode: string;             // e.g. "DE", "US", "MY"
  city: string;
  tuitionBDTAnnual: string;        // e.g. "35,000 BDT (Semester fee only)"
  tuitionCategory: "low" | "moderate" | "high";
  degreeLevels: ("bachelor" | "master")[];
  popularPrograms: string[];       // e.g. ["Computer Science", "Mechanical Eng"]
  intakes: {
    season: "Winter/Fall" | "Summer/Spring";
    windowOpens: string;           // e.g. "April 1"
    applicationDeadline: string;   // e.g. "July 15"
  }[];
  applicationMethod: "Direct" | "uni-assist" | "CommonApp" | "UAC";
  minRequirements: {
    minCgpa: number;               // e.g. 3.0
    minIelts: number;              // e.g. 6.5
    greRequired: boolean;
  };
  waiversAndScholarships: string[]; // e.g. ["DAAD Eligible", "Graduate Assistantship"]
  admissionsPortalUrl: string;     // Direct university link (no agency intermediaries)
}
```

---

## 7. Scholarship & Tuition Waiver Finder

### 7.1 Objective
A curated, client-side indexed engine connecting students with verified funding programs accepting Bangladeshi passports.

### 7.2 Pre-Seeded Curated Programs
* **Germany**: DAAD EPOS, Helmut-Schmidt Programme (PPGG), Deutschlandstipendium.
* **United Kingdom**: Chevening Scholarships, Commonwealth Scholarships, GREAT Scholarships.
* **United States**: Fulbright Foreign Student Program, Global UGRAD (Undergraduate exchange).
* **Japan**: MEXT Embassy Recommendation, MEXT University Track.
* **Hungary**: Stipendium Hungaricum (via Ministry of Education Bangladesh / UGC).
* **Europe-wide**: Erasmus Mundus Joint Master Degrees (EMJMD).
* **Turkey**: Türkiye Bursları.
* **China**: Chinese Government Scholarship (CSC).

---

## 8. Cross-Platform Advertising Engine

Monetization occurs across both the public website and mobile tracker while strictly adhering to ethical standards:

### 8.1 Website: Airport Flight Information Display (FIDS) Tickerboard
* **Visual Styling**: Monospace, terminal-styled horizontal ticker tape docked cleanly at the top or bottom of `waypointbd.com`.
* **Content**: Verified announcements from educational partners and financial institutions.
* **Example Ticker Items**:
  * `[SPONSORED] Eastern Bank PLC: Dedicated Student File desks with fast-track German Sperrkonto SWIFT processing.`
  * `[SPONSORED] Mentors' Education: New IELTS Academic weekend batch starting this Friday at Banani branch.`
  * `[SPONSORED] City Bank: Low-margin outward remittance for Canadian GIC and UK tuition deposits.`

### 8.2 Mobile App: Stage-Specific Contextual Milestone Slots
Rather than intrusive modals, ads are displayed as docked `.window` cards within specific journey milestones:

| Milestone / Stage | Ad Category | Typical Partner |
|---|---|---|
| **HSC / Early Prep** | IELTS / PTE Coaching & Test Prep | Mentors', Saifur's, British Council authorized centres |
| **IELTS / Language** | Online Courses & Mock Test Packs | Founder's IELTS Partners, PTE Practice portals |
| **Offers & Funding** | Student Files & Blocked Accounts | EBL, City Bank, BRAC Bank, MTB, Expatrio, Coracle |
| **Visa & Departure** | Airfare & Student Travel Insurance | Bangladeshi travel desks, Green Delta student insurance |

### 8.3 Trust & Ethics Compliance
1. Always marked with `[SPONSORED]` in monospace uppercase.
2. Labelled: *"Meets our standards as of [Date]"* (never "verified" or "safe").
3. Mandatory free alternative rendered below every ad:
   ```html
   <div class="p-3 border border-dashed border-[#2a3847] bg-[#0c1219] text-xs text-slate-400">
     <strong>Free Alternative:</strong> You can open a student file at any Authorized Dealer bank 
     branch across Bangladesh. 
     <a href="https://www.bb.org.bd" class="text-[#4db5ff] underline ml-1">
       View Bangladesh Bank checklist
     </a>
   </div>
   ```
4. Zero EXP awarded for ad engagement.
5. Telemetry strictly records anonymous view and click events in `ad_events`.

---

## 9. Rebranding Strategy: WayPoint & Official Motto

* **Brand Name**: **WayPoint** (`waypointbd.com`).
* **Official Motto**: *"No dream is too big and no dreamer is too small"* (from *Turbo*).
* **Touchpoints**:
  1. Header brand mark: `[WAYPOINT]`.
  2. Sub-header & Onboarding screen: Tagline rendered in `IBM Plex Mono`.
  3. Milestone completions & Rank-up celebrations (Rank E → S).
  4. HTML `<title>` and OpenGraph metadata.
* **Monorepo Package Names**: Internal packages retain `@dreamer/journey-engine` and `@dreamer/web` during this phase to avoid breaking git tracking and npm dependencies, with full public-facing rebranding to WayPoint.

---

## 10. Implementation Roadmap

| Phase | Deliverable | Target Files | Verification Criteria |
|---|---|---|---|
| **Phase A** | Rebranding & UI Simplification | `apps/web/src/app/layout.tsx`, `page.tsx`, `DashboardTabs.tsx` | Visual verification at 375 × 812; tagline present |
| **Phase B** | Engine Logic & Types | `packages/journey-engine/src/countries.ts`, `universities.ts`, `scholarships.ts` | 100% Vitest test pass |
| **Phase C** | Content Databases | `content/countries/`, `content/universities/`, `content/scholarships/` | JSON schema validation |
| **Phase D** | Country Hubs & FAQs | `apps/web/src/app/countries/[code]/page.tsx` | Dynamic routing, 5 tabs, SEO metadata |
| **Phase E** | University Search & Budget Filter | `apps/web/src/app/universities/page.tsx` | Budget filter, live search, zero-latency |
| **Phase F** | Cross-Platform Ads | `apps/web/src/components/FidsTicker.tsx`, `apps/web/src/lib/slots.ts` | Tickerboard rendering, telemetry tracking |
| **Phase G** | Final Verification | Monorepo root | `npm test`, `typecheck`, `lint`, `build` clean |

---

## 11. Senior Developer Review Checklist & Sign-Off

- [ ] **Platform Scope**: Approve Option A (Unified Next.js 15 SSR public portal + PWA tracker).
- [ ] **3-Hub Information Architecture**: Approve `Journey`, `Prep`, `Explore` navigation model.
- [ ] **Country Hubs & FAQs**: Validate the 5-tab structure for the 18 destination countries.
- [ ] **University Search**: Validate the budget in BDT filter and the curated 100–150 university model.
- [ ] **Advertising Engine**: Approve the Airport FIDS Tickerboard and milestone ad placements.
- [ ] **Compliance & Ethics**: Confirm adherence to Bangladesh Bank disclaimer and anti-deception rules.
- [ ] **Monorepo Structure**: Approve retaining `@dreamer/*` package scopes internally while presenting **WayPoint** externally.

---
*Ready for senior review and sign-off.*
