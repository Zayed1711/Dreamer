"use client";

import { useEffect, useState, useRef } from "react";
import { ExternalLink, X, ShieldAlert, Award } from "lucide-react";
import type { Ad, Stage } from "@dreamer/journey-engine";
import { SLOTS } from "@/lib/slots";
import { loadStageAd, recordAdEvent } from "@/lib/store";

interface StageAdModalProps {
  stage?: Stage;
}

export function StageAdModal({ stage }: StageAdModalProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (!stage) return;

    // Check if user already dismissed stage modal in this session
    try {
      const dismissed = JSON.parse(sessionStorage.getItem("waypoint_dismissed_stage_ads") || "[]");
      loadStageAd(stage, dismissed).then((matchingAd) => {
        if (matchingAd) {
          setAd(matchingAd);
          setIsOpen(true);
        }
      });
    } catch {
      loadStageAd(stage).then((matchingAd) => {
        if (matchingAd) {
          setAd(matchingAd);
          setIsOpen(true);
        }
      });
    }
  }, [stage]);

  useEffect(() => {
    if (!ad || !isOpen || recorded.current) return;
    recorded.current = true;
    recordAdEvent(ad.id, "view", "stage_modal", stage);
  }, [ad, isOpen, stage]);

  if (!ad || !isOpen) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      const dismissed: string[] = JSON.parse(
        sessionStorage.getItem("waypoint_dismissed_stage_ads") || "[]",
      );
      if (!dismissed.includes(ad.id)) {
        dismissed.push(ad.id);
        sessionStorage.setItem("waypoint_dismissed_stage_ads", JSON.stringify(dismissed));
      }
    } catch {}
  };

  const slotInfo = ad.slot ? SLOTS[ad.slot] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-grayscale-0 animate-in fade-in">
      <div className="window p-5 max-w-md w-full border-2 border-[#4db5ff] bg-[#070b12] text-[#c9d4e4] font-mono text-xs shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#1b2b3a] pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold text-[#fbbf24] px-1.5 py-0.5 border border-[#fbbf24]/50">
                [SPONSORED STAGE NOTICE]
              </span>
              {ad.flightTag && (
                <span className="text-[10px] text-[#4db5ff] font-bold">
                  {ad.flightTag}
                </span>
              )}
            </div>
            <h3 className="text-white text-base font-chakra font-bold">
              Stage Milestone Partner Guidance
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white border border-[#1b2b3a] hover:border-[#4db5ff]"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Commercial Sponsor Offer */}
        <div className="p-3 bg-[#0c1219] border border-[#1b2b3a] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-bold">{ad.advertiserName}</span>
            {ad.standardsAcceptedAt && (
              <span className="text-[9px] text-slate-400">
                Meets standards as of {new Date(ad.standardsAcceptedAt).toLocaleDateString("en-GB")}
              </span>
            )}
          </div>
          <p className="text-sm font-sans font-semibold text-white">
            {ad.headline}
          </p>
          <p className="text-xs font-sans text-slate-300 leading-relaxed">
            {ad.body}
          </p>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1b2b3a]/50">
            {ad.referralCode ? (
              <span className="text-[11px] text-slate-400">
                PROMO CODE: <strong className="text-[#4db5ff]">{ad.referralCode}</strong>
              </span>
            ) : <div />}
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordAdEvent(ad.id, "click", "stage_modal", stage)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] font-bold transition-colors"
            >
              <span>VISIT PARTNER</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* MANDATORY FREE OFFICIAL ALTERNATIVE (Trust Rule) */}
        {slotInfo?.free && (
          <div className="p-3 bg-[#05080f] border border-emerald-500/40 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>FREE OFFICIAL ALTERNATIVE (NO AGENT / ZERO CHARGE)</span>
            </div>
            <div className="text-white font-semibold text-xs">
              {slotInfo.free.title}
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-normal">
              {slotInfo.free.note}
            </p>
            {slotInfo.free.url && (
              <a
                href={slotInfo.free.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline pt-1"
              >
                <span>Access Free Resource</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}

        {/* Footer Dismiss Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1b2b3a]">
          <span className="text-[9px] text-slate-500 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-slate-500" />
            <span>Never pay unauthorised file opening fees.</span>
          </span>
          <button
            onClick={handleDismiss}
            className="px-3 py-1 bg-[#0c1219] hover:bg-[#102030] border border-[#1b2b3a] hover:border-slate-500 text-slate-300 text-xs"
          >
            DISMISS FOR THIS SESSION
          </button>
        </div>
      </div>
    </div>
  );
}
