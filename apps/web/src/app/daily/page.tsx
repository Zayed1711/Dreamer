"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  checkSentences,
  checkWords,
  computeProgress,
  defaultContent,
  defaultDictionary,
  pickDailyQuest,
  questDate,
  type DailyQuest,
} from "@dreamer/journey-engine";
import { ArrowLeft, Check, Flame, ShieldAlert } from "lucide-react";
import { ErrorLine, PrimaryButton } from "@/components/ui";
import { loadDailyState, submitDailyQuest, type DailyState } from "@/lib/store";
import { useStudent } from "@/lib/student";

export default function DailyQuestPage() {
  const router = useRouter();
  const { ready, needsSignIn, profile, journey, completed, extraExp, today, error } = useStudent();
  const [dailyState, setDailyState] = useState<DailyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Inputs for words (5 words)
  const [wordInputs, setWordInputs] = useState<string[]>(["", "", "", "", ""]);

  // Inputs for sentences (5 sentences)
  const [sentenceInputs, setSentenceInputs] = useState<string[]>(["", "", "", "", ""]);

  // Input for writing
  const [writingInput, setWritingInput] = useState<string>("");

  const dhakaDate = useMemo(() => questDate(), []);

  useEffect(() => {
    if (!ready || error) return;
    if (needsSignIn) {
      router.replace("/signin");
      return;
    }
    if (!profile) {
      router.replace("/onboarding");
      return;
    }

    loadDailyState("english", dhakaDate)
      .then((state) => {
        setDailyState(state);
        setLoading(false);
      })
      .catch((err) => {
        setProblems([err instanceof Error ? err.message : String(err)]);
        setLoading(false);
      });
  }, [ready, needsSignIn, profile, error, dhakaDate, router]);

  const progress = useMemo(() => {
    if (!journey) return null;
    return computeProgress(journey, completed, today, defaultContent, extraExp);
  }, [journey, completed, today, extraExp]);

  const studentLevel = progress?.level ?? 1;
  const isHolding = progress?.flightStatus === "holding";

  const quest: DailyQuest = useMemo(
    () => pickDailyQuest(dhakaDate, studentLevel),
    [dhakaDate, studentLevel],
  );

  const handleWordChange = (index: number, val: string) => {
    const next = [...wordInputs];
    next[index] = val;
    setWordInputs(next);
  };

  const handleSentenceChange = (index: number, val: string) => {
    const next = [...sentenceInputs];
    next[index] = val;
    setSentenceInputs(next);
  };

  const handleCheckAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblems([]);
    setSubmitting(true);

    try {
      if (quest.type === "words") {
        const check = checkWords(wordInputs, {
          dictionary: defaultDictionary,
          alreadyLearned: dailyState?.learnedWords ?? [],
        });

        if (!check.passed) {
          setProblems(check.problems);
          setSubmitting(false);
          return;
        }

        const cleanWords = wordInputs.map((w) => w.trim().toLowerCase());
        const updated = await submitDailyQuest(
          dhakaDate,
          "english",
          "words",
          { words: cleanWords },
          20,
          { holding: isHolding },
        );
        setDailyState(updated);
        setSuccess(true);
      } else if (quest.type === "sentences") {
        const check = checkSentences(sentenceInputs, quest.prompt?.prompt ?? "");

        if (!check.passed) {
          setProblems(check.problems);
          setSubmitting(false);
          return;
        }

        const updated = await submitDailyQuest(
          dhakaDate,
          "english",
          "sentences",
          { sentences: sentenceInputs.map((s) => s.trim()) },
          20,
          { holding: isHolding },
        );
        setDailyState(updated);
        setSuccess(true);
      } else if (quest.type === "writing") {
        const words = writingInput.trim().split(/\s+/).filter(Boolean);
        if (words.length < 50) {
          setProblems([`Please write at least 50 words (currently ${words.length}).`]);
          setSubmitting(false);
          return;
        }

        const updated = await submitDailyQuest(
          dhakaDate,
          "english",
          "writing",
          { text: writingInput.trim(), wordCount: words.length },
          20,
          { holding: isHolding },
        );
        setDailyState(updated);
        setSuccess(true);
      }
    } catch (err) {
      setProblems([err instanceof Error ? err.message : "Submission failed. Please check your connection."]);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading daily quest...</p>
      </main>
    );
  }

  const alreadyDone = Boolean(dailyState?.isDoneToday || success);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-16">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Flight plan</span>
        </Link>
        <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--accent)]">
          <Flame size={14} />
          <span>Streak: {dailyState?.streak.currentCount ?? 0}</span>
        </div>
      </div>

      {/* Header window */}
      <section className="window p-4">
        <div className="flex items-baseline justify-between">
          <h1 className="font-title text-base font-semibold tracking-wider uppercase text-[var(--text)]">
            Daily Quest
          </h1>
          <span className="font-mono text-xs text-[var(--muted)]">{dhakaDate}</span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[var(--line-soft)] pt-2 font-mono text-xs">
          <span className="text-[var(--muted)]">Track: English</span>
          <span className="text-[var(--accent)]">Reward: +20 EXP</span>
        </div>

        {isHolding && (
          <div className="mt-3 flex items-center gap-2 border border-[#fbbf24]/30 bg-[#fbbf24]/5 px-3 py-2 text-xs text-[#fbbf24]">
            <ShieldAlert size={14} className="shrink-0" />
            <span>HSC holding window: Daily quests are optional. Streak is protected.</span>
          </div>
        )}
      </section>

      {/* Completion window if already done */}
      {alreadyDone ? (
        <section className="window p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#4ade80] text-[#4ade80]">
            <Check size={24} className="stroke-[2.5]" />
          </div>
          <h2 className="font-title mt-3 text-lg font-bold tracking-wide uppercase text-[var(--text)]">
            Quest Completed
          </h2>
          <p className="mt-1 font-mono text-xs text-[#4ade80]">+20 EXP earned today</p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            You completed today&apos;s English quest. Come back tomorrow after Dhaka midnight to continue your streak!
          </p>

          <div className="mt-4 border-t border-[var(--line-soft)] pt-3 font-mono text-xs text-[var(--muted)] flex justify-between">
            <span>Streak: {dailyState?.streak.currentCount ?? 1} days</span>
            <span>Freezes left: {dailyState?.streak.freezesLeft ?? 2}</span>
          </div>

          <div className="mt-5">
            <Link
              href="/"
              className="font-title block w-full border border-[var(--accent)] bg-[var(--accent)] py-3 text-center text-xs font-semibold tracking-widest uppercase text-black transition-opacity hover:opacity-90"
            >
              Return to Flight Plan
            </Link>
          </div>
        </section>
      ) : (
        /* Quest Task Form */
        <form onSubmit={handleCheckAndSubmit} className="space-y-4">
          {/* Words Quest */}
          {quest.type === "words" && quest.words && (
            <>
              <section className="window p-4">
                <h2 className="window-title">1. Review Today&apos;s 5 Words</h2>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Read and understand each word and its usage before typing them below.
                </p>

                <div className="mt-3 divide-y divide-[var(--line-soft)]">
                  {quest.words.map((w, i) => (
                    <div key={w.word} className="py-2.5 first:pt-1 last:pb-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-sm font-bold text-[var(--accent)]">
                          {i + 1}. {w.word}
                        </span>
                        {w.bn && <span className="font-mono text-xs text-[var(--muted)]">{w.bn}</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text)]">{w.meaning}</p>
                      <p className="mt-1 text-[11px] italic text-[var(--muted)]">&ldquo;{w.sentence}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="window p-4">
                <h2 className="window-title">2. Verify & Check Spelling</h2>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Type each of the 5 words from memory to verify your retention.
                </p>

                <div className="mt-3 space-y-2">
                  {wordInputs.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--muted)] w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleWordChange(idx, e.target.value)}
                        placeholder={`Word ${idx + 1}`}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Sentences Quest */}
          {quest.type === "sentences" && quest.prompt && (
            <section className="window p-4">
              <h2 className="window-title">Write 5 Sentences</h2>
              <div className="mt-3 border-l-2 border-[var(--accent)] pl-3">
                <p className="font-title text-sm font-semibold text-[var(--text)]">{quest.prompt.prompt}</p>
                {quest.prompt.bn && <p className="font-mono mt-1 text-xs text-[var(--muted)]">{quest.prompt.bn}</p>}
              </div>

              <div className="mt-3 border-t border-[var(--line-soft)] pt-2 font-mono text-[11px] text-[var(--muted)]">
                <p>• Exactly 5 sentences.</p>
                <p>• At least 4 words each.</p>
                <p>• Start with capital letter, end with &apos;.&apos;, &apos;!&apos; or &apos;?&apos;.</p>
                <p>• Use your own words (do not copy the prompt).</p>
              </div>

              <div className="mt-4 space-y-2.5">
                {sentenceInputs.map((val, idx) => (
                  <div key={idx}>
                    <div className="font-mono mb-1 text-[11px] text-[var(--muted)]">Sentence {idx + 1}:</div>
                    <textarea
                      rows={2}
                      value={val}
                      onChange={(e) => handleSentenceChange(idx, e.target.value)}
                      placeholder={`Write sentence ${idx + 1} here...`}
                      className="w-full border border-[var(--line)] bg-[var(--bg)] p-2.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Writing Quest */}
          {quest.type === "writing" && (
            <section className="window p-4">
              <h2 className="window-title">Writing Practice</h2>
              <p className="mt-2 text-xs text-[var(--text)] font-semibold">
                {quest.prompt?.prompt ?? "Write an argumentative paragraph on studying abroad."}
              </p>
              <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">Target: At least 50 words.</p>

              <div className="mt-3">
                <textarea
                  rows={6}
                  value={writingInput}
                  onChange={(e) => setWritingInput(e.target.value)}
                  placeholder="Write your paragraph here..."
                  className="w-full border border-[var(--line)] bg-[var(--bg)] p-3 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </section>
          )}

          {/* Problems / Errors */}
          {problems.length > 0 && (
            <div className="space-y-1">
              {problems.map((p, idx) => (
                <ErrorLine key={idx} message={p} />
              ))}
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Checking..." : "Check & Earn 20 EXP"}
            </PrimaryButton>
          </div>
        </form>
      )}
    </main>
  );
}
