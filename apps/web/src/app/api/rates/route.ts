import { NextResponse } from "next/server";
import { FALLBACK_BDT_RATES, type BdtRates } from "@dreamer/journey-engine";

// Fetched at most once a day; every visitor shares the cached copy.
export const revalidate = 86400;

const SOURCE = "https://open.er-api.com/v6/latest/BDT"; // free, no key; attribution required ("Rates by ExchangeRate-API")

export async function GET() {
  try {
    const res = await fetch(SOURCE, { next: { revalidate } });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const data = (await res.json()) as { result?: string; time_last_update_utc?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) throw new Error("rates: bad response");

    // The feed gives foreign units per 1 BDT; we keep BDT per 1 unit, only for currencies we use.
    const rates: BdtRates = { BDT: 1 };
    for (const code of Object.keys(FALLBACK_BDT_RATES)) {
      const perBdt = data.rates[code];
      if (typeof perBdt === "number" && perBdt > 0) rates[code] = 1 / perBdt;
    }
    return NextResponse.json({ rates, updated: data.time_last_update_utc ?? null, live: true });
  } catch {
    return NextResponse.json({ rates: FALLBACK_BDT_RATES, updated: null, live: false });
  }
}
