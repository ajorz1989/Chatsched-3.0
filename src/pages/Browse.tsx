/**
 * Browse — the unified publisher/creator search page.
 *
 * Formerly two pages (a simple Browse grid and a separate Advanced Search).
 * This merges them into one: the old Advanced Search filter engine is now
 * the only search engine, reachable from a single "Browse" tab. `/search`
 * redirects here (see App.tsx) so old links and bookmarks keep working.
 */
import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { usePublishers } from "../hooks/usePublishers";
import { getEnabledChannels } from "../lib/channelRegistry";
import { CATEGORIES, PROVINCES, PLATFORMS, LANGUAGES, CAPE_TOWN_SUBURBS } from "../lib/constants";
import type { Platform, Publisher } from "../lib/types";
import type { ChannelSlug } from "../lib/channelTypes";
import PublisherCard from "../components/PublisherCard";
import Seo from "../components/Seo";

const AGE_OPTIONS = [
  { value: "", label: "Any age group" },
  { value: "18-24", label: "18–24 (Gen Z / Students)" },
  { value: "25-34", label: "25–34 (Millennials)" },
  { value: "35-44", label: "35–44 (Parents / Professionals)" },
  { value: "45-54", label: "45–54 (Established Adults)" },
  { value: "55+", label: "55+ (Seniors)" },
];

const GENDER_OPTIONS = [
  { value: "", label: "Any gender split" },
  { value: "women", label: "Mostly women" },
  { value: "men", label: "Mostly men" },
  { value: "mixed", label: "Mixed / balanced" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Best match" },
  { value: "followers_desc", label: "Most followers" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "engagement_desc", label: "Best engagement" },
  { value: "reach_desc", label: "Most reach" },
];

interface Filters {
  query: string;
  channel: ChannelSlug | "";
  category: string;
  province: string;
  city: string;
  suburb: string;
  platforms: Platform[];
  verifiedOnly: boolean;
  minRating: number;
  minFollowers: string;
  maxFollowers: string;
  minMonthlyReach: string;
  minEngagement: string;
  maxPrice: number;
  languages: string[];
  ageDemographic: string;
  gender: string;
  sortBy: string;
}

function makeDefaults(initial: Partial<Filters>): Filters {
  return {
    query: "", channel: "", category: "", province: "", city: "", suburb: "",
    platforms: [], verifiedOnly: false, minRating: 0,
    minFollowers: "", maxFollowers: "", minMonthlyReach: "", minEngagement: "",
    maxPrice: 5000, languages: [], ageDemographic: "", gender: "",
    sortBy: "score",
    ...initial,
  };
}

function matchesGender(p: Publisher, gender: string): boolean {
  if (!gender) return true;
  const txt = p.audience.toLowerCase();
  if (gender === "women") return /women|female|ladies|moms|mothers|girls/.test(txt);
  if (gender === "men") return /\bmen\b|\bmale\b|guys|dads|fathers/.test(txt);
  return true; // mixed: show all
}

function matchesAge(p: Publisher, age: string): boolean {
  if (!age) return true;
  const txt = p.audience.toLowerCase();
  if (age === "18-24") return /18.{0,3}24|gen.?z|student|young adult/.test(txt);
  if (age === "25-34") return /25.{0,3}34|millennial|young professional/.test(txt);
  if (age === "35-44") return /35.{0,3}44|parent|professional/.test(txt);
  if (age === "45-54") return /45.{0,3}54|mature/.test(txt);
  if (age === "55+") return /55\+|senior|retirement/.test(txt);
  return true;
}

function applySort(list: Publisher[], sortBy: string): Publisher[] {
  const s = [...list];
  switch (sortBy) {
    case "followers_desc": return s.sort((a, b) => b.followers - a.followers);
    case "price_asc": return s.sort((a, b) => a.price_per_post - b.price_per_post);
    case "price_desc": return s.sort((a, b) => b.price_per_post - a.price_per_post);
    case "rating_desc": return s.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "engagement_desc": return s.sort((a, b) => b.engagement - a.engagement);
    case "reach_desc": return s.sort((a, b) => (b.monthly_reach ?? 0) - (a.monthly_reach ?? 0));
    default: return s.sort((a, b) => b.publisher_score - a.publisher_score);
  }
}

function activeCount(f: Filters): number {
  return [
    f.query, f.channel, f.category, f.province, f.city, f.suburb,
    f.platforms.length, f.verifiedOnly, f.minRating,
    f.minFollowers, f.maxFollowers, f.minMonthlyReach, f.minEngagement,
    f.maxPrice < 5000, f.languages.length, f.ageDemographic, f.gender,
  ].filter(Boolean).length;
}

function SectionToggle({ label, open, onToggle, count }: { label: string; open: boolean; onToggle: () => void; count?: number }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-3.5 bg-billboard-paperDim font-bold text-sm"
    >
      <span className="flex items-center gap-2">
        {label}
        {count ? <span className="bg-billboard-green text-white font-mono text-[10px] px-1.5 py-0.5 rounded">{count}</span> : null}
      </span>
      <span className="font-mono text-billboard-inkSoft text-lg leading-none">{open ? "−" : "+"}</span>
    </button>
  );
}

