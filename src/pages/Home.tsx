import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  TrendingUp,
  Radio,
  Send,
  Eye,
  Megaphone,
  ShieldCheck,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  // --- State for the animated hero mockup (Business vs Publisher) ---
  const [benefitIndex, setBenefitIndex] = useState(0);
  const benefitItems = [
    {
      type: 'business',
      title: 'For Businesses',
      subtitle: 'Reach the right customers, every time.',
      points: [
        'Target hyper-local audiences in South Africa',
        'Bypass ad-blockers with native creator content',
        'Pay only for guaranteed, human-viewed placements',
        'Track campaign ROI in real-time',
      ],
      icon: <Megaphone className="h-6 w-6 text-blue-500" />,
      bgColor: 'from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      type: 'publisher',
      title: 'For Publishers',
      subtitle: 'Monetize your audience effortlessly.',
      points: [
        'Get matched with relevant brand campaigns',
        'Set your own rates and availability',
        'Showcase your verified trust score',
        'Receive automatic payouts upon completion',
      ],
      icon: <Radio className="h-6 w-6 text-purple-500" />,
      bgColor: 'from-purple-50 to-white dark:from-purple-950/30 dark:to-gray-900',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBenefitIndex((prev) => (prev + 1) % benefitItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [benefitItems.length]);

  const currentBenefit = benefitItems[benefitIndex];

  // --- State for the "How It Works" interactive mockup ---
  const [activeStep, setActiveStep] = useState(1);
  const steps = [
    {
      id: 1,
      title: '1. Business Submits a Request',
      description:
        'Businesses brief us on their audience, location, and goals. Our AI matches them with the perfect local creators.',
      icon: Send,
      mockup: (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-gray-700">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30" />
            <div>
              <div className="h-3 w-24 rounded bg-gray-300 dark:bg-gray-600" />
              <div className="mt-1 h-2 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-2 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3 flex gap-2">
              <div className="h-6 w-16 rounded bg-blue-100 dark:bg-blue-900/30" />
              <div className="h-6 w-16 rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-green-500">
            <CheckCircle className="h-3 w-3" /> Brief submitted successfully
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: '2. Publisher Reviews the Request',
      description:
        'Publishers receive the request in their dashboard, review the brief, and confirm if their audience aligns perfectly.',
      icon: Eye,
      mockup: (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Incoming Request</span>
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
              Pending Review
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-200 dark:bg-orange-900/30" />
              <span className="text-sm font-medium">Cape Town Bakery</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Budget: R1,500 • Niche: Food</p>
            <div className="flex gap-2 pt-2">
              <button className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700">
                Accept
              </button>
              <button className="rounded-lg border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                Decline
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. Creator Executes the Placement',
      description:
        'The publisher creates authentic content, posts it to their channel, and shares the final performance report with the business.',
      icon: CheckCircle,
      mockup: (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-gray-700">
            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Campaign Live</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-700/50">
              <p className="text-gray-400">Impressions</p>
              <p className="font-semibold">1,240</p>
            </div>
            <div className="rounded bg-gray-50 p-2 dark:bg-gray-700/50">
              <p className="text-gray-400">Clicks</p>
              <p className="font-semibold">86</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-1.5 w-3/4 rounded-full bg-blue-600" />
          </div>
          <p className="mt-1 text-right text-[10px] text-gray-400">75% complete</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ============================================ */}
      {/* SECTION 1: HERO / BANNER (NO PRICING)       */}
      {/* ============================================ */}
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left: Headline & CTAs */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Connect with <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  local audiences
                </span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                The South African marketplace that directly connects businesses with trusted creators,
                influencers, and publishers. No algorithms. Just real human reach.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/signup"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                >
                  Get Started
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-white dark:hover:bg-gray-800"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Dual CTAs: Register as Business & Become a Publisher (Side by side) */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/signup?type=business"
                  className="rounded-lg border border-blue-600 bg-transparent px-5 py-2.5 text-sm font-medium text-blue-600 transition-all hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/30"
                >
                  Register as Business
                </Link>
                <span className="text-sm text-gray-300 dark:text-gray-600">or</span>
                <Link
                  to="/signup?type=publisher"
                  className="rounded-lg border border-gray-300 bg-transparent px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Become a Publisher
                </Link>
              </div>
            </div>

            {/* Right: Animated Benefits Mockup (Replaces R50 banner) */}
            <div className="relative flex justify-center">
              <div
                className={`w-full max-w-md rounded-2xl border ${currentBenefit.borderColor} bg-gradient-to-br ${currentBenefit.bgColor} p-6 shadow-xl transition-all duration-500`}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/80 p-2 shadow-sm dark:bg-gray-800/80">
                    {currentBenefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {currentBenefit.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {currentBenefit.subtitle}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {currentBenefit.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      {point}
                    </li>
                  ))}
                </ul>
                {/* Progress dots */}
                <div className="mt-4 flex justify-center gap-1.5">
                  {benefitItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBenefitIndex(idx)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        idx === benefitIndex ? 'w-6 bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: HOW IT WORKS (VISUAL MOCKUPS)     */}
      {/* ============================================ */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              How <span className="text-blue-600 dark:text-blue-400">Micro Billboards</span> Works
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
              A transparent, three-step workflow designed for both businesses and publishers.
            </p>
          </div>

          {/* Step Selector (Tabs) */}
          <div className="mt-10 flex justify-center gap-2 rounded-xl bg-white p-1 shadow-sm dark:bg-gray-800">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  activeStep === step.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {step.id === 1 && <Send className="h-4 w-4" />}
                {step.id === 2 && <Eye className="h-4 w-4" />}
                {step.id === 3 && <CheckCircle className="h-4 w-4" />}
                Step {step.id}
              </button>
            ))}
          </div>

          {/* Dynamic Step Content (The Mockup) */}
          <div className="mt-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {steps.find((s) => s.id === activeStep)?.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {steps.find((s) => s.id === activeStep)?.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
                <span>Live preview</span>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              {steps.find((s) => s.id === activeStep)?.mockup}
            </div>
          </div>

          {/* Mini Comparison: Why this beats social media */}
          <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 flex-shrink-0 text-green-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Ad-Blocker Proof</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Native content integration beats ad-blockers every time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-6 w-6 flex-shrink-0 text-blue-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Guaranteed Targeting</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hand-picked publishers with your exact audience demographic.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="h-6 w-6 flex-shrink-0 text-purple-500" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Full Transparency</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Real-time analytics. You see exactly where your money goes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Trust Banner (Optional, but adds polish) */}
      <div className="border-t border-gray-200 bg-white px-4 py-8 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join the growing community of South African businesses and creators already thriving on Micro Billboards.
          </p>
        </div>
      </div>
    </div>
  );
}
