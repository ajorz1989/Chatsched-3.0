import { useEffect, useState, type FormEvent } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import SetupNotice from "../components/SetupNotice";
import MessageThread from "../components/MessageThread";
import Seo from "../components/Seo";
import AdminAnalytics from "./AdminAnalytics";
import AdminPayouts from "./AdminPayouts";
import AdminChannelRequests from "./AdminChannelRequests";
import { CATEGORIES, PROVINCES, PLATFORMS, SWATCHES, PUBLISHER_SHARE, PAYOUT_DUE_DAYS, FEATURED_DURATION_DAYS } from "../lib/constants";
import { computeVerificationLevel, VERIFICATION_META } from "../lib/businessVerification";
import type { Publisher, PublisherRequest, ContactMessage, RequestStatus, Platform, Profile } from "../lib/types";

type Tab = "requests" | "applications" | "publishers" | "businesses" | "messages" | "analytics" | "payouts" | "channel_requests";
const STATUSES: RequestStatus[] = ["pending", "contacted", "confirmed", "declined", "completed"];

// Best-effort admin audit log — see schema_phase15_audit_log.sql. Never
// allowed to block or fail the real action it's describing.
async function logAdminAction(action: string, targetTable: string, targetId: string | null, detail?: Record<string, unknown>) {
  try {
    await supabase.rpc("log_admin_action", { p_action: action, p_target_table: targetTable, p_target_id: targetId, p_detail: detail ?? null });
  } catch (err) {
    console.warn("Audit log write failed (non-fatal)", err);
  }
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<PublisherRequest[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [businesses, setBusinesses] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [{ data: reqData }, { data: pubData }, { data: bizData }, { data: msgData }] = await Promise.all([
      supabase.from("requests").select("*, publisher:publishers(id,name), business:profiles(full_name, company_name, phone), payments(*)").order("created_at", { ascending: false }),
      supabase.from("publishers").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "business").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
    ]);
    setRequests((reqData ?? []) as unknown as PublisherRequest[]);
    setPublishers((pubData ?? []) as Publisher[]);
    setBusinesses((bizData ?? []) as Profile[]);
    setMessages((msgData ?? []) as ContactMessage[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isSupabaseConfigured) loadAll();
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice />;

  async function updateStatus(id: string, status: RequestStatus) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await supabase.from("requests").update({ status }).eq("id", id);
    supabase.functions.invoke("notify", { body: { kind: "status_change", request_id: id } }).catch(() => {});
  }

  async function updateAgreedAmount(id: string, agreed_amount: number | null) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, agreed_amount } : r)));
    await supabase.from("requests").update({ agreed_amount }).eq("id", id);
  }

  async function markPayoutSent(paymentId: string) {
    await supabase.from("payments").update({ payout_status: "paid", payout_date: new Date().toISOString() }).eq("id", paymentId);
    logAdminAction("payout_marked_sent", "payments", paymentId);
    loadAll();
  }

  // Approving recomputes trust_score / publisher_score / level right away via
  // the same SQL function the review/request triggers call — otherwise a
  // freshly-approved publisher would show no level until their first
  // completed campaign or review came in and fired one of those triggers.
  async function approvePublisher(id: string) {
    setPublishers((prev) => prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p)));
    await supabase.from("publishers").update({ status: "approved", reviewed_at: new Date().toISOString(), rejected_reason: null }).eq("id", id);
    await supabase.rpc("refresh_publisher_scores", { p_publisher_id: id });
    logAdminAction("publisher_approved", "publishers", id);
    loadAll();
  }

  async function rejectPublisher(id: string, reason: string) {
    setPublishers((prev) => prev.map((p) => (p.id === id ? { ...p, status: "rejected", rejected_reason: reason } : p)));
    await supabase.from("publishers").update({ status: "rejected", rejected_reason: reason, reviewed_at: new Date().toISOString() }).eq("id", id);
    logAdminAction("publisher_rejected", "publishers", id, { reason });
  }

  // No messaging channel to a publisher exists yet (Phase 3's thread is
  // business <-> admin only), so this just keeps a note on the row for now
  // rather than sending anything — see the note above ApplicationCard.
  async function requestMoreInfo(id: string, note: string) {
    setPublishers((prev) => prev.map((p) => (p.id === id ? { ...p, admin_notes: note } : p)));
    await supabase.from("publishers").update({ admin_notes: note }).eq("id", id);
    logAdminAction("publisher_info_requested", "publishers", id);
  }

  // trg_prevent_self_verification (schema_phase7.sql) only lets these two
  // columns through for an admin session — this button is that session.
  async function toggleBusinessFlag(id: string, field: "phone_verified" | "business_verified", value: boolean) {
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
    await supabase.from("profiles").update({ [field]: value }).eq("id", id);
    logAdminAction(value ? `${field}_granted` : `${field}_revoked`, "profiles", id);
  }

  async function toggleFeatured(id: string, featured: boolean) {
    const featured_until = featured ? new Date(Date.now() + FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString() : null;
    setPublishers((prev) => prev.map((p) => (p.id === id ? { ...p, featured, featured_until } : p)));
    await supabase.from("publishers").update({ featured, featured_until }).eq("id", id);
    logAdminAction(featured ? "publisher_featured" : "publisher_unfeatured", "publishers", id, { featured_until });
  }

  const pendingApplications = publishers.filter((p) => p.status === "pending_review");
  const reviewedPublishers = publishers.filter((p) => p.status !== "pending_review");

  const tabs: [Tab, string][] = [
    ["requests", `Requests (${requests.length})`],
    ["applications", `Applications (${pendingApplications.length})`],
    ["publishers", `Publishers (${reviewedPublishers.length})`],
    ["channel_requests", "Channel Requests"],
    ["businesses", `Businesses (${businesses.length})`],
    ["messages", `Messages (${messages.length})`],
    ["analytics", "Analytics"],
    ["payouts", "Payouts ⚠"],
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 py-14">
      <Seo title="Admin · Micro Billboards" noindex />
      <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">Admin</span>
      <h1 className="text-3xl md:text-4xl mb-8">Run the pilot.</h1>

      <div className="flex gap-2 mb-8 border-b-[3px] border-billboard-ink overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`font-mono text-xs font-semibold uppercase tracking-wide px-4 py-3 -mb-[3px] border-b-[3px] whitespace-nowrap transition ${tab === key ? "border-billboard-ink text-billboard-ink" : "border-transparent text-billboard-inkSoft"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-billboard-inkSoft">Loading…</p>
      ) : tab === "requests" ? (
        <RequestsTab requests={requests} onStatusChange={updateStatus} onAmountChange={updateAgreedAmount} onPayoutSent={markPayoutSent} />
      ) : tab === "applications" ? (
        <ApplicationsTab applications={pendingApplications} onApprove={approvePublisher} onReject={rejectPublisher} onRequestInfo={requestMoreInfo} />
      ) : tab === "publishers" ? (
        <PublishersTab publishers={reviewedPublishers} onAdded={loadAll} onToggleFeatured={toggleFeatured} />
      ) : tab === "analytics" ? (
        <AdminAnalytics />
      ) : tab === "payouts" ? (
        <AdminPayouts />
      ) : tab === "channel_requests" ? (
        <AdminChannelRequests />
      ) : tab === "businesses" ? (
        <BusinessesTab businesses={businesses} onToggle={toggleBusinessFlag} />
      ) : (
        <MessagesTab messages={messages} />
      )}
    </div>
  );
}

