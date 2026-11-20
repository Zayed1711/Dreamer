import { describe, expect, it } from "vitest";
import {
  defaultMentors,
  filterMentors,
  findMentorsForTopic,
  validateMentorApplication,
  type MentorProfile,
} from "../src";

describe("Mentors & Advisors (Phase 6)", () => {
  const sampleMentors: MentorProfile[] = [
    {
      id: "m1",
      name: "Tanvir Ahmed",
      university: "TUM",
      country: "DE",
      subject: "CS",
      intakeYear: 2023,
      bio: "Master's student at TU Munich guiding students in Germany.",
      topics: ["scholarships", "life-abroad"],
      isFounding: true,
      status: "approved",
    },
    {
      id: "m2",
      name: "Kazi Sakib",
      university: "Todai",
      country: "JP",
      subject: "EE",
      intakeYear: 2022,
      bio: "MEXT Scholar in Tokyo helping students with lab professors.",
      topics: ["scholarships", "sop-review"],
      isFounding: true,
      status: "approved",
    },
    {
      id: "m3",
      name: "Pending Applicant",
      university: "UniMelb",
      country: "AU",
      subject: "Data",
      intakeYear: 2024,
      bio: "Under review pending verification documents.",
      topics: ["life-abroad"],
      isFounding: false,
      status: "pending",
    },
  ];

  describe("filterMentors", () => {
    it("returns only approved mentors", () => {
      const result = filterMentors(sampleMentors);
      expect(result).toHaveLength(2);
      expect(result.some((m) => m.id === "m3")).toBe(false);
    });

    it("filters by country case-insensitively", () => {
      const de = filterMentors(sampleMentors, { country: "de" });
      expect(de).toHaveLength(1);
      expect(de[0]?.name).toBe("Tanvir Ahmed");

      const jp = filterMentors(sampleMentors, { country: "JP" });
      expect(jp).toHaveLength(1);
      expect(jp[0]?.name).toBe("Kazi Sakib");
    });

    it("filters by topic", () => {
      const sop = filterMentors(sampleMentors, { topic: "sop-review" });
      expect(sop).toHaveLength(1);
      expect(sop[0]?.id).toBe("m2");

      const life = filterMentors(sampleMentors, { topic: "life-abroad" });
      expect(life).toHaveLength(1);
      expect(life[0]?.id).toBe("m1");
    });

    it("filters by foundingOnly flag", () => {
      const founding = filterMentors(defaultMentors, { foundingOnly: true });
      expect(founding.length).toBeGreaterThan(0);
      expect(founding.every((m) => m.isFounding)).toBe(true);
    });
  });

  describe("findMentorsForTopic", () => {
    it("finds mentors matching an advisorTopic from milestones", () => {
      const mentors = findMentorsForTopic(sampleMentors, "scholarships");
      expect(mentors).toHaveLength(2);
    });

    it("returns empty array for unmatched or empty topics", () => {
      expect(findMentorsForTopic(sampleMentors, "unknown-topic")).toHaveLength(0);
      expect(findMentorsForTopic(sampleMentors, "")).toHaveLength(0);
    });
  });

  describe("validateMentorApplication", () => {
    const validApplication = {
      name: "Zayed Ahmed",
      university: "RWTH Aachen University",
      country: "DE",
      subject: "Mechanical Engineering",
      intakeYear: 2023,
      bio: "Currently studying in Aachen. Willing to help juniors with APS certification and blocked accounts.",
      topics: ["life-abroad", "visa-interview"],
      proofFileName: "rwth_student_card.pdf",
    };

    it("accepts a fully valid mentor application", () => {
      const res = validateMentorApplication(validApplication);
      expect(res.valid).toBe(true);
      expect(res.problems).toHaveLength(0);
    });

    it("rejects incomplete or invalid fields", () => {
      const invalid = {
        name: "",
        university: "U",
        country: "GER", // needs 2 chars
        subject: "",
        intakeYear: 1990, // too old
        bio: "Too short", // <30 chars
        topics: [],
        proofFileName: "",
      };

      const res = validateMentorApplication(invalid);
      expect(res.valid).toBe(false);
      expect(res.problems.length).toBeGreaterThanOrEqual(7);
      expect(res.problems).toContain("Please enter your full legal name.");
      expect(res.problems).toContain("Please select your study-abroad destination country.");
      expect(res.problems).toContain("Please upload a proof of enrollment, visa, or student ID card for verification.");
    });
  });
});
