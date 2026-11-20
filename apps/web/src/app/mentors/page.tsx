"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { filterMentors, type MentorProfile } from "@dreamer/journey-engine";
import { ArrowLeft, BookOpen, ChevronRight, UserCheck } from "lucide-react";
import { ADVISOR_TOPICS } from "@/lib/slots";
import { loadMentors } from "@/lib/store";
import { useStudent } from "@/lib/student";

export default function MentorsPage() {
  const router = useRouter();
  const { ready, needsSignIn, profile, error } = useStudent();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [topicFilter, setTopicFilter] = useState<string>("ALL");
  const [foundingOnly, setFoundingOnly] = useState(false);

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

    // Set initial country filter to student's primary target country if available
    if (profile.countries && profile.countries.length > 0) {
      setCountryFilter(profile.countries[0]!.toUpperCase());
    }

    loadMentors()
      .then((data) => {
        setMentors(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [ready, needsSignIn, profile, error, router]);

  // Extract unique countries from mentors
  const availableCountries = useMemo(() => {
    const set = new Set(mentors.map((m) => m.country.toUpperCase()));
    return Array.from(set).sort();
  }, [mentors]);

  // Filtered mentor list
  const filtered = useMemo(() => {
    return filterMentors(mentors, {
      country: countryFilter,
      topic: topicFilter,
      foundingOnly,
    });
  }, [mentors, countryFilter, topicFilter, foundingOnly]);

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading mentor directory...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-5 pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Flight plan</span>
        </Link>
      </div>

      {/* Header Banner */}
      <section className="window p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider uppercase border border-[var(--accent)] px-1.5 py-0.5 text-[var(--accent)]">
                Network
              </span>
              <span className="font-mono text-[11px] text-[var(--muted)]">Verified Abroad</span>
            </div>
            <h1 className="font-title mt-2 text-lg font-bold tracking-wide uppercase text-[var(--text)]">
              Dreamer Mentors
            </h1>
          </div>
          <UserCheck size={20} className="text-[var(--accent)]" />
        </div>

        <p className="mt-2 text-xs text-[var(--muted)]">
          Connect with Bangladeshi scholars and graduates abroad. Verified advisors share unbiased admissions,
          visa, and scholarship advice without agency commissions.
        </p>

        {/* Filter Bar */}
        <div className="mt-4 border-t border-[var(--line-soft)] pt-3 space-y-3 font-mono text-xs">
          {/* Country filter pills */}
          <div>
            <span className="text-[11px] text-[var(--muted)] block mb-1.5">Destination Country:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setCountryFilter("ALL")}
                className={`px-2.5 py-1 text-[11px] border transition-colors ${
                  countryFilter === "ALL"
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-semibold"
                    : "border-[var(--line-soft)] text-[var(--muted)] hover:border-[var(--text-soft)]"
                }`}
              >
                All
              </button>
              {availableCountries.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCountryFilter(c)}
                  className={`px-2.5 py-1 text-[11px] border transition-colors ${
                    countryFilter === c
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-semibold"
                      : "border-[var(--line-soft)] text-[var(--muted)] hover:border-[var(--text-soft)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Topic selector */}
          <div>
            <span className="text-[11px] text-[var(--muted)] block mb-1.5">Topic:</span>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full border border-[var(--line-soft)] bg-[var(--surface-sunken)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="ALL">All Guidance Topics</option>
              {Object.entries(ADVISOR_TOPICS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Founding Mentor filter */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="founding-filter"
              checked={foundingOnly}
              onChange={(e) => setFoundingOnly(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <label htmlFor="founding-filter" className="text-[11px] text-[var(--text-soft)] cursor-pointer">
              Show Founding Mentors only
            </label>
          </div>
        </div>
      </section>

      {/* Mentor Cards List */}
      <section className="space-y-3">
        {filtered.length === 0 ? (
          <div className="window p-6 text-center">
            <p className="font-mono text-xs text-[var(--muted)]">
              No mentors match your current filter. Try selecting &quot;All Countries&quot; or &quot;All Guidance Topics&quot;.
            </p>
          </div>
        ) : (
          filtered.map((mentor) => (
            <Link
              key={mentor.id}
              href={`/mentors/${mentor.id}`}
              className="window block p-4 transition-colors hover:border-[var(--accent)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-title text-base font-bold uppercase tracking-wide text-[var(--text)]">
                      {mentor.name}
                    </h2>
                    <span className="font-mono text-[10px] uppercase border border-[var(--line-soft)] px-1.5 py-0.5 text-[var(--muted)]">
                      {mentor.country}
                    </span>
                    {mentor.isFounding && (
                      <span className="font-mono text-[10px] uppercase border border-[#fbbf24] px-1.5 py-0.5 text-[#fbbf24]">
                        Founding Mentor
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-xs text-[var(--accent)] mt-1">
                    {mentor.university}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--muted)]">
                    {mentor.subject} · Intake {mentor.intakeYear}
                  </p>

                  <p className="text-xs text-[var(--text-soft)] mt-2 line-clamp-2 leading-relaxed">
                    {mentor.bio}
                  </p>

                  {/* Topic pills */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {mentor.topics.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[10px] bg-[var(--surface-sunken)] border border-[var(--line-soft)] px-2 py-0.5 text-[var(--muted)]"
                      >
                        {ADVISOR_TOPICS[t] ?? t}
                      </span>
                    ))}
                  </div>

                  {/* Content Reviewed Tag */}
                  {mentor.contentReviewed && mentor.contentReviewed.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-[#4ade80]">
                      <BookOpen size={12} />
                      <span>Curriculum Reviewer: {mentor.contentReviewed[0]!.title}</span>
                    </div>
                  )}
                </div>

                <ChevronRight size={16} className="text-[var(--muted)] shrink-0 mt-1" />
              </div>
            </Link>
          ))
        )}
      </section>

      {/* Apply as a mentor CTA */}
      <section className="window p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-title text-sm font-semibold uppercase text-[var(--text)]">
              Are you currently studying abroad?
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              Join the Dreamer mentor network. Guide juniors, review educational content, and host group advice sessions.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Link
            href="/advisor/apply"
            className="block w-full border border-[var(--accent)] bg-[var(--accent)]/10 py-2.5 text-center font-mono text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent)]/20"
          >
            Apply to Become an Advisor ›
          </Link>
        </div>
      </section>
    </main>
  );
}