function RequestsTab({
  requests, onStatusChange, onAmountChange, onPayoutSent,
}: {
  requests: PublisherRequest[];
  onStatusChange: (id: string, status: RequestStatus) => void;
  onAmountChange: (id: string, amount: number | null) => void;
  onPayoutSent: (paymentId: string) => void;
}) {
  if (requests.length === 0) {
    return <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">No requests yet — they'll show up here as soon as a business books a publisher.</div>;
  }
  return (
    <div className="space-y-4">
      {requests.map((r) => {
        const payment = [...(r.payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        return (
          <div key={r.id} className="border-[3px] border-billboard-ink rounded p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-bold">
                  {r.business?.company_name || r.business?.full_name || "A business"} → {r.publisher?.name ?? "Publisher"}
                </p>
                <p className="text-sm text-billboard-inkSoft mt-1 max-w-lg">{r.campaign_message}</p>
                <p className="text-xs text-billboard-inkSoft mt-2 font-mono">
                  {r.business?.full_name}{r.business?.phone ? ` · ${r.business.phone}` : ""}{r.budget != null ? ` · Suggested R${r.budget}` : ""}
                </p>
              </div>
              <select
                value={r.status}
                onChange={(e) => onStatusChange(r.id, e.target.value as RequestStatus)}
                className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-2.5 py-2 bg-white shrink-0"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-billboard-paperDim flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                Agreed amount
                <span className="font-mono text-sm">R</span>
                <input
                  type="number" min={0} defaultValue={r.agreed_amount ?? ""}
                  onBlur={(e) => onAmountChange(r.id, e.target.value ? Number(e.target.value) : null)}
                  className="w-24 border-2 border-billboard-ink rounded px-2 py-1 bg-white font-mono text-sm"
                />
              </label>

              {payment && (
                <span className="font-mono text-xs uppercase text-billboard-inkSoft">
                  Payment: <strong className="text-billboard-ink">{payment.status}</strong>
                </span>
              )}

              {payment?.status === "paid" && (
                payment.payout_status === "paid" ? (
                  <span className="font-mono text-xs uppercase text-billboard-greenDeep font-semibold">
                    ✓ Payout sent (R{(payment.amount * PUBLISHER_SHARE).toFixed(2)})
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => onPayoutSent(payment.id)}
                      className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-1.5 hover:-translate-y-0.5 transition"
                    >
                      Mark payout sent (R{(payment.amount * PUBLISHER_SHARE).toFixed(2)})
                    </button>
                    {payment.paid_at && daysSince(payment.paid_at) >= PAYOUT_DUE_DAYS && (
                      <span className="font-mono text-[10px] uppercase text-billboard-red font-semibold">
                        ⚠ Paid {daysSince(payment.paid_at)}d ago, no payout yet
                      </span>
                    )}
                  </>
                )
              )}
            </div>

            <MessageThread requestId={r.id} senderRole="admin" />
          </div>
        );
      })}
    </div>
  );
}

function MessagesTab({ messages }: { messages: ContactMessage[] }) {
  if (messages.length === 0) {
    return <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">No messages yet.</div>;
  }
  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div key={m.id} className="border-[3px] border-billboard-ink rounded p-5">
          <p className="font-bold">{m.name} <span className="font-normal text-billboard-inkSoft text-sm">· {m.email}</span></p>
          <p className="text-sm text-billboard-inkSoft mt-1.5">{m.message}</p>
        </div>
      ))}
    </div>
  );
}

