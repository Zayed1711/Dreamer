"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { ErrorLine } from "@/components/ui";
import { useStudent } from "@/lib/student";

export default function TrackerPage() {
  const router = useRouter();
  const { ready, needsSignIn, profile, journey, completed, extraExp, today, error } = useStudent();

  // Signed-out students sign in first; new students go through onboarding.
  useEffect(() => {
    if (!ready || error) return;
    if (needsSignIn) router.replace("/signin");
    else if (!profile) router.replace("/onboarding");
  }, [ready, needsSignIn, profile, error, router]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 pt-10">
        <ErrorLine message={`Could not load your journey: ${error}`} />
      </main>
    );
  }

  if (!ready || !journey) {
    return (
      <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] flex items-center justify-center p-6 font-mono text-xs">
        <div className="window p-6 border border-[#1b2b3a] bg-[#0c1219] text-center space-y-2">
          <div className="text-[#4db5ff] font-bold tracking-widest">[WAYPOINT FLIGHT TRACKER]</div>
          <p className="text-slate-400">Initializing flight instruments...</p>
        </div>
      </main>
    );
  }

  return (
    <Dashboard
      journey={journey}
      today={today}
      initialCompleted={completed}
      extraExp={extraExp}
      targetCountries={profile?.countries}
      stage={profile?.stage}
    />
  );
}
