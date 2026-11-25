import universitiesJson from "../../../content/universities/universities.json";
import { FALLBACK_BDT_RATES, toBdt, type BdtRates } from "./facts";
import type { TuitionCategory, UniversityFilter, UniversityItem } from "./types";

type StoredUniversity = Omit<UniversityItem, "tuitionBDTAnnualMin" | "tuitionCategory">;

function category(annualBdt: number): TuitionCategory {
  if (annualBdt < 200_000) return "low";
  if (annualBdt <= 1_500_000) return "moderate";
  return "high";
}

/**
 * Fills in the BDT figures from each university's official-currency tuition and the given rates.
 * Category uses the full fee; the budget filter uses what is left after the best listed funding.
 */
export function withLiveCosts(universities: StoredUniversity[], rates: BdtRates): UniversityItem[] {
  return universities.map((u) => {
    const perYear = u.tuition.per === "semester" ? 2 : 1;
    const full = (toBdt(u.tuition, rates) ?? toBdt(u.tuition, FALLBACK_BDT_RATES) ?? 0) * perYear;
    const left = u.tuition.withFunding ?? u.tuition.amount;
    const min = left === u.tuition.amount ? full : (toBdt({ ...u.tuition, amount: left }, rates) ?? 0) * perYear;
    return { ...u, tuitionBDTAnnualMin: min, tuitionCategory: category(full) };
  });
}

export const defaultUniversities: UniversityItem[] = withLiveCosts(
  universitiesJson as StoredUniversity[],
  FALLBACK_BDT_RATES,
);

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
/** "MM-DD" that exists in a year, or null with the official wording kept as a note. */
export function validYearlyDate(d: { date: string | null; note?: string } | undefined): boolean {
  if (!d) return false;
  if (d.date === null) return !!d.note;
  const m = /^(\d{2})-(\d{2})$/.exec(d.date);
  if (!m) return false;
  const day = new Date(Date.UTC(2024, Number(m[1]) - 1, Number(m[2]))); // leap year, so 02-29 is allowed
  return day.getUTCMonth() === Number(m[1]) - 1 && day.getUTCDate() === Number(m[2]);
}

export function validateUniversityData(u: UniversityItem): boolean {
  if (!u.id || u.id.trim().length === 0) return false;
  if (!u.name || u.name.trim().length === 0) return false;
  if (!u.countryCode || u.countryCode.length !== 2) return false;
  if (!u.city || u.city.trim().length === 0) return false;
  if (!["low", "moderate", "high"].includes(u.tuitionCategory)) return false;
  if (!Array.isArray(u.degreeLevels) || u.degreeLevels.length === 0) return false;
  if (!Array.isArray(u.intakes) || u.intakes.length === 0) return false;
  if (!u.tuition || typeof u.tuition.amount !== "number" || !/^[A-Z]{3}$/.test(u.tuition.currency)) return false;
  if (u.intakes.some((i) => !validYearlyDate(i.opens) || !validYearlyDate(i.deadline))) return false;
  if (!Array.isArray(u.sources) || u.sources.length === 0) return false;
  if (!u.minRequirements || typeof u.minRequirements.minCgpa !== "number") return false;
  if (!u.admissionsPortalUrl || !u.admissionsPortalUrl.startsWith("http")) return false;
  return true;
}
