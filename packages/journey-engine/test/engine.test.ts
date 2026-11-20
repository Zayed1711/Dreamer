import { describe, expect, it } from "vitest";
import {
  type Journey,
  type Profile,
  computeProgress,
  defaultContent,
  generateJourney,
  levelForExp,
  validateContent,
} from "../src/index";

const TODAY = "2026-11";

const item = (j: Journey, key: string) => {
  const found = j.items.find((i) => i.key === key);
  if (!found) throw new Error(`No item "${key}" in journey`);
  return found;
};
const keys = (j: Journey) => j.items.map((i) => i.key);
const allTasks = (j: Journey, ...milestones: string[]) =>
  milestones.flatMap((m) => item(j, m).tasks.map((t) => `${m}.${t.key}`));

const hsc1Weak: Profile = {
  stage: "hsc1",
  degree: "bachelors",
  englishLevel: "beginner",
  countries: ["GB"],
  division: "chattogram",
};

describe("content", () => {
  it("is consistent", () => {
    expect(validateContent(defaultContent)).toEqual([]);
  });
});

describe("J1: HSC year 1, bachelor's abroad, weak English", () => {
  const j = generateJourney(hsc1Weak, TODAY);

  it("uses the bachelor's-abroad template and derives the anchors", () => {
    expect(j.templateKey).toBe("hsc-bachelors-abroad");
    expect(j.anchors.hsc_exam).toBe("2028-06");
    expect(j.anchors.hsc_result).toBe("2028-10");
    expect(j.intake).toEqual({ year: 2029, season: "fall" });
  });

  it("adds English foundation months and pushes IELTS 3 months later", () => {
    expect(item(j, "english_foundation")).toMatchObject({ start: "2028-07", end: "2028-09" });
    expect(item(j, "ielts_coaching")).toMatchObject({ start: "2028-10", end: "2028-12" });
    expect(item(j, "ielts_test")).toMatchObject({ start: "2029-01", end: "2029-01" });
  });

  it("does not add SAT preparation without a US target", () => {
    expect(keys(j)).not.toContain("sat_prep");
  });

  it("keeps fixed deadlines counted back from the intake", () => {
    expect(item(j, "apply")).toMatchObject({ start: "2028-10", end: "2029-03", fixed: true });
    expect(item(j, "visa")).toMatchObject({ start: "2029-05", end: "2029-07", fixed: true });
    expect(j.feasibility.status).toBe("ok");
  });

  it("sets a quiet window before the HSC exam", () => {
    expect(j.quietWindow).toEqual({ start: "2028-03", end: "2028-05" });
  });

  it("flies from the student's division to the first target country", () => {
    expect(j.route.from.code).toBe("CGP");
    expect(j.route.to.code).toBe("LHR");
  });

  it("orders items by start month", () => {
    const starts = j.items.map((i) => i.start);
    expect([...starts].sort()).toEqual(starts);
  });
});

describe("J3: undergraduate year 3, US target", () => {
  const j = generateJourney(
    { stage: "ug3", degree: "masters", englishLevel: "intermediate", countries: ["US"] },
    TODAY,
  );

  it("derives graduation and intake", () => {
    expect(j.templateKey).toBe("ug-masters-abroad");
    expect(j.anchors.graduation).toBe("2028-06");
    expect(j.intake).toEqual({ year: 2028, season: "fall" });
  });

  it("adds GRE preparation and no English foundation", () => {
    expect(keys(j)).toContain("gre_prep");
    expect(keys(j)).not.toContain("english_foundation");
  });

  it("keeps only required milestones from earlier years", () => {
    expect(keys(j)).toContain("passport");
    expect(keys(j)).not.toContain("cgpa_goal");
    expect(keys(j)).not.toContain("projects_activities");
    expect(item(j, "passport").rescheduled).toBe(true);
    expect(item(j, "passport").start).toBe(TODAY);
  });

  it("has an unknown destination airport only when no country is set", () => {
    expect(j.route.to.code).toBe("JFK");
    const none = generateJourney(
      { stage: "ug1", degree: "masters", englishLevel: "advanced", countries: [] },
      TODAY,
    );
    expect(none.route.to.code).toBe("???");
    expect(none.route.from.code).toBe("DAC");
  });
});

describe("late entries", () => {
  it("gives a graduate a compressed plan with only required catch-up items", () => {
    const j = generateJourney(
      { stage: "graduated", degree: "masters", englishLevel: "intermediate", countries: ["CA"] },
      TODAY,
    );
    expect(j.intake).toEqual({ year: 2027, season: "fall" });
    expect(keys(j)).toEqual(
      expect.arrayContaining(["ielts_test", "shortlist", "documents_ready", "sop", "apply", "visa"]),
    );
    expect(keys(j)).not.toContain("research_internship");
    expect(item(j, "ielts_test")).toMatchObject({ start: TODAY, rescheduled: true });
    expect(j.feasibility.status).toBe("tight");
  });

  it("flags an intake whose application window has closed and suggests a later one", () => {
    const j = generateJourney(
      {
        stage: "after_hsc",
        degree: "bachelors",
        englishLevel: "advanced",
        countries: ["AU"],
        intake: { year: 2027, season: "spring" },
      },
      TODAY,
    );
    expect(j.feasibility.status).toBe("at_risk");
    expect(j.feasibility.suggestedIntake).toEqual({ year: 2028, season: "spring" });
  });
});

