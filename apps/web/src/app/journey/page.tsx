"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { defaultContent, parseMonth, taskId, type JourneyItem } from "@dreamer/journey-engine";
import { monthLabel } from "@/lib/format";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { StageAdModal } from "@/components/StageAdModal";
import { useStudent } from "@/lib/student";

export default function JourneyPage() {
  const router = useRouter();
  const { ready, needsSignIn, profile, journey, completed, today } = useStudent();

  useEffect(() => {
    if (!ready) return;
    if (needsSignIn) router.replace("/signin");
    else if (!profile) router.replace("/onboarding");
  }, [ready, needsSignIn, profile, router]);

  if (!journey) return null;

  const done = new Set(completed);
  const tasksDone = (item: JourneyItem) => item.tasks.filter((t) => done.has(taskId(item.key, t.key))).length;
  const isDone = (item: JourneyItem) => tasksDone(item) === item.tasks.length;

  const template = defaultContent.templates.find((t) => t.key === journey.templateKey)!;
  const now = parseMonth(today);
  const phases = template.phases
    .map((phase) => ({ phase, items: journey.items.filter((i) => i.phase === phase.key) }))
    .filter((p) => p.items.length > 0);
  const currentPhase =
    phases.find((p) => p.items.some((i) => !isDone(i) && parseMonth(i.start) <= now))?.phase.key ??
    phases.find((p) => p.items.some((i) => !isDone(i)))?.phase.key;

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-12">
      {/* Contextual Stage Milestone Modal */}
      <StageAdModal stage={profile?.stage} />

      <div className="font-mono mb-5 flex items-center justify-between text-[11px]">
        <Link href="/" className="text-[var(--accent)]">
          ← BACK
        </Link>
        <span className="text-[var(--muted)]">
          {journey.route.from.code} → {journey.route.to.code}
        </span>
      </div>
      <h1 className="window-title mb-5">Flight plan</h1>

      <ol className="space-y-3">
        {phases.map(({ phase, items }, n) => {
          const doneCount = items.filter(isDone).length;
          const current = phase.key === currentPhase;
          return (
            <li key={phase.key}>
              <details open={current} className="group window">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                  <span className={`font-mono text-xs ${current ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    {current && <span className="font-mono block text-[10px] text-[var(--accent)]">CURRENT LEG</span>}
                    <span className="font-title font-semibold tracking-wide uppercase">{phase.title.en}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    {doneCount}/{items.length}
                  </span>
                  <span className="text-[var(--muted)] transition group-open:rotate-90">›</span>
                </summary>
                <ul className="divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)] px-4">
                  {items.map((item) => (
                    <li key={item.key}>
                      <Link href={`/milestone/${item.key}`} className="flex items-center gap-3 py-2 text-sm hover:text-[var(--accent)]">
                      <MilestoneIcon
                        milestone={item.key}
                        size={15}
                        className={isDone(item) ? "text-[var(--muted)]" : "text-[var(--accent)]"}
                      />
                      <span className={`flex-1 ${isDone(item) ? "text-[var(--muted)] line-through" : ""}`}>
                        {item.title.en}
                        {item.fixed && <span className="font-mono ml-2 text-[10px] text-[#f87171]">DEADLINE</span>}
                      </span>
                      <span className="font-mono shrink-0 text-[11px] text-[var(--muted)]">
                        {monthLabel(item.start).toUpperCase()} · {tasksDone(item)}/{item.tasks.length}
                      </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
