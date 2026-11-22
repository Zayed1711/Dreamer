/** Text with an English version and an optional Bangla version. */
export interface Text {
  en: string;
  bn?: string;
}

export const STAGES = ["hsc1", "hsc2", "after_hsc", "ug1", "ug2", "ug3", "ug4", "graduated"] as const;
export type Stage = (typeof STAGES)[number];

export type Degree = "bachelors" | "masters";
export type EnglishLevel = "beginner" | "intermediate" | "advanced";
export type Season = "fall" | "spring";
export type Stat = "english" | "academics" | "documents" | "profile" | "funding";
export type Anchor = "start" | "hsc_exam" | "hsc_result" | "graduation" | "intake";
export type Condition = "weak_english" | "us_target";
export type RankLetter = "E" | "D" | "C" | "B" | "A" | "S";

// ---------- Content (content/journeys/*.json) ----------

export interface TaskDef {
  key: string;
  title: Text;
  exp: number;
}

export interface MilestoneDef {
  key: string;
  title: Text;
  stat: Stat;
  help: Text;
  tasks: TaskDef[];
  stamp?: string;
  slot?: string;
  advisorTopic?: string;
}

export interface TemplateMilestone {
  key: string;
  anchor: Anchor;
  /** Months after the anchor (negative = before). */
  offset: number;
  /** Length of the due window in months. */
  duration: number;
  required?: boolean;
  /** Fixed milestones (exams, deadlines) are never moved. */
  fixed?: boolean;
  /** Included only when this condition holds for the student. */
  when?: Condition;
}

export interface Phase {
  key: string;
  title: Text;
  stages: Stage[];
  milestones: TemplateMilestone[];
}

export interface Template {
  key: string;
  title: Text;
  degree: Degree;
  entryStages: Stage[];
  next?: string;
  defaultIntake?: { anchor: Anchor; offset: number };
  quietWindow?: { anchor: Anchor; offset: number; duration: number };
  phases: Phase[];
}

export interface RankDef {
  rank: RankLetter;
  title: Text;
  color: string;
  gate: { name: Text; requires: string[] } | null;
}

export interface Airport {
  code: string;
  city: string;
}

export interface Content {
  milestones: MilestoneDef[];
  templates: Template[];
  ranks: RankDef[];
  airports: {
    home: { default: Airport; byDivision: Record<string, Airport> };
    destinations: { unknown: Airport; byCountry: Record<string, Airport> };
  };
}

// ---------- Input ----------

export interface Profile {
  stage: Stage;
  degree: Degree;
  englishLevel: EnglishLevel;
  /** ISO 3166-1 alpha-2 codes, most wanted first. May be empty. */
  countries: string[];
  /** Bangladesh division, used for the home airport. */
  division?: string;
  /** Year of the HSC exam. Derived from the stage when missing. */
  hscExamYear?: number;
  /** Expected graduation. Derived from the stage when missing. */
  graduation?: { year: number; month: number };
  /** Target intake. Derived from the template when missing. */
  intake?: { year: number; season: Season };
}

// ---------- Output ----------

/** A month written as "YYYY-MM". */
export type MonthString = string;

export interface JourneyItem {
  key: string;
  phase: string;
  title: Text;
  help: Text;
  stat: Stat;
  tasks: TaskDef[];
  exp: number;
  start: MonthString;
  /** Last month of the due window (inclusive). */
  end: MonthString;
  required: boolean;
  fixed: boolean;
  /** True when the template window had already passed and the item was moved to start now. */
  rescheduled: boolean;
  stamp?: string;
  slot?: string;
  advisorTopic?: string;
}

export interface Feasibility {
  status: "ok" | "tight" | "at_risk";
  reason?: string;
  suggestedIntake?: { year: number; season: Season };
}

export interface Journey {
  templateKey: string;
  nextTemplateKey?: string;
  generatedFor: MonthString;
  anchors: Partial<Record<Anchor, MonthString>>;
  intake?: { year: number; season: Season };
  quietWindow?: { start: MonthString; end: MonthString };
  feasibility: Feasibility;
  route: { from: Airport; to: Airport };
  items: JourneyItem[];
}

export type FlightStatus = "on_time" | "delayed" | "rerouting" | "holding";

export interface Progress {
  exp: number;
  level: number;
  rank: RankLetter;
  rankTitle: Text;
  nextRank?: RankLetter;
  /** Share of the next Rank-Up Gate completed, 0 to 1. */
  nextGateProgress: number;
  /** Plane position on the route, 0 (home) to 1 (destination). */
  planePosition: number;
  /** Share of required EXP completed, 0 to 100. */
  journeyPercent: number;
  flightStatus: FlightStatus;
  stats: Record<Stat, number>;
  stamps: string[];
  completedMilestones: string[];
  overdue: string[];
}

// ---------- Daily Quests ----------

export interface WordItem {
  word: string;
  meaning: string;
  sentence: string;
  bn?: string;
}

