"use client";

import { useEffect, useState, useRef } from "react";
import { ExternalLink, Pause, Play, ChevronRight, ChevronLeft } from "lucide-react";
import type { Ad } from "@dreamer/journey-engine";
import { loadTickerAds, recordAdEvent } from "@/lib/store";

interface AirportFidsTickerProps {
  className?: string;
  maxCount?: number;
}

export function AirportFidsTicker({ className = "", maxCount = 6 }: AirportFidsTickerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const recordedViews = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadTickerAds(maxCount).then((data) => {
      setAds(data);
    }).catch(() => {});
  }, [maxCount]);

  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length, isPaused]);

  const activeAd = ads[currentIndex];

  useEffect(() => {
    if (!activeAd || recordedViews.current.has(activeAd.id)) return;
    recordedViews.current.add(activeAd.id);
    recordAdEvent(activeAd.id, "view", "fids_ticker");
  }, [activeAd]);

  if (!activeAd || ads.length === 0) return null;

  const nextAd = () => setCurrentIndex((prev) => (prev + 1) % ads.length);
  const prevAd = () => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);

  return (
    <div
      className={`border border-[#1b2b3a] bg-[#070b12] text-[#c9d4e4] font-mono text-xs w-full overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-3 py-2 gap-2 border-b border-[#1b2b3a]/60">
        {/* Terminal Header & Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-block w-2 h-2 bg-emerald-400 animate-pulse" />
          <span className="text-[10px] tracking-widest text-[#4db5ff] font-bold uppercase">
            TERMINAL FIDS · NOTICE {currentIndex + 1}/{ads.length}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 border border-[#fbbf24]/40 text-[#fbbf24] uppercase">
            SPONSORED
          </span>
        </div>

        {/* Ticker Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 text-[10px]">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 hover:text-[#4db5ff] border border-[#1b2b3a] px-1.5 py-0.5"
            title={isPaused ? "Resume rotation" : "Pause rotation"}
          >
            {isPaused ? <Play className="w-2.5 h-2.5 inline mr-1" /> : <Pause className="w-2.5 h-2.5 inline mr-1" />}
            <span>{isPaused ? "RESUME" : "PAUSE"}</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={prevAd}
              className="p-1 hover:text-[#4db5ff] border border-[#1b2b3a]"
              title="Previous offer"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={nextAd}
              className="p-1 hover:text-[#4db5ff] border border-[#1b2b3a]"
              title="Next offer"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Notice Display */}
      <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
          {activeAd.flightTag && (
            <span className="inline-block px-2 py-0.5 bg-[#102030] border border-[#4db5ff] text-[#4db5ff] text-[10px] font-bold shrink-0 self-start sm:self-center">
              {activeAd.flightTag}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-white text-xs sm:text-sm font-semibold truncate hover:text-clip">
              {activeAd.headline}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {activeAd.advertiserName} · {activeAd.body}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-[#1b2b3a]/50 pt-2 sm:pt-0">
          {activeAd.referralCode && (
            <span className="text-[10px] border border-[#1b2b3a] bg-[#0c1219] px-2 py-1 text-slate-300">
              PROMO: <strong className="text-[#4db5ff]">{activeAd.referralCode}</strong>
            </span>
          )}
          <a
            href={activeAd.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordAdEvent(activeAd.id, "click", "fids_ticker")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#102030] hover:bg-[#4db5ff] text-[#4db5ff] hover:text-black border border-[#4db5ff] text-[11px] font-semibold transition-colors"
          >
            <span>VIEW OFFER</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Standards Disclaimer Line */}
      <div className="px-3 py-1 bg-[#05080f] border-t border-[#1b2b3a]/40 text-[9px] text-slate-500 flex flex-wrap justify-between items-center gap-1">
        <span>Commercial partners meet our published standards as of their listing date. Never pay unverified agents.</span>
        <span>Zero EXP awarded for sponsor clicks.</span>
      </div>
    </div>
  );
}
