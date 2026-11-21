"use client";

import { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, ShieldCheck, Video, X } from "lucide-react";
import type { AdvisorSession, PaymentProvider } from "@dreamer/journey-engine";
import { bookSession, processPaymentSandbox } from "@/lib/store";

interface BookingPaymentModalProps {
  session: AdvisorSession;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingPaymentModal({ session, onClose, onSuccess }: BookingPaymentModalProps) {
  const [provider, setProvider] = useState<PaymentProvider>("bkash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format date in Dhaka time
  const dateFormatted = new Date(session.startsAt).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const bookRes = await bookSession(session.id);
      if (!bookRes.success || !bookRes.bookingId) {
        setError(bookRes.error || "Could not reserve seat.");
        setLoading(false);
        return;
      }

      if (session.priceBdt > 0) {
        const payRes = await processPaymentSandbox(bookRes.bookingId, provider, session.priceBdt);
        if (!payRes.success) {
          setError(payRes.error || "Payment simulation failed.");
          setLoading(false);
          return;
        }
      }

      setConfirmed(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyMeet() {
    if (session.meetUrl) {
      navigator.clipboard.writeText(session.meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
      <div className="window window-active w-full max-w-md p-5 bg-[var(--bg)] border border-[var(--line)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest text-[var(--accent)] uppercase">
              {confirmed ? "BOOKING CONFIRMED" : "RESERVE SEAT"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)]"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {confirmed ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3 border border-[#4ade80]/40 bg-[#4ade80]/10 p-3">
              <CheckCircle2 size={20} className="text-[#4ade80] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-title text-sm font-semibold tracking-wide uppercase text-[#4ade80]">
                  Seat Confirmed
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text)]">
                  Your seat for &quot;{session.title}&quot; is secured.
                </p>
              </div>
            </div>

            <div className="space-y-2 border border-[var(--line-soft)] p-3 text-xs">
              <div className="flex justify-between">
                <span className="font-mono text-[var(--muted)]">MENTOR:</span>
                <span className="font-semibold text-[var(--text)]">{session.advisorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[var(--muted)]">DATE & TIME:</span>
                <span className="font-mono text-[var(--text)]">{dateFormatted} (BST)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[var(--muted)]">DURATION:</span>
                <span className="font-mono text-[var(--text)]">{session.durationMin} min</span>
              </div>
            </div>

            {session.meetUrl && (
              <div className="border border-[var(--line)] p-3">
                <span className="font-mono text-[10px] tracking-widest text-[var(--muted)] block">
                  MEETING ACCESS LINK
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 truncate font-mono text-xs text-[var(--accent)] bg-[var(--bg-card)] border border-[var(--line-soft)] px-2.5 py-1.5">
                    {session.meetUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMeet}
                    className="flex items-center gap-1 border border-[var(--line)] px-2.5 py-1.5 text-xs hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    title="Copy Link"
                  >
                    <Copy size={13} />
                    <span className="font-mono text-[10px]">{copied ? "COPIED" : "COPY"}</span>
                  </button>
                  <a
                    href={session.meetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 border border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <Video size={13} />
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            )}

            <p className="text-[11px] text-[var(--muted)]">
              A reminder notification has been added to your dashboard flight plan.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="font-title block w-full border border-[var(--accent)] bg-[var(--accent)] py-2.5 text-center text-xs font-semibold tracking-widest text-[var(--bg)] uppercase"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <h2 className="font-title text-base font-semibold uppercase leading-snug">{session.title}</h2>
              <div className="font-mono mt-1 text-xs text-[var(--muted)]">
                Hosted by {session.advisorName} ({session.advisorUniversity}, {session.advisorCountry})
              </div>
            </div>

            <div className="space-y-1.5 border border-[var(--line-soft)] p-3 text-xs">
              <div className="flex justify-between">
                <span className="font-mono text-[var(--muted)]">TIME:</span>
                <span className="font-mono text-[var(--text)]">{dateFormatted} (BST)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[var(--muted)]">DURATION:</span>
                <span className="font-mono text-[var(--text)]">{session.durationMin} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[var(--muted)]">CAPACITY:</span>
                <span className="font-mono text-[var(--text)]">Max {session.capacity} seats</span>
              </div>
              <div className="flex justify-between border-t border-[var(--line-soft)] pt-1.5 font-semibold">
                <span className="font-mono text-[var(--accent)]">PRICE:</span>
                <span className="font-mono text-sm text-[var(--accent)]">
                  {session.priceBdt === 0 ? "FREE" : `${session.priceBdt} BDT`}
                </span>
              </div>
            </div>

            {session.priceBdt > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[10px] tracking-widest text-[var(--muted)] block">
                  SELECT PAYMENT METHOD (BANGLADESH)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["bkash", "nagad", "sslcommerz"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`border p-2 text-center text-xs font-mono uppercase tracking-wider ${
                        provider === p
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-semibold"
                          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--text)]"
                      }`}
                    >
                      {p === "sslcommerz" ? "Card / SSL" : p}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 border border-[#fbbf24]/40 bg-[#fbbf24]/10 p-2 text-[11px] text-[#fbbf24]">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>Sandbox Test Mode: No real money will be charged.</span>
                </div>
              </div>
            )}

            {error && (
              <p className="font-mono text-xs text-[#f87171] border border-[#f87171]/40 bg-[#f87171]/10 p-2">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="font-title block w-full border border-[var(--accent)] bg-[var(--accent)] py-3 text-center text-xs font-semibold tracking-widest text-[var(--bg)] uppercase disabled:opacity-50"
            >
              {loading ? "Processing..." : session.priceBdt === 0 ? "Confirm Free Seat" : `Pay ${session.priceBdt} BDT & Book Seat`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
