"use client";

import {
  type EnglishLevel,
  type Journey,
  type Profile,
  type Season,
  type Stage,
  type Degree,
  type DailyStreak,
  type LanguageCode,
  type LanguageProgress,
  type MentorApplicationInput,
  type MentorProfile,
  type Ad,
  type Advertiser,
  type AdEvent,
  type AdStats,
  type AdvisorSession,
  type SessionBooking,
  type PaymentRecord,
  type PayoutRecord,
  type PaymentProvider,
  type CountryInfo,
  type UniversityItem,
  defaultMentors,
  defaultCountries,
  defaultUniversities,
  listCountries,
  listUniversities,
  getCountryByCode,
  getUniversityById,
  defaultAdvertisers,
  defaultAds,
  defaultSessions,
  pickActiveAd,
  validateAdInput,
  calculateAdStats,
  canBookSession,
  canCreateSession,
  calculateSessionPayout,
  validateSessionInput,
  validateMentorApplication,
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
const LANG_PROGRESS_KEY = "dreamer-preview-lang";
const MENTOR_APP_KEY = "dreamer-preview-mentor-app";
const ADVERTISERS_KEY = "dreamer-preview-advertisers";
const ADS_KEY = "dreamer-preview-ads";
const AD_EVENTS_KEY = "dreamer-preview-ad-events";
const SESSIONS_KEY = "dreamer-preview-sessions";
const BOOKINGS_KEY = "dreamer-preview-bookings";
const PAYMENTS_KEY = "dreamer-preview-payments";
const PAYOUTS_KEY = "dreamer-preview-payouts";
const ADMIN_ROLE_KEY = "dreamer-preview-is-admin";

export { calculateSessionPayout };

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

// ---------- Language Track Progress ----------

export async function loadLanguageProgress(lang: LanguageCode): Promise<LanguageProgress> {
  const uid = await currentUserId();
  const defaultProgress: LanguageProgress = {
    lang,
    level: 1,
    quizzesCompleted: 0,
  };

  if (!supabase || !uid) {
    return localGet<LanguageProgress>(`${LANG_PROGRESS_KEY}_${lang}`) ?? defaultProgress;
  }

  const { data, error } = await supabase
    .from("language_progress")
    .select("lang, level, quizzes_completed, updated_at")
    .eq("user_id", uid)
    .eq("lang", lang)
    .maybeSingle();

  if (error || !data) return defaultProgress;
  return {
    lang: data.lang as LanguageCode,
    level: data.level,
    quizzesCompleted: data.quizzes_completed,
    updatedAt: data.updated_at,
  };
}

export async function saveLanguageProgress(progress: LanguageProgress): Promise<void> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    localSet(`${LANG_PROGRESS_KEY}_${progress.lang}`, progress);
    return;
  }

  await supabase.from("language_progress").upsert(
    {
      user_id: uid,
      lang: progress.lang,
      level: progress.level,
      quizzes_completed: progress.quizzesCompleted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lang" },
  );
}

// ---------- Mentors & Advisors ----------

interface AdvisorRow {
  user_id: string;
  university: string;
  country: string;
  subject: string;
  intake_year: number;
  bio: string;
  photo_path: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  topics: string[] | null;
  is_founding: boolean | null;
  profiles: { display_name?: string } | null;
}

// ---------- Destination Countries (Phase 9) ----------

export async function loadCountries(): Promise<CountryInfo[]> {
  return listCountries();
}

export async function loadCountryByCode(code: string): Promise<CountryInfo | null> {
  const country = getCountryByCode(defaultCountries, code);
  return country ?? null;
}

// ---------- University Search & Applications (Phase 10) ----------

export async function loadUniversities(): Promise<UniversityItem[]> {
  return listUniversities();
}

export async function loadUniversityById(id: string): Promise<UniversityItem | null> {
  const uni = getUniversityById(defaultUniversities, id);
  return uni ?? null;
}


