import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the Supabase keys are set. Without them the app runs in local preview mode. */
export const supabaseEnabled = Boolean(url && anonKey);

/** Browser client. The session is kept in local storage and refreshed automatically. */
export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
