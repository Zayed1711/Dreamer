import { computeProgress, generateJourney, taskId } from "../src/index";

// A student in HSC year 1 with weak English, dreaming of the UK.
const today = process.argv[2] ?? "2026-11";
const journey = generateJourney(
  { stage: "hsc1", degree: "bachelors", englishLevel: "beginner", countries: ["GB"], division: "dhaka" },
  today,
);

console.log(`Journey: ${journey.templateKey}   intake: ${journey.intake?.season} ${journey.intake?.year}`);
console.log(`Route:   ${journey.route.from.code} -> ${journey.route.to.code}   feasibility: ${journey.feasibility.status}`);
if (journey.quietWindow) console.log(`Quiet:   ${journey.quietWindow.start} to ${journey.quietWindow.end} (HSC exam)`);
console.log("");
for (const i of journey.items) {
  const flags = [i.required ? "required" : "", i.fixed ? "fixed" : "", i.rescheduled ? "moved" : ""]
    .filter(Boolean)
    .join(", ");
  console.log(`${i.start} .. ${i.end}  ${i.title.en.padEnd(36)} ${String(i.exp).padStart(4)} EXP  ${flags}`);
}

// Pretend the first milestones are done and draw the flight bar.
const done = ["profile_setup", "english_habit", "passport", "docs_folder"].flatMap((k) =>
  journey.items.find((i) => i.key === k)!.tasks.map((t) => taskId(k, t.key)),
);
const p = computeProgress(journey, done, today);
const width = 40;
const pos = Math.round(p.planePosition * width);
const bar = Array.from({ length: width + 1 }, (_, n) => (n === pos ? "✈" : n < pos ? "━" : "─")).join("");
console.log("");
console.log(`${journey.route.from.code} ●${bar}● ${journey.route.to.code}`);
console.log(`${p.rankTitle.en} · Lv. ${p.level} · ${p.exp} EXP · ${p.journeyPercent}% of journey · ${p.flightStatus}`);
