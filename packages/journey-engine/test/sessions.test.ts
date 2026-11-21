import { describe, expect, it } from "vitest";
import {
  calculateSessionPayout,
  canBookSession,
  canCreateSession,
  validateSessionInput,
  type AdvisorSession,
} from "../src";

describe("Advisor Sessions (Phase 7)", () => {
  const baseSession: AdvisorSession = {
    id: "sess-1",
    advisorId: "adv-tanvir",
    title: "German Master's SOP & Blocked Account Strategy",
    topic: "sop-review",
    startsAt: "2026-12-01T14:00:00Z",
    durationMin: 60,
    capacity: 25,
    priceBdt: 500,
    meetUrl: "https://meet.google.com/abc-defg-hij",
    status: "scheduled",
  };

  const fixedNow = new Date("2026-11-20T12:00:00Z");

  describe("canBookSession", () => {
    it("allows booking an upcoming scheduled session with free seats", () => {
      const res = canBookSession(baseSession, 10, fixedNow);
      expect(res.allowed).toBe(true);
      expect(res.reason).toBeUndefined();
    });

    it("rejects booking if session is cancelled or completed", () => {
      const res = canBookSession({ ...baseSession, status: "cancelled" }, 0, fixedNow);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("cancelled");
    });

    it("rejects booking if session is in the past", () => {
      const pastNow = new Date("2026-12-02T00:00:00Z");
      const res = canBookSession(baseSession, 0, pastNow);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("already started or ended");
    });

    it("rejects booking if session is at full capacity (25 seats)", () => {
      const res = canBookSession(baseSession, 25, fixedNow);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("full");
    });
  });

  describe("canCreateSession", () => {
    it("allows creating 1st and 2nd session in a week", () => {
      expect(canCreateSession(0).allowed).toBe(true);
      expect(canCreateSession(1).allowed).toBe(true);
    });

    it("rejects creating a 3rd session in the same week", () => {
      const res = canCreateSession(2);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("at most 2 sessions per week");
    });
  });

  describe("calculateSessionPayout", () => {
    it("calculates default 70% advisor / 30% platform split", () => {
      const split = calculateSessionPayout(1000);
      expect(split.advisorAmount).toBe(700);
      expect(split.platformAmount).toBe(300);
    });

    it("handles custom revenue share", () => {
      const split = calculateSessionPayout(1500, 0.80);
      expect(split.advisorAmount).toBe(1200);
      expect(split.platformAmount).toBe(300);
    });

    it("handles zero price sessions gracefully", () => {
      const split = calculateSessionPayout(0);
      expect(split.advisorAmount).toBe(0);
      expect(split.platformAmount).toBe(0);
    });
  });

  describe("validateSessionInput", () => {
    it("passes for valid session parameters", () => {
      const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const res = validateSessionInput({
        title: "How I Won the MEXT Scholarship in Tokyo",
        startsAt: futureDate,
        durationMin: 90,
        capacity: 20,
        priceBdt: 300,
      });
      expect(res.valid).toBe(true);
      expect(res.problems).toHaveLength(0);
    });

    it("rejects invalid title, past start time, out-of-range capacity, and negative price", () => {
      const res = validateSessionInput({
        title: "No",
        startsAt: "2020-01-01T00:00:00Z",
        durationMin: 200,
        capacity: 30,
        priceBdt: -50,
      });
      expect(res.valid).toBe(false);
      expect(res.problems.length).toBeGreaterThanOrEqual(4);
    });
  });
});
