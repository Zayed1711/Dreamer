import { describe, expect, it } from "vitest";
import {
  calculateAdStats,
  matchAd,
  pickActiveAd,
  pickFloatingAd,
  pickStageAd,
  pickTickerAds,
  validateAdInput,
  type Ad,
} from "../src";

describe("Ads & Targeting (Phase 7)", () => {
  const sampleAd: Ad = {
    id: "ad-ielts-1",
    advertiserId: "adv-british-council",
    advertiserName: "British Council",
    slot: "ielts_coaching",
    headline: "Official IELTS Preparation Courses",
    body: "Study with the co-creators of IELTS in Bangladesh.",
    linkUrl: "https://learnenglish.britishcouncil.org/ielts",
    referralCode: "DREAMER",
    targetStages: ["hsc1", "hsc2"],
    targetCountries: ["GB", "CA", "AU"],
    targetEnglish: ["beginner", "intermediate"],
    startsOn: "2026-01-01",
    endsOn: "2026-12-31",
    active: true,
  };

  describe("matchAd", () => {
    it("matches when slot, date, stage, country, and english align", () => {
      const match = matchAd(sampleAd, {
        slot: "ielts_coaching",
        stage: "hsc1",
        country: "GB",
        english: "intermediate",
        date: "2026-06-15",
      });
      expect(match).toBe(true);
    });

    it("rejects inactive ads", () => {
      const match = matchAd({ ...sampleAd, active: false }, {
        slot: "ielts_coaching",
        stage: "hsc1",
        country: "GB",
        english: "intermediate",
        date: "2026-06-15",
      });
      expect(match).toBe(false);
    });

    it("rejects when date is out of range", () => {
      expect(matchAd(sampleAd, { slot: "ielts_coaching", date: "2025-12-31" })).toBe(false);
      expect(matchAd(sampleAd, { slot: "ielts_coaching", date: "2027-01-01" })).toBe(false);
    });

    it("rejects when slot does not match", () => {
      const match = matchAd(sampleAd, {
        slot: "agency",
        stage: "hsc1",
        country: "GB",
        date: "2026-06-15",
      });
      expect(match).toBe(false);
    });

    it("enforces stage targeting", () => {
      expect(
        matchAd(sampleAd, {
          slot: "ielts_coaching",
          stage: "graduated", // not in targetStages
          country: "GB",
          english: "intermediate",
          date: "2026-06-15",
        }),
      ).toBe(false);
    });

    it("enforces country targeting case-insensitively", () => {
      expect(
        matchAd(sampleAd, {
          slot: "ielts_coaching",
          stage: "hsc1",
          country: "gb", // lowercase
          english: "intermediate",
          date: "2026-06-15",
        }),
      ).toBe(true);

      expect(
        matchAd(sampleAd, {
          slot: "ielts_coaching",
          stage: "hsc1",
          country: "DE", // not in targetCountries
          english: "intermediate",
          date: "2026-06-15",
        }),
      ).toBe(false);
    });

    it("allows any target when targeting arrays are empty", () => {
      const openAd: Ad = {
        ...sampleAd,
        targetStages: [],
        targetCountries: [],
        targetEnglish: [],
      };
      expect(
        matchAd(openAd, {
          slot: "ielts_coaching",
          stage: "graduated",
          country: "JP",
          english: "advanced",
          date: "2026-06-15",
        }),
      ).toBe(true);
    });
  });

  describe("pickActiveAd", () => {
    const adA: Ad = {
      ...sampleAd,
      id: "ad-a",
      startsOn: "2026-02-01",
    };
    const adB: Ad = {
      ...sampleAd,
      id: "ad-b",
      startsOn: "2026-01-01",
    };

    it("returns null when no ads match", () => {
      const res = pickActiveAd([sampleAd], { slot: "sat_coaching", date: "2026-06-01" });
      expect(res).toBeNull();
    });

    it("returns the earliest starting ad deterministically", () => {
      const res = pickActiveAd([adA, adB], {
        slot: "ielts_coaching",
        stage: "hsc1",
        country: "GB",
        english: "intermediate",
        date: "2026-06-01",
      });
      expect(res?.id).toBe("ad-b");
    });
  });

  describe("validateAdInput", () => {
    it("passes for valid ad input", () => {
      const res = validateAdInput(sampleAd);
      expect(res.valid).toBe(true);
      expect(res.problems).toHaveLength(0);
    });

    it("detects missing slot, short headline, invalid url, and invalid dates", () => {
      const res = validateAdInput({
        slot: "",
        headline: "Hi",
        linkUrl: "not-a-url",
        referralCode: "",
        startsOn: "2026-12-01",
        endsOn: "2026-01-01",
      });
      expect(res.valid).toBe(false);
      expect(res.problems.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("calculateAdStats", () => {
    it("correctly computes views, clicks, and CTR", () => {
      const events = [
        { adId: "ad-1", event: "view" as const },
        { adId: "ad-1", event: "view" as const },
        { adId: "ad-1", event: "click" as const },
        { adId: "ad-1", event: "view" as const },
        { adId: "ad-2", event: "view" as const },
      ];
      const stats = calculateAdStats(events, { ...sampleAd, id: "ad-1" });
      expect(stats.views).toBe(3);
      expect(stats.clicks).toBe(1);
      expect(stats.ctr).toBe(33.3);
    });

    it("handles zero views gracefully with 0% CTR", () => {
      const stats = calculateAdStats([], sampleAd);
      expect(stats.views).toBe(0);
      expect(stats.clicks).toBe(0);
      expect(stats.ctr).toBe(0);
    });
  });

  describe("pickTickerAds (Phase 12)", () => {
    const tickerAd1: Ad = {
      ...sampleAd,
      id: "ad-ticker-1",
      placement: "ticker",
      flightTag: "DAC ✈ BER",
    };
    const tickerAd2: Ad = {
      ...sampleAd,
      id: "ad-ticker-2",
      placement: "all",
      flightTag: "DAC ✈ LHR",
    };
    const modalOnlyAd: Ad = {
      ...sampleAd,
      id: "ad-modal-1",
      placement: "stage_modal",
    };

    it("filters ads eligible for airport FIDS ticker board", () => {
      const res = pickTickerAds([tickerAd1, tickerAd2, modalOnlyAd], 5, "2026-06-15");
      expect(res).toHaveLength(2);
      expect(res.map((a) => a.id)).toEqual(["ad-ticker-1", "ad-ticker-2"]);
    });

    it("respects maxCount limit", () => {
      const res = pickTickerAds([tickerAd1, tickerAd2], 1, "2026-06-15");
      expect(res).toHaveLength(1);
    });
  });

  describe("pickFloatingAd (Phase 12)", () => {
    const floatingAd: Ad = {
      ...sampleAd,
      id: "ad-float-1",
      placement: "floating",
      slot: "ielts_coaching",
    };

    it("matches and returns eligible floating ad", () => {
      const res = pickFloatingAd([floatingAd], {
        slot: "ielts_coaching",
        stage: "hsc1",
        country: "GB",
        english: "intermediate",
        date: "2026-06-15",
      });
      expect(res?.id).toBe("ad-float-1");
    });
  });

  describe("pickStageAd (Phase 12)", () => {
    const stageAd1: Ad = {
      ...sampleAd,
      id: "ad-stage-ielts",
      targetStages: ["ug2", "ug3"],
      placement: "stage_modal",
    };
    const stageAd2: Ad = {
      ...sampleAd,
      id: "ad-stage-visa",
      targetStages: ["ug4", "graduated"],
      placement: "stage_modal",
    };

    it("returns matching ad for the current stage", () => {
      const res = pickStageAd([stageAd1, stageAd2], "ug2", [], "2026-06-15");
      expect(res?.id).toBe("ad-stage-ielts");
    });

    it("respects dismissed ad IDs for user session", () => {
      const res = pickStageAd([stageAd1, stageAd2], "ug2", ["ad-stage-ielts"], "2026-06-15");
      expect(res).toBeNull();
    });
  });
});