export interface WordListFile {
  level: number;
  name: string;
  source: string;
  license: string;
  words: WordItem[];
}

export interface PromptItem {
  id: string;
  level: number;
  prompt: string;
  bn?: string;
}

export interface PromptsFile {
  version: number;
  prompts: PromptItem[];
}

export type DailyQuestType = "words" | "sentences" | "writing";

export interface DailyQuest {
  date: string;
  track: string;
  type: DailyQuestType;
  level: number;
  prompt?: PromptItem;
  words?: WordItem[];
}

export interface DailyStreak {
  currentCount: number;
  bestCount: number;
  lastPeriod: string;
  freezesLeft: number;
  freezesResetAt: string;
}

export interface CheckResult {
  passed: boolean;
  problems: string[];
}

// ---------- Course & Lessons ----------

export type CourseSection = "reading" | "writing" | "listening" | "speaking";

export interface Lesson {
  id: string;
  title: string;
  section: CourseSection;
  videoUrl: string;
  durationMin: number;
  unlockExp: number;
  summary: string;
  practiceId?: string;
}

export interface CourseData {
  version: number;
  courseTitle: string;
  instructor: string;
  description: string;
  lessons: Lesson[];
}

export interface ReadingBlank {
  index: number;
  question: string;
  answer: string;
  alternatives?: string[];
}

export interface ReadingPracticeSet {
  id: string;
  title: string;
  passage: string;
  blanks: ReadingBlank[];
}

export interface ReadingMarkResult {
  passed: boolean;
  score: number;
  total: number;
  percentage: number;
  results: {
    index: number;
    correct: boolean;
    expected: string;
    given: string;
  }[];
}

// ---------- Language Tracks ----------

export type LanguageCode = "de" | "ja";

export type QuizType = "match" | "multiple_choice" | "sentence_build";

export interface QuizQuestion {
  id: string;
  type: QuizType;
  prompt: string;
  soundText?: string;
  explanation?: string;
  options: string[];
  correctAnswer: string;
}

export interface LanguageLevelContent {
  lang: LanguageCode;
  level: number;
  title: string;
  description: string;
  reviewedBy?: string;
  reviewedAt?: string;
  items: QuizQuestion[];
}

export interface LanguageQuizResult {
  passed: boolean;
  score: number;
  total: number;
  percentage: number;
  results: {
    questionId: string;
    given: string;
    expected: string;
    correct: boolean;
  }[];
}

export interface LanguageProgress {
  lang: LanguageCode;
  level: number;
  quizzesCompleted: number;
  updatedAt?: string;
}

// ---------- Mentors & Advisors ----------

export interface MentorProfile {
  id: string;
  name: string;
  university: string;
  country: string; // ISO 3166-1 alpha-2
  subject: string;
  intakeYear: number;
  bio: string;
  photoPath?: string;
  topics: string[];
  isFounding: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
  contentReviewed?: {
    type: string;
    title: string;
    link?: string;
  }[];
}

export interface MentorApplicationInput {
  name: string;
  university: string;
  country: string;
  subject: string;
  intakeYear: number;
  bio: string;
  topics: string[];
  proofFileName?: string;
}

// ---------- Ads & Advertisers (Phase 7) ----------

export type AdvertiserType = "ielts_provider" | "agency" | "bank" | "other";

export type AdvertiserStatus = "active" | "suspended" | "removed";

export interface Advertiser {
  id: string;
  name: string;
  type: AdvertiserType;
  standardsAcceptedAt?: string;
  status: AdvertiserStatus;
  contact?: string;
  createdAt?: string;
}

export interface Ad {
  id: string;
  advertiserId: string;
  advertiserName?: string;
  slot: string;
  headline: string;
  body: string;
  linkUrl: string;
  imagePath?: string;
  referralCode: string;
  targetStages: Stage[];
  targetCountries: string[];
  targetEnglish: EnglishLevel[];
  startsOn: string;
  endsOn: string;
  active: boolean;
  standardsAcceptedAt?: string;
  createdAt?: string;
}

export type AdEventType = "view" | "click";

export interface AdEvent {
  id?: number;
  adId: string;
  event: AdEventType;
  milestoneKey?: string;
  stage?: Stage;
  createdAt?: string;
}

export interface AdStats {
  adId: string;
  headline: string;
  slot: string;
  views: number;
  clicks: number;
  ctr: number;
}

// ---------- Advisor Sessions & Bookings (Phase 7) ----------

export type SessionStatus = "scheduled" | "running" | "completed" | "cancelled";

export interface AdvisorSession {
  id: string;
  advisorId: string;
  advisorName?: string;
  advisorUniversity?: string;
  advisorCountry?: string;
  title: string;
  topic?: string;
  startsAt: string;
  durationMin: number;
  capacity: number;
  priceBdt: number;
  meetUrl?: string;
  status: SessionStatus;
  createdAt?: string;
  bookingsCount?: number;
}

