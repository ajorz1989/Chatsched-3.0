// CORS headers for the three Edge Functions browsers call directly
// (audience-match, notify, payfast-checkout — payfast-notify is a
// server-to-server PayFast webhook, never called from a browser, so it
// doesn't need this).
//
// Previously always "*". Every one of these functions authorizes with the
// caller's own JWT (not cookies), so a wildcard origin was never the real
// security boundary — but it's tightened here anyway: set SITE_URL (the
// same env var payfast-checkout and notify already read) and requests are
// scoped to that origin. Falls back to "*" when SITE_URL isn't set, so
// local development without every secret configured keeps working exactly
// as before.
const SITE_URL = Deno.env.get("SITE_URL");

export const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_URL || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
