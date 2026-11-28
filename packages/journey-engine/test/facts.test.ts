import { describe, expect, it } from "vitest";
import { daysUntil, formatYearlyDate, toBdt } from "../src/facts";
import { defaultUniversities, validYearlyDate, withLiveCosts } from "../src/universities";
import { defaultScholarships } from "../src/scholarships";
import { defaultCountries, withLiveCountryCosts } from "../src/countries";

describe("live facts", () => {
  it("converts official-currency amounts to BDT", () => {
    expect(toBdt({ amount: 100, currency: "EUR" }, { EUR: 140 })).toBe(14000);
    expect(toBdt({ amount: 5, currency: "BDT" }, {})).toBe(5);
    expect(toBdt({ amount: 5, currency: "XYZ" }, {})).toBeNull();
  });

  it("recomputes BDT costs when the rate changes", () => {
    const stuttgart = defaultUniversities.find((u) => u.id === "de-stuttgart")!;
    const [cheap] = withLiveCosts([stuttgart], { EUR: 100 });
    const [dear] = withLiveCosts([stuttgart], { EUR: 200 });
    expect(cheap!.tuitionBDTAnnualMin).toBe(300_000); // €1,500 per semester, two semesters
    expect(dear!.tuitionBDTAnnualMin).toBe(600_000);
  });

  it("converts country costs from their own currency, including funds held in another currency", () => {
    const [de] = withLiveCountryCosts(defaultCountries.filter((c) => c.code === "DE"), { EUR: 100 });
    expect(de!.avgMonthlyLivingBdt.min).toBe(de!.costs.livingMonth.min * 100);
    expect(de!.proofOfFundsBdt).toBe(1_190_400); // €11,904 blocked account
    const [kr] = withLiveCountryCosts(defaultCountries.filter((c) => c.code === "KR"), { KRW: 0.1, USD: 100 });
    expect(kr!.proofOfFundsBdt).toBe(kr!.costs.proofOfFunds.amount * 100); // stated in USD, not won
  });

  it("a country with no published proof-of-funds amount says so instead of showing 0", () => {
    const us = defaultCountries.find((c) => c.code === "US")!;
    expect(us.costs.proofOfFunds.amount).toBe(0);
    expect(us.blockedAccountInfo.amountLocal).toBe("No fixed amount");
    expect(us.costs.proofOfFunds.note).toBeTruthy();
  });

  it("every country carries the website's stage data", () => {
    expect(defaultCountries).toHaveLength(18);
    for (const c of defaultCountries) {
      expect(c.site.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c.site.steps.length).toBeGreaterThan(0);
    }
  });

  it("counts days to the next yearly deadline, rolling into next year", () => {
    const today = new Date(2026, 10, 25); // 25 Nov
    expect(daysUntil({ date: "11-25" }, today)).toBe(0);
    expect(daysUntil({ date: "11-30" }, today)).toBe(5);
    expect(daysUntil({ date: "01-15" }, today)).toBe(51);
    expect(daysUntil({ date: null, note: "Varies" }, today)).toBeNull();
  });

  it("formats yearly dates and keeps the official wording", () => {
    expect(formatYearlyDate({ date: "05-31", note: "uni-assist" })).toBe("31 May (uni-assist)");
    expect(formatYearlyDate({ date: null, note: "October - November" })).toBe("October - November");
  });

  it("rejects impossible or unexplained dates", () => {
    expect(validYearlyDate({ date: "02-30" })).toBe(false);
    expect(validYearlyDate({ date: "5-31" })).toBe(false);
    expect(validYearlyDate({ date: null })).toBe(false);
    expect(validYearlyDate({ date: "02-29" })).toBe(true);
  });

  it("every record names a source; none claims a check that has not happened", () => {
    for (const r of [...defaultUniversities, ...defaultScholarships]) {
      expect(r.sources.length).toBeGreaterThan(0);
      expect(r.lastChecked === null || /^\d{4}-\d{2}-\d{2}$/.test(r.lastChecked)).toBe(true);
    }
  });
});