export type BookingStatus = "pending_payment" | "confirmed" | "attended" | "cancelled" | "refunded";

export interface SessionBooking {
  id: string;
  sessionId: string;
  studentId: string;
  status: BookingStatus;
  createdAt?: string;
  session?: AdvisorSession;
}

export type PaymentProvider = "bkash" | "nagad" | "sslcommerz";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface PaymentRecord {
  id: string;
  bookingId: string;
  provider: PaymentProvider;
  providerRef?: string;
  amountBdt: number;
  status: PaymentStatus;
  createdAt?: string;
}

export interface PayoutRecord {
  id: string;
  advisorId: string;
  advisorName?: string;
  periodStart: string;
  periodEnd: string;
  amountBdt: number;
  status: "due" | "paid";
  paidAt?: string;
  createdAt?: string;
}

// ---------- Country Guides & Destinations (Phase 9) ----------

export interface CountryEmbassyDhaka {
  waitlistMonths: string;
  interviewRequired: boolean;
  vfsLocation: string;
  appointmentTips: string[];
}

export interface CountryDocumentCategory {
  category: string;
  items: string[];
}

export interface CountryBlockedAccountInfo {
  required: boolean;
  providerName: string;
  amountLocal?: string;
  amountBDT: string;
  bdBankProcedure: string;
}

export interface CountryFaq {
  question: string;
  answer: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  region: string;
  capital: string;
  currency: string;
  currencySymbol: string;
  bdtRate: number;
  avgTuitionYearBdt: { min: number; max: number };
  avgMonthlyLivingBdt: { min: number; max: number };
  proofOfFundsBdt: number;
  proofOfFundsName: string;
  partTimeHoursTerm: number;
  postStudyWorkYears: string;
  prPathwayRating: "high" | "moderate" | "selective" | "difficult";
  prPathwayNote: string;
  languageRequired: string;
  intakeMonths: string[];
  topUniversities: string[];
  keyPros: string[];
  keyCons: string[];
  overview: string;
  embassyDhaka: CountryEmbassyDhaka;
  documentsChecklist: CountryDocumentCategory[];
  blockedAccountInfo: CountryBlockedAccountInfo;
  commonFaqs: CountryFaq[];
}

// ---------- University Search & Applications (Phase 10) ----------

export type TuitionCategory = "low" | "moderate" | "high"; // low: < 2L BDT/yr, moderate: 2-15L BDT/yr, high: > 15L BDT/yr

export interface UniversityIntake {
  season: "Winter/Fall" | "Summer/Spring";
  windowOpens: string;
  applicationDeadline: string;
}

export interface UniversityMinRequirements {
  minCgpa: number;
  minIelts: number;
  greRequired: boolean;
  duolingoAccepted?: boolean;
}

export interface UniversityItem {
  id: string;
  name: string;
  countryCode: string;
  countryName: string;
  city: string;
  tuitionBDTAnnual: string;
  tuitionBDTAnnualMin: number;
  tuitionCategory: TuitionCategory;
  degreeLevels: ("bachelor" | "master")[];
  popularPrograms: string[];
  intakes: UniversityIntake[];
  applicationMethod: "Direct" | "uni-assist" | "CommonApp" | "UAC" | "OUAC" | "EMGS";
  minRequirements: UniversityMinRequirements;
  waiversAndScholarships: string[];
  admissionsPortalUrl: string;
}

export interface UniversityFilter {
  query?: string;
  countryCode?: string;
  degreeLevel?: "bachelor" | "master";
  tuitionCategory?: TuitionCategory | "ALL";
  maxTuitionBDT?: number;
  studentCgpa?: number;
  studentIelts?: number;
  season?: "Winter/Fall" | "Summer/Spring" | "ALL";
}

// ---------- Scholarship & Tuition Waiver Finder (Phase 11) ----------

export type ScholarshipCoverage = "fully_funded" | "tuition_waiver" | "partial_stipend";

export interface ScholarshipMinRequirements {
  minCgpa?: number;
  minIelts?: number;
  workExpYears?: number;
  ageLimit?: number;
}

export interface ScholarshipApplicationWindow {
  opens: string;
  deadline: string;
}

export interface ScholarshipItem {
  id: string;
  name: string;
  provider: string;
  targetCountryCodes: string[];
  targetCountryNames: string[];
  degreeLevels: ("bachelor" | "master" | "phd")[];
  coverageType: ScholarshipCoverage;
  coverageAmountBDT: string;
  benefits: string[];
  minRequirements: ScholarshipMinRequirements;
  applicationWindow: ScholarshipApplicationWindow;
  bdSpecificNotes?: string;
  applicationUrl: string;
}

export interface ScholarshipFilter {
  query?: string;
  countryCode?: string;
  degreeLevel?: "bachelor" | "master" | "phd";
  coverageType?: ScholarshipCoverage | "ALL";
  studentCgpa?: number;
  studentIelts?: number;
}




