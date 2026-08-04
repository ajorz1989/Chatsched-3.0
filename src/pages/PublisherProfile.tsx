import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { usePublishers } from "../hooks/usePublishers";
import { useAuth } from "../hooks/useAuth";
import { useComparison } from "../contexts/ComparisonContext";
import { useSavedLists } from "../contexts/SavedListsContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import SetupNotice from "../components/SetupNotice";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import ChannelRequestForm from "../components/ChannelRequestForm";
import Seo from "../components/Seo";
import { LEVEL_META, scoreLabel } from "../lib/publisherDisplay";
import { whatsappLink } from "../lib/constants";
import { getChannelBySlug } from "../lib/channelRegistry";
import type { Review } from "../lib/types";

export default function PublisherProfile() {
  const { id } = useParams();
  const { publishers, loading } = usePublishers();
  const { user, profile } = useAuth();
  const { isComparing, togglePublisher, isFull } = useComparison();
  const { lists, addToList, createList, isInAnyList } = useSavedLists();

  const publisher = publishers.find(p => p.id === id);

  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Save menu
  const [showSave, setShowSave] = useState(false);
  const [newListName, setNewListName] = useState("");
  const saveRef = useRef<HTMLDivElement>(null);

  // Media kit notice
  const [showMediaKit, setShowMediaKit] = useState(false);

  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;
    supabase
      .from("reviews")
      .select("*, business:profiles(full_name, company_name)")
      .eq("publisher_id", id)
      .eq("author_role", "business")
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews((data ?? []) as unknown as Review[]));
  }, [id]);

  useEffect(() => {
    if (!showSave) return;
    function onDown(e: MouseEvent) {
      if (saveRef.current && !saveRef.current.contains(e.target as Node)) setShowSave(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showSave]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (loading) return <div className="max-w-3xl mx-auto px-5 py-24 text-center text-billboard-inkSoft">Loading…</div>;

  if (!publisher) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <h1 className="text-2xl mb-3">Publisher not found</h1>
        <p className="text-billboard-inkSoft mb-6">This listing may have moved.</p>
        <Link to="/browse" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink font-bold px-5 py-3 rounded">← Back to Browse</Link>
      </div>
    );
  }

  const liveRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : publisher.rating;
  const liveReviewCount = reviews.length > 0 ? reviews.length : publisher.reviews;
  const comparing = isComparing(publisher.id);
  const saved = isInAnyList(publisher.id);

  // Is the logged-in user the owner of this publisher profile?
  const isOwner = profile?.role === "publisher" && publisher.user_id === user?.id;

  // The 4 request-flow channels replace the directory pricing + PayFast
  // request form with ChannelRequestForm (below). social-media — and any
  // legacy row with no channel_slug set — keeps this page's original
  // behavior completely unchanged.
  const channelDef = getChannelBySlug(publisher.channel_slug)?.definition;
  const isRequestFlowChannel = !!channelDef && channelDef.bookingFlow === "request";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !publisher) return;
    setSending(true);
    setFormError(null);
    const { data: inserted, error } = await supabase
      .from("requests")
      .insert({ publisher_id: publisher.id, business_id: user.id, campaign_message: message, budget: budget ? Number(budget) : null })
      .select()
      .single();
    setSending(false);
    if (error) setFormError(error.message);
    else {
      setSent(true);
      if (inserted) supabase.functions.invoke("notify", { body: { kind: "new_request", request_id: inserted.id } }).catch(() => {});
    }
  }

  function handleSaveToNewList(e: FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    const id2 = createList(newListName);
    addToList(id2, publisher!.id);
    setNewListName("");
    setShowSave(false);
  }

  return (
    <div>
      <Seo
        title={`${publisher.name} · Micro Billboards`}
        description={`${publisher.name} in ${publisher.city}, ${publisher.province} — ${publisher.followers.toLocaleString()} followers, R${publisher.price_per_post}/post. ${publisher.bio}`.slice(0, 160)}
      />
      <div className={`h-56 md:h-64 bg-gradient-to-br ${publisher.swatch} border-b-[3px] border-billboard-ink`} />

      <div className="max-w-5xl mx-auto px-5">
        <div className="flex flex-col md:flex-row gap-8 -mt-12 mb-10">
          <div className="w-24 h-24 rounded-full bg-billboard-yellow border-[3px] border-billboard-ink flex items-center justify-center font-display text-xl shrink-0 shadow-block bg-white">
            {publisher.initials}
          </div>
          <div className="flex-1 pt-2 md:pt-14">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl">{publisher.name}</h1>
              {publisher.verified && (
                <span className="bg-billboard-ink text-white text-[11px] font-mono font-semibold px-2 py-1 rounded">✓ Verified</span>
              )}
              {publisher.level && (
                <span className="bg-billboard-ink text-white text-[11px] font-mono font-semibold px-2 py-1 rounded">
                  {LEVEL_META[publisher.level].emoji} {LEVEL_META[publisher.level].label}
                </span>
              )}
            </div>
            <p className="text-billboard-inkSoft mb-2">
              {publisher.city}{publisher.suburb ? ` (${publisher.suburb})` : ""}, {publisher.province} · {publisher.category}
              {isRequestFlowChannel && channelDef && (
                <span className="ml-1.5 font-mono text-xs uppercase text-billboard-greenDeep">· {channelDef.emoji} {channelDef.name}</span>
              )}
            </p>
            {(publisher.trust_score > 0 || publisher.publisher_score > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-billboard-inkSoft mb-3">
                {publisher.trust_score > 0 && (
                  <span>
                    {"⭐".repeat(Math.round(publisher.trust_score / 20))}{"☆".repeat(5 - Math.round(publisher.trust_score / 20))} Trust {publisher.trust_score}/100
                  </span>
                )}
                {publisher.publisher_score > 0 && (
                  <span className="font-mono uppercase">Publisher Score: {scoreLabel(publisher.publisher_score)}</span>
                )}
              </div>
            )}

            {/* Compare + Save actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => togglePublisher(publisher.id)}
                disabled={!comparing && isFull}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border-2 transition ${
                  comparing
                    ? "border-billboard-green bg-billboard-green text-white"
                    : "border-billboard-ink hover:bg-billboard-paperDim disabled:opacity-40"
                }`}
              >
                {comparing ? "✓ In comparison" : isFull ? "Comparison full" : "⊞ Compare"}
              </button>
              {comparing && (
                <Link to="/compare" className="text-xs font-semibold underline text-billboard-green">View comparison →</Link>
              )}

              {/* Save dropdown */}
              <div className="relative" ref={saveRef}>
                <button
                  onClick={() => setShowSave(s => !s)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border-2 transition ${
                    saved
                      ? "border-billboard-yellow bg-billboard-yellow text-billboard-ink"
                      : "border-billboard-ink hover:bg-billboard-paperDim"
                  }`}
                >
                  {saved ? "★ Saved to list" : "☆ Save to list"}
                </button>
                {showSave && (
                  <div className="absolute top-full mt-1 left-0 z-30 w-56 bg-white border-[3px] border-billboard-ink rounded shadow-block overflow-hidden">
                    {lists.length > 0 && (
                      <div className="max-h-40 overflow-y-auto">
                        {lists.map(list => (
                          <button
                            key={list.id}
                            onClick={() => { addToList(list.id, publisher.id); setShowSave(false); }}
                            className="w-full text-left px-3 py-2.5 text-xs font-semibold hover:bg-billboard-paperDim border-b border-billboard-paperDim last:border-0 truncate"
                          >
                            {list.publisherIds.includes(publisher.id) ? "✓ " : "+ "}{list.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleSaveToNewList} className={`p-2.5 ${lists.length > 0 ? "border-t-2 border-billboard-paperDim" : ""}`}>
                      <p className="text-[10px] font-mono uppercase text-billboard-inkSoft mb-1.5">New list</p>
                      <input
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        placeholder="e.g. Winter Campaign"
                        className="w-full border-2 border-billboard-ink rounded px-2 py-1.5 text-xs mb-2 bg-white"
                        autoFocus={lists.length === 0}
                      />
                      <button type="submit" className="w-full bg-billboard-yellow border-2 border-billboard-ink font-bold text-xs py-1.5 rounded">
                        Create & save
                      </button>
                    </form>
                    <Link to="/lists" onClick={() => setShowSave(false)} className="block text-center text-[10px] font-mono uppercase text-billboard-inkSoft py-2 hover:bg-billboard-paperDim border-t border-billboard-paperDim">
                      Manage lists →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-10 pb-20">
          {/* ── Left column ── */}
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {publisher.platforms.map(p => (
                <span key={p} className="font-mono text-xs border-2 border-billboard-ink rounded-full px-3 py-1 bg-billboard-paperDim">{p}</span>
              ))}
              {publisher.languages?.length > 0 && publisher.languages.map(l => (
                <span key={l} className="font-mono text-xs border-2 border-billboard-inkSoft rounded-full px-3 py-1 bg-white text-billboard-inkSoft">{l}</span>
              ))}
            </div>

            <h2 className="font-display text-lg mb-2">About this page</h2>
            <p className="text-billboard-inkSoft mb-8 leading-relaxed">{publisher.bio}</p>

            <h2 className="font-display text-lg mb-3">Audience</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="border-2 border-billboard-ink rounded p-4">
                <div className="font-display text-xl">{publisher.followers.toLocaleString()}</div>
                <div className="text-xs font-mono uppercase text-billboard-inkSoft mt-1">Followers</div>
              </div>
              <div className="border-2 border-billboard-ink rounded p-4">
                <div className="font-display text-xl">{publisher.engagement}%</div>
                <div className="text-xs font-mono uppercase text-billboard-inkSoft mt-1">Engagement rate</div>
              </div>
              <div className="border-2 border-billboard-ink rounded p-4">
                <div className="font-display text-xl">{liveRating ? `★ ${liveRating.toFixed(1)}` : "New"}</div>
                <div className="text-xs font-mono uppercase text-billboard-inkSoft mt-1">{liveReviewCount} review{liveReviewCount === 1 ? "" : "s"}</div>
              </div>
            </div>
            {publisher.monthly_reach != null && (
              <div className="border-2 border-billboard-ink rounded p-4 mb-4">
                <div className="font-display text-xl">{publisher.monthly_reach.toLocaleString()}</div>
                <div className="text-xs font-mono uppercase text-billboard-inkSoft mt-1">Monthly reach</div>
              </div>
            )}
            <p className="text-sm text-billboard-inkSoft mb-8">Audience: {publisher.audience}</p>

            {/* Availability calendar */}
            <div className="mb-8">
              <h2 className="font-display text-lg mb-1">Availability</h2>
              <p className="text-sm text-billboard-inkSoft mb-3">
                {isOwner
                  ? "Click dates to mark them as unavailable. Businesses can see this before requesting."
                  : "Check availability before sending a campaign request."}
              </p>
              <AvailabilityCalendar publisherId={publisher.id} canEdit={isOwner} />
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <>
                <h2 className="font-display text-lg mb-3 mt-8">What businesses say</h2>
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="border-2 border-billboard-ink rounded p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm">{rev.business?.company_name || rev.business?.full_name || "A business"}</span>
                        <span className="text-billboard-yellow text-sm">{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                      </div>
                      {rev.communication_rating != null && (
                        <p className="text-[11px] font-mono uppercase text-billboard-inkSoft mb-1.5">
                          Communication {rev.communication_rating} · Professionalism {rev.professionalism_rating} · Quality {rev.quality_rating} · Timeliness {rev.timeliness_rating} · Value {rev.value_rating}
                        </p>
                      )}
                      {rev.comment && <p className="text-sm text-billboard-inkSoft">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="border-[3px] border-billboard-ink rounded p-6 h-fit bg-billboard-paperDim sticky top-24">
            {isRequestFlowChannel ? (
              <>
                <div className="font-display text-lg font-bold text-billboard-greenDeep mb-1">Pricing varies</div>
                <div className="text-xs text-billboard-inkSoft mb-5">Propose your budget in the request below — minimum recommended is R{channelDef?.minBudgetZAR.toLocaleString()}.</div>
              </>
            ) : (
              <>
                <div className="font-mono text-3xl font-bold text-billboard-greenDeep mb-1">R{publisher.price_per_post}</div>
                <div className="text-xs text-billboard-inkSoft mb-5">per post</div>
              </>
            )}

            {/* Media kit */}
            <div className="mb-5 relative">
              <button
                onClick={() => setShowMediaKit(s => !s)}
                className="w-full inline-flex justify-center items-center gap-2 border-[3px] border-billboard-ink font-bold py-2.5 rounded hover:-translate-y-0.5 transition text-sm bg-white"
              >
                📄 Download Media Kit
              </button>
              {showMediaKit && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border-[3px] border-billboard-ink rounded p-4 shadow-block z-20">
                  <p className="font-bold text-sm mb-1">Coming Soon</p>
                  <p className="text-xs text-billboard-inkSoft">
                    Branded PDF media kits — including audience demographics, reach, pricing, previous campaigns, and reviews — are in development. Check back soon.
                  </p>
                  <button onClick={() => setShowMediaKit(false)} className="mt-3 text-xs font-semibold underline text-billboard-inkSoft">Close</button>
                </div>
              )}
            </div>

            {isRequestFlowChannel ? (
              <ChannelRequestForm publisher={publisher} />
            ) : sent ? (
              <div className="border-2 border-billboard-greenDeep bg-[#EAF3EC] text-billboard-greenDeep rounded p-4 text-sm font-semibold">
                Request sent — {publisher.name} will get back to you. Track it from your dashboard.
              </div>
            ) : !user ? (
              <div className="border-2 border-billboard-ink rounded p-4 mb-3 bg-white">
                <p className="text-sm mb-3">Log in to request a campaign with {publisher.name}.</p>
                <Link to="/login" className="w-full inline-flex justify-center bg-billboard-yellow border-[3px] border-billboard-ink font-bold py-2.5 rounded hover:-translate-y-0.5 transition">Log in</Link>
                <p className="text-xs text-billboard-inkSoft mt-2">New here? <Link to="/register" className="underline font-semibold">Create a business account</Link></p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">What's the campaign?</label>
                <textarea
                  required value={message} onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. A launch post for our new winter menu, some time in the next two weeks"
                  className="w-full border-2 border-billboard-ink rounded px-3 py-2 mb-3 bg-white text-sm"
                />
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Budget (optional)</label>
                <input
                  type="number" min={0} value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="R"
                  className="w-full border-2 border-billboard-ink rounded px-3 py-2 mb-3 bg-white text-sm"
                />
                {formError && <p className="text-billboard-red text-xs font-semibold mb-3">{formError}</p>}
                <button type="submit" disabled={sending} className="w-full bg-billboard-yellow border-[3px] border-billboard-ink font-bold py-3 rounded hover:-translate-y-0.5 transition disabled:opacity-60">
                  {sending ? "Sending…" : "Request a campaign"}
                </button>
              </form>
            )}

            <a
              href={whatsappLink(`Hi, I'm interested in booking a post with ${publisher.name}`)}
              target="_blank" rel="noopener noreferrer"
              className="w-full inline-flex justify-center items-center gap-2 border-[3px] border-billboard-greenDeep bg-billboard-green text-white font-bold py-3 rounded hover:bg-billboard-greenDeep transition"
            >
              Contact via WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
