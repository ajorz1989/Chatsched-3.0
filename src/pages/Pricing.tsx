import { Link } from "react-router-dom";
import { useState } from "react";
import Seo from "../components/Seo";

const FAQS = [
  { q: "Why do some publishers cost more than R100?", a: "R100 is the starting price for smaller pages. Larger audiences and higher engagement command a higher price — each publisher sets their own, and you always see it before you book." },
  { q: "Is there a monthly fee to list my page?", a: "No, never. Listing is free. You only get paid when a business books a post." },
  { q: "Are there any hidden costs for businesses?", a: "No. The price shown on a publisher's profile is the full price — no extra platform fee added at checkout." },
  { q: "How and when do page owners get paid?", a: "Once your post is confirmed live, we track the payout and pay you out ourselves within days — no automated system yet, but no chasing invoices either." },
];

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-2 border-billboard-ink">
      <button onClick={() => setOpen(!open)} className="w-full text-left py-4 flex justify-between items-center gap-4 font-bold">
        {q}
        <span className={`font-mono text-xl transition-transform shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all ${open ? "max-h-40 pb-4" : "max-h-0"}`}>
        <p className="text-billboard-inkSoft text-sm">{a}</p>
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <div>
      <Seo title="Pricing · Micro Billboards" description="One fair price, no hidden fees. Publishers keep 75% of every booking, businesses see the full price up front." />
      <section className="bg-billboard-ink text-billboard-paper py-16 border-b-[3px] border-billboard-ink">
        <div className="max-w-5xl mx-auto px-5">
          <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-yellow text-billboard-yellow px-3 py-1.5 rounded mb-3">Pricing</span>
          <h1 className="text-3xl md:text-4xl mb-8 max-w-xl">One fair price. Split right in the open.</h1>
          <div className="grid md:grid-cols-[0.8fr_1.2fr] gap-10 items-center">
            <div>
              <div className="font-display text-6xl text-billboard-yellow leading-none">R100</div>
              <div className="font-mono text-sm uppercase tracking-wider mt-2.5">Starting price, per post</div>
            </div>
            <div>
              <div className="flex h-14 rounded overflow-hidden border-2 border-billboard-paper mb-3">
                <div className="w-[75%] bg-billboard-green flex items-center justify-center font-mono font-bold">75% Page Owner</div>
                <div className="w-[25%] bg-billboard-yellow text-billboard-ink flex items-center justify-center font-mono font-bold">25%</div>
              </div>
              <ul className="text-sm text-billboard-paperDim space-y-1.5">
                <li>— Free to list. No monthly fees for page owners.</li>
                <li>— No hidden costs — the price you see is the price you pay.</li>
                <li>— Prices vary by publisher, based on audience size and engagement.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-10">
        <div className="border-[3px] border-billboard-ink rounded p-6">
          <h2 className="font-display text-lg mb-3">For Businesses</h2>
          <ul className="text-sm text-billboard-inkSoft space-y-2">
            <li>• Pay per post, from R100 — no ad account or monthly contract</li>
            <li>• See the exact price before you book, always</li>
            <li>• Pay securely online, no cash or manual EFT chasing</li>
          </ul>
          <Link to="/browse" className="inline-flex mt-5 items-center gap-2 border-[3px] border-billboard-ink font-bold px-4 py-2.5 rounded text-sm">Browse Publishers →</Link>
        </div>
        <div className="border-[3px] border-billboard-ink rounded p-6 bg-billboard-paperDim">
          <h2 className="font-display text-lg mb-3">For Page &amp; Group Owners</h2>
          <ul className="text-sm text-billboard-inkSoft space-y-2">
            <li>• Free to list, always — no subscription</li>
            <li>• Set your own price per post</li>
            <li>• Keep 75% of every booking, paid out on schedule</li>
          </ul>
          <Link to="/register" className="inline-flex mt-5 items-center gap-2 border-[3px] border-billboard-ink font-bold px-4 py-2.5 rounded text-sm">Become a Publisher →</Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 pb-20">
        <h2 className="font-display text-xl mb-2">Pricing questions</h2>
        <div>{FAQS.map((f) => <FaqRow key={f.q} {...f} />)}</div>
      </section>
    </div>
  );
}
