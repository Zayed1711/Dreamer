"use client";

import type { EnglishLevel, Journey, Profile, Season, Stage, Degree } from "@dreamer/journey-engine";
import { supabase } from "./supabase";

/**
 * Where a student's data lives.
 * - Signed in with Supabase: the profiles, journeys and task_completions tables.
 * - Local preview mode (no Supabase keys): this browser's local storage.
 */

const PROFILE_KEY = "dreamer-profile";
const COMPLETED_KEY = "dreamer-preview-completed";

// ---------- Local storage ----------

function localGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function localSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function localClear() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(COMPLETED_KEY);
  } catch {}
}

// ---------- Mapping between Profile and the profiles table ----------

type ProfileRow = {
  stage: Stage | null;
  degree: Degree | null;
  english_level: EnglishLevel | null;
  countries: string[] | null;
  division: string | null;
  hsc_exam_year: number | null;
  graduation_year: number | null;
  graduation_month: number | null;
  intake_year: number | null;
  intake_season: Season | null;
};

function fromRow(row: ProfileRow | null): Profile | null {
  if (!row || !row.stage || !row.degree || !row.english_level) return null;
  return {
    stage: row.stage,
    degree: row.degree,
    englishLevel: row.english_level,
    countries: row.countries ?? [],
    ...(row.division ? { division: row.division } : {}),
    ...(row.hsc_exam_year ? { hscExamYear: row.hsc_exam_year } : {}),
    ...(row.graduation_year && row.graduation_month
      ? { graduation: { year: row.graduation_year, month: row.graduation_month } }
      : {}),
    ...(row.intake_year && row.intake_season ? { intake: { year: row.intake_year, season: row.intake_season } } : {}),
  };
}

function toRow(p: Profile): ProfileRow {
  return {
    stage: p.stage,
    degree: p.degree,
    english_level: p.englishLevel,
    countries: p.countries,
    division: p.division ?? null,
    hsc_exam_year: p.hscExamYear ?? null,
    graduation_year: p.graduation?.year ?? null,
    graduation_month: p.graduation?.month ?? null,
    intake_year: p.intake?.year ?? null,
    intake_season: p.intake?.season ?? null,
  };
}

// ---------- Session ----------

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  localClear();
}

// ---------- Student data ----------

export type StudentData = { profile: Profile | null; completed: string[] };

export async function loadStudent(): Promise<StudentData> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    return { profile: localGet<Profile>(PROFILE_KEY), completed: localGet<string[]>(COMPLETED_KEY) ?? [] };
  }
  const [profileRes, doneRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "stage, degree, english_level, countries, division, hsc_exam_year, graduation_year, graduation_month, intake_year, intake_season",
      )
      .eq("id", uid)
      .maybeSingle<ProfileRow>(),
    supabase.from("task_completions").select("task_id").eq("user_id", uid),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (doneRes.error) throw doneRes.error;
  return {
    profile: fromRow(profileRes.data),
    completed: (doneRes.data ?? []).map((r: { task_id: string }) => r.task_id),
  };
}

/** Saves the profile and stores the newly generated journey as the active one. */
export async function saveProfile(profile: Profile, journey: Journey): Promise<void> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    localSet(PROFILE_KEY, profile);
    return;
  }
  const { error } = await supabase.from("profiles").update(toRow(profile)).eq("id", uid);
  if (error) throw error;

  // One active journey per student: retire the old one, then add the new one.
  const retire = await supabase.from("journeys").update({ active: false }).eq("user_id", uid).eq("active", true);
  if (retire.error) throw retire.error;
  const insert = await supabase.from("journeys").insert({
    user_id: uid,
    template_key: journey.templateKey,
    generated_for: journey.generatedFor,
    data: journey,
  });
  if (insert.error) throw insert.error;
}

export async function setTaskDone(taskIdValue: string, done: boolean, allCompleted: Iterable<string>): Promise<void> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    localSet(COMPLETED_KEY, [...allCompleted]);
    return;
  }
  const res = done
    ? await supabase.from("task_completions").upsert({ user_id: uid, task_id: taskIdValue }, { ignoreDuplicates: true })
    : await supabase.from("task_completions").delete().eq("user_id", uid).eq("task_id", taskIdValue);
  if (res.error) throw res.error;
}

/**
 * After a student signs in on a browser where they already used the preview,
 * move that local progress into their account (only if the account has no profile yet).
 */
export async function moveLocalProgressToAccount(): Promise<void> {
  const uid = await currentUserId();
  if (!supabase || !uid) return;
  const localProfile = localGet<Profile>(PROFILE_KEY);
  const localDone = localGet<string[]>(COMPLETED_KEY) ?? [];
  if (!localProfile && localDone.length === 0) return;

  const cloud = await loadStudent();
  if (!cloud.profile && localProfile) {
    const { error } = await supabase.from("profiles").update(toRow(localProfile)).eq("id", uid);
    if (error) throw error;
  }
  if (localDone.length > 0) {
    const { error } = await supabase
      .from("task_completions")
      .upsert(localDone.map((task_id) => ({ user_id: uid, task_id })), { ignoreDuplicates: true });
    if (error) throw error;
  }
  localClear();
}
