import { defaultContent, type Journey, type Progress } from "@dreamer/journey-engine";
import { countryOfAirport, photoForAirport } from "@/lib/photos";
import { Flag } from "./Flag";
import { Plane } from "./Plane";

const STATUS: Record<Progress["flightStatus"], { text: string; color: string }> = {
  on_time: { text: "ON TIME", color: "#4ade80" },
  delayed: { text: "DELAYED", color: "#fbbf24" },
  rerouting: { text: "REROUTING", color: "#f87171" },
  holding: { text: "HOLDING", color: "#4db5ff" },
};

/** The main progress bar: the flight from the home airport to the destination, with rank stops. */
export function FlightBar({ journey, progress }: { journey: Journey; progress: Progress }) {
  const ranks = defaultContent.ranks;
  const status = STATUS[progress.flightStatus];
  const reached = ranks.findIndex((r) => r.rank === progress.rank);
  const x = (f: number) => `calc(6px + (100% - 12px) * ${f})`;
  const eta = journey.intake ? `${journey.intake.season === "fall" ? "SEP" : "JAN"} ${journey.intake.year}` : "TBD";

  const photo = photoForAirport(journey.route.to.code);

  return (
    <section className="window px-4 pt-3 pb-4">
      {/* Destination photo: greyscale, darkened and tinted System blue, so it reads as atmosphere. */}
      {photo && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static file, no optimisation needed */}
          <img
            src={photo.file}
            alt=""
            className="h-full w-full object-cover opacity-50 [filter:grayscale(1)_contrast(1.15)_brightness(0.7)]"
          />
          <div className="absolute inset-0 bg-[#0b3a66] mix-blend-color" />
          <div className="absolute inset-0 bg-[var(--window)] opacity-55" />
        </div>
      )}
      <div className="relative">
      <div className="font-mono flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span>FLIGHT DRM-{journey.intake?.year ?? "----"}</span>
        <span style={{ color: status.color }}>■ {status.text}</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-title text-4xl leading-none font-semibold tracking-wider">{journey.route.from.code}</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Flag code="BD" height={11} />
            {journey.route.from.city}
          </div>
        </div>
        <div className="font-mono pb-5 text-[11px] text-[var(--muted)]">ETA {eta}</div>
        <div className="text-right">
          <div className="font-title text-4xl leading-none font-semibold tracking-wider">{journey.route.to.code}</div>
          <div className="mt-1.5 flex items-center justify-end gap-1.5 text-xs text-[var(--muted)]">
            {journey.route.to.city}
            <Flag code={countryOfAirport(journey.route.to.code)} height={11} />
          </div>
        </div>
      </div>

      {/* route */}
      <div className="relative mt-4 h-12">
        <div className="absolute top-7 right-[6px] left-[6px] h-px bg-[var(--line)]" />
        <div
          className="absolute top-7 left-[6px] h-[2px] -translate-y-[0.5px] bg-[var(--accent)] transition-[width] duration-700"
          style={{ width: `calc((100% - 12px) * ${progress.planePosition})` }}
        />
        {ranks.map((r, i) => {
          const passed = i <= reached;
          return (
            <div key={r.rank} className="absolute top-7 -translate-x-1/2 -translate-y-1/2" style={{ left: x(i / (ranks.length - 1)) }}>
              <div
                className="mx-auto h-2 w-2 rotate-45 border"
                style={{ borderColor: passed ? r.color : "var(--line)", background: passed ? r.color : "var(--window)" }}
              />
              <div className="font-mono mt-1.5 text-center text-[10px]" style={{ color: passed ? r.color : "var(--muted)" }}>
                {r.rank}
              </div>
            </div>
          );
        })}
        <div
          className="plane absolute -top-1 transition-[left] duration-700"
          style={{ left: x(progress.planePosition) }}
          aria-label={`Plane at ${Math.round(progress.planePosition * 100)}% of the route`}
        >
          <Plane />
        </div>
      </div>

      <div className="font-mono flex justify-between text-[11px] text-[var(--muted)]">
        <span>{progress.journeyPercent}% FLOWN</span>
        {progress.nextRank && <span>NEXT STOP {progress.nextRank}-RANK</span>}
      </div>
      </div>
    </section>
  );
}
