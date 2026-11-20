import { describe, expect, it } from "vitest";
import {
  checkSentences,
  checkWords,
  computeProgress,
  defaultContent,
  generateJourney,
  nextStreak,
  pickDailyQuest,
  questDate,
  validateQuestContent,
} from "../src/index";
import type { DailyStreak, Profile } from "../src/types";

describe("Daily quest content", () => {
  it("validates all shipped word lists, prompts, and dictionary", () => {
    const problems = validateQuestContent();
    expect(problems).toEqual([]);
  });
});

describe("questDate (Dhaka time)", () => {
  it("computes the date at Dhaka timezone across UTC midnight boundary", () => {
    // 2026-11-20 17:59:59 UTC is 23:59:59 in Dhaka (+6)
    const justBeforeDhakaMidnight = new Date("2026-11-20T17:59:59.000Z");
    expect(questDate(justBeforeDhakaMidnight)).toBe("2026-11-20");

    // 2026-11-20 18:00:00 UTC is 00:00:00 in Dhaka on Nov 21
    const atDhakaMidnight = new Date("2026-11-20T18:00:00.000Z");
    expect(questDate(atDhakaMidnight)).toBe("2026-11-21");
  });
});

describe("pickDailyQuest", () => {
  it("is deterministic for the same date, level and seed", () => {
    const q1 = pickDailyQuest("2026-11-20", 2, "student_123");
    const q2 = pickDailyQuest("2026-11-20", 2, "student_123");
    expect(q1).toEqual(q2);
  });

  it("selects words or sentences for levels 1-3", () => {
    const q = pickDailyQuest("2026-11-20", 1, "test");
    expect(["words", "sentences"]).toContain(q.type);
    if (q.type === "words") {
      expect(q.words).toBeDefined();
      expect(q.words?.length).toBe(5);
    } else {
      expect(q.prompt).toBeDefined();
    }
  });

  it("can select writing task for upper levels", () => {
    // test multiple dates to verify rotation in levels 4-6
    const types = new Set<string>();
    for (let day = 1; day <= 20; day++) {
      const d = `2026-11-${String(day).padStart(2, "0")}`;
      const q = pickDailyQuest(d, 5, "seed_val");
      types.add(q.type);
    }
    expect(types.has("writing") || types.has("sentences")).toBe(true);
  });
});

describe("checkWords", () => {
  const dictionary = ["abroad", "airport", "budget", "campus", "degree", "dorm", "exam"];
  const learned = ["abroad"];

  it("passes when exactly 5 valid new words are given", () => {
    const res = checkWords(["airport", "budget", "campus", "degree", "dorm"], {
      dictionary,
      alreadyLearned: learned,
    });
    expect(res.passed).toBe(true);
    expect(res.problems).toEqual([]);
  });

  it("fails when fewer than 5 words are given", () => {
    const res = checkWords(["airport", "budget"], { dictionary });
    expect(res.passed).toBe(false);
    expect(res.problems[0]).toMatch(/exactly 5 words/);
  });

  it("fails when words contain non-letter characters", () => {
    const res = checkWords(["airport1", "budget!", "campus", "degree", "dorm"], { dictionary });
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("must be a single word containing only letters"))).toBe(true);
  });

  it("fails on duplicate words in the input", () => {
    const res = checkWords(["budget", "budget", "campus", "degree", "dorm"], { dictionary });
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("entered more than once"))).toBe(true);
  });

  it("fails on already learned words", () => {
    const res = checkWords(["abroad", "budget", "campus", "degree", "dorm"], {
      dictionary,
      alreadyLearned: learned,
    });
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("already learned"))).toBe(true);
  });

  it("fails when word is not in the dictionary", () => {
    const res = checkWords(["recieve", "budget", "campus", "degree", "dorm"], { dictionary });
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("isn't a word we know"))).toBe(true);
  });
});

describe("checkSentences", () => {
  const prompt = {
    id: "p1",
    level: 1,
    prompt: "Describe your study room or desk in 5 sentences.",
  };

  const validSentences = [
    "My study desk is made of sturdy wood.",
    "A bright lamp sits on the left corner.",
    "I keep my grammar textbooks neatly stacked.",
    "There is a small window behind my chair.",
    "Studying here helps me concentrate every evening.",
  ];

  it("passes with 5 well-formed sentences", () => {
    const res = checkSentences(validSentences, prompt);
    expect(res.passed).toBe(true);
    expect(res.problems).toEqual([]);
  });

  it("fails when fewer than 5 sentences are provided", () => {
    const res = checkSentences(validSentences.slice(0, 3), prompt);
    expect(res.passed).toBe(false);
    expect(res.problems[0]).toMatch(/exactly 5 sentences/);
  });

  it("fails when a sentence has fewer than 4 words", () => {
    const short = [...validSentences];
    short[0] = "I study here."; // 3 words
    const res = checkSentences(short, prompt);
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("Sentence 1 is too short"))).toBe(true);
  });

  it("fails when a sentence lacks capital letter or terminal punctuation", () => {
    const noCap = [...validSentences];
    noCap[1] = "a bright lamp sits on the left corner"; // no capital, no period
    const res = checkSentences(noCap, prompt);
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("must start with a capital letter and end with"))).toBe(true);
  });

  it("fails on duplicate sentences", () => {
    const dup = [...validSentences];
    dup[1] = dup[0]!;
    const res = checkSentences(dup, prompt);
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("duplicate"))).toBe(true);
  });

  it("fails when copying directly from the prompt", () => {
    const copied = [...validSentences];
    copied[0] = "Describe your study room desk in 5 sentences."; // high overlap with prompt
    const res = checkSentences(copied, prompt);
    expect(res.passed).toBe(false);
    expect(res.problems.some((p) => p.includes("too similar to the prompt"))).toBe(true);
  });
});

