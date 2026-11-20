import type { EnglishLevel, Stage } from "@dreamer/journey-engine";

export const STAGE_OPTIONS: { value: Stage; label: string; hint: string }[] = [
  { value: "hsc1", label: "HSC 1st year", hint: "Just started college" },
  { value: "hsc2", label: "HSC 2nd year", hint: "HSC exam is coming up" },
  { value: "after_hsc", label: "HSC exam done", hint: "Waiting for results, or just got them" },
  { value: "ug1", label: "University 1st year", hint: "" },
  { value: "ug2", label: "University 2nd year", hint: "" },
  { value: "ug3", label: "University 3rd year", hint: "" },
  { value: "ug4", label: "University final year", hint: "" },
  { value: "graduated", label: "Graduated", hint: "Studying or working after your degree" },
];

export const ENGLISH_OPTIONS: { value: EnglishLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Still building", hint: "Reading and speaking are hard for me. About IELTS 5 or below." },
  { value: "intermediate", label: "Getting there", hint: "I manage, but need practice. About IELTS 5.5 to 6.5." },
  { value: "advanced", label: "Comfortable", hint: "I read and speak with ease. About IELTS 7 or above." },
];

export const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "MY", name: "Malaysia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "FI", name: "Finland" },
  { code: "SE", name: "Sweden" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "CN", name: "China" },
  { code: "HU", name: "Hungary" },
  { code: "IT", name: "Italy" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
];

export const DIVISION_OPTIONS: { value: string; label: string }[] = [
  { value: "dhaka", label: "Dhaka" },
  { value: "chattogram", label: "Chattogram" },
  { value: "sylhet", label: "Sylhet" },
  { value: "rajshahi", label: "Rajshahi" },
  { value: "khulna", label: "Khulna" },
  { value: "barishal", label: "Barishal" },
  { value: "rangpur", label: "Rangpur" },
  { value: "mymensingh", label: "Mymensingh" },
];

export const isHscStage = (s: Stage) => s === "hsc1" || s === "hsc2" || s === "after_hsc";
