"use client";

import {
  type EnglishLevel,
  type Journey,
  type Profile,
  type Season,
  type Stage,
  type Degree,
  type DailyStreak,
  computeWeeklyStreak,
  nextStreak,
  questDate,
} from "@dreamer/journey-engine";
import { supabase } from "./supabase";

/**
 * Where a student's data lives.
 * - Signed in with Supabase: the profiles, journeys and task_completions tables.
 * - Local preview mode (no Supabase keys): this browser's local storage.
 */

const PROFILE_KEY = "dreamer-profile";
const COMPLETED_KEY = "dreamer-preview-completed";
const DAILY_KEY = "dreamer-preview-daily";
const ACTIVITY_KEY = "dreamer-preview-activity";
const STREAKS_KEY = "dreamer-preview-streaks";
const PRACTICE_KEY = "dreamer-preview-practice";

export interface DailySubmission {
  quest_date: string;
  track: string;
  quest_type: string;
  payload: Record<string, unknown>;
  passed: boolean;
  exp: number;
}

export interface DailyState {
  todaySubmission: DailySubmission | null;
  streak: DailyStreak;
  extraExp: number;
  learnedWords: string[];
  isDoneToday: boolean;
}

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
    localStorage.removeItem(DAILY_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
    localStorage.removeItem(STREAKS_KEY);
    localStorage.removeItem(PRACTICE_KEY);
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

export type StudentData = { profile: Profile | null; completed: string[]; extraExp: number };

export async function loadStudent(): Promise<StudentData> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    const dailySubmissions = localGet<Record<string, DailySubmission>>(DAILY_KEY) ?? {};
    const dailyExp = Object.values(dailySubmissions)
      .filter((s) => s.passed)
      .reduce((sum, s) => sum + (s.exp || 0), 0);
    const practices = localGet<string[]>(PRACTICE_KEY) ?? [];
    const extraExp = dailyExp + practices.length * 20;
    return {
      profile: localGet<Profile>(PROFILE_KEY),
      completed: localGet<string[]>(COMPLETED_KEY) ?? [],
      extraExp,
    };
  }
  const [profileRes, doneRes, expRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "stage, degree, english_level, countries, division, hsc_exam_year, graduation_year, graduation_month, intake_year, intake_season",
      )
      .eq("id", uid)
      .maybeSingle<ProfileRow>(),
    supabase.from("task_completions").select("task_id").eq("user_id", uid),
    supabase.from("daily_quest_submissions").select("exp, passed").eq("user_id", uid),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (doneRes.error) throw doneRes.error;
  const extraExp = (expRes.data ?? [])
    .filter((r: { exp: number; passed: boolean }) => r.passed)
    .reduce((sum: number, r: { exp: number }) => sum + (r.exp || 0), 0);
  return {
    profile: fromRow(profileRes.data),
    completed: (doneRes.data ?? []).map((r: { task_id: string }) => r.task_id),
    extraExp,
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
  const today = questDate();
  if (!supabase || !uid) {
    localSet(COMPLETED_KEY, [...allCompleted]);
    if (done) {
      const days = localGet<string[]>(ACTIVITY_KEY) ?? [];
      if (!days.includes(today)) {
        localSet(ACTIVITY_KEY, [...days, today]);
      }
    }
    return;
  }
  const res = done
    ? await supabase.from("task_completions").upsert({ user_id: uid, task_id: taskIdValue }, { ignoreDuplicates: true })
    : await supabase.from("task_completions").delete().eq("user_id", uid).eq("task_id", taskIdValue);
  if (res.error) throw res.error;

  if (done) {
    await supabase.from("activity_days").upsert({ user_id: uid, day: today }, { ignoreDuplicates: true });
  }
}

// ---------- Daily Quests & Streaks ----------

