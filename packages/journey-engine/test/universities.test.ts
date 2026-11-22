import { describe, expect, it } from "vitest";
import {
  defaultUniversities,
  filterUniversities,
  getUniversityById,
  listUniversities,
  validateUniversityData,
} from "../src/universities";
import type { UniversityItem } from "../src/types";

describe("universities engine", () => {
  it("loads curated universities by default", () => {
    const list = listUniversities();
    expect(list.length).toBeGreaterThanOrEqual(20);

    const ids = list.map((u) => u.id);
    expect(ids).toContain("de-tum");
    expect(ids).toContain("us-uta");
    expect(ids).toContain("gb-coventry");
    expect(ids).toContain("jp-u-tokyo");
    expect(ids).toContain("hu-elte");
  });

  it("finds university by ID case-insensitively", () => {
    const tum = getUniversityById(defaultUniversities, "de-tum");
    expect(tum).toBeDefined();
    expect(tum?.name).toBe("Technical University of Munich (TUM)");
    expect(tum?.countryCode).toBe("DE");

    const uta = getUniversityById(defaultUniversities, "US-UTA");
    expect(uta?.city).toContain("Arlington");

    expect(getUniversityById(defaultUniversities, "non-existent")).toBeUndefined();
    expect(getUniversityById(defaultUniversities, "")).toBeUndefined();
  });

  it("filters universities by Budget in BDT category", () => {
    const lowBudget = filterUniversities(defaultUniversities, { tuitionCategory: "low" });
    expect(lowBudget.length).toBeGreaterThan(5);
    for (const u of lowBudget) {
      expect(u.tuitionCategory).toBe("low");
    }
    expect(lowBudget.some((u) => u.id === "de-tum")).toBe(true);

    const highBudget = filterUniversities(defaultUniversities, { tuitionCategory: "high" });
    expect(highBudget.length).toBeGreaterThan(3);
    for (const u of highBudget) {
      expect(u.tuitionCategory).toBe("high");
    }
    expect(highBudget.some((u) => u.id === "gb-coventry")).toBe(true);
  });

  it("filters universities by numeric maximum tuition in BDT", () => {
    const freeOnly = filterUniversities(defaultUniversities, { maxTuitionBDT: 0 });
    expect(freeOnly.length).toBeGreaterThan(0);
    for (const u of freeOnly) {
      expect(u.tuitionBDTAnnualMin).toBe(0);
    }
  });

  it("filters universities by search text (query)", () => {
    const csUnis = filterUniversities(defaultUniversities, { query: "Informatics" });
    expect(csUnis.some((u) => u.id === "de-tum")).toBe(true);

    const texasUnis = filterUniversities(defaultUniversities, { query: "Texas" });
    expect(texasUnis.length).toBeGreaterThanOrEqual(2);
    expect(texasUnis.every((u) => u.city.includes("Texas"))).toBe(true);
  });

  it("filters universities by country code", () => {
    const germanUnis = filterUniversities(defaultUniversities, { countryCode: "DE" });
    expect(germanUnis.length).toBeGreaterThanOrEqual(5);
    for (const u of germanUnis) {
      expect(u.countryCode).toBe("DE");
    }
  });

  it("filters universities by degree level", () => {
    const bachelors = filterUniversities(defaultUniversities, { degreeLevel: "bachelor" });
    for (const u of bachelors) {
      expect(u.degreeLevels).toContain("bachelor");
    }
  });

  it("filters universities matching student CGPA eligibility", () => {
    // Student with CGPA 2.85 should only see universities where minCgpa <= 2.85
    const eligible = filterUniversities(defaultUniversities, { studentCgpa: 2.85 });
    for (const u of eligible) {
      expect(u.minRequirements.minCgpa).toBeLessThanOrEqual(2.85);
    }
    // TUM requires 3.3, so it should NOT be in this list
    expect(eligible.some((u) => u.id === "de-tum")).toBe(false);
    // Passau requires 2.8, so it SHOULD be in this list
    expect(eligible.some((u) => u.id === "de-passau")).toBe(true);
  });

  it("filters universities matching student IELTS eligibility", () => {
    // Student with IELTS 6.0 should only see universities where minIelts <= 6.0
    const eligible = filterUniversities(defaultUniversities, { studentIelts: 6.0 });
    for (const u of eligible) {
      expect(u.minRequirements.minIelts).toBeLessThanOrEqual(6.0);
    }
    // Birmingham requires 6.5+, so it should not be in this list
    expect(eligible.some((u) => u.id === "gb-birmingham")).toBe(false);
  });

  it("filters universities by intake season", () => {
    const summerUnis = filterUniversities(defaultUniversities, { season: "Summer/Spring" });
    for (const u of summerUnis) {
      expect(u.intakes.some((i) => i.season === "Summer/Spring")).toBe(true);
    }
  });

  it("validates all default universities", () => {
    for (const u of defaultUniversities) {
      expect(validateUniversityData(u)).toBe(true);
      expect(u.admissionsPortalUrl.startsWith("http")).toBe(true);
    }
  });

  it("rejects invalid university data", () => {
    expect(validateUniversityData({} as UniversityItem)).toBe(false);
    expect(validateUniversityData({ id: "x", name: "Uni" } as UniversityItem)).toBe(false);
  });
});
