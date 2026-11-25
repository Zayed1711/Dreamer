"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  daysUntil,
  filterUniversities,
  formatYearlyDate,
  listUniversities,
  toBdt,
  withLiveCosts,
  type UniversityItem,
  type TuitionCategory,
} from "@dreamer/journey-engine";
import { loadUniversities } from "@/lib/store";
import { formatBdt, useBdtRates } from "@/lib/rates";
import { FactsFooter, RatesNote } from "@/components/FactsNotes";
import { AirportFidsTicker } from "@/components/AirportFidsTicker";

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [degreeLevel, setDegreeLevel] = useState<"bachelor" | "master" | "ALL">("ALL");
  const [budgetTier, setBudgetTier] = useState<TuitionCategory | "ALL">("ALL");
  const [season, setSeason] = useState<"Winter/Fall" | "Summer/Spring" | "ALL">("ALL");
  const [myCgpa, setMyCgpa] = useState<number | null>(null);
  const [myIelts, setMyIelts] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fx = useBdtRates();
  const priced = useMemo(() => withLiveCosts(universities, fx.rates), [universities, fx.rates]);

  useEffect(() => {
    loadUniversities()
      .then((data) => {
        setUniversities(data);
        setLoading(false);
      })
      .catch(() => {
        setUniversities(listUniversities());
        setLoading(false);
      });
  }, []);

  const countries = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of universities) {
      if (!map.has(u.countryCode)) {
        map.set(u.countryCode, u.countryName);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [universities]);

  const filtered = useMemo(() => {
    return filterUniversities(priced, {
      query,
      countryCode: selectedCountry === "ALL" ? undefined : selectedCountry,
      degreeLevel: degreeLevel === "ALL" ? undefined : degreeLevel,
      tuitionCategory: budgetTier === "ALL" ? undefined : budgetTier,
      season: season === "ALL" ? undefined : season,
      studentCgpa: myCgpa ?? undefined,
      studentIelts: myIelts ?? undefined,
    });
  }, [priced, query, selectedCountry, degreeLevel, budgetTier, season, myCgpa, myIelts]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCountry("ALL");
    setDegreeLevel("ALL");
    setBudgetTier("ALL");
    setSeason("ALL");
    setMyCgpa(null);
    setMyIelts(null);
  };

  return (
    <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#4db5ff] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>[WAYPOINT HOME]</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/countries"
            className="text-xs font-mono text-slate-400 hover:text-[#4db5ff] border border-[#1b2b3a] px-2.5 py-1"
          >
            COUNTRIES
          </Link>
          <Link
            href="/scholarships"
            className="text-xs font-mono text-slate-400 hover:text-[#4db5ff] border border-[#1b2b3a] px-2.5 py-1"
          >
            SCHOLARSHIPS
          </Link>
          <Link
            href="/tracker"
            className="text-xs font-mono text-[#4db5ff] border border-[#4db5ff] bg-[#102030] px-2.5 py-1 font-bold hover:bg-[#4db5ff] hover:text-black transition-colors"
          >
            TRACKER APP
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#4db5ff] border border-[#1b2b3a] px-2 py-0.5">
            {universities.length} UNIVERSITIES
          </span>
        </div>
      </div>

      {/* Airport FIDS Flight & Partner Notice Tickerboard */}
      <AirportFidsTicker className="mb-6" />

      {/* Hero Banner */}
      <section className="window p-6 mb-8 border border-[#1b2b3a] bg-[#0c1219]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#4db5ff] uppercase tracking-wider mb-1">
              [WAYPOINT / EXPLORE]
            </div>
            <h1 className="text-2xl sm:text-3xl font-chakra font-bold text-white tracking-wide">
              University Search & Application Timelines
            </h1>
            <p className="text-sm font-sans text-slate-400 mt-1 max-w-2xl">
              Targeted for Bangladeshi students: filter by BDT tuition budget, academic requirements, and upcoming intake deadlines.
              Direct links to official admissions portals with zero third-party agency middlemen.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono text-slate-400 block">Available Results</span>
            <span className="text-3xl font-chakra font-bold text-[#4db5ff]">{filtered.length}</span>
          </div>
        </div>
      </section>

      {/* Filter Center */}
      <div className="space-y-4 mb-8">
        {/* Main Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by university name, city, program, or scholarship (e.g. Informatics, Munich, Texas, DAAD)..."
              className="w-full pl-9 pr-3 py-2 bg-[#0c1219] border border-[#1b2b3a] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#4db5ff]"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 border text-xs font-mono transition-colors flex items-center gap-1.5 ${
              showAdvanced || myCgpa !== null || myIelts !== null
                ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                : "border-[#1b2b3a] bg-[#0c1219] text-slate-300 hover:border-slate-500"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? "HIDE ELIGIBILITY" : "MY ELIGIBILITY"}</span>
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-[#0c1219] border border-[#1b2b3a] hover:border-[#4db5ff] text-xs font-mono text-slate-300"
          >
            RESET
          </button>
        </div>

        {/* Founder Mandate: Budget in BDT Filter */}
        <div className="p-3 bg-[#0c1219] border border-[#1b2b3a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#4db5ff]" />
              <strong>Annual Tuition Budget in BDT:</strong>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Select student budget tier
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL" as const, label: "All Budgets" },
              { id: "low" as const, label: "Low (< 2 Lakh BDT/yr) · Free / Subsidized" },
              { id: "moderate" as const, label: "Moderate (2L - 15L BDT/yr)" },
              { id: "high" as const, label: "High (15L+ BDT/yr) · Full Tuition" },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setBudgetTier(tier.id)}
                className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                  budgetTier === tier.id
                    ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff] font-semibold"
                    : "border-[#1b2b3a] bg-[#080d14] text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Country, Degree, Intake */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase mr-1">Country:</span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-[#0c1219] border border-[#1b2b3a] text-xs font-mono text-white px-2.5 py-1 focus:outline-none focus:border-[#4db5ff]"
          >
            <option value="ALL">All Countries ({universities.length})</option>
            {countries.map(([code, name]) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>

          <span className="text-[11px] font-mono text-slate-500 uppercase ml-3 mr-1">Degree:</span>
          {(["ALL", "bachelor", "master"] as const).map((deg) => (
            <button
              key={deg}
              onClick={() => setDegreeLevel(deg)}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
                degreeLevel === deg
                  ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                  : "border-[#1b2b3a] bg-[#0c1219] text-slate-400 hover:text-white"
              }`}
            >
              {deg === "ALL" ? "All Levels" : deg === "bachelor" ? "Bachelor's" : "Master's"}
            </button>
          ))}

          <span className="text-[11px] font-mono text-slate-500 uppercase ml-3 mr-1">Intake Season:</span>
          {(["ALL", "Winter/Fall", "Summer/Spring"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
                season === s
                  ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                  : "border-[#1b2b3a] bg-[#0c1219] text-slate-400 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All Intakes" : s}
            </button>
          ))}
        </div>

        {/* Advanced Eligibility Controls (Optional) */}
        {showAdvanced && (
          <div className="p-4 bg-[#080d14] border border-[#1b2b3a] space-y-3">
            <div className="text-xs font-mono text-[#4db5ff] uppercase font-bold flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Filter Universities Matching My Academic Profile</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">
                  My Bachelor / HSC CGPA (out of 4.00):
                </label>
                <div className="flex gap-2">
                  {[2.75, 3.0, 3.25, 3.5].map((g) => (
                    <button
                      key={g}
                      onClick={() => setMyCgpa(myCgpa === g ? null : g)}
                      className={`px-2.5 py-1 border text-xs font-mono ${
                        myCgpa === g
                          ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                          : "border-[#1b2b3a] bg-[#0c1219] text-slate-400"
                      }`}
                    >
                      {g.toFixed(2)}+
                    </button>
                  ))}
                  {myCgpa !== null && (
                    <button
                      onClick={() => setMyCgpa(null)}
                      className="text-[11px] text-slate-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  My IELTS Score:
                </label>
                <div className="flex gap-2">
                  {[6.0, 6.5, 7.0].map((score) => (
                    <button
                      key={score}
                      onClick={() => setMyIelts(myIelts === score ? null : score)}
                      className={`px-2.5 py-1 border text-xs font-mono ${
                        myIelts === score
                          ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                          : "border-[#1b2b3a] bg-[#0c1219] text-slate-400"
                      }`}
                    >
                      {score.toFixed(1)}
                    </button>
                  ))}
                  {myIelts !== null && (
                    <button
                      onClick={() => setMyIelts(null)}
                      className="text-[11px] text-slate-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="window p-12 text-center text-xs font-mono text-slate-400 border border-[#1b2b3a]">
          Loading curated universities...
        </div>
      ) : filtered.length === 0 ? (
        <div className="window p-12 text-center text-xs font-mono text-slate-400 border border-[#1b2b3a] space-y-3">
          <p>No universities match your exact combination of budget, degree, and eligibility criteria.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[#102030] border border-[#4db5ff] text-[#4db5ff] text-xs font-mono"
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-500 mb-2">
            Showing {filtered.length} {filtered.length === 1 ? "institution" : "institutions"}
          </div>
          <RatesNote fx={fx} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((u) => {
              const categoryBadge =
                u.tuitionCategory === "low"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : u.tuitionCategory === "moderate"
                    ? "border-[#4db5ff]/40 bg-[#102030] text-[#4db5ff]"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300";

              return (
                <div
                  key={u.id}
                  className="window p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group"
                >
                  <div>
                    {/* Header: Country + Name + Location */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#102030] text-[#4db5ff] border border-[#1b2b3a]">
                            {u.countryCode}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {u.city}, {u.countryName}
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors mt-1">
                          {u.name}
                        </h2>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase shrink-0 ${categoryBadge}`}>
                        {u.tuitionCategory} Budget
                      </span>
                    </div>

                    {/* Tuition & Application Method Banner */}
                    <div className="p-3 my-3 bg-[#080d14] border border-[#1b2b3a] text-xs font-mono space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Tuition:</span>
                        <span className="text-white font-medium text-right">
                          {u.tuition.currency === "BDT"
                            ? `${formatBdt(u.tuition.amount)} / ${u.tuition.per}`
                            : `${u.tuition.amount.toLocaleString("en-US")} ${u.tuition.currency} / ${u.tuition.per}`}
                        </span>
                      </div>
                      {u.tuition.currency !== "BDT" && toBdt(u.tuition, fx.rates) !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">In BDT today:</span>
                          <span className="text-white font-medium">
                            ≈ {formatBdt(toBdt(u.tuition, fx.rates)! * (u.tuition.per === "semester" ? 2 : 1))} / year
                          </span>
                        </div>
                      )}
                      {u.tuition.note && <div className="text-[11px] text-slate-500">{u.tuition.note}</div>}
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Application Method:</span>
                        <span className="text-[#4db5ff] font-semibold">{u.applicationMethod}</span>
                      </div>
                    </div>

                    {/* Upcoming Intakes & Deadlines */}
                    <div className="mb-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#4db5ff]" />
                        <span>Upcoming Intake Deadlines:</span>
                      </span>
                      <div className="space-y-1 text-xs font-mono">
                        {u.intakes.map((intake, iIdx) => (
                          <div
                            key={iIdx}
                            className="flex justify-between items-center px-2 py-1 bg-[#102030]/40 border border-[#1b2b3a]/60 text-[11px]"
                          >
                            <span className="text-slate-300">{intake.season}:</span>
                            <span className="text-emerald-400 font-medium text-right">
                              Deadline: {formatYearlyDate(intake.deadline)}
                              <DaysLeft days={daysUntil(intake.deadline)} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Minimum Academic Eligibility */}
                    <div className="mb-3 text-xs font-mono flex items-center gap-3 text-slate-300">
                      <span>Min CGPA: <strong className="text-white">{u.minRequirements.minCgpa.toFixed(2)}</strong></span>
                      <span>•</span>
                      <span>Min IELTS: <strong className="text-white">{u.minRequirements.minIelts.toFixed(1)}</strong></span>
                      <span>•</span>
                      <span>GRE: <strong className="text-white">{u.minRequirements.greRequired ? "Yes" : "No"}</strong></span>
                    </div>

                    {/* Popular Programs */}
                    <div className="mb-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                        Popular Fields for Bangladeshi Students:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {u.popularPrograms.map((prog, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-[10px] font-mono px-1.5 py-0.5 bg-[#080d14] text-slate-300 border border-[#1b2b3a]"
                          >
                            {prog}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Waivers & Scholarships */}
                    {u.waiversAndScholarships.length > 0 && (
                      <div className="mb-4 p-2 bg-[#102030]/30 border border-[#4db5ff]/20 text-[11px] font-mono text-slate-300">
                        <span className="text-[#4db5ff] font-bold block mb-0.5">Waivers & Scholarships:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                          {u.waiversAndScholarships.map((waiver, wIdx) => (
                            <li key={wIdx} className="truncate">{waiver}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Direct Official Link - Anti-Agency Middlemen */}
                  <div className="pt-2 border-t border-[#1b2b3a]">
                    <FactsFooter lastChecked={u.lastChecked} />
                    <a
                      href={u.admissionsPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-xs font-mono font-semibold transition-all flex items-center justify-between"
                    >
                      <span>OFFICIAL ADMISSIONS PORTAL</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Partner Spotlight */}
    </main>
  );
}

/** Only near deadlines get a countdown; far ones would just be noise. */
function DaysLeft({ days }: { days: number | null }) {
  if (days === null || days > 60) return null;
  return <span className="ml-1 text-amber-300">· {days === 0 ? "today" : `${days} days left`}</span>;
}
