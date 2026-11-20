"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { ErrorLine } from "@/components/ui";
import { useStudent } from "@/lib/student";

export default function Home() {
  const router = useRouter();
  const { ready, needsSignIn, profile, journey, completed, today, error } = useStudent();

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
  if (!journey) return null;
  return <Dashboard journey={journey} today={today} initialCompleted={completed} />;
}
