import { Link } from "react-router-dom";
import { CAPE_TOWN_SUBURBS } from "../lib/constants";
import { usePublishers } from "../hooks/usePublishers";
import Seo from "../components/Seo";

export default function Suburbs() {
  const { publishers } = usePublishers();

  return (
    <div className="max-w-6xl mx-auto px-5 py-16">
      <Seo title="Suburbs · Micro Billboards" description="Browse South African publishers and creators by Cape Town suburb." />
      <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-3">Suburbs</span>
      <h1 className="text-3xl md:text-4xl mb-2 max-w-xl">Right down to your neighbourhood.</h1>
      <p className="text-billboard-inkSoft max-w-xl mb-10">
        Our pilot is Cape Town first — pick a suburb to see the pages and creators already reaching that neighbourhood.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CAPE_TOWN_SUBURBS.map((suburb) => {
          const count = publishers.filter((p) => p.suburb === suburb).length;
          return (
            <Link
              key={suburb}
              to={`/browse?suburb=${encodeURIComponent(suburb)}`}
              className="border-[3px] border-billboard-ink rounded p-5 bg-white transition hover:-translate-y-1 hover:shadow-block"
            >
              <h3 className="font-bold mb-1">{suburb}</h3>
              <span className="font-mono text-xs text-billboard-greenDeep font-semibold">
                {count} {count === 1 ? "publisher" : "publishers"} →
              </span>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-billboard-inkSoft mt-8">
        Not seeing your suburb, or based outside Cape Town? <Link to="/browse" className="underline font-semibold">Browse everyone</Link> and filter by province and city instead.
      </p>
    </div>
  );
}
