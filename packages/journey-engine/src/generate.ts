import { defaultContent } from "./content";
import {
  type MonthIndex,
  format,
  fromInput,
  intakeIndex,
  monthOf,
  nextFall,
  toIndex,
  yearOf,
} from "./months";
import type {
  Airport,
  Anchor,
  Condition,
  Content,
  Feasibility,
  Journey,
  JourneyItem,
  MonthString,
  Profile,
  Season,
  Stage,
  Template,
} from "./types";
import { STAGES } from "./types";

/** Month of the HSC exam (it usually starts in late June). */
export const HSC_EXAM_MONTH = 6;
/** HSC results usually come about 4 months after the exam starts. */
export const HSC_RESULT_GAP = 4;
/** Default graduation month when the student does not give one. */
export const DEFAULT_GRADUATION_MONTH = 6;
/** Extra months of English added for weak starters, and how far IELTS moves. */
export const ENGLISH_FOUNDATION_MONTHS = 3;

const IELTS_KEYS = new Set(["ielts_coaching", "ielts_test"]);

export function chooseTemplate(profile: Profile, content: Content = defaultContent): Template {
  const hscStage = profile.stage === "hsc1" || profile.stage === "hsc2" || profile.stage === "after_hsc";
  const key = hscStage
    ? profile.degree === "bachelors"
      ? "hsc-bachelors-abroad"
      : "hsc-bachelors-home"
    : "ug-masters-abroad";
  const template = content.templates.find((t) => t.key === key);
  if (!template) throw new Error(`Template "${key}" is missing from the content`);
  return template;
}

function deriveHscExamYear(stage: Stage, today: MonthIndex): number {
  const y = yearOf(today);
  const m = monthOf(today);
  switch (stage) {
    case "hsc1":
      return m >= 7 ? y + 2 : y + 1;
    case "hsc2":
      return m >= 7 ? y + 1 : y;
    default:
      // after_hsc: the most recent exam
      return m >= HSC_EXAM_MONTH ? y : y - 1;
  }
}

function deriveGraduation(stage: Stage, today: MonthIndex): MonthIndex {
  if (stage === "graduated") return today;
  const year = Number(stage.slice(2)); // ug1..ug4
  const y = yearOf(today);
  const yearsLeft = monthOf(today) >= 7 ? 5 - year : 4 - year;
  return toIndex(y + yearsLeft, DEFAULT_GRADUATION_MONTH);
}

function conditionsFor(profile: Profile): Set<Condition> {
  const c = new Set<Condition>();
  if (profile.englishLevel === "beginner") c.add("weak_english");
  if (profile.countries.includes("US")) c.add("us_target");
  return c;
}

function routeFor(profile: Profile, content: Content): { from: Airport; to: Airport } {
  const { home, destinations } = content.airports;
  const from = (profile.division && home.byDivision[profile.division.toLowerCase()]) || home.default;
  const first = profile.countries[0];
  const to = (first && destinations.byCountry[first.toUpperCase()]) || destinations.unknown;
  return { from, to };
}

function seasonOf(m: MonthIndex): Season {
  return monthOf(m) >= 7 ? "fall" : "spring";
}

/**
 * Builds a student's dated journey from their profile.
 *
 * - The template says when each milestone happens, relative to an anchor event.
 * - Phases before the student's stage keep only required milestones.
 * - Flexible milestones whose window has passed are moved to start now.
 * - Fixed milestones never move; if one has passed, the plan is flagged at risk.
 */