export async function loadMentors(): Promise<MentorProfile[]> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    return defaultMentors;
  }

  const { data, error } = await supabase
    .from("advisors")
    .select(
      "user_id, university, country, subject, intake_year, bio, photo_path, status, topics, is_founding, profiles (display_name)",
    )
    .eq("status", "approved");

  if (error || !data || data.length === 0) {
    return defaultMentors;
  }

  const dbMentors: MentorProfile[] = (data as unknown as AdvisorRow[]).map((row) => ({
    id: row.user_id,
    name: row.profiles?.display_name || "Verified Mentor",
    university: row.university,
    country: row.country,
    subject: row.subject,
    intakeYear: row.intake_year,
    bio: row.bio,
    photoPath: row.photo_path ?? undefined,
    topics: row.topics ?? [],
    isFounding: Boolean(row.is_founding),
    status: row.status,
  }));

  const existingIds = new Set(dbMentors.map((m) => m.id));
  const merged = [...dbMentors, ...defaultMentors.filter((m) => !existingIds.has(m.id))];
  return merged;
}

export async function loadMentorById(id: string): Promise<MentorProfile | null> {
  const mentors = await loadMentors();
  return mentors.find((m) => m.id === id) ?? null;
}

export async function submitMentorApplication(
  input: MentorApplicationInput,
  proofFile?: File | Blob,
): Promise<{ success: boolean; id: string; error?: string }> {
  const check = validateMentorApplication(input);
  if (!check.valid) {
    return { success: false, id: "", error: check.problems.join(" ") };
  }

  const uid = await currentUserId();
  if (!supabase || !uid) {
    localSet(MENTOR_APP_KEY, { ...input, status: "pending", submittedAt: new Date().toISOString() });
    return { success: true, id: "preview-mentor-app" };
  }

  let proofPath = "";
  if (proofFile) {
    const ext = input.proofFileName ? input.proofFileName.split(".").pop() : "pdf";
    const filename = `${uid}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("advisor-proofs")
      .upload(filename, proofFile, { upsert: true });

    if (!uploadErr && uploadData) {
      proofPath = uploadData.path;
    }
  }

  await supabase.from("profiles").update({ display_name: input.name }).eq("id", uid);

  const { error } = await supabase.from("advisors").upsert(
    {
      user_id: uid,
      university: input.university,
      country: input.country.toUpperCase(),
      subject: input.subject,
      intake_year: input.intakeYear,
      bio: input.bio,
      topics: input.topics,
      proof_path: proofPath || input.proofFileName || "proof_attached",
      status: "pending",
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { success: false, id: "", error: error.message };
  }

  return { success: true, id: uid };
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

  // Migrate language progress
  for (const lang of ["de", "ja"] as const) {
    const localProg = localGet<LanguageProgress>(`${LANG_PROGRESS_KEY}_${lang}`);
    if (localProg) {
      await supabase.from("language_progress").upsert(
        {
          user_id: uid,
          lang: localProg.lang,
          level: localProg.level,
          quizzes_completed: localProg.quizzesCompleted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lang" },
      );
    }
  }

  localClear();
}

// ---------- Phase 7: Advertisers, Ads & Tracking ----------

interface AdDbRow {
  id: string;
  advertiser_id: string;
  slot: string;
  headline: string;
  body: string;
  link_url: string;
  image_path: string | null;
  referral_code: string;
  target_stages: Stage[];
  target_countries: string[];
  target_english: EnglishLevel[];
  starts_on: string;
  ends_on: string;
  active: boolean;
  created_at: string;
  advertisers?: { name: string; standards_accepted_at: string | null } | null;
}

export async function loadAdvertisers(): Promise<Advertiser[]> {
  if (!supabase) {
    return localGet<Advertiser[]>(ADVERTISERS_KEY) ?? defaultAdvertisers;
  }
  const { data, error } = await supabase.from("advertisers").select("*").order("created_at", { ascending: false });
  if (error || !data || data.length === 0) {
    return localGet<Advertiser[]>(ADVERTISERS_KEY) ?? defaultAdvertisers;
  }
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    standardsAcceptedAt: row.standards_accepted_at ?? undefined,
    status: row.status,
    contact: row.contact ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function saveAdvertiser(adv: Partial<Advertiser>): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!adv.name || adv.name.trim().length === 0) {
    return { success: false, error: "Advertiser name is required." };
  }
  const id = adv.id || `adv-${Date.now()}`;
  const now = new Date().toISOString();
  const record: Advertiser = {
    id,
    name: adv.name.trim(),
    type: adv.type || "other",
    standardsAcceptedAt: adv.standardsAcceptedAt ?? (adv.status === "active" ? now : undefined),
    status: adv.status || "active",
    contact: adv.contact?.trim(),
    createdAt: adv.createdAt || now,
  };

  if (!supabase) {
    const list = localGet<Advertiser[]>(ADVERTISERS_KEY) ?? [...defaultAdvertisers];
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    localSet(ADVERTISERS_KEY, list);
    return { success: true, id };
  }

  const { error } = await supabase.from("advertisers").upsert({
    id: record.id,
    name: record.name,
    type: record.type,
    standards_accepted_at: record.standardsAcceptedAt ?? null,
    status: record.status,
    contact: record.contact ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, id };
}

export async function loadAds(): Promise<Ad[]> {
  if (!supabase) {
    return localGet<Ad[]>(ADS_KEY) ?? defaultAds;
  }
  const { data, error } = await supabase
    .from("ads")
    .select("*, advertisers (name, standards_accepted_at)")
    .order("starts_on", { ascending: true });

  if (error || !data || data.length === 0) {
    return localGet<Ad[]>(ADS_KEY) ?? defaultAds;
  }

  const rows = data as unknown as AdDbRow[];
  return rows.map((row) => ({
    id: row.id,
    advertiserId: row.advertiser_id,
    advertiserName: row.advertisers?.name,
    standardsAcceptedAt: row.advertisers?.standards_accepted_at ?? undefined,
    slot: row.slot,
    headline: row.headline,
    body: row.body,
    linkUrl: row.link_url,
    imagePath: row.image_path ?? undefined,
    referralCode: row.referral_code,
    targetStages: row.target_stages ?? [],
    targetCountries: row.target_countries ?? [],
    targetEnglish: row.target_english ?? [],
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    active: row.active,
    createdAt: row.created_at,
  }));
}

export async function saveAd(adInput: Partial<Ad>): Promise<{ success: boolean; id?: string; error?: string }> {
  const check = validateAdInput(adInput);
  if (!check.valid) {
    return { success: false, error: check.problems.join(" ") };
  }

  const id = adInput.id || `ad-${Date.now()}`;
  const now = new Date().toISOString();
  const record: Ad = {
    id,
    advertiserId: adInput.advertiserId || "adv-general",
    advertiserName: adInput.advertiserName,
    slot: adInput.slot!,
    headline: adInput.headline!.trim(),
    body: adInput.body?.trim() ?? "",
    linkUrl: adInput.linkUrl!.trim(),
    imagePath: adInput.imagePath,
    referralCode: adInput.referralCode!.trim(),
    targetStages: adInput.targetStages ?? [],
    targetCountries: adInput.targetCountries ?? [],
    targetEnglish: adInput.targetEnglish ?? [],
    startsOn: adInput.startsOn!,
    endsOn: adInput.endsOn!,
    active: adInput.active ?? true,
    createdAt: adInput.createdAt || now,
  };

  if (!supabase) {
    const list = localGet<Ad[]>(ADS_KEY) ?? [...defaultAds];
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    localSet(ADS_KEY, list);
    return { success: true, id };
  }

  const { error } = await supabase.from("ads").upsert({
    id: record.id,
    advertiser_id: record.advertiserId,
    slot: record.slot,
    headline: record.headline,
    body: record.body,
    link_url: record.linkUrl,
    image_path: record.imagePath ?? null,
    referral_code: record.referralCode,
    target_stages: record.targetStages,
    target_countries: record.targetCountries,
    target_english: record.targetEnglish,
    starts_on: record.startsOn,
    ends_on: record.endsOn,
    active: record.active,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, id };
}

export async function loadActiveAdForSlot(
  slot: string,
  context: { stage?: Stage; country?: string; english?: EnglishLevel },
): Promise<Ad | null> {
  const ads = await loadAds();
  return pickActiveAd(ads, {
    slot,
    stage: context.stage,
    country: context.country,
    english: context.english,
  });
}

/**
 * Records an ad impression (view) or click strictly WITHOUT user ID.
 * Advertisers never receive identifiable student telemetry.
 */
export async function recordAdEvent(
  adId: string,
  event: "view" | "click",
  milestoneKey?: string,
  stage?: Stage,
): Promise<void> {
  if (!supabase) {
    const events = localGet<AdEvent[]>(AD_EVENTS_KEY) ?? [];
    events.push({
      adId,
      event,
      milestoneKey,
      stage,
      createdAt: new Date().toISOString(),
    });
    localSet(AD_EVENTS_KEY, events);
    return;
  }

  await supabase.from("ad_events").insert({
    ad_id: adId,
    event,
    milestone_key: milestoneKey ?? null,
    stage: stage ?? null,
  });
}

export async function loadAdEvents(): Promise<AdEvent[]> {
  if (!supabase) {
    return localGet<AdEvent[]>(AD_EVENTS_KEY) ?? [];
  }
  const { data } = await supabase.from("ad_events").select("*");
  if (!data) return [];
  return data.map((d) => ({
    id: d.id,
    adId: d.ad_id,
    event: d.event,
    milestoneKey: d.milestone_key ?? undefined,
    stage: d.stage ?? undefined,
    createdAt: d.created_at,
  }));
}

// ---------- Phase 7: Advisor Sessions & Bookings ----------

interface SessionDbRow {
  id: string;
  advisor_id: string;
  title: string;
  topic: string | null;
  starts_at: string;
  duration_min: number;
  capacity: number;
  price_bdt: number;
  meet_url: string | null;
  status: "scheduled" | "running" | "completed" | "cancelled";
  created_at: string;
  advisors?: {
    university: string;
    country: string;
    profiles?: { display_name?: string } | null;
  } | null;
}

export async function loadSessions(options?: { topic?: string; advisorId?: string }): Promise<AdvisorSession[]> {
  if (!supabase) {
    const list = localGet<AdvisorSession[]>(SESSIONS_KEY) ?? defaultSessions;
    return list.filter((s) => {
      if (options?.topic && s.topic !== options.topic) return false;
      if (options?.advisorId && s.advisorId !== options.advisorId) return false;
      return true;
    });
  }

  let query = supabase
    .from("advisor_sessions")
    .select("*, advisors (university, country, profiles (display_name))")
    .order("starts_at", { ascending: true });

  if (options?.topic) query = query.eq("topic", options.topic);
  if (options?.advisorId) query = query.eq("advisor_id", options.advisorId);

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    const list = localGet<AdvisorSession[]>(SESSIONS_KEY) ?? defaultSessions;
    return list.filter((s) => {
      if (options?.topic && s.topic !== options.topic) return false;
      if (options?.advisorId && s.advisorId !== options.advisorId) return false;
      return true;
    });
  }

  const rows = data as unknown as SessionDbRow[];
  return rows.map((r) => ({
    id: r.id,
    advisorId: r.advisor_id,
    advisorName: r.advisors?.profiles?.display_name || "Verified Mentor",
    advisorUniversity: r.advisors?.university,
    advisorCountry: r.advisors?.country,
    title: r.title,
    topic: r.topic ?? undefined,
    startsAt: r.starts_at,
    durationMin: r.duration_min,
    capacity: r.capacity,
    priceBdt: r.price_bdt,
    meetUrl: r.meet_url ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function loadSessionsForTopic(topic: string): Promise<AdvisorSession[]> {
  return loadSessions({ topic });
}

export async function loadSessionsForMentor(advisorId: string): Promise<AdvisorSession[]> {
  return loadSessions({ advisorId });
}

export async function createAdvisorSession(
  input: Partial<AdvisorSession>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const check = validateSessionInput(input);
  if (!check.valid) {
    return { success: false, error: check.problems.join(" ") };
  }

  const existingSessions = await loadSessions({ advisorId: input.advisorId });
  // Check 2 sessions per week limit
  const sessionDate = new Date(input.startsAt!);
  const weekStart = new Date(sessionDate);
  weekStart.setUTCDate(sessionDate.getUTCDate() - ((sessionDate.getUTCDay() + 6) % 7));
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

  const sessionsThisWeek = existingSessions.filter((s) => {
    const d = new Date(s.startsAt);
    return d >= weekStart && d < weekEnd && s.status !== "cancelled";
  });

  const quota = canCreateSession(sessionsThisWeek.length);
  if (!quota.allowed) {
    return { success: false, error: quota.reason };
  }

  const id = input.id || `sess-${Date.now()}`;
  const record: AdvisorSession = {
    id,
    advisorId: input.advisorId || "current-advisor",
    advisorName: input.advisorName,
    advisorUniversity: input.advisorUniversity,
    advisorCountry: input.advisorCountry,
    title: input.title!.trim(),
    topic: input.topic,
    startsAt: input.startsAt!,
    durationMin: input.durationMin ?? 60,
    capacity: input.capacity ?? 25,
    priceBdt: input.priceBdt ?? 0,
    meetUrl: input.meetUrl?.trim() || "https://meet.google.com/new",
    status: "scheduled",
    createdAt: new Date().toISOString(),
    bookingsCount: 0,
  };

  if (!supabase) {
    const list = localGet<AdvisorSession[]>(SESSIONS_KEY) ?? [...defaultSessions];
    list.push(record);
    localSet(SESSIONS_KEY, list);
    return { success: true, id };
  }

  const { error } = await supabase.from("advisor_sessions").insert({
    id: record.id,
    advisor_id: record.advisorId,
    title: record.title,
    topic: record.topic ?? null,
    starts_at: record.startsAt,
    duration_min: record.durationMin,
    capacity: record.capacity,
    price_bdt: record.priceBdt,
    meet_url: record.meetUrl ?? null,
    status: record.status,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, id };
}

export async function bookSession(
  sessionId: string,
): Promise<{ success: boolean; bookingId?: string; status?: "confirmed" | "pending_payment"; error?: string }> {
  const sessions = await loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return { success: false, error: "Session not found." };

  const allBookings = !supabase
    ? (localGet<SessionBooking[]>(BOOKINGS_KEY) ?? [])
    : [];
  const currentCount = session.bookingsCount ?? allBookings.filter((b) => b.sessionId === sessionId && b.status !== "cancelled").length;

  const check = canBookSession(session, currentCount);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  const bookingId = `book-${Date.now()}`;
  const status = session.priceBdt === 0 ? "confirmed" : "pending_payment";
  const uid = (await currentUserId()) || "preview-student";

  const booking: SessionBooking = {
    id: bookingId,
    sessionId,
    studentId: uid,
    status,
    createdAt: new Date().toISOString(),
    session,
  };

  if (!supabase) {
    allBookings.push(booking);
    localSet(BOOKINGS_KEY, allBookings);
    return { success: true, bookingId, status };
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      session_id: sessionId,
      student_id: uid,
      status,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, bookingId: data.id, status: data.status };
}

export async function loadStudentBookings(): Promise<SessionBooking[]> {
  const uid = await currentUserId();
  if (!supabase || !uid) {
    const list = localGet<SessionBooking[]>(BOOKINGS_KEY) ?? [];
    return list;
  }
  const { data } = await supabase
    .from("bookings")
    .select("*, advisor_sessions (*)")
    .eq("student_id", uid)
    .order("created_at", { ascending: false });

  if (!data) return [];
  return data.map((b) => ({
    id: b.id,
    sessionId: b.session_id,
    studentId: b.student_id,
    status: b.status,
    createdAt: b.created_at,
    session: b.advisor_sessions
      ? {
          id: b.advisor_sessions.id,
          advisorId: b.advisor_sessions.advisor_id,
          title: b.advisor_sessions.title,
          topic: b.advisor_sessions.topic,
          startsAt: b.advisor_sessions.starts_at,
          durationMin: b.advisor_sessions.duration_min,
          capacity: b.advisor_sessions.capacity,
          priceBdt: b.advisor_sessions.price_bdt,
          meetUrl: b.advisor_sessions.meet_url,
          status: b.advisor_sessions.status,
        }
      : undefined,
  }));
}

// ---------- Phase 7: Payments Sandbox ----------

export async function processPaymentSandbox(
  bookingId: string,
  provider: PaymentProvider,
  amountBdt: number,
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const paymentId = `pay-${Date.now()}`;
  const now = new Date().toISOString();

  if (!supabase) {
    const payments = localGet<PaymentRecord[]>(PAYMENTS_KEY) ?? [];
    payments.push({
      id: paymentId,
      bookingId,
      provider,
      providerRef: `SANDBOX_${provider.toUpperCase()}_${Date.now()}`,
      amountBdt,
      status: "success",
      createdAt: now,
    });
    localSet(PAYMENTS_KEY, payments);

    const bookings = localGet<SessionBooking[]>(BOOKINGS_KEY) ?? [];
    const b = bookings.find((item) => item.id === bookingId);
    if (b) {
      b.status = "confirmed";
      localSet(BOOKINGS_KEY, bookings);
    }
    return { success: true, paymentId };
  }

  // Record payment in Supabase
  const { data, error } = await supabase
    .from("payments")
    .insert({
      booking_id: bookingId,
      provider,
      provider_ref: `SANDBOX_${provider.toUpperCase()}_${Date.now()}`,
      amount_bdt: amountBdt,
      status: "pending",
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Failed to create payment" };
  }

  // In sandbox testing, simulate callback confirmation
  await supabase.from("payments").update({ status: "success" }).eq("id", data.id);
  await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);

  return { success: true, paymentId: data.id };
}

// ---------- Phase 7: Admin Panel Operations ----------

export interface AdminStats {
  studentsByStage: Record<Stage, number>;
  totalStudents: number;
  adReports: AdStats[];
  pendingAdvisorsCount: number;
  scamRedFlags: { flag: string; count: number }[];
}

export async function loadAdminStats(): Promise<AdminStats> {
  const ads = await loadAds();
  const events = await loadAdEvents();
  const adReports = ads.map((ad) => calculateAdStats(events, ad));

  if (!supabase) {
    // In preview mode: realistic baseline distribution
    return {
      studentsByStage: {
        hsc1: 65,
        hsc2: 77,
        after_hsc: 42,
        ug1: 52,
        ug2: 46,
        ug3: 98,
        ug4: 117,
        graduated: 42,
      },
      totalStudents: 539,
      adReports,
      pendingAdvisorsCount: 2,
      scamRedFlags: [
        { flag: "Guaranteed visa promise", count: 48 },
        { flag: "Withholding passport or certificates", count: 37 },
        { flag: "Unknown upfront file opening charges", count: 29 },
        { flag: "Work permit disguised as student visa", count: 18 },
      ],
    };
  }

  // Load from Supabase
  const { data: profiles } = await supabase.from("profiles").select("stage");
  const stageCounts: Record<Stage, number> = {
    hsc1: 0,
    hsc2: 0,
    after_hsc: 0,
    ug1: 0,
    ug2: 0,
    ug3: 0,
    ug4: 0,
    graduated: 0,
  };
  (profiles ?? []).forEach((p) => {
    if (p.stage && stageCounts[p.stage as Stage] !== undefined) {
      stageCounts[p.stage as Stage]++;
    }
  });

  const { count: pendingAdvisors } = await supabase
    .from("advisors")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    studentsByStage: stageCounts,
    totalStudents: profiles?.length ?? 0,
    adReports,
    pendingAdvisorsCount: pendingAdvisors ?? 0,
    scamRedFlags: [
      { flag: "Guaranteed visa promise", count: 48 },
      { flag: "Withholding passport or certificates", count: 37 },
      { flag: "Unknown upfront file opening charges", count: 29 },
      { flag: "Work permit disguised as student visa", count: 18 },
    ],
  };
}

export interface AdvisorReviewItem {
  userId: string;
  name: string;
  university: string;
  country: string;
  subject: string;
  intakeYear: number;
  bio: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  proofPath?: string;
  proofDeletedAt?: string;
  verifiedAt?: string;
  isFounding: boolean;
}

export async function loadAdvisorsReviewQueue(): Promise<AdvisorReviewItem[]> {
  if (!supabase) {
    const seeded = defaultMentors.map((m) => ({
      userId: m.id,
      name: m.name,
      university: m.university,
      country: m.country,
      subject: m.subject,
      intakeYear: m.intakeYear,
      bio: m.bio,
      status: m.status,
      proofPath: "uploads/proofs/student_id_preview.pdf",
      isFounding: m.isFounding,
    }));
    return seeded;
  }

  const { data } = await supabase
    .from("advisors")
    .select("user_id, university, country, subject, intake_year, bio, status, proof_path, proof_deleted_at, verified_at, is_founding, profiles (display_name)")
    .order("created_at", { ascending: false });

  if (!data) return [];
  return data.map((d) => ({
    userId: d.user_id,
    name: (d.profiles as { display_name?: string })?.display_name || "Applicant",
    university: d.university,
    country: d.country,
    subject: d.subject,
    intakeYear: d.intake_year,
    bio: d.bio,
    status: d.status,
    proofPath: d.proof_path ?? undefined,
    proofDeletedAt: d.proof_deleted_at ?? undefined,
    verifiedAt: d.verified_at ?? undefined,
    isFounding: Boolean(d.is_founding),
  }));
}

export async function reviewAdvisorApplication(
  advisorId: string,
  decision: "approved" | "rejected",
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    const target = defaultMentors.find((m) => m.id === advisorId);
    if (target) target.status = decision;
    return { success: true };
  }

  const { error } = await supabase
    .from("advisors")
    .update({
      status: decision,
      verified_at: decision === "approved" ? new Date().toISOString() : null,
    })
    .eq("user_id", advisorId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteAdvisorProof(advisorId: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  if (!supabase) {
    return { success: true };
  }
  const { error } = await supabase
    .from("advisors")
    .update({ proof_deleted_at: now })
    .eq("user_id", advisorId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function loadPayouts(): Promise<PayoutRecord[]> {
  if (!supabase) {
    return (
      localGet<PayoutRecord[]>(PAYOUTS_KEY) ?? [
        {
          id: "payout-1",
          advisorId: "mentor-tanvir-de",
          advisorName: "Tanvir Ahmed",
          periodStart: "2026-11-01",
          periodEnd: "2026-11-15",
          amountBdt: 7350,
          status: "paid",
          paidAt: "2026-11-16T10:00:00Z",
        },
        {
          id: "payout-2",
          advisorId: "mentor-sakib-jp",
          advisorName: "Kazi Sakib",
          periodStart: "2026-11-01",
          periodEnd: "2026-11-15",
          amountBdt: 9800,
          status: "due",
        },
      ]
    );
  }

  const { data } = await supabase.from("payouts").select("*, advisors (profiles (display_name))");
  if (!data) return [];
  return data.map((p) => ({
    id: p.id,
    advisorId: p.advisor_id,
    advisorName: (p.advisors as { profiles?: { display_name?: string } })?.profiles?.display_name || "Advisor",
    periodStart: p.period_start,
    periodEnd: p.period_end,
    amountBdt: p.amount_bdt,
    status: p.status,
    paidAt: p.paid_at ?? undefined,
    createdAt: p.created_at,
  }));
}

export async function markPayoutPaid(payoutId: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  if (!supabase) {
    const list = await loadPayouts();
    const item = list.find((p) => p.id === payoutId);
    if (item) {
      item.status = "paid";
      item.paidAt = now;
      localSet(PAYOUTS_KEY, list);
    }
    return { success: true };
  }

  const { error } = await supabase.from("payouts").update({ status: "paid", paid_at: now }).eq("id", payoutId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Checks if the current user is an admin.
 * In preview mode, defaults to true or can be toggled to verify admin vs non-admin experience.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) {
    const override = localGet<boolean>(ADMIN_ROLE_KEY);
    return override ?? true; // Default admin access in preview mode
  }
  const uid = await currentUserId();
  if (!uid) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", uid).single();
  return data?.role === "admin";
}

export function setPreviewAdminRole(isAdmin: boolean): void {
  localSet(ADMIN_ROLE_KEY, isAdmin);
}

