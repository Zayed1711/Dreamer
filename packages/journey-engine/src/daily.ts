import wordsL1 from "../../../content/quests/english/words-level-1.json";
import wordsL2 from "../../../content/quests/english/words-level-2.json";
import wordsL3 from "../../../content/quests/english/words-level-3.json";
import wordsL4 from "../../../content/quests/english/words-level-4.json";
import wordsL5 from "../../../content/quests/english/words-level-5.json";
import wordsL6 from "../../../content/quests/english/words-level-6.json";
import promptsFile from "../../../content/quests/english/prompts.json";
import dictionaryWords from "../../../content/quests/english/dictionary/words.json";

import type {
  CheckResult,
  DailyQuest,
  DailyQuestType,
  DailyStreak,
  PromptItem,
  WordItem,
  WordListFile,
} from "./types";

export const defaultWordLists: Record<number, WordListFile> = {
  1: wordsL1 as WordListFile,
  2: wordsL2 as WordListFile,
  3: wordsL3 as WordListFile,
  4: wordsL4 as WordListFile,
  5: wordsL5 as WordListFile,
  6: wordsL6 as WordListFile,
};

export const defaultPrompts: PromptItem[] = promptsFile.prompts as PromptItem[];
export const defaultDictionary: string[] = dictionaryWords as string[];

/**
 * Returns today's date formatted as "YYYY-MM-DD" in Asia/Dhaka.
 * The daily quest resets at Dhaka midnight.
 */
export function questDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Deterministic integer hash for deterministic seeding.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministically chooses the daily quest type and content for a given Dhaka date and student level.
 */
export function pickDailyQuest(
  date: string,
  level: number = 1,
  seed: string = "",
  options?: {
    wordLists?: Record<number, WordListFile>;
    prompts?: PromptItem[];
  },
): DailyQuest {
  const clampedLevel = Math.max(1, Math.min(6, level));
  const wordLists = options?.wordLists ?? defaultWordLists;
  const prompts = options?.prompts ?? defaultPrompts;

  const h = hashString(`${date}:${seed}:lvl${clampedLevel}`);

  // Quest type selection
  let type: DailyQuestType = "words";
  if (clampedLevel <= 3) {
    // Levels 1-3: alternate words and sentences
    type = h % 2 === 0 ? "words" : "sentences";
  } else {
    // Levels 4-6: add writing task occasionally (every 4th hash)
    const mod = h % 4;
    if (mod === 0) type = "writing";
    else if (mod === 1 || mod === 2) type = "sentences";
    else type = "words";
  }

  // Select content based on type
  let words: WordItem[] | undefined;
  let prompt: PromptItem | undefined;

  const currentLevelWords = wordLists[clampedLevel]?.words ?? wordLists[1]?.words ?? [];
  const currentLevelPrompts = prompts.filter((p) => p.level === clampedLevel);
  const fallbackPrompts = currentLevelPrompts.length > 0 ? currentLevelPrompts : prompts;

  if (type === "words") {
    const totalWords = currentLevelWords.length;
    if (totalWords >= 5) {
      // Pick 5 consecutive words deterministically
      const maxStart = totalWords - 5;
      const startIndex = (h % Math.max(1, Math.floor(maxStart / 5) + 1)) * 5;
      words = currentLevelWords.slice(startIndex, startIndex + 5);
    } else {
      words = currentLevelWords.slice(0, 5);
    }
  } else {
    const pIndex = h % Math.max(1, fallbackPrompts.length);
    prompt = fallbackPrompts[pIndex];
  }

  return {
    date,
    track: "english",
    type,
    level: clampedLevel,
    ...(prompt ? { prompt } : {}),
    ...(words ? { words } : {}),
  };
}

/**
 * Checks submitted vocabulary words against dictionary and rules.
 * - exactly 5 entries
 * - each one a single word of letters
 * - each one in the dictionary
 * - no duplicates
 * - none already learned
 */