describe("Scam Shield", () => {
  it("is in every journey from day one, including late joiners", () => {
    const profiles: Profile[] = [
      hsc1Weak,
      { stage: "hsc1", degree: "masters", englishLevel: "intermediate", countries: [] },
      { stage: "after_hsc", degree: "bachelors", englishLevel: "advanced", countries: ["AU"] },
      { stage: "ug3", degree: "masters", englishLevel: "intermediate", countries: ["US"] },
      { stage: "graduated", degree: "masters", englishLevel: "intermediate", countries: ["CA"] },
    ];
    for (const p of profiles) {
      expect(item(generateJourney(p, TODAY), "scam_shield")).toMatchObject({ start: TODAY, required: true, stamp: "scam_spotter" });
    }
  });
});

describe("J2: HSC to a bachelor's at home", () => {
  const j = generateJourney(
    { stage: "hsc1", degree: "masters", englishLevel: "intermediate", countries: [] },
    TODAY,
  );

  it("is a light journey that hands over to J3", () => {
    expect(j.templateKey).toBe("hsc-bachelors-home");
    expect(j.nextTemplateKey).toBe("ug-masters-abroad");
    expect(j.intake).toBeUndefined();
    expect(keys(j)).toContain("university_admission_home");
  });

  it("reaches D-Rank without a passport, but cannot pass the IELTS Gate yet", () => {
    const p = computeProgress(j, allTasks(j, "profile_setup", "english_habit", "docs_folder"), TODAY);
    expect(p.rank).toBe("D");
    expect(p.nextRank).toBe("C");
    expect(p.nextGateProgress).toBe(0);
  });
});

describe("progress, ranks and the flight", () => {
  const j = generateJourney(hsc1Weak, TODAY);

  it("starts as an E-Rank Dreamer at the home airport", () => {
    const p = computeProgress(j, [], TODAY);
    expect(p).toMatchObject({ rank: "E", level: 1, exp: 0, planePosition: 0, journeyPercent: 0 });
    expect(p.flightStatus).toBe("on_time");
  });

  it("moves the plane inside a segment as the next gate fills", () => {
    const p = computeProgress(j, allTasks(j, "profile_setup", "english_habit"), TODAY);
    expect(p.rank).toBe("E");
    expect(p.nextGateProgress).toBeGreaterThan(0);
    expect(p.nextGateProgress).toBeLessThan(1);
    expect(p.planePosition).toBeCloseTo(p.nextGateProgress / 5);
  });

  it("ranks up only through gates, not EXP alone", () => {
    // Lots of EXP, but the Habit Gate is incomplete (no passport).
    const lots = allTasks(j, "profile_setup", "english_habit", "docs_folder", "ielts_coaching", "ielts_test", "sop");
    expect(computeProgress(j, lots, TODAY).rank).toBe("E");

    const d = computeProgress(j, allTasks(j, "profile_setup", "english_habit", "passport", "docs_folder"), TODAY);
    expect(d.rank).toBe("D");
    expect(d.planePosition).toBeCloseTo(0.2);
    expect(d.stamps).toEqual(expect.arrayContaining(["habit_formed", "passport_ready"]));

    const c = computeProgress(
      j,
      allTasks(j, "profile_setup", "english_habit", "passport", "docs_folder", "ielts_test"),
      TODAY,
    );
    expect(c.rank).toBe("C");
    expect(c.stamps).toContain("ielts_gate");
  });

  it("reaches S-Rank and the destination when every gate is passed", () => {
    const every = j.items.flatMap((i) => i.tasks.map((t) => `${i.key}.${t.key}`));
    const p = computeProgress(j, every, TODAY);
    expect(p.rank).toBe("S");
    expect(p.planePosition).toBe(1);
    expect(p.journeyPercent).toBe(100);
    expect(p.nextRank).toBeUndefined();
  });

  it("counts EXP and stats per task", () => {
    const p = computeProgress(j, ["passport.apply"], TODAY);
    expect(p.exp).toBe(40);
    expect(p.stats.documents).toBe(40);
    expect(p.completedMilestones).toEqual([]);
  });

  it("reports delayed, holding and rerouting flight states", () => {
    expect(computeProgress(j, [], "2027-07").flightStatus).toBe("delayed");
    expect(computeProgress(j, [], "2027-07").overdue).toContain("profile_setup");
    // The HSC exam quiet window wins over delays.
    expect(computeProgress(j, [], "2028-04").flightStatus).toBe("holding");
    const atRisk = { ...j, feasibility: { status: "at_risk" as const } };
    expect(computeProgress(atRisk, [], TODAY).flightStatus).toBe("rerouting");
  });

  it("grows levels with EXP", () => {
    expect(levelForExp(0)).toBe(1);
    expect(levelForExp(10)).toBe(2);
    expect(levelForExp(5000)).toBe(23);
  });
});
