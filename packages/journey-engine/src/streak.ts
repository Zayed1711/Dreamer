import type { DailyStreak } from "./types";

/**
 * Returns the Monday (YYYY-MM-DD) for any given ISO date string.
 * A weekly cycle runs from Monday to Sunday.
 */
export function getMondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);

  const newY = date.getUTCFullYear();
  const newM = String(date.getUTCMonth() + 1).padStart(2, "0");
  const newD = String(date.getUTCDate()).padStart(2, "0");
  return `${newY}-${newM}-${newD}`;
}

/**
 * Difference in whole weeks between two Monday date strings.
 */
function weeksBetween(mondayA: string, mondayB: string): number {
  const [y1, m1, d1] = mondayA.split("-").map(Number);
  const [y2, m2, d2] = mondayB.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utcB - utcA) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Adds months to a YYYY-MM-DD date string.
 */
function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const target = new Date(Date.UTC(y, m - 1 + months, d));
  const newY = target.getUTCFullYear();
  const newM = String(target.getUTCMonth() + 1).padStart(2, "0");
  const newD = String(target.getUTCDate()).padStart(2, "0");
  return `${newY}-${newM}-${newD}`;
}

/**
 * Computes the weekly journey streak from recorded activity days.
 * - Week is Monday to Sunday (Dhaka time).
 * - A week counts if at least one day in that week is an activity day.
 * - Starts with 2 freezes, refilled to 2 every 4 months.
 * - A missed week uses 1 freeze; if exceeded, streak resets.
 * - On "holding" (HSC exam season) weeks, streak is paused without consuming freezes.
 */
export function computeWeeklyStreak(
  activityDays: string[],
  todayDateStr: string,
  options: { holding?: boolean } = {},
): DailyStreak {
  const currentMonday = getMondayOfWeek(todayDateStr);

  if (activityDays.length === 0) {
    return {
      currentCount: 0,
      bestCount: 0,
      lastPeriod: "",
      freezesLeft: 2,
      freezesResetAt: todayDateStr,
    };
  }

  // Find all distinct active week Mondays, sorted ascending
  const activeWeeks = Array.from(new Set(activityDays.map(getMondayOfWeek)))
    .filter((w) => w <= currentMonday)
    .sort();

  if (activeWeeks.length === 0) {
    return {
      currentCount: 0,
      bestCount: 0,
      lastPeriod: "",
      freezesLeft: 2,
      freezesResetAt: todayDateStr,
    };
  }

  let currentCount = 1;
  let bestCount = 1;
  let lastWeek = activeWeeks[0]!;
  let freezesLeft = 2;
  let freezesResetAt = lastWeek;

  for (let i = 1; i < activeWeeks.length; i++) {
    const w = activeWeeks[i]!;

    // Check 4-month refill rule
    let nextRefillDate = addMonths(freezesResetAt, 4);
    while (w >= nextRefillDate) {
      freezesLeft = 2;
      freezesResetAt = nextRefillDate;
      nextRefillDate = addMonths(freezesResetAt, 4);
    }

    const diff = weeksBetween(lastWeek, w);
    if (diff === 1) {
      currentCount += 1;
      bestCount = Math.max(bestCount, currentCount);
      lastWeek = w;
    } else if (diff > 1) {
      const missed = diff - 1;
      if (options.holding) {
        currentCount += 1;
        bestCount = Math.max(bestCount, currentCount);
        lastWeek = w;
      } else if (missed <= freezesLeft) {
        freezesLeft -= missed;
        currentCount += 1;
        bestCount = Math.max(bestCount, currentCount);
        lastWeek = w;
      } else {
        currentCount = 1;
        freezesLeft = 0;
        lastWeek = w;
      }
    }
  }

  // Check 4-month refill up to today
  let nextRefillDate = addMonths(freezesResetAt, 4);
  while (todayDateStr >= nextRefillDate) {
    freezesLeft = 2;
    freezesResetAt = nextRefillDate;
    nextRefillDate = addMonths(freezesResetAt, 4);
  }

  // Now evaluate gap between last active week and current week
  if (lastWeek === currentMonday) {
    // Current week already has activity recorded
    return {
      currentCount,
      bestCount,
      lastPeriod: currentMonday,
      freezesLeft,
      freezesResetAt,
    };
  }

  const weeksSinceLast = weeksBetween(lastWeek, currentMonday);
  if (weeksSinceLast === 1) {
    // Previous week was active; current week is still in progress (student has until Sunday)
    return {
      currentCount,
      bestCount,
      lastPeriod: lastWeek,
      freezesLeft,
      freezesResetAt,
    };
  }

  if (weeksSinceLast > 1) {
    const missedPastWeeks = weeksSinceLast - 1;
    if (options.holding) {
      return {
        currentCount,
        bestCount,
        lastPeriod: lastWeek,
        freezesLeft,
        freezesResetAt,
      };
    } else if (missedPastWeeks <= freezesLeft) {
      freezesLeft -= missedPastWeeks;
      return {
        currentCount,
        bestCount,
        lastPeriod: lastWeek,
        freezesLeft,
        freezesResetAt,
      };
    } else {
      // Past streak was broken
      return {
        currentCount: 0,
        bestCount,
        lastPeriod: lastWeek,
        freezesLeft: 0,
        freezesResetAt,
      };
    }
  }

  return {
    currentCount,
    bestCount,
    lastPeriod: lastWeek,
    freezesLeft,
    freezesResetAt,
  };
}
