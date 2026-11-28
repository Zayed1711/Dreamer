"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { CountryInfo } from "@dreamer/journey-engine";
import { airportOf } from "./DestinationStage";

/**
 * "Good things fall into place", modelled on the coffee scroll-story reel:
 * one object per full screen, moved smoothly by scrolling (no snapping), a colour and a
 * giant faded word for each step, then the finale: the suitcase rises, is packed and closes.
 */

type Icon = CountryInfo["site"]["steps"][number]["icon"];

const OBJECTS: { icon: Icon; img: string; word: string; bg: string; fallback: { subtitle: string; description: string } }[] = [
  { icon: "passport", img: "/story/story-passport.webp", word: "Ready", bg: "#efe9df",
    fallback: { subtitle: "Your passport", description: "Valid well beyond your course, with every page in order." } },
  { icon: "ielts", img: "/story/story-ielts.webp", word: "Tested", bg: "#e6ebe3",
    fallback: { subtitle: "Your English score", description: "IELTS or an accepted alternative, at the band your programme asks for." } },
  { icon: "offer", img: "/story/story-offer.webp", word: "Admitted", bg: "#efe3df",
    fallback: { subtitle: "Your offer letter", description: "An unconditional offer, straight from the university." } },
  { icon: "solvency", img: "/story/story-funds.webp", word: "Funded", bg: "#e3e7ee",
    fallback: { subtitle: "Proof of funds", description: "Bank documents showing you can cover tuition and living costs." } },
  { icon: "visa", img: "/story/story-visa.webp", word: "Approved", bg: "#ece5d8",
    fallback: { subtitle: "Your student visa", description: "Stamped into your passport. Everything is in place." } },
];
const FINALE_BG = "#e8e3db";
const FINALE_LENGTH = 1.6; // the finale gets 1.6 screens of scrolling

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t;

/** Images still carry their studio-grey backgrounds: multiply + a soft edge mask blends them into the stage colour. */
const imageBlend: React.CSSProperties = {
  mixBlendMode: "multiply",
  maskImage: "radial-gradient(ellipse 44% 54% at 50% 52%, #000 42%, transparent 100%)",
  WebkitMaskImage: "radial-gradient(ellipse 44% 54% at 50% 52%, #000 42%, transparent 100%)",
};

function stepText(country: CountryInfo, i: number) {
  const o = OBJECTS[i]!;
  const s = country.site.steps.find((step) => step.icon === o.icon);
  return s ? { subtitle: s.subtitle, description: s.description } : o.fallback;
}

