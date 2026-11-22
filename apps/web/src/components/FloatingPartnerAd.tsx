"use client";

import { useEffect, useState, useRef } from "react";
import { ExternalLink, X, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import type { Ad, Stage } from "@dreamer/journey-engine";
import { loadFloatingAd, recordAdEvent } from "@/lib/store";

interface FloatingPartnerAdProps {
  stage?: Stage;
  country?: string;
  slot?: string;
}

export function FloatingPartnerAd({ stage, country, slot }: FloatingPartnerAdProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      if (sessionStorage.getItem("waypoint_float_ad_dismissed") === "1") {
        setDismissed(true);
        return;
      }
    } catch {}

    loadFloatingAd({ stage, country, slot }).then((res) => {
      setAd(res);
    }).catch(() => {});
  }, [stage, country, slot]);

  useEffect(() => {
    if (!ad || recorded.current || dismissed) return;
    recorded.current = true;
    recordAdEvent(ad.id, "view", "floating_card", stage);
  }, [ad, dismissed, stage]);

  if (!ad || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("waypoint_float_ad_dismissed", "1");
    } catch {}
  };

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1219] border border-[#4db5ff] text-[#4db5ff] text-xs font-mono shadow-lg hover:bg-[#102030]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>PARTNER OFFER</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Sponsored Partner Spotlight"
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 max-w-[340px] w-[calc(100vw-24px)] window p-3.5 border border-[#4db5ff]/60 bg-[#070b12] shadow-2xl text-[#c9d4e4] font-mono text-xs transition-all animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#1b2b3a] pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-[#fbbf24] px-1 border border-[#fbbf24]/40">
            SPONSORED
          </span>
          <span className="text-[10px] text-slate-400 truncate">
            {ad.advertiserName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-0.5 text-slate-400 hover:text-white"
            title="Minimize"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-0.5 text-slate-400 hover:text-rose-400"
            title="Dismiss offer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-1.5 mb-3">
        {ad.flightTag && (
          <span className="text-[10px] font-bold text-[#4db5ff] block">
            [{ad.flightTag}]
          </span>
        )}
        <h4 className="text-white text-xs font-chakra font-bold leading-tight">
          {ad.headline}
        </h4>
        <p className="text-[11px] font-sans text-slate-400 line-clamp-2">
          {ad.body}
        </p>
      </div>

      {/* Footer & CTA */}
      <div className="flex items-center justify-between gap-2 border-t border-[#1b2b3a]/60 pt-2">
        {ad.referralCode ? (
          <span className="text-[10px] text-slate-300">
            CODE: <strong className="text-[#4db5ff]">{ad.referralCode}</strong>
          </span>
        ) : <div />}

        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordAdEvent(ad.id, "click", "floating_card", stage)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-[10px] font-bold transition-colors"
        >
          <span>LEARN MORE</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </aside>
  );
}
