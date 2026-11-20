"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  computeProgress,
  defaultContent,
  defaultCourse,
} from "@dreamer/journey-engine";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Lock } from "lucide-react";
import { useStudent } from "@/lib/student";
import { loadCompletedPractices } from "@/lib/store";
import { LessonVideo } from "@/components/LessonVideo";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.id as string | undefined;

  const { ready, needsSignIn, profile, journey, completed, extraExp, today, error } = useStudent();
  const [completedPractices, setCompletedPractices] = useState<string[]>([]);

  useEffect(() => {
    if (!ready || error) return;
    if (needsSignIn) router.replace("/signin");
    else if (!profile) router.replace("/onboarding");
  }, [ready, needsSignIn, profile, error, router]);

  useEffect(() => {
    loadCompletedPractices().then(setCompletedPractices).catch(() => {});
  }, []);

  const progress = useMemo(() => {
    if (!journey) return null;
    return computeProgress(journey, completed, today, defaultContent, extraExp);
  }, [journey, completed, today, extraExp]);

  const lesson = useMemo(() => {
    return defaultCourse.lessons.find((l) => l.id === lessonId);
  }, [lessonId]);

  if (!ready || !journey || !progress) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading lesson...</p>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 pt-8 text-center">
        <div className="window p-6">
          <p className="font-mono text-xs text-[var(--muted)]">Lesson not found.</p>
          <div className="mt-4">
            <Link
              href="/course"
              className="inline-flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
            >
              <ArrowLeft size={14} />
              <span>Back to course</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isUnlocked = progress.exp >= lesson.unlockExp;
  const isPracticeDone = lesson.practiceId ? completedPractices.includes(lesson.practiceId) : false;

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/course"
          className="flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>All Lessons</span>
        </Link>
      </div>

      {isUnlocked ? (
        <>
          {/* Video Player */}
          <section className="space-y-3">
            <LessonVideo videoUrl={lesson.videoUrl} title={lesson.title} />

            <div className="window p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-wider uppercase border border-[var(--accent)] px-1.5 py-0.5 text-[var(--accent)]">
                  {lesson.section}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--muted)]">
                  <Clock size={12} />
                  <span>{lesson.durationMin} MIN</span>
                </span>
              </div>

              <h1 className="font-title mt-2 text-base font-bold tracking-wide uppercase text-[var(--text)]">
                {lesson.title}
              </h1>

              <div className="mt-4 border-t border-[var(--line-soft)] pt-3">
                <h2 className="window-title mb-1.5 text-xs">Overview & Key Takeaways</h2>
                <p className="text-xs leading-relaxed text-[var(--text-soft)]">
                  {lesson.summary}
                </p>
              </div>
            </div>
          </section>

          {/* Practice Set Section if available */}
          {lesson.practiceId && (
            <section className="window p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[var(--accent)]" />
                  <h2 className="window-title mb-0">Reading Practice Set</h2>
                </div>
                <span className="font-mono text-[11px] text-[var(--accent)]">+20 EXP</span>
              </div>

              <p className="mt-2 text-xs text-[var(--muted)]">
                Complete this fill-in-the-blank comprehension exercise to reinforce lesson concepts and earn extra EXP.
              </p>

              <div className="mt-4">
                {isPracticeDone ? (
                  <div className="flex items-center justify-between border border-[#4ade80]/30 bg-[#4ade80]/10 p-2.5">
                    <span className="flex items-center gap-1.5 font-mono text-xs text-[#4ade80]">
                      <CheckCircle size={14} />
                      <span>Practice Completed (+20 EXP claimed)</span>
                    </span>
                    <Link
                      href={`/course/practice/${lesson.practiceId}`}
                      className="font-mono text-[11px] text-[var(--muted)] underline hover:text-[var(--text)]"
                    >
                      Review
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/course/practice/${lesson.practiceId}`}
                    className="flex w-full items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)]/10 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent)]/20"
                  >
                    <BookOpen size={14} />
                    <span>Start Practice Set (+20 EXP)</span>
                  </Link>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Locked State */
        <div className="window p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[var(--line-soft)] text-[var(--muted)]">
            <Lock size={20} />
          </div>
          <h1 className="font-title mt-3 text-base font-bold uppercase tracking-wider text-[var(--text)]">
            Lesson Locked
          </h1>
          <p className="mt-1 font-mono text-xs text-[var(--muted)]">
            Requires {lesson.unlockExp} EXP to unlock
          </p>

          <div className="my-4 border-t border-b border-[var(--line-soft)] py-3 font-mono text-xs">
            <div className="flex justify-between text-[var(--muted)]">
              <span>Your Current EXP:</span>
              <span className="text-[var(--text)]">{progress.exp}</span>
            </div>
            <div className="mt-1 flex justify-between text-[var(--accent)]">
              <span>EXP Needed:</span>
              <span>{lesson.unlockExp - progress.exp} EXP</span>
            </div>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Earn EXP by completing your monthly journey tasks, daily quests, and reading practices.
          </p>

          <div className="mt-6">
            <Link
              href="/course"
              className="inline-flex items-center gap-1 border border-[var(--line-soft)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--text)] hover:border-[var(--accent)]"
            >
              <ArrowLeft size={14} />
              <span>Back to Course Index</span>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
