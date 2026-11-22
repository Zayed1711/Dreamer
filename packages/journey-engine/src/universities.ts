import universitiesJson from "../../../content/universities/universities.json";
import type { UniversityFilter, UniversityItem } from "./types";

export const defaultUniversities: UniversityItem[] = universitiesJson as UniversityItem[];

/**
 * Returns the list of curated universities.
 */
export function listUniversities(
  universities: UniversityItem[] = defaultUniversities,
): UniversityItem[] {
  return [...universities];
}

/**
 * Looks up a university by its unique ID.
 */
export function getUniversityById(
  universities: UniversityItem[] = defaultUniversities,
  id: string,
): UniversityItem | undefined {
  if (!id) return undefined;
  const target = id.trim().toLowerCase();
  return universities.find((u) => u.id.toLowerCase() === target);
}

/**
 * Filters universities based on search query, target country, degree level,
 * budget in BDT, student CGPA/IELTS eligibility, and upcoming intake seasons.
 */
export function filterUniversities(
  universities: UniversityItem[] = defaultUniversities,
  filter?: UniversityFilter,
): UniversityItem[] {
  let result = [...universities];

  if (!filter) return result;

  // Search text query
  if (filter.query && filter.query.trim().length > 0) {
    const q = filter.query.trim().toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.countryName.toLowerCase().includes(q) ||
        u.countryCode.toLowerCase().includes(q) ||
        u.popularPrograms.some((p) => p.toLowerCase().includes(q)) ||
        u.waiversAndScholarships.some((s) => s.toLowerCase().includes(q)),
    );
  }

  // Country filter
  if (filter.countryCode && filter.countryCode !== "ALL") {
    const target = filter.countryCode.trim().toUpperCase();
    result = result.filter((u) => u.countryCode.toUpperCase() === target);
  }

  // Degree level filter
  if (filter.degreeLevel) {
    result = result.filter((u) => u.degreeLevels.includes(filter.degreeLevel!));
  }

  // Tuition Category Filter (low: < 2L BDT/yr, moderate: 2-15L BDT/yr, high: > 15L BDT/yr)
  if (filter.tuitionCategory && filter.tuitionCategory !== "ALL") {
    result = result.filter((u) => u.tuitionCategory === filter.tuitionCategory);
  }

  // Numeric maximum tuition in BDT
  if (typeof filter.maxTuitionBDT === "number" && !isNaN(filter.maxTuitionBDT)) {
    result = result.filter((u) => u.tuitionBDTAnnualMin <= filter.maxTuitionBDT!);
  }

  // Student CGPA eligibility: only show universities where student CGPA >= minimum requirement
  if (typeof filter.studentCgpa === "number" && !isNaN(filter.studentCgpa)) {
    result = result.filter((u) => filter.studentCgpa! >= u.minRequirements.minCgpa);
  }

  // Student IELTS eligibility: only show universities where student IELTS >= minimum requirement
  if (typeof filter.studentIelts === "number" && !isNaN(filter.studentIelts)) {
    result = result.filter((u) => filter.studentIelts! >= u.minRequirements.minIelts);
  }

  // Intake Season filter
  if (filter.season && filter.season !== "ALL") {
    result = result.filter((u) => u.intakes.some((i) => i.season === filter.season));
  }

  return result;
}

/**
 * Validates consistency of a university record.
 */
export function validateUniversityData(u: UniversityItem): boolean {
  if (!u.id || u.id.trim().length === 0) return false;
  if (!u.name || u.name.trim().length === 0) return false;
  if (!u.countryCode || u.countryCode.length !== 2) return false;
  if (!u.city || u.city.trim().length === 0) return false;
  if (!["low", "moderate", "high"].includes(u.tuitionCategory)) return false;
  if (!Array.isArray(u.degreeLevels) || u.degreeLevels.length === 0) return false;
  if (!Array.isArray(u.intakes) || u.intakes.length === 0) return false;
  if (!u.minRequirements || typeof u.minRequirements.minCgpa !== "number") return false;
  if (!u.admissionsPortalUrl || !u.admissionsPortalUrl.startsWith("http")) return false;
  return true;
}
