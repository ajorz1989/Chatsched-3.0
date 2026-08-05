import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.24.0";

// --- Configuration ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });

// --- CORS Headers ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// --- Main Handler ---
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { campaignId, userId, businessDescription, budget, location, niche } = await req.json();

    // 1. Fetch available publishers from DB (to give context to the AI)
    const { data: publishers, error: dbError } = await supabase
      .from("publishers")
      .select("id, name, description, niche, location, price_per_post, rating")
      .eq("is_active", true)
      .limit(50); // Limit to top 50 to save token cost

    if (dbError) throw new Error("Failed to fetch publishers");

    // 2. Create an audit trail entry
    const { data: job, error: jobError } = await supabase
      .from("ai_agent_jobs")
      .insert({
        job_type: "campaign_matching",
        input_data: { businessDescription, budget, location, niche },
        created_by: userId,
        status: "processing",
      })
      .select()
      .single();

    if (jobError) throw new Error("Failed to create audit job");

    const startTime = performance.now();

    // 3. Call Anthropic with Tool Calling (Structured Output)
    const toolDefinition = {
      name: "match_publishers",
      description: "Match the advertiser's campaign with the most suitable publishers",
      input_schema: {
        type: "object",
        properties: {
          matched_publisher_ids: {
            type: "array",
            items: { type: "string" },
            description: "List of publisher IDs that are the best match",
          },
          reasoning: {
            type: "string",
            description: "Brief reasoning for the match decisions",
          },
          suggested_budget_allocation: {
            type: "array",
            items: {
              type: "object",
              properties: {
                publisher_id: { type: "string" },
                suggested_amount: { type: "number" },
              },
            },
          },
        },
        required: ["matched_publisher_ids", "reasoning"],
      },
    };

    const systemPrompt = `You are an AI Marketing Manager for a South African ad marketplace. 
Your task is to match the advertiser's campaign with the most suitable publishers from the provided list.
Consider: relevance of niche, geographic location (prioritize South African cities), budget alignment, and publisher rating.
Return ONLY the tool call. Do not add extra text.`;

    const userPrompt = `
      Advertiser Details:
      - Business Description: ${businessDescription}
      - Budget: ${budget}
      - Target Location: ${location}
      - Niche: ${niche}

      Available Publishers (JSON):
      ${JSON.stringify(publishers, null, 2)}
    `;

    let aiResponse;
    let fallbackUsed = false;
    let outputData = null;
    let errorMessage = null;

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        tools: [toolDefinition],
        tool_choice: { type: "tool", name: "match_publishers" },
      });

      // Extract the tool call from the response
      const content = response.content[0];
      if (content.type === "tool_use" && content.name === "match_publishers") {
        outputData = content.input;
      } else {
        throw new Error("AI did not return a valid tool call");
      }
    } catch (aiError: any) {
      console.error("AI Fallback Triggered:", aiError.message);
      fallbackUsed = true;
      errorMessage = aiError.message;

      // --- FALLBACK: Rule-based matching if AI fails ---
      outputData = fallbackMatcher(publishers, niche, location, budget);
    }

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    // 4. Update the audit job with the result
    await supabase
      .from("ai_agent_jobs")
      .update({
        output_data: outputData,
        fallback_used: fallbackUsed,
        status: errorMessage ? "failed" : "completed",
        error_message: errorMessage,
        tokens_used: 0, // We can extract from response if needed
        latency_ms: latencyMs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // 5. Return the matched publisher IDs to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        data: outputData,
        fallbackUsed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("Unhandled Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// --- Fallback Logic (Graceful Degradation) ---
function fallbackMatcher(publishers: any[], niche: string, location: string, budget: number) {
  // Simple ranking: filter by niche and location, then sort by rating
  const filtered = publishers.filter(
    (p) =>
      (p.niche?.toLowerCase().includes(niche.toLowerCase()) || false) &&
      (p.location?.toLowerCase().includes(location.toLowerCase()) || false)
  );

  const sorted = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const topIds = sorted.slice(0, 5).map((p) => p.id);

  // Suggest a simple budget split
  const allocation = topIds.map((id: string) => ({
    publisher_id: id,
    suggested_amount: Math.round(budget / topIds.length),
  }));

  return {
    matched_publisher_ids: topIds,
    reasoning: "Fallback engine matched based on niche and location similarity.",
    suggested_budget_allocation: allocation,
  };
}
