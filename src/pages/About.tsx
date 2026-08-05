import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  MapPin, 
  Radio, 
  Zap, 
  XCircle, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

// --- Comparison Data ---
const comparisonData = [
  {
    feature: 'Trust & Authenticity',
    traditional: 'Impersonal algorithms. High bot traffic.',
    marketplace: 'Direct, vetted local creators. Genuine human audiences.',
    marketplaceWin: true,
  },
  {
    feature: 'Ad-Blocker Vulnerability',
    traditional: 'Up to 50% of impressions are blocked or ignored.',
    marketplace: 'Native content integration. Zero ad-blocker interference.',
    marketplaceWin: true,
  },
  {
    feature: 'Targeting Guarantee',
    traditional: 'Algorithm guesses based on cookies and location data.',
    marketplace: 'Guaranteed placement with creators who have your exact niche audience.',
    marketplaceWin: true,
  },
  {
    feature: 'Campaign Control',
    traditional: 'Black-box optimization. You pay for "clicks" that often bounce.',
    marketplace: 'Full transparency. You choose the creator and approve the content.',
    marketplaceWin: true,
  },
];

export function About() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
          {/* --- Platform Story & Mission (with Visual Mockups) --- */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Bridging South African <br />
              <span className="text-blue-600 dark:text-blue-400">Businesses & Creators</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Micro Billboards was born from a simple observation: local businesses trust local voices. 
              Why spend thousands on faceless algorithms when you can partner directly with the 
              creators your customers already follow?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">100+ SA Cities</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium">500+ Active Creators</span>
              </div>
            </div>
          </div>
          {/* Visual Mockup: A stylized "Dashboard Preview" card to illustrate the mission */}
          <div className="relative flex justify-center">
            <div className="relative h-64 w-full max-w-sm rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
              <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-blue-600 p-2 shadow-lg">
                <Radio className="h-8 w-8 text-white" />
              </div>
              <div className="flex h-full flex-col justify-end">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 backdrop-blur-sm dark:bg-gray-800/80">
                    <div className="h-8 w-8 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-semibold">Cape Town Bakery</p>
                      <p className="text-xs text-gray-500">Matched with @foodie_cpt</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/80 p-3 backdrop-blur-sm dark:bg-gray-800/80">
                    <div className="h-8 w-8 rounded-full bg-orange-500" />
                    <div>
                      <p className="text-sm font-semibold">Johannesburg Tech</p>
                      <p className="text-xs text-gray-500">Campaign live on TechTuber SA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Dual Application CTAs (Prominent Blocks) --- */}
        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            to="/signup?type=business"
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-8 transition-all hover:shadow-xl dark:border-gray-700 dark:from-gray-900 dark:to-gray-800"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl" />
            <div className="relative">
              <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Apply as a Business</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Grow your brand with authentic local advertising. Reach customers who actually care.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <Link
            to="/signup?type=publisher"
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-purple-50 to-white p-8 transition-all hover:shadow-xl dark:border-gray-700 dark:from-gray-900 dark:to-gray-800"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-200/30 blur-2xl" />
            <div className="relative">
              <Users className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Apply as a Publisher</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monetize your audience. Get paid to create content for brands that your followers love.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 font-medium text-purple-600 dark:text-purple-400">
                Join the Network <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>

        {/* --- High-Impact Comparison Module (Marketplace vs Social Media) --- */}
        <div className="mt-20 overflow-hidden rounded-3xl bg-gray-50 p-8 dark:bg-gray-900/50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Micro Billboards vs. Traditional Social Ads
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Why direct publisher partnerships beat algorithmic ad spend every time.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="pb-4 font-medium">Metric</th>
                  <th className="pb-4 font-medium text-red-500">Traditional Platforms</th>
                  <th className="pb-4 font-medium text-green-500">Micro Billboards</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="animate-fadeInUp rounded-xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.feature}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        {item.traditional}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {item.marketplace}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CSS Animation for the table rows */}
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeInUp {
              animation: fadeInUp 0.6s ease-out forwards;
              opacity: 0;
            }
          `}</style>
        </div>

        {/* Final Bottom Banner: Trust */}
        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <ShieldCheck className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
          <h3 className="mt-4 text-xl font-bold">Built for South Africa, By South Africans</h3>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
            We are a proudly local team dedicated to empowering small businesses and independent creators
            to thrive together without relying on big-tech gatekeepers.
          </p>
        </div>
      </div>
    </div>
  );
}