export async function loadDailyState(track: string = "english", forDate: string = questDate()): Promise<DailyState> {
  const uid = await currentUserId();
  const defaultStreak: DailyStreak = {
    currentCount: 0,
    bestCount: 0,
    lastPeriod: "",
    freezesLeft: 2,
    freezesResetAt: forDate,
  };

  if (!supabase || !uid) {
    const submissions = localGet<Record<string, DailySubmission>>(DAILY_KEY) ?? {};
    const streaks = localGet<Record<string, DailyStreak>>(STREAKS_KEY) ?? {};
    const streak = streaks[`daily_${track}`] ?? defaultStreak;

    const list = Object.values(submissions).filter((s) => s.track === track && s.passed);
    const extraExp = list.reduce((sum, s) => sum + (s.exp || 0), 0);

    const learnedWords: string[] = [];
    for (const sub of list) {
      if (sub.quest_type === "words" && Array.isArray(sub.payload?.words)) {
        learnedWords.push(...(sub.payload.words as string[]));
      }
    }

    const todaySub = submissions[`${forDate}_${track}`] ?? null;

    return {
      todaySubmission: todaySub,
      streak,
      extraExp,
      learnedWords: Array.from(new Set(learnedWords)),
      isDoneToday: Boolean(todaySub && todaySub.passed),
    };
  }

  const [subsRes, streakRes] = await Promise.all([
    supabase
      .from("daily_quest_submissions")
      .select("quest_date, track, quest_type, payload, passed, exp")
      .eq("user_id", uid)
      .eq("track", track),
    supabase
      .from("streaks")
      .select("current_count, best_count, last_period, freezes_left, freezes_reset_at")
      .eq("user_id", uid)
      .eq("kind", `daily_${track}`)
      .maybeSingle(),
  ]);

  if (subsRes.error) throw subsRes.error;
  const submissions: DailySubmission[] = (subsRes.data ?? []).map((r) => ({
    quest_date: r.quest_date,
    track: r.track,
    quest_type: r.quest_type,
    payload: r.payload as Record<string, unknown>,
    passed: r.passed,
    exp: r.exp,
  }));

  const streak: DailyStreak = streakRes.data
    ? {
        currentCount: streakRes.data.current_count,
        bestCount: streakRes.data.best_count,
        lastPeriod: streakRes.data.last_period ?? "",
        freezesLeft: streakRes.data.freezes_left,
        freezesResetAt: streakRes.data.freezes_reset_at ?? forDate,
      }
    : defaultStreak;

  const passedSubs = submissions.filter((s) => s.passed);
  const extraExp = passedSubs.reduce((sum, s) => sum + (s.exp || 0), 0);

  const learnedWords: string[] = [];
  for (const s of passedSubs) {
    if (s.quest_type === "words" && Array.isArray(s.payload?.words)) {
      learnedWords.push(...(s.payload.words as string[]));
    }
  }

  const todaySub = submissions.find((s) => s.quest_date === forDate) ?? null;

  return {
    todaySubmission: todaySub,
    streak,
    extraExp,
    learnedWords: Array.from(new Set(learnedWords)),
    isDoneToday: Boolean(todaySub && todaySub.passed),
  };
}

export async function submitDailyQuest(
  questDateStr: string,
  track: string,
  questType: string,
  payload: Record<string, unknown>,
  exp: number = 20,
  options?: { holding?: boolean },
): Promise<DailyState> {
  const uid = await currentUserId();
  const cappedExp = Math.min(20, Math.max(0, exp));

  if (!supabase || !uid) {
    const submissions = localGet<Record<string, DailySubmission>>(DAILY_KEY) ?? {};
    const streaks = localGet<Record<string, DailyStreak>>(STREAKS_KEY) ?? {};
    const currentStreak = streaks[`daily_${track}`] ?? null;

    const existing = submissions[`${questDateStr}_${track}`];
    // Daily cap of 20 EXP: if already scored today, exp is 0
    const finalExp = existing && existing.passed ? 0 : cappedExp;

    submissions[`${questDateStr}_${track}`] = {
      quest_date: questDateStr,
      track,
      quest_type: questType,
      payload,
      passed: true,
      exp: finalExp,
    };
    localSet(DAILY_KEY, submissions);

    // Record activity day
    const activities = localGet<string[]>(ACTIVITY_KEY) ?? [];
    if (!activities.includes(questDateStr)) {
      localSet(ACTIVITY_KEY, [...activities, questDateStr]);
    }

    // Update streak
    const updatedStreak = nextStreak(currentStreak, questDateStr, options);
    streaks[`daily_${track}`] = updatedStreak;
    localSet(STREAKS_KEY, streaks);

    return loadDailyState(track, questDateStr);
  }

  // Supabase mode
  const current = await loadDailyState(track, questDateStr);
  const finalExp = current.isDoneToday ? 0 : cappedExp;

  const subRes = await supabase.from("daily_quest_submissions").upsert(
    {
      user_id: uid,
      quest_date: questDateStr,
      track,
      quest_type: questType,
      payload,
      passed: true,
      exp: finalExp,
    },
    { onConflict: "user_id,quest_date,track" },
  );
  if (subRes.error) throw subRes.error;

  // Record activity day
  await supabase.from("activity_days").upsert({ user_id: uid, day: questDateStr }, { ignoreDuplicates: true });

  // Update streak
  const updatedStreak = nextStreak(current.streak.currentCount > 0 ? current.streak : null, questDateStr, options);
  await supabase.from("streaks").upsert(
    {
      user_id: uid,
      kind: `daily_${track}`,
      current_count: updatedStreak.currentCount,
      best_count: updatedStreak.bestCount,
      last_period: updatedStreak.lastPeriod,
      freezes_left: updatedStreak.freezesLeft,
      freezes_reset_at: updatedStreak.freezesResetAt,
    },
    { onConflict: "user_id,kind" },
  );

  return loadDailyState(track, questDateStr);
}

// ---------- Weekly Journey Streak & Activity Days ----------

