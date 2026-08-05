import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Eye, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Users,
  Megaphone,
  TrendingUp,
  Sparkles
} from 'lucide-react';

// --- Data: Steps for Interactive Mockups ---
const workflowSteps = [
  {
    id: 1,
    icon: Send,
    title: 'Business Submits a Request',
    description: 'Local businesses brief us on their audience, location, and campaign goals. We match them with the perfect local creators.',
    color: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 2,
    icon: Eye,
    title: 'Publisher Reviews the Brief',
    description: 'Publishers (Social pages, Podcasters, Influencers) receive the request in their dashboard and confirm if their audience aligns.',
    color: 'bg-purple-50 dark:bg-purple-950/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 3,
    icon: CheckCircle,
    title: 'Creator Executes the Placement',
    description: 'The publisher creates authentic content, posts it to their channel, and shares the final report with the business.',
    color: 'bg-green-50 dark:bg-green-950/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
];

// --- Data: FAQ Accordion ---
const faqs = [
  {
    id: 'business-1',
    category: 'For Businesses',
    question: 'How do I find the right publisher for my brand?',
    answer: 'Our AI marketing manager analyzes your target audience, location, and industry to recommend the top 5 most relevant publishers in our network. You can review their profiles, trust scores, and past campaign analytics before booking.'
  },
  {
    id: 'business-2',
    category: 'For Businesses',
    question: 'What happens after I submit a campaign request?',
    answer: 'Shortlisted publishers receive your brief within minutes. You will see their responses, proposed timelines, and suggested content ideas in your dashboard. You approve the one that fits best.'
  },
  {
    id: 'publisher-1',
    category: 'For Publishers',
    question: 'How do I get matched with businesses?',
    answer: 'Simply set up your publisher profile with your niche, audience demographics, and location. Our system automatically matches you with relevant requests. You get notified via email and dashboard alerts.'
  },
  {
    id: 'publisher-2',
    category: 'For Publishers',
    question: 'What kind of content do I need to create?',
    answer: 'You have full creative freedom. Whether it is a social media post, a podcast mention, a newsletter feature, or a video review—you execute it in your unique voice, and we handle the compliance checks.'
  }
];

export function HowItWorks() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* --- Hero Section (No Money Mentions) --- */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            How <span className="text-blue-600 dark:text-blue-400">Micro Billboards</span> Works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            We bridge the gap between local South African businesses and trusted creators. 
            No algorithms, no ad blockers—just real human connections.
          </p>
        </div>

        {/* --- Interactive UI Mockups (Stepper) --- */}
        <div className="mt-16">
          <div className="relative">
            {/* Vertical Line Connector */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gray-200 dark:bg-gray-800" />
            
            {workflowSteps.map((step, index) => (
              <div key={step.id} className={`relative mb-16 flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* Center Icon (The Mockup Node) */}
                <div className="absolute left-1/2 z-10 -translate-x-1/2">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} shadow-md transition-transform duration-300 hover:scale-110`}>
                    <step.icon className={`h-8 w-8 ${step.iconColor}`} />
                  </div>
                </div>

                {/* Left/Right Content Cards */}
                <div className={`w-5/12 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {step.id}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                    {/* Interactive Visual Cue: A mini "dashboard" badge */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      <span>Live demo: {step.id === 1 ? 'Brief submitted' : step.id === 2 ? 'Review pending' : 'Placement active'}</span>
                    </div>
                  </div>
                </div>
                <div className="w-5/12" /> {/* Empty spacer */} 
              </div>
            ))}
          </div>
        </div>

        {/* --- Guided FAQ Accordion Section --- */}
        <div className="mt-24 rounded-3xl bg-gray-50 p-8 dark:bg-gray-900/50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions & Guided Steps</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Everything you need to know to get started on the platform.</p>
          </div>

          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {faq.category}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                  </div>
                  {openFaqId === faq.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {openFaqId === faq.id && (
                  <div className="border-t border-gray-200 px-6 py-4 text-gray-600 dark:border-gray-700 dark:text-gray-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Clear Call-to-Action Buttons (Guided Proceed) */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup?type=business"
              className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              Get Started as a Business
            </Link>
            <Link
              to="/signup?type=publisher"
              className="rounded-xl border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-transparent dark:text-white dark:hover:bg-gray-800"
            >
              Join as a Publisher
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
