import defaultSessionsJson from "../../../content/sessions/sessions.json";
import type { AdvisorSession } from "./types";

export const defaultSessions: AdvisorSession[] = defaultSessionsJson as AdvisorSession[];

/**
 * Checks whether a student is allowed to book a seat in an advisor session.
 */
export function canBookSession(
  session: AdvisorSession,
  bookedCount: number,
  now: Date = new Date(),
): { allowed: boolean; reason?: string } {
  if (session.status !== "scheduled") {
    return {
      allowed: false,
      reason: `Session is ${session.status}.`,
    };
  }

  const sessionTime = new Date(session.startsAt).getTime();
  if (sessionTime <= now.getTime()) {
    return {
      allowed: false,
      reason: "This session has already started or ended.",
    };
  }

  if (bookedCount >= session.capacity) {
    return {
      allowed: false,
      reason: "This session is full.",
    };
  }

  return { allowed: true };
}

/**
 * Checks whether an advisor is allowed to create another session this calendar week.
 * Enforces rule: maximum 2 sessions per week per advisor.
 */
export function canCreateSession(existingSessionsInWeek: number): { allowed: boolean; reason?: string } {
  if (existingSessionsInWeek >= 2) {
    return {
      allowed: false,
      reason: "Advisors can create at most 2 sessions per week.",
    };
  }
  return { allowed: true };
}

/**
 * Calculates platform fee and advisor earnings from a session booking or total pool.
 * Default revenue share is 70% advisor / 30% platform.
 */
export function calculateSessionPayout(
  amountBdt: number,
  revenueShare: number = 0.70,
): { advisorAmount: number; platformAmount: number } {
  if (amountBdt <= 0) {
    return { advisorAmount: 0, platformAmount: 0 };
  }
  const advisorAmount = Math.round(amountBdt * revenueShare);
  const platformAmount = amountBdt - advisorAmount;
  return { advisorAmount, platformAmount };
}

/**
 * Validates session creation parameters.
 */
export function validateSessionInput(input: Partial<AdvisorSession>): { valid: boolean; problems: string[] } {
  const problems: string[] = [];

  if (!input.title || input.title.trim().length < 5) {
    problems.push("Title must be at least 5 characters.");
  }

  if (!input.startsAt || Number.isNaN(new Date(input.startsAt).getTime())) {
    problems.push("A valid future start date and time is required.");
  } else if (new Date(input.startsAt).getTime() <= Date.now()) {
    problems.push("Start time must be in the future.");
  }

  const duration = input.durationMin ?? 60;
  if (duration < 30 || duration > 180) {
    problems.push("Duration must be between 30 and 180 minutes.");
  }

  const capacity = input.capacity ?? 25;
  if (capacity < 1 || capacity > 25) {
    problems.push("Capacity must be between 1 and 25 seats.");
  }

  if (input.priceBdt === undefined || input.priceBdt < 0) {
    problems.push("Price must be 0 BDT or greater.");
  }

  return {
    valid: problems.length === 0,
    problems,
  };
}
