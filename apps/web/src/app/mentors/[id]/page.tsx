"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type AdvisorSession, type MentorProfile } from "@dreamer/journey-engine";
import { ArrowLeft, BookOpen, Calendar, CheckCircle, ExternalLink, Ticket, Users } from "lucide-react";
import { ADVISOR_TOPICS } from "@/lib/slots";
import { loadMentorById, loadSessionsForMentor } from "@/lib/store";
import { BookingPaymentModal } from "@/components/BookingPaymentModal";
import { useStudent } from "@/lib/student";

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params?.id as string | undefined;

  const { ready, needsSignIn, profile, error } = useStudent();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [sessions, setSessions] = useState<AdvisorSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AdvisorSession | null>(null);
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

    Promise.all([loadMentorById(mentorId), loadSessionsForMentor(mentorId)])
      .then(([m, sess]) => {
        setMentor(m);
        setSessions(sess);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Users size={16} />
            <h2 className="window-title mb-0 text-xs">Upcoming Advisor Sessions</h2>
          </div>
          <span className="font-mono text-[10px] text-[var(--muted)] uppercase">
            Max 25 seats
          </span>
        </div>

        {sessions.length > 0 ? (
          <div className="mt-3 space-y-2.5">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="border border-[var(--line-soft)] bg-[var(--bg-card)]/50 p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-title text-xs font-semibold uppercase">{sess.title}</h3>
                    <div className="font-mono text-[11px] text-[var(--muted)] mt-0.5">
                      {sess.durationMin} minutes · Capacity: {sess.capacity} students
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[var(--accent)] shrink-0">
                    {sess.priceBdt === 0 ? "FREE" : `${sess.priceBdt} BDT`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-soft)] pt-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-[var(--muted)] font-mono">
                    <Calendar size={12} />
                    <span>
                      {new Date(sess.startsAt).toLocaleDateString("en-GB", {
                        timeZone: "Asia/Dhaka",
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      (BST)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSession(sess)}
                    className="font-mono flex items-center gap-1 text-[11px] border border-[var(--accent)] bg-[var(--accent)]/15 px-2.5 py-1 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)] font-semibold uppercase"
                  >
                    <Ticket size={11} />
                    Book Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--muted)]">
            No live group sessions are currently scheduled for this mentor. Check back soon or request a topic through milestones.
          </p>
        )}
      </section>

      {selectedSession && (
        <BookingPaymentModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => {
            if (mentorId) {
              loadSessionsForMentor(mentorId).then(setSessions);
            }
          }}
        />
      )}
    </main>
  );
}