export async function loadActivityDays(): Promise<string[]> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    return localGet<string[]>(ACTIVITY_KEY) ?? [];
  }
  const { data, error } = await supabase
    .from("activity_days")
    .select("day")
    .eq("user_id", uid)
    .order("day", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: { day: string }) => r.day);
}

export async function loadWeeklyStreak(
  forDate: string = questDate(),
  options: { holding?: boolean } = {},
): Promise<DailyStreak> {
  const uid = await currentUserId();
  const activityDays = await loadActivityDays();
  const streak = computeWeeklyStreak(activityDays, forDate, options);

  if (!supabase || !uid) {
    const streaks = localGet<Record<string, DailyStreak>>(STREAKS_KEY) ?? {};
    streaks["weekly_journey"] = streak;
    localSet(STREAKS_KEY, streaks);
    return streak;
  }

  await supabase.from("streaks").upsert(
    {
      user_id: uid,
      kind: "weekly_journey",
      current_count: streak.currentCount,
      best_count: streak.bestCount,
      last_period: streak.lastPeriod,
      freezes_left: streak.freezesLeft,
      freezes_reset_at: streak.freezesResetAt,
    },
    { onConflict: "user_id,kind" },
  );

  return streak;
}

// ---------- Course Reading Practices ----------

export async function loadCompletedPractices(): Promise<string[]> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    return localGet<string[]>(PRACTICE_KEY) ?? [];
  }
  const { data } = await supabase
    .from("daily_quest_submissions")
    .select("payload")
    .eq("user_id", uid)
    .eq("quest_type", "reading_practice");
  return (data ?? [])
    .map((r: { payload: unknown }) => (r.payload as { practiceId?: string })?.practiceId)
    .filter(Boolean) as string[];
}

export async function submitPracticeCompletion(
  practiceId: string,
): Promise<{ expAwarded: number; totalCompleted: string[] }> {
  const uid = await currentUserId();
  const today = questDate();
  const completed = await loadCompletedPractices();
  if (completed.includes(practiceId)) {
    return { expAwarded: 0, totalCompleted: completed };
  }

  const expAwarded = 20;
  const updatedCompleted = [...completed, practiceId];

  if (!supabase || !uid) {
    localSet(PRACTICE_KEY, updatedCompleted);
    // Record activity day
    const days = localGet<string[]>(ACTIVITY_KEY) ?? [];
    if (!days.includes(today)) {
      localSet(ACTIVITY_KEY, [...days, today]);
    }
    return { expAwarded, totalCompleted: updatedCompleted };
  }

  // Supabase mode
  await Promise.all([
    supabase.from("daily_quest_submissions").upsert(
      {
        user_id: uid,
        quest_date: today,
        track: "practice",
        quest_type: "reading_practice",
        payload: { practiceId },
        passed: true,
        exp: expAwarded,
      },
      { onConflict: "user_id,quest_date,track" },
    ),
    supabase.from("activity_days").upsert({ user_id: uid, day: today }, { ignoreDuplicates: true }),
  ]);

  return { expAwarded, totalCompleted: updatedCompleted };
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

  // Migrate daily submissions
  const localDaily = localGet<Record<string, DailySubmission>>(DAILY_KEY) ?? {};
  const localDailyList = Object.values(localDaily);
  if (localDailyList.length > 0) {
    await supabase.from("daily_quest_submissions").upsert(
      localDailyList.map((s) => ({
        user_id: uid,
        quest_date: s.quest_date,
        track: s.track,
        quest_type: s.quest_type,
        payload: s.payload,
        passed: s.passed,
        exp: s.exp,
      })),
      { onConflict: "user_id,quest_date,track" },
    );
  }

  // Migrate activity days
  const localActivities = localGet<string[]>(ACTIVITY_KEY) ?? [];
  if (localActivities.length > 0) {
    await supabase.from("activity_days").upsert(
      localActivities.map((day) => ({ user_id: uid, day })),
      { ignoreDuplicates: true },
    );
  }

  // Migrate streaks
  const localStreaks = localGet<Record<string, DailyStreak>>(STREAKS_KEY) ?? {};
  for (const [kind, s] of Object.entries(localStreaks)) {
    await supabase.from("streaks").upsert(
      {
        user_id: uid,
        kind,
        current_count: s.currentCount,
        best_count: s.bestCount,
        last_period: s.lastPeriod,
        freezes_left: s.freezesLeft,
        freezes_reset_at: s.freezesResetAt,
      },
      { onConflict: "user_id,kind" },
    );
  }

  // Migrate completed practice sets
  const localPractices = localGet<string[]>(PRACTICE_KEY) ?? [];
  if (localPractices.length > 0) {
    const today = questDate();
    await supabase.from("daily_quest_submissions").upsert(
      localPractices.map((practiceId) => ({
        user_id: uid,
        quest_date: today,
        track: "practice",
        quest_type: "reading_practice",
        payload: { practiceId },
        passed: true,
        exp: 20,
      })),
      { onConflict: "user_id,quest_date,track" },
    );
  }

  localClear();
}
