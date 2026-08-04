import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const PRINCIPLES = [
  { title: "Real audiences, not vanity metrics", body: "We manually check pages before they're listed. A follower count means nothing if nobody's actually looking." },
  { title: "One fair price, in the open", body: "75% to the page owner, every time. No hidden platform fee added at checkout, no fine print." },
  { title: "Proof before promises", body: "We're not pretending to be bigger than we are. We're proving this works, one real page and one real business at a time, before we automate anything." },
];

export default function About() {
  // "Proof before promises" above is a principle; this section is what
  // makes it checkable — real counts, pulled from the same publicly
  // readable data Browse and each publisher profile already show (RLS:
  // reviews_select_public, and the same approved-publishers count Browse
  // uses), not a claim anyone has to take on faith. When there's nothing
  // real yet, it says so plainly instead of showing an empty "0" that
  // reads as broken.
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [publisherCount, setPublisherCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from("reviews").select("rating", { count: "exact" }).then(({ data, count }) => {
      setReviewCount(count ?? 0);
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + (r.rating ?? 0), 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    });
    supabase.from("publishers").select("id", { count: "exact", head: true }).eq("status", "approved").then(({ count }) => {
      setPublisherCount(count ?? 0);
    });
  }, []);

  return (
    <div>
      <Seo title="About · Micro Billboards" description="Why Micro Billboards exists, and the principles we're building the pilot around: real audiences, one fair price, proof before promises." />
      <section className="bg-billboard-yellow border-b-[3px] border-billboard-ink py-16">
        <div className="max-w-3xl mx-auto px-5">
          <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-ink bg-billboard-paper px-3 py-1.5 rounded mb-4">About</span>
          <h1 className="text-3xl md:text-4xl mb-5">Every page you follow already has an audience worth paying for.</h1>
          <p className="text-lg text-billboard-inkSoft">
            Local Facebook pages and groups get DMs asking to promote a business every week — usually for free, usually informally, usually forgotten by the next post. Micro Billboards turns that into something both sides can actually rely on: a fair price, a real audience, and a page owner who gets paid for the community they've already built.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 py-16">
        <h2 className="font-display text-xl mb-8">What we believe</h2>
        <div className="space-y-6">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="border-l-4 border-billboard-green pl-5">
              <h3 className="font-bold mb-1">{p.title}</h3>
              <p className="text-billboard-inkSoft text-sm">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-16">
        <h2 className="font-display text-xl mb-3">Proof so far</h2>
        {reviewCount === null ? null : reviewCount === 0 ? (
          <p className="text-billboard-inkSoft border-l-4 border-billboard-yellow pl-5">
            No completed campaigns yet — we're that early. This section fills in with real numbers as real businesses and page owners come through the pilot, not before.
          </p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="border-[3px] border-billboard-ink rounded p-5 bg-white">
              <p className="text-2xl font-bold">{publisherCount ?? "—"}</p>
              <p className="text-xs text-billboard-inkSoft mt-1">Approved publishers</p>
            </div>
            <div className="border-[3px] border-billboard-ink rounded p-5 bg-white">
              <p className="text-2xl font-bold">{reviewCount}</p>
              <p className="text-xs text-billboard-inkSoft mt-1">Reviews from real campaigns</p>
            </div>
            <div className="border-[3px] border-billboard-ink rounded p-5 bg-white">
              <p className="text-2xl font-bold">{avgRating ? `★ ${avgRating}` : "—"}</p>
              <p className="text-xs text-billboard-inkSoft mt-1">Average rating</p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-billboard-paperDim border-y-[3px] border-billboard-ink py-16">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="font-display text-xl mb-3">Where we are right now</h2>
          <p className="text-billboard-inkSoft mb-6">
            We're piloting in Cape Town, onboarding businesses and page owners personally before opening things up further. If something breaks or feels rough around the edges, it's because we're still building it in the open — tell us, and we'll fix it.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/browse" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink font-bold px-5 py-3 rounded bg-white">Browse Publishers →</Link>
            <Link to="/contact" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink font-bold px-5 py-3 rounded bg-billboard-yellow">Get in touch →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
