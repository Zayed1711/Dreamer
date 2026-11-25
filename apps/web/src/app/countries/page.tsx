"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Lock, Search } from "lucide-react";
import { filterCountries, listCountries, type CountryInfo } from "@dreamer/journey-engine";
import { loadCountries } from "@/lib/store";
import { AirportFidsTicker } from "@/components/AirportFidsTicker";

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [tuitionFilter, setTuitionFilter] = useState<"ALL" | "LOW" | "MODERATE" | "HIGH">("ALL");
  const [blockedOnly, setBlockedOnly] = useState(false);

  useEffect(() => {
    loadCountries()
      .then((data) => {
        setCountries(data);
        setLoading(false);
      })
      .catch(() => {
        setCountries(listCountries());
        setLoading(false);
      });
  }, []);

  const regions = useMemo(() => {
    const set = new Set(countries.map((c) => c.region));
    return ["ALL", ...Array.from(set).sort()];
  }, [countries]);

  const filteredCountries = useMemo(() => {
    let result = filterCountries(countries, {
      query: searchQuery,
      region: selectedRegion === "ALL" ? undefined : selectedRegion,
      blockedAccountOnly: blockedOnly,
    });

    if (tuitionFilter === "LOW") {
      result = result.filter((c) => c.avgTuitionYearBdt.min <= 500000);
    } else if (tuitionFilter === "MODERATE") {
      result = result.filter(
        (c) => c.avgTuitionYearBdt.min > 0 && c.avgTuitionYearBdt.min <= 1500000,
      );
    } else if (tuitionFilter === "HIGH") {
      result = result.filter((c) => c.avgTuitionYearBdt.min > 1500000);
    }

    return result;
  }, [countries, searchQuery, selectedRegion, tuitionFilter, blockedOnly]);

  const formatLakh = (amount: number) => {
    if (amount === 0) return "Free";
    const lakh = (amount / 100000).toFixed(1).replace(/\.0$/, "");
    return `${lakh}L BDT`;
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
            href="/universities"
            className="text-xs font-mono text-slate-400 hover:text-[#4db5ff] border border-[#1b2b3a] px-2.5 py-1"
          >
            UNIVERSITIES
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
            18 DESTINATIONS ACTIVE
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
              Destination Country Hubs
            </h1>
            <p className="text-sm font-sans text-slate-400 mt-1 max-w-2xl">
              Authentic study-abroad intelligence for Bangladeshi students: tuition in BDT, Dhaka VFS appointment
              timelines, Sperrkonto blocked account rules, and post-study permanent residency realities.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono text-slate-400 block">Total Countries</span>
            <span className="text-3xl font-chakra font-bold text-[#4db5ff]">{countries.length}</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by country, capital, city, or top university (e.g. Munich, Tokyo, Canada)..."
              className="w-full pl-9 pr-3 py-2 bg-[#0c1219] border border-[#1b2b3a] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#4db5ff]"
            />
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedRegion("ALL");
              setTuitionFilter("ALL");
              setBlockedOnly(false);
            }}
            className="px-3 py-2 bg-[#0c1219] border border-[#1b2b3a] hover:border-[#4db5ff] text-xs font-mono text-slate-300"
          >
            RESET
          </button>
        </div>

        {/* Region & Attribute Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-500 mr-1 uppercase">Region:</span>
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
                selectedRegion === reg
                  ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                  : "border-[#1b2b3a] bg-[#0c1219] text-slate-400 hover:text-white"
              }`}
            >
              {reg === "ALL" ? "All Regions" : reg}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1b2b3a]/50">
          <span className="text-[11px] font-mono text-slate-500 mr-1 uppercase">Tuition in BDT:</span>
          {[
            { id: "ALL" as const, label: "All Tiers" },
            { id: "LOW" as const, label: "Free / Under 5L BDT" },
            { id: "MODERATE" as const, label: "5L - 15L BDT" },
            { id: "HIGH" as const, label: "15L+ BDT" },
          ].map((tier) => (
            <button
              key={tier.id}
              onClick={() => setTuitionFilter(tier.id)}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors ${
                tuitionFilter === tier.id
                  ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                  : "border-[#1b2b3a] bg-[#0c1219] text-slate-400 hover:text-white"
              }`}
            >
              {tier.label}
            </button>
          ))}

          <button
            onClick={() => setBlockedOnly(!blockedOnly)}
            className={`ml-auto px-2.5 py-1 text-xs font-mono border transition-colors flex items-center gap-1.5 ${
              blockedOnly
                ? "border-[#4db5ff] bg-[#102030] text-[#4db5ff]"
                : "border-[#1b2b3a] bg-[#0c1219] text-slate-400 hover:text-white"
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Blocked Account Required</span>
          </button>
        </div>
      </div>

      {/* Countries Grid */}
      {loading ? (
        <div className="window p-12 text-center text-xs font-mono text-slate-400 border border-[#1b2b3a]">
          Loading destination countries...
        </div>
      ) : filteredCountries.length === 0 ? (
        <div className="window p-12 text-center text-xs font-mono text-slate-400 border border-[#1b2b3a]">
          No countries match your current filters. Try resetting search or adjusting filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCountries.map((c) => {
            const tuitionText =
              c.avgTuitionYearBdt.min === 0 && c.avgTuitionYearBdt.max === 0
                ? "100% Free Public"
                : c.avgTuitionYearBdt.min === 0
                  ? `Free - ${formatLakh(c.avgTuitionYearBdt.max)} / yr`
                  : `${formatLakh(c.avgTuitionYearBdt.min)} - ${formatLakh(c.avgTuitionYearBdt.max)} / yr`;

            const livingText = `${formatLakh(c.avgMonthlyLivingBdt.min)} - ${formatLakh(c.avgMonthlyLivingBdt.max)} / mo`;

            return (
              <div
                key={c.code}
                className="window p-4 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 bg-[#102030] text-[#4db5ff] border border-[#1b2b3a]">
                          {c.code}
                        </span>
                        <h2 className="text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors">
                          {c.name}
                        </h2>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {c.region} · {c.capital}
                      </div>
                    </div>
                    {c.blockedAccountInfo.required && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        BLOCKED ACCT
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-xs font-sans text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {c.overview}
                  </p>

                  {/* Financial & Visa Snapshot */}
                  <div className="space-y-2 mb-4 p-3 bg-[#080d14] border border-[#1b2b3a]/70 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Tuition (BDT):</span>
                      <span className="text-white font-medium">{tuitionText}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Living (BDT):</span>
                      <span className="text-slate-200">{livingText}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Proof of Funds:</span>
                      <span className="text-[#4db5ff]">
                        {c.proofOfFundsBdt ? formatLakh(c.proofOfFundsBdt) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-[#1b2b3a]/50">
                      <span className="text-slate-400">Post-Study Work:</span>
                      <span className="text-emerald-400">{c.postStudyWorkYears}</span>
                    </div>
                  </div>

                  {/* Top Universities Sample */}
                  <div className="mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                      Notable Universities:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {c.topUniversities.slice(0, 2).map((uni, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-1.5 py-0.5 bg-[#102030] text-slate-300 border border-[#1b2b3a]"
                        >
                          {uni.length > 28 ? uni.substring(0, 26) + "..." : uni}
                        </span>
                      ))}
                      {c.topUniversities.length > 2 && (
                        <span className="text-[10px] font-mono px-1 text-slate-500">
                          +{c.topUniversities.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Link */}
                <Link
                  href={`/countries/${c.code.toLowerCase()}`}
                  className="mt-2 w-full py-2 px-3 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-[#05080f] border border-[#1b2b3a] hover:border-[#4db5ff] text-xs font-mono font-semibold transition-all flex items-center justify-between"
                >
                  <span>VIEW COUNTRY HUB</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Partner Spotlight */}
    </main>
  );
}
