"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Lock, ShieldCheck } from "lucide-react";
import { ErrorLine, PrimaryButton } from "@/components/ui";
import { ADVISOR_TOPICS } from "@/lib/slots";
import { submitMentorApplication } from "@/lib/store";
import { useStudent } from "@/lib/student";

const DESTINATION_COUNTRIES = [
  { code: "DE", name: "Germany (DE)" },
  { code: "JP", name: "Japan (JP)" },
  { code: "AU", name: "Australia (AU)" },
  { code: "CA", name: "Canada (CA)" },
  { code: "US", name: "United States (US)" },
  { code: "GB", name: "United Kingdom (GB)" },
  { code: "PL", name: "Poland (PL)" },
  { code: "FI", name: "Finland (FI)" },
  { code: "SE", name: "Sweden (SE)" },
  { code: "NL", name: "Netherlands (NL)" },
  { code: "MY", name: "Malaysia (MY)" },
  { code: "KR", name: "South Korea (KR)" },
];

export default function AdvisorApplyPage() {
  const router = useRouter();
  const { ready, needsSignIn, profile, error } = useStudent();

  // Form states
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [country, setCountry] = useState("DE");
  const [subject, setSubject] = useState("");
  const [intakeYear, setIntakeYear] = useState<number>(new Date().getFullYear());
  const [bio, setBio] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

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
    // Pre-populate country if student has target country
    if (profile.countries && profile.countries.length > 0) {
      setCountry(profile.countries[0]!.toUpperCase());
    }
  }, [ready, needsSignIn, profile, error, router]);

  const toggleTopic = (topicKey: string) => {
    if (selectedTopics.includes(topicKey)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicKey));
    } else {
      setSelectedTopics([...selectedTopics, topicKey]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofFile(e.target.files[0]!);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblems([]);

    if (!proofFile) {
      setProblems(["Please attach an official document proving your student or alumni status."]);
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitMentorApplication(
        {
          name: name.trim(),
          university: university.trim(),
          country: country.trim().toUpperCase(),
          subject: subject.trim(),
          intakeYear: Number(intakeYear),
          bio: bio.trim(),
          topics: selectedTopics,
          proofFileName: proofFile.name,
        },
        proofFile,
      );

      if (!res.success) {
        setProblems([res.error ?? "Failed to submit application."]);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setProblems([err instanceof Error ? err.message : "Submission failed. Please check your connection."]);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading application form...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/mentors"
          className="flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>All Mentors</span>
        </Link>
      </div>

      {submitted ? (
        <section className="window p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#4ade80] text-[#4ade80]">
            <CheckCircle size={24} />
          </div>
          <h1 className="font-title mt-3 text-lg font-bold tracking-wide uppercase text-[var(--text)]">
            Application Submitted
          </h1>
          <p className="mt-1 font-mono text-xs text-[#4ade80]">Status: Pending Admin Verification</p>

          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Thank you for volunteering to mentor prospective Bangladeshi students. Our team will verify your
            enrollment proof in our secure private storage. Once approved, your mentor card will be listed on the
            platform.
          </p>

          <div className="mt-6 border-t border-[var(--line-soft)] pt-4">
            <Link
              href="/"
              className="font-title block w-full border border-[var(--accent)] bg-[var(--accent)] py-3 text-center text-xs font-semibold tracking-widest uppercase text-black hover:opacity-90"
            >
              Return to Flight Plan
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Header */}
          <section className="window p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase border border-[var(--accent)] px-1.5 py-0.5 text-[var(--accent)]">
                  Advisor Portal
                </span>
                <h1 className="font-title mt-2 text-base font-bold tracking-wide uppercase text-[var(--text)]">
                  Apply as a Mentor
                </h1>
              </div>
              <ShieldCheck size={20} className="text-[var(--accent)]" />
            </div>

            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              Dreamer advisors are verified students and scholars studying abroad. Help juniors shortlist universities,
              review statements of purpose, and understand real student life.
            </p>
          </section>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <section className="window p-4 space-y-3">
              <h2 className="window-title mb-1 text-xs">1. Personal & University Details</h2>

              <div>
                <label className="block font-mono text-[11px] text-[var(--muted)] mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[var(--muted)] mb-1">
                  Destination Country *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                >
                  {DESTINATION_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[var(--muted)] mb-1">
                  University Name *
                </label>
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Technical University of Munich"
                  className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[var(--muted)] mb-1">
                  Subject / Major / Program *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. M.Sc. Computer Science"
                  className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[var(--muted)] mb-1">
                  Intake Year *
                </label>
                <input
                  type="number"
                  required
                  min={2000}
                  max={new Date().getFullYear() + 2}
                  value={intakeYear}
                  onChange={(e) => setIntakeYear(Number(e.target.value))}
                  className="w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[var(--muted)] mb-1">
                  Bio &amp; Journey (Min 30 characters) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students about your path, background, and what advice you can offer..."
                  className="w-full border border-[var(--line)] bg-[var(--bg)] p-2.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </section>

            {/* Advising Topics */}
            <section className="window p-4 space-y-2">
              <h2 className="window-title mb-1 text-xs">2. Advising Topics</h2>
              <p className="text-xs text-[var(--muted)] mb-2">
                Select the topics you feel confident guiding students on:
              </p>

              <div className="space-y-2">
                {Object.entries(ADVISOR_TOPICS).map(([key, label]) => {
                  const isChecked = selectedTopics.includes(key);
                  return (
                    <label
                      key={key}
                      onClick={() => toggleTopic(key)}
                      className={`flex items-center gap-2.5 border p-2.5 text-xs font-mono cursor-pointer transition-colors ${
                        isChecked
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-[var(--line-soft)] text-[var(--text)] hover:border-[var(--text-soft)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="accent-[var(--accent)]"
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Proof Document Upload */}
            <section className="window p-4 space-y-2">
              <h2 className="window-title mb-1 text-xs">3. Verification Document</h2>
              <div className="flex items-start gap-2 border border-[var(--line-soft)] bg-[var(--surface-sunken)] p-2.5 text-xs text-[var(--muted)]">
                <Lock size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <p>
                  <strong>Private &amp; Encrypted:</strong> Upload your student ID, enrollment certificate, or study visa.
                  This document is stored in a private Supabase bucket accessible only by admins and is never shown publicly.
                </p>
              </div>

              <div className="mt-3">
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="w-full border border-[var(--line)] bg-[var(--bg)] p-2 font-mono text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none file:mr-3 file:border-0 file:bg-[var(--surface-sunken)] file:px-2.5 file:py-1 file:font-mono file:text-xs file:text-[var(--text)]"
                />
                {proofFile && (
                  <p className="mt-1 font-mono text-[11px] text-[#4ade80]">
                    Attached: {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </section>

            {/* Errors */}
            {problems.length > 0 && (
              <div className="space-y-1">
                {problems.map((p, idx) => (
                  <ErrorLine key={idx} message={p} />
                ))}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? "Submitting Application..." : "Submit Application for Verification"}
              </PrimaryButton>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
