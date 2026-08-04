import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import SetupNotice from "../components/SetupNotice";
import Seo from "../components/Seo";
import type { Publisher } from "../lib/types";

interface Result {
  publisher_id: string;
  score: number;
  reason: string;
  publisher: Publisher;
}

export default function AudienceFinder() {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  if (!isSupabaseConfigured) return <SetupNotice />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    const { data, error } = await supabase.functions.invoke("audience-match", {
      body: { description, budget: budget ? Number(budget) : undefined },
    });
    setLoading(false);
    if (error || data?.error) {
      setError(data?.error ?? "Couldn't run the match right now — try again in a moment.");
      return;
    }
    setResults(data.results ?? []);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-14">
      <Seo title="Audience Finder · Micro Billboards" description="Describe your business and ideal customer — we'll rank the real publisher directory against it and explain why each one fits." />
      <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">Audience Finder</span>
      <h1 className="text-3xl md:text-4xl mb-2">Tell us who you're trying to reach.</h1>
      <p className="text-billboard-inkSoft mb-8">Describe your business and your ideal customer in plain language — we'll rank the publisher directory against it and explain why each one fits.</p>

      {!user ? (
        <div className="border-[3px] border-billboard-ink rounded p-6 bg-billboard-paperDim">
          <p className="mb-3">Log in to run a match.</p>
          <Link to="/login" className="inline-flex items-center gap-2 border-[3px] border-billboard-ink bg-billboard-yellow font-bold px-5 py-2.5 rounded hover:-translate-y-0.5 transition">Log in</Link>
          <p className="text-xs text-billboard-inkSoft mt-3">New here? <Link to="/register" className="underline font-semibold">Create a business account</Link></p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border-[3px] border-billboard-ink rounded p-6 bg-billboard-paperDim mb-8">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Your business and ideal customer</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="e.g. We're a family dentist in Claremont, Cape Town. We want to reach parents and young professionals nearby who are looking for a new dentist."
            className="w-full border-2 border-billboard-ink rounded px-3 py-2.5 mb-4 bg-white text-sm"
          />
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5">Budget per post (optional)</label>
          <input
            type="number" min={0} value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="R"
            className="w-full border-2 border-billboard-ink rounded px-3 py-2.5 mb-4 bg-white text-sm sm:w-48"
          />
          {error && <p className="text-billboard-red text-sm font-semibold mb-4">{error}</p>}
          <button type="submit" disabled={loading} className="bg-billboard-yellow border-[3px] border-billboard-ink font-bold px-5 py-3 rounded hover:-translate-y-0.5 transition disabled:opacity-60">
            {loading ? "Matching…" : "Find my matches"}
          </button>
        </form>
      )}

      {results && (
        results.length === 0 ? (
          <div className="border-[3px] border-dashed border-billboard-ink rounded p-10 text-center text-billboard-inkSoft">No strong matches in the directory yet — try widening your description, or browse everything directly.</div>
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <Link key={r.publisher_id} to={`/browse/${r.publisher_id}`} className="block border-[3px] border-billboard-ink rounded p-5 bg-white hover:-translate-y-0.5 hover:shadow-block transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold">{r.publisher.name}</p>
                    <p className="text-xs text-billboard-inkSoft">{r.publisher.city}, {r.publisher.province} · {r.publisher.category} · R{r.publisher.price_per_post}/post</p>
                  </div>
                  <span className="font-mono text-xs font-bold bg-billboard-green text-white px-2.5 py-1 rounded shrink-0">{r.score}% match</span>
                </div>
                <p className="text-sm text-billboard-inkSoft">{r.reason}</p>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
