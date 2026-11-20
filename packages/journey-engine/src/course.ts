import courseJson from "../../../content/course/lessons.json";
import readingIntro1 from "../../../content/course/reading/reading-intro-1.json";
import readingSkimming1 from "../../../content/course/reading/reading-skimming-1.json";
import readingTfng1 from "../../../content/course/reading/reading-tfng-1.json";
import readingHeadings1 from "../../../content/course/reading/reading-headings-1.json";

import type {
  CourseData,
  Lesson,
  ReadingMarkResult,
  ReadingPracticeSet,
} from "./types";

export const defaultCourse: CourseData = courseJson as CourseData;

export const defaultReadingPractices: Record<string, ReadingPracticeSet> = {
  "reading-intro-1": readingIntro1 as ReadingPracticeSet,
  "reading-skimming-1": readingSkimming1 as ReadingPracticeSet,
  "reading-tfng-1": readingTfng1 as ReadingPracticeSet,
  "reading-headings-1": readingHeadings1 as ReadingPracticeSet,
};

/**
 * Returns all lessons currently unlocked for the student's EXP.
 */
export function unlockedLessons(lessons: Lesson[], exp: number): Lesson[] {
  const currentExp = Math.max(0, exp);
  return lessons.filter((l) => l.unlockExp <= currentExp);
}

/**
 * Finds the next locked lesson and the additional EXP required to unlock it.
 * Returns null if all lessons have already been unlocked.
 */
export function nextUnlock(
  lessons: Lesson[],
  exp: number,
): { nextLesson: Lesson; expNeeded: number } | null {
  const currentExp = Math.max(0, exp);
  const locked = lessons
    .filter((l) => l.unlockExp > currentExp)
    .sort((a, b) => a.unlockExp - b.unlockExp);

  if (locked.length === 0) return null;

  const next = locked[0]!;
  return {
    nextLesson: next,
    expNeeded: next.unlockExp - currentExp,
  };
}

/**
 * Auto-marks a student's fill-in-the-blank reading practice submission.
 * Comparison is case-insensitive and trims whitespace.
 * Passes if at least 67% of answers are correct.
 */
export function markReadingPractice(
  practice: ReadingPracticeSet,
  answers: Record<number, string>,
): ReadingMarkResult {
  const results = practice.blanks.map((b) => {
    const rawGiven = answers[b.index] ?? "";
    const cleanGiven = rawGiven.trim().toLowerCase();
    const cleanExpected = b.answer.trim().toLowerCase();
    const cleanAlternatives = (b.alternatives ?? []).map((a) => a.trim().toLowerCase());

    const isCorrect =
      cleanGiven.length > 0 &&
      (cleanGiven === cleanExpected || cleanAlternatives.includes(cleanGiven));

    return {
      index: b.index,
      correct: isCorrect,
      expected: b.answer,
      given: rawGiven.trim(),
    };
  });

  const score = results.filter((r) => r.correct).length;
  const total = results.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  // Passing threshold: at least 67% (e.g. 2 of 3)
  const passed = score >= Math.ceil(total * 0.67);

  return {
    passed,
    score,
    total,
    percentage,
    results,
  };
}
