import type { MonthString, Season } from "./types";

/** A month as a single integer: year * 12 + (month - 1). Makes month arithmetic trivial. */
export type MonthIndex = number;

export function toIndex(year: number, month: number): MonthIndex {
  return year * 12 + (month - 1);
}

export function yearOf(m: MonthIndex): number {
  return Math.floor(m / 12);
}

export function monthOf(m: MonthIndex): number {
  return (m % 12) + 1;
}

export function format(m: MonthIndex): MonthString {
  return `${yearOf(m)}-${String(monthOf(m)).padStart(2, "0")}`;
}

export function parse(s: MonthString): MonthIndex {
  const match = /^(\d{4})-(\d{2})$/.exec(s);
  if (!match) throw new Error(`Expected a month like "2027-09", got "${s}"`);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error(`Invalid month in "${s}"`);
  return toIndex(Number(match[1]), month);
}

/** Accepts a Date (its UTC month) or a "YYYY-MM" string. */
export function fromInput(today: Date | MonthString): MonthIndex {
  if (typeof today === "string") return parse(today);
  return toIndex(today.getUTCFullYear(), today.getUTCMonth() + 1);
}

export const FALL_MONTH = 9;
export const SPRING_MONTH = 1;

export function intakeIndex(intake: { year: number; season: Season }): MonthIndex {
  return toIndex(intake.year, intake.season === "fall" ? FALL_MONTH : SPRING_MONTH);
}

/** The first Fall intake on or after the given month. */
export function nextFall(m: MonthIndex): { year: number; season: Season } {
  const year = monthOf(m) <= FALL_MONTH ? yearOf(m) : yearOf(m) + 1;
  return { year, season: "fall" };
}
