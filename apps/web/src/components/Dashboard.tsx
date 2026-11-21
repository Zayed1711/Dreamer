"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeProgress,
  defaultContent,
  defaultCourse,
  getLanguageTrack,
  getUrgentReminder,
  levelForExp,
  nextUnlock,
  parseMonth,
  pickDailyQuest,
  questDate,
  taskId,
  type DailyStreak,
  type Journey,
  type JourneyItem,
  type Stat,
} from "@dreamer/journey-engine";
import { Check, Flame, Lock } from "lucide-react";
import { FlightBar } from "./FlightBar";
import { MilestoneIcon, StatIcon } from "./MilestoneIcon";
import { monthLabel } from "@/lib/format";
import { loadDailyState, loadWeeklyStreak, setTaskDone, signOut, type DailyState } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const STATS: { key: Stat; label: string }[] = [
  { key: "english", label: "ENG" },
  { key: "academics", label: "ACA" },
  { key: "documents", label: "DOC" },
  { key: "profile", label: "PRO" },
  { key: "funding", label: "FUN" },
];

type Notice = { id: number; title: string; body: string };

const expForLevel = (level: number) => 10 * (level - 1) ** 2;

export function Dashboard({
  journey,
  today,
  initialCompleted,
  extraExp = 0,
  targetCountries,
}: {
  journey: Journey;
  today: string;
  initialCompleted: string[];
  extraExp?: number;
  targetCountries?: string[];
}) {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(initialCompleted));
  const [notice, setNotice] = useState<Notice | null>(null);
  const [rankUp, setRankUp] = useState<string | null>(null);
  const [dailyState, setDailyState] = useState<DailyState | null>(null);
  const [langDailyState, setLangDailyState] = useState<DailyState | null>(null);
  const [weeklyStreak, setWeeklyStreak] = useState<DailyStreak | null>(null);
  const noticeId = useRef(0);
  const router = useRouter();

  const targetLang = useMemo(() => getLanguageTrack(targetCountries), [targetCountries]);

  const progress = useMemo(
    () => computeProgress(journey, completed, today, defaultContent, extraExp),
    [journey, completed, today, extraExp],
  );
  const ranks = defaultContent.ranks;
  const rankDef = ranks.find((r) => r.rank === progress.rank)!;
  const nextRankDef = ranks.find((r) => r.rank === progress.nextRank);

  const dhakaToday = questDate();
  const todayQuest = useMemo(() => pickDailyQuest(dhakaToday, progress.level), [dhakaToday, progress.level]);
  const isHolding = progress.flightStatus === "holding";

  useEffect(() => {
    loadDailyState("english").then(setDailyState).catch(() => {});
    if (targetLang) {
      loadDailyState(targetLang).then(setLangDailyState).catch(() => {});
    }
    loadWeeklyStreak(dhakaToday, { holding: isHolding }).then(setWeeklyStreak).catch(() => {});
  }, [dhakaToday, isHolding, targetLang]);

  const reminder = useMemo(
    () => getUrgentReminder(journey, progress, Boolean(dailyState?.isDoneToday), today),
    [journey, progress, dailyState?.isDoneToday, today],
  );

  const now = parseMonth(today);
  const isDone = (i: JourneyItem) => i.tasks.every((t) => completed.has(taskId(i.key, t.key)));
  // This month's quest: at most 3 milestones that are due now, required ones first.
  const QUEST_SIZE = 3;
  const questItems = journey.items
    .filter((i) => parseMonth(i.start) <= now && (!isDone(i) || parseMonth(i.end) >= now))
    .sort((a, b) => Number(isDone(a)) - Number(isDone(b)) || Number(b.required) - Number(a.required))
    .slice(0, QUEST_SIZE)
    .sort((a, b) => journey.items.indexOf(a) - journey.items.indexOf(b));
  const quest = questItems.flatMap((item) => item.tasks.map((t) => ({ item, t, id: taskId(item.key, t.key) })));
  const questDone = quest.filter((q) => completed.has(q.id)).length;
  const questExp = quest.reduce((s, q) => s + q.t.exp, 0);
  const upcoming = journey.items.filter((i) => !isDone(i) && !questItems.includes(i)).slice(0, 3);

  const [y, m] = today.split("-").map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthShort = monthLabel(today).split(" ")[0];

  const levelStart = expForLevel(progress.level);
  const levelEnd = expForLevel(progress.level + 1);
  const levelPct = ((progress.exp - levelStart) / (levelEnd - levelStart)) * 100;

  const nextIeltsUnlock = useMemo(
    () => nextUnlock(defaultCourse.lessons, progress.exp),
    [progress.exp],
  );

  const gateItems = (nextRankDef?.gate?.requires ?? [])
    .map((req) => journey.items.find((i) => i.key === req.split(".")[0]))
    .filter((i): i is JourneyItem => Boolean(i));

  function notify(title: string, body: string) {
    const id = ++noticeId.current;
    setNotice({ id, title, body });
    setTimeout(() => setNotice((n) => (n?.id === id ? null : n)), 2200);
  }

  function toggle(item: JourneyItem, taskKey: string) {
    const id = taskId(item.key, taskKey);
    const next = new Set(completed);
    const adding = !next.has(id);
    if (adding) next.add(id);
    else next.delete(id);
    setCompleted(next);
    setTaskDone(id, adding, next).catch(() => {
      // Undo the tick if it could not be saved.
      setCompleted((current) => {
        const undo = new Set(current);
        if (adding) undo.delete(id);
        else undo.add(id);
        return undo;
      });
      notify("Not saved", "Check your connection and try again.");
    });
    if (!adding) return;

    const task = item.tasks.find((t) => t.key === taskKey)!;
    const after = computeProgress(journey, next, today);
    if (after.rank !== progress.rank) {
      setRankUp(after.rank);
    } else if (levelForExp(after.exp) > progress.level) {
      notify("Level up", `You have reached Lv. ${levelForExp(after.exp)}.`);
    } else if (item.stamp && item.tasks.every((t) => next.has(taskId(item.key, t.key)))) {
      notify("Stamp earned", `${item.title.en} is complete.`);
    } else {
      notify(`+${task.exp} EXP`, task.title.en);
    }
  }

  const newRank = rankUp ? ranks.find((r) => r.rank === rankUp) : undefined;

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-12">
      {/* In-app reminder banner */}
      {reminder && (
        <Link
          href={reminder.link}
          className={`window flex items-center justify-between px-3.5 py-2 font-mono text-xs transition-colors ${
            reminder.severity === "urgent"
              ? "border-[#f87171] text-[#f87171] hover:bg-[#f87171]/5"
              : reminder.severity === "action"
                ? "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/5"
                : "border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/5"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="shrink-0 font-semibold uppercase tracking-wider">[{reminder.title}]</span>
            <span className="truncate text-[var(--text)]">{reminder.message}</span>
          </div>
          <span className="ml-2 shrink-0 font-mono text-sm" aria-hidden="true">
            ›
          </span>
        </Link>
      )}

      {/* Status window */}
      <section className="window p-4">
        <div className="flex items-center gap-4">
          <div
            className="font-title flex h-14 w-14 shrink-0 items-center justify-center border-2 text-4xl font-bold"
            style={{ borderColor: rankDef.color, color: rankDef.color }}
          >
            {progress.rank}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h1 className="font-title truncate text-lg font-semibold tracking-wide uppercase">{rankDef.title.en}</h1>
              <span className="font-mono text-sm">LV {progress.level}</span>
            </div>
            <div className="track mt-2">
              <div style={{ width: `${Math.max(2, levelPct)}%` }} />
            </div>
            <div className="font-mono mt-1.5 flex justify-between text-[11px] text-[var(--muted)]">
              <span>
                EXP {progress.exp}/{levelEnd}
              </span>
              <span>STREAK {weeklyStreak?.currentCount ?? 0}W</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-3 border-t border-[var(--line-soft)] pt-3">
          {STATS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-1 text-[var(--muted)]">
                <StatIcon stat={s.key} size={12} />
                <span className="font-mono text-[10px]">{s.label}</span>
              </div>
              <div className="font-mono mt-0.5 text-sm">{progress.stats[s.key]}</div>
            </div>
          ))}
        </div>
      </section>

      <FlightBar journey={journey} progress={progress} />

      {/* IELTS Masterclass banner */}
      <Link
        href="/course"
        className="window flex items-center justify-between p-3.5 transition-colors hover:border-[var(--accent)]"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider border border-[var(--accent)] px-1.5 py-0.5 text-[var(--accent)]">
            IELTS
          </span>
          <span className="font-title text-xs font-semibold tracking-wide uppercase text-[var(--text)] sm:text-sm">
            Founder&apos;s IELTS Masterclass
          </span>
        </div>
        <span className="font-mono text-xs text-[var(--accent)]">
          {nextIeltsUnlock
            ? `Next unlock in ${nextIeltsUnlock.expNeeded} EXP ›`
            : "12/12 unlocked ›"}
        </span>
      </Link>

      {/* Daily Quest window */}
      <section className="window p-4">
        <div className="flex items-center justify-between">
          <h2 className="window-title mb-0">Daily Quest</h2>
          <div className="flex items-center gap-1 font-mono text-xs text-[var(--accent)]">
            <Flame size={14} className="stroke-[1.5]" />
            <span>Streak {dailyState?.streak.currentCount ?? 0}</span>
          </div>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3 border-t border-[var(--line-soft)] pt-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                {todayQuest.type === "words"
                  ? "5 New Words"
                  : todayQuest.type === "sentences"
                    ? "5 Sentences About You"
                    : "Writing Practice"}
              </span>
              <span className="font-mono text-[11px] text-[var(--muted)]">+20 EXP</span>
            </div>
            {isHolding ? (
              <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">Exam season: optional today</p>
            ) : (
              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                {todayQuest.type === "words"
                  ? "Review and verify 5 academic words"
                  : todayQuest.prompt?.prompt ?? "Daily language practice"}
              </p>
            )}
          </div>

          <div className="shrink-0">
            {dailyState?.isDoneToday ? (
              <div className="flex items-center gap-1 py-1 font-mono text-xs text-[#4ade80]">
                <Check size={14} className="stroke-[2]" />
                <span>Done ✓</span>
              </div>
            ) : (
              <Link
                href="/daily"
                className="inline-block border border-[var(--accent)] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-black"
              >
                Start
              </Link>
            )}
          </div>
        </div>

        {targetLang && (
          <div className="mt-3 flex items-start justify-between gap-3 border-t border-[var(--line-soft)] pt-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                  {targetLang === "de" ? "German Track" : "Japanese Track"}
                </span>
                <span className="font-mono text-[11px] text-[var(--muted)]">+20 EXP</span>
              </div>
              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                {targetLang === "de"
                  ? "Phonetics, survival phrases & vocabulary"
                  : "Hiragana, survival phrases & vocabulary"}
              </p>
            </div>

            <div className="shrink-0">
              {langDailyState?.isDoneToday ? (
                <div className="flex items-center gap-1 py-1 font-mono text-xs text-[#4ade80]">
                  <Check size={14} className="stroke-[2]" />
                  <span>Done ✓</span>
                </div>
              ) : (
                <Link
                  href="/daily"
                  className="inline-block border border-[var(--accent)] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-black"
                >
                  Start
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Quest window */}
      <section className="window px-4 pt-3 pb-3">
        <h2 className="window-title">Quest</h2>
        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          Complete before {lastDay} {monthShort}. Reward <span className="font-mono text-[var(--accent)]">{questExp} EXP</span>.
        </p>
        <div className="mt-3 space-y-3">
          {questItems.map((item) => (
            <div key={item.key}>
              {/* milestone header: icon + name */}
              <Link href={`/milestone/${item.key}`} className="flex items-center gap-2 text-[var(--accent)] hover:underline">
                <MilestoneIcon milestone={item.key} size={15} />
                <span className="font-mono flex-1 text-[11px] tracking-wider uppercase">{item.title.en}</span>
                <span className="font-mono text-[11px]" aria-hidden="true">›</span>
              </Link>
              <ul className="mt-1 ml-[7px] border-l border-[var(--line-soft)] pl-4">
                {item.tasks.map((t) => {
                  const id = taskId(item.key, t.key);
                  const done = completed.has(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => toggle(item, t.key)}
                        className="flex w-full items-center gap-3 py-1.5 text-left"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] leading-none ${
                            done ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]" : "border-[var(--muted)]"
                          }`}
                        >
                          {done ? "✓" : ""}
                        </span>
                        <span className={`flex-1 text-sm ${done ? "text-[var(--muted)] line-through" : ""}`}>{t.title.en}</span>
                        <span className={`font-mono text-xs ${done ? "text-[var(--muted)]" : "text-[var(--accent)]"}`}>
                          +{t.exp}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3 border-t border-[var(--line-soft)] pt-3">
          <div className="track flex-1">
            <div style={{ width: `${quest.length ? (questDone / quest.length) * 100 : 0}%` }} />
          </div>
          <span className="font-mono text-[11px] text-[var(--muted)]">
            {questDone}/{quest.length}
          </span>
        </div>
      </section>

      {/* Next gate */}
      {nextRankDef?.gate && (
        <section className="window px-4 pt-3 pb-4">
          <h2 className="window-title">Next gate</h2>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              {gateItems.length === 1 && <MilestoneIcon milestone={gateItems[0]!.key} size={20} className="text-[var(--accent)]" />}
              <span className="font-title text-xl font-semibold tracking-wide uppercase">{nextRankDef.gate.name.en}</span>
            </span>
            <span className="font-mono text-xs" style={{ color: nextRankDef.color }}>
              → {nextRankDef.rank}-RANK
            </span>
          </div>
          {gateItems.length > 0 ? (
            <>
              <div className="track mt-3">
                <div style={{ width: `${progress.nextGateProgress * 100}%` }} />
              </div>
              <ul className={`mt-3 space-y-1.5 ${gateItems.length < 2 ? "hidden" : ""}`}>
                {gateItems.map((i) => (
                  <li key={i.key} className="flex items-center gap-2.5 text-sm">
                    <MilestoneIcon milestone={i.key} size={15} className={isDone(i) ? "text-[var(--muted)]" : "text-[var(--accent)]"} />
                    <Link href={`/milestone/${i.key}`} className={`flex-1 hover:text-[var(--accent)] ${isDone(i) ? "text-[var(--muted)] line-through" : ""}`}>
                      {i.title.en}
                    </Link>
                    <span className="font-mono flex items-center gap-1 text-[11px] text-[var(--muted)]">
                      {isDone(i) ? <Check size={12} aria-hidden="true" /> : <Lock size={11} aria-hidden="true" />}
                      {isDone(i) ? "CLEARED" : "LOCKED"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">This gate opens later in your journey.</p>
          )}
        </section>
      )}

      {/* Coming up: no window, just a list */}
      <section className="px-1">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] tracking-widest text-[var(--muted)]">COMING UP</h2>
          <Link href="/journey" className="font-mono text-[11px] text-[var(--accent)]">
            FLIGHT PLAN →
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-[var(--line-soft)]">
          {upcoming.map((i) => (
            <li key={i.key}>
              <Link href={`/milestone/${i.key}`} className="flex items-center gap-3 py-2 text-sm hover:text-[var(--accent)]">
                <MilestoneIcon milestone={i.key} size={15} className="text-[var(--muted)]" />
                <span className="flex-1">{i.title.en}</span>
                <span className="font-mono shrink-0 text-[11px] text-[var(--muted)]">{monthLabel(i.start).toUpperCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="font-mono mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-[var(--muted)]">
          <Link href="/course" className="hover:text-[var(--accent)]">IELTS COURSE</Link>
          <Link href="/mentors" className="hover:text-[var(--accent)]">MENTORS</Link>
          <Link href="/admin" className="hover:text-[var(--accent)] text-[var(--accent)]/80">ADMIN</Link>
          <Link href="/onboarding" className="hover:text-[var(--accent)]">EDIT PROFILE</Link>
          <Link href="/scam-check" className="hover:text-[var(--accent)]">SCAM CHECK</Link>
          <Link href="/credits" className="hover:text-[var(--accent)]">CREDITS</Link>
          {supabaseEnabled && (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/signin");
              }}
            >
              SIGN OUT
            </button>
          )}
        </div>
      </section>

      {/* System notification */}
      {notice && (
        <div key={notice.id} className="notify window window-active fixed top-4 left-1/2 z-40 w-[min(90vw,340px)] px-4 py-3 text-center">
          <div className="font-mono text-[10px] tracking-widest text-[var(--muted)]">NOTIFICATION</div>
          <div className="font-title mt-1 text-lg font-semibold text-[var(--accent)] uppercase">{notice.title}</div>
          <div className="mt-0.5 text-xs">{notice.body}</div>
        </div>
      )}

      {newRank && (
        <button
          type="button"
          onClick={() => setRankUp(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,8,15,0.88)] px-6"
        >
          <div className="open-center window window-active w-full max-w-xs px-6 pt-4 pb-6 text-center">
            <h2 className="window-title">Rank up</h2>
            <div
              className="font-title mx-auto mt-5 flex h-20 w-20 items-center justify-center border-2 text-6xl font-bold"
              style={{ borderColor: newRank.color, color: newRank.color }}
            >
              {newRank.rank}
            </div>
            <div className="font-title mt-4 text-xl font-semibold tracking-wide uppercase">{newRank.title.en}</div>
            <p className="mt-2 text-xs text-[var(--muted)]">Your plane has reached the next stop. Tap to continue.</p>
          </div>
        </button>
      )}
    </main>
  );
}
