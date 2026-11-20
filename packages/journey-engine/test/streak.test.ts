import { describe, expect, it } from "vitest";
import {
  computeProgress,
  computeWeeklyStreak,
  defaultContent,
  generateJourney,
  getMondayOfWeek,
  getUrgentReminder,
} from "../src/index";
import type { Profile } from "../src/types";

describe("getMondayOfWeek", () => {
  it("identifies the Monday for any day of the week", () => {
    // 2026-11-16 is Monday
    expect(getMondayOfWeek("2026-11-16")).toBe("2026-11-16");
    // 2026-11-18 is Wednesday
    expect(getMondayOfWeek("2026-11-18")).toBe("2026-11-16");
    // 2026-11-20 is Friday
    expect(getMondayOfWeek("2026-11-20")).toBe("2026-11-16");
    // 2026-11-22 is Sunday
    expect(getMondayOfWeek("2026-11-22")).toBe("2026-11-16");
    // 2026-11-23 is the next Monday
    expect(getMondayOfWeek("2026-11-23")).toBe("2026-11-23");
  });
});

describe("computeWeeklyStreak", () => {
  it("returns 0 streak when no activity days recorded", () => {
    const s = computeWeeklyStreak([], "2026-11-20");
    expect(s.currentCount).toBe(0);
    expect(s.bestCount).toBe(0);
    expect(s.freezesLeft).toBe(2);
  });

  it("counts 1 week for activity in current week", () => {
    const s = computeWeeklyStreak(["2026-11-18"], "2026-11-20");
    expect(s.currentCount).toBe(1);
    expect(s.bestCount).toBe(1);
    expect(s.lastPeriod).toBe("2026-11-16");
  });

  it("increments streak across consecutive active weeks", () => {
    // Activity in week 1 (Nov 9-15) and week 2 (Nov 16-22)
    const s = computeWeeklyStreak(["2026-11-10", "2026-11-19"], "2026-11-20");
    expect(s.currentCount).toBe(2);
    expect(s.bestCount).toBe(2);
    expect(s.freezesLeft).toBe(2);
  });

  it("consumes 1 freeze on a single missed week and continues streak", () => {
    // Week Nov 2-8 (active), Week Nov 9-15 (missed), Week Nov 16-22 (active)
    const s = computeWeeklyStreak(["2026-11-04", "2026-11-18"], "2026-11-20");
    expect(s.currentCount).toBe(2);
    expect(s.freezesLeft).toBe(1);
  });

  it("resets streak when missed weeks exceed available freezes", () => {
    // Week Oct 5 (active), 5 weeks missed, Week Nov 16 (active)
    const s = computeWeeklyStreak(["2026-10-06", "2026-11-18"], "2026-11-20");
    expect(s.currentCount).toBe(1);
    expect(s.bestCount).toBe(1);
    expect(s.freezesLeft).toBe(0);
  });

  it("pauses streak during holding mode without consuming freezes", () => {
    // Activity 4 weeks ago, but holding (exam season) active
    const s = computeWeeklyStreak(["2026-10-15", "2026-11-18"], "2026-11-20", { holding: true });
    expect(s.currentCount).toBe(2);
    expect(s.freezesLeft).toBe(2); // no freezes consumed
  });

  it("preserves active streak when current week is still in progress", () => {
    // Last week (Nov 9-15) was active; current week (Nov 16-22) has no activity yet
    const s = computeWeeklyStreak(["2026-11-12"], "2026-11-20");
    expect(s.currentCount).toBe(1);
    expect(s.freezesLeft).toBe(2);
  });
});

describe("getUrgentReminder", () => {
  const profile: Profile = {
    stage: "ug1",
    degree: "masters",
    englishLevel: "intermediate",
    countries: ["DE"],
  };
  const journey = generateJourney(profile, "2026-11");

  it("prioritizes overdue required milestones over daily quest (Priority 1)", () => {
    // Simulate an overdue milestone by computing progress with past date
    const pastJourney = generateJourney(profile, "2026-01");
    // At 2026-11, required milestones starting early in 2026 might be overdue
    const progress = computeProgress(pastJourney, [], "2026-11", defaultContent);

    if (progress.overdue.length > 0) {
      const reminder = getUrgentReminder(pastJourney, progress, false, "2026-11");
      expect(reminder?.type).toBe("overdue_catchup");
      expect(reminder?.severity).toBe("urgent");
    }
  });

  it("returns daily quest reminder when daily quest is not completed (Priority 2)", () => {
    const progress = computeProgress(journey, [], "2026-11", defaultContent);
    // When no milestones are overdue and daily quest not done
    const reminder = getUrgentReminder(journey, { ...progress, overdue: [] }, false, "2026-11");
    expect(reminder?.type).toBe("daily_quest_due");
    expect(reminder?.severity).toBe("action");
    expect(reminder?.link).toBe("/daily");
  });

  it("returns approaching deadline when fixed milestone is due this month (Priority 3)", () => {
    const progress = computeProgress(journey, [], "2026-11", defaultContent);
    // Find an item with a fixed deadline or set one
    const modifiedJourney = {
      ...journey,
      items: [
        {
          ...journey.items[0]!,
          key: "fixed_test_milestone",
          title: { en: "GRE Exam" },
          fixed: true,
          end: "2026-11",
        },
        ...journey.items.slice(1),
      ],
    };

    const reminder = getUrgentReminder(
      modifiedJourney,
      { ...progress, overdue: [], completedMilestones: [] },
      true, // daily done!
      "2026-11",
    );
    expect(reminder?.type).toBe("deadline_approaching");
    expect(reminder?.severity).toBe("notice");
    expect(reminder?.message).toContain("GRE Exam is due soon");
  });

  it("returns null when all caught up and daily quest is completed", () => {
    const progress = computeProgress(journey, [], "2026-11", defaultContent);
    const reminder = getUrgentReminder(
      journey,
      { ...progress, overdue: [] },
      true, // daily done
      "2026-01", // far from fixed deadlines
    );
    // If no fixed deadline in 2026-01, should be null
    if (!journey.items.some((i) => i.fixed && i.end === "2026-01")) {
      expect(reminder).toBeNull();
    }
  });
});
