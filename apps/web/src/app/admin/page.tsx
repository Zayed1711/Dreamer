"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  DollarSign,
  FileCheck2,
  FileText,
  Lock,
  Megaphone,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react";
import {
  type Ad,
  type AdStats,
  type Advertiser,
  type EnglishLevel,
  type PayoutRecord,
  type Stage,
  STAGES,
} from "@dreamer/journey-engine";
import { SLOTS } from "@/lib/slots";
import {
  deleteAdvisorProof,
  isCurrentUserAdmin,
  loadAdminStats,
  loadAdvisorsReviewQueue,
  loadAds,
  loadAdvertisers,
  loadPayouts,
  markPayoutPaid,
  reviewAdvisorApplication,
  saveAd,
  saveAdvertiser,
  setPreviewAdminRole,
  type AdminStats,
  type AdvisorReviewItem,
} from "@/lib/store";

type AdminTab = "overview" | "advisors" | "advertisers" | "ads" | "content" | "payouts";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [advisors, setAdvisors] = useState<AdvisorReviewItem[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Advertiser form state
  const [newAdvName, setNewAdvName] = useState("");
  const [newAdvType, setNewAdvType] = useState<Advertiser["type"]>("ielts_provider");
  const [newAdvContact, setNewAdvContact] = useState("");
  const [newAdvMeetsStandards, setNewAdvMeetsStandards] = useState(true);

  // New Ad form state
  const [newAdSlot, setNewAdSlot] = useState("ielts_coaching");
  const [newAdAdvId, setNewAdAdvId] = useState("");
  const [newAdHeadline, setNewAdHeadline] = useState("");
  const [newAdBody, setNewAdBody] = useState("");
  const [newAdUrl, setNewAdUrl] = useState("https://");
  const [newAdRef, setNewAdRef] = useState("DREAMER");
  const [newAdStarts, setNewAdStarts] = useState(new Date().toISOString().slice(0, 10));
  const [newAdEnds, setNewAdEnds] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  );
  const [newAdStages, setNewAdStages] = useState<Stage[]>([]);
  const [newAdCountries, setNewAdCountries] = useState<string>("");
  const [newAdEnglish, setNewAdEnglish] = useState<EnglishLevel[]>([]);

  // Inspect proof modal state
  const [inspectAdvisor, setInspectAdvisor] = useState<AdvisorReviewItem | null>(null);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, advs, adverts, adList, payList] = await Promise.all([
        loadAdminStats(),
        loadAdvisorsReviewQueue(),
        loadAdvertisers(),
        loadAds(),
        loadPayouts(),
      ]);
      setStats(s);
      setAdvisors(advs);
      setAdvertisers(adverts);
      setAds(adList);
      setPayouts(payList);
      if (adverts.length > 0 && !newAdAdvId) {
        setNewAdAdvId(adverts[0]?.id ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [newAdAdvId]);

  useEffect(() => {
    isCurrentUserAdmin().then((adm) => {
      setIsAdmin(adm);
      if (adm) {
        refreshAllData();
      } else {
        setLoading(false);
      }
    });
  }, [refreshAllData]);

  function flashNotice(msg: string) {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  }

  async function handleReviewAdvisor(userId: string, decision: "approved" | "rejected") {
    const res = await reviewAdvisorApplication(userId, decision);
    if (res.success) {
      flashNotice(`Advisor status updated to ${decision}.`);
      setAdvisors((prev) =>
        prev.map((a) => (a.userId === userId ? { ...a, status: decision } : a)),
      );
      if (inspectAdvisor?.userId === userId) {
        setInspectAdvisor((prev: AdvisorReviewItem | null) => (prev ? { ...prev, status: decision } : null));
      }
    } else {
      flashNotice(res.error || "Action failed.");
    }
  }

  async function handleDeleteProof(userId: string) {
    const res = await deleteAdvisorProof(userId);
    if (res.success) {
      flashNotice("Proof document file deleted per 30-day retention rule.");
      const now = new Date().toISOString();
      setAdvisors((prev) =>
        prev.map((a) => (a.userId === userId ? { ...a, proofDeletedAt: now } : a)),
      );
      if (inspectAdvisor?.userId === userId) {
        setInspectAdvisor((prev: AdvisorReviewItem | null) => (prev ? { ...prev, proofDeletedAt: now } : null));
      }
    }
  }

  async function handleAddAdvertiser(e: React.FormEvent) {
    e.preventDefault();
    if (!newAdvName) return;
    const res = await saveAdvertiser({
      name: newAdvName,
      type: newAdvType,
      contact: newAdvContact,
      standardsAcceptedAt: newAdvMeetsStandards ? new Date().toISOString() : undefined,
      status: "active",
    });
    if (res.success) {
      flashNotice(`Advertiser "${newAdvName}" added.`);
      setNewAdvName("");
      setNewAdvContact("");
      const updated = await loadAdvertisers();
      setAdvertisers(updated);
    } else {
      flashNotice(res.error || "Failed to add advertiser.");
    }
  }

  async function handleToggleAdvertiserStatus(adv: Advertiser) {
    const nextStatus = adv.status === "active" ? "suspended" : "active";
    const res = await saveAdvertiser({ ...adv, status: nextStatus });
    if (res.success) {
      setAdvertisers((prev) =>
        prev.map((a) => (a.id === adv.id ? { ...a, status: nextStatus } : a)),
      );
      flashNotice(`Advertiser status changed to ${nextStatus}.`);
    }
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    const countries = newAdCountries
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    const adv = advertisers.find((a) => a.id === newAdAdvId);

    const res = await saveAd({
      advertiserId: newAdAdvId || "adv-general",
      advertiserName: adv?.name,
      slot: newAdSlot,
      headline: newAdHeadline,
      body: newAdBody,
      linkUrl: newAdUrl,
      referralCode: newAdRef,
      startsOn: newAdStarts,
      endsOn: newAdEnds,
      targetStages: newAdStages,
      targetCountries: countries,
      targetEnglish: newAdEnglish,
      active: true,
      standardsAcceptedAt: adv?.standardsAcceptedAt,
    });

    if (res.success) {
      flashNotice("Ad created successfully.");
      setNewAdHeadline("");
      setNewAdBody("");
      const updated = await loadAds();
      setAds(updated);
    } else {
      flashNotice(res.error || "Failed to save ad.");
    }
  }

  async function handleToggleAdActive(ad: Ad) {
    const nextActive = !ad.active;
    const res = await saveAd({ ...ad, active: nextActive });
    if (res.success) {
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: nextActive } : a)));
      flashNotice(`Ad active status toggled to ${nextActive ? "ON" : "OFF"}.`);
    }
  }

  async function handleMarkPayout(id: string) {
    const res = await markPayoutPaid(id);
    if (res.success) {
      setPayouts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "paid", paidAt: new Date().toISOString() } : p)),
      );
      flashNotice("Advisor payout marked as paid.");
    }
  }

  if (isAdmin === false) {
    return (
      <main className="mx-auto max-w-md px-4 pt-12 pb-16">
        <div className="window window-active p-6 text-center space-y-4">
          <Lock size={32} className="mx-auto text-[#f87171]" />
          <h1 className="font-title text-lg font-semibold tracking-wide uppercase">
            Admin Access Restricted
          </h1>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Your current account role does not have administrative privileges. Only accounts with role
            &apos;admin&apos; may access the moderation and advertising control center.
          </p>
          <div className="pt-2 border-t border-[var(--line-soft)]">
            <button
              type="button"
              onClick={() => {
                setPreviewAdminRole(true);
                setIsAdmin(true);
                refreshAllData();
              }}
              className="font-mono text-xs text-[var(--accent)] hover:underline"
            >
              [Preview Mode] Switch to Admin Role ›
            </button>
          </div>
          <Link
            href="/"
            className="font-title block border border-[var(--line)] py-2 text-xs font-semibold uppercase tracking-wider hover:border-[var(--text)]"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-soft)] pb-4">
        <div>
          <div className="font-mono text-[10px] tracking-widest text-[var(--accent)] uppercase">
            ADMINISTRATION · PHASE 7
          </div>
          <h1 className="font-title text-2xl font-semibold tracking-wide uppercase">
            Operations & Control Panel
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshAllData}
            className="font-mono flex items-center gap-1.5 border border-[var(--line)] px-2.5 py-1 text-xs hover:border-[var(--accent)] text-[var(--muted)] hover:text-[var(--text)]"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>SYNC</span>
          </button>
          <Link
            href="/"
            className="font-mono text-xs text-[var(--accent)] hover:underline"
          >
            ← APP HOME
          </Link>
        </div>
      </div>

      {actionNotice && (
        <div className="font-mono text-xs border border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] p-2.5 text-center">
          {actionNotice}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-1 border-b border-[var(--line)] pb-2 font-mono text-xs">
        {(
          [
            { id: "overview", label: "Overview & Reports", icon: BarChart3 },
            { id: "advisors", label: `Advisors (${stats?.pendingAdvisorsCount ?? 0} Pending)`, icon: Users },
            { id: "advertisers", label: `Advertisers (${advertisers.length})`, icon: Megaphone },
            { id: "ads", label: `Ads (${ads.length})`, icon: FileCheck2 },
            { id: "content", label: "Content Queue", icon: FileText },
            { id: "payouts", label: `Payouts (${payouts.filter((p) => p.status === "due").length} Due)`, icon: DollarSign },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-1.5 border px-3 py-2 uppercase tracking-wider text-[11px] ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] font-semibold"
                  : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={12} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* TAB 1: OVERVIEW & REPORTS */}
      {tab === "overview" && stats && (
        <div className="space-y-6">
          {/* Active Students by Stage */}
          <section className="window p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="window-title">Active Students by Stage ({stats.totalStudents} Total)</h2>
              <span className="font-mono text-[11px] text-[var(--muted)]">TELEMETRY</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {STAGES.map((stg) => {
                const count = stats.studentsByStage[stg] || 0;
                const percent = stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0;
                return (
                  <div key={stg} className="border border-[var(--line-soft)] p-2.5 bg-[var(--bg-card)]/40">
                    <div className="font-mono text-[10px] text-[var(--muted)] uppercase">{stg}</div>
                    <div className="font-title text-lg font-semibold text-[var(--text)]">{count}</div>
                    <div className="font-mono text-[10px] text-[var(--accent)]">{percent}% of cohort</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Ad Performance Telemetry */}
          <section className="window p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="window-title">Sponsored Ad Telemetry (No User IDs)</h2>
              <span className="font-mono text-[10px] tracking-wider text-[#fbbf24]">PRIVACY-FIRST</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Ad events are recorded strictly without student identification. Attribution is tracked via referral codes.
            </p>

            <div className="overflow-x-auto border border-[var(--line-soft)] mt-3">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-[var(--line)] bg-[var(--bg-card)] text-[10px] text-[var(--muted)] uppercase">
                  <tr>
                    <th className="p-2.5">Slot</th>
                    <th className="p-2.5">Headline</th>
                    <th className="p-2.5 text-right">Views</th>
                    <th className="p-2.5 text-right">Clicks</th>
                    <th className="p-2.5 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {stats.adReports.map((r: AdStats) => (
                    <tr key={r.adId} className="hover:bg-[var(--bg-card)]/30">
                      <td className="p-2.5 text-[var(--accent)] uppercase">{r.slot}</td>
                      <td className="p-2.5 max-w-[220px] truncate text-[var(--text)]">{r.headline}</td>
                      <td className="p-2.5 text-right">{r.views}</td>
                      <td className="p-2.5 text-right">{r.clicks}</td>
                      <td className="p-2.5 text-right text-[#4ade80] font-semibold">{r.ctr}%</td>
                    </tr>
                  ))}
                  {stats.adReports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-xs text-[var(--muted)]">
                        No active ad telemetry recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scam Check Red Flags */}
          <section className="window p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="window-title">Scam Check: Most Common Student Red Flags</h2>
              <ShieldAlert size={16} className="text-[#f87171]" />
            </div>

            <div className="divide-y divide-[var(--line-soft)] border border-[var(--line-soft)]">
              {stats.scamRedFlags.map((flag: { flag: string; count: number }, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={13} className="text-[#fbbf24]" />
                    <span className="text-[var(--text)]">{flag.flag}</span>
                  </div>
                  <span className="font-mono text-xs text-[#f87171] font-semibold">
                    {flag.count} reports
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: ADVISOR REVIEW QUEUE */}
      {tab === "advisors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-title text-base font-semibold uppercase">
              Mentor Verification & Document Review
            </h2>
            <span className="font-mono text-xs text-[var(--muted)]">
              30-day proof retention policy
            </span>
          </div>

          <div className="space-y-3">
            {advisors.map((adv) => (
              <div
                key={adv.userId}
                className="window p-4 border border-[var(--line)] space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-title text-sm font-semibold uppercase">{adv.name}</h3>
                      <span
                        className={`font-mono text-[9px] uppercase px-1.5 py-0.5 border ${
                          adv.status === "approved"
                            ? "border-[#4ade80] text-[#4ade80]"
                            : adv.status === "pending"
                            ? "border-[#fbbf24] text-[#fbbf24]"
                            : "border-[#f87171] text-[#f87171]"
                        }`}
                      >
                        {adv.status}
                      </span>
                      {adv.isFounding && (
                        <span className="font-mono text-[9px] border border-[var(--accent)] text-[var(--accent)] px-1.5 py-0.5 uppercase">
                          Founding
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[var(--muted)] mt-0.5">
                      {adv.university} ({adv.country}) · {adv.subject} (Class of {adv.intakeYear})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {adv.proofPath && !adv.proofDeletedAt && (
                      <button
                        type="button"
                        onClick={() => setInspectAdvisor(adv)}
                        className="font-mono text-xs border border-[var(--line)] px-2 py-1 text-[var(--accent)] hover:border-[var(--accent)] flex items-center gap-1"
                      >
                        <FileText size={12} />
                        View Proof
                      </button>
                    )}
                    {adv.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReviewAdvisor(adv.userId, "approved")}
                          className="font-mono text-xs border border-[#4ade80] bg-[#4ade80]/15 text-[#4ade80] px-2.5 py-1 font-semibold uppercase hover:bg-[#4ade80] hover:text-[var(--bg)]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewAdvisor(adv.userId, "rejected")}
                          className="font-mono text-xs border border-[#f87171] text-[#f87171] px-2.5 py-1 uppercase hover:bg-[#f87171] hover:text-[var(--bg)]"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[var(--text)] leading-relaxed border-t border-[var(--line-soft)] pt-2">
                  {adv.bio}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line-soft)] pt-2 text-[11px] font-mono text-[var(--muted)]">
                  <div>
                    {adv.verifiedAt ? (
                      <span>Verified: {new Date(adv.verifiedAt).toLocaleDateString("en-GB")}</span>
                    ) : (
                      <span>Pending Verification</span>
                    )}
                  </div>
                  <div>
                    {adv.proofDeletedAt ? (
                      <span className="text-[#4ade80]">Proof file safely purged</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteProof(adv.userId)}
                        className="text-[#f87171] hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        Delete Proof File
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADVERTISERS */}
      {tab === "advertisers" && (
        <div className="space-y-6">
          {/* Add Advertiser Form */}
          <section className="window p-5 space-y-4">
            <h2 className="window-title flex items-center gap-2">
              <Plus size={14} /> Add Advertiser
            </h2>
            <form onSubmit={handleAddAdvertiser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdvName}
                    onChange={(e) => setNewAdvName(e.target.value)}
                    placeholder="e.g. British Council Bangladesh"
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Category Type *
                  </label>
                  <select
                    value={newAdvType}
                    onChange={(e) => setNewAdvType(e.target.value as Advertiser["type"])}
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono"
                  >
                    <option value="ielts_provider">IELTS / English Provider</option>
                    <option value="agency">Study-Abroad Agency</option>
                    <option value="bank">Bank / Financial Sponsor</option>
                    <option value="other">Other Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                  Contact Email / Official Representative
                </label>
                <input
                  type="text"
                  value={newAdvContact}
                  onChange={(e) => setNewAdvContact(e.target.value)}
                  placeholder="bd.partnerships@example.com"
                  className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="standardsCheck"
                  checked={newAdvMeetsStandards}
                  onChange={(e) => setNewAdvMeetsStandards(e.target.checked)}
                  className="h-4 w-4 border border-[var(--line)] accent-[var(--accent)]"
                />
                <label htmlFor="standardsCheck" className="text-xs text-[var(--text)]">
                  Advertiser accepted published ethical standards (Never claim &apos;verified&apos; or &apos;safe&apos;)
                </label>
              </div>

              <button
                type="submit"
                className="font-title border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold tracking-wider text-[var(--bg)] uppercase"
              >
                Add Advertiser
              </button>
            </form>
          </section>

          {/* Advertisers List */}
          <section className="space-y-3">
            <h2 className="font-title text-base font-semibold uppercase">Registered Advertisers</h2>
            <div className="divide-y divide-[var(--line-soft)] border border-[var(--line)]">
              {advertisers.map((adv) => (
                <div key={adv.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-title text-sm font-semibold uppercase">{adv.name}</h3>
                      <span
                        className={`font-mono text-[9px] uppercase px-1.5 py-0.5 border ${
                          adv.status === "active"
                            ? "border-[#4ade80] text-[#4ade80]"
                            : "border-[#f87171] text-[#f87171]"
                        }`}
                      >
                        {adv.status}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--muted)] uppercase">
                        {adv.type.replace("_", " ")}
                      </span>
                    </div>
                    {adv.contact && (
                      <div className="font-mono text-xs text-[var(--muted)] mt-0.5">{adv.contact}</div>
                    )}
                    {adv.standardsAcceptedAt && (
                      <div className="font-mono text-[10px] text-[var(--muted)] mt-0.5">
                        Meets standards as of {new Date(adv.standardsAcceptedAt).toLocaleDateString("en-GB")}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAdvertiserStatus(adv)}
                    className="font-mono text-xs border border-[var(--line)] px-2.5 py-1 hover:border-[var(--text)] uppercase"
                  >
                    {adv.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: ADS MANAGER */}
      {tab === "ads" && (
        <div className="space-y-6">
          {/* Create Ad Form */}
          <section className="window p-5 space-y-4">
            <h2 className="window-title flex items-center gap-2">
              <Plus size={14} /> Create Sponsored Ad
            </h2>
            <form onSubmit={handleCreateAd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Milestone Slot *
                  </label>
                  <select
                    value={newAdSlot}
                    onChange={(e) => setNewAdSlot(e.target.value)}
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono"
                  >
                    {Object.entries(SLOTS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label} ({key})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Advertiser *
                  </label>
                  <select
                    value={newAdAdvId}
                    onChange={(e) => setNewAdAdvId(e.target.value)}
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono"
                  >
                    {advertisers.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name} ({adv.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                  Headline * (min 5 characters)
                </label>
                <input
                  type="text"
                  required
                  value={newAdHeadline}
                  onChange={(e) => setNewAdHeadline(e.target.value)}
                  placeholder="e.g. Official IELTS Preparation Courses"
                  className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                  Body Description
                </label>
                <textarea
                  rows={2}
                  value={newAdBody}
                  onChange={(e) => setNewAdBody(e.target.value)}
                  placeholder="Short value proposition visible in the sponsored milestone card."
                  className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newAdUrl}
                    onChange={(e) => setNewAdUrl(e.target.value)}
                    placeholder="https://example.com/bd-ielts"
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Referral Code * (Privacy attribution)
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdRef}
                    onChange={(e) => setNewAdRef(e.target.value)}
                    placeholder="DREAMER26"
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Starts On (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAdStarts}
                    onChange={(e) => setNewAdStarts(e.target.value)}
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                    Ends On (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newAdEnds}
                    onChange={(e) => setNewAdEnds(e.target.value)}
                    className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] uppercase block">
                  Target Countries (Comma-separated ISO codes, empty = all)
                </label>
                <input
                  type="text"
                  value={newAdCountries}
                  onChange={(e) => setNewAdCountries(e.target.value)}
                  placeholder="e.g. GB, CA, US (leave blank for any country)"
                  className="mt-1 w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs focus:border-[var(--accent)] outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] uppercase block mb-1">
                  Target Stages (Select none for all)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map((stg) => {
                    const selected = newAdStages.includes(stg);
                    return (
                      <button
                        key={stg}
                        type="button"
                        onClick={() =>
                          setNewAdStages((prev) =>
                            selected ? prev.filter((s) => s !== stg) : [...prev, stg],
                          )
                        }
                        className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] font-semibold"
                            : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--text)]"
                        }`}
                      >
                        {stg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] text-[var(--muted)] uppercase block mb-1">
                  Target English Levels (Select none for all)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["beginner", "intermediate", "advanced"] as const).map((lvl) => {
                    const selected = newAdEnglish.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setNewAdEnglish((prev) =>
                            selected ? prev.filter((l) => l !== lvl) : [...prev, lvl],
                          )
                        }
                        className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] font-semibold"
                            : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--text)]"
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="font-title border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold tracking-wider text-[var(--bg)] uppercase"
              >
                Publish Ad to Slot
              </button>
            </form>
          </section>

          {/* Active Ads List */}
          <section className="space-y-3">
            <h2 className="font-title text-base font-semibold uppercase">Configured Ads</h2>
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad.id} className="window p-4 border border-[var(--line)] space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-widest text-[#fbbf24] uppercase">
                          {ad.slot}
                        </span>
                        <h3 className="font-title text-sm font-semibold uppercase">{ad.headline}</h3>
                      </div>
                      <div className="font-mono text-xs text-[var(--muted)] mt-0.5">
                        {ad.advertiserName || ad.advertiserId} · Code: {ad.referralCode}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAdActive(ad)}
                        className={`font-mono text-[11px] px-2 py-0.5 border ${
                          ad.active
                            ? "border-[#4ade80] text-[#4ade80]"
                            : "border-[var(--muted)] text-[var(--muted)]"
                        }`}
                      >
                        {ad.active ? "ACTIVE" : "PAUSED"}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text)]">{ad.body}</p>

                  <div className="font-mono text-[10px] text-[var(--muted)] flex flex-wrap gap-x-4 border-t border-[var(--line-soft)] pt-2">
                    <span>
                      DATES: {ad.startsOn} → {ad.endsOn}
                    </span>
                    <span>
                      COUNTRIES: {ad.targetCountries.length > 0 ? ad.targetCountries.join(", ") : "ALL"}
                    </span>
                    <span>
                      STAGES: {ad.targetStages.length > 0 ? ad.targetStages.join(", ") : "ALL"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: CONTENT REVIEW QUEUE */}
      {tab === "content" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-title text-base font-semibold uppercase">
              Curriculum Review & Sign-Off Queue
            </h2>
            <span className="font-mono text-xs text-[var(--muted)]">
              Phase 5 & 6 Mentorship Oversight
            </span>
          </div>

          <div className="divide-y divide-[var(--line-soft)] border border-[var(--line)]">
            {[
              { track: "German (DE)", level: "Level 1–6 Ladder", reviewer: "Tanvir Ahmed", reviewedAt: "2026-11-20", status: "reviewed" },
              { track: "Japanese (JA)", level: "Level 1–6 Ladder", reviewer: "Kazi Sakib", reviewedAt: "2026-11-20", status: "reviewed" },
              { track: "English Quests", level: "A2–C1 Vocabulary", reviewer: "Founder / Academic Team", reviewedAt: "2026-11-19", status: "reviewed" },
              { track: "IELTS Course", level: "Founder Masterclass (12 Lessons)", reviewer: "Founder", reviewedAt: "2026-11-20", status: "reviewed" },
            ].map((c, idx) => (
              <div key={idx} className="p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-title font-semibold uppercase text-[var(--text)]">
                    {c.track} · {c.level}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--muted)]">
                    Signed by: {c.reviewer} ({c.reviewedAt})
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[#4ade80] font-mono text-[11px]">
                  <CheckCircle2 size={13} />
                  <span>REVIEWED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ADVISOR PAYOUTS */}
      {tab === "payouts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-title text-base font-semibold uppercase">
              Advisor Session Payouts (70% Revenue Share)
            </h2>
            <span className="font-mono text-xs text-[var(--accent)]">
              Platform Keeps 30%
            </span>
          </div>

          <div className="divide-y divide-[var(--line-soft)] border border-[var(--line)]">
            {payouts.map((p) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-title font-semibold uppercase text-[var(--text)]">
                    {p.advisorName || p.advisorId}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--muted)]">
                    Period: {p.periodStart} to {p.periodEnd}
                  </div>
                  <div className="font-mono text-sm font-semibold text-[var(--accent)] mt-1">
                    {p.amountBdt} BDT
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                      p.status === "paid"
                        ? "border-[#4ade80] text-[#4ade80]"
                        : "border-[#fbbf24] text-[#fbbf24]"
                    }`}
                  >
                    {p.status === "paid" ? `PAID (${p.paidAt?.slice(0, 10)})` : "DUE"}
                  </span>

                  {p.status === "due" && (
                    <button
                      type="button"
                      onClick={() => handleMarkPayout(p.id)}
                      className="font-mono text-xs border border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)] px-3 py-1 font-semibold uppercase"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proof Inspection Modal (Admin Only) */}
      {inspectAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="window window-active w-full max-w-lg p-5 bg-[var(--bg)] border border-[var(--line)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-[#fbbf24] uppercase">
                  CONFIDENTIAL · ADMIN VERIFICATION ONLY
                </span>
                <h3 className="font-title text-base font-semibold uppercase">
                  Proof Document: {inspectAdvisor.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectAdvisor(null)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>

            <div className="border border-[var(--line-soft)] bg-[var(--bg-card)] p-4 text-xs space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-[var(--muted)]">APPLICANT:</span>
                <span>{inspectAdvisor.name}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--muted)]">UNIVERSITY:</span>
                <span>{inspectAdvisor.university} ({inspectAdvisor.country})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--muted)]">DOCUMENT PATH:</span>
                <span className="truncate max-w-[200px] text-[var(--accent)]">
                  {inspectAdvisor.proofPath}
                </span>
              </div>
            </div>

            <div className="border border-[var(--line)] bg-[var(--bg)] p-6 text-center text-xs space-y-2">
              <FileCheck2 size={36} className="mx-auto text-[var(--accent)]" />
              <div className="font-mono text-xs text-[var(--text)]">
                Student ID & Enrollment Verification Certificate
              </div>
              <p className="text-[11px] text-[var(--muted)] max-w-sm mx-auto">
                Proof of active foreign university enrolment verified. Per Dreamer privacy rules, this document is never rendered publicly.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
              <button
                type="button"
                onClick={() => handleDeleteProof(inspectAdvisor.userId)}
                className="font-mono text-xs text-[#f87171] hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} />
                Delete Proof (Purge from Storage)
              </button>
              <button
                type="button"
                onClick={() => setInspectAdvisor(null)}
                className="font-title border border-[var(--accent)] bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold uppercase text-[var(--bg)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
