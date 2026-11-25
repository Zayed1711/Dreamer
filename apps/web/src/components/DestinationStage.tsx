"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Flag } from "./Flag";
import type { CountryDossier } from "@/lib/destinations";
import { DESTINATION_PHOTOS } from "@/lib/photos";

/**
 * "Choose your destination", modelled on the Shopify colour-sections reel:
 * one big hero object (the country's 3D flag badge), neighbours peeking in at the sides,
 * the whole stage flooding with the country's colour, and its native name moving behind
 * like an airport ticker board.
 */
export function DestinationStage({
  countries,
  index,
  onChange,
}: {
  countries: CountryDossier[];
  index: number;
  onChange: (index: number) => void;
}) {
  const country = countries[index]!;
  const count = countries.length;
  const [dir, setDir] = useState(1); // which side the new badge slides in from
  const go = (delta: number) => {
    setDir(delta > 0 ? 1 : -1);
    onChange((index + delta + count) % count);
  };
  const dragX = useRef<number | null>(null);
  const wheelAt = useRef(0);
  const ticker = Array.from({ length: 6 }, () => country.backdropTitle).join("  •  ") + "  •  ";
  const photo = DESTINATION_PHOTOS[country.code];

  return (
    <section
      aria-label="Choose your destination"
      className="relative overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: country.accentColor, color: country.textColor }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      {/* The destination's city photo, drawn in the country's colour (luminosity blend over the flood),
          like the photo behind the tracker's flight card. */}
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- static, credited on /credits
        <img
          key={photo.file}
          src={photo.file}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full animate-[wp-fade-in_700ms_ease-out] object-cover opacity-40 [filter:contrast(1.1)]"
          style={{ mixBlendMode: "luminosity" }}
        />
      )}

      {/* Native-name ticker behind the badge. Rendered twice so the loop is seamless. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 overflow-hidden">
        <div key={country.code} className="wp-ticker flex w-max whitespace-nowrap">
          {[0, 1].map((n) => (
            <span
              key={n}
              className="pr-[2vw] text-[30vw] leading-none uppercase opacity-[0.13] sm:text-[19vw]"
              style={{ fontFamily: "var(--font-display), Impact, sans-serif" }}
            >
              {ticker}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 sm:pt-20">
        <p className="text-center text-xs font-medium tracking-[0.25em] uppercase opacity-75">Choose your destination</p>

        {/* Hero badge with its neighbours peeking in. Slide sideways (swipe, drag or trackpad) or use the arrows. */}
        <div
          className="relative mx-auto mt-8 flex h-[300px] cursor-grab touch-pan-y items-center justify-center select-none active:cursor-grabbing sm:h-[360px]"
          onPointerDown={(e) => (dragX.current = e.clientX)}
          onPointerUp={(e) => {
            const start = dragX.current;
            dragX.current = null;
            if (start != null && Math.abs(e.clientX - start) > 50) go(e.clientX < start ? 1 : -1);
          }}
          onPointerCancel={() => (dragX.current = null)}
          onWheel={(e) => {
            // Two-finger sideways scroll on a trackpad: one country per gesture.
            if (Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
            const now = Date.now();
            if (now - wheelAt.current < 600) return;
            wheelAt.current = now;
            go(e.deltaX > 0 ? 1 : -1);
          }}
        >
          {/* Neighbours are decoration; the arrows and sliding do the switching. */}
          <div aria-hidden="true" className="pointer-events-none absolute left-[-26%] scale-[0.4] opacity-35 sm:left-[6%] sm:scale-[0.55]">
            <FlagBadge code={countries[(index - 1 + count) % count]!.code} still />
          </div>

          <div key={country.code} className={dir > 0 ? "animate-[wp-slide-next_500ms_ease-out]" : "animate-[wp-slide-prev_500ms_ease-out]"}>
            <FlagBadge code={country.code} />
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute right-[-26%] scale-[0.4] opacity-35 sm:right-[6%] sm:scale-[0.55]">
            <FlagBadge code={countries[(index + 1) % count]!.code} still />
          </div>

          <div className="absolute inset-y-0 left-0 flex items-center sm:left-2">
            <ArrowButton label={`Previous: ${countries[(index - 1 + count) % count]!.name}`} onClick={() => go(-1)}>
              <ChevronLeft size={22} aria-hidden="true" />
            </ArrowButton>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center sm:right-2">
            <ArrowButton label={`Next: ${countries[(index + 1) % count]!.name}`} onClick={() => go(1)}>
              <ChevronRight size={22} aria-hidden="true" />
            </ArrowButton>
          </div>
        </div>

        {/* Name, one line of story, one line of facts. */}
        <div className="mx-auto mt-6 max-w-xl text-center" aria-live="polite">
          <h2 className="text-4xl leading-tight sm:text-6xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
            {country.name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed opacity-85 sm:text-base">{country.tagline}</p>
          <p className="mt-4 text-[11px] tracking-wider uppercase opacity-75" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {country.annualBdt} / year · {country.intake} · DAC → {country.airport}
          </p>
          <p className="mt-5 text-[11px] tracking-[0.3em] opacity-60" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {String(index + 1).padStart(2, "0")} / {count}
          </p>
        </div>
      </div>
    </section>
  );
}

function ArrowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/20 transition hover:bg-black/35"
    >
      {children}
    </button>
  );
}

/**
 * The country's flag as a tactile 3D enamel badge. Uses the generated image
 * /countries/badge-xx.webp when it exists; until then a CSS badge built from the flag SVG.
 */
function FlagBadge({ code, still = false }: { code: string; still?: boolean }) {
  const [imageMissing, setImageMissing] = useState(false);

  if (!imageMissing) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static asset, falls back to CSS if missing
      <img
        src={`/countries/badge-${code.toLowerCase()}.webp`}
        alt=""
        className={`h-64 w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)] sm:h-80 ${still ? "" : "wp-float"}`}
        onError={() => setImageMissing(true)}
        // The 404 can happen before React attaches onError (server-rendered page), so check on mount too.
        ref={(el) => {
          if (el && el.complete && el.naturalWidth === 0) setImageMissing(true);
        }}
      />
    );
  }

  return (
    <div style={{ perspective: "900px" }} aria-hidden="true">
      <div
        className={`relative rounded-t-[2.2rem] rounded-b-[45%] p-[7px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.55)] ${still ? "" : "wp-float"}`}
        style={{ background: "linear-gradient(145deg, #f6f1e6 0%, #c8bea6 45%, #efe7d6 100%)" }}
      >
        <div className="relative flex h-56 w-44 items-center justify-center overflow-hidden rounded-t-[1.8rem] rounded-b-[45%] sm:h-64 sm:w-52">
          <Flag code={code} height={260} className="!border-0" />
          {/* Enamel gloss and inner bevel. */}
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 38%)" }} />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.15),inset_0_6px_14px_rgba(255,255,255,0.25)]" />
        </div>
      </div>
    </div>
  );
}