export function checkWords(
  input: string[] | string,
  options: {
    dictionary: Set<string> | string[];
    alreadyLearned?: Set<string> | string[];
  },
): CheckResult {
  const problems: string[] = [];

  const rawList = Array.isArray(input)
    ? input
    : input.split(/[\s,]+/).filter(Boolean);

  const cleanList = rawList.map((w) => w.trim()).filter((w) => w.length > 0);

  if (cleanList.length !== 5) {
    problems.push(
      `Please enter exactly 5 words (you entered ${cleanList.length}).`,
    );
  }

  const dictSet =
    options.dictionary instanceof Set
      ? options.dictionary
      : new Set(options.dictionary.map((w) => w.toLowerCase()));

  const learnedSet = options.alreadyLearned
    ? options.alreadyLearned instanceof Set
      ? options.alreadyLearned
      : new Set(Array.from(options.alreadyLearned).map((w) => w.toLowerCase()))
    : new Set<string>();

  const seenInInput = new Set<string>();

  for (const rawWord of cleanList) {
    const lower = rawWord.toLowerCase();

    // Check letters only
    if (!/^[a-zA-Z]+$/.test(rawWord)) {
      problems.push(`"${rawWord}" must be a single word containing only letters.`);
      continue;
    }

    // Check duplicate in input
    if (seenInInput.has(lower)) {
      problems.push(`"${rawWord}" was entered more than once.`);
    } else {
      seenInInput.add(lower);
    }

    // Check if already learned previously
    if (learnedSet.has(lower)) {
      problems.push(`You already learned "${rawWord}". Try a new word.`);
    }

    // Check dictionary
    if (!dictSet.has(lower)) {
      problems.push(`"${rawWord}" isn't a word we know. Check the spelling.`);
    }
  }

  return {
    passed: problems.length === 0,
    problems,
  };
}

/**
 * Checks submitted sentences against prompt and rules:
 * - exactly 5 sentences
 * - each one at least 4 words
 * - each starts with a capital letter and ends with '.', '!' or '?'
 * - no duplicates
 * - not copied from the prompt (overlap under 60%)
 */
