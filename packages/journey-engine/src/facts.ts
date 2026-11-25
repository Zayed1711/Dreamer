import type { Money, YearlyDate } from "./types";

/** BDT for one unit of each currency. */
export type BdtRates = Record<string, number>;

/**
 * Used when the live rate cannot be fetched. Approximate; the UI says so.
 * shortcut: hand-set reference values, refresh when the live feed is down for long.
 */
export const FALLBACK_BDT_RATES: BdtRates = {
  BDT: 1,
  USD: 122,
  EUR: 140,
  GBP: 163,
  CAD: 88,
  AUD: 80,
  NZD: 73,
  JPY: 0.82,
  KRW: 0.088,
  CNY: 17,
  MYR: 28.5,
  SEK: 12.8,
  HUF: 0.35,
  PLN: 33,
};

/** Converts an amount to BDT, or null when the currency has no rate. */
export function toBdt(m: Money, rates: BdtRates): number | null {
  const rate = m.currency === "BDT" ? 1 : rates[m.currency];
  return typeof rate === "number" && rate > 0 ? Math.round(m.amount * rate) : null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "31 May" (plus the note), or just the official wording when the date varies. */
export function formatYearlyDate(d: YearlyDate): string {
  if (!d.date) return d.note ?? "Varies";
  const [mm, dd] = d.date.split("-").map(Number);
  const label = `${dd} ${MONTHS[mm! - 1]}`;
  return d.note ? `${label} (${d.note})` : label;
}

/** Days from today until the next time this yearly date comes round (0 = today), or null if it varies. */
export function daysUntil(d: YearlyDate, today: Date = new Date()): number | null {
  if (!d.date) return null;
  const [mm, dd] = d.date.split("-").map(Number);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  let next = Date.UTC(today.getFullYear(), mm! - 1, dd!);
  if (next < start) next = Date.UTC(today.getFullYear() + 1, mm! - 1, dd!);
  return Math.round((next - start) / 86_400_000);
}
