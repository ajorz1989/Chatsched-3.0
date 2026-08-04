import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { CATEGORIES, PROVINCES, PLATFORMS, CAPE_TOWN_SUBURBS, CREATOR_APPROVAL_WINDOW_DAYS, BUSINESS_PAYMENT_WINDOW_DAYS, CREATOR_PAYOUT_WINDOW_HOURS } from "../lib/constants";
import { getChannelBySlug } from "../lib/channelRegistry";
import type { ChannelSlug } from "../lib/channelTypes";
import type { Platform } from "../lib/types";
import Seo from "../components/Seo";

const DEFAULT_MIN_FOLLOWERS = 3000;
const DEFAULT_CHECKS = [
  "My page/profile is public",
  "My audience is primarily South African",
  "I've posted in the last 30 days",
];
const APPLY_CHANNEL_STORAGE_KEY = "mb_apply_channel";

type Step = "eligibility" | "details" | "social" | "business" | "review" | "submitted" | "ineligible";
const STEPS: Step[] = ["eligibility", "details", "social", "business", "review"];

interface FormState {
  followers: string;
  check1: boolean;
  check2: boolean;
  check3: boolean;
  name: string;
  province: string;
  city: string;
  suburb: string;
  platforms: Platform[];
  category: string;
  engagement: string;
  monthlyReach: string;
  audience: string;
  bio: string;
  accountAgeMonths: string;
  postingFrequency: string;
  businessName: string;
  companyRegistration: string;
  vatNumber: string;
  acceptedTerms: boolean;
  acceptedPaymentTerms: boolean;
}

const initialState: FormState = {
  followers: "", check1: false, check2: false, check3: false,
  name: "", province: "", city: "", suburb: "", platforms: [], category: "", engagement: "", monthlyReach: "",
  audience: "", bio: "", accountAgeMonths: "", postingFrequency: "",
  businessName: "", companyRegistration: "", vatNumber: "", acceptedTerms: false, acceptedPaymentTerms: false,
};

const inputClass = "w-full border-2 border-billboard-ink rounded px-3 py-2.5";
const labelClass = "block text-sm font-semibold mb-1.5";
const continueClass = "bg-billboard-yellow border-[3px] border-billboard-ink font-bold px-5 py-3 rounded hover:-translate-y-0.5 transition";
const backClass = "font-bold px-5 py-3";

