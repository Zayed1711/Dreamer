"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStudent, moveLocalProgressToAccount } from "@/lib/store";
import { supabase, supabaseEnabled } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function handleAuth() {
      if (!supabaseEnabled || !supabase) {
        router.replace("/tracker");
        return;
      }

      try {
        // Retrieve current session after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          // Transfer any local progress to cloud account
          await moveLocalProgressToAccount();
          const { profile } = await loadStudent();
          if (alive) {
            router.replace(profile ? "/tracker" : "/onboarding");
          }
        } else {
          // Listen for auth state change if session is still settling
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (newSession && alive) {
                subscription.unsubscribe();
                await moveLocalProgressToAccount();
                const { profile } = await loadStudent();
                router.replace(profile ? "/tracker" : "/onboarding");
              }
            }
          );
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    void handleAuth();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] flex items-center justify-center p-4 font-mono text-xs">
      <div className="window p-6 border border-[#1b2b3a] bg-[#0c1219] max-w-sm w-full text-center space-y-3">
        <div className="text-[11px] uppercase tracking-widest text-[#4db5ff] font-bold">
          [WAYPOINT / AUTHENTICATION]
        </div>

        {error ? (
          <div className="space-y-3">
            <p className="text-rose-400 text-xs">{error}</p>
            <button
              onClick={() => router.replace("/signin")}
              className="px-3 py-1.5 border border-[#4db5ff] text-[#4db5ff] hover:bg-[#102030]"
            >
              RETURN TO SIGN IN
            </button>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            <div className="w-6 h-6 border-2 border-[#4db5ff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-300">Synchronizing your flight credentials...</p>
          </div>
        )}
      </div>
    </main>
  );
}
