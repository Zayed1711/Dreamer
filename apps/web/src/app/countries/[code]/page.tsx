"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Landmark,
  ShieldAlert,
} from "lucide-react";
import {
  getCountryByCode,
  getEstimatedFirstYearCostBdt,
  listCountries,
  pickActiveAd,
  type CountryInfo,
  type Ad,
} from "@dreamer/journey-engine";
import { loadAds, loadCountryByCode, recordAdEvent } from "@/lib/store";
import { SLOTS } from "@/lib/slots";

type TabKey = "overview" | "documents" | "banking" | "universities" | "faqs";

export default function CountryDetailPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();

  const [country, setCountry] = useState<CountryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeAd, setActiveAd] = useState<Ad | null>(null);

  useEffect(() => {
    if (!code) return;

    loadCountryByCode(code)
      .then((data) => {
        setCountry(data);
        setLoading(false);
      })
      .catch(() => {
        const fallback = getCountryByCode(listCountries(), code);
        setCountry(fallback ?? null);
        setLoading(false);
      });

    // Check for matching bank sponsor ad in student_banking slot
    loadAds()
      .then((ads) => {
        const matched = pickActiveAd(ads, {
          slot: "student_banking",
          country: code,
        });
        if (matched) {
          setActiveAd(matched);
          recordAdEvent(matched.id, "view");
        }
      })
      .catch(() => {
        // Fallback silently if ads not loaded
      });
  }, [code]);

  const toggleDoc = (itemText: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [itemText]: !prev[itemText],
    }));
  };

  const cost = useMemo(() => {
    if (!country) return { min: 0, max: 0 };
    return getEstimatedFirstYearCostBdt(country);
  }, [country]);

  const formatLakh = (amount: number) => {
    if (amount === 0) return "Free";
    const lakh = (amount / 100000).toFixed(1).replace(/\.0$/, "");
    return `${lakh}L BDT`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] p-6 max-w-5xl mx-auto flex items-center justify-center">
        <div className="window p-8 border border-[#1b2b3a] text-center font-mono text-xs text-slate-400">
          Loading destination intel for [{code}]...
        </div>
      </main>
    );
  }

  if (!country) {
    return (
      <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] p-6 max-w-5xl mx-auto">
        <div className="window p-8 border border-red-900/50 bg-[#0c1219] text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h1 className="text-xl font-chakra font-bold text-white mb-2">Destination Not Found</h1>
          <p className="text-xs font-mono text-slate-400 mb-4">
            Could not locate study-abroad dossier for code &quot;{code}&quot;.
          </p>
          <Link
            href="/countries"
            className="inline-block px-4 py-2 bg-[#102030] border border-[#4db5ff] text-[#4db5ff] text-xs font-mono"
          >
            [BACK TO COUNTRIES DIRECTORY]
          </Link>
        </div>
      </main>
    );
  }

  const slotInfo = SLOTS.student_banking;

  return (
    <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Back Link & Breadcrumb */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          href="/countries"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#4db5ff] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>[ALL DESTINATIONS]</span>
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#4db5ff] border border-[#1b2b3a] px-2 py-0.5">
          {country.region} · {country.code}
        </span>
      </div>

      {/* Hero Banner */}
      <div className="window p-6 mb-6 border border-[#1b2b3a] bg-[#0c1219]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono px-2 py-0.5 bg-[#102030] text-[#4db5ff] border border-[#1b2b3a]">
                {country.code}
              </span>
              <h1 className="text-2xl sm:text-3xl font-chakra font-bold text-white tracking-wide">
                {country.name}
              </h1>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Capital: {country.capital} · Currency: {country.currency} ({country.currencySymbol}) · Exchange Rate: 1{" "}
              {country.currency} ≈ {country.bdtRate} BDT
            </p>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-[#1b2b3a] pt-3 sm:pt-0">
            <span className="text-[10px] font-mono uppercase text-slate-400">Est. 1st Year Outlay</span>
            <span className="text-xl font-chakra font-bold text-[#4db5ff]">
              {formatLakh(cost.min)} - {formatLakh(cost.max)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (5 Hubs) */}
      <div className="flex overflow-x-auto border-b border-[#1b2b3a] mb-6 gap-1 scrollbar-none">
        {[
          { key: "overview", label: "Overview & Viability", icon: Globe },
          { key: "documents", label: "Document Checklist", icon: FileText },
          { key: "banking", label: "Blocked Account & Banking", icon: Landmark },
          { key: "universities", label: "Universities & Intakes", icon: Building2 },
          { key: "faqs", label: "Dhaka Embassy & FAQs", icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? "border-[#4db5ff] text-[#4db5ff] bg-[#102030]/60 font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#0c1219]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & VIABILITY */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219]">
            <h3 className="text-xs font-mono uppercase text-[#4db5ff] tracking-wider mb-2">
              [DESTINATION BRIEF]
            </h3>
            <p className="text-sm font-sans text-slate-300 leading-relaxed">{country.overview}</p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="window p-4 border border-[#1b2b3a] bg-[#0c1219]">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Annual Tuition (BDT)</span>
              <span className="text-base font-chakra font-bold text-white mt-1 block">
                {country.avgTuitionYearBdt.min === 0
                  ? "Free - " + formatLakh(country.avgTuitionYearBdt.max)
                  : `${formatLakh(country.avgTuitionYearBdt.min)} - ${formatLakh(country.avgTuitionYearBdt.max)}`}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">Per academic year</span>
            </div>

            <div className="window p-4 border border-[#1b2b3a] bg-[#0c1219]">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Monthly Living (BDT)</span>
              <span className="text-base font-chakra font-bold text-white mt-1 block">
                {formatLakh(country.avgMonthlyLivingBdt.min)} - {formatLakh(country.avgMonthlyLivingBdt.max)}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">Rent, food & health insurance</span>
            </div>

            <div className="window p-4 border border-[#1b2b3a] bg-[#0c1219]">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Part-Time Work Limit</span>
              <span className="text-base font-chakra font-bold text-emerald-400 mt-1 block">
                {country.partTimeHoursTerm} hrs / week
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">Legal during term time</span>
            </div>

            <div className="window p-4 border border-[#1b2b3a] bg-[#0c1219]">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Post-Study Work (PSW)</span>
              <span className="text-base font-chakra font-bold text-[#4db5ff] mt-1 block">
                {country.postStudyWorkYears}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">Open graduate work permit</span>
            </div>
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="window p-4 border border-emerald-900/40 bg-[#0c1219]">
              <h4 className="text-xs font-mono uppercase text-emerald-400 font-bold mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>KEY ADVANTAGES FOR BANGLADESHI STUDENTS</span>
              </h4>
              <ul className="space-y-2 text-xs font-sans text-slate-300">
                {country.keyPros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-mono mt-0.5">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="window p-4 border border-rose-900/40 bg-[#0c1219]">
              <h4 className="text-xs font-mono uppercase text-rose-400 font-bold mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CHALLENGES & BOTTLENECKS TO PREPARE FOR</span>
              </h4>
              <ul className="space-y-2 text-xs font-sans text-slate-300">
                {country.keyCons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-mono mt-0.5">-</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* PR Pathway & Language Requirements */}
          <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219] space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-mono uppercase text-slate-400">
                  Permanent Residency (PR) Pathway
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#102030] text-[#4db5ff] border border-[#1b2b3a] uppercase">
                  Rating: {country.prPathwayRating}
                </span>
              </div>
              <p className="text-xs font-sans text-slate-300 leading-relaxed">{country.prPathwayNote}</p>
            </div>

            <div className="pt-3 border-t border-[#1b2b3a]">
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-1">
                Language Proficiency Baseline
              </h4>
              <p className="text-xs font-sans text-slate-300">{country.languageRequired}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENT CHECKLIST */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="window p-4 border border-[#1b2b3a] bg-[#0c1219] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase text-[#4db5ff] font-bold">
                Bangladeshi Student Attestation & Document Checklist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tick off requirements as you gather and attest your original papers in Dhaka.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {Object.values(checkedDocs).filter(Boolean).length} completed
            </div>
          </div>

          <div className="space-y-4">
            {country.documentsChecklist.map((section, sIdx) => (
              <div key={sIdx} className="window p-4 border border-[#1b2b3a] bg-[#0c1219]">
                <h4 className="text-xs font-mono text-white font-bold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4db5ff]"></span>
                  <span>{section.category}</span>
                </h4>
                <div className="space-y-2">
                  {section.items.map((item, iIdx) => {
                    const isChecked = !!checkedDocs[item];
                    return (
                      <button
                        key={iIdx}
                        onClick={() => toggleDoc(item)}
                        className={`w-full text-left p-2.5 border text-xs font-mono transition-colors flex items-start gap-3 ${
                          isChecked
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border-[#1b2b3a] bg-[#080d14] text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 mt-0.5 border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? "border-emerald-400 bg-emerald-400 text-black"
                              : "border-slate-600"
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={isChecked ? "line-through opacity-80" : ""}>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border border-dashed border-[#2a3847] bg-[#080d14] text-xs font-mono text-slate-400">
            <strong>Pro Tip:</strong> Always make at least 3 sets of color photocopies of every attested
            document before handing original papers over to VFS or embassy visa consular officers.
          </div>
        </div>
      )}

      {/* TAB 3: BLOCKED ACCOUNT & BANKING */}
      {activeTab === "banking" && (
        <div className="space-y-6">
          {/* Blocked Account Header Box */}
          <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#4db5ff]" />
                <h3 className="text-sm font-chakra font-bold text-white uppercase">
                  Proof of Financial Means & Banking Guidelines
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 border uppercase ${
                  country.blockedAccountInfo.required
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {country.blockedAccountInfo.required ? "Mandatory Blocked Account" : "Bank Solvency Scheme"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-3 bg-[#080d14] border border-[#1b2b3a]">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Official Account Mechanism
                </span>
                <span className="text-xs font-mono text-white font-medium block mt-0.5">
                  {country.blockedAccountInfo.providerName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Required Proof Amount in BDT
                </span>
                <span className="text-xs font-mono text-[#4db5ff] font-bold block mt-0.5">
                  {country.blockedAccountInfo.amountBDT}
                  {country.blockedAccountInfo.amountLocal
                    ? ` (${country.blockedAccountInfo.amountLocal})`
                    : ""}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs font-sans text-slate-300 leading-relaxed">
              <strong className="text-white font-mono block mb-1">
                Authorized Dealer (AD) Bank Procedure in Bangladesh:
              </strong>
              {country.blockedAccountInfo.bdBankProcedure}
            </div>
          </div>

          {/* Sponsored Ad Slot for Student Banking */}
          <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-[#4db5ff] uppercase tracking-wider">
                [SPONSORED BANKING PARTNER]
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Meets our standards as of 21 Nov 2026
              </span>
            </div>

            {activeAd ? (
              <div className="p-4 border border-[#1b2b3a] bg-[#080d14]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">{activeAd.advertiserName || "Banking Partner"}</span>
                    <h4 className="text-base font-chakra font-bold text-white">{activeAd.headline}</h4>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#102030] text-[#4db5ff] border border-[#1b2b3a]">
                    SPONSORED
                  </span>
                </div>
                <p className="text-xs font-sans text-slate-300 mb-3">{activeAd.body}</p>
                <a
                  href={activeAd.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordAdEvent(activeAd.id, "click")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-xs font-mono font-semibold transition-colors"
                >
                  <span>VISIT BANK OFFER</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="p-4 border border-[#1b2b3a] bg-[#080d14]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Eastern Bank PLC / City Bank
                    </span>
                    <h4 className="text-sm font-chakra font-bold text-white">
                      Fast-Track Student File & Outward Remittance
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#102030] text-[#4db5ff] border border-[#1b2b3a]">
                    SPONSORED
                  </span>
                </div>
                <p className="text-xs font-sans text-slate-300 mb-3">
                  Dedicated Student Banking desk with SWIFT outward remittances for German Sperrkonto
                  (Expatrio/Coracle/Fintiba) and international tuition wires.
                </p>
                <span className="text-[11px] font-mono text-slate-400 block">
                  Contact any Authorized Dealer branch in Gulshan, Dhanmondi, Motijheel, or Agrabad.
                </span>
              </div>
            )}

            {/* Free Alternative - Mandatory per AGENTS.md trust rules */}
            <div className="mt-4 p-3 border border-dashed border-[#2a3847] bg-[#080d14] text-xs font-mono text-slate-400">
              <strong className="text-white block mb-0.5">Free Public Alternative:</strong>
              You can open an official Student File at any Authorized Dealer (AD) commercial bank branch
              across Bangladesh under standard foreign exchange rules.
              {slotInfo?.free?.url && (
                <a
                  href={slotInfo.free.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4db5ff] underline ml-1 inline-flex items-center gap-0.5"
                >
                  <span>{slotInfo.free.title}</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UNIVERSITIES & INTAKES */}
      {activeTab === "universities" && (
        <div className="space-y-6">
          <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219]">
            <h3 className="text-xs font-mono uppercase text-[#4db5ff] font-bold mb-1">
              Top Ranked Universities & Institutions
            </h3>
            <p className="text-xs font-sans text-slate-400 mb-4">
              Leading universities with high Bangladeshi alumni networks and high visa issuance rates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {country.topUniversities.map((uni, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-[#1b2b3a] bg-[#080d14] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#4db5ff]" />
                    <span className="text-xs font-mono text-white font-medium">{uni}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intakes Box */}
          <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219]">
            <h3 className="text-xs font-mono uppercase text-slate-300 font-bold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4db5ff]" />
              <span>Standard Academic Intakes & Admission Deadlines</span>
            </h3>

            <div className="space-y-2">
              {country.intakeMonths.map((intake, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-[#1b2b3a] bg-[#080d14] flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-white font-medium">{intake}</span>
                  <span className="text-slate-400">Apply 4–6 months in advance</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COMMON FAQS & EMBASSY DHAKA */}
      {activeTab === "faqs" && (
        <div className="space-y-6">
          {/* Embassy Dhaka Reality Card */}
          <div className="window p-5 border border-amber-900/40 bg-[#0c1219]">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider">
                Consular & VFS Dhaka Operational Reality
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 p-3 bg-[#080d14] border border-[#1b2b3a] text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">APPOINTMENT WAITLIST</span>
                <span className="text-white font-bold">{country.embassyDhaka.waitlistMonths}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">INTERVIEW REQUIRED</span>
                <span className={country.embassyDhaka.interviewRequired ? "text-amber-400" : "text-emerald-400"}>
                  {country.embassyDhaka.interviewRequired ? "Mandatory Consular" : "Waived / Biometrics Only"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SUBMISSION LOCATION</span>
                <span className="text-slate-300 truncate block">{country.embassyDhaka.vfsLocation}</span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-[11px] font-mono text-slate-400 block mb-1">
                Dhaka Embassy Appointment Tips:
              </span>
              <ul className="space-y-1 text-xs font-sans text-slate-300">
                {country.embassyDhaka.appointmentTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#4db5ff] font-mono mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Interactive FAQs Accordion */}
          <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219]">
            <h3 className="text-xs font-mono uppercase text-[#4db5ff] font-bold mb-4">
              Frequently Asked Questions by Bangladeshi Applicants
            </h3>

            <div className="space-y-2">
              {country.commonFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-[#1b2b3a] bg-[#080d14]">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left p-3.5 flex items-center justify-between text-xs font-mono text-white hover:text-[#4db5ff] transition-colors"
                    >
                      <span className="pr-4 font-medium">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                          isOpen ? "rotate-180 text-[#4db5ff]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs font-sans text-slate-300 border-t border-[#1b2b3a]/50 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
