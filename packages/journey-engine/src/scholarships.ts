import scholarshipsJson from "../../../content/scholarships/scholarships.json";
import type { ScholarshipFilter, ScholarshipItem } from "./types";
import { validYearlyDate } from "./universities";

export const defaultScholarships: ScholarshipItem[] = scholarshipsJson as ScholarshipItem[];

/**
 * Returns all available scholarship and waiver programs.
 */
export function listScholarships(
  scholarships: ScholarshipItem[] = defaultScholarships,
): ScholarshipItem[] {
  return [...scholarships];
}

/**
 * Looks up a scholarship program by its unique ID.
 */
export function getScholarshipById(
  scholarships: ScholarshipItem[] = defaultScholarships,
  id: string,
): ScholarshipItem | undefined {
  if (!id) return undefined;
  const target = id.trim().toLowerCase();
  return scholarships.find((s) => s.id.toLowerCase() === target);
}

/**
 * Filters scholarships based on search text, target country, degree level,
 * coverage type, and student academic eligibility (CGPA/IELTS).
 */
export function filterScholarships(
  scholarships: ScholarshipItem[] = defaultScholarships,
  filter?: ScholarshipFilter,
): ScholarshipItem[] {
  let result = [...scholarships];

  if (!filter) return result;

  // Search keyword query
  if (filter.query && filter.query.trim().length > 0) {
    const q = filter.query.trim().toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.targetCountryNames.some((c) => c.toLowerCase().includes(q)) ||
        s.benefits.some((b) => b.toLowerCase().includes(q)) ||
        (s.bdSpecificNotes && s.bdSpecificNotes.toLowerCase().includes(q)),
    );
  }

  // Country filter (matches exact country code or GLOBAL)
  if (filter.countryCode && filter.countryCode !== "ALL") {
    const target = filter.countryCode.trim().toUpperCase();
    result = result.filter(
      (s) => s.targetCountryCodes.includes(target) || s.targetCountryCodes.includes("GLOBAL"),
    );
  }

  // Degree level filter
  if (filter.degreeLevel) {
    result = result.filter((s) => s.degreeLevels.includes(filter.degreeLevel!));
  }

  // Coverage type filter (fully_funded, tuition_waiver, partial_stipend)
  if (filter.coverageType && filter.coverageType !== "ALL") {
    result = result.filter((s) => s.coverageType === filter.coverageType);
  }

  // Student CGPA eligibility: only show scholarships where student CGPA meets minimum (or no min CGPA specified)
  if (typeof filter.studentCgpa === "number" && !isNaN(filter.studentCgpa)) {
    result = result.filter(
      (s) =>
        typeof s.minRequirements.minCgpa !== "number" ||
        filter.studentCgpa! >= s.minRequirements.minCgpa,
    );
  }

  // Student IELTS eligibility: only show scholarships where student IELTS meets minimum (or no min IELTS specified)
  if (typeof filter.studentIelts === "number" && !isNaN(filter.studentIelts)) {
    result = result.filter(
      (s) =>
        typeof s.minRequirements.minIelts !== "number" ||
        filter.studentIelts! >= s.minRequirements.minIelts,
    );
  }

  return result;
}

/**
 * Validates consistency of a scholarship record.
 */
export function validateScholarshipData(s: ScholarshipItem): boolean {
  if (!s.id || s.id.trim().length === 0) return false;
  if (!s.name || s.name.trim().length === 0) return false;
  if (!s.provider || s.provider.trim().length === 0) return false;
  if (!Array.isArray(s.targetCountryCodes) || s.targetCountryCodes.length === 0) return false;
  if (!Array.isArray(s.degreeLevels) || s.degreeLevels.length === 0) return false;
  if (!["fully_funded", "tuition_waiver", "partial_stipend"].includes(s.coverageType)) return false;
  if (!Array.isArray(s.benefits) || s.benefits.length === 0) return false;
  if (!s.applicationUrl || !s.applicationUrl.startsWith("http")) return false;
  if (!s.applicationWindow || !validYearlyDate(s.applicationWindow.opens) || !validYearlyDate(s.applicationWindow.deadline)) return false;
  if (!Array.isArray(s.sources) || s.sources.length === 0) return false;
  return true;
}