export function checkSentences(
  input: string | string[],
  prompt: string | PromptItem,
): CheckResult {
  const problems: string[] = [];

  const promptText = typeof prompt === "string" ? prompt : prompt.prompt;

  // Normalize sentences list
  let sentences: string[];
  if (Array.isArray(input)) {
    sentences = input.map((s) => s.trim()).filter(Boolean);
  } else {
    // Split on sentence terminators followed by whitespace or line breaks
    const raw = input.trim();
    if (!raw) {
      sentences = [];
    } else {
      // Split by newlines or sentence endings
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 5) {
        sentences = lines;
      } else {
        sentences = raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  if (sentences.length !== 5) {
    problems.push(
      `Please write exactly 5 sentences (you wrote ${sentences.length}).`,
    );
  }

  // Words in the prompt for overlap calculation
  const promptWords = new Set(
    promptText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );

  const seenSentences = new Set<string>();

  sentences.forEach((sentence, idx) => {
    const num = idx + 1;
    const trimmed = sentence.trim();

    // Check capitalization and punctuation
    const startsWithCapital = /^[A-Z]/.test(trimmed);
    const endsWithPunctuation = /[.!?]$/.test(trimmed);
    if (!startsWithCapital || !endsWithPunctuation) {
      problems.push(
        `Sentence ${num} must start with a capital letter and end with '.', '!' or '?'.`,
      );
    }

    // Word count (at least 4 words)
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 4) {
      problems.push(
        `Sentence ${num} is too short (at least 4 words required; has ${words.length}).`,
      );
    }

    // Duplicate check
    const normalized = trimmed.toLowerCase();
    if (seenSentences.has(normalized)) {
      problems.push(`Sentence ${num} is a duplicate.`);
    } else {
      seenSentences.add(normalized);
    }

    // Overlap with prompt check (< 60%)
    if (words.length > 0 && promptWords.size > 0) {
      const meaningfulWords = words
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter((w) => w.length > 2);

      if (meaningfulWords.length > 0) {
        const overlapCount = meaningfulWords.filter((w) => promptWords.has(w)).length;
        const overlapRatio = overlapCount / meaningfulWords.length;
        if (overlapRatio >= 0.6) {
          problems.push(
            `Sentence ${num} is too similar to the prompt (${Math.round(overlapRatio * 100)}% match). Write in your own words.`,
          );
        }
      }
    }
  });

  return {
    passed: problems.length === 0,
    problems,
  };
}

/**
 * Calculates calendar difference in days between two YYYY-MM-DD dates.
 */
function daysBetween(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split("-").map(Number);
  const [y2, m2, d2] = dateB.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Adds months to a YYYY-MM-DD date string.
 */
function addMonthsToDate(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const target = new Date(Date.UTC(y, m - 1 + months, d));
  const newY = target.getUTCFullYear();
  const newM = String(target.getUTCMonth() + 1).padStart(2, "0");
  const newD = String(target.getUTCDate()).padStart(2, "0");
  return `${newY}-${newM}-${newD}`;
}

/**
 * Updates daily streak when today's quest is completed.
 * - Consecutive day: streak + 1
 * - Same day: unchanged
 * - Missed day: uses a freeze if left; otherwise streak resets to 1 (starting anew today)
 * - Exam season (holding): streak is paused, not broken
 * - Freezes refill to 2 every 4 months
 */
export function nextStreak(
  prev: DailyStreak | null,
  todayDateStr: string,
  options: { holding?: boolean } = {},
): DailyStreak {
  if (!prev) {
    return {
      currentCount: 1,
      bestCount: 1,
      lastPeriod: todayDateStr,
      freezesLeft: 2,
      freezesResetAt: todayDateStr,
    };
  }

  // Already completed today
  if (prev.lastPeriod === todayDateStr) {
    return { ...prev };
  }

  let freezesLeft = prev.freezesLeft;
  let freezesResetAt = prev.freezesResetAt || prev.lastPeriod;

  // Check 4-month refill rule: when today >= freezes_reset_at + 4 months
  let nextRefillDate = addMonthsToDate(freezesResetAt, 4);
  while (todayDateStr >= nextRefillDate) {
    freezesLeft = 2;
    freezesResetAt = nextRefillDate;
    nextRefillDate = addMonthsToDate(freezesResetAt, 4);
  }

  const diff = daysBetween(prev.lastPeriod, todayDateStr);

  if (diff <= 0) {
    // Past date submitted: no change
    return { ...prev };
  }

  if (diff === 1) {
    // Perfect consecutive day
    const newCount = prev.currentCount + 1;
    return {
      currentCount: newCount,
      bestCount: Math.max(prev.bestCount, newCount),
      lastPeriod: todayDateStr,
      freezesLeft,
      freezesResetAt,
    };
  }

  // More than 1 day difference
  if (options.holding) {
    // Exam season: paused, not broken!
    const newCount = prev.currentCount + 1;
    return {
      currentCount: newCount,
      bestCount: Math.max(prev.bestCount, newCount),
      lastPeriod: todayDateStr,
      freezesLeft,
      freezesResetAt,
    };
  }

  const missedDays = diff - 1;
  if (missedDays <= freezesLeft) {
    // Covered by freezes
    const newCount = prev.currentCount + 1;
    return {
      currentCount: newCount,
      bestCount: Math.max(prev.bestCount, newCount),
      lastPeriod: todayDateStr,
      freezesLeft: freezesLeft - missedDays,
      freezesResetAt,
    };
  }

  // Missed days exceeded freezes: streak resets to 1 for today's completed quest
  return {
    currentCount: 1,
    bestCount: prev.bestCount,
    lastPeriod: todayDateStr,
    freezesLeft: 0,
    freezesResetAt,
  };
}

/**
 * Validates quest content integrity.
 */
export function validateQuestContent(
  wordLists: Record<number, WordListFile> = defaultWordLists,
  prompts: PromptItem[] = defaultPrompts,
  dictionary: string[] = defaultDictionary,
): string[] {
  const problems: string[] = [];

  for (let lvl = 1; lvl <= 6; lvl++) {
    const list = wordLists[lvl];
    if (!list) {
      problems.push(`Missing word list for level ${lvl}`);
      continue;
    }
    if (list.words.length < 5) {
      problems.push(`Word list level ${lvl} has only ${list.words.length} words (needs >= 5)`);
    }
    const seenWords = new Set<string>();
    for (const item of list.words) {
      if (seenWords.has(item.word.toLowerCase())) {
        problems.push(`Duplicate word "${item.word}" in level ${lvl}`);
      }
      seenWords.add(item.word.toLowerCase());
      if (!item.meaning) problems.push(`Word "${item.word}" missing meaning`);
      if (!item.sentence) problems.push(`Word "${item.word}" missing sentence`);
    }
  }

  if (prompts.length === 0) {
    problems.push("No prompts available");
  }
  for (const p of prompts) {
    if (!p.id) problems.push("Prompt missing id");
    if (!p.prompt) problems.push(`Prompt ${p.id} missing text`);
    if (!(p.level >= 1 && p.level <= 6)) problems.push(`Prompt ${p.id} has invalid level`);
  }

  if (dictionary.length < 100) {
    problems.push(`Dictionary has only ${dictionary.length} words`);
  }

  return problems;
}