export default function Browse() {
  const [searchParams] = useSearchParams();
  const channels = getEnabledChannels();

  const [filters, setFilters] = useState<Filters>(() =>
    makeDefaults({
      category: searchParams.get("category") || "",
      suburb: searchParams.get("suburb") || "",
      channel: (searchParams.get("channel") as ChannelSlug | null) || "",
    })
  );
  const [showAudience, setShowAudience] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const { publishers, loading, error } = usePublishers();

  const update = (patch: Partial<Filters>) => setFilters(prev => ({ ...prev, ...patch }));

  const togglePlatform = (p: Platform) =>
    update({ platforms: filters.platforms.includes(p) ? filters.platforms.filter(x => x !== p) : [...filters.platforms, p] });

  const toggleLanguage = (l: string) =>
    update({ languages: filters.languages.includes(l) ? filters.languages.filter(x => x !== l) : [...filters.languages, l] });

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase();
    const result = publishers.filter(p => {
      if (q && ![p.name, p.bio, p.audience, p.city].some(t => t.toLowerCase().includes(q))) return false;
      if (filters.channel && p.channel_slug !== filters.channel) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.province && p.province !== filters.province) return false;
      if (filters.city && !p.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.suburb && p.suburb !== filters.suburb) return false;
      if (filters.platforms.length && !filters.platforms.some(pl => p.platforms.includes(pl))) return false;
      if (filters.verifiedOnly && !p.verified) return false;
      if (filters.minRating > 0 && (p.rating ?? 0) < filters.minRating) return false;
      if (filters.minFollowers && p.followers < Number(filters.minFollowers)) return false;
      if (filters.maxFollowers && p.followers > Number(filters.maxFollowers)) return false;
      if (filters.minMonthlyReach && (p.monthly_reach ?? 0) < Number(filters.minMonthlyReach)) return false;
      if (filters.minEngagement && p.engagement < Number(filters.minEngagement)) return false;
      if (p.price_per_post > filters.maxPrice) return false;
      if (filters.languages.length && !filters.languages.some(l => p.languages.includes(l))) return false;
      if (!matchesAge(p, filters.ageDemographic)) return false;
      if (!matchesGender(p, filters.gender)) return false;
      return true;
    });
    return applySort(result, filters.sortBy);
  }, [publishers, filters]);

  const active = activeCount(filters);

  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <Seo
        title="Browse Publishers · Micro Billboards"
        description="Search South African publishers and creators by channel, suburb, category, platform, engagement, reach, language, demographics and price."
      />

      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">
            Browse
          </span>
          <h1 className="text-3xl md:text-4xl mb-2">Find the page your customers already follow.</h1>
          <p className="text-billboard-inkSoft max-w-xl">
            {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} match`}
            {active > 0 && <span> — {active} filter{active !== 1 ? "s" : ""} active</span>}
          </p>
        </div>
        {active > 0 && (
          <button onClick={() => setFilters(makeDefaults({}))} className="text-sm font-semibold text-billboard-red underline">
            Clear all ({active})
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-10">
        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          {/* Keyword */}
          <div className="border-[3px] border-billboard-ink rounded p-5 bg-billboard-paperDim">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Keyword</label>
            <input
              type="text"
              value={filters.query}
              onChange={e => update({ query: e.target.value })}
              placeholder="Name, audience, bio…"
              className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 bg-white text-sm"
            />
          </div>

          {/* Channel */}
          <div className="border-[3px] border-billboard-ink rounded p-5 bg-billboard-paperDim">
            <h3 className="font-bold text-sm mb-3">Channel</h3>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="radio" name="channel" checked={filters.channel === ""} onChange={() => update({ channel: "" })} className="accent-billboard-green w-4 h-4" />
                All channels
              </label>
              {channels.map(({ definition: ch }) => (
                <label key={ch.slug} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="radio" name="channel" checked={filters.channel === ch.slug} onChange={() => update({ channel: ch.slug })} className="accent-billboard-green w-4 h-4" />
                  <span>{ch.emoji} {ch.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location & Category */}
          <div className="border-[3px] border-billboard-ink rounded p-5 bg-billboard-paperDim">
            <h3 className="font-bold text-sm mb-4">Location & Category</h3>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Category</label>
            <select value={filters.category} onChange={e => update({ category: e.target.value })} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 mb-4 bg-white text-sm">
              <option value="">All categories</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Province</label>
            <select value={filters.province} onChange={e => update({ province: e.target.value })} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 mb-4 bg-white text-sm">
              <option value="">All provinces</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">City</label>
            <input
              type="text" value={filters.city}
              onChange={e => update({ city: e.target.value })}
              placeholder="e.g. Cape Town"
              className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 mb-4 bg-white text-sm"
            />
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">
              Suburb <span className="font-normal normal-case text-billboard-inkSoft">(Cape Town pilot)</span>
            </label>
            <select value={filters.suburb} onChange={e => update({ suburb: e.target.value })} className="w-full border-2 border-billboard-ink rounded px-2.5 py-2 bg-white text-sm">
              <option value="">All suburbs</option>
              {CAPE_TOWN_SUBURBS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Platform */}
          <div className="border-[3px] border-billboard-ink rounded p-5 bg-billboard-paperDim">
            <h3 className="font-bold text-sm mb-3">Platform</h3>
            <div className="space-y-2">
              {PLATFORMS.map(pl => (
                <label key={pl} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={filters.platforms.includes(pl)} onChange={() => togglePlatform(pl)} className="accent-billboard-green w-4 h-4" />
                  {pl}
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="border-[3px] border-billboard-ink rounded p-5 bg-billboard-paperDim">
            <h3 className="font-bold text-sm mb-3">Max price: <span className="font-mono">R{filters.maxPrice.toLocaleString()}</span></h3>
            <input type="range" min={100} max={5000} step={50} value={filters.maxPrice} onChange={e => update({ maxPrice: Number(e.target.value) })} className="w-full accent-billboard-green mb-2" />
            <div className="flex justify-between text-xs text-billboard-inkSoft font-mono"><span>R100</span><span>R5 000</span></div>
          </div>

          {/* Audience & Reach — collapsible */}
          <div className="border-[3px] border-billboard-ink rounded overflow-hidden">
            <SectionToggle
              label="Audience & Reach"
              open={showAudience}
              onToggle={() => setShowAudience(s => !s)}
              count={[filters.minFollowers, filters.maxFollowers, filters.minMonthlyReach, filters.minEngagement, filters.languages.length, filters.ageDemographic, filters.gender].filter(Boolean).length || undefined}
            />
            {showAudience && (
              <div className="p-5 bg-billboard-paperDim border-t-2 border-billboard-ink space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Min followers</label>
                    <input type="number" value={filters.minFollowers} onChange={e => update({ minFollowers: e.target.value })} placeholder="0" className="w-full border-2 border-billboard-ink rounded px-2 py-1.5 bg-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Max followers</label>
                    <input type="number" value={filters.maxFollowers} onChange={e => update({ maxFollowers: e.target.value })} placeholder="Any" className="w-full border-2 border-billboard-ink rounded px-2 py-1.5 bg-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Min monthly reach</label>
                  <input type="number" value={filters.minMonthlyReach} onChange={e => update({ minMonthlyReach: e.target.value })} placeholder="e.g. 5000" className="w-full border-2 border-billboard-ink rounded px-2 py-1.5 bg-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Min engagement rate (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={filters.minEngagement} onChange={e => update({ minEngagement: e.target.value })} placeholder="e.g. 3" className="w-full border-2 border-billboard-ink rounded px-2 py-1.5 bg-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2">Languages</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LANGUAGES.map(lang => (
                      <label key={lang} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <input type="checkbox" checked={filters.languages.includes(lang)} onChange={() => toggleLanguage(lang)} className="accent-billboard-green" />
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1">
                    Age group <span className="font-normal normal-case text-billboard-inkSoft">(from audience description)</span>
                  </label>
                  <select value={filters.ageDemographic} onChange={e => update({ ageDemographic: e.target.value })} className="w-full border-2 border-billboard-ink rounded px-2 py-1.5 bg-white text-sm">
                    {AGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1">
                    Gender split <span className="font-normal normal-case text-billboard-inkSoft">(from audience description)</span>
                  </label>
                  <select value={filters.gender} onChange={e => update({ gender: e.target.value })} className="w-full border-2 border-billboard-ink rounded px-2 py-1.5 bg-white text-sm">
                    {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quality & Trust — collapsible */}
          <div className="border-[3px] border-billboard-ink rounded overflow-hidden">
            <SectionToggle
              label="Quality & Trust"
              open={showQuality}
              onToggle={() => setShowQuality(s => !s)}
              count={(filters.verifiedOnly ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) || undefined}
            />
            {showQuality && (
              <div className="p-5 bg-billboard-paperDim border-t-2 border-billboard-ink space-y-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={filters.verifiedOnly} onChange={e => update({ verifiedOnly: e.target.checked })} className="accent-billboard-green w-4 h-4" />
                  <span className="text-sm font-semibold">Verified publishers only</span>
                </label>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2">Minimum rating</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => update({ minRating: 0 })} className={`text-xs font-mono px-2 py-1 rounded border-2 transition ${filters.minRating === 0 ? "border-billboard-ink bg-billboard-ink text-white" : "border-billboard-inkSoft text-billboard-inkSoft"}`}>Any</button>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => update({ minRating: n })} className={`text-lg leading-none transition ${n <= filters.minRating ? "text-billboard-yellow" : "text-billboard-paperDim"}`}>★</button>
                    ))}
                  </div>
                  {filters.minRating > 0 && <p className="text-xs text-billboard-inkSoft mt-1">{filters.minRating}+ stars</p>}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Results ── */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p className="text-sm text-billboard-inkSoft">
              {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide shrink-0">Sort</label>
              <select value={filters.sortBy} onChange={e => update({ sortBy: e.target.value })} className="border-2 border-billboard-ink rounded px-2.5 py-1.5 text-sm bg-white">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {error ? (
            <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">
              Couldn't load publishers — try refreshing.
            </div>
          ) : loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 border-[3px] border-billboard-paperDim rounded animate-pulse bg-billboard-paperDim" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="border-[3px] border-dashed border-billboard-ink rounded p-12 text-center">
              <p className="text-billboard-inkSoft mb-4">No publishers match those filters yet — this list grows every week during our Cape Town pilot.</p>
              <button onClick={() => setFilters(makeDefaults({}))} className="inline-flex items-center gap-2 border-[3px] border-billboard-ink font-bold px-5 py-2.5 rounded hover:-translate-y-0.5 transition text-sm">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => <PublisherCard key={p.id} publisher={p} />)}
            </div>
          )}

          <p className="text-xs text-billboard-inkSoft mt-6">
            Looking for a specific advertising channel instead of an individual publisher? See the full{" "}
            <Link to="/channels" className="underline font-semibold">channel directory</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
