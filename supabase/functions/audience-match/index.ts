// Ranks the real publisher directory against a business's plain-language
// description of who they want to reach. Server-side only, both because the
// Anthropic API key must never reach the browser and because this costs
// money per call — gated behind login (see README) so it isn't an open,
// anyone-can-run-up-the-bill endpoint.
//
// Honest framing for whoever reads this later: with a handful of publishers
// this is closer to "a nicely-explained filter" than real ML ranking. It
// gets more genuinely useful as the directory grows past what someone would
// comfortably scan by eye.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const MODEL = "claude-haiku-4-5-20251001";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { description, budget } = (await req.json()) as { description?: string; budget?: number };
    if (!description || description.trim().length < 10) {
      return json({ error: "Tell us a bit more about who you're trying to reach." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Log in to use audience match" }, 401);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return json({ error: "Audience match isn't set up yet — ask the platform owner to add an Anthropic API key." }, 501);
    }

    const { data: publishers, error: pubError } = await supabase.from("publishers").select("*");
    if (pubError || !publishers || publishers.length === 0) {
      return json({ error: "No publishers in the directory yet" }, 404);
    }

    const directory = publishers
      .map((p) => `- id: ${p.id} | ${p.name} | ${p.category} | ${p.city}, ${p.province} | platforms: ${(p.platforms ?? []).join(", ")} | ${p.followers} followers | ${p.engagement}% engagement | R${p.price_per_post}/post | audience: ${p.audience}`)
      .join("\n");

    const prompt = `You are matching a South African small business to advertising publishers (social media pages/groups) they could book a sponsored post with.

Business's own description of what they want:
"""
${description.trim()}
"""
${budget ? `Budget: around R${budget} per post.\n` : ""}
Publisher directory (only use these — never invent a publisher):
${directory}

Pick the best 5 matches (fewer if the directory has fewer than 5, or if fewer genuinely fit). For each, give a 0-100 relevance score and a one-sentence reason grounded in specifics from the directory listing (category, location, audience, platform, or price) — not a generic sentence that could apply to anything.

Respond with ONLY a JSON array, no other text, no markdown fences, in this exact shape:
[{"publisher_id": "...", "score": 87, "reason": "..."}]`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      console.error("audience-match: Anthropic API error", await aiRes.text());
      return json({ error: "The matching service is temporarily unavailable" }, 502);
    }

    const aiData = await aiRes.json();
    const rawText = (aiData.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let ranked: { publisher_id: string; score: number; reason: string }[];
    try {
      ranked = JSON.parse(cleaned);
    } catch {
      console.error("audience-match: could not parse model output", rawText);
      return json({ error: "Couldn't make sense of the match results — try rephrasing." }, 502);
    }

    const byId = new Map(publishers.map((p) => [p.id, p]));
    const results = ranked
      .filter((r) => byId.has(r.publisher_id))
      .map((r) => ({ ...r, publisher: byId.get(r.publisher_id) }));

    return json({ results });
  } catch (err) {
    console.error("audience-match: unexpected error", err);
    return json({ error: "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
