"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorLine, PrimaryButton } from "@/components/ui";
import { normalizeBdMobile } from "@/lib/phone";
import { loadStudent, moveLocalProgressToAccount } from "@/lib/store";
import { supabase, supabaseEnabled } from "@/lib/supabase";

const RESEND_SECONDS = 60;

function friendly(message: string): string {
  if (/failed to fetch|network/i.test(message)) return "Can't reach the server. Check your internet connection and try again.";
  if (/rate|too many|security purposes/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  if (/expired|invalid/i.test(message)) return "That code is wrong or has expired. Check it, or send a new one.";
  if (/sms|provider|phone.*(disabled|not enabled)/i.test(message))
    return "Phone sign-in isn't switched on for this project yet.";
  return message;
}

export default function SignIn() {
  const router = useRouter();
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const digits = normalizeBdMobile(phoneInput);
  const phone = digits ? `+880${digits}` : null;

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function sendCode() {
    if (!supabase || !phone) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    setStage("code");
    setCode("");
    setResendIn(RESEND_SECONDS);
  }

  async function verify() {
    if (!supabase || !phone || code.length !== 6) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
    if (error) {
      setBusy(false);
      return setError(friendly(error.message));
    }
    try {
      await moveLocalProgressToAccount();
      const { profile } = await loadStudent();
      router.replace(profile ? "/" : "/onboarding");
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (!supabaseEnabled) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <section className="window window-active px-5 pt-4 pb-6 text-center">
          <h1 className="window-title">Preview mode</h1>
          <p className="mt-5 text-sm text-[var(--muted)]">
            Sign-in is not set up yet. Your progress is saved in this browser only.
          </p>
          <Link href="/" className="mt-6 block">
            <PrimaryButton>Continue</PrimaryButton>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <section className="window window-active px-5 pt-4 pb-6">
        <h1 className="window-title">Sign in</h1>

        {stage === "phone" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <p className="font-title mt-5 text-xl font-semibold tracking-wide uppercase">Your mobile number</p>
            <p className="mt-1 text-sm text-[var(--muted)]">We will text you a 6-digit code. No password needed.</p>
            <label className="mt-5 flex items-center border border-[var(--line)] bg-[var(--bg)] focus-within:border-[var(--accent)]">
              <span className="font-mono border-r border-[var(--line)] px-3 py-3 text-sm text-[var(--muted)]">+880</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="1XXXXXXXXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="font-mono w-full bg-transparent px-3 py-3 text-base tracking-wider outline-none placeholder:text-[var(--line)]"
                aria-label="Mobile number"
              />
            </label>
            {phoneInput && !digits && (
              <p className="font-mono mt-2 text-[11px] text-[var(--muted)]">Enter a Bangladeshi mobile number, like 01712345678.</p>
            )}
            <ErrorLine message={error} />
            <PrimaryButton type="submit" disabled={!digits || busy} className="mt-5">
              {busy ? "Sending…" : "Send code"}
            </PrimaryButton>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <p className="font-title mt-5 text-xl font-semibold tracking-wide uppercase">Enter the code</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Sent to <span className="font-mono text-[var(--text)]">{phone}</span>.{" "}
              <button type="button" onClick={() => setStage("phone")} className="text-[var(--accent)]">
                Change
              </button>
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="······"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="font-mono mt-5 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-center text-2xl tracking-[0.6em] outline-none focus:border-[var(--accent)]"
              aria-label="6-digit code"
              autoFocus
            />
            <ErrorLine message={error} />
            <PrimaryButton type="submit" disabled={code.length !== 6 || busy} className="mt-5">
              {busy ? "Checking…" : "Verify"}
            </PrimaryButton>
            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={() => void sendCode()}
              className="font-mono mt-4 block w-full text-center text-[11px] text-[var(--accent)] disabled:text-[var(--muted)]"
            >
              {resendIn > 0 ? `RESEND CODE IN ${resendIn}s` : "RESEND CODE"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
