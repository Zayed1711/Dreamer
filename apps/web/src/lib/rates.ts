"use client";

import { useEffect, useState } from "react";
import { FALLBACK_BDT_RATES, type BdtRates } from "@dreamer/journey-engine";

export interface RatesState {
  rates: BdtRates;
  /** When the feed last updated, or null when showing the built-in approximate rates. */
  updated: string | null;
  live: boolean;
}

/** Today's BDT exchange rates from /api/rates; approximate built-in rates until (or unless) they arrive. */
export function useBdtRates(): RatesState {
  const [state, setState] = useState<RatesState>({ rates: FALLBACK_BDT_RATES, updated: null, live: false });
  useEffect(() => {
    let alive = true;
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: RatesState | null) => {
        if (alive && d?.rates) setState(d);
      })
      .catch(() => {}); // keep the approximate rates
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

export function formatBdt(n: number): string {
  return `${Math.round(n).toLocaleString("en-IN")} BDT`;
}
