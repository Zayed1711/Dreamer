"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  defaultCourse,
  defaultReadingPractices,
  markReadingPractice,
  type ReadingMarkResult,
  type ReadingPracticeSet,
} from "@dreamer/journey-engine";
import { ArrowLeft, CheckCircle, RotateCcw, XCircle } from "lucide-react";
import { useStudent } from "@/lib/student";
import { loadCompletedPractices, submitPracticeCompletion } from "@/lib/store";

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const practiceId = params?.id as string | undefined;

  const { ready, needsSignIn, profile, journey, error } = useStudent();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ReadingMarkResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    if (!ready || error) return;
    if (needsSignIn) router.replace("/signin");
    else if (!profile) router.replace("/onboarding");
  }, [ready, needsSignIn, profile, error, router]);

  useEffect(() => {
    if (!practiceId) return;
    loadCompletedPractices()
      .then((list) => {
        if (list.includes(practiceId)) {
          setAlreadyCompleted(true);
        }
      })
      .catch(() => {});
  }, [practiceId]);

  const practice: ReadingPracticeSet | undefined = useMemo(() => {
    if (!practiceId) return undefined;
    return defaultReadingPractices[practiceId];
  }, [practiceId]);

  // Find corresponding lesson to allow back navigation
  const correspondingLesson = useMemo(() => {
    if (!practiceId) return undefined;
    return defaultCourse.lessons.find((l) => l.practiceId === practiceId);
  }, [practiceId]);

  if (!ready || !journey) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading practice...</p>
      </main>
    );
  }

  if (!practice) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 pt-8 text-center">
        <div className="window p-6">
          <p className="font-mono text-xs text-[var(--muted)]">Practice set not found.</p>
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

  function handleAnswerChange(blankIndex: number, value: string) {
    setAnswers((prev) => ({ ...prev, [blankIndex]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!practice || isSubmitting) return;

    const mark = markReadingPractice(practice, answers);
    setResult(mark);

    if (mark.passed && !alreadyCompleted) {
      setIsSubmitting(true);
      try {
        await submitPracticeCompletion(practice.id);
        setAlreadyCompleted(true);
      } catch (err) {
        console.error("Failed to save practice completion:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  function handleRetry() {
    setResult(null);
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-16">
      {/* Navigation */}
      <div>
        <Link
          href={correspondingLesson ? `/course/${correspondingLesson.id}` : "/course"}
          className="flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>{correspondingLesson ? correspondingLesson.title : "Back to Course"}</span>
        </Link>
      </div>

      {/* Header */}
      <section className="window p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider uppercase border border-[var(--accent)] px-1.5 py-0.5 text-[var(--accent)]">
                IELTS Reading
              </span>
              <span className="font-mono text-[11px] text-[var(--muted)]">Comprehension Practice</span>
            </div>
            <h1 className="font-title mt-2 text-base font-bold tracking-wide uppercase text-[var(--text)]">
              {practice.title}
            </h1>
          </div>
          <span className="shrink-0 font-mono text-xs text-[var(--accent)]">+20 EXP</span>
        </div>

        {alreadyCompleted && (
          <div className="mt-3 flex items-center gap-1.5 border border-[#4ade80]/30 bg-[#4ade80]/10 px-2.5 py-1.5 font-mono text-xs text-[#4ade80]">
            <CheckCircle size={13} />
            <span>Completed & EXP claimed</span>
          </div>
        )}
      </section>

      {/* Passage window */}
      <section className="window p-4">
        <h2 className="window-title mb-2 text-xs">Academic Passage</h2>
        <p className="font-sans text-xs leading-relaxed text-[var(--text)]">
          {practice.passage}
        </p>
      </section>

      {/* Form or Result View */}
      <section className="window p-4">
        <h2 className="window-title mb-3 text-xs">Fill-In-The-Blank Questions</h2>

        {result ? (
          /* Result feedback */
          <div className="space-y-4">
            <div
              className={`border p-3 ${
                result.passed
                  ? "border-[#4ade80]/40 bg-[#4ade80]/10"
                  : "border-[#f87171]/40 bg-[#f87171]/10"
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs font-semibold">
                <span className={result.passed ? "text-[#4ade80]" : "text-[#f87171]"}>
                  {result.passed ? "PASS (Score >= 67%)" : "NEEDS IMPROVEMENT"}
                </span>
                <span>
                  {result.score} / {result.total} Correct
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {result.passed
                  ? "Well done! You demonstrated strong reading comprehension skills."
                  : "Review the passage and try again to achieve at least 67% accuracy."}
              </p>
            </div>

            <div className="space-y-3">
              {result.results.map((res) => (
                <div key={res.index} className="border-t border-[var(--line-soft)] pt-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    {res.correct ? (
                      <CheckCircle size={15} className="mt-0.5 shrink-0 text-[#4ade80]" />
                    ) : (
                      <XCircle size={15} className="mt-0.5 shrink-0 text-[#f87171]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-[var(--muted)]">
                        Question {res.index}:
                      </p>
                      <p className="font-sans text-[var(--text)]">
                        {practice.blanks.find((b) => b.index === res.index)?.question}
                      </p>
                      <div className="mt-1 font-mono text-[11px]">
                        <span>Your answer: </span>
                        <span className={res.correct ? "text-[#4ade80]" : "text-[#f87171]"}>
                          {res.given || "(blank)"}
                        </span>
                        {!res.correct && (
                          <span className="ml-2 text-[var(--muted)]">
                            [Accepted: {res.expected}]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              {!result.passed && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-[var(--accent)] py-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent)]/10"
                >
                  <RotateCcw size={14} />
                  <span>Try Again</span>
                </button>
              )}
              <Link
                href={correspondingLesson ? `/course/${correspondingLesson.id}` : "/course"}
                className="flex flex-1 items-center justify-center border border-[var(--line-soft)] py-2 font-mono text-xs uppercase tracking-wider text-[var(--text)] hover:border-[var(--accent)]"
              >
                <span>Back to Lesson</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Form for answering */
          <form onSubmit={handleSubmit} className="space-y-4">
            {practice.blanks.map((b) => (
              <div key={b.index} className="space-y-1.5">
                <label className="block text-xs text-[var(--text)]">
                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    {b.index}.{" "}
                  </span>
                  {b.question}
                </label>
                <input
                  type="text"
                  required
                  value={answers[b.index] ?? ""}
                  onChange={(e) => handleAnswerChange(b.index, e.target.value)}
                  placeholder="Type missing word..."
                  className="w-full border border-[var(--line-soft)] bg-[var(--surface-sunken)] px-3 py-1.5 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border border-[var(--accent)] bg-[var(--accent)]/10 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
            >
              {isSubmitting ? "Marking & Submitting..." : "Submit Answers (+20 EXP)"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
