"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  filterScholarships,
  listScholarships,
  type ScholarshipCoverage,
  type ScholarshipItem,
} from "@dreamer/journey-engine";
import { loadScholarships } from "@/lib/store";

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [coverageType, setCoverageType] = useState<ScholarshipCoverage | "ALL">("ALL");
  const [degreeLevel, setDegreeLevel] = useState<"bachelor" | "master" | "phd" | "ALL">("ALL");
  const [myCgpa, setMyCgpa] = useState<number | null>(null);
  const [myIelts, setMyIelts] = useState<number | null>(null);
  const [showEligibility, setShowEligibility] = useState(false);

  useEffect(() => {
    loadScholarships()
      .then((data) => {
        setScholarships(data);
        setLoading(false);
      })
      .catch(() => {
        setScholarships(listScholarships());
        setLoading(false);
      });
  }, []);

  const countries = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of scholarships) {
      s.targetCountryCodes.forEach((code, idx) => {
        if (!map.has(code)) {
          map.set(code, s.targetCountryNames[idx] || code);
        }
      });
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [scholarships]);

  const filtered = useMemo(() => {
    return filterScholarships(scholarships, {
      query,
      countryCode: selectedCountry === "ALL" ? undefined : selectedCountry,
      coverageType: coverageType === "ALL" ? undefined : coverageType,
      degreeLevel: degreeLevel === "ALL" ? undefined : degreeLevel,
      studentCgpa: myCgpa ?? undefined,
      studentIelts: myIelts ?? undefined,
    });
  }, [scholarships, query, selectedCountry, coverageType, degreeLevel, myCgpa, myIelts]);

  const resetFilters = () => {
    setQuery("");
    setSelectedCountry("ALL");
    setCoverageType("ALL");
    setDegreeLevel("ALL");
    setMyCgpa(null);
    setMyIelts(null);
  };

  return (
    <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] p-3 sm:p-6 max-w-6xl mx-auto overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-[#4db5ff] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[DASHBOARD]</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/countries"
            className="text-xs font-mono text-slate-400 hover:text-[#4db5ff] border border-[#1b2b3a] px-2 py-0.5"
          >
            COUNTRIES
          </Link>
          <Link
            href="/universities"
            className="text-xs font-mono text-slate-400 hover:text-[#4db5ff] border border-[#1b2b3a] px-2 py-0.5"
          >
            UNIVERSITIES
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#4db5ff] border border-[#1b2b3a] px-2 py-0.5">
            {scholarships.length} PROGRAMS
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="window p-4 sm:p-6 mb-6 border border-[#1b2b3a] bg-[#0c1219]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#4db5ff] uppercase tracking-wider mb-1">
              [WAYPOINT / EXPLORE]
            </div>
            <h1 className="text-xl sm:text-3xl font-chakra font-bold text-white tracking-wide">
              Scholarship & Waiver Finder
            </h1>
            <p className="text-xs sm:text-sm font-sans text-slate-400 mt-1 max-w-2xl">
              Verified global funding opportunities open to Bangladeshi citizens: fully funded government fellowships,
              bilateral quotas (UGC circulars), tuition waivers, and graduate assistantships.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono text-slate-400 block">Available Programs</span>
            <span className="text-3xl font-chakra font-bold text-[#4db5ff]">{filtered.length}</span>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by scholarship, country, or benefits (DAAD, Chevening, MEXT)..."
              className="w-full pl-9 pr-3 py-2 bg-[#0c1219] border border-[#1b2b3a] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#4db5ff]"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEligibility(!showEligibility)}
              className={`flex-1 sm:flex-none px-3 py-2 border text-xs font-mono transition-colors flex items-center justify-center gap-1.5 ${
                showEligibility || myCgpa !== null || myIelts !== null
                  ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                  : "border-[#1b2b3a] bg-[#0c1219] text-slate-300 hover:border-slate-500"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showEligibility ? "HIDE PROFILE" : "MY ELIGIBILITY"}</span>
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-[#0c1219] border border-[#1b2b3a] hover:border-[#4db5ff] text-xs font-mono text-slate-300"
            >
              RESET
            </button>
          </div>
        </div>

        {/* Coverage Type Selector */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-slate-500 uppercase mr-1">Coverage:</span>
          {[
            { id: "ALL" as const, label: "All Schemes" },
            { id: "fully_funded" as const, label: "Fully Funded" },
            { id: "tuition_waiver" as const, label: "Tuition Fee Waiver" },
            { id: "partial_stipend" as const, label: "Monthly Stipend" },
          ].map((cov) => (
            <button
              key={cov.id}
              onClick={() => setCoverageType(cov.id)}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
                coverageType === cov.id
                  ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff] font-semibold"
                  : "border-[#1b2b3a] bg-[#0c1219] text-slate-400 hover:text-white"
              }`}
            >
              {cov.label}
            </button>
          ))}
        </div>

        {/* Country & Degree Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1b2b3a]/50">
          <span className="text-[11px] font-mono text-slate-500 uppercase mr-1">Destination:</span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-[#0c1219] border border-[#1b2b3a] text-xs font-mono text-white px-2.5 py-1 focus:outline-none focus:border-[#4db5ff] max-w-[200px]"
          >
            <option value="ALL">All Destinations</option>
            {countries.map(([code, name]) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>

          <span className="text-[11px] font-mono text-slate-500 uppercase sm:ml-3 mr-1">Degree:</span>
          {(["ALL", "bachelor", "master", "phd"] as const).map((deg) => (
            <button
              key={deg}
              onClick={() => setDegreeLevel(deg)}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
                degreeLevel === deg
                  ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                  : "border-[#1b2b3a] bg-[#0c1219] text-slate-400 hover:text-white"
              }`}
            >
              {deg === "ALL" ? "All Levels" : deg === "bachelor" ? "Bachelor's" : deg === "master" ? "Master's" : "PhD"}
            </button>
          ))}
        </div>

        {/* Eligibility Controls */}
        {showEligibility && (
          <div className="p-3 sm:p-4 bg-[#080d14] border border-[#1b2b3a] space-y-3">
            <div className="text-xs font-mono text-[#4db5ff] uppercase font-bold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Filter Scholarships Matching My Academic Records</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">
                  My CGPA (out of 4.00):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[2.80, 3.00, 3.25, 3.50].map((g) => (
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
                      className="text-[11px] text-slate-500 hover:text-white px-1"
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
                <div className="flex flex-wrap gap-1.5">
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
                      className="text-[11px] text-slate-500 hover:text-white px-1"
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

      {/* Results List */}
      {loading ? (
        <div className="window p-12 text-center text-xs font-mono text-slate-400 border border-[#1b2b3a]">
          Loading scholarship catalog...
        </div>
      ) : filtered.length === 0 ? (
        <div className="window p-8 sm:p-12 text-center text-xs font-mono text-slate-400 border border-[#1b2b3a] space-y-3">
          <p>No scholarship programs match your selected criteria.</p>
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
            Showing {filtered.length} {filtered.length === 1 ? "scholarship program" : "scholarship programs"}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((s) => {
              const coverageBadge =
                s.coverageType === "fully_funded"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : s.coverageType === "tuition_waiver"
                    ? "border-[#4db5ff]/40 bg-[#102030] text-[#4db5ff]"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300";

              return (
                <div
                  key={s.id}
                  className="window p-4 sm:p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group overflow-hidden"
                >
                  <div className="min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-mono text-slate-400 block truncate">
                          {s.provider}
                        </span>
                        <h2 className="text-base sm:text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors mt-0.5 break-words">
                          {s.name}
                        </h2>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase shrink-0 whitespace-nowrap ${coverageBadge}`}>
                        {s.coverageType.replace("_", " ")}
                      </span>
                    </div>

                    {/* Coverage Value in BDT */}
                    <div className="p-2.5 sm:p-3 my-3 bg-[#080d14] border border-[#1b2b3a] text-xs font-mono flex items-center justify-between">
                      <span className="text-slate-400">Award Value:</span>
                      <span className="text-emerald-400 font-bold">{s.coverageAmountBDT}</span>
                    </div>

                    {/* Key Benefits */}
                    <div className="mb-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                        Benefits Covered:
                      </span>
                      <ul className="space-y-1 text-xs font-sans text-slate-300">
                        {s.benefits.slice(0, 3).map((benefit, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-mono mt-0.5 shrink-0">✓</span>
                            <span className="break-words">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Requirements & Deadlines */}
                    <div className="mb-3 p-2.5 bg-[#102030]/30 border border-[#1b2b3a] text-xs font-mono space-y-1.5 text-slate-300">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
                        <span className="text-slate-400 shrink-0">Target Countries:</span>
                        <span className="text-white break-words sm:text-right">{s.targetCountryNames.join(", ")}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
                        <span className="text-slate-400 shrink-0">Minimum Baseline:</span>
                        <span className="text-white sm:text-right">
                          CGPA: {s.minRequirements.minCgpa ? `${s.minRequirements.minCgpa}+` : "N/A"} · IELTS:{" "}
                          {s.minRequirements.minIelts ? `${s.minRequirements.minIelts}+` : "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
                        <span className="text-slate-400 shrink-0">Application Cycle:</span>
                        <span className="text-[#4db5ff] break-words sm:text-right">
                          Opens: {s.applicationWindow.opens} · Deadline: {s.applicationWindow.deadline}
                        </span>
                      </div>
                    </div>

                    {/* Bangladesh Specific Application Guidance */}
                    {s.bdSpecificNotes && (
                      <div className="mb-4 p-2.5 bg-[#080d14] border-l-2 border-[#4db5ff] text-[11px] font-sans text-slate-400 leading-relaxed break-words">
                        <strong className="text-slate-300 font-mono block mb-0.5">
                          Bangladesh Application Route:
                        </strong>
                        {s.bdSpecificNotes}
                      </div>
                    )}
                  </div>

                  {/* Direct Official Link */}
                  <div className="pt-2 border-t border-[#1b2b3a]">
                    <a
                      href={s.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-xs font-mono font-semibold transition-all flex items-center justify-between"
                    >
                      <span>OFFICIAL APPLICATION PORTAL</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
