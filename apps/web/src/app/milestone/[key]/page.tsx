"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Users } from "lucide-react";
import { defaultContent, taskId } from "@dreamer/journey-engine";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { ErrorLine } from "@/components/ui";
import { monthLabel } from "@/lib/format";
import { ADVISOR_TOPICS, SLOTS, STAMP_NAMES } from "@/lib/slots";
import { setTaskDone } from "@/lib/store";
import { useStudent } from "@/lib/student";

export default function MilestonePage() {
  const router = useRouter();
  const { key } = useParams<{ key: string }>();
  const { ready, needsSignIn, profile, journey, completed: loaded, error } = useStudent();
  const [completed, setCompleted] = useState<Set<string> | null>(null);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const noticeId = useRef(0);

  useEffect(() => {
    if (!ready) return;
    if (needsSignIn) router.replace("/signin");
    else if (!profile) router.replace("/onboarding");
  }, [ready, needsSignIn, profile, router]);

  useEffect(() => {
    if (ready) setCompleted(new Set(loaded));
  }, [ready, loaded]);

  if (error) return <main className="mx-auto max-w-md px-4 pt-10"><ErrorLine message={error} /></main>;
  if (!journey || !completed) return null;

  const item = journey.items.find((i) => i.key === key);
  if (!item) {
    return (
      <main className="mx-auto max-w-md px-4 pt-10 text-sm">
        <p>This milestone is not in your journey.</p>
        <Link href="/journey" className="font-mono mt-4 block text-[11px] text-[var(--accent)]">← FLIGHT PLAN</Link>
      </main>
    );
  }

  const phase = defaultContent.templates
    .find((t) => t.key === journey.templateKey)
    ?.phases.find((p) => p.key === item.phase);
  const doneCount = item.tasks.filter((t) => completed.has(taskId(item.key, t.key))).length;
  const slot = item.slot ? SLOTS[item.slot] : undefined;
  const due = item.start === item.end ? monthLabel(item.start) : `${monthLabel(item.start)} – ${monthLabel(item.end)}`;

  function toggle(taskKey: string, exp: number) {
    const id = taskId(item!.key, taskKey);
    const next = new Set(completed);
    const adding = !next.has(id);
    if (adding) next.add(id);
    else next.delete(id);
    setCompleted(next);
    setTaskDone(id, adding, next).catch(() => {
      setCompleted(completed); // undo: the tick could not be saved
      show("Not saved. Check your connection.");
    });
    if (adding) show(`+${exp} EXP`);
  }

  function show(text: string) {
    const id = ++noticeId.current;
    setNotice({ id, text });
    setTimeout(() => setNotice((n) => (n?.id === id ? null : n)), 1800);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-12">
      <div className="font-mono flex items-center justify-between text-[11px]">
        <button type="button" onClick={() => router.back()} className="text-[var(--accent)]">
          ← BACK
        </button>
        <span className="text-[var(--muted)] uppercase">{phase?.title.en}</span>
      </div>

      {/* Header */}
      <section className="window window-active p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--line)] text-[var(--accent)]">
            <MilestoneIcon milestone={item.key} size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-title text-xl leading-tight font-semibold tracking-wide uppercase">{item.title.en}</h1>
            <div className="font-mono mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
              <span>{due.toUpperCase()}</span>
              <span className="text-[var(--accent)]">{item.exp} EXP</span>
              {item.fixed && <span className="text-[#f87171]">DEADLINE</span>}
              {!item.required && <span>OPTIONAL</span>}
              {item.rescheduled && <span className="text-[#fbbf24]">CATCH-UP</span>}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed">{item.help.en}</p>
        {item.stamp && (
          <p className="font-mono mt-3 border-t border-[var(--line-soft)] pt-3 text-[11px] text-[var(--muted)]">
            REWARD · <span className="text-[var(--text)]">{STAMP_NAMES[item.stamp] ?? item.stamp}</span> passport stamp
          </p>
        )}
      </section>

      {item.key === "scam_shield" && (
        <Link
          href="/scam-check"
          className="font-title block border border-[var(--accent)] bg-[var(--accent)] py-3 text-center text-sm font-semibold tracking-[0.2em] text-[var(--bg)] uppercase"
        >
          Open Scam Check
        </Link>
      )}

      {/* Tasks */}
      <section className="window px-4 pt-3 pb-3">
        <h2 className="window-title">Tasks</h2>
        <ul className="mt-2">
          {item.tasks.map((t) => {
            const done = completed.has(taskId(item.key, t.key));
            return (
              <li key={t.key}>
                <button type="button" onClick={() => toggle(t.key, t.exp)} className="flex w-full items-center gap-3 py-2 text-left">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] leading-none ${
                      done ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]" : "border-[var(--muted)]"
                    }`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  <span className={`flex-1 text-sm ${done ? "text-[var(--muted)] line-through" : ""}`}>{t.title.en}</span>
                  <span className={`font-mono text-xs ${done ? "text-[var(--muted)]" : "text-[var(--accent)]"}`}>+{t.exp}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-center gap-3 border-t border-[var(--line-soft)] pt-3">
          <div className="track flex-1">
            <div style={{ width: `${(doneCount / item.tasks.length) * 100}%` }} />
          </div>
          <span className="font-mono text-[11px] text-[var(--muted)]">
            {doneCount}/{item.tasks.length}
          </span>
        </div>
      </section>

      {/* Help options: one sponsored slot, always beside a free option */}
      {slot && (
        <section className="space-y-2">
          <h2 className="font-mono px-1 text-[11px] tracking-widest text-[var(--muted)]">GET HELP</h2>
          <div className="window p-4">
            <div className="font-mono text-[10px] tracking-widest text-[#fbbf24]">SPONSORED · {slot.label.toUpperCase()}</div>
            <p className="mt-1.5 text-sm">No sponsor in this slot yet.</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Sponsors here meet our published standards. They are never ranked above free options.
            </p>
          </div>
          <div className="window p-4">
            <div className="font-mono text-[10px] tracking-widest text-[#4ade80]">FREE OPTION</div>
            {slot.free.url ? (
              <a href={slot.free.url} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1.5 text-sm hover:text-[var(--accent)]">
                {slot.free.title}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            ) : (
              <p className="mt-1.5 text-sm">{slot.free.title}</p>
            )}
            <p className="mt-1 text-xs text-[var(--muted)]">{slot.free.note}</p>
          </div>
        </section>
      )}

      {/* Advisor sessions for this topic */}
      {item.advisorTopic && (
        <section className="window p-4">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Users size={15} aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-wider uppercase">Advisor sessions</span>
          </div>
          <p className="mt-2 text-sm">{ADVISOR_TOPICS[item.advisorTopic] ?? item.advisorTopic}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Small group sessions with students who made it abroad. No sessions are open yet.
          </p>
        </section>
      )}

      {notice && (
        <div key={notice.id} className="notify window window-active fixed top-4 left-1/2 z-40 w-[min(90vw,300px)] px-4 py-2.5 text-center">
          <div className="font-title text-base font-semibold text-[var(--accent)] uppercase">{notice.text}</div>
        </div>
      )}
    </main>
  );
}
