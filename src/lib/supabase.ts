import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once real Supabase credentials are set in .env — see .env.example. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Micro Billboards] Supabase isn't configured yet — copy .env.example to .env, " +
    "add your project URL and anon key, then restart `npm run dev`. " +
    "Until then, live data, accounts and requests are disabled."
  );
}

// Falls back to a placeholder project so createClient() never throws before
// .env is set up — every real call is gated behind isSupabaseConfigured instead.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
