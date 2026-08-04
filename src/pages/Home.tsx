import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePublishers } from "../hooks/usePublishers";
import PublisherCard from "../components/PublisherCard";
import { useReveal } from "../hooks/useReveal";
import LiveChannelTabs from "../components/LiveChannelTabs";
import Seo from "../components/Seo";

const SLIDES = [
  { emoji: "☕", biz: "Bean & Bay Coffee", promo: "Two-for-one Tuesdays" },
  { emoji: "🐾", biz: "Paws & Co Grooming", promo: "Book your pup's spa day" },
  { emoji: "🥗", biz: "Green Table Deli", promo: "Fresh lunch specials daily" },
  { emoji: "🚴", biz: "Cycle Works", promo: "Winter service — 15% off" },
  { emoji: "💇", biz: "Studio Nine Hair", promo: "New client special" },
];

function ChannelTabsSection() {
  const reveal = useReveal<HTMLDivElement>();
  return (
    <div ref={reveal.ref} className={reveal.className}>
      <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">New channels, live now</span>
      <h2 className="text-3xl md:text-4xl mb-3 max-w-xl">More boards to put your business on.</h2>
      <p className="text-billboard-inkSoft max-w-xl mb-8">Four new ways to reach South African audiences beyond social pages — same fair, one-price approach.</p>
      <LiveChannelTabs />
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  const { ref, className } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      <div className="font-display text-3xl md:text-4xl">{value}</div>
      <div className="font-mono text-xs uppercase tracking-wider text-billboard-inkSoft mt-1.5">{label}</div>
    </div>
  );
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const featured = useReveal<HTMLDivElement>();
  const howReveal = useReveal<HTMLDivElement>();
  const { publishers, loading } = usePublishers();

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setLoaded(true)));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let interval: number | undefined;
    if (!reduceMotion) {
      interval = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 2600);
    }
    return () => { cancelAnimationFrame(raf); if (interval) window.clearInterval(interval); };
  }, []);

  return (
    <>
      <Seo title="Micro Billboards — Turn Pages Into Billboards" description="Connect with trusted Facebook pages, groups and creators across South Africa. Book a post, pay one fair price, reach a real audience." />
      {/* HERO */}
      <section className="bg-billboard-yellow border-b-[3px] border-billboard-ink overflow-hidden py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <span className={`inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-ink bg-billboard-paper px-3 py-1.5 rounded mb-5 transition-all duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-billboard-red" /> Piloting in Cape Town
            </span>
            <h1 className={`text-4xl md:text-6xl leading-[1.05] mb-5 transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
              Turn any page into a billboard.<br />Turn any billboard into customers.
            </h1>
            <p className={`text-lg text-billboard-inkSoft max-w-[46ch] mb-7 transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
              Micro Billboards connects South African small businesses with the pages and groups their customers already follow. Book a post, pay one fair price, reach a real audience.
            </p>
            <div className={`flex flex-wrap gap-3.5 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
              <Link to="/browse" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink bg-billboard-ink text-billboard-paper font-bold px-5 py-3 rounded hover:-translate-x-0.5 hover:-translate-y-0.5 transition">Find Publishers →</Link>
              <Link to="/register" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink bg-transparent font-bold px-5 py-3 rounded hover:-translate-x-0.5 hover:-translate-y-0.5 transition">Become a Publisher →</Link>
            </div>
          </div>
          <div className={`flex flex-col items-center transition-all duration-[900ms] delay-300 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="relative w-full max-w-[420px] aspect-[16/10] bg-billboard-paper border-[3px] border-billboard-ink rounded shadow-block -rotate-[1.4deg] overflow-hidden">
              <span className="absolute -top-3.5 right-3.5 bg-billboard-red text-white font-mono text-[11px] font-semibold px-2.5 py-1 rounded rotate-3 border-2 border-billboard-ink z-10">LIVE NOW</span>
              {SLIDES.map((s, i) => (
                <div key={i} className={`absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-5 transition-all duration-700 ${i === slide ? "opacity-100" : "opacity-0"}`}>
                  <span className="text-4xl">{s.emoji}</span>
                  <span className="font-display text-base">{s.biz}</span>
                  <span className="font-mono text-sm text-billboard-greenDeep">{s.promo}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-14 -mt-0.5"><span className="w-2.5 h-12 bg-billboard-ink" /><span className="w-2.5 h-12 bg-billboard-ink" /></div>
            <div className="w-2/3 max-w-[340px] h-1 bg-billboard-ink rounded mt-0.5" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-billboard-paperDim border-b-[3px] border-billboard-ink py-12">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <StatBlock value="R100" label="Per post, to start" />
          <StatBlock value="75%" label="Goes to the page owner" />
          <StatBlock value="Cape Town" label="Where we're piloting first" />
        </div>
      </section>

      {/* FEATURED / PILOT PUBLISHERS */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div ref={featured.ref} className={featured.className}>
            <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">In the pilot</span>
            <h2 className="text-3xl md:text-4xl mb-3 max-w-xl">Some of the pages already on the board.</h2>
            <p className="text-billboard-inkSoft max-w-xl mb-10">A handful of the pages and groups we're piloting with in Cape Town — more join every week.</p>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-56 border-[3px] border-billboard-paperDim rounded animate-pulse bg-billboard-paperDim" />
              ))}
            </div>
          ) : publishers.length === 0 ? (
            <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">
              No publishers yet — add the first one from the admin panel to fill this in.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {publishers.slice(0, 4).map((p) => <PublisherCard key={p.id} publisher={p} />)}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/browse" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink font-bold px-5 py-3 rounded hover:-translate-x-0.5 hover:-translate-y-0.5 transition">Browse all publishers →</Link>
          </div>
        </div>
      </section>

      {/* NEW CHANNELS — TABBED */}
      <section className="py-20 bg-billboard-paperDim border-b-[3px] border-billboard-ink">
        <div className="max-w-6xl mx-auto px-5">
          <ChannelTabsSection />
        </div>
      </section>

      {/* HOW IT WORKS TEASER */}
      <section className="py-20 bg-billboard-ink text-billboard-paper border-y-[3px] border-billboard-ink">
        <div className="max-w-6xl mx-auto px-5">
          <div ref={howReveal.ref} className={howReveal.className}>
            <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-yellow text-billboard-yellow px-3 py-1.5 rounded mb-3">How it works</span>
            <h2 className="text-3xl md:text-4xl mb-8 max-w-xl">Three steps, whichever side you're on.</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {["Find your billboard, or list your page", "Book & pay, or get booked", "It goes live — you get proof, or you get paid"].map((t, i) => (
                <div key={i} className="border-2 border-[#3A342B] rounded p-5">
                  <div className="font-display text-2xl text-billboard-yellow mb-2">0{i + 1}</div>
                  <p className="text-sm text-billboard-paperDim">{t}</p>
                </div>
              ))}
            </div>
            <Link to="/how-it-works" className="inline-flex items-center gap-2 mt-8 border-[3px] border-billboard-paper font-bold px-5 py-3 rounded hover:-translate-x-0.5 hover:-translate-y-0.5 transition">See the full picture →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
