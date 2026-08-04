import { useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";

const BUSINESS_STEPS = [
  { title: "Find your billboard", body: "Browse pages and groups by category, province and price to find the audience that matches your customers." },
  { title: "Book & pay", body: "Pick a publisher, confirm your post, and pay securely online — no ad account or campaign manager required." },
  { title: "Watch it go live", body: "Your post goes up on schedule, and you get proof it's live before you're asked to pay again." },
];
const OWNER_STEPS = [
  { title: "List your page", body: "Tell us your niche, audience and price. It's free to join, always — no monthly fee, ever." },
  { title: "Get booked", body: "Local businesses find your page through search and category browsing, and request a post." },
  { title: "Get paid", body: "Once the post is confirmed live, you keep 75% of the booking, paid out on a regular schedule." },
];

const PROCESS_FAQS = [
  { q: "How do I know a page's followers are real?", a: "We manually check every page before it's listed — real audience insight screenshots, not just a follower count." },
  { q: "Do I need to sign a contract?", a: "No. Book one post or many — there's no minimum commitment on either side." },
  { q: "Which cities are you in?", a: "We're piloting in Cape Town first, with more cities planned as the model proves out." },
];

export default function HowItWorks() {
  const [tab, setTab] = useState<"business" | "owner">("business");
  const steps = tab === "business" ? BUSINESS_STEPS : OWNER_STEPS;

  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <Seo title="How It Works · Micro Billboards" description="How businesses book a campaign and how page owners get booked and paid — the simple version, for both sides." />
      <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">How it works</span>
      <h1 className="text-3xl md:text-4xl mb-8 max-w-xl">Two sides, one board.</h1>

      <div className="inline-flex border-[3px] border-billboard-ink rounded overflow-hidden mb-10">
        <button
          onClick={() => setTab("business")}
          className={`px-5 py-3 font-bold text-sm ${tab === "business" ? "bg-billboard-ink text-billboard-paper" : "bg-billboard-paper"}`}
        >
          For Businesses
        </button>
        <button
          onClick={() => setTab("owner")}
          className={`px-5 py-3 font-bold text-sm border-l-[3px] border-billboard-ink ${tab === "owner" ? "bg-billboard-ink text-billboard-paper" : "bg-billboard-paper"}`}
        >
          For Page &amp; Group Owners
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-16">
        {steps.map((s, i) => (
          <div key={s.title} className="border-[3px] border-billboard-ink rounded p-5 bg-white transition hover:-translate-y-1 hover:shadow-blockSm">
            <div className="font-display text-2xl text-billboard-yellowDeep mb-2" style={{ WebkitTextStroke: "1.5px #1A1712" }}>0{i + 1}</div>
            <h3 className="font-bold mb-1.5">{s.title}</h3>
            <p className="text-sm text-billboard-inkSoft">{s.body}</p>
          </div>
        ))}
      </div>

      {/* See it in action */}
      <div className="bg-billboard-paperDim border-[3px] border-billboard-ink rounded-lg p-8 md:p-10 mb-16">
        <h2 className="font-display text-xl mb-1.5">See it in action</h2>
        <p className="text-sm text-billboard-inkSoft mb-8">Concept previews of how listings and conversations work — we're still building the real thing.</p>
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div className="border-[3px] border-billboard-ink rounded-lg overflow-hidden bg-white shadow-block">
            <div className="bg-billboard-ink px-3.5 py-2.5 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6b6250]" /><span className="w-2 h-2 rounded-full bg-[#6b6250]" /><span className="w-2 h-2 rounded-full bg-[#6b6250]" />
            </div>
            <div className="p-6">
              <div className="border-2 border-billboard-ink rounded p-4 flex gap-3.5">
                <div className="w-13 h-13 rounded-full bg-billboard-yellow border-2 border-billboard-ink flex items-center justify-center font-display text-xs shrink-0" style={{width: 52, height: 52}}>BB</div>
                <div>
                  <strong>Bean &amp; Bay Coffee Club</strong>
                  <div className="flex gap-1.5 my-1.5 flex-wrap">
                    <span className="font-mono text-[10px] border border-billboard-ink rounded-full px-2 py-0.5 bg-billboard-paperDim">Facebook Group</span>
                    <span className="font-mono text-[10px] border border-billboard-ink rounded-full px-2 py-0.5 bg-billboard-paperDim">Cape Town</span>
                  </div>
                  <div className="font-mono font-bold text-billboard-greenDeep text-sm">R120 per post</div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-[220px] mx-auto border-[3px] border-billboard-ink rounded-[24px] p-4 bg-white shadow-block">
            <div className="w-14 h-1.5 bg-billboard-ink rounded mx-auto mb-4" />
            <div className="max-w-[88%] px-3 py-2 rounded-xl text-xs mb-2 border-[1.5px] border-billboard-ink bg-billboard-paperDim rounded-bl-sm">Hi! Any space for a post this week? 🙂</div>
            <div className="max-w-[88%] ml-auto px-3 py-2 rounded-xl text-xs border-[1.5px] border-billboard-greenDeep bg-billboard-green text-white rounded-br-sm">Yes — R120, live within 24 hours ✅</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mb-16">
        <h2 className="font-display text-xl mb-2">Process questions</h2>
        {PROCESS_FAQS.map((f) => (
          <div key={f.q} className="border-b-2 border-billboard-ink py-4">
            <h3 className="font-bold text-sm mb-1.5">{f.q}</h3>
            <p className="text-billboard-inkSoft text-sm">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/browse" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink font-bold px-5 py-3 rounded">Find Publishers →</Link>
        <Link to="/register" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink bg-billboard-yellow font-bold px-5 py-3 rounded">Become a Publisher →</Link>
      </div>
    </div>
  );
}
