import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { LEVEL_META, scoreLabel } from "../lib/publisherDisplay";
import { computeVerificationLevel, VERIFICATION_META } from "../lib/businessVerification";
import { getChannelBySlug } from "../lib/channelRegistry";
import { CREATOR_APPROVAL_WINDOW_DAYS, CREATOR_PAYOUT_WINDOW_HOURS } from "../lib/constants";
import MessageThread from "./MessageThread";
import type { Publisher, PublisherRequest, RequestStatus, ChannelRequest, ChannelRequestStatus } from "../lib/types";

const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: "bg-billboard-paperDim text-billboard-inkSoft border-billboard-inkSoft",
  contacted: "bg-billboard-yellow text-billboard-ink border-billboard-ink",
  confirmed: "bg-billboard-green text-white border-billboard-greenDeep",
  declined: "bg-white text-billboard-red border-billboard-red",
  completed: "bg-billboard-ink text-white border-billboard-ink",
};

const CHANNEL_REQUEST_STATUS_STYLE: Record<ChannelRequestStatus, string> = {
  pending: "bg-billboard-paperDim text-billboard-inkSoft border-billboard-inkSoft",
  declined: "bg-white text-billboard-red border-billboard-red",
  cancelled: "bg-white text-billboard-red border-billboard-red",
  awaiting_payment: "bg-billboard-yellow text-billboard-ink border-billboard-ink",
  payment_submitted: "bg-billboard-yellow text-billboard-ink border-billboard-ink",
  paid: "bg-billboard-green text-white border-billboard-greenDeep",
  live: "bg-billboard-green text-white border-billboard-greenDeep",
  completed: "bg-billboard-ink text-white border-billboard-ink",
};

const CHANNEL_REQUEST_STATUS_LABEL: Record<ChannelRequestStatus, string> = {
  pending: "Awaiting your response",
  declined: "Declined",
  cancelled: "Cancelled",
  awaiting_payment: "Awaiting business payment",
  payment_submitted: "Payment reported — confirming",
  paid: "Paid — ready to go live",
  live: "Live — payout due",
  completed: "Paid out",
};

