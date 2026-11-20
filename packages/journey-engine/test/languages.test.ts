import { describe, expect, it } from "vitest";
import {
  defaultLanguageContent,
  filterReviewedContent,
  getLanguageTrack,
  isContentReviewed,
  markQuiz,
  pickLanguageQuest,
  type QuizQuestion,
} from "../src";

describe("Language Tracks (Phase 5)", () => {
  describe("getLanguageTrack", () => {
    it("assigns German (de) when the first target country is Germany (DE)", () => {
      expect(getLanguageTrack(["DE"])).toBe("de");
      expect(getLanguageTrack(["de", "US"])).toBe("de");
      expect(getLanguageTrack(["DE", "JP"])).toBe("de");
    });

    it("assigns Japanese (ja) when the first target country is Japan (JP)", () => {
      expect(getLanguageTrack(["JP"])).toBe("ja");
      expect(getLanguageTrack(["jp", "DE"])).toBe("ja");
    });

    it("returns null for English-only destination countries or empty choices", () => {
      expect(getLanguageTrack(["US", "DE"])).toBeNull();
      expect(getLanguageTrack(["GB"])).toBeNull();
      expect(getLanguageTrack(["CA"])).toBeNull();
      expect(getLanguageTrack([])).toBeNull();
      expect(getLanguageTrack(undefined)).toBeNull();
    });
  });

  describe("Content Review Rules", () => {
    it("validates reviewed content with reviewer signature", () => {
      const reviewed = {
        title: "Test",
        reviewedBy: "Tanvir Ahmed (Founding Mentor, TU Munich)",
        reviewedAt: "2026-11-20",
      };
      const unreviewed = {
        title: "Test",
        reviewedBy: "",
        reviewedAt: "",
      };

      expect(isContentReviewed(reviewed)).toBe(true);
      expect(isContentReviewed(unreviewed)).toBe(false);
    });

    it("hides unreviewed content in production builds", () => {
      const items = [
        { id: "1", reviewedBy: "Mentor A", reviewedAt: "2026-11-20" },
        { id: "2" }, // unreviewed
      ];

      expect(filterReviewedContent(items, false)).toHaveLength(2); // dev mode shows all
      expect(filterReviewedContent(items, true)).toHaveLength(1); // production hides unreviewed
      expect(filterReviewedContent(items, true)[0]?.id).toBe("1");
    });

    it("ensures all default German and Japanese levels have Founding Mentor reviews", () => {
      for (const lang of ["de", "ja"] as const) {
        for (let lvl = 1; lvl <= 6; lvl++) {
          const levelData = defaultLanguageContent[lang][lvl];
          expect(levelData).toBeDefined();
          if (!levelData) throw new Error(`Missing level ${lvl} for ${lang}`);
          expect(isContentReviewed(levelData)).toBe(true);
          expect(levelData.reviewedBy).toBeTruthy();
          expect(levelData.items.length).toBeGreaterThanOrEqual(5);
        }
      }
    });
  });

  describe("pickLanguageQuest", () => {
    it("deterministically picks 5 questions for German Level 1", () => {
      const quest1 = pickLanguageQuest("de", 1, "2026-11-20");
      const quest2 = pickLanguageQuest("de", 1, "2026-11-20");
      expect(quest1).not.toBeNull();
      expect(quest1?.questions).toHaveLength(5);
      expect(quest1?.questions.map((q) => q.id)).toEqual(
        quest2?.questions.map((q) => q.id),
      );
    });

    it("deterministically picks 5 questions for Japanese Level 1", () => {
      const quest = pickLanguageQuest("ja", 1, "2026-11-20");
      expect(quest).not.toBeNull();
      expect(quest?.questions).toHaveLength(5);
      expect(quest?.lang).toBe("ja");
    });

    it("clamps level to range [1, 6]", () => {
      const qLow = pickLanguageQuest("de", 0, "2026-11-20");
      const qHigh = pickLanguageQuest("de", 99, "2026-11-20");
      expect(qLow?.level).toBe(1);
      expect(qHigh?.level).toBe(6);
    });

    it("returns null in production if content is unreviewed", () => {
      const mockContent = {
        de: {
          1: {
            lang: "de" as const,
            level: 1,
            title: "Unreviewed Lesson",
            description: "No mentor has reviewed this yet",
            items: [
              {
                id: "q1",
                type: "multiple_choice" as const,
                prompt: "test",
                options: ["a", "b"],
                correctAnswer: "a",
              },
            ],
          },
        },
        ja: {},
      } as any;

      const devResult = pickLanguageQuest("de", 1, "2026-11-20", false, mockContent);
      expect(devResult).not.toBeNull();

      const prodResult = pickLanguageQuest("de", 1, "2026-11-20", true, mockContent);
      expect(prodResult).toBeNull();
    });
  });

  describe("markQuiz", () => {
    const questions: QuizQuestion[] = [
      { id: "q1", type: "multiple_choice", prompt: "p1", options: ["A", "B"], correctAnswer: "A" },
      { id: "q2", type: "multiple_choice", prompt: "p2", options: ["A", "B"], correctAnswer: "B" },
      { id: "q3", type: "multiple_choice", prompt: "p3", options: ["A", "B"], correctAnswer: "A" },
      { id: "q4", type: "multiple_choice", prompt: "p4", options: ["A", "B"], correctAnswer: "B" },
      { id: "q5", type: "multiple_choice", prompt: "p5", options: ["A", "B"], correctAnswer: "A" },
    ];

    it("passes when student scores 100% (5/5)", () => {
      const answers = { q1: "A", q2: "B", q3: "A", q4: "B", q5: "A" };
      const res = markQuiz(answers, questions);
      expect(res.passed).toBe(true);
      expect(res.score).toBe(5);
      expect(res.percentage).toBe(100);
    });

    it("passes when student scores 80% (4/5)", () => {
      const answers = { q1: "A", q2: "B", q3: "A", q4: "B", q5: "WRONG" };
      const res = markQuiz(answers, questions);
      expect(res.passed).toBe(true);
      expect(res.score).toBe(4);
      expect(res.percentage).toBe(80);
    });

    it("fails when student scores below 80% (e.g. 3/5)", () => {
      const answers = { q1: "A", q2: "B", q3: "A", q4: "WRONG", q5: "WRONG" };
      const res = markQuiz(answers, questions);
      expect(res.passed).toBe(false);
      expect(res.score).toBe(3);
      expect(res.percentage).toBe(60);
    });

    it("trims whitespace from answers and handles missing entries", () => {
      const answers = { q1: "  A  ", q2: "B" };
      const res = markQuiz(answers, questions);
      expect(res.score).toBe(2);
      expect(res.passed).toBe(false);
      expect(res.results.find((r) => r.questionId === "q3")?.given).toBe("");
    });
  });
});
