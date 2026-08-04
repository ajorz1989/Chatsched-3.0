import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { redirectToPayfast } from "../lib/payfastRedirect";
import MessageThread from "../components/MessageThread";
import PublisherDashboardView from "../components/PublisherDashboardView";
import MarketingSuite from "../components/marketingSuite/MarketingSuite";
import Seo from "../components/Seo";
import { computeVerificationLevel, VERIFICATION_META } from "../lib/businessVerification";
import type { Profile, PublisherRequest, RequestStatus } from "../lib/types";

const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: "bg-billboard-paperDim text-billboard-inkSoft border-billboard-inkSoft",
  contacted: "bg-billboard-yellow text-billboard-ink border-billboard-ink",
  confirmed: "bg-billboard-green text-white border-billboard-greenDeep",
  declined: "bg-white text-billboard-red border-billboard-red",
  completed: "bg-billboard-ink text-white border-billboard-ink",
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<PublisherRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("requests")
      .select("*, publisher:publishers(id, name, city, province), payments(*), reviews(*)")
      .eq("business_id", user.id)
      .order("created_at", { ascending: false });
    setRequests((data ?? []) as unknown as PublisherRequest[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Admins manage things from /admin instead.
  if (profile?.role === "admin") return <Navigate to="/admin" replace />;
  // Publishers get a different view entirely — their own requests, scores,
  // and a way to review the business once a campaign's done.
  if (profile?.role === "publisher") return <PublisherDashboardView />;

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <Seo title="Your Dashboard · Micro Billboards" noindex />
      <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">Your dashboard</span>
      <h1 className="text-3xl md:text-4xl mb-2">
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
      </h1>
      <p className="text-billboard-inkSoft mb-6">Track every campaign request you've sent, in one place.</p>

      {profile && <BusinessProfileCard profile={profile} onSaved={load} />}

      {/* Marketing Suite — business only; publishers/admins never reach this branch */}
      <MarketingSuite />

      <h2 className="font-display text-lg mb-4">Your requests</h2>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => <div key={i} className="h-24 border-[3px] border-billboard-paperDim rounded animate-pulse bg-billboard-paperDim" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">
          No requests yet — <Link to="/browse" className="underline font-semibold text-billboard-ink">browse publishers</Link> to book your first campaign.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => <RequestCard key={r.id} request={r} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function RequestCard({ request: r, onChange }: { request: PublisherRequest; onChange: () => void }) {
  const { user, profile } = useAuth();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const payment = [...(r.payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const review = r.reviews?.[0];

  async function handlePay() {
    setPaying(true);
    setPayError(null);
    const { data, error } = await supabase.functions.invoke("payfast-checkout", { body: { request_id: r.id } });
    setPaying(false);
    if (error || data?.error) {
      setPayError(data?.error ?? "Couldn't start the payment — try again in a moment.");
      return;
    }
    redirectToPayfast(data.action_url, data.fields);
  }

  return (
    <div className="border-[3px] border-billboard-ink rounded p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link to={`/browse/${r.publisher_id}`} className="font-bold hover:text-billboard-greenDeep">
            {r.publisher?.name ?? "Publisher"}
          </Link>
          <p className="text-sm text-billboard-inkSoft mt-1 max-w-md">{r.campaign_message}</p>
          {r.budget != null && <p className="text-xs text-billboard-inkSoft mt-1 font-mono">Suggested budget: R{r.budget}</p>}
        </div>
        <span className={`inline-block font-mono text-xs font-semibold uppercase px-3 py-1.5 rounded border-2 shrink-0 ${STATUS_STYLE[r.status]}`}>
          {r.status}
        </span>
      </div>

      {r.status === "confirmed" && (
        <div className="mt-4 pt-4 border-t-2 border-billboard-paperDim">
          {payment?.status === "paid" ? (
            <p className="text-sm font-semibold text-billboard-greenDeep">✓ Paid — R{payment.amount}</p>
          ) : payment?.status === "pending" ? (
            <p className="text-sm text-billboard-inkSoft">Payment in progress — this updates automatically once PayFast confirms it. If it's been a while, try again below.</p>
          ) : r.agreed_amount == null ? (
            <p className="text-sm text-billboard-inkSoft">Confirmed — we'll set a final amount shortly, then you can pay here.</p>
          ) : null}

          {payment?.status !== "paid" && r.agreed_amount != null && (
            <div className="mt-2">
              <button
                onClick={handlePay}
                disabled={paying}
                className="bg-billboard-yellow border-[3px] border-billboard-ink font-bold px-5 py-2.5 rounded hover:-translate-y-0.5 transition disabled:opacity-60"
              >
                {paying ? "Redirecting…" : `Pay now — R${r.agreed_amount}`}
              </button>
              {payError && <p className="text-billboard-red text-xs font-semibold mt-2">{payError}</p>}
            </div>
          )}
        </div>
      )}

      {r.status === "completed" && (
        <div className="mt-4 pt-4 border-t-2 border-billboard-paperDim">
          {review ? (
            <p className="text-sm text-billboard-inkSoft">You rated this campaign {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
          ) : (
            <ReviewForm request={r} onDone={onChange} />
          )}
        </div>
      )}

      {/* Quick "Book again" button for businesses who ran this campaign */}
      {profile?.role === "business" && user?.id === r.business_id && r.status === "completed" && (
        <div className="mt-4">
          <button
            onClick={async () => {
              if (!user) { alert("Please sign in to book again."); return; }
              const ok = confirm("Create a new request with the same message and budget?");
              if (!ok) return;
              try {
                const { data: newReq, error } = await supabase.from("requests").insert({
                  publisher_id: r.publisher_id,
                  business_id: user.id,
                  campaign_message: r.campaign_message,
                  budget: r.budget,
                  status: "pending",
                }).select().single();
                if (error) throw error;
                // best-effort notify (non-blocking)
                supabase.functions.invoke("notify", { body: { kind: "new_request", request_id: newReq.id } }).catch(() => {});
                alert("Request created — the publisher will be notified.");
                onChange();
              } catch (err: any) {
                alert("Could not create request: " + (err.message ?? err));
              }
            }}
            className="font-mono text-xs font-semibold uppercase border-2 border-billboard-yellow bg-billboard-yellow text-billboard-ink rounded px-3 py-1.5"
          >
            Book again
          </button>
        </div>
      )}

      <MessageThread requestId={r.id} senderRole="business" />
    </div>
  );
}

function ReviewForm({ request, onDone }: { request: PublisherRequest; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("reviews").insert({
      request_id: request.id,
      publisher_id: request.publisher_id,
      business_id: request.business_id,
      rating,
      comment: comment || null,
    });
    setSaving(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <div>
      <p className="text-sm font-semibold mb-2">How did it go with {request.publisher?.name ?? "this publisher"}?</p>
      <div className="flex gap-1 mb-3 text-2xl leading-none">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`} className="text-billboard-yellow">
            {n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Optional — what stood out?"
        className="w-full border-2 border-billboard-ink rounded px-3 py-2 mb-3 bg-white text-sm"
      />
      {error && <p className="text-billboard-red text-xs font-semibold mb-2">{error}</p>}
      <button onClick={submit} disabled={saving} className="border-[3px] border-billboard-ink font-bold px-4 py-2 rounded text-sm hover:-translate-y-0.5 transition disabled:opacity-60">
        {saving ? "Saving…" : "Submit review"}
      </button>
    </div>
  );
}

// email_verified / phone_verified / business_verified are never editable
// here — trg_prevent_self_verification (schema_phase7.sql) silently resets
// them for anyone but an admin, so this form only ever touches the plain
// profile fields below it.
function BusinessProfileCard({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [province, setProvince] = useState(profile.province ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [industry, setIndustry] = useState(profile.industry ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [facebook, setFacebook] = useState(profile.facebook_url ?? "");
  const [instagram, setInstagram] = useState(profile.instagram_url ?? "");
  const [saving, setSaving] = useState(false);

  const level = computeVerificationLevel(profile);

  async function save() {
    setSaving(true);
    await supabase.from("profiles").update({
      province, city, industry,
      website: website || null,
      facebook_url: facebook || null,
      instagram_url: instagram || null,
    }).eq("id", profile.id);
    setSaving(false);
    setEditing(false);
    onSaved();
  }

  return (
    <div className="border-[3px] border-billboard-ink rounded p-5 mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        {level ? (
          <span className="bg-billboard-ink text-white text-xs font-mono font-semibold px-2.5 py-1.5 rounded">
            {VERIFICATION_META[level].emoji} {VERIFICATION_META[level].label}
          </span>
        ) : (
          <span className="text-xs font-mono uppercase text-billboard-inkSoft">Not yet verified</span>
        )}
        <button onClick={() => setEditing((e) => !e)} className="text-xs font-semibold underline text-billboard-inkSoft">
          {editing ? "Cancel" : "Edit business profile"}
        </button>
      </div>
      <p className="text-xs text-billboard-inkSoft">
        {profile.email_verified ? "✓ Email confirmed" : "Email not yet confirmed"}
        {" · "}{profile.phone_verified ? "✓ Phone verified" : "Phone not yet verified by us"}
        {" · "}{profile.business_verified ? "✓ Business verified" : "Not yet Gold verified"}
      </p>

      {editing && (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Province</label>
            <input value={province} onChange={(e) => setProvince(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Industry</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Facebook</label>
            <input value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Instagram</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 text-sm" />
          </div>
          <button onClick={save} disabled={saving} className="sm:col-span-2 bg-billboard-yellow border-[3px] border-billboard-ink font-bold py-2 rounded hover:-translate-y-0.5 transition disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
