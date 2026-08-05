import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// In-memory store (for demo; use Redis/Upstash in production)
// For production, consider using a Supabase table or KV store.
const ipStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 60; // Requests per minute
const WINDOW_MS = 60 * 1000;

serve(async (req) => {
  // Only intercept POST/PUT/DELETE for mutations; GETs are less critical
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return fetch(req);
  }

  // x-forwarded-for may contain a list; take the first IP
  const forwarded = req.headers.get("x-forwarded-for") || "unknown";
  const ip = forwarded.split(",")[0].trim();
  const now = Date.now();

  const record = ipStore.get(ip);
  if (!record || now > record.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return fetch(req);
  }

  if (record.count >= RATE_LIMIT) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
        },
      }
    );
  }

  record.count++;
  ipStore.set(ip, record);

  // Clean up expired entries periodically
  if (ipStore.size > 1000) {
    for (const [key, val] of ipStore) {
      if (Date.now() > val.resetAt) ipStore.delete(key);
    }
  }

  return fetch(req);
});
