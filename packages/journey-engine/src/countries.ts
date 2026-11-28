import countriesJson from "../../../content/countries/countries.json";
import { FALLBACK_BDT_RATES, toBdt, type BdtRates } from "./facts";
import type { CountryInfo } from "./types";

type StoredCountry = Omit<CountryInfo, "bdtRate" | "avgTuitionYearBdt" | "avgMonthlyLivingBdt" | "proofOfFundsBdt">;

const lakh = (bdt: number) => `${(bdt / 100_000).toFixed(1)} Lakh BDT`;

/** Fills in every BDT figure from the official-currency costs and the given rates (BDT per unit). */
export function withLiveCountryCosts(countries: StoredCountry[], rates: BdtRates): CountryInfo[] {
  return countries.map((c) => {
    const rate = rates[c.currency] ?? FALLBACK_BDT_RATES[c.currency] ?? 0;
    const bdt = (n: number) => Math.round(n * rate);
    const { tuitionYear, livingMonth, proofOfFunds } = c.costs;
    const fundsBdt = toBdt(proofOfFunds, rates) ?? toBdt(proofOfFunds, FALLBACK_BDT_RATES) ?? 0;
    return {
      ...c,
      bdtRate: rate,
      avgTuitionYearBdt: { min: bdt(tuitionYear.min), max: bdt(tuitionYear.max) },
      avgMonthlyLivingBdt: { min: bdt(livingMonth.min), max: bdt(livingMonth.max) },
      proofOfFundsBdt: fundsBdt,
      blockedAccountInfo: {
        ...c.blockedAccountInfo,
        amountLocal: proofOfFunds.amount
          ? `${proofOfFunds.amount.toLocaleString("en-US")} ${proofOfFunds.currency}`
          : "No fixed amount",
        amountBDT: proofOfFunds.amount ? lakh(fundsBdt) : "Set by your university or the embassy",
      },
    };
  });
}

export const defaultCountries: CountryInfo[] = withLiveCountryCosts(
  countriesJson as unknown as StoredCountry[],
  FALLBACK_BDT_RATES,
);

/**
 * Returns the full list of available destination country profiles.
 */
export function listCountries(countries: CountryInfo[] = defaultCountries): CountryInfo[] {
  return [...countries];
}

/**
 * Looks up a specific country profile by ISO 2-letter country code (case-insensitive).
 */
export function getCountryByCode(
  countries: CountryInfo[] = defaultCountries,
  code: string,
): CountryInfo | undefined {
  if (!code) return undefined;
  const target = code.trim().toUpperCase();
  return countries.find((c) => c.code.toUpperCase() === target);
}

export interface CountryFilters {
  query?: string;
  region?: string;
  maxTuitionBdt?: number;
  blockedAccountOnly?: boolean;
}

/**
 * Filters countries by search text (name/capital/popularFor), region, maximum tuition,
 * or blocked account requirement.
 */
export function filterCountries(
  countries: CountryInfo[] = defaultCountries,
  filters?: CountryFilters,
): CountryInfo[] {
  let result = [...countries];

  if (!filters) return result;

  if (filters.query && filters.query.trim().length > 0) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.topUniversities.some((u) => u.toLowerCase().includes(q)),
    );
  }

  if (filters.region && filters.region !== "ALL") {
    const r = filters.region.trim().toLowerCase();
    result = result.filter((c) => c.region.toLowerCase() === r);
  }

  if (typeof filters.maxTuitionBdt === "number" && !isNaN(filters.maxTuitionBdt)) {
    result = result.filter((c) => c.avgTuitionYearBdt.min <= filters.maxTuitionBdt!);
  }

  if (filters.blockedAccountOnly) {
    result = result.filter((c) => c.blockedAccountInfo?.required === true);
  }

  return result;
}

/**
 * Calculates estimated first-year total financial outlay in BDT:
 * Minimum: min annual tuition + the larger of (min monthly living * 12) and proof of funds
 * Maximum: max annual tuition + the larger of (max monthly living * 12) and proof of funds
 */
export function getEstimatedFirstYearCostBdt(country: CountryInfo): { min: number; max: number } {
  const tuitionMin = country.avgTuitionYearBdt?.min ?? 0;
  const tuitionMax = country.avgTuitionYearBdt?.max ?? 0;
  const livingMin = (country.avgMonthlyLivingBdt?.min ?? 0) * 12;
  const livingMax = (country.avgMonthlyLivingBdt?.max ?? 0) * 12;
  const funds = country.proofOfFundsBdt ?? 0;

  // Proof of funds (e.g. a blocked account) is the student's own living money, released during the year,
  // so the year costs whichever is larger, not both.
  return {
    min: tuitionMin + Math.max(livingMin, funds),
    max: tuitionMax + Math.max(livingMax, funds),
  };
}

/**
 * Validates country data structure consistency.
 */
export function validateCountryData(country: CountryInfo): boolean {
  if (!country.code || country.code.length !== 2) return false;
  if (!country.name || country.name.trim().length === 0) return false;
  if (!country.currency || !country.capital) return false;
  if (typeof country.bdtRate !== "number" || country.bdtRate <= 0) return false;
  if (!country.costs || !country.costs.proofOfFunds || !/^[A-Z]{3}$/.test(country.costs.proofOfFunds.currency)) return false;
  if (!country.site || !country.site.accentColor || !Array.isArray(country.site.steps)) return false;
  if (!country.avgTuitionYearBdt || typeof country.avgTuitionYearBdt.min !== "number") return false;
  if (!country.avgMonthlyLivingBdt || typeof country.avgMonthlyLivingBdt.min !== "number") return false;
  if (!Array.isArray(country.documentsChecklist)) return false;
  if (!Array.isArray(country.commonFaqs)) return false;
  return true;
}
