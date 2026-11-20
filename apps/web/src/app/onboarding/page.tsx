"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  defaultContent,
  generateJourney,
  parseMonth,
  taskId,
  type Degree,
  type EnglishLevel,
  type Profile,
  type Stage,
} from "@dreamer/journey-engine";
import {
  COUNTRY_OPTIONS,
  DIVISION_OPTIONS,
  ENGLISH_OPTIONS,
  STAGE_OPTIONS,
  isHscStage,
} from "@/lib/options";
import { currentMonth } from "@/lib/student";
import { currentUserId, loadStudent, saveProfile, setTaskDone } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase";
import { monthLabel } from "@/lib/format";
import { ErrorLine, PrimaryButton } from "@/components/ui";
import { Flag } from "@/components/Flag";
import { MilestoneIcon } from "@/components/MilestoneIcon";

type Draft = {
  stage?: Stage;
  degree?: Degree;
  englishLevel?: EnglishLevel;
  country?: string | null; // null = not sure yet
  division?: string;
};

type StepKey = "welcome" | "stage" | "degree" | "english" | "country" | "division" | "summary";

/** The degree question only applies to HSC students; university students are on the master's path. */
function stepsFor(stage?: Stage): StepKey[] {
  const s: StepKey[] = ["welcome", "stage"];
  if (!stage || isHscStage(stage)) s.push("degree");
  s.push("english", "country", "division", "summary");
  return s;
}