export function generateJourney(
  profile: Profile,
  today: Date | MonthString,
  content: Content = defaultContent,
): Journey {
  const now = fromInput(today);
  const template = chooseTemplate(profile, content);
  if (!template.entryStages.includes(profile.stage)) {
    throw new Error(`Template "${template.key}" does not accept stage "${profile.stage}"`);
  }
  const library = new Map(content.milestones.map((m) => [m.key, m]));
  const conditions = conditionsFor(profile);

  // ----- Anchors -----
  const anchors: Partial<Record<Anchor, MonthIndex>> = { start: now };
  const isHscJourney = template.entryStages.includes("hsc1");
  if (isHscJourney) {
    const examYear = profile.hscExamYear ?? deriveHscExamYear(profile.stage, now);
    anchors.hsc_exam = toIndex(examYear, HSC_EXAM_MONTH);
    anchors.hsc_result = anchors.hsc_exam + HSC_RESULT_GAP;
  } else {
    anchors.graduation = profile.graduation
      ? toIndex(profile.graduation.year, profile.graduation.month)
      : deriveGraduation(profile.stage, now);
  }

  let intake: { year: number; season: Season } | undefined;
  if (template.defaultIntake) {
    if (profile.intake) {
      intake = profile.intake;
    } else {
      const base = anchors[template.defaultIntake.anchor];
      if (base === undefined) throw new Error(`Anchor "${template.defaultIntake.anchor}" is not set`);
      intake = nextFall(base + template.defaultIntake.offset);
    }
    anchors.intake = intakeIndex(intake);
  }

  // ----- Items -----
  const entryIdx = STAGES.indexOf(profile.stage);
  const items: (JourneyItem & { _start: MonthIndex; _end: MonthIndex; _order: number })[] = [];
  let order = 0;

  for (const phase of template.phases) {
    const phaseLast = Math.max(...phase.stages.map((s) => STAGES.indexOf(s)));
    const pastPhase = phaseLast < entryIdx;

    for (const tm of phase.milestones) {
      order++;
      if (tm.when && !conditions.has(tm.when)) continue;
      if (pastPhase && !tm.required) continue;

      const def = library.get(tm.key);
      if (!def) throw new Error(`Unknown milestone "${tm.key}" in template "${template.key}"`);
      const anchor = anchors[tm.anchor];
      if (anchor === undefined) throw new Error(`Anchor "${tm.anchor}" is not set for "${tm.key}"`);

      let start = anchor + tm.offset;
      // Rule: weak English pushes IELTS coaching and the test later.
      if (conditions.has("weak_english") && IELTS_KEYS.has(tm.key) && !tm.fixed) {
        start += ENGLISH_FOUNDATION_MONTHS;
      }
      let end = start + tm.duration - 1;
      let rescheduled = false;
      if (end < now && !tm.fixed) {
        start = now;
        end = now + tm.duration - 1;
        rescheduled = true;
      }

      items.push({
        key: def.key,
        phase: phase.key,
        title: def.title,
        help: def.help,
        stat: def.stat,
        tasks: def.tasks,
        exp: def.tasks.reduce((sum, t) => sum + t.exp, 0),
        start: format(start),
        end: format(end),
        required: tm.required ?? false,
        fixed: tm.fixed ?? false,
        rescheduled,
        ...(def.stamp ? { stamp: def.stamp } : {}),
        ...(def.slot ? { slot: def.slot } : {}),
        ...(def.advisorTopic ? { advisorTopic: def.advisorTopic } : {}),
        _start: start,
        _end: end,
        _order: order,
      });
    }
  }

  items.sort((a, b) => a._start - b._start || a._order - b._order);

  // ----- Feasibility -----
  let feasibility: Feasibility = { status: "ok" };
  const apply = items.find((i) => i.key === "apply");
  const test = items.find((i) => i.key === "ielts_test");
  if (apply && intake) {
    if (apply._end < now) {
      const later = anchors.intake! + 12;
      feasibility = {
        status: "at_risk",
        reason: "The application window for this intake has already closed.",
        suggestedIntake: { year: yearOf(later), season: seasonOf(later) },
      };
    } else if (apply._start < now) {
      feasibility = { status: "tight", reason: "The application window is already open, so the plan is compressed." };
    } else if (test && test._end > apply._end) {
      feasibility = { status: "tight", reason: "The IELTS test falls after the application window closes." };
    }
  }

  // ----- Quiet window (HSC exam season) -----
  let quietWindow: Journey["quietWindow"];
  if (template.quietWindow) {
    const base = anchors[template.quietWindow.anchor];
    if (base !== undefined) {
      const qs = base + template.quietWindow.offset;
      const qe = qs + template.quietWindow.duration - 1;
      if (qe >= now) quietWindow = { start: format(qs), end: format(qe) };
    }
  }

  const anchorStrings: Partial<Record<Anchor, MonthString>> = {};
  for (const [k, v] of Object.entries(anchors)) {
    if (v !== undefined) anchorStrings[k as Anchor] = format(v);
  }

  return {
    templateKey: template.key,
    ...(template.next ? { nextTemplateKey: template.next } : {}),
    generatedFor: format(now),
    anchors: anchorStrings,
    ...(intake ? { intake } : {}),
    ...(quietWindow ? { quietWindow } : {}),
    feasibility,
    route: routeFor(profile, content),
    items: items.map(({ _start, _end, _order, ...item }) => item),
  };
}
