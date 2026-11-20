import { defaultContent } from "./content";
import { fromInput, parse } from "./months";
import type {
  Content,
  FlightStatus,
  Journey,
  JourneyItem,
  MonthString,
  Progress,
  RankDef,
  Stat,
} from "./types";

/** Level shown inside a rank. Grows quickly at first, then slows down. */
export function levelForExp(exp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, exp) / 10)) + 1;
}

export const taskId = (milestoneKey: string, taskKey: string) => `${milestoneKey}.${taskKey}`;

/**
 * Computes EXP, level, rank, plane position and flight status.
 *
 * `completedTasks` holds "milestone.task" ids. Completion is kept per task, so it
 * carries over when a student switches journey (for example from J2 into J3).
 */
export function computeProgress(
  journey: Journey,
  completedTasks: Iterable<string>,
  today: Date | MonthString,
  content: Content = defaultContent,
  extraExp: number = 0,
): Progress {
  const now = fromInput(today);
  const done = new Set(completedTasks);
  const byKey = new Map(journey.items.map((i) => [i.key, i]));

  const taskDone = (item: JourneyItem, taskKey: string) => done.has(taskId(item.key, taskKey));
  const itemDone = (item: JourneyItem) => item.tasks.every((t) => taskDone(item, t.key));
  const itemExpDone = (item: JourneyItem) =>
    item.tasks.reduce((sum, t) => sum + (taskDone(item, t.key) ? t.exp : 0), 0);

  // ----- EXP, stats, stamps -----
  const stats: Record<Stat, number> = { english: 0, academics: 0, documents: 0, profile: 0, funding: 0 };
  let exp = 0;
  const completedMilestones: string[] = [];
  const stamps: string[] = [];
  for (const item of journey.items) {
    const e = itemExpDone(item);
    exp += e;
    stats[item.stat] += e;
    if (itemDone(item)) {
      completedMilestones.push(item.key);
      if (item.stamp) stamps.push(item.stamp);
    }
  }

  // Daily quests and practice sets grant extra EXP
  const totalExp = exp + extraExp;
  stats.english += extraExp;

  // ----- Rank gates, in order -----
  // A requirement is "milestone" or "milestone.task". Requirements outside this
  // journey are ignored, but a gate with none of them in the journey cannot pass.
  const gateParts = (rank: RankDef) => {
    const parts: { item: JourneyItem; taskKey?: string }[] = [];
    for (const req of rank.gate?.requires ?? []) {
      const [mKey, tKey] = req.split(".");
      const item = mKey ? byKey.get(mKey) : undefined;
      if (item) parts.push(tKey ? { item, taskKey: tKey } : { item });
    }
    return parts;
  };
  const partExp = (p: { item: JourneyItem; taskKey?: string }) =>
    p.taskKey ? (p.item.tasks.find((t) => t.key === p.taskKey)?.exp ?? 0) : p.item.exp;
  const partExpDone = (p: { item: JourneyItem; taskKey?: string }) =>
    p.taskKey ? (taskDone(p.item, p.taskKey) ? partExp(p) : 0) : itemExpDone(p.item);

  const ranks = content.ranks;
  let rankIndex = 0;
  for (let i = 1; i < ranks.length; i++) {
    const parts = gateParts(ranks[i]!);
    if (parts.length === 0) break;
    if (!parts.every((p) => partExpDone(p) === partExp(p))) break;
    rankIndex = i;
  }

  let nextGateProgress = 0;
  const next = ranks[rankIndex + 1];
  if (next) {
    const parts = gateParts(next);
    const total = parts.reduce((s, p) => s + partExp(p), 0);
    nextGateProgress = total > 0 ? parts.reduce((s, p) => s + partExpDone(p), 0) / total : 0;
  }
  const segments = ranks.length - 1;
  const planePosition = Math.min(1, (rankIndex + nextGateProgress) / segments);

  // ----- Journey percent -----
  const required = journey.items.filter((i) => i.required);
  const requiredTotal = required.reduce((s, i) => s + i.exp, 0);
  const requiredDone = required.reduce((s, i) => s + itemExpDone(i), 0);
  const journeyPercent = requiredTotal > 0 ? Math.round((requiredDone / requiredTotal) * 100) : 0;

  // ----- Flight status -----
  const overdue = required.filter((i) => !itemDone(i) && parse(i.end) < now).map((i) => i.key);
  const inQuiet =
    journey.quietWindow !== undefined &&
    now >= parse(journey.quietWindow.start) &&
    now <= parse(journey.quietWindow.end);
  let flightStatus: FlightStatus = "on_time";
  if (journey.feasibility.status === "at_risk") flightStatus = "rerouting";
  else if (inQuiet) flightStatus = "holding";
  else if (overdue.length > 0) flightStatus = "delayed";

  const rank = ranks[rankIndex]!;
  return {
    exp: totalExp,
    level: levelForExp(totalExp),
    rank: rank.rank,
    rankTitle: rank.title,
    ...(next ? { nextRank: next.rank } : {}),
    nextGateProgress,
    planePosition,
    journeyPercent,
    flightStatus,
    stats,
    stamps,
    completedMilestones,
    overdue,
  };
}