export default function Onboarding() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState<StepKey>("welcome");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Must be signed in when Supabase is on. Editing an existing profile starts from it.
  useEffect(() => {
    (async () => {
      if (supabaseEnabled && !(await currentUserId())) {
        router.replace("/signin");
        return;
      }
      const { profile: p } = await loadStudent();
      if (p) {
        setEditing(true);
        setDraft({
          stage: p.stage,
          degree: p.degree,
          englishLevel: p.englishLevel,
          country: p.countries[0] ?? null,
          ...(p.division ? { division: p.division } : {}),
        });
        setStep("stage");
      }
    })().catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [router]);

  const steps = useMemo(() => stepsFor(draft.stage), [draft.stage]);

  const index = steps.indexOf(step);
  const questionSteps: StepKey[] = steps.filter((s) => s !== "welcome" && s !== "summary");
  const questionNo = questionSteps.indexOf(step) + 1;

  const go = (delta: number) => setStep(steps[Math.min(steps.length - 1, Math.max(0, index + delta))]!);
  const choose = (patch: Draft) => {
    const list = stepsFor(patch.stage ?? draft.stage);
    setDraft((d) => ({ ...d, ...patch }));
    // Small pause so the choice is seen before moving on.
    setTimeout(() => setStep((current) => list[Math.min(list.length - 1, list.indexOf(current) + 1)]!), 160);
  };

  const profile: Profile | null = useMemo(() => {
    if (!draft.stage || !draft.englishLevel || draft.country === undefined || !draft.division) return null;
    const degree: Degree = isHscStage(draft.stage) ? (draft.degree ?? "bachelors") : "masters";
    return {
      stage: draft.stage,
      degree,
      englishLevel: draft.englishLevel,
      countries: draft.country ? [draft.country] : [],
      division: draft.division,
    };
  }, [draft]);

  const today = useMemo(() => currentMonth(), []);
  const preview = useMemo(() => (profile ? generateJourney(profile, today) : null), [profile, today]);

  async function accept() {
    if (!profile || !preview) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile(profile, preview);
      const { completed } = await loadStudent();
      const done = new Set(completed);
      const earned = [taskId("profile_setup", "complete_profile")];
      if (profile.countries.length > 0) earned.push(taskId("profile_setup", "pick_country"));
      for (const id of earned) {
        done.add(id);
        await setTaskDone(id, true, done);
      }
      router.push("/");
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pt-5 pb-8">
      {/* top bar */}
      <div className="font-mono flex h-6 items-center justify-between text-[11px] text-[var(--muted)]">
        {index > 0 ? (
          <button type="button" onClick={() => go(-1)} className="text-[var(--accent)]">
            ← BACK
          </button>
        ) : (
          <span />
        )}
        {questionNo > 0 && (
          <span>
            STEP {questionNo}/{questionSteps.length}
          </span>
        )}
        {editing && step !== "summary" ? (
          <button type="button" onClick={() => router.push("/")} className="text-[var(--muted)]">
            CANCEL
          </button>
        ) : (
          <span />
        )}
      </div>
      {questionNo > 0 && (
        <div className="track mt-2">
          <div style={{ width: `${(questionNo / questionSteps.length) * 100}%` }} />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center py-6">
        {step === "welcome" && (
          <section className="window window-active px-5 pt-4 pb-6 text-center">
            <h1 className="window-title">Notification</h1>
            <p className="font-title mt-6 text-2xl leading-snug font-semibold uppercase">A new journey is available</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Answer five questions. We will build your year-by-year plan from today to the day you fly.
            </p>
            <div className="font-mono mt-6 text-xs text-[var(--muted)]">
              Starting rank <span className="text-[var(--text)]">E</span> · Starting level{" "}
              <span className="text-[var(--text)]">1</span>
            </div>
            <PrimaryButton onClick={() => go(1)} className="mt-6">
              Accept
            </PrimaryButton>
          </section>
        )}

        {step === "stage" && (
          <Question title="Where are you now?">
            <OptionList
              options={STAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint }))}
              selected={draft.stage}
              onSelect={(v) => choose({ stage: v as Stage })}
            />
          </Question>
        )}

        {step === "degree" && (
          <Question title="Which path?">
            <OptionList
              options={[
                { value: "bachelors", label: "Bachelor's abroad", hint: "Go abroad straight after HSC" },
                { value: "masters", label: "Master's abroad later", hint: "Bachelor's at home first, then a master's abroad" },
              ]}
              selected={draft.degree}
              onSelect={(v) => choose({ degree: v as Degree })}
            />
          </Question>
        )}

        {step === "english" && (
          <Question title="How is your English?" note="Be honest. A weaker start just adds foundation months to your plan.">
            <OptionList
              options={ENGLISH_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint }))}
              selected={draft.englishLevel}
              onSelect={(v) => choose({ englishLevel: v as EnglishLevel })}
            />
          </Question>
        )}

        {step === "country" && (
          <Question title="Where do you dream of studying?" note="You can change this any time.">
            <div className="grid grid-cols-2 gap-2">
              {COUNTRY_OPTIONS.map((c) => (
                <OptionButton key={c.code} selected={draft.country === c.code} onClick={() => choose({ country: c.code })}>
                  <span className="flex items-center gap-2.5">
                    <Flag code={c.code} height={14} />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block">{c.name}</span>
                      <span className="font-mono block text-[10px] text-[var(--muted)]">
                        {defaultContent.airports.destinations.byCountry[c.code]?.code}
                      </span>
                    </span>
                  </span>
                </OptionButton>
              ))}
            </div>
            <OptionButton selected={draft.country === null} onClick={() => choose({ country: null })} className="mt-2 w-full">
              Not sure yet
            </OptionButton>
          </Question>
        )}

        {step === "division" && (
          <Question title="Which division are you from?" note="Your flight starts from the nearest airport.">
            <div className="grid grid-cols-2 gap-2">
              {DIVISION_OPTIONS.map((d) => (
                <OptionButton key={d.value} selected={draft.division === d.value} onClick={() => choose({ division: d.value })}>
                  {d.label}
                </OptionButton>
              ))}
            </div>
          </Question>
        )}

        {step === "summary" && preview && (
          <section className="open-center window window-active px-5 pt-4 pb-6">
            <h1 className="window-title">Flight plan ready</h1>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="font-title text-4xl font-semibold tracking-wider">{preview.route.from.code}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Flag code="BD" height={11} />
                  {preview.route.from.city}
                </div>
              </div>
              <div className="font-mono pb-5 text-[11px] text-[var(--muted)]">
                {preview.intake ? `ETA ${preview.intake.season === "fall" ? "SEP" : "JAN"} ${preview.intake.year}` : "ETA LATER"}
              </div>
              <div className="text-right">
                <div className="font-title text-4xl font-semibold tracking-wider">{preview.route.to.code}</div>
                <div className="mt-1 flex items-center justify-end gap-1.5 text-xs text-[var(--muted)]">
                  {preview.route.to.city}
                  <Flag code={profile?.countries[0]} height={11} />
                </div>
              </div>
            </div>

            <dl className="font-mono mt-5 grid grid-cols-3 gap-3 border-y border-[var(--line-soft)] py-3 text-center">
              <div>
                <dt className="text-[10px] text-[var(--muted)]">MILESTONES</dt>
                <dd className="text-lg">{preview.items.length}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-[var(--muted)]">EXP TO EARN</dt>
                <dd className="text-lg">{preview.items.reduce((s, i) => s + i.exp, 0)}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-[var(--muted)]">GATES</dt>
                <dd className="text-lg">{defaultContent.ranks.length - 1}</dd>
              </div>
            </dl>

            {preview.feasibility.status !== "ok" && (
              <p className="mt-4 border border-[#fbbf24]/40 px-3 py-2 text-xs text-[#fbbf24]">
                {preview.feasibility.reason}
                {preview.feasibility.suggestedIntake &&
                  ` We suggest the ${preview.feasibility.suggestedIntake.season} ${preview.feasibility.suggestedIntake.year} intake.`}
              </p>
            )}

            <h2 className="font-mono mt-5 text-[11px] tracking-widest text-[var(--muted)]">FIRST QUEST</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {preview.items
                .filter((i) => parseMonth(i.start) <= parseMonth(today))
                .slice(0, 4)
                .map((i) => (
                  <li key={i.key} className="flex items-center gap-2.5">
                    <MilestoneIcon milestone={i.key} size={15} className="text-[var(--accent)]" />
                    <span className="flex-1">{i.title.en}</span>
                    <span className="font-mono text-xs text-[var(--accent)]">+{i.exp}</span>
                  </li>
                ))}
            </ul>
            <p className="font-mono mt-4 text-[11px] text-[var(--muted)]">
              Plan built for {monthLabel(today).toUpperCase()}. Profile set up: +{profile?.countries.length ? 50 : 20} EXP on
              accept.
            </p>

            <ErrorLine message={error} />
            <PrimaryButton onClick={() => void accept()} disabled={saving} className="mt-5">
              {saving ? "Saving…" : editing ? "Update my plan" : "Start my journey"}
            </PrimaryButton>
          </section>
        )}
      </div>
    </main>
  );
}

function Question({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="font-title text-2xl font-semibold tracking-wide uppercase">{title}</h1>
      {note && <p className="mt-1 text-sm text-[var(--muted)]">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function OptionList({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string; hint?: string }[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <OptionButton key={o.value} selected={selected === o.value} onClick={() => onSelect(o.value)} className="w-full">
          <span className="block">{o.label}</span>
          {o.hint && <span className="mt-0.5 block text-xs text-[var(--muted)]">{o.hint}</span>}
        </OptionButton>
      ))}
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`block border px-4 py-3 text-left text-sm transition-colors ${
        selected
          ? "window window-active border-[var(--accent)] text-[var(--accent)]"
          : "border-[var(--line)] bg-[var(--window)] hover:border-[var(--muted)]"
      } ${className}`}
    >
      {children}
    </button>
  );
}
