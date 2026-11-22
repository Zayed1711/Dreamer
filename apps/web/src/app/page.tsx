"use client";

import Link from "next/link";
import {
  Compass,
  GraduationCap,
  Award,
  BookOpen,
  ShieldAlert,
  Users,
  Smartphone,
  ArrowRight,
  Plane,
  CheckCircle2,
} from "lucide-react";
import { AirportFidsTicker } from "@/components/AirportFidsTicker";
import { FloatingPartnerAd } from "@/components/FloatingPartnerAd";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#05080f] text-[#c9d4e4] flex flex-col font-sans selection:bg-[#4db5ff] selection:text-black">
      {/* Top Airport FIDS Tickerboard */}
      <AirportFidsTicker className="border-b border-[#1b2b3a]" />

      {/* Main Navigation Bar */}
      <header className="border-b border-[#1b2b3a] bg-[#070b12]/90 sticky top-0 z-30 backdrop-blur-none">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 border border-[#4db5ff] bg-[#102030] flex items-center justify-center text-[#4db5ff] font-chakra font-bold text-base group-hover:bg-[#4db5ff] group-hover:text-black transition-colors">
                W
              </div>
              <div>
                <span className="font-chakra font-bold text-lg text-white tracking-wider block leading-none">
                  WAYPOINT
                </span>
                <span className="text-[10px] font-mono text-[#4db5ff] uppercase tracking-widest block mt-0.5">
                  waypointbd.com
                </span>
              </div>
            </Link>
          </div>

          {/* Motto Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-[#1b2b3a] bg-[#0c1219] text-[11px] font-mono text-slate-400">
            <span className="text-[#4db5ff]">★</span>
            <span>&ldquo;No dream is too big and no dreamer is too small.&rdquo;</span>
            <span className="text-slate-500 text-[10px]">— Turbo</span>
          </div>

          {/* Navigation Links & Tracker CTA */}
          <nav className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/countries"
              className="text-xs font-mono text-slate-300 hover:text-[#4db5ff] px-2 py-1 transition-colors"
            >
              COUNTRIES
            </Link>
            <Link
              href="/universities"
              className="text-xs font-mono text-slate-300 hover:text-[#4db5ff] px-2 py-1 transition-colors"
            >
              UNIVERSITIES
            </Link>
            <Link
              href="/scholarships"
              className="text-xs font-mono text-slate-300 hover:text-[#4db5ff] px-2 py-1 transition-colors"
            >
              SCHOLARSHIPS
            </Link>
            <Link
              href="/tracker"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-xs font-mono font-bold transition-all shadow-sm"
            >
              <Plane className="w-3.5 h-3.5" />
              <span>TRACKER APP</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 space-y-12">
        {/* Hero Section */}
        <section className="window p-6 sm:p-10 border border-[#1b2b3a] bg-[#0c1219]">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#102030] border border-[#4db5ff]/40 text-[#4db5ff] text-xs font-mono uppercase tracking-wider">
              <span>BANGLADESH STUDY ABROAD PLATFORM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-chakra font-bold text-white tracking-wide leading-tight">
              Study Abroad Intelligence, <br className="hidden sm:inline" />
              <span className="text-[#4db5ff]">Without Agency Middlemen.</span>
            </h1>

            <p className="text-sm sm:text-base font-sans text-slate-300 leading-relaxed max-w-2xl">
              Authentic admission requirements, exact costs in BDT, embassy visa workflows, and bilateral scholarships
              curated for Bangladeshi students. Everything you need to plan your journey from Bangladesh to the world.
            </p>

            <blockquote className="border-l-2 border-[#4db5ff] pl-3 py-1 text-xs font-mono text-slate-400 italic">
              &ldquo;No dream is too big and no dreamer is too small.&rdquo;
            </blockquote>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/countries"
                className="px-4 py-2.5 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-xs font-mono font-bold transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>EXPLORE 18 COUNTRIES</span>
              </Link>
              <Link
                href="/universities"
                className="px-4 py-2.5 bg-[#070b12] hover:bg-[#102030] border border-[#1b2b3a] hover:border-slate-400 text-slate-200 text-xs font-mono transition-all flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>FIND UNIVERSITIES BY BDT BUDGET</span>
              </Link>
              <Link
                href="/scholarships"
                className="px-4 py-2.5 bg-[#070b12] hover:bg-[#102030] border border-[#1b2b3a] hover:border-slate-400 text-slate-200 text-xs font-mono transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>GOVERNMENT SCHOLARSHIPS</span>
              </Link>
            </div>
          </div>
        </section>

        {/* The 6 Core Public Intelligence Hubs */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#1b2b3a] pb-3">
            <div>
              <span className="text-[11px] font-mono text-[#4db5ff] uppercase tracking-wider block">
                [PLATFORM HUBS]
              </span>
              <h2 className="text-xl sm:text-2xl font-chakra font-bold text-white tracking-wide">
                Destination Intelligence & Free Resources
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              100% Free Public Access · Zero Agency Commission
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Hub 1: Country Hubs */}
            <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 border border-[#1b2b3a] bg-[#102030] flex items-center justify-center text-[#4db5ff]">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#1b2b3a] text-slate-400 uppercase">
                    18 DESTINATIONS
                  </span>
                </div>
                <h3 className="text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors">
                  Country Hubs & FAQs
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed">
                  Real costs in BDT, German Sperrkonto online consular portal (`digital.diplo.de`), Dhaka VFS timelines,
                  part-time work rights, and post-study work / PR realities.
                </p>
              </div>
              <Link
                href="/countries"
                className="mt-4 pt-3 border-t border-[#1b2b3a] text-xs font-mono text-[#4db5ff] flex items-center justify-between group-hover:underline"
              >
                <span>EXPLORE DESTINATIONS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 2: Universities */}
            <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 border border-[#1b2b3a] bg-[#102030] flex items-center justify-center text-emerald-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#1b2b3a] text-slate-400 uppercase">
                    CURATED INTAKES
                  </span>
                </div>
                <h3 className="text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors">
                  University Search & Timelines
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed">
                  Interactive Annual Tuition Budget in BDT filter (Low &lt;2L, Moderate 2L–15L, High 15L+), upcoming application deadlines, and direct university portal links.
                </p>
              </div>
              <Link
                href="/universities"
                className="mt-4 pt-3 border-t border-[#1b2b3a] text-xs font-mono text-emerald-400 flex items-center justify-between group-hover:underline"
              >
                <span>SEARCH UNIVERSITIES</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 3: Scholarships */}
            <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 border border-[#1b2b3a] bg-[#102030] flex items-center justify-center text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#1b2b3a] text-slate-400 uppercase">
                    18 SCHEMES
                  </span>
                </div>
                <h3 className="text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors">
                  Scholarships & Tuition Waivers
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed">
                  DAAD, Chevening, MEXT, UGC Bangladesh circular quotas, Erasmus Mundus, and graduate assistantships with funding valuations in BDT.
                </p>
              </div>
              <Link
                href="/scholarships"
                className="mt-4 pt-3 border-t border-[#1b2b3a] text-xs font-mono text-amber-400 flex items-center justify-between group-hover:underline"
              >
                <span>FIND SCHOLARSHIPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 4: IELTS Course */}
            <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 border border-[#1b2b3a] bg-[#102030] flex items-center justify-center text-[#4db5ff]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#1b2b3a] text-slate-400 uppercase">
                    12 LESSONS
                  </span>
                </div>
                <h3 className="text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors">
                  Founder&apos;s IELTS Masterclass
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed">
                  Structured video lessons, reading practice comprehension tests, and Band 8.0 strategies specifically for Bangladeshi students.
                </p>
              </div>
              <Link
                href="/course"
                className="mt-4 pt-3 border-t border-[#1b2b3a] text-xs font-mono text-[#4db5ff] flex items-center justify-between group-hover:underline"
              >
                <span>OPEN MASTERCLASS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 5: Scam Check */}
            <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 border border-[#1b2b3a] bg-[#102030] flex items-center justify-center text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#1b2b3a] text-slate-400 uppercase">
                    FREE AUDIT
                  </span>
                </div>
                <h3 className="text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors">
                  Agency Scam Shield
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed">
                  Audit agency claims, spot illegal document-holding tactics, hidden package charges, and fake scholarship guarantees before signing contracts.
                </p>
              </div>
              <Link
                href="/scam-check"
                className="mt-4 pt-3 border-t border-[#1b2b3a] text-xs font-mono text-rose-400 flex items-center justify-between group-hover:underline"
              >
                <span>AUDIT AN AGENCY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 6: Verified Mentors */}
            <div className="window p-5 border border-[#1b2b3a] bg-[#0c1219] flex flex-col justify-between hover:border-[#4db5ff] transition-all group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 border border-[#1b2b3a] bg-[#102030] flex items-center justify-center text-[#4db5ff]">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-[#1b2b3a] text-slate-400 uppercase">
                    FOUNDING ADVISORS
                  </span>
                </div>
                <h3 className="text-lg font-chakra font-bold text-white group-hover:text-[#4db5ff] transition-colors">
                  Senior Student Mentors
                </h3>
                <p className="text-xs font-sans text-slate-400 leading-relaxed">
                  Real Bangladeshi scholars enrolled across Germany, UK, USA, Japan, and Canada sharing authentic advice on CGPA hurdles, SOPs, and visa interviews.
                </p>
              </div>
              <Link
                href="/mentors"
                className="mt-4 pt-3 border-t border-[#1b2b3a] text-xs font-mono text-[#4db5ff] flex items-center justify-between group-hover:underline"
              >
                <span>VIEW MENTOR ROSTER</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Showcase Banner: The Mobile App Tracker (The Game) */}
        <section className="window p-6 sm:p-8 border-2 border-[#4db5ff] bg-[#070b12] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#4db5ff] text-black text-[10px] font-mono font-bold uppercase">
                  THE MOBILE APP
                </span>
                <span className="text-xs font-mono text-[#4db5ff]">
                  [WAYPOINT TRACKER · GAMIFIED APK]
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-chakra font-bold text-white tracking-wide">
                Track Your Flight from Dhaka to the World
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-300 leading-relaxed">
                The website gives you the intelligence — the mobile application is your daily flight tracker.
                Turn the 2-year study-abroad prep into a game: level up from E-Rank to S-Rank Dreamer, track your
                flight progress bar, build weekly streaks, master daily vocabulary and German/Japanese, and earn passport stamps.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>E → S Ranks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Flight Bar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Daily Quests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Offline Ready</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/tracker"
                className="px-5 py-3 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 text-center"
              >
                <Plane className="w-4 h-4" />
                <span>OPEN TRACKER APP</span>
              </Link>
              <a
                href="/manifest.json"
                target="_blank"
                className="px-5 py-2.5 bg-[#0c1219] hover:bg-[#102030] text-slate-300 hover:text-white border border-[#1b2b3a] text-xs font-mono transition-all flex items-center justify-center gap-2 text-center"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>PWA / APK MANIFEST</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Partner Spotlight */}
      <FloatingPartnerAd slot="student_banking" />

      {/* Footer */}
      <footer className="border-t border-[#1b2b3a] bg-[#070b12] py-8 px-4 mt-auto text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-white font-chakra font-bold text-sm tracking-wide">
                WAYPOINT · waypointbd.com
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                &ldquo;No dream is too big and no dreamer is too small.&rdquo;
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px]">
              <Link href="/countries" className="hover:text-[#4db5ff]">Countries</Link>
              <Link href="/universities" className="hover:text-[#4db5ff]">Universities</Link>
              <Link href="/scholarships" className="hover:text-[#4db5ff]">Scholarships</Link>
              <Link href="/course" className="hover:text-[#4db5ff]">IELTS</Link>
              <Link href="/scam-check" className="hover:text-[#4db5ff]">Scam Check</Link>
              <Link href="/tracker" className="hover:text-[#4db5ff] text-[#4db5ff]">Tracker App</Link>
              <Link href="/admin" className="hover:text-[#4db5ff]">Admin</Link>
            </div>
          </div>
          <div className="border-t border-[#1b2b3a]/50 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-slate-500">
            <p>
              WayPoint is an open educational intelligence platform for Bangladeshi students. Commercial partner notices are tagged [SPONSORED] and meet published standards. Free official alternatives are always provided.
            </p>
            <span className="shrink-0">© 2026 WayPoint. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
