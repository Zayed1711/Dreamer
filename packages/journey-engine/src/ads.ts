import defaultAdvertisersJson from "../../../content/ads/advertisers.json";
import defaultAdsJson from "../../../content/ads/ads.json";
import type { Ad, Advertiser, AdEventType, AdStats, EnglishLevel, Stage } from "./types";

export const defaultAdvertisers: Advertiser[] = defaultAdvertisersJson as Advertiser[];
export const defaultAds: Ad[] = defaultAdsJson as Ad[];

export interface AdMatchContext {
  slot: string;
  stage?: Stage;
  country?: string;
  english?: EnglishLevel;
  date?: string; // YYYY-MM-DD
}

/**
 * Checks whether an ad matches the current student context, milestone slot, and active dates.
 */
export function matchAd(ad: Ad, context: AdMatchContext): boolean {
  if (!ad.active) return false;
  if (ad.slot !== context.slot) return false;

  const todayStr = context.date ?? new Date().toISOString().slice(0, 10);
  if (ad.startsOn && todayStr < ad.startsOn) return false;
  if (ad.endsOn && todayStr > ad.endsOn) return false;

  // Targeting: empty array means "all" / no restriction
  if (ad.targetStages && ad.targetStages.length > 0) {
    if (!context.stage || !ad.targetStages.includes(context.stage)) {
      return false;
    }
  }

  if (ad.targetCountries && ad.targetCountries.length > 0) {
    if (!context.country) return false;
    const targetUpper = ad.targetCountries.map((c) => c.toUpperCase());
    if (!targetUpper.includes(context.country.toUpperCase())) {
      return false;
    }
  }

  if (ad.targetEnglish && ad.targetEnglish.length > 0) {
    if (!context.english || !ad.targetEnglish.includes(context.english)) {
      return false;
    }
  }

  return true;
}

/**
 * Selects the best active ad for a slot matching student targeting.
 * Deterministic: returns the first matching ad sorted by startsOn ascending, then id.
 */
export function pickActiveAd(ads: Ad[], context: AdMatchContext): Ad | null {
  const matches = ads.filter((ad) => matchAd(ad, context));
  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    if (a.startsOn !== b.startsOn) return a.startsOn.localeCompare(b.startsOn);
    return a.id.localeCompare(b.id);
  });

  return matches[0] ?? null;
}

/**
 * Returns active ads formatted for the airport FIDS ticker board.
 * Matches ads that have placement === "ticker" or "all", or unspecified placement.
 */
export function pickTickerAds(ads: Ad[], maxCount = 5, todayStr?: string): Ad[] {
  const today = todayStr ?? new Date().toISOString().slice(0, 10);
  const activeAds = ads.filter((ad) => {
    if (!ad.active) return false;
    if (ad.startsOn && today < ad.startsOn) return false;
    if (ad.endsOn && today > ad.endsOn) return false;
    if (ad.placement && ad.placement !== "all" && ad.placement !== "ticker") return false;
    return true;
  });

  activeAds.sort((a, b) => {
    // Ads with a flight tag get prioritized on the ticker board
    if (Boolean(a.flightTag) !== Boolean(b.flightTag)) {
      return a.flightTag ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  return activeAds.slice(0, maxCount);
}

/**
 * Selects a floating partner spotlight ad matching user context.
 * On public exploration pages where context.stage may not yet be set, allows
 * ads targeting the slot without requiring an authenticated student profile.
 */
export function pickFloatingAd(ads: Ad[], context: AdMatchContext): Ad | null {
  const matches = ads.filter((ad) => {
    if (!ad.active) return false;
    if (ad.placement && ad.placement !== "all" && ad.placement !== "floating") return false;
    if (context.slot && ad.slot !== context.slot) return false;

    const todayStr = context.date ?? new Date().toISOString().slice(0, 10);
    if (ad.startsOn && todayStr < ad.startsOn) return false;
    if (ad.endsOn && todayStr > ad.endsOn) return false;

    // If student stage is known, verify stage targeting
    if (context.stage && ad.targetStages && ad.targetStages.length > 0) {
      if (!ad.targetStages.includes(context.stage)) return false;
    }

    // If country is specified, verify country targeting
    if (context.country && ad.targetCountries && ad.targetCountries.length > 0) {
      const targetUpper = ad.targetCountries.map((c) => c.toUpperCase());
      if (!targetUpper.includes(context.country.toUpperCase())) return false;
    }

    return true;
  });

  if (matches.length === 0) return null;

  matches.sort((a, b) => a.id.localeCompare(b.id));
  return matches[0] ?? null;
}

/**
 * Selects a contextual stage modal / pop-up ad for the mobile app tracker.
 * Only triggers if the ad targets the current stage and has not been dismissed.
 */
export function pickStageAd(
  ads: Ad[],
  stage: Stage,
  dismissedAdIds: string[] = [],
  todayStr?: string,
): Ad | null {
  const today = todayStr ?? new Date().toISOString().slice(0, 10);
  const dismissedSet = new Set(dismissedAdIds);

  const matches = ads.filter((ad) => {
    if (!ad.active) return false;
    if (dismissedSet.has(ad.id)) return false;
    if (ad.startsOn && today < ad.startsOn) return false;
    if (ad.endsOn && today > ad.endsOn) return false;
    if (ad.placement && ad.placement !== "all" && ad.placement !== "stage_modal") return false;

    // Must match the current stage
    if (!ad.targetStages || ad.targetStages.length === 0) return true;
    return ad.targetStages.includes(stage);
  });

  if (matches.length === 0) return null;

  // Stable ordering
  matches.sort((a, b) => {
    if (a.startsOn !== b.startsOn) return a.startsOn.localeCompare(b.startsOn);
    return a.id.localeCompare(b.id);
  });

  return matches[0] ?? null;
}

/**
 * Validates input parameters for creating or updating an ad.
 */
export function validateAdInput(input: Partial<Ad>): { valid: boolean; problems: string[] } {
  const problems: string[] = [];

  if (!input.slot || input.slot.trim().length === 0) {
    problems.push("Slot must be selected.");
  }
  if (!input.headline || input.headline.trim().length < 5) {
    problems.push("Headline must be at least 5 characters.");
  }
  if (!input.linkUrl || !/^https?:\/\/.+/.test(input.linkUrl.trim())) {
    problems.push("A valid URL starting with http:// or https:// is required.");
  }
  if (!input.referralCode || input.referralCode.trim().length === 0) {
    problems.push("Referral code is required for attribution without sharing student data.");
  }
  if (!input.startsOn || !input.endsOn) {
    problems.push("Start and end dates are required.");
  } else if (input.endsOn < input.startsOn) {
    problems.push("End date cannot be earlier than start date.");
  }

  return {
    valid: problems.length === 0,
    problems,
  };
}

/**
 * Aggregates views, clicks, and calculates click-through rate (CTR) for an ad.
 */
export function calculateAdStats(
  events: { adId: string; event: AdEventType }[],
  ad: Ad,
): AdStats {
  let views = 0;
  let clicks = 0;

  for (const e of events) {
    if (e.adId === ad.id) {
      if (e.event === "view") views++;
      else if (e.event === "click") clicks++;
    }
  }

  const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;

  return {
    adId: ad.id,
    headline: ad.headline,
    slot: ad.slot,
    views,
    clicks,
    ctr,
  };
}
