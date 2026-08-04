// PayFast's Instant Transaction Notification (ITN) webhook. PayFast calls
// this server-to-server after a payment completes — it is NOT triggered by
// the browser, so this function must be deployed with --no-verify-jwt
// (see supabase/DEPLOY.md). This is the only place payment status is ever
// marked "paid" — the /payment/return page the browser lands on is purely
// informational and never marks anything paid itself.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { signItnFields, payfastHost } from "../_shared/payfast.ts";

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const entries = Array.from(params.entries());
    const data = Object.fromEntries(entries);

    const mode = (Deno.env.get("PAYFAST_MODE") ?? "sandbox") as "sandbox" | "live";
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || undefined;

    // 1. Signature check.
    const expectedSignature = signItnFields(entries, passphrase);
    if (expectedSignature !== data.signature) {
      console.error("payfast-notify: signature mismatch", { received: data.signature });
      return new Response("invalid signature", { status: 200 });
    }

    // 2. Ask PayFast directly whether they actually sent this — the
    // authoritative check, since a signature alone can't rule out a replay
    // of a previously-valid payload.
    const validateRes = await fetch(`https://${payfastHost(mode)}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const validateText = (await validateRes.text()).trim();
    if (validateText !== "VALID") {
      console.error("payfast-notify: PayFast validate returned", validateText);
      return new Response("not valid", { status: 200 });
    }

    // Service role: this function runs as a trusted server (PayFast isn't a
    // Supabase-authenticated user), so it's the one legitimate place in this
    // app that bypasses RLS.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("*")
      .eq("id", data.m_payment_id)
      .single();
    if (paymentError || !payment) {
      console.error("payfast-notify: unknown m_payment_id", data.m_payment_id);
      return new Response("unknown payment", { status: 200 });
    }

    // 3. Never trust the ITN's amount on its own — compare it to what we
    // actually charged for. A mismatch means something is wrong and the
    // payment should NOT be marked paid, even though the signature and the
    // PayFast validate check both passed.
    const received = Number.parseFloat(data.amount_gross ?? "0");
    const expected = Number(payment.amount);
    if (Math.abs(received - expected) > 0.01) {
      console.error("payfast-notify: amount mismatch", { received, expected, payment_id: payment.id });
      return new Response("amount mismatch", { status: 200 });
    }

    if (data.payment_status === "COMPLETE") {
      await admin
        .from("payments")
        .update({ status: "paid", payfast_payment_id: data.pf_payment_id ?? null, paid_at: new Date().toISOString() })
        .eq("id", payment.id);
    } else if (data.payment_status === "FAILED") {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("payfast-notify: unexpected error", err);
    // Still 200 — PayFast otherwise retries indefinitely for something that
    // may never succeed; real failures are visible in the function logs.
    return new Response("error logged", { status: 200 });
  }
});
