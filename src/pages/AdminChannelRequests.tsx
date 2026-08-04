import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getChannelBySlug } from "../lib/channelRegistry";
import type { ChannelRequest } from "../lib/types";

/**
 * Admin's view of the 4-channel request workflow. The creator handles
 * approve/decline/mark-live themselves (PublisherDashboardView) — admin's
 * only two jobs here are the two steps that need someone to confirm money
 * actually moved: payment received, and payout sent. Everything else is
 * read-only status/monitoring, same division of labour as AdminPayouts.
 */
export default function AdminChannelRequests() {
  const [requests, setRequests] = useState<ChannelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"needs_action" | "all" | "overdue">("needs_action");
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("channel_requests")
      .select("*, creator:publishers(id, name, city, province, channel_slug), business:profiles(full_name, company_name, phone)")
      .order("created_at", { ascending: false });
    setRequests((data ?? []) as unknown as ChannelRequest[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function confirmPayment(id: string) {
    setActingId(id);
    await supabase.from("channel_requests").update({ status: "paid" }).eq("id", id);
    setActingId(null);
    load();
  }

  async function confirmPayout(id: string) {
    setActingId(id);
    await supabase.from("channel_requests").update({ status: "completed" }).eq("id", id);
    setActingId(null);
    load();
  }

  async function closeExpired(id: string, next: "declined" | "cancelled") {
    setActingId(id);
    await supabase.from("channel_requests").update({ status: next }).eq("id", id);
    setActingId(null);
    load();
  }

  const now = Date.now();
  const isOverdue = (r: ChannelRequest) =>
    (r.status === "pending" && new Date(r.approval_due_at).getTime() < now) ||
    (r.status === "awaiting_payment" && r.payment_due_at != null && new Date(r.payment_due_at).getTime() < now);

  const needsAction = requests.filter((r) => r.status === "payment_submitted" || r.status === "live");
  const overdue = requests.filter(isOverdue);
  const visible = filter === "needs_action" ? needsAction : filter === "overdue" ? overdue : requests;

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    awaitingPayment: requests.filter((r) => r.status === "awaiting_payment").length,
    needsPaymentConfirm: requests.filter((r) => r.status === "payment_submitted").length,
    needsPayoutConfirm: requests.filter((r) => r.status === "live").length,
  };

  if (loading) {
    return <div className="h-40 border-[3px] border-billboard-paperDim rounded animate-pulse bg-billboard-paperDim" />;
  }

  return (
    <div>
      <p className="text-billboard-inkSoft text-sm mb-6">
        Influencer, website, podcast, and radio requests. Creators approve, decline, and mark their own posts live —
        your two jobs here are confirming a business's payment landed, and confirming a creator's payout went out.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="border-2 border-billboard-ink rounded p-3">
          <div className="font-display text-xl">{stats.needsPaymentConfirm}</div>
          <div className="text-[11px] font-mono uppercase text-billboard-inkSoft">Payment to confirm</div>
        </div>
        <div className="border-2 border-billboard-ink rounded p-3">
          <div className="font-display text-xl">{stats.needsPayoutConfirm}</div>
          <div className="text-[11px] font-mono uppercase text-billboard-inkSoft">Payout to confirm</div>
        </div>
        <div className="border-2 border-billboard-ink rounded p-3">
          <div className="font-display text-xl">{stats.awaitingPayment}</div>
          <div className="text-[11px] font-mono uppercase text-billboard-inkSoft">Awaiting business payment</div>
        </div>
        <div className="border-2 border-billboard-ink rounded p-3">
          <div className="font-display text-xl">{stats.pending}</div>
          <div className="text-[11px] font-mono uppercase text-billboard-inkSoft">Awaiting creator response</div>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {(["needs_action", "overdue", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded border-2 border-billboard-ink transition ${filter === f ? "bg-billboard-ink text-white" : "bg-white"}`}
          >
            {f === "needs_action" ? `Needs action (${needsAction.length})` : f === "overdue" ? `Overdue (${overdue.length})` : `All (${requests.length})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft text-sm">
          Nothing here right now.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const chDef = r.creator ? getChannelBySlug(r.creator.channel_slug)?.definition : getChannelBySlug(r.channel_slug)?.definition;
            return (
              <div key={r.id} className="border-2 border-billboard-ink rounded p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    {chDef ? `${chDef.emoji} ${chDef.name}` : r.channel_slug} · {r.creator?.name ?? "Unknown creator"} ← {r.business?.company_name || r.business?.full_name || "Unknown business"}
                  </p>
                  <p className="text-xs text-billboard-inkSoft mt-1">
                    {r.advertising_method} · R{r.proposed_amount} · status: <span className="font-mono">{r.status}</span>
                    {isOverdue(r) && <span className="text-billboard-red font-semibold"> · overdue</span>}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === "payment_submitted" && (
                    <button onClick={() => confirmPayment(r.id)} disabled={actingId === r.id} className="border-[3px] border-billboard-ink bg-billboard-green text-white font-bold px-3 py-1.5 rounded text-xs hover:-translate-y-0.5 transition disabled:opacity-60">
                      Confirm payment received
                    </button>
                  )}
                  {r.status === "live" && (
                    <button onClick={() => confirmPayout(r.id)} disabled={actingId === r.id} className="border-[3px] border-billboard-ink bg-billboard-green text-white font-bold px-3 py-1.5 rounded text-xs hover:-translate-y-0.5 transition disabled:opacity-60">
                      Confirm payout sent
                    </button>
                  )}
                  {r.status === "pending" && isOverdue(r) && (
                    <button onClick={() => closeExpired(r.id, "declined")} disabled={actingId === r.id} className="border-2 border-billboard-red text-billboard-red font-bold px-3 py-1.5 rounded text-xs hover:bg-billboard-red hover:text-white transition disabled:opacity-60">
                      Close as expired
                    </button>
                  )}
                  {r.status === "awaiting_payment" && isOverdue(r) && (
                    <button onClick={() => closeExpired(r.id, "cancelled")} disabled={actingId === r.id} className="border-2 border-billboard-red text-billboard-red font-bold px-3 py-1.5 rounded text-xs hover:bg-billboard-red hover:text-white transition disabled:opacity-60">
                      Cancel — unpaid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