export function PackingStory({ country }: { country: CountryInfo }) {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMq);

    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      setProgress(total > 0 ? clamp(-el.getBoundingClientRect().top / total) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const headline = (
    <h2 className="text-center text-2xl leading-tight text-slate-900 sm:text-5xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
      Good things <em style={{ color: country.site.accentColor }}>fall</em> into place.
    </h2>
  );

  if (reducedMotion) return <StaticStory country={country} headline={headline} />;

  const n = OBJECTS.length;
  const s = progress * (n + FINALE_LENGTH); // position along the story, in steps
  const current = Math.min(n, Math.floor(s)); // n = finale
  const finale = clamp((s - n) / FINALE_LENGTH);
  const rise = easeOut(clamp(finale / 0.3));
  const packed = clamp((finale - 0.3) / 0.2);
  const closed = clamp((finale - 0.5) / 0.22);
  const outro = clamp((finale - 0.72) / 0.2);

  return (
    <section
      ref={ref}
      aria-label="How your journey comes together"
      style={{ height: `${(n + FINALE_LENGTH + 1) * 100}vh` }}
      className="relative"
    >
      <div
        className="sticky top-0 h-[100svh] overflow-hidden transition-colors duration-700"
        style={{ backgroundColor: current < n ? OBJECTS[current]!.bg : FINALE_BG }}
      >
        {/* Giant faded word for this step. */}
        <p
          key={current}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 animate-[wp-fade-in_600ms_ease-out] text-center text-[26vw] leading-none text-slate-900/[0.06] italic select-none sm:text-[18vw]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {current < n ? OBJECTS[current]!.word : "Yours"}
        </p>

        {/* Headline and the text for the current step. */}
        <div className="relative mx-auto max-w-xl px-4 pt-[140px] sm:max-w-3xl sm:pt-24">
          {headline}
          <div key={current} className="mt-5 min-h-[92px] animate-[wp-fade-in_500ms_ease-out] text-center">
            {current < n ? (
              <>
                <p className="text-[11px] tracking-[0.25em] text-slate-500 uppercase">
                  {String(current + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-xl text-slate-900 sm:text-2xl" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
                  {stepText(country, current).subtitle}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{stepText(country, current).description}</p>
              </>
            ) : (
              <p className="text-sm text-slate-600">Everything you need, packed for {country.name}.</p>
            )}
          </div>
        </div>

        {/* The objects: each enters, holds, then drops into the suitcase below. */}
        {OBJECTS.map((o, i) => {
          const t = s - i;
          if (t < -0.05 || t > 1.05) return null;
          const enter = easeOut(clamp(t / 0.22));
          const drop = easeIn(clamp((t - 0.68) / 0.32));
          return (
            // eslint-disable-next-line @next/next/no-img-element -- static story asset
            <img
              key={o.icon}
              src={o.img}
              alt={stepText(country, i).subtitle}
              className="pointer-events-none absolute top-[50%] left-1/2 w-[min(86vw,560px)] sm:top-[60%] sm:w-[min(44vw,420px)]"
              style={{
                ...imageBlend,
                opacity: enter * (1 - drop),
                transform: `translate(-50%, -50%) translateY(${lerp(-50, 0, enter) + drop * 34}vh) scale(${lerp(0.9, 1, enter) * lerp(1, 0.3, drop)})`,
              }}
            />
          );
        })}

        {/* The suitcase: peeks in at the bottom, then rises, fills and closes. */}
        <div
          className="pointer-events-none absolute left-1/2 w-[min(92vw,620px)]"
          style={{ top: `${lerp(80, 30, rise)}vh`, transform: `translateX(-50%) scale(${lerp(0.85, 1, rise)})` }}
        >
          <div className="relative aspect-[1600/893]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/story/suitcase-open.webp" alt="" className="absolute inset-0 h-full w-full" style={{ ...imageBlend, opacity: 1 - packed }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/story/suitcase-packed.webp" alt="" className="absolute inset-0 h-full w-full" style={{ ...imageBlend, opacity: packed * (1 - closed) }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/story/suitcase-closed.webp"
              alt={closed > 0.5 ? `A packed suitcase, ready to fly to ${airportOf(country.code).city}` : ""}
              className="absolute inset-0 h-full w-full"
              style={{ ...imageBlend, opacity: closed }}
            />
          </div>
        </div>

        {/* Outro: the luggage tag with the student's route, and the way in. */}
        <div
          className="absolute inset-x-0 bottom-[7vh] flex flex-col items-center gap-4 px-4"
          style={{ opacity: outro, transform: `translateY(${lerp(24, 0, outro)}px)`, pointerEvents: outro > 0.9 ? "auto" : "none" }}
        >
          <LuggageTag country={country} />
          <Link
            href="/tracker"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Start my journey <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* Progress dots. */}
        <div aria-hidden="true" className="absolute top-1/2 right-3 flex -translate-y-1/2 flex-col gap-2 sm:right-6">
          {[...OBJECTS.map((o) => o.icon), "finale"].map((k, i) => (
            <span key={k} className={`h-1.5 w-1.5 rounded-full transition ${i <= current ? "bg-slate-900" : "bg-slate-900/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LuggageTag({ country }: { country: CountryInfo }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#d9cdb6] bg-[#f6efe2] py-2 pr-4 pl-3 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)]">
      <span className="h-2.5 w-2.5 rounded-full border border-[#c9b896] bg-[#e8dcc4]" aria-hidden="true" />
      <span className="text-sm tracking-[0.2em] text-slate-800" style={{ fontFamily: "var(--font-mono), monospace" }}>
        DAC → {airportOf(country.code).code}
      </span>
      <span className="text-xs text-slate-500">{airportOf(country.code).city}</span>
    </div>
  );
}

/** For students who turn off motion: the same story as a calm stack. */
function StaticStory({ country, headline }: { country: CountryInfo; headline: React.ReactNode }) {
  return (
    <section aria-label="How your journey comes together" className="bg-[#efe9df] px-4 py-16">
      {headline}
      <ol className="mx-auto mt-10 max-w-xl space-y-10">
        {OBJECTS.map((o, i) => (
          <li key={o.icon} className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.img} alt="" className="mx-auto w-[min(80vw,420px)]" style={imageBlend} />
            <h3 className="text-xl text-slate-900" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
              {stepText(country, i).subtitle}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{stepText(country, i).description}</p>
          </li>
        ))}
      </ol>
      <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/story/suitcase-closed.webp" alt={`A packed suitcase, ready to fly to ${airportOf(country.code).city}`} className="w-[min(86vw,480px)]" style={imageBlend} />
        <LuggageTag country={country} />
        <Link href="/tracker" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white">
          Start my journey <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
