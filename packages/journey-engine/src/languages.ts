import de1 from "../../../content/languages/de/level-1.json";
import de2 from "../../../content/languages/de/level-2.json";
import de3 from "../../../content/languages/de/level-3.json";
import de4 from "../../../content/languages/de/level-4.json";
import de5 from "../../../content/languages/de/level-5.json";
import de6 from "../../../content/languages/de/level-6.json";

import ja1 from "../../../content/languages/ja/level-1.json";
import ja2 from "../../../content/languages/ja/level-2.json";
import ja3 from "../../../content/languages/ja/level-3.json";
import ja4 from "../../../content/languages/ja/level-4.json";
import ja5 from "../../../content/languages/ja/level-5.json";
import ja6 from "../../../content/languages/ja/level-6.json";

import type {
  LanguageCode,
  LanguageLevelContent,
  LanguageQuizResult,
  QuizQuestion,
} from "./types";

export const defaultLanguageContent: Record<
  LanguageCode,
  Record<number, LanguageLevelContent>
> = {
  de: {
    1: de1 as LanguageLevelContent,
    2: de2 as LanguageLevelContent,
    3: de3 as LanguageLevelContent,
    4: de4 as LanguageLevelContent,
    5: de5 as LanguageLevelContent,
    6: de6 as LanguageLevelContent,
  },
  ja: {
    1: ja1 as LanguageLevelContent,
    2: ja2 as LanguageLevelContent,
    3: ja3 as LanguageLevelContent,
    4: ja4 as LanguageLevelContent,
    5: ja5 as LanguageLevelContent,
    6: ja6 as LanguageLevelContent,
  },
};

/**
 * Determines whether a student qualifies for an extra language track based on
 * their first target destination country.
 * - DE -> German ("de")
 * - JP -> Japanese ("ja")
 * - Others -> null
 */
export function getLanguageTrack(countries?: string[]): LanguageCode | null {
  if (!countries || countries.length === 0) return null;
  const target = countries[0]?.toUpperCase();
  if (target === "DE") return "de";
  if (target === "JP") return "ja";
  return null;
}

/**
 * Checks whether content has been officially reviewed and signed off by a Founding Mentor.
 */
export function isContentReviewed(content: {
  reviewedBy?: string;
  reviewedAt?: string;
}): boolean {
  return Boolean(
    content.reviewedBy &&
      content.reviewedBy.trim().length > 0 &&
      content.reviewedAt &&
      content.reviewedAt.trim().length > 0,
  );
}

/**
 * Filters out unreviewed content when running in a production environment.
 */
export function filterReviewedContent<
  T extends { reviewedBy?: string; reviewedAt?: string },
>(items: T[], isProduction: boolean = false): T[] {
  if (!isProduction) return items;
  return items.filter(isContentReviewed);
}

/**
 * Deterministically generates a simple integer hash for seeding daily rotations.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Picks 5 deterministic questions for the student's daily language quest.
 * In production mode, unreviewed content returns null.
 */
export function pickLanguageQuest(
  lang: LanguageCode,
  level: number,
  dateStr: string,
  isProduction: boolean = false,
  customContent?: Record<LanguageCode, Record<number, LanguageLevelContent>>,
): (LanguageLevelContent & { questions: QuizQuestion[] }) | null {
  const catalog = customContent ?? defaultLanguageContent;
  const langLevels = catalog[lang];
  if (!langLevels) return null;

  const boundedLevel = Math.max(1, Math.min(6, level));
  const levelContent = langLevels[boundedLevel];
  if (!levelContent) return null;

  // Enforce Founding Mentor review rule in production
  if (isProduction && !isContentReviewed(levelContent)) {
    return null;
  }

  const items = levelContent.items;
  if (!items || items.length === 0) return null;

  const QUEST_SIZE = Math.min(5, items.length);
  const seed = hashString(`${lang}-${boundedLevel}-${dateStr}`);

  // Deterministically rotate/slice 5 questions based on day seed
  const startIndex = seed % items.length;
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < QUEST_SIZE; i++) {
    const idx = (startIndex + i) % items.length;
    questions.push(items[idx]!);
  }

  return {
    ...levelContent,
    questions,
  };
}

/**
 * Auto-marks a student's language quiz submission.
 * Comparison trims whitespace and is case-sensitive for language accuracy.
 * Passes if at least 80% (e.g. 4 of 5) of questions are answered correctly.
 */
export function markQuiz(
  answers: Record<string, string>,
  questions: QuizQuestion[],
): LanguageQuizResult {
  if (!questions || questions.length === 0) {
    return {
      passed: false,
      score: 0,
      total: 0,
      percentage: 0,
      results: [],
    };
  }

  let score = 0;
  const results = questions.map((q) => {
    const given = (answers[q.id] ?? "").trim();
    const expected = q.correctAnswer.trim();
    const correct = given === expected;
    if (correct) score++;
    return {
      questionId: q.id,
      given,
      expected,
      correct,
    };
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 80; // 4 out of 5 correct (or 80%+)

  return {
    passed,
    score,
    total,
    percentage,
    results,
  };
}
