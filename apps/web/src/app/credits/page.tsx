import Link from "next/link";
import { Flag } from "@/components/Flag";
import { COUNTRY_OPTIONS } from "@/lib/options";
import { DESTINATION_PHOTOS } from "@/lib/photos";

export const metadata = { title: "Credits · Dreamer" };

export default function Credits() {
  const name = (cc: string) => COUNTRY_OPTIONS.find((c) => c.code === cc)?.name ?? cc;
  const rows = Object.entries(DESTINATION_PHOTOS).sort(([a], [b]) => name(a).localeCompare(name(b)));

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-12">
      <div className="font-mono mb-5 text-[11px]">
        <Link href="/" className="text-[var(--accent)]">
          ← BACK
        </Link>
      </div>
      <h1 className="window-title mb-4">Credits</h1>

      <p className="text-sm text-[var(--muted)]">
        Destination photos are from{" "}
        <a href="https://commons.wikimedia.org" className="text-[var(--accent)]" target="_blank" rel="noreferrer">
          Wikimedia Commons
        </a>
        , shown darkened and tinted. Thank you to the photographers.
      </p>

      <ul className="mt-4 divide-y divide-[var(--line-soft)]">
        {rows.map(([cc, p]) => (
          <li key={cc} className="flex items-start gap-3 py-3 text-sm">
            <Flag code={cc} height={12} className="mt-1" />
            <div className="min-w-0 flex-1">
              <a href={p.source} target="_blank" rel="noreferrer" className="block hover:text-[var(--accent)]">
                {p.title.replace(/\.(jpe?g|png)$/i, "")}
              </a>
              <div className="font-mono mt-0.5 text-[11px] text-[var(--muted)]">
                {p.artist} ·{" "}
                {p.licenseUrl ? (
                  <a href={p.licenseUrl} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">
                    {p.license}
                  </a>
                ) : (
                  p.license
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="font-mono mt-8 text-[11px] tracking-widest text-[var(--muted)]">ALSO USED</h2>
      <ul className="font-mono mt-2 space-y-1 text-[11px] text-[var(--muted)]">
        <li>Flags: country-flag-icons (MIT)</li>
        <li>Icons: Lucide (ISC)</li>
        <li>Fonts: Chakra Petch, IBM Plex (SIL Open Font License)</li>
      </ul>
    </main>
  );
}