describe("nextStreak", () => {
  it("initializes streak on first completion", () => {
    const streak = nextStreak(null, "2026-11-20");
    expect(streak).toEqual({
      currentCount: 1,
      bestCount: 1,
      lastPeriod: "2026-11-20",
      freezesLeft: 2,
      freezesResetAt: "2026-11-20",
    });
  });

  it("does not increment on same-day completion", () => {
    const initial: DailyStreak = {
      currentCount: 3,
      bestCount: 5,
      lastPeriod: "2026-11-20",
      freezesLeft: 2,
      freezesResetAt: "2026-11-01",
    };
    const updated = nextStreak(initial, "2026-11-20");
    expect(updated).toEqual(initial);
  });

  it("increments on consecutive day", () => {
    const initial: DailyStreak = {
      currentCount: 2,
      bestCount: 2,
      lastPeriod: "2026-11-20",
      freezesLeft: 2,
      freezesResetAt: "2026-11-01",
    };
    const updated = nextStreak(initial, "2026-11-21");
    expect(updated.currentCount).toBe(3);
    expect(updated.bestCount).toBe(3);
    expect(updated.freezesLeft).toBe(2);
    expect(updated.lastPeriod).toBe("2026-11-21");
  });

  it("uses a freeze on a single missed day", () => {
    const initial: DailyStreak = {
      currentCount: 5,
      bestCount: 5,
      lastPeriod: "2026-11-19",
      freezesLeft: 2,
      freezesResetAt: "2026-11-01",
    };
    // missed Nov 20, completed on Nov 21 (diff = 2, missed = 1)
    const updated = nextStreak(initial, "2026-11-21");
    expect(updated.currentCount).toBe(6);
    expect(updated.bestCount).toBe(6);
    expect(updated.freezesLeft).toBe(1);
    expect(updated.lastPeriod).toBe("2026-11-21");
  });

  it("resets streak to 1 when missed days exceed freezes", () => {
    const initial: DailyStreak = {
      currentCount: 7,
      bestCount: 7,
      lastPeriod: "2026-11-15",
      freezesLeft: 1,
      freezesResetAt: "2026-11-01",
    };
    // missed 5 days, only 1 freeze left
    const updated = nextStreak(initial, "2026-11-21");
    expect(updated.currentCount).toBe(1);
    expect(updated.bestCount).toBe(7);
    expect(updated.freezesLeft).toBe(0);
    expect(updated.lastPeriod).toBe("2026-11-21");
  });

  it("pauses streak during holding (exam season) without consuming freezes", () => {
    const initial: DailyStreak = {
      currentCount: 10,
      bestCount: 10,
      lastPeriod: "2026-11-01",
      freezesLeft: 2,
      freezesResetAt: "2026-11-01",
    };
    // 20 days later, but in holding mode
    const updated = nextStreak(initial, "2026-11-21", { holding: true });
    expect(updated.currentCount).toBe(11);
    expect(updated.bestCount).toBe(11);
    expect(updated.freezesLeft).toBe(2); // no freezes consumed
  });

  it("refills freezes to 2 when 4 months elapse", () => {
    const initial: DailyStreak = {
      currentCount: 4,
      bestCount: 4,
      lastPeriod: "2026-07-01",
      freezesLeft: 0,
      freezesResetAt: "2026-07-01",
    };
    // 4.5 months later (Nov 20)
    const updated = nextStreak(initial, "2026-11-20", { holding: true });
    expect(updated.freezesLeft).toBe(2);
  });
});

describe("computeProgress with extraExp", () => {
  const profile: Profile = {
    stage: "ug1",
    degree: "masters",
    englishLevel: "intermediate",
    countries: ["DE"],
  };
  const journey = generateJourney(profile, "2026-11");

  it("adds extraExp to exp, level, and stats.english without altering rank or flight status", () => {
    const baseProgress = computeProgress(journey, [], "2026-11", defaultContent, 0);
    const withExtra = computeProgress(journey, [], "2026-11", defaultContent, 100);

    expect(withExtra.exp).toBe(baseProgress.exp + 100);
    expect(withExtra.stats.english).toBe(baseProgress.stats.english + 100);
    expect(withExtra.stats.academics).toBe(baseProgress.stats.academics);

    // Rank and gates are unaffected
    expect(withExtra.rank).toBe(baseProgress.rank);
    expect(withExtra.planePosition).toBe(baseProgress.planePosition);
    expect(withExtra.journeyPercent).toBe(baseProgress.journeyPercent);
    expect(withExtra.flightStatus).toBe(baseProgress.flightStatus);
  });
});