export default function PublisherDashboardView() {
  const { user, profile } = useAuth();
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [requests, setRequests] = useState<PublisherRequest[]>([]);
  const [channelRequests, setChannelRequests] = useState<ChannelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const channelDef = publisher ? getChannelBySlug(publisher.channel_slug)?.definition : undefined;
  const isRequestFlowChannel = channelDef?.bookingFlow === "request";

  async function load() {
    if (!user) return;
    const { data: pub } = await supabase.from("publishers").select("*").eq("user_id", user.id).maybeSingle();
    setPublisher((pub ?? null) as Publisher | null);
    if (pub) {
      const pubChannelDef = getChannelBySlug((pub as Publisher).channel_slug)?.definition;
      if (pubChannelDef?.bookingFlow === "request") {
        const { data: creqs } = await supabase
          .from("channel_requests")
          .select("*, business:profiles(full_name, company_name, phone)")
          .eq("creator_id", pub.id)
          .order("created_at", { ascending: false });
        setChannelRequests((creqs ?? []) as unknown as ChannelRequest[]);
      } else {
        const { data: reqs } = await supabase
          .from("requests")
          .select("*, business:profiles(full_name, company_name, email_verified, phone_verified, business_verified), payments(*), reviews(*)")
          .eq("publisher_id", pub.id)
          .order("created_at", { ascending: false });
        setRequests((reqs ?? []) as unknown as PublisherRequest[]);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-14">
        <div className="h-24 border-[3px] border-billboard-paperDim rounded animate-pulse bg-billboard-paperDim" />
      </div>
    );
  }

  if (!publisher) {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <h1 className="text-2xl mb-3">Finish your application.</h1>
        <p className="text-billboard-inkSoft mb-8">You're signed up, but there's no application on file yet.</p>
        <Link to="/apply" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink bg-billboard-ink text-billboard-paper font-bold px-5 py-3 rounded hover:-translate-y-0.5 transition">
          Continue application →
        </Link>
      </div>
    );
  }

  if (publisher.status === "pending_review") {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-inkSoft text-billboard-inkSoft px-3 py-1.5 rounded mb-4">Pending review</span>
        <h1 className="text-2xl mb-3">Your application's with us.</h1>
        <p className="text-billboard-inkSoft">We review every publisher by hand — we'll email you either way. Nothing else to do here in the meantime.</p>
      </div>
    );
  }

  if (publisher.status === "rejected") {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-4">Not approved</span>
        <h1 className="text-2xl mb-3">Your application wasn't approved.</h1>
        {publisher.rejected_reason && <p className="text-billboard-inkSoft mb-2">{publisher.rejected_reason}</p>}
        <p className="text-billboard-inkSoft">Get in touch if you think this was a mistake or something's changed since you applied.</p>
      </div>
    );
  }

  if (publisher.status === "suspended") {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-4">Suspended</span>
        <h1 className="text-2xl mb-3">Your listing is suspended.</h1>
        <p className="text-billboard-inkSoft">You won't appear in the directory while this is in place. Get in touch for details.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">Your dashboard</span>
      <h1 className="text-3xl md:text-4xl mb-4">
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-10">
        {publisher.level && (
          <span className="bg-billboard-ink text-white text-xs font-mono font-semibold px-2.5 py-1.5 rounded">
            {LEVEL_META[publisher.level].emoji} {LEVEL_META[publisher.level].label}
          </span>
        )}
        {publisher.trust_score > 0 && (
          <span className="text-sm text-billboard-inkSoft">
            {"⭐".repeat(Math.round(publisher.trust_score / 20))}{"☆".repeat(5 - Math.round(publisher.trust_score / 20))} Trust {publisher.trust_score}/100
          </span>
        )}
        {publisher.publisher_score > 0 && (
          <span className="text-xs font-mono uppercase text-billboard-inkSoft">Publisher Score: {scoreLabel(publisher.publisher_score)}</span>
        )}
        <Link to={`/browse/${publisher.id}`} className="ml-auto text-xs font-semibold underline text-billboard-inkSoft">
          View your public listing →
        </Link>
      </div>

      <h2 className="font-display text-lg mb-4">Requests</h2>
      {isRequestFlowChannel ? (
        channelRequests.length === 0 ? (
          <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">
            No requests yet — approved creators show up in Browse and on your channel page, and businesses request you straight from your profile.
          </div>
        ) : (
          <div className="space-y-4">
            {channelRequests.map((r) => <ChannelRequestCard key={r.id} request={r} onChange={load} />)}
          </div>
        )
      ) : requests.length === 0 ? (
        <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">
          No requests yet — approved publishers show up in Browse, and businesses request you straight from there.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => <PublisherRequestCard key={r.id} request={r} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function PublisherRequestCard({ request: r, onChange }: { request: PublisherRequest; onChange: () => void }) {
  const payment = [...(r.payments ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const review = r.reviews?.find((rev) => rev.author_role === "publisher");
  const businessLevel = r.business ? computeVerificationLevel(r.business) : null;

  return (
    <div className="border-[3px] border-billboard-ink rounded p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-bold">
            {r.business?.company_name || r.business?.full_name || "A business"}
            {businessLevel && (
              <span className="ml-2 font-mono text-[10px] uppercase text-billboard-inkSoft">
                {VERIFICATION_META[businessLevel].emoji} {VERIFICATION_META[businessLevel].label}
              </span>
            )}
          </p>
          <p className="text-sm text-billboard-inkSoft mt-1 max-w-md">{r.campaign_message}</p>
          {r.agreed_amount != null && <p className="text-xs text-billboard-inkSoft mt-1 font-mono">Agreed: R{r.agreed_amount}</p>}
        </div>
        <span className={`inline-block font-mono text-xs font-semibold uppercase px-3 py-1.5 rounded border-2 shrink-0 ${STATUS_STYLE[r.status]}`}>
          {r.status}
        </span>
      </div>

      {r.status === "completed" && (
        <div className="mt-4 pt-4 border-t-2 border-billboard-paperDim">
          {payment && (
            <p className="text-sm text-billboard-inkSoft mb-3">
              {payment.payout_status === "paid"
                ? `✓ Paid out${payment.payout_date ? ` ${new Date(payment.payout_date).toLocaleDateString()}` : ""}`
                : "Payout pending — sent once the business's payment clears."}
            </p>
          )}
          {review ? (
            <p className="text-sm text-billboard-inkSoft">You rated this business {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
          ) : (
            <PublisherReviewForm request={r} onDone={onChange} />
          )}
        </div>
      )}

      <MessageThread requestId={r.id} senderRole="publisher" />
    </div>
  );
}

function formatDue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const overdue = d.getTime() < Date.now();
  return `${d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}${overdue ? " (overdue)" : ""}`;
}

function ChannelRequestCard({ request: r, onChange }: { request: ChannelRequest; onChange: () => void }) {
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function respond(newStatus: "awaiting_payment" | "declined") {
    setActing(true);
    setActionError(null);
    const { error } = await supabase.from("channel_requests").update({ status: newStatus }).eq("id", r.id);
    setActing(false);
    if (error) setActionError(error.message);
    else onChange();
  }

  async function markLive() {
    setActing(true);
    setActionError(null);
    const { error } = await supabase.from("channel_requests").update({ status: "live" }).eq("id", r.id);
    setActing(false);
    if (error) setActionError(error.message);
    else onChange();
  }

  return (
    <div className="border-[3px] border-billboard-ink rounded p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-bold">{r.business?.company_name || r.business?.full_name || "A business"}</p>
          <p className="text-xs font-mono uppercase text-billboard-inkSoft mt-1">{r.advertising_method} · R{r.proposed_amount}</p>
          <p className="text-sm text-billboard-inkSoft mt-1 max-w-md">{r.campaign_message}</p>
        </div>
        <span className={`inline-block font-mono text-xs font-semibold uppercase px-3 py-1.5 rounded border-2 shrink-0 ${CHANNEL_REQUEST_STATUS_STYLE[r.status]}`}>
          {CHANNEL_REQUEST_STATUS_LABEL[r.status]}
        </span>
      </div>

      {actionError && <p className="text-billboard-red text-xs font-semibold mt-3">{actionError}</p>}

      {r.status === "pending" && (
        <div className="mt-4 pt-4 border-t-2 border-billboard-paperDim">
          <p className="text-xs text-billboard-inkSoft mb-3">
            Respond by {formatDue(r.approval_due_at)} ({CREATOR_APPROVAL_WINDOW_DAYS}-day window) — unanswered requests simply expire.
          </p>
          <div className="flex gap-2">
            <button onClick={() => respond("awaiting_payment")} disabled={acting} className="border-[3px] border-billboard-ink bg-billboard-green text-white font-bold px-4 py-2 rounded text-sm hover:-translate-y-0.5 transition disabled:opacity-60">
              Approve
            </button>
            <button onClick={() => respond("declined")} disabled={acting} className="border-[3px] border-billboard-ink font-bold px-4 py-2 rounded text-sm hover:bg-billboard-paperDim transition disabled:opacity-60">
              Decline
            </button>
          </div>
        </div>
      )}

      {r.status === "awaiting_payment" && (
        <p className="text-xs text-billboard-inkSoft mt-4 pt-4 border-t-2 border-billboard-paperDim">
          Waiting on the business to pay the platform — due {formatDue(r.payment_due_at)}. Nothing to do until then.
        </p>
      )}

      {r.status === "payment_submitted" && (
        <p className="text-xs text-billboard-inkSoft mt-4 pt-4 border-t-2 border-billboard-paperDim">
          The business reports payment sent — we're confirming funds landed. You'll be able to mark this live shortly.
        </p>
      )}

      {r.status === "paid" && (
        <div className="mt-4 pt-4 border-t-2 border-billboard-paperDim">
          <p className="text-xs text-billboard-inkSoft mb-3">
            Payment confirmed. Once your {r.advertising_method.toLowerCase()} is live, mark it below — you'll be paid within {CREATOR_PAYOUT_WINDOW_HOURS} hours.
          </p>
          <button onClick={markLive} disabled={acting} className="border-[3px] border-billboard-ink bg-billboard-green text-white font-bold px-4 py-2 rounded text-sm hover:-translate-y-0.5 transition disabled:opacity-60">
            Mark as live
          </button>
        </div>
      )}

      {r.status === "live" && (
        <p className="text-xs text-billboard-inkSoft mt-4 pt-4 border-t-2 border-billboard-paperDim">
          Live since {formatDue(r.live_at)} — payout due by {formatDue(r.payout_due_at)}.
        </p>
      )}

      {r.status === "completed" && (
        <p className="text-xs text-billboard-inkSoft mt-4 pt-4 border-t-2 border-billboard-paperDim">
          ✓ Paid out{r.completed_at ? ` ${new Date(r.completed_at).toLocaleDateString()}` : ""}.
        </p>
      )}
    </div>
  );
}

type RatingKey = "communication_rating" | "professionalism_rating" | "quality_rating" | "timeliness_rating" | "value_rating";

const RATING_CATEGORIES: { key: RatingKey; label: string }[] = [
  { key: "communication_rating", label: "Communication" },
  { key: "professionalism_rating", label: "Professionalism" },
  { key: "quality_rating", label: "Quality" },
  { key: "timeliness_rating", label: "Timeliness" },
  { key: "value_rating", label: "Value" },
];

function PublisherReviewForm({ request, onDone }: { request: PublisherRequest; onDone: () => void }) {
  const [ratings, setRatings] = useState<Partial<Record<RatingKey, number>>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const values = RATING_CATEGORIES.map((c) => ratings[c.key] ?? 0);
    if (values.some((v) => v === 0)) {
      setError("Rate all five before submitting.");
      return;
    }
    setSaving(true);
    setError(null);
    const overall = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const { error } = await supabase.from("reviews").insert({
      request_id: request.id,
      publisher_id: request.publisher_id,
      business_id: request.business_id,
      author_role: "publisher",
      rating: overall,
      communication_rating: ratings.communication_rating,
      professionalism_rating: ratings.professionalism_rating,
      quality_rating: ratings.quality_rating,
      timeliness_rating: ratings.timeliness_rating,
      value_rating: ratings.value_rating,
      comment: comment || null,
    });
    setSaving(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <div>
      <p className="text-sm font-semibold mb-2">
        How was working with {request.business?.company_name || request.business?.full_name || "this business"}?
      </p>
      <div className="space-y-1.5 mb-3">
        {RATING_CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono uppercase text-billboard-inkSoft">{c.label}</span>
            <div className="flex gap-0.5 text-lg leading-none">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRatings((r) => ({ ...r, [c.key]: n }))}
                  aria-label={`${c.label} ${n} star${n === 1 ? "" : "s"}`}
                  className="text-billboard-yellow"
                >
                  {n <= (ratings[c.key] ?? 0) ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>
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
