import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      action,
      entity_type,
      entity_id,
      metadata,
      user_id,
      organization_id,
    } = body || {};

    if (!action || !entity_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action and entity_type' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const ip = String(forwarded).split(",")[0].trim();
    const user_agent = req.headers.get("user-agent") || null;

    const insert = {
      user_id: user_id || null,
      organization_id: organization_id || null,
      action,
      entity_type,
      entity_id: entity_id || null,
      metadata: metadata || null,
      ip_address: ip,
      user_agent,
    };

    const { data, error } = await supabase.from("audit_logs").insert(insert).select().single();

    if (error) {
      console.error("Failed to insert audit log:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unhandled error in log-audit function:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
