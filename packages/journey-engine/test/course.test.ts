import { describe, expect, it } from "vitest";
import {
  defaultCourse,
  defaultReadingPractices,
  markReadingPractice,
  nextUnlock,
  unlockedLessons,
} from "../src/index";

describe("Course lessons and EXP unlock rules", () => {
  const lessons = defaultCourse.lessons;

  it("unlocks the first 2 lessons for 0 EXP", () => {
    const unlocked = unlockedLessons(lessons, 0);
    expect(unlocked.length).toBe(2);
    expect(unlocked.map((l) => l.id)).toEqual(["intro-overview", "reading-skimming"]);
  });

  it("unlocks lesson 3 at 100 EXP", () => {
    const at99 = unlockedLessons(lessons, 99);
    expect(at99.length).toBe(2);

    const at100 = unlockedLessons(lessons, 100);
    expect(at100.length).toBe(3);
    expect(at100[2]!.id).toBe("writing-task1-charts");
  });

  it("calculates next unlock needed correctly", () => {
    // At 0 EXP, next lesson unlocks at 100 EXP (100 needed)
    const nextAt0 = nextUnlock(lessons, 0);
    expect(nextAt0).not.toBeNull();
    expect(nextAt0?.nextLesson.id).toBe("writing-task1-charts");
    expect(nextAt0?.expNeeded).toBe(100);

    // At 230 EXP, next lesson unlocks at 300 EXP (70 needed)
    const nextAt230 = nextUnlock(lessons, 230);
    expect(nextAt230?.nextLesson.id).toBe("speaking-part1");
    expect(nextAt230?.expNeeded).toBe(70);
  });

  it("returns null when all lessons are unlocked", () => {
    const nextAt2000 = nextUnlock(lessons, 2000);
    expect(nextAt2000).toBeNull();
  });
});

describe("Reading practice auto-marking", () => {
  const practice = defaultReadingPractices["reading-intro-1"]!;

  it("passes when all answers match perfectly", () => {
    const answers = {
      1: "collaboration",
      2: "acclimatization",
      3: "orientation",
    };
    const res = markReadingPractice(practice, answers);
    expect(res.passed).toBe(true);
    expect(res.score).toBe(3);
    expect(res.total).toBe(3);
    expect(res.percentage).toBe(100);
  });

  it("accepts valid alternatives with case and whitespace insensitivity", () => {
    const answers = {
      1: "  Partnerships ",
      2: "Adaptation",
      3: "SUPPORT",
    };
    const res = markReadingPractice(practice, answers);
    expect(res.passed).toBe(true);
    expect(res.score).toBe(3);
    expect(res.results.every((r) => r.correct)).toBe(true);
  });

  it("fails when answers fall below threshold", () => {
    const answers = {
      1: "collaboration",
      2: "wrong answer",
      3: "wrong answer",
    };
    const res = markReadingPractice(practice, answers);
    expect(res.passed).toBe(false);
    expect(res.score).toBe(1);
    expect(res.results[1]?.correct).toBe(false);
    expect(res.results[1]?.expected).toBe("acclimatization");
    expect(res.results[1]?.given).toBe("wrong answer");
  });
});
