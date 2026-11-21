"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Calendar, ExternalLink, Ticket, Users } from "lucide-react";
import {
  defaultContent,
  findMentorsForTopic,
  taskId,
  type Ad,
  type AdvisorSession,
  type MentorProfile,
} from "@dreamer/journey-engine";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { BookingPaymentModal } from "@/components/BookingPaymentModal";
import { ErrorLine } from "@/components/ui";
import { monthLabel } from "@/lib/format";
import { ADVISOR_TOPICS, SLOTS, STAMP_NAMES } from "@/lib/slots";
import {
  loadActiveAdForSlot,
  loadMentors,
  loadSessionsForTopic,
  recordAdEvent,
  setTaskDone,
} from "@/lib/store";
import { useStudent } from "@/lib/student";

export default function MilestonePage() {
  const router = useRouter();
  const { key } = useParams<{ key: string }>();
  const { ready, needsSignIn, profile, journey, completed: loaded, error } = useStudent();
  const [completed, setCompleted] = useState<Set<string> | null>(null);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [activeAd, setActiveAd] = useState<Ad | null>(null);
  const [sessions, setSessions] = useState<AdvisorSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AdvisorSession | null>(null);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const noticeId = useRef(0);
  const adViewLogged = useRef<string | null>(null);

  const item = journey?.items.find((i) => i.key === key);

  useEffect(() => {
    loadMentors().then(setMentors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (needsSignIn) router.replace("/signin");
    else if (!profile) router.replace("/onboarding");
  }, [ready, needsSignIn, profile, router]);

  useEffect(() => {
    if (ready) setCompleted(new Set(loaded));
  }, [ready, loaded]);

  useEffect(() => {
    if (!item?.slot) return;
    loadActiveAdForSlot(item.slot, {
      stage: profile?.stage,
      country: profile?.countries?.[0],
      english: profile?.englishLevel,
    }).then((ad) => {
      setActiveAd(ad);
      if (ad && adViewLogged.current !== ad.id) {
        adViewLogged.current = ad.id;
        recordAdEvent(ad.id, "view", item.key, profile?.stage);
      }
    });
  }, [item?.slot, item?.key, profile?.stage, profile?.countries, profile?.englishLevel]);

  useEffect(() => {
    if (!item?.advisorTopic) return;
    loadSessionsForTopic(item.advisorTopic).then(setSessions);
  }, [item?.advisorTopic]);

  if (error) return <main className="mx-auto max-w-md px-4 pt-10"><ErrorLine message={error} /></main>;
  if (!journey || !completed) return null;

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

          {activeAd ? (
            <div className="window window-active p-4 border-l-2 border-l-[#fbbf24]">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-mono text-[10px] tracking-widest text-[#fbbf24]">
                  SPONSORED · {slot.label.toUpperCase()}
                </span>
                {activeAd.standardsAcceptedAt && (
                  <span className="font-mono text-[9px] text-[var(--muted)]">
                    meets our standards as of {new Date(activeAd.standardsAcceptedAt).toLocaleDateString("en-GB")}
                  </span>
                )}
              </div>
              <h3 className="font-title mt-2 text-sm font-semibold uppercase leading-snug">
                {activeAd.headline}
              </h3>
              {activeAd.body && (
                <p className="mt-1 text-xs text-[var(--text)] leading-relaxed">{activeAd.body}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-soft)] pt-2.5">
                <span className="font-mono text-[10px] bg-[var(--bg-card)] border border-[var(--line-soft)] px-2 py-0.5 text-[var(--accent)] font-semibold">
                  CODE: {activeAd.referralCode}
                </span>
                <a
                  href={activeAd.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => recordAdEvent(activeAd.id, "click", item.key, profile?.stage)}
                  className="font-mono flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                >
                  Visit Website
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : (
            <div className="window p-4">
              <div className="font-mono text-[10px] tracking-widest text-[#fbbf24]">
                SPONSORED · {slot.label.toUpperCase()}
              </div>
              <p className="mt-1.5 text-sm">No sponsor in this slot yet.</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Sponsors here meet our published standards. They are never ranked above free options.
              </p>
            </div>
          )}

          <div className="window p-4">
            <div className="font-mono text-[10px] tracking-widest text-[#4ade80]">FREE OPTION</div>
            {slot.free.url ? (
              <a
                href={slot.free.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 flex items-center gap-1.5 text-sm hover:text-[var(--accent)]"
              >
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Users size={15} aria-hidden="true" />
              <span className="font-mono text-[11px] tracking-wider uppercase">Advisor sessions</span>
            </div>
            <Link
              href="/mentors"
              className="font-mono text-[11px] text-[var(--accent)] hover:underline"
            >
              All Mentors ›
            </Link>
          </div>

          <p className="mt-2 text-sm font-semibold text-[var(--text)]">
            {ADVISOR_TOPICS[item.advisorTopic] ?? item.advisorTopic}
          </p>

          {/* Active scheduled sessions */}
          {sessions.length > 0 ? (
            <div className="mt-3 space-y-2.5">
              <span className="font-mono text-[11px] text-[var(--muted)] block">
                Upcoming interactive group sessions (max 25 seats):
              </span>
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="border border-[var(--line-soft)] bg-[var(--bg-card)]/50 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-title text-xs font-semibold uppercase">{sess.title}</h4>
                        <div className="font-mono text-[11px] text-[var(--muted)] mt-0.5">
                          with {sess.advisorName} ({sess.advisorUniversity}, {sess.advisorCountry})
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[var(--accent)] shrink-0">
                        {sess.priceBdt === 0 ? "FREE" : `${sess.priceBdt} BDT`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-soft)] pt-2 text-[11px]">
                      <div className="flex items-center gap-3 text-[var(--muted)]">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={12} />
                          {new Date(sess.startsAt).toLocaleDateString("en-GB", {
                            timeZone: "Asia/Dhaka",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="font-mono">
                          {sess.durationMin}m · Max {sess.capacity} seats
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSession(sess)}
                        className="font-mono flex items-center gap-1 text-[11px] border border-[var(--accent)] bg-[var(--accent)]/15 px-2.5 py-1 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)] font-semibold uppercase"
                      >
                        <Ticket size={11} />
                        Book Seat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 border-t border-[var(--line-soft)] pt-2 text-xs text-[var(--muted)]">
              Small group interactive sessions with students who made it abroad. No sessions are currently scheduled for this topic.
            </p>
          )}

          {/* Mentors advising on this specific milestone topic */}
          {findMentorsForTopic(mentors, item.advisorTopic).length > 0 && (
            <div className="mt-3 border-t border-[var(--line-soft)] pt-2.5 space-y-1.5">
              <span className="font-mono text-[11px] text-[var(--muted)] block">
                Mentors advising on this topic:
              </span>
              <div className="divide-y divide-[var(--line-soft)]">
                {findMentorsForTopic(mentors, item.advisorTopic).slice(0, 3).map((m) => (
                  <Link
                    key={m.id}
                    href={`/mentors/${m.id}`}
                    className="py-2 flex items-center justify-between hover:text-[var(--accent)] group"
                  >
                    <div>
                      <span className="font-mono text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
                        {m.name}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--muted)] ml-2">
                        {m.university} ({m.country})
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[var(--accent)]">Profile ›</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {selectedSession && (
        <BookingPaymentModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => {
            // Refresh sessions
            if (item.advisorTopic) {
              loadSessionsForTopic(item.advisorTopic).then(setSessions);
            }
          }}
        />
      )}

      {notice && (
        <div key={notice.id} className="notify window window-active fixed top-4 left-1/2 z-40 w-[min(90vw,300px)] px-4 py-2.5 text-center">
          <div className="font-title text-base font-semibold text-[var(--accent)] uppercase">{notice.text}</div>
        </div>
      )}
    </main>
  );
}
