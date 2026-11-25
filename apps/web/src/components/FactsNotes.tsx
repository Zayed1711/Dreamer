import type { RatesState } from "@/lib/rates";

/** Says how fresh the BDT conversions are, with the attribution the rate feed requires. */
export function RatesNote({ fx }: { fx: RatesState }) {
  return (
    <p className="text-[11px] font-mono text-slate-500">
      {fx.live && fx.updated ? (
        <>
          BDT figures use today&apos;s exchange rate ({new Date(fx.updated).toLocaleDateString("en-GB")}).{" "}
          <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">
            Rates by ExchangeRate-API
          </a>
        </>
      ) : (
        "BDT figures are approximate: today's exchange rate could not be loaded."
      )}
    </p>
  );
}

/** When a person last checked this record against its official source. */
export function FactsFooter({ lastChecked }: { lastChecked: string | null }) {
  return (
    <p className="mb-2 text-[10px] font-mono text-slate-500">
      {lastChecked
        ? `Checked against the official page on ${new Date(lastChecked).toLocaleDateString("en-GB")}`
        : "Not yet checked against the official page. Confirm dates and fees there before you apply."}
    </p>
  );
}
