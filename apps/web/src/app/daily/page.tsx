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
  getLanguageTrack,
  markQuiz,
  pickDailyQuest,
  pickLanguageQuest,
  questDate,
  type DailyQuest,
  type LanguageCode,
  type LanguageProgress,
  type LanguageQuizResult,
  type QuizQuestion,
} from "@dreamer/journey-engine";
import { ArrowLeft, Check, Flame, RotateCcw, ShieldAlert, XCircle } from "lucide-react";
import { ErrorLine, PrimaryButton } from "@/components/ui";
import { PronounceButton } from "@/components/PronounceButton";
import {
  loadDailyState,
  loadLanguageProgress,
  saveLanguageProgress,
  submitDailyQuest,
  type DailyState,
} from "@/lib/store";
import { useStudent } from "@/lib/student";

export default function DailyQuestPage() {
  const router = useRouter();
  const { ready, needsSignIn, profile, journey, completed, extraExp, today, error } = useStudent();

  // Active track tab: "english" or "language"
  const [activeTab, setActiveTab] = useState<"english" | "language">("english");

  // English Quest State
  const [dailyState, setDailyState] = useState<DailyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Inputs for English words (5 words)
  const [wordInputs, setWordInputs] = useState<string[]>(["", "", "", "", ""]);
  // Inputs for English sentences (5 sentences)
  const [sentenceInputs, setSentenceInputs] = useState<string[]>(["", "", "", "", ""]);
  // Input for English writing
  const [writingInput, setWritingInput] = useState<string>("");

  // Language Track State
  const targetLang: LanguageCode | null = useMemo(
    () => getLanguageTrack(profile?.countries),
    [profile?.countries],
  );
  const [langDailyState, setLangDailyState] = useState<DailyState | null>(null);
  const [langProgress, setLangProgress] = useState<LanguageProgress | null>(null);
  const [langAnswers, setLangAnswers] = useState<Record<string, string>>({});
  const [langResult, setLangResult] = useState<LanguageQuizResult | null>(null);
  const [langSubmitting, setLangSubmitting] = useState(false);
  const [langSuccess, setLangSuccess] = useState(false);

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

    const loadData = async () => {
      try {
        const engState = await loadDailyState("english", dhakaDate);
        setDailyState(engState);

        if (targetLang) {
          const [lDaily, lProg] = await Promise.all([
            loadDailyState(targetLang, dhakaDate),
            loadLanguageProgress(targetLang),
          ]);
          setLangDailyState(lDaily);
          setLangProgress(lProg);

          // If English is done but language is not, default to language tab
          if (engState.isDoneToday && !lDaily.isDoneToday) {
            setActiveTab("language");
          }
        }
      } catch (err) {
        setProblems([err instanceof Error ? err.message : String(err)]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ready, needsSignIn, profile, error, dhakaDate, targetLang, router]);

  const progress = useMemo(() => {
    if (!journey) return null;
    return computeProgress(journey, completed, today, defaultContent, extraExp);
  }, [journey, completed, today, extraExp]);

  const studentLevel = progress?.level ?? 1;
  const isHolding = progress?.flightStatus === "holding";

  // English daily quest
  const quest: DailyQuest = useMemo(
    () => pickDailyQuest(dhakaDate, studentLevel),
    [dhakaDate, studentLevel],
  );

  // Language track quest (if qualified)
  const langQuest = useMemo(() => {
    if (!targetLang || !langProgress) return null;
    return pickLanguageQuest(
      targetLang,
      langProgress.level,
      dhakaDate,
      process.env.NODE_ENV === "production",
    );
  }, [targetLang, langProgress, dhakaDate]);

  // English form handlers
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

        const updated = await submitDailyQuest(
          dhakaDate,
          "english",
          "words",
          { words: wordInputs.map((w) => w.trim().toLowerCase()) },
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
      } else {
        if (writingInput.trim().split(/\s+/).length < 50) {
          setProblems(["Please write at least 50 words."]);
          setSubmitting(false);
          return;
        }

        const updated = await submitDailyQuest(
          dhakaDate,
          "english",
          "writing",
          { text: writingInput.trim() },
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

  // Language quiz handlers
  const handleSelectOption = (questionId: string, option: string) => {
    setLangAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleLanguageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!langQuest || !targetLang || !langProgress || langSubmitting) return;

    // Check all questions answered
    const unanswered = langQuest.questions.filter((q) => !langAnswers[q.id]);
    if (unanswered.length > 0) {
      setProblems(["Please answer all 5 questions before submitting."]);
      return;
    }

    setProblems([]);
    const result = markQuiz(langAnswers, langQuest.questions);
    setLangResult(result);

    if (result.passed) {
      setLangSubmitting(true);
      try {
        const updatedDaily = await submitDailyQuest(
          dhakaDate,
          targetLang,
          "quiz",
          {
            level: langProgress.level,
            answers: langAnswers,
            score: result.score,
            total: result.total,
          },
          20,
          { holding: isHolding },
        );
        setLangDailyState(updatedDaily);

        // Update language progress: advance level after 5 completed quizzes
        const nextCompleted = langProgress.quizzesCompleted + 1;
        const nextLevel = nextCompleted >= 5 && langProgress.level < 6
          ? langProgress.level + 1
          : langProgress.level;

        const updatedProg: LanguageProgress = {
          ...langProgress,
          quizzesCompleted: nextCompleted,
          level: nextLevel,
        };
        await saveLanguageProgress(updatedProg);
        setLangProgress(updatedProg);
        setLangSuccess(true);
      } catch (err) {
        setProblems([err instanceof Error ? err.message : "Failed to record language quest completion."]);
      } finally {
        setLangSubmitting(false);
      }
    }
  };

  const handleLanguageRetry = () => {
    setLangResult(null);
    setProblems([]);
  };

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading daily quest...</p>
      </main>
    );
  }

  const alreadyDoneEnglish = Boolean(dailyState?.isDoneToday || success);
  const alreadyDoneLanguage = Boolean(langDailyState?.isDoneToday || langSuccess);

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
          <span>
            Streak:{" "}
            {activeTab === "english"
              ? dailyState?.streak.currentCount ?? 0
              : langDailyState?.streak.currentCount ?? 0}
          </span>
        </div>
      </div>

      {/* Track Tabs (shown when student qualifies for an extra language track) */}
      {targetLang && (
        <div className="grid grid-cols-2 border border-[var(--line-soft)] bg-[var(--surface-sunken)] p-1 text-center font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("english");
              setProblems([]);
            }}
            className={`py-2 font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "english"
                ? "bg-[var(--surface)] text-[var(--accent)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            English {alreadyDoneEnglish ? "✓" : ""}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("language");
              setProblems([]);
            }}
            className={`py-2 font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "language"
                ? "bg-[var(--surface)] text-[var(--accent)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {targetLang === "de" ? "German" : "Japanese"} {alreadyDoneLanguage ? "✓" : ""}
          </button>
        </div>
      )}

      {/* ==================== ENGLISH TRACK ==================== */}
      {activeTab === "english" && (
        <>
          {/* Header window */}
          <section className="window p-4">
            <div className="flex items-baseline justify-between">
              <h1 className="font-title text-base font-semibold tracking-wider uppercase text-[var(--text)]">
                Daily Quest: English
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
          {alreadyDoneEnglish ? (
            <section className="window p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#4ade80] text-[#4ade80]">
                <Check size={24} className="stroke-[2.5]" />
              </div>
              <h2 className="font-title mt-3 text-lg font-bold tracking-wide uppercase text-[var(--text)]">
                English Quest Completed
              </h2>
              <p className="mt-1 font-mono text-xs text-[#4ade80]">+20 EXP earned today</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                You completed today&apos;s English quest. Come back tomorrow after Dhaka midnight to continue your streak!
              </p>

              <div className="mt-4 border-t border-[var(--line-soft)] pt-3 font-mono text-xs text-[var(--muted)] flex justify-between">
                <span>Streak: {dailyState?.streak.currentCount ?? 1} days</span>
                <span>Freezes left: {dailyState?.streak.freezesLeft ?? 2}</span>
              </div>

              {targetLang && !alreadyDoneLanguage && (
                <div className="mt-4 border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3">
                  <p className="font-mono text-xs text-[var(--accent)]">
                    Extra Track Available: {targetLang === "de" ? "German" : "Japanese"} (+20 EXP)
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("language")}
                    className="mt-2 inline-block border border-[var(--accent)] px-3 py-1 font-mono text-xs font-semibold uppercase text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black"
                  >
                    Start Language Quest ›
                  </button>
                </div>
              )}

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
            /* English Task Form */
            <form onSubmit={handleCheckAndSubmit} className="space-y-4">
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

              {problems.length > 0 && (
                <div className="space-y-1">
                  {problems.map((p, idx) => (
                    <ErrorLine key={idx} message={p} />
                  ))}
                </div>
              )}

              <div className="pt-2">
                <PrimaryButton type="submit" disabled={submitting}>
                  {submitting ? "Checking..." : "Check & Earn 20 EXP"}
                </PrimaryButton>
              </div>
            </form>
          )}
        </>
      )}

      {/* ==================== LANGUAGE TRACK ==================== */}
      {activeTab === "language" && targetLang && (
        <>
          {/* Header window */}
          <section className="window p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider border border-[var(--accent)] px-1.5 py-0.5 text-[var(--accent)]">
                  {targetLang === "de" ? "German Track" : "Japanese Track"}
                </span>
                <h1 className="font-title mt-2 text-base font-semibold tracking-wider uppercase text-[var(--text)]">
                  Level {langProgress?.level ?? 1}: {langQuest?.title ?? "Language Basics"}
                </h1>
              </div>
              <span className="font-mono text-xs text-[var(--muted)]">{dhakaDate}</span>
            </div>

            {langQuest?.description && (
              <p className="mt-2 text-xs text-[var(--muted)]">{langQuest.description}</p>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-[var(--line-soft)] pt-2 font-mono text-xs">
              <span className="text-[var(--muted)]">
                {langQuest?.reviewedBy ? `Reviewed by ${langQuest.reviewedBy}` : "Founding Mentor Track"}
              </span>
              <span className="text-[var(--accent)]">Reward: +20 EXP</span>
            </div>
          </section>

          {/* Already completed language quest */}
          {alreadyDoneLanguage ? (
            <section className="window p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#4ade80] text-[#4ade80]">
                <Check size={24} className="stroke-[2.5]" />
              </div>
              <h2 className="font-title mt-3 text-lg font-bold tracking-wide uppercase text-[var(--text)]">
                {targetLang === "de" ? "German" : "Japanese"} Quest Completed
              </h2>
              <p className="mt-1 font-mono text-xs text-[#4ade80]">+20 EXP earned today</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Excellent progress! You have completed today&apos;s language practice.
              </p>

              <div className="mt-4 border-t border-[var(--line-soft)] pt-3 font-mono text-xs text-[var(--muted)] flex justify-between">
                <span>Streak: {langDailyState?.streak.currentCount ?? 1} days</span>
                <span>Level {langProgress?.level ?? 1} ({langProgress?.quizzesCompleted ?? 0}/5 quizzes)</span>
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
          ) : langQuest ? (
            /* Language Quiz Form */
            <form onSubmit={handleLanguageSubmit} className="space-y-4">
              {/* Question list */}
              <div className="space-y-4">
                {langQuest.questions.map((q: QuizQuestion, qIdx: number) => {
                  const qResult = langResult?.results.find((r) => r.questionId === q.id);

                  return (
                    <section key={q.id} className="window p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[11px] text-[var(--muted)]">
                            Question {qIdx + 1} of 5
                          </span>
                          <h2 className="font-title mt-0.5 text-base font-semibold tracking-wide text-[var(--text)]">
                            {q.prompt}
                          </h2>
                        </div>
                        {q.soundText && (
                          <div className="shrink-0 pt-1">
                            <PronounceButton
                              text={q.soundText}
                              lang={targetLang === "de" ? "de-DE" : "ja-JP"}
                            />
                          </div>
                        )}
                      </div>

                      {q.explanation && (
                        <p className="mt-1 text-xs text-[var(--muted)]">{q.explanation}</p>
                      )}

                      {/* Options */}
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {q.options.map((opt) => {
                          const isSelected = langAnswers[q.id] === opt;
                          let borderClass = isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-semibold"
                            : "border-[var(--line-soft)] hover:border-[var(--text-soft)] text-[var(--text)]";

                          if (langResult) {
                            if (opt === q.correctAnswer) {
                              borderClass = "border-[#4ade80] bg-[#4ade80]/15 text-[#4ade80] font-semibold";
                            } else if (isSelected && !qResult?.correct) {
                              borderClass = "border-[#f87171] bg-[#f87171]/15 text-[#f87171]";
                            }
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={Boolean(langResult?.passed)}
                              onClick={() => handleSelectOption(q.id, opt)}
                              className={`flex items-center justify-between border p-2.5 text-left font-mono text-xs transition-colors ${borderClass}`}
                            >
                              <span>{opt}</span>
                              {isSelected && <span className="font-mono text-[10px]">●</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback if marked */}
                      {langResult && qResult && (
                        <div className="mt-2.5 border-t border-[var(--line-soft)] pt-2 font-mono text-[11px]">
                          {qResult.correct ? (
                            <span className="flex items-center gap-1 text-[#4ade80]">
                              <Check size={13} />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#f87171]">
                              <XCircle size={13} />
                              <span>Expected: {qResult.expected}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              {/* Quiz Feedback Result Banner */}
              {langResult && !langResult.passed && (
                <div className="border border-[#f87171]/40 bg-[#f87171]/10 p-3">
                  <div className="flex items-center justify-between font-mono text-xs font-semibold text-[#f87171]">
                    <span>Quiz Needs 80% to Pass (4 of 5 correct)</span>
                    <span>{langResult.score} / {langResult.total} Correct</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Review the correct answers above and click &quot;Try Again&quot; to practice and earn your +20 EXP.
                  </p>
                </div>
              )}

              {problems.length > 0 && (
                <div className="space-y-1">
                  {problems.map((p, idx) => (
                    <ErrorLine key={idx} message={p} />
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {langResult && !langResult.passed ? (
                  <button
                    type="button"
                    onClick={handleLanguageRetry}
                    className="flex w-full items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)]/10 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent)]/20"
                  >
                    <RotateCcw size={14} />
                    <span>Try Again</span>
                  </button>
                ) : (
                  <PrimaryButton type="submit" disabled={langSubmitting}>
                    {langSubmitting ? "Submitting..." : "Submit Quiz & Earn 20 EXP"}
                  </PrimaryButton>
                )}
              </div>
            </form>
          ) : (
            <div className="window p-6 text-center">
              <p className="font-mono text-xs text-[var(--muted)]">
                Language track content is currently being reviewed by Founding Mentors.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
