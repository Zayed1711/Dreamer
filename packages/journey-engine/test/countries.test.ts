import { describe, expect, it } from "vitest";
import {
  defaultCountries,
  filterCountries,
  getCountryByCode,
  getEstimatedFirstYearCostBdt,
  listCountries,
  validateCountryData,
} from "../src/countries";
import type { CountryInfo } from "../src/types";

describe("countries engine", () => {
  it("loads 18 destination countries by default", () => {
    const list = listCountries();
    expect(list.length).toBe(18);
    const codes = list.map((c) => c.code);
    expect(codes).toContain("DE");
    expect(codes).toContain("JP");
    expect(codes).toContain("US");
    expect(codes).toContain("CA");
    expect(codes).toContain("GB");
    expect(codes).toContain("AU");
    expect(codes).toContain("HU");
  });

  it("finds country by code case-insensitively", () => {
    const de = getCountryByCode(defaultCountries, "de");
    expect(de).toBeDefined();
    expect(de?.name).toBe("Germany");
    expect(de?.capital).toBe("Berlin");

    const jp = getCountryByCode(defaultCountries, "JP");
    expect(jp?.name).toBe("Japan");

    expect(getCountryByCode(defaultCountries, "XX")).toBeUndefined();
    expect(getCountryByCode(defaultCountries, "")).toBeUndefined();
  });

  it("filters countries by search query", () => {
    const germQuery = filterCountries(defaultCountries, { query: "German" });
    expect(germQuery.length).toBe(1);
    expect(germQuery[0]!.code).toBe("DE");

    const cityQuery = filterCountries(defaultCountries, { query: "Tokyo" });
    expect(cityQuery.some((c) => c.code === "JP")).toBe(true);

    const uniQuery = filterCountries(defaultCountries, { query: "Munich" });
    expect(uniQuery.some((c) => c.code === "DE")).toBe(true);
  });

  it("filters countries by region", () => {
    const europe = filterCountries(defaultCountries, { region: "Europe" });
    expect(europe.length).toBeGreaterThan(5);
    expect(europe.every((c) => c.region === "Europe")).toBe(true);

    const na = filterCountries(defaultCountries, { region: "North America" });
    expect(na.map((c) => c.code)).toEqual(["US", "CA"]);
  });

  it("filters countries by maximum tuition budget", () => {
    const freeTuition = filterCountries(defaultCountries, { maxTuitionBdt: 0 });
    expect(freeTuition.some((c) => c.code === "DE")).toBe(true);
    // Countries where minimum tuition > 0 should not be in freeTuition list
    for (const c of freeTuition) {
      expect(c.avgTuitionYearBdt.min).toBeLessThanOrEqual(0);
    }
  });

  it("filters countries requiring mandatory blocked accounts", () => {
    const blockedOnly = filterCountries(defaultCountries, { blockedAccountOnly: true });
    expect(blockedOnly.some((c) => c.code === "DE")).toBe(true);
    expect(blockedOnly.some((c) => c.code === "CA")).toBe(true);
    for (const c of blockedOnly) {
      expect(c.blockedAccountInfo.required).toBe(true);
    }
  });

  it("calculates estimated first year cost in BDT accurately", () => {
    const de = getCountryByCode(defaultCountries, "DE")!;
    const cost = getEstimatedFirstYearCostBdt(de);

    const expectedMin =
      de.avgTuitionYearBdt.min + de.avgMonthlyLivingBdt.min * 12 + de.proofOfFundsBdt;
    const expectedMax =
      de.avgTuitionYearBdt.max + de.avgMonthlyLivingBdt.max * 12 + de.proofOfFundsBdt;

    expect(cost.min).toBe(expectedMin);
    expect(cost.max).toBe(expectedMax);
    expect(cost.min).toBeGreaterThan(2000000); // 20+ Lakh BDT
  });

  it("validates all 18 country objects", () => {
    for (const country of defaultCountries) {
      expect(validateCountryData(country)).toBe(true);
      expect(country.embassyDhaka).toBeDefined();
      expect(country.documentsChecklist.length).toBeGreaterThan(0);
      expect(country.commonFaqs.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid country data structures", () => {
    expect(validateCountryData({} as CountryInfo)).toBe(false);
    expect(validateCountryData({ code: "D", name: "Short" } as CountryInfo)).toBe(false);
  });
});
