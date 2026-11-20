"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  computeProgress,
  defaultContent,
  defaultCourse,
  nextUnlock,
  type CourseSection,
} from "@dreamer/journey-engine";
import { ArrowLeft, BookOpen, Clock, Lock, PlayCircle } from "lucide-react";
import { useStudent } from "@/lib/student";

const SECTIONS: { key: CourseSection; label: string; description: string }[] = [
  { key: "reading", label: "Reading", description: "Academic passage strategies, skimming, scanning & question mastery" },
  { key: "writing", label: "Writing", description: "Task 1 report structures and Task 2 academic essay argumentation" },
  { key: "listening", label: "Listening", description: "Section 1-4 speed tracking, distractor avoidance, and spelling accuracy" },
  { key: "speaking", label: "Speaking", description: "Part 1 fluency, Part 2 cue cards, and Part 3 abstract discussion" },
];

export default function CoursePage() {
  const router = useRouter();
  const { ready, needsSignIn, profile, journey, completed, extraExp, today, error } = useStudent();

  useEffect(() => {
    if (!ready || error) return;
    if (needsSignIn) router.replace("/signin");
    else if (!profile) router.replace("/onboarding");
  }, [ready, needsSignIn, profile, error, router]);

  const progress = useMemo(() => {
    if (!journey) return null;
    return computeProgress(journey, completed, today, defaultContent, extraExp);
  }, [journey, completed, today, extraExp]);

  const currentExp = progress?.exp ?? 0;
  const lessons = defaultCourse.lessons;

  const next = useMemo(() => nextUnlock(lessons, currentExp), [lessons, currentExp]);

  if (!ready || !journey || !progress) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading IELTS masterclass...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-16">
      {/* Back navigation */}
      <div>
        <Link
          href="/"
          className="flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Flight plan</span>
        </Link>
      </div>

      {/* Course Header Banner */}
      <section className="window p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider uppercase border border-[var(--accent)] px-1.5 py-0.5 text-[var(--accent)]">
                Dreamer Original
              </span>
              <span className="font-mono text-[11px] text-[var(--muted)]">Taught by Founder</span>
            </div>
            <h1 className="font-title mt-2 text-lg font-bold tracking-wide uppercase text-[var(--text)]">
              {defaultCourse.courseTitle}
            </h1>
          </div>
        </div>

        <p className="mt-2 text-xs text-[var(--muted)]">
          {defaultCourse.description}
        </p>

        {/* EXP Unlock Status */}
        <div className="mt-4 border-t border-[var(--line-soft)] pt-3 font-mono text-xs">
          <div className="flex justify-between text-[var(--muted)]">
            <span>Your EXP: {currentExp}</span>
            {next ? (
              <span className="text-[var(--accent)]">Next in {next.expNeeded} EXP</span>
            ) : (
              <span className="text-[#4ade80]">All Lessons Unlocked ✓</span>
            )}
          </div>
          {next && (
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Next unlock: <span className="text-[var(--text)] font-semibold">{next.nextLesson.title}</span> (at {next.nextLesson.unlockExp} EXP)
            </p>
          )}
        </div>
      </section>

      {/* Lessons grouped by section */}
      {SECTIONS.map((sec) => {
        const secLessons = lessons.filter((l) => l.section === sec.key);
        if (secLessons.length === 0) return null;

        return (
          <section key={sec.key} className="space-y-2.5">
            <div className="px-1">
              <h2 className="font-title text-sm font-semibold uppercase tracking-wider text-[var(--text)]">
                {sec.label} Module
              </h2>
              <p className="text-[11px] text-[var(--muted)]">{sec.description}</p>
            </div>

            <div className="space-y-2">
              {secLessons.map((lesson) => {
                const isUnlocked = currentExp >= lesson.unlockExp;
                const needed = Math.max(0, lesson.unlockExp - currentExp);

                if (isUnlocked) {
                  return (
                    <Link
                      key={lesson.id}
                      href={`/course/${lesson.id}`}
                      className="window block p-3.5 transition-colors hover:border-[var(--accent)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <PlayCircle size={15} className="shrink-0 text-[var(--accent)]" />
                            <h3 className="font-title text-sm font-semibold truncate text-[var(--text)]">
                              {lesson.title}
                            </h3>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                            {lesson.summary}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 font-mono text-[11px] text-[var(--muted)]">
                          <Clock size={12} />
                          <span>{lesson.durationMin}m</span>
                        </div>
                      </div>

                      {lesson.practiceId && (
                        <div className="mt-2.5 border-t border-[var(--line-soft)] pt-2 flex items-center gap-1.5 font-mono text-[11px] text-[var(--accent)]">
                          <BookOpen size={12} />
                          <span>Includes Reading Practice (+20 EXP)</span>
                        </div>
                      )}
                    </Link>
                  );
                }

                // Locked Lesson Card
                return (
                  <div
                    key={lesson.id}
                    className="window p-3.5 opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Lock size={15} className="shrink-0 text-[var(--muted)]" />
                          <h3 className="font-title text-sm font-semibold truncate text-[var(--muted)]">
                            {lesson.title}
                          </h3>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                          {lesson.summary}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 font-mono text-[11px] text-[var(--muted)]">
                        <Clock size={12} />
                        <span>{lesson.durationMin}m</span>
                      </div>
                    </div>

                    <div className="mt-2.5 border-t border-[var(--line-soft)] pt-2 font-mono text-[11px] text-[var(--muted)] flex items-center justify-between">
                      <span>Unlocks at {lesson.unlockExp} EXP</span>
                      <span className="text-[var(--accent)]">Need {needed} EXP more</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Note about sponsored 1-on-1 coaching */}
      <section className="window p-3 text-center">
        <p className="text-[11px] text-[var(--muted)]">
          Free masterclass provided to every Dreamer student. For personalized 1-on-1 coaching, explore our verified partner slots in your IELTS milestone.
        </p>
      </section>
    </main>
  );
}
