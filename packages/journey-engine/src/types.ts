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