function PublishersTab({ publishers, onAdded, onToggleFeatured }: { publishers: Publisher[]; onAdded: () => void; onToggleFeatured: (id: string, featured: boolean) => void }) {
  const [showForm, setShowForm] = useState(false);

  async function toggleVerified(p: Publisher) {
    await supabase.from("publishers").update({ verified: !p.verified }).eq("id", p.id);
    logAdminAction(p.verified ? "publisher_unverified" : "publisher_verified", "publishers", p.id);
    onAdded();
  }

  async function toggleSuspended(p: Publisher) {
    const status = p.status === "suspended" ? "approved" : "suspended";
    await supabase.from("publishers").update({ status }).eq("id", p.id);
    if (status === "approved") await supabase.rpc("refresh_publisher_scores", { p_publisher_id: p.id });
    logAdminAction(status === "suspended" ? "publisher_suspended" : "publisher_reinstated", "publishers", p.id);
    onAdded();
  }

  function isCurrentlyFeatured(p: Publisher): boolean {
    return p.featured && (!p.featured_until || new Date(p.featured_until) > new Date());
  }

  return (
    <div>
      <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-2 border-[3px] border-billboard-ink font-bold px-4 py-2.5 rounded mb-6 hover:-translate-y-0.5 transition">
        {showForm ? "Cancel" : "+ Add publisher"}
      </button>
      {showForm && <AddPublisherForm onAdded={() => { setShowForm(false); onAdded(); }} />}

      {publishers.length === 0 ? (
        <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">No reviewed publishers yet — approvals from the Applications tab, and anyone added by hand above, show up here.</div>
      ) : (
        <div className="space-y-3">
          {publishers.map((p) => (
            <div key={p.id} className="border-2 border-billboard-ink rounded p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.swatch} border-2 border-billboard-ink flex items-center justify-center font-display text-xs shrink-0`}>{p.initials}</div>
                <div>
                  <p className="font-bold text-sm">
                    {p.name} {p.verified && <span title="Verified">✓</span>}
                    {p.level && <span className="ml-2 font-mono text-[10px] uppercase text-billboard-inkSoft">{p.level}</span>}
                    {isCurrentlyFeatured(p) && <span className="ml-2 font-mono text-[10px] uppercase text-billboard-ink">★ Featured</span>}
                    {p.status === "rejected" && <span className="ml-2 font-mono text-[10px] uppercase text-billboard-red">Rejected</span>}
                    {p.status === "suspended" && <span className="ml-2 font-mono text-[10px] uppercase text-billboard-red">Suspended</span>}
                  </p>
                  <p className="text-xs text-billboard-inkSoft">{p.city}, {p.province} · {p.category} · R{p.price_per_post}/post</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.status === "approved" && (
                  <button
                    onClick={() => onToggleFeatured(p.id, !isCurrentlyFeatured(p))}
                    title={isCurrentlyFeatured(p) ? "Remove featured placement" : `Feature for ${FEATURED_DURATION_DAYS} days`}
                    className={`font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-1.5 hover:-translate-y-0.5 transition ${isCurrentlyFeatured(p) ? "bg-billboard-yellow" : ""}`}
                  >
                    {isCurrentlyFeatured(p) ? "★ Unfeature" : "☆ Feature"}
                  </button>
                )}
                {p.status !== "rejected" && (
                  <button
                    onClick={() => toggleSuspended(p)}
                    className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-1.5 hover:-translate-y-0.5 transition"
                  >
                    {p.status === "suspended" ? "Reinstate" : "Suspend"}
                  </button>
                )}
                <button
                  onClick={() => toggleVerified(p)}
                  className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-1.5 hover:-translate-y-0.5 transition"
                >
                  {p.verified ? "Unverify" : "Mark verified"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddPublisherForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState(PROVINCES[0]);
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");
  const [pricePerPost, setPricePerPost] = useState("");
  const [bio, setBio] = useState("");
  const [audience, setAudience] = useState("");
  const [initials, setInitials] = useState("");
  const [swatch, setSwatch] = useState(SWATCHES[0].value);
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (platforms.length === 0) {
      setError("Pick at least one platform.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("publishers").insert({
      name, city, province, category, platforms,
      followers: Number(followers) || 0,
      engagement: Number(engagement) || 0,
      price_per_post: Number(pricePerPost) || 0,
      bio, audience,
      initials: initials || name.slice(0, 2).toUpperCase(),
      swatch, verified,
    });
    setSaving(false);
    if (error) setError(error.message);
    else onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="border-[3px] border-billboard-ink rounded p-6 mb-8 bg-billboard-paperDim">
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Page / group name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Initials (for the avatar)</label>
          <input maxLength={3} value={initials} onChange={(e) => setInitials(e.target.value)} placeholder={name.slice(0, 2).toUpperCase() || "e.g. BB"} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">City</label>
          <input required value={city} onChange={(e) => setCity(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Province</label>
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm">
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm">
            {CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Price per post (R)</label>
          <input required type="number" min={0} value={pricePerPost} onChange={(e) => setPricePerPost(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Followers</label>
          <input required type="number" min={0} value={followers} onChange={(e) => setFollowers(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Engagement rate (%)</label>
          <input required type="number" min={0} step="0.1" value={engagement} onChange={(e) => setEngagement(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
        </div>
      </div>

      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Platforms</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {PLATFORMS.map((p) => (
          <button type="button" key={p} onClick={() => togglePlatform(p)} className={`font-mono text-xs border-2 border-billboard-ink rounded-full px-3 py-1.5 transition ${platforms.includes(p) ? "bg-billboard-ink text-white" : "bg-white"}`}>
            {p}
          </button>
        ))}
      </div>

      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Cover colour</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {SWATCHES.map((s) => (
          <button
            type="button" key={s.value} onClick={() => setSwatch(s.value)} title={s.label}
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${s.value} border-2 border-billboard-ink transition ${swatch === s.value ? "ring-2 ring-offset-2 ring-billboard-ink" : ""}`}
          />
        ))}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Bio</label>
        <textarea required value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Audience description</label>
        <input required value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. 25–44, mostly local Cape Town residents" className="w-full border-2 border-billboard-ink rounded px-3 py-2 bg-white text-sm" />
      </div>

      <label className="inline-flex items-center gap-2 mb-5 text-sm font-semibold">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="w-4 h-4 accent-billboard-green" />
        Mark as verified
      </label>

      {error && <p className="text-billboard-red text-xs font-semibold mb-4">{error}</p>}
      <button type="submit" disabled={saving} className="bg-billboard-yellow border-[3px] border-billboard-ink font-bold px-5 py-2.5 rounded hover:-translate-y-0.5 transition disabled:opacity-60">
        {saving ? "Adding…" : "Add publisher"}
      </button>
    </form>
  );
}

function ApplicationsTab({
  applications, onApprove, onReject, onRequestInfo,
}: {
  applications: Publisher[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestInfo: (id: string, note: string) => void;
}) {
  if (applications.length === 0) {
    return <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">No pending applications — new self-serve publisher signups from /apply will show up here.</div>;
  }
  return (
    <div className="space-y-4">
      {applications.map((p) => (
        <ApplicationCard key={p.id} publisher={p} onApprove={onApprove} onReject={onReject} onRequestInfo={onRequestInfo} />
      ))}
    </div>
  );
}

// "Request more info" just saves a note on the row rather than sending
// anything — there's no publisher-facing dashboard yet to show it in, and
// no admin <-> publisher message thread (Phase 3's is business <-> admin
// only). It's here so the decision isn't lost, and so a note field exists
// once there's somewhere for a publisher to actually see it.
function ApplicationCard({
  publisher: p, onApprove, onReject, onRequestInfo,
}: {
  publisher: Publisher;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestInfo: (id: string, note: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="border-[3px] border-billboard-ink rounded p-5">
      <div>
        <p className="font-bold">
          {p.name} <span className="font-normal text-billboard-inkSoft text-sm">· {p.category || "—"} · {p.city}, {p.province}</span>
        </p>
        <p className="text-xs text-billboard-inkSoft mt-1 font-mono">
          {p.followers.toLocaleString()} followers · {p.engagement}% engagement
          {p.monthly_reach ? ` · ${p.monthly_reach.toLocaleString()} monthly reach` : ""}
        </p>
        {p.platforms.length > 0 && <p className="text-xs text-billboard-inkSoft mt-1 font-mono">{p.platforms.join(", ")}</p>}
        {(p.email || p.mobile_number) && (
          <p className="text-xs text-billboard-inkSoft mt-1 font-mono">{p.email}{p.mobile_number ? ` · ${p.mobile_number}` : ""}</p>
        )}
        {p.bio && <p className="text-sm text-billboard-inkSoft mt-2 max-w-lg">{p.bio}</p>}
        {p.business_name && (
          <p className="text-xs text-billboard-inkSoft mt-2 font-mono">
            {p.business_name}{p.vat_number ? ` · VAT ${p.vat_number}` : ""}{p.company_registration ? ` · Reg ${p.company_registration}` : ""}
          </p>
        )}
        {p.admin_notes && (
          <p className="text-xs text-billboard-ink mt-2 bg-billboard-paperDim border-2 border-billboard-inkSoft rounded px-2.5 py-1.5 inline-block">
            Note on file: {p.admin_notes}
          </p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-billboard-paperDim flex flex-wrap gap-2">
        <button onClick={() => onApprove(p.id)} className="font-mono text-xs font-semibold uppercase border-2 border-billboard-greenDeep bg-billboard-green rounded px-3 py-1.5 hover:-translate-y-0.5 transition">
          Approve
        </button>
        <button onClick={() => setShowInfo((s) => !s)} className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-1.5 hover:-translate-y-0.5 transition">
          Request more info
        </button>
        <button onClick={() => setShowReject((s) => !s)} className="font-mono text-xs font-semibold uppercase border-2 border-billboard-red text-billboard-red rounded px-3 py-1.5 hover:-translate-y-0.5 transition">
          Reject
        </button>
      </div>

      {showInfo && (
        <div className="mt-3 flex gap-2">
          <input
            value={note} onChange={(e) => setNote(e.target.value)} placeholder="What do you need from them?"
            className="flex-1 border-2 border-billboard-ink rounded px-3 py-2 text-sm"
          />
          <button
            onClick={() => { onRequestInfo(p.id, note); setShowInfo(false); setNote(""); }}
            disabled={!note.trim()}
            className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-2 disabled:opacity-60"
          >
            Save note
          </button>
        </div>
      )}
      {showReject && (
        <div className="mt-3 flex gap-2">
          <input
            value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (kept on file)"
            className="flex-1 border-2 border-billboard-ink rounded px-3 py-2 text-sm"
          />
          <button
            onClick={() => { onReject(p.id, reason); setShowReject(false); }}
            disabled={!reason.trim()}
            className="font-mono text-xs font-semibold uppercase border-2 border-billboard-red text-billboard-red rounded px-3 py-2 disabled:opacity-60"
          >
            Confirm reject
          </button>
        </div>
      )}
    </div>
  );
}

function BusinessesTab({
  businesses, onToggle,
}: {
  businesses: Profile[];
  onToggle: (id: string, field: "phone_verified" | "business_verified", value: boolean) => void;
}) {
  if (businesses.length === 0) {
    return <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">No business accounts yet.</div>;
  }
  return (
    <div className="space-y-3">
      {businesses.map((b) => {
        const level = computeVerificationLevel(b);
        const detailLine = [
          b.company_name && b.full_name ? b.full_name : null,
          b.phone,
          b.industry,
          b.city ? `${b.city}, ${b.province}` : null,
        ].filter(Boolean).join(" · ");
        const linkLine = [b.website, b.facebook_url, b.instagram_url].filter(Boolean).join(" · ");

        return (
          <div key={b.id} className="border-2 border-billboard-ink rounded p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-bold text-sm">
                  {b.company_name || b.full_name || "Unnamed business"}
                  {level && (
                    <span className="ml-2 font-mono text-[10px] uppercase text-billboard-inkSoft">
                      {VERIFICATION_META[level].emoji} {VERIFICATION_META[level].label}
                    </span>
                  )}
                </p>
                {detailLine && <p className="text-xs text-billboard-inkSoft mt-0.5">{detailLine}</p>}
                {linkLine && <p className="text-xs text-billboard-inkSoft mt-0.5 font-mono">{linkLine}</p>}
                <p className="text-[10px] font-mono uppercase text-billboard-inkSoft mt-1">
                  Email {b.email_verified ? "✓ confirmed" : "not confirmed"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onToggle(b.id, "phone_verified", !b.phone_verified)}
                  className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-1.5 hover:-translate-y-0.5 transition"
                >
                  {b.phone_verified ? "Unverify phone" : "Verify phone"}
                </button>
                <button
                  onClick={() => onToggle(b.id, "business_verified", !b.business_verified)}
                  className="font-mono text-xs font-semibold uppercase border-2 border-billboard-ink rounded px-3 py-1.5 hover:-translate-y-0.5 transition"
                >
                  {b.business_verified ? "Revoke Gold" : "Mark Gold"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
