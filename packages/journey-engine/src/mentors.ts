import mentorsJson from "../../../content/mentors/mentors.json";
import type { MentorApplicationInput, MentorProfile } from "./types";

export const defaultMentors: MentorProfile[] = mentorsJson.mentors as MentorProfile[];

/**
 * Filters approved mentor profiles by destination country, specific guidance topic,
 * or Founding Mentor status.
 */
export function filterMentors(
  mentors: MentorProfile[],
  filters?: {
    country?: string;
    topic?: string;
    foundingOnly?: boolean;
  },
): MentorProfile[] {
  let list = mentors.filter((m) => m.status === "approved");

  if (filters?.country && filters.country !== "ALL") {
    const target = filters.country.toUpperCase();
    list = list.filter((m) => m.country.toUpperCase() === target);
  }

  if (filters?.topic && filters.topic !== "ALL") {
    list = list.filter((m) => m.topics.includes(filters.topic!));
  }

  if (filters?.foundingOnly) {
    list = list.filter((m) => m.isFounding);
  }

  return list;
}

/**
 * Finds approved mentors matching an advisorTopic from milestone definitions.
 */
export function findMentorsForTopic(
  mentors: MentorProfile[],
  topic: string,
): MentorProfile[] {
  if (!topic) return [];
  return mentors.filter((m) => m.status === "approved" && m.topics.includes(topic));
}

/**
 * Validates a mentor / advisor verification application.
 * Returns a list of friendly error problems if any validation rules fail.
 */
export function validateMentorApplication(
  input: MentorApplicationInput,
): { valid: boolean; problems: string[] } {
  const problems: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    problems.push("Please enter your full legal name.");
  }

  if (!input.university || input.university.trim().length < 3) {
    problems.push("Please specify your current or alma mater university.");
  }

  if (!input.country || input.country.trim().length !== 2) {
    problems.push("Please select your study-abroad destination country.");
  }

  if (!input.subject || input.subject.trim().length < 2) {
    problems.push("Please provide your subject or academic degree program.");
  }

  const currentYear = new Date().getFullYear();
  if (
    !input.intakeYear ||
    isNaN(input.intakeYear) ||
    input.intakeYear < 2000 ||
    input.intakeYear > currentYear + 2
  ) {
    problems.push(`Please enter a valid intake year between 2000 and ${currentYear + 2}.`);
  }

  if (!input.bio || input.bio.trim().length < 30) {
    problems.push("Please write a short bio of at least 30 characters sharing your journey.");
  }

  if (!input.topics || input.topics.length === 0) {
    problems.push("Please select at least one topic you feel confident advising students on.");
  }

  if (!input.proofFileName || input.proofFileName.trim().length === 0) {
    problems.push("Please upload a proof of enrollment, visa, or student ID card for verification.");
  }

  return {
    valid: problems.length === 0,
    problems,
  };
}
