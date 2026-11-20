"use client";

import { useEffect, useMemo, useState } from "react";
import { generateJourney, type Journey, type Profile } from "@dreamer/journey-engine";
import { currentUserId, loadStudent } from "./store";
import { supabaseEnabled } from "./supabase";

/** The current month as "YYYY-MM". */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type State = {
  ready: boolean;
  /** Supabase is set up but nobody is signed in: send them to /signin. */
  needsSignIn: boolean;
  profile: Profile | null;
  completed: string[];
  error: string | null;
};

/** Loads the signed-in student (or the local preview student) and builds their journey. */
export function useStudent() {
  const [state, setState] = useState<State>({
    ready: false,
    needsSignIn: false,
    profile: null,
    completed: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (supabaseEnabled && !(await currentUserId())) {
          if (!cancelled) setState((s) => ({ ...s, ready: true, needsSignIn: true }));
          return;
        }
        const data = await loadStudent();
        if (!cancelled) setState({ ready: true, needsSignIn: false, ...data, error: null });
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, ready: true, error: e instanceof Error ? e.message : String(e) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => currentMonth(), []);
  const journey: Journey | null = useMemo(
    () => (state.profile ? generateJourney(state.profile, today) : null),
    [state.profile, today],
  );

  return { ...state, today, journey };
}
