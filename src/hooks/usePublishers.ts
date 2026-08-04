import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { Publisher } from "../lib/types";

export function usePublishers() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    supabase
      .from("publishers")
      .select("*")
      .eq("status", "approved")
      .order("publisher_score", { ascending: false })
      .order("trust_score", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setPublishers(sortFeaturedFirst((data ?? []) as Publisher[]));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { publishers, loading, error };
}

// Pulls currently-featured (and not expired) publishers to the front,
// while keeping the existing publisher_score/trust_score order within
// each group intact — client-side, matching how Browse.tsx already does
// its filtering rather than pushing this into the query itself, which is
// fine at this directory's current size.
function isCurrentlyFeatured(p: Publisher): boolean {
  return p.featured && (!p.featured_until || new Date(p.featured_until) > new Date());
}

function sortFeaturedFirst(list: Publisher[]): Publisher[] {
  const featured = list.filter(isCurrentlyFeatured);
  const rest = list.filter((p) => !isCurrentlyFeatured(p));
  return [...featured, ...rest];
}
