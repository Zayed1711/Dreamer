"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { ErrorLine } from "@/components/ui";
import { loadStudent, moveLocalProgressToAccount } from "@/lib/store";
import { supabase, supabaseEnabled } from "@/lib/supabase";

const RESEND_SECONDS = 60;

function friendly(message: string): string {
  if (/failed to fetch|network/i.test(message)) {
    return "Cannot reach the server. Check your internet connection and try again.";
  }
  if (/rate|too many|security purposes/i.test(message)) {
    return "Too many sign-in attempts. Please wait a minute and try again.";
  }
  if (/expired|invalid/i.test(message)) {
    return "That code is invalid or has expired. Please check your inbox or request a new code.";
  }
  if (/email.*provider.*disabled/i.test(message)) {
    return "Email sign-in is not activated for this project yet.";
  }
  if (/oauth|popup|cancelled/i.test(message)) {
    return "Google sign-in was cancelled or interrupted. Please try again.";
  }
  return message;
}

export default function SignInPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"method" | "code">("method");
  const [emailInput, setEmailInput] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const cleanEmail = emailInput.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Google 1-Click Sign-In
  async function signInWithGoogle() {
    setError(null);
    setGoogleBusy(true);

    if (!supabaseEnabled || !supabase) {
      // In local preview mode: simulate instant sign-in and redirect to tracker
      setTimeout(async () => {
        try {
          await moveLocalProgressToAccount();
          const { profile } = await loadStudent();
          router.replace(profile ? "/tracker" : "/onboarding");
        } catch {
          router.replace("/tracker");
        }
      }, 500);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (oauthError) {
        setGoogleBusy(false);
        setError(friendly(oauthError.message));
      }
    } catch (err) {
      setGoogleBusy(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // Send Email OTP Code
  async function sendEmailCode() {
    if (!isValidEmail) return;
    setBusy(true);
    setError(null);
    setDemoNotice(null);

    if (!supabaseEnabled || !supabase) {
      // Preview mode: simulate sending code
      setTimeout(() => {
        setBusy(false);
        setStage("code");
        setCode("");
        setResendIn(RESEND_SECONDS);
        setDemoNotice("Preview mode: use demo code 123456 to verify.");
      }, 400);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true },
    });

    setBusy(false);
    if (otpError) {
      return setError(friendly(otpError.message));
    }

    setStage("code");
    setCode("");
    setResendIn(RESEND_SECONDS);
  }

  // Verify 6-digit Email OTP Code
  async function verifyEmailCode() {
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);

    if (!supabaseEnabled || !supabase) {
      // Preview mode validation
      if (code !== "123456") {
        setBusy(false);
        return setError("Invalid code. Use demo code 123456 in preview mode.");
      }
      setTimeout(async () => {
        try {
          await moveLocalProgressToAccount();
          const { profile } = await loadStudent();
          router.replace(profile ? "/tracker" : "/onboarding");
        } catch {
          router.replace("/tracker");
        }
      }, 300);
      return;
    }

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: code,
      type: "email",
    });

    if (verifyErr) {
      setBusy(false);
      return setError(friendly(verifyErr.message));
    }

    try {
      await moveLocalProgressToAccount();
      const { profile } = await loadStudent();
      router.replace(profile ? "/tracker" : "/onboarding");
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] flex flex-col justify-center items-center p-4 sm:p-6 font-mono text-xs">
      <div className="w-full max-w-sm mb-4 flex items-center justify-between text-slate-400">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-[#4db5ff] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[WAYPOINT HOME]</span>
        </Link>
        <span className="text-[10px] text-[#4db5ff] uppercase tracking-wider">
          STUDENT AUTH
        </span>
      </div>

      <section className="window p-5 sm:p-6 border border-[#1b2b3a] bg-[#0c1219] w-full max-w-sm shadow-2xl space-y-5">
        <div>
          <div className="text-[10px] text-[#4db5ff] uppercase tracking-widest font-bold mb-1">
            [WAYPOINT // FLIGHT ACCESS]
          </div>
          <h1 className="text-xl sm:text-2xl font-chakra font-bold text-white tracking-wide">
            Sign In or Sign Up
          </h1>
          <p className="text-xs font-sans text-slate-400 mt-1 leading-relaxed">
            Access your personalized flight tracker, milestone checklist, and daily streak.
          </p>
        </div>

        {stage === "method" ? (
          <div className="space-y-4">
            {/* Google 1-Click Sign-In Button */}
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={googleBusy || busy}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-black text-xs font-mono font-bold transition-all flex items-center justify-center gap-2.5 border border-slate-300 active:scale-[0.99] disabled:opacity-50"
            >
              {googleBusy ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>CONTINUE WITH GOOGLE</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center border-t border-[#1b2b3a] pt-3">
              <span className="absolute bg-[#0c1219] px-2 text-[10px] text-slate-500 uppercase tracking-widest">
                OR WITH EMAIL
              </span>
            </div>

            {/* Email OTP Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendEmailCode();
              }}
              className="space-y-3 pt-2"
            >
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="student@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#070b12] border border-[#1b2b3a] text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#4db5ff]"
                    aria-label="Email address"
                    required
                  />
                </div>
              </div>

              <ErrorLine message={error} />

              <button
                type="submit"
                disabled={!isValidEmail || busy || googleBusy}
                className="w-full py-2.5 px-3 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] font-bold text-xs transition-colors disabled:opacity-50"
              >
                {busy ? "SENDING CODE…" : "SEND 6-DIGIT CODE"}
              </button>
            </form>
          </div>
        ) : (
          /* Code Verification Form */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void verifyEmailCode();
            }}
            className="space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Enter 6-Digit Code:</span>
                <button
                  type="button"
                  onClick={() => {
                    setStage("method");
                    setError(null);
                    setDemoNotice(null);
                  }}
                  className="text-[#4db5ff] text-[11px] hover:underline"
                >
                  Change Email
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 truncate">
                Sent to: <span className="text-white font-mono">{cleanEmail}</span>
              </p>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="······"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full py-2.5 px-3 bg-[#070b12] border border-[#1b2b3a] text-center text-xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-[#4db5ff]"
                aria-label="6-digit verification code"
                autoFocus
              />
            </div>

            {demoNotice && (
              <p className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/30 p-2 text-center">
                {demoNotice}
              </p>
            )}

            <ErrorLine message={error} />

            <button
              type="submit"
              disabled={code.length !== 6 || busy}
              className="w-full py-2.5 px-3 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] font-bold text-xs transition-colors disabled:opacity-50"
            >
              {busy ? "VERIFYING…" : "VERIFY & SIGN IN"}
            </button>

            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={() => void sendEmailCode()}
              className="w-full text-center text-[11px] text-slate-400 hover:text-[#4db5ff] disabled:text-slate-600 pt-1"
            >
              {resendIn > 0 ? `RESEND CODE IN ${resendIn}s` : "RESEND CODE"}
            </button>
          </form>
        )}

        {/* Security & Privacy Guarantee */}
        <div className="pt-3 border-t border-[#1b2b3a]/60 text-[10px] text-slate-500 flex items-center gap-1.5 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Zero passwords. Student privacy protected by Row-Level Security.</span>
        </div>
      </section>
    </main>
  );
}
