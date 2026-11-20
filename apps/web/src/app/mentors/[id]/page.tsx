"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type MentorProfile } from "@dreamer/journey-engine";
import { ArrowLeft, BookOpen, CheckCircle, ExternalLink, Users } from "lucide-react";
import { ADVISOR_TOPICS } from "@/lib/slots";
import { loadMentorById } from "@/lib/store";
import { useStudent } from "@/lib/student";

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params?.id as string | undefined;

  const { ready, needsSignIn, profile, error } = useStudent();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

    if (!mentorId) {
      setLoading(false);
      return;
    }

    loadMentorById(mentorId)
      .then((data) => {
        setMentor(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [ready, needsSignIn, profile, error, mentorId, router]);

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 text-center">
        <p className="font-mono text-xs text-[var(--muted)]">Loading mentor profile...</p>
      </main>
    );
  }

  if (!mentor) {
    return (
      <main className="mx-auto max-w-md space-y-4 px-4 pt-8 text-center">
        <div className="window p-6">
          <p className="font-mono text-xs text-[var(--muted)]">Mentor profile not found.</p>
          <div className="mt-4">
            <Link
              href="/mentors"
              className="inline-flex items-center gap-1 font-mono text-xs text-[var(--accent)] hover:underline"
            >
              <ArrowLeft size={14} />
              <span>Back to mentors directory</span>
            </Link>
          </div>
        </div>
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

      {/* Main Profile Window */}
      <section className="window p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase border border-[var(--line-soft)] px-1.5 py-0.5 text-[var(--muted)]">
                {mentor.country}
              </span>
              {mentor.isFounding && (
                <span className="font-mono text-[10px] uppercase border border-[#fbbf24] px-1.5 py-0.5 text-[#fbbf24]">
                  Founding Mentor
                </span>
              )}
            </div>
            <h1 className="font-title mt-2 text-lg font-bold tracking-wide uppercase text-[var(--text)]">
              {mentor.name}
            </h1>
          </div>
          <div className="flex items-center gap-1 text-[#4ade80] font-mono text-[11px]">
            <CheckCircle size={14} />
            <span>Verified</span>
          </div>
        </div>

        <div className="mt-3 border-t border-[var(--line-soft)] pt-3 font-mono text-xs space-y-1">
          <p className="text-[var(--accent)] font-semibold">{mentor.university}</p>
          <p className="text-[var(--text)]">{mentor.subject}</p>
          <p className="text-[var(--muted)]">Intake Year: {mentor.intakeYear}</p>
        </div>

        <div className="mt-4 border-t border-[var(--line-soft)] pt-3">
          <h2 className="window-title mb-1.5 text-xs">About & Journey</h2>
          <p className="text-xs leading-relaxed text-[var(--text-soft)]">
            {mentor.bio}
          </p>
        </div>
      </section>

      {/* Topics Covered */}
      <section className="window p-4">
        <h2 className="window-title mb-2 text-xs">Advising & Guidance Topics</h2>
        <div className="flex flex-wrap gap-1.5">
          {mentor.topics.map((t) => (
            <span
              key={t}
              className="font-mono text-xs bg-[var(--surface-sunken)] border border-[var(--line-soft)] px-2.5 py-1 text-[var(--text)]"
            >
              {ADVISOR_TOPICS[t] ?? t}
            </span>
          ))}
        </div>
      </section>

      {/* Content Created / Reviewed by this mentor */}
      {mentor.contentReviewed && mentor.contentReviewed.length > 0 && (
        <section className="window p-4">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <BookOpen size={16} />
            <h2 className="window-title mb-0 text-xs">Curriculum Contributions</h2>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Educational content created or verified by this mentor for the Dreamer platform:
          </p>
          <div className="mt-3 space-y-2">
            {mentor.contentReviewed.map((item, idx) => (
              <div key={idx} className="border border-[var(--line-soft)] p-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[var(--accent)] block">
                    {item.type}
                  </span>
                  <span className="font-mono text-xs text-[var(--text)] font-semibold">
                    {item.title}
                  </span>
                </div>
                {item.link && (
                  <Link
                    href={item.link}
                    className="font-mono text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Advisor Sessions */}
      <section className="window p-4">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Users size={16} />
          <h2 className="window-title mb-0 text-xs">Advisor Group Sessions</h2>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Small group interactive Q&amp;A sessions (max 25 students). No live sessions are open yet. Check back soon!
        </p>
      </section>
    </main>
  );
}
