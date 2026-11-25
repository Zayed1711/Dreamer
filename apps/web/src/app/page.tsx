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
  Sparkles,
} from "lucide-react";
import { AirportFidsTicker } from "@/components/AirportFidsTicker";
import { LandingStory } from "@/components/LandingStory";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Airport FIDS Tickerboard (Clean dark ribbon) */}
      <AirportFidsTicker className="border-b border-slate-800" />

      {/* Main Navigation Bar (Clean Minimalist White) */}
      <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                W
              </div>
              <div>
                <span className="font-bold text-lg text-slate-950 tracking-tight block leading-none">
                  WAYPOINT
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">
                  waypointbd.com
                </span>
              </div>
            </Link>
          </div>

          {/* Motto Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-600 font-medium">
            <span className="text-amber-500">★</span>
            <span>&ldquo;No dream is too big and no dreamer is too small.&rdquo;</span>
            <span className="text-slate-400 text-[11px]">— Turbo</span>
          </div>

          {/* Navigation Links & Dedicated App CTA */}
          <nav className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Link
              href="/countries"
              className="text-xs font-medium text-slate-600 hover:text-slate-950 px-2 py-1 transition-colors"
            >
              Countries
            </Link>
            <Link
              href="/universities"
              className="text-xs font-medium text-slate-600 hover:text-slate-950 px-2 py-1 transition-colors"
            >
              Universities
            </Link>
            <Link
              href="/scholarships"
              className="text-xs font-medium text-slate-600 hover:text-slate-950 px-2 py-1 transition-colors"
            >
              Scholarships
            </Link>
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
            >
              <Plane className="w-3.5 h-3.5 text-amber-300" />
              <span>Open Tracker App</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full space-y-16 sm:space-y-24">
        {/* Clean Editorial Hero Section */}
        <section className="max-w-6xl mx-auto px-4 pt-10 sm:pt-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>BANGLADESH STUDY ABROAD PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-slate-950 tracking-tight leading-[1.1]">
              Study Abroad Guidance, <br />
              <span className="text-slate-500 font-serif italic font-normal">Without Agency Middlemen.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
              Authentic admission requirements, exact costs in BDT, embassy visa workflows, and bilateral scholarships
              curated for Bangladeshi students. Everything you need to plan your journey from Bangladesh to the world.
            </p>

            <blockquote className="border-l-2 border-amber-400 pl-4 py-1 text-xs text-slate-500 italic">
              &ldquo;No dream is too big and no dreamer is too small.&rdquo;
            </blockquote>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/countries"
                className="px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-amber-300" />
                <span>EXPLORE 18 COUNTRIES</span>
              </Link>
              <Link
                href="/universities"
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>FIND UNIVERSITIES BY BDT BUDGET</span>
              </Link>
              <Link
                href="/scholarships"
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>GOVERNMENT SCHOLARSHIPS</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            EDITORIAL JOURNEY STAGE:
            1. Stage-Flooding Country Selector (with massive typography)
            2. Pure Scroll-Driven "Fall Into Place" Luggage Packing Engine
            ========================================================================= */}
        <LandingStory />

        {/* The 6 Core Public Intelligence Pillars (Clean Minimalist Cards) */}
        <section className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-semibold block mb-1">
                PLATFORM HUBS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                Destination Intelligence & Free Resources
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              100% Free Public Access · Zero Agency Commission
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Hub 1: Country Hubs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    18 DESTINATIONS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Country Hubs & FAQs
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Real costs in BDT, German Sperrkonto online consular portal (`digital.diplo.de`), Dhaka VFS timelines,
                  part-time work rights, and post-study work / PR realities.
                </p>
              </div>
              <Link
                href="/countries"
                className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-blue-600 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
              >
                <span>EXPLORE DESTINATIONS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 2: Universities */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    CURATED INTAKES
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  University Search & Timelines
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Interactive Annual Tuition Budget in BDT filter (Low &lt;2L, Moderate 2L–15L, High 15L+), upcoming application deadlines, and direct university portal links.
                </p>
              </div>
              <Link
                href="/universities"
                className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-600 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
              >
                <span>SEARCH UNIVERSITIES</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 3: Scholarships */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    18 SCHEMES
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Scholarships & Tuition Waivers
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  DAAD, Chevening, MEXT, UGC Bangladesh circular quotas, Erasmus Mundus, and graduate assistantships with funding valuations in BDT.
                </p>
              </div>
              <Link
                href="/scholarships"
                className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-amber-600 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
              >
                <span>FIND SCHOLARSHIPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 4: IELTS Course */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    12 LESSONS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Founder&apos;s IELTS Masterclass
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Structured video lessons, reading practice comprehension tests, and Band 8.0 strategies specifically for Bangladeshi students.
                </p>
              </div>
              <Link
                href="/course"
                className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-indigo-600 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
              >
                <span>OPEN MASTERCLASS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 5: Scam Check */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    FREE AUDIT
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Agency Scam Shield
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Audit agency claims, spot illegal document-holding tactics, hidden package charges, and fake scholarship guarantees before signing contracts.
                </p>
              </div>
              <Link
                href="/scam-check"
                className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-rose-600 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
              >
                <span>AUDIT AN AGENCY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Hub 6: Verified Mentors */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    FOUNDING ADVISORS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Senior Student Mentors
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Real Bangladeshi scholars enrolled across Germany, UK, USA, Japan, and Canada sharing authentic advice on CGPA hurdles, SOPs, and visa interviews.
                </p>
              </div>
              <Link
                href="/mentors"
                className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-sky-600 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
              >
                <span>VIEW MENTOR ROSTER</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Dedicated Mobile App Showcase (The Game) */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider">
                  <Plane className="w-3.5 h-3.5" />
                  <span>THE STANDALONE MOBILE APP · THE GAME</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  Track Your Flight from Dhaka to the World.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  The website gives you the intelligence — the mobile application is your daily flight tracker.
                  Turn your 2-year study-abroad prep into a game: level up from E-Rank to S-Rank, watch your flight
                  progress bar advance toward takeoff, build daily streaks, and master daily German &amp; Japanese quests.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>E → S Ranks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Flight Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Daily Quests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>100% Offline APK</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
                <Link
                  href="/tracker"
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg text-center"
                >
                  <Plane className="w-4 h-4 text-slate-900" />
                  <span>LAUNCH TRACKER GAME</span>
                </Link>
                <a
                  href="/manifest.json"
                  target="_blank"
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span>PWA / ANDROID MANIFEST</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Partner Spotlight */}

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 mt-auto text-xs text-slate-500 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-slate-950 font-bold text-base tracking-tight">
                WAYPOINT · waypointbd.com
              </span>
              <p className="text-xs text-slate-500 mt-1 font-serif italic">
                &ldquo;No dream is too big and no dreamer is too small.&rdquo;
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-600">
              <Link href="/countries" className="hover:text-slate-950">Countries</Link>
              <Link href="/universities" className="hover:text-slate-950">Universities</Link>
              <Link href="/scholarships" className="hover:text-slate-950">Scholarships</Link>
              <Link href="/course" className="hover:text-slate-950">IELTS Masterclass</Link>
              <Link href="/scam-check" className="hover:text-slate-950">Scam Check</Link>
              <Link href="/tracker" className="hover:text-slate-950 text-slate-950 font-bold">The Game Tracker</Link>
              <Link href="/admin" className="hover:text-slate-950">Admin</Link>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] text-slate-400">
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