export default function PublisherApply() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Which channel is this application for? URL param wins; falls back to
  // whatever Register.tsx stashed in sessionStorage when the applicant
  // clicked "Apply as a creator" on a channel page before signing up (that
  // context would otherwise be lost across the register → login → apply
  // hop, since RequireAuth doesn't carry a return-to destination).
  const paramChannel = searchParams.get("channel") as ChannelSlug | null;
  const storedChannel = (typeof window !== "undefined" ? sessionStorage.getItem(APPLY_CHANNEL_STORAGE_KEY) : null) as ChannelSlug | null;
  const channelSlug: ChannelSlug = paramChannel || storedChannel || "social-media";
  const channelModule = getChannelBySlug(channelSlug) ?? getChannelBySlug("social-media")!;
  const ch = channelModule.definition;
  const isRequestFlow = ch.bookingFlow === "request";

  const minMetric = isRequestFlow && ch.eligibility ? ch.eligibility.minValue : DEFAULT_MIN_FOLLOWERS;
  const metricLabel = isRequestFlow && ch.eligibility ? ch.eligibility.metricLabel : "Follower count";
  const checks = isRequestFlow && ch.eligibility ? ch.eligibility.checks : DEFAULT_CHECKS;

  const [step, setStep] = useState<Step>("eligibility");
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const stepIndex = STEPS.indexOf(step);
  const progressPct = step === "submitted" || step === "ineligible" ? 100 : ((stepIndex + 1) / STEPS.length) * 100;

  function togglePlatform(p: Platform) {
    update("platforms", form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p]);
  }

  function checkEligibility() {
    const metric = Number(form.followers);
    if (!metric || metric < minMetric || !form.check1 || !form.check2 || !form.check3) {
      setStep("ineligible");
      return;
    }
    setStep("details");
  }

  async function submitApplication() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from("publishers").insert({
      user_id: user.id,
      email: user.email,
      name: form.name || profile?.full_name || "",
      mobile_number: profile?.phone ?? null,
      province: form.province,
      city: form.city,
      suburb: form.suburb || null,
      channel_slug: channelSlug,
      platforms: form.platforms,
      category: form.category,
      followers: Number(form.followers),
      engagement: Number(form.engagement) || 0,
      monthly_reach: Number(form.monthlyReach) || null,
      audience: form.audience,
      bio: form.bio,
      account_age_months: Number(form.accountAgeMonths) || null,
      posting_frequency: form.postingFrequency,
      business_name: form.businessName || null,
      company_registration: form.companyRegistration || null,
      vat_number: form.vatNumber || null,
      status: "pending_review",
      price_per_post: 0,
      initials: (form.name || profile?.full_name || "?").slice(0, 2).toUpperCase(),
      swatch: "from-billboard-green to-billboard-greenDeep",
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (typeof window !== "undefined") sessionStorage.removeItem(APPLY_CHANNEL_STORAGE_KEY);
    setStep("submitted");
  }

  if (step === "ineligible") {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <Seo title="Creator Application · Micro Billboards" noindex />
        <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-red text-billboard-red px-3 py-1.5 rounded mb-4">Not quite yet</span>
        <h1 className="text-2xl md:text-3xl mb-3">Not quite eligible yet.</h1>
        <p className="text-billboard-inkSoft mb-8">
          To apply for {ch.name}, you'll need at least {minMetric.toLocaleString()} {metricLabel.toLowerCase()}, and
          all three checks above. Keep growing and come back — we'd love to have you.
        </p>
        <button onClick={() => setStep("eligibility")} className={continueClass}>Check again</button>
      </div>
    );
  }

  if (step === "submitted") {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <span className="inline-block font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-greenDeep text-billboard-greenDeep px-3 py-1.5 rounded mb-4">Submitted</span>
        <h1 className="text-2xl md:text-3xl mb-3">Application submitted.</h1>
        <p className="text-billboard-inkSoft mb-8">
          You're in <strong>Pending Review</strong>. We review every {isRequestFlow ? "creator" : "publisher"} by hand before they go live —
          we'll be in touch by email either way.
        </p>
        <button onClick={() => navigate("/")} className="border-[3px] border-billboard-ink bg-billboard-ink text-billboard-paper font-bold px-5 py-3 rounded hover:-translate-y-0.5 transition">
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <Seo title={`${isRequestFlow ? "Creator" : "Publisher"} Application · Micro Billboards`} noindex />

      {isRequestFlow && (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider uppercase border-2 border-billboard-ink px-3 py-1.5 rounded mb-4">
          {ch.emoji} Applying to {ch.name}
        </span>
      )}

      <div className="h-2 border-2 border-billboard-ink rounded mb-8 overflow-hidden">
        <div className="h-full bg-billboard-green transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      {error && <p className="text-billboard-red text-sm font-semibold mb-4">{error}</p>}

      {step === "eligibility" && (
        <div className="border-[3px] border-billboard-ink rounded p-6 space-y-4">
          <h1 className="text-2xl mb-1">Let's check you're eligible.</h1>
          <div>
            <label className={labelClass}>{metricLabel}</label>
            <input type="number" value={form.followers} onChange={(e) => update("followers", e.target.value)} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.check1} onChange={(e) => update("check1", e.target.checked)} />
            {checks[0]}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.check2} onChange={(e) => update("check2", e.target.checked)} />
            {checks[1]}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.check3} onChange={(e) => update("check3", e.target.checked)} />
            {checks[2]}
          </label>
          <button onClick={checkEligibility} className={continueClass}>Continue</button>
        </div>
      )}

      {step === "details" && (
        <div className="border-[3px] border-billboard-ink rounded p-6 space-y-4">
          <h1 className="text-2xl mb-1">Where are you based?</h1>
          <div>
            <label className={labelClass}>{isRequestFlow ? `${ch.name} name` : "Page/account name"}</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Province</label>
            <select value={form.province} onChange={(e) => update("province", e.target.value)} className={inputClass}>
              <option value="">Select a province</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Suburb <span className="font-normal text-billboard-inkSoft">(optional, Cape Town pilot)</span></label>
            <input
              value={form.suburb}
              onChange={(e) => update("suburb", e.target.value)}
              list="suburb-options"
              placeholder="e.g. Claremont"
              className={inputClass}
            />
            <datalist id="suburb-options">
              {CAPE_TOWN_SUBURBS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("eligibility")} className={backClass}>Back</button>
            <button onClick={() => setStep("social")} className={continueClass}>Continue</button>
          </div>
        </div>
      )}

      {step === "social" && (
        <div className="border-[3px] border-billboard-ink rounded p-6 space-y-4">
          <h1 className="text-2xl mb-1">Tell us about your {isRequestFlow ? ch.name.toLowerCase() : "page"}.</h1>
          <div>
            <label className={labelClass}>{isRequestFlow ? "Social presence (optional)" : "Platform(s)"}</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button type="button" key={p} onClick={() => togglePlatform(p)}
                  className={`text-sm font-semibold px-3 py-1.5 rounded border-2 border-billboard-ink transition ${form.platforms.includes(p) ? "bg-billboard-green" : "bg-billboard-paper"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Avg. engagement %</label>
              <input type="number" step="0.1" value={form.engagement} onChange={(e) => update("engagement", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Avg. monthly reach</label>
              <input type="number" value={form.monthlyReach} onChange={(e) => update("monthlyReach", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Who's your audience?</label>
            <input value={form.audience} onChange={(e) => update("audience", e.target.value)} placeholder="e.g. Young families in the Southern Suburbs" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Describe your {isRequestFlow ? ch.name.toLowerCase() : "page"}</label>
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{isRequestFlow ? `${ch.name} age (months)` : "Account age (months)"}</label>
              <input type="number" value={form.accountAgeMonths} onChange={(e) => update("accountAgeMonths", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Posting frequency</label>
              <input value={form.postingFrequency} onChange={(e) => update("postingFrequency", e.target.value)} placeholder="e.g. Daily" className={inputClass} />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("details")} className={backClass}>Back</button>
            <button onClick={() => setStep("business")} className={continueClass}>Continue</button>
          </div>
        </div>
      )}

      {step === "business" && (
        <div className="border-[3px] border-billboard-ink rounded p-6 space-y-4">
          <h1 className="text-2xl mb-1">Registered as a business?</h1>
          <p className="text-sm text-billboard-inkSoft">Optional — skip this if you post as an individual.</p>
          <div>
            <label className={labelClass}>Business name</label>
            <input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Company registration number</label>
            <input value={form.companyRegistration} onChange={(e) => update("companyRegistration", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>VAT number</label>
            <input value={form.vatNumber} onChange={(e) => update("vatNumber", e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("social")} className={backClass}>Back</button>
            <button onClick={() => setStep("review")} className={continueClass}>Continue</button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="border-[3px] border-billboard-ink rounded p-6 space-y-4">
          <h1 className="text-2xl mb-1">Last thing.</h1>
          <p className="text-sm text-billboard-inkSoft">
            Every application is reviewed by hand — you won't appear in the directory until you're approved.
          </p>

          {isRequestFlow && (
            <div className="border-2 border-billboard-ink rounded p-4 bg-billboard-paperDim">
              <h2 className="font-bold text-sm mb-2">Payment terms for {ch.name} creators</h2>
              <ul className="space-y-1.5 text-sm text-billboard-inkSoft">
                <li>• You'll have {CREATOR_APPROVAL_WINDOW_DAYS} days to approve or decline each request from your dashboard — unanswered requests simply expire, so you're never locked in.</li>
                <li>• Once you approve a request, the business has {BUSINESS_PAYMENT_WINDOW_DAYS} days to pay the platform directly — there's no online checkout for {ch.name.toLowerCase()}, and nothing goes live until that payment is confirmed.</li>
                <li>• You'll be paid within {CREATOR_PAYOUT_WINDOW_HOURS} hours of confirming your sponsored content is live.</li>
              </ul>
              <label className="flex items-start gap-2 text-sm mt-3 pt-3 border-t border-billboard-ink/15">
                <input type="checkbox" checked={form.acceptedPaymentTerms} onChange={(e) => update("acceptedPaymentTerms", e.target.checked)} className="mt-0.5" />
                I understand and accept these payment terms.
              </label>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={form.acceptedTerms} onChange={(e) => update("acceptedTerms", e.target.checked)} className="mt-0.5" />
            I confirm the details above are accurate and accept the {isRequestFlow ? "creator" : "publisher"} terms.
          </label>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep("business")} className={backClass}>Back</button>
            <button onClick={submitApplication} disabled={!form.acceptedTerms || (isRequestFlow && !form.acceptedPaymentTerms) || submitting}
              className="bg-billboard-green border-[3px] border-billboard-ink font-bold px-5 py-3 rounded hover:-translate-y-0.5 transition disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
