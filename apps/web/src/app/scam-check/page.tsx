"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MessageSquareWarning, ShieldAlert, ShieldCheck } from "lucide-react";
import { taskId } from "@dreamer/journey-engine";
import { PrimaryButton } from "@/components/ui";
import { FLAGS, PASS_MARK, SCENARIOS, scoreRisk, type Answer, type Risk } from "@/lib/scam";
import { setTaskDone } from "@/lib/store";
import { useStudent } from "@/lib/student";

type Mode = "menu" | "check" | "result" | "quiz" | "quizDone";

const RISK: Record<Risk, { label: string; color: string; text: string }> = {
  high: { label: "HIGH RISK", color: "#f87171", text: "Stop. Do not pay or hand over documents until every red flag below is cleared." },
  medium: { label: "MEDIUM RISK", color: "#fbbf24", text: "Be careful. Check each point below before you go further." },
  low: { label: "LOW RISK", color: "#4ade80", text: "No major red flags from your answers. Keep checking as you go." },
};

const ANSWERS: { value: Answer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

export default function ScamCheck() {
  // Works for everyone; progress is only recorded for students with a journey.
  const { profile, completed } = useStudent();
  const [mode, setMode] = useState<Mode>("menu");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [picks, setPicks] = useState<boolean[]>([]);
  const [revealed, setRevealed] = useState(false);

  // Tasks earned during this visit, so a second save includes the first (local mode saves the whole list).
  const earned = useRef<string[]>([]);

  function earn(task: string) {
    if (!profile) return;
    const id = taskId("scam_shield", task);
    if (completed.includes(id) || earned.current.includes(id)) return;
    earned.current.push(id);
    setTaskDone(id, true, [...completed, ...earned.current]).catch(() => {});
  }

  function answer(a: Answer) {
    const flag = FLAGS[step]!;
    setAnswers((prev) => ({ ...prev, [flag.id]: a }));
    if (step + 1 < FLAGS.length) setStep(step + 1);
    else {
      setMode("result");
      earn("run_check");
    }
  }

  function pick(scam: boolean) {
    setPicks((p) => [...p, scam]);
    setRevealed(true);
  }

  function nextScenario() {
    setRevealed(false);
    if (picks.length < SCENARIOS.length) return;
    setMode("quizDone");
    if (score() >= PASS_MARK) earn("spot_quiz");
  }

  const score = () => picks.filter((p, i) => p === SCENARIOS[i]!.scam).length;

  const top = (
    <div className="font-mono flex items-center justify-between text-[11px]">
      {mode === "menu" ? (
        <Link href="/" className="text-[var(--accent)]">← HOME</Link>
      ) : (
        <button type="button" onClick={() => setMode("menu")} className="text-[var(--accent)]">← SCAM CHECK</button>
      )}
      {mode === "check" && <span className="text-[var(--muted)]">QUESTION {step + 1}/{FLAGS.length}</span>}
      {mode === "quiz" && <span className="text-[var(--muted)]">MESSAGE {Math.min(picks.length + (revealed ? 0 : 1), SCENARIOS.length)}/{SCENARIOS.length}</span>}
    </div>
  );

  // ----- Menu -----
  if (mode === "menu") {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-12">
        {top}
        <h1 className="window-title">Scam check</h1>
        <p className="text-center text-sm text-[var(--muted)]">
          Most fraud happens when a student is rushed. Check before you pay anyone.
        </p>
        <button type="button" onClick={() => { setAnswers({}); setStep(0); setMode("check"); }} className="window block w-full p-4 text-left">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <ShieldAlert size={18} aria-hidden="true" />
            <span className="font-title font-semibold tracking-wide uppercase">Check an agent or offer</span>
          </div>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {FLAGS.length} quick questions. Get a risk level and what to do about each red flag.
          </p>
        </button>
        <button type="button" onClick={() => { setPicks([]); setRevealed(false); setMode("quiz"); }} className="window block w-full p-4 text-left">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <MessageSquareWarning size={18} aria-hidden="true" />
            <span className="font-title font-semibold tracking-wide uppercase">Spot the scam</span>
          </div>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {SCENARIOS.length} real-looking messages. Legit or scam? Get {PASS_MARK} right to earn the Scam Spotter stamp.
          </p>
        </button>
        <p className="text-xs text-[var(--muted)]">
          This is a guide, not a verdict on any business. Dreamer never calls an agency &ldquo;safe&rdquo;.
        </p>
      </main>
    );
  }

  // ----- Check: one question per screen -----
  if (mode === "check") {
    const flag = FLAGS[step]!;
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pt-5 pb-8">
        {top}
        <div className="track mt-2">
          <div style={{ width: `${((step + 1) / FLAGS.length) * 100}%` }} />
        </div>
        <section className="flex flex-1 flex-col justify-center py-6">
          <h1 className="font-title text-2xl leading-snug font-semibold tracking-wide">{flag.question}</h1>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {ANSWERS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => answer(a.value)}
                className={`window py-3 text-sm ${answers[flag.id] === a.value ? "window-active text-[var(--accent)]" : ""}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="font-mono mt-4 text-[11px] text-[var(--muted)]">
              ← PREVIOUS QUESTION
            </button>
          )}
        </section>
      </main>
    );
  }

  // ----- Result -----
  if (mode === "result") {
    const risk = scoreRisk(answers);
    const flagged = FLAGS.filter((f) => answers[f.id] === "yes");
    const unsure = FLAGS.filter((f) => answers[f.id] === "unsure");
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-12">
        {top}
        <section className="open-center window window-active p-5 text-center">
          <h1 className="window-title">Result</h1>
          <div className="font-title mt-4 text-3xl font-bold tracking-wider" style={{ color: RISK[risk].color }}>
            {RISK[risk].label}
          </div>
          <p className="mt-2 text-sm">{RISK[risk].text}</p>
          <p className="font-mono mt-3 text-[11px] text-[var(--muted)]">
            {flagged.length} RED FLAG{flagged.length === 1 ? "" : "S"} · {unsure.length} TO CHECK
          </p>
        </section>

        {flagged.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-mono px-1 text-[11px] tracking-widest text-[#f87171]">RED FLAGS</h2>
            {flagged.map((f) => (
              <div key={f.id} className="window p-4">
                <p className="text-sm font-medium">{f.question}</p>
                <p className="mt-1.5 text-xs text-[var(--muted)]">{f.why}</p>
                <p className="mt-1.5 text-xs"><span className="font-mono text-[var(--accent)]">DO: </span>{f.todo}</p>
              </div>
            ))}
          </section>
        )}

        {unsure.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-mono px-1 text-[11px] tracking-widest text-[#fbbf24]">FIND OUT</h2>
            {unsure.map((f) => (
              <div key={f.id} className="window p-4">
                <p className="text-sm font-medium">{f.question}</p>
                <p className="mt-1.5 text-xs"><span className="font-mono text-[var(--accent)]">DO: </span>{f.todo}</p>
              </div>
            ))}
          </section>
        )}

        <PrimaryButton onClick={() => setMode("menu")}>Done</PrimaryButton>
      </main>
    );
  }

  // ----- Quiz -----
  if (mode === "quiz") {
    const i = revealed ? picks.length - 1 : picks.length;
    const s = SCENARIOS[i]!;
    const right = revealed && picks[i] === s.scam;
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pt-5 pb-8">
        {top}
        <div className="track mt-2">
          <div style={{ width: `${((i + 1) / SCENARIOS.length) * 100}%` }} />
        </div>
        <section className="flex flex-1 flex-col justify-center py-6">
          <div className="font-mono text-[11px] text-[var(--muted)]">FROM: {s.from.toUpperCase()}</div>
          <div className="window mt-2 p-4 text-[15px] leading-relaxed">&ldquo;{s.message}&rdquo;</div>

          {!revealed ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => pick(false)} className="window py-3 text-sm">
                Legit
              </button>
              <button type="button" onClick={() => pick(true)} className="window py-3 text-sm">
                Scam
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <div className="font-title text-lg font-semibold uppercase" style={{ color: right ? "#4ade80" : "#f87171" }}>
                {right ? "Correct" : "Not quite"} · it&apos;s {s.scam ? "a scam" : "legit"}
              </div>
              <p className="mt-1 text-sm">{s.why}</p>
              <PrimaryButton onClick={nextScenario} className="mt-5">
                {picks.length < SCENARIOS.length ? "Next message" : "See my score"}
              </PrimaryButton>
            </div>
          )}
        </section>
      </main>
    );
  }

  // ----- Quiz done -----
  const total = score();
  const passed = total >= PASS_MARK;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <section className="open-center window window-active p-6 text-center">
        <h1 className="window-title">{passed ? "Stamp earned" : "Quiz over"}</h1>
        <div className="mt-5 flex justify-center" style={{ color: passed ? "#4ade80" : "var(--muted)" }}>
          <ShieldCheck size={44} strokeWidth={1.4} aria-hidden="true" />
        </div>
        <div className="font-title mt-3 text-3xl font-bold">
          {total}/{SCENARIOS.length}
        </div>
        <p className="mt-2 text-sm">
          {passed
            ? "You're a Scam Spotter. Agents will have a hard time fooling you."
            : `You need ${PASS_MARK} to earn the Scam Spotter stamp. Try again.`}
        </p>
        {passed && !profile && (
          <p className="mt-2 text-xs text-[var(--muted)]">Start your journey to keep the stamp on your profile.</p>
        )}
        <div className="mt-6 space-y-2">
          {!passed && (
            <PrimaryButton onClick={() => { setPicks([]); setRevealed(false); setMode("quiz"); }}>Try again</PrimaryButton>
          )}
          <Link href="/" className="font-mono block py-2 text-[11px] text-[var(--accent)]">
            BACK TO HOME
          </Link>
        </div>
      </section>
    </main>
  );
}
