import { parse as parseMonth } from "./months";
import type { Journey, Progress } from "./types";

export type ReminderType = "overdue_catchup" | "daily_quest_due" | "deadline_approaching";

export interface UrgentReminder {
  type: ReminderType;
  title: string;
  message: string;
  link: string;
  severity: "urgent" | "action" | "notice";
}

/**
 * Evaluates the single most urgent reminder in prioritized order:
 * 1. Overdue required milestones (→ "Catch-up")
 * 2. Today's daily quest not done
 * 3. A fixed deadline within 30 days (or due this month)
 */
export function getUrgentReminder(
  journey: Journey,
  progress: Progress,
  isDailyDone: boolean,
  todayMonthStr: string,
): UrgentReminder | null {
  // Priority 1: Overdue required milestone
  if (progress.overdue.length > 0) {
    const overdueKey = progress.overdue[0]!;
    const item = journey.items.find((i) => i.key === overdueKey);
    const itemTitle = item?.title.en ?? "Milestone";
    return {
      type: "overdue_catchup",
      title: "Catch-up",
      message: `${itemTitle} is overdue. Catch up now.`,
      link: `/milestone/${overdueKey}`,
      severity: "urgent",
    };
  }

  // Priority 2: Daily quest not yet completed today
  if (!isDailyDone) {
    return {
      type: "daily_quest_due",
      title: "Daily Quest",
      message: "Today's daily quest is ready (+20 EXP).",
      link: "/daily",
      severity: "action",
    };
  }

  // Priority 3: Fixed deadline within 30 days (due this month)
  const currentMonthNum = parseMonth(todayMonthStr);
  const completedSet = new Set(progress.completedMilestones);

  const upcomingFixed = journey.items.find((i) => {
    if (!i.fixed || completedSet.has(i.key)) return false;
    const endMonthNum = parseMonth(i.end);
    // Deadline is due in the current month or within 1 month
    return endMonthNum >= currentMonthNum && endMonthNum <= currentMonthNum + 1;
  });

  if (upcomingFixed) {
    return {
      type: "deadline_approaching",
      title: "Deadline",
      message: `${upcomingFixed.title.en} is due soon (${upcomingFixed.end}).`,
      link: `/milestone/${upcomingFixed.key}`,
      severity: "notice",
    };
  }

  return null;
}
