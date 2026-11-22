import { describe, expect, it } from "vitest";
import {
  defaultScholarships,
  filterScholarships,
  getScholarshipById,
  listScholarships,
  validateScholarshipData,
} from "../src/scholarships";
import type { ScholarshipItem } from "../src/types";

describe("scholarships engine", () => {
  it("loads curated scholarships by default", () => {
    const list = listScholarships();
    expect(list.length).toBeGreaterThanOrEqual(15);

    const ids = list.map((s) => s.id);
    expect(ids).toContain("de-daad-epos");
    expect(ids).toContain("gb-chevening");
    expect(ids).toContain("us-fulbright");
    expect(ids).toContain("jp-mext-embassy");
    expect(ids).toContain("hu-stipendium");
    expect(ids).toContain("eu-erasmus-mundus");
  });

  it("finds scholarship by ID case-insensitively", () => {
    const daad = getScholarshipById(defaultScholarships, "de-daad-epos");
    expect(daad).toBeDefined();
    expect(daad?.name).toContain("DAAD EPOS");
    expect(daad?.provider).toContain("DAAD");

    const chevening = getScholarshipById(defaultScholarships, "GB-CHEVENING");
    expect(chevening?.name).toContain("Chevening");

    expect(getScholarshipById(defaultScholarships, "invalid-id")).toBeUndefined();
    expect(getScholarshipById(defaultScholarships, "")).toBeUndefined();
  });

  it("filters scholarships by coverage type", () => {
    const fullyFunded = filterScholarships(defaultScholarships, { coverageType: "fully_funded" });
    expect(fullyFunded.length).toBeGreaterThan(10);
    for (const s of fullyFunded) {
      expect(s.coverageType).toBe("fully_funded");
    }

    const waivers = filterScholarships(defaultScholarships, { coverageType: "tuition_waiver" });
    expect(waivers.length).toBeGreaterThan(0);
    for (const s of waivers) {
      expect(s.coverageType).toBe("tuition_waiver");
    }
  });

  it("filters scholarships by target country code", () => {
    const de = filterScholarships(defaultScholarships, { countryCode: "DE" });
    expect(de.length).toBeGreaterThanOrEqual(3);
    for (const s of de) {
      expect(s.targetCountryCodes.includes("DE") || s.targetCountryCodes.includes("GLOBAL")).toBe(true);
    }
  });

  it("filters scholarships by degree level", () => {
    const bachelors = filterScholarships(defaultScholarships, { degreeLevel: "bachelor" });
    expect(bachelors.length).toBeGreaterThan(0);
    for (const s of bachelors) {
      expect(s.degreeLevels).toContain("bachelor");
    }
  });

  it("filters scholarships by search query", () => {
    const searchHungary = filterScholarships(defaultScholarships, { query: "Hungaricum" });
    expect(searchHungary.length).toBe(1);
    expect(searchHungary[0]!.id).toBe("hu-stipendium");

    const searchCouncil = filterScholarships(defaultScholarships, { query: "British Council" });
    expect(searchCouncil.some((s) => s.id === "gb-great")).toBe(true);
  });

  it("filters scholarships by student CGPA eligibility", () => {
    // Student with CGPA 2.9 should see Stipendium Hungaricum (min 2.8) and Turkey,
    // but not DAAD EPOS (min 3.0) or Fulbright (min 3.25)
    const eligible = filterScholarships(defaultScholarships, { studentCgpa: 2.9 });
    for (const s of eligible) {
      if (typeof s.minRequirements.minCgpa === "number") {
        expect(s.minRequirements.minCgpa).toBeLessThanOrEqual(2.9);
      }
    }
    expect(eligible.some((s) => s.id === "hu-stipendium")).toBe(true);
    expect(eligible.some((s) => s.id === "de-daad-epos")).toBe(false);
    expect(eligible.some((s) => s.id === "us-fulbright")).toBe(false);
  });

  it("filters scholarships by student IELTS eligibility", () => {
    // Student with IELTS 6.0 should not see scholarships requiring 6.5 or 7.0
    const eligible = filterScholarships(defaultScholarships, { studentIelts: 6.0 });
    for (const s of eligible) {
      if (typeof s.minRequirements.minIelts === "number") {
        expect(s.minRequirements.minIelts).toBeLessThanOrEqual(6.0);
      }
    }
    expect(eligible.some((s) => s.id === "hu-stipendium")).toBe(true);
    expect(eligible.some((s) => s.id === "gb-chevening")).toBe(false);
  });

  it("validates all default scholarships", () => {
    for (const s of defaultScholarships) {
      expect(validateScholarshipData(s)).toBe(true);
      expect(s.applicationUrl.startsWith("http")).toBe(true);
      expect(s.benefits.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid scholarship objects", () => {
    expect(validateScholarshipData({} as ScholarshipItem)).toBe(false);
    expect(validateScholarshipData({ id: "x", name: "Schol" } as ScholarshipItem)).toBe(false);
  });
});
