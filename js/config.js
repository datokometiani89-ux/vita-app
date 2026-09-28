/* VITA runtime config — PUBLIC values only (the Supabase anon key is meant to be public;
   Row Level Security protects the data). Empty = cloud features off (local/demo mode).
   In production serve.py generates this file from env vars SUPABASE_URL,
   SUPABASE_ANON_KEY, SENTRY_DSN, so nothing needs to be committed. */
window.VITA_CONFIG = window.VITA_CONFIG || {
  supabaseUrl: "",
  supabaseAnonKey: "",
  sentryDsn: "",
  release: "vita@local",
};
