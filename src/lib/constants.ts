import type { Category, Platform } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "food", name: "Food & Drink", icon: "food" },
  { slug: "fitness", name: "Fitness & Wellness", icon: "fitness" },
  { slug: "beauty", name: "Beauty & Grooming", icon: "beauty" },
  { slug: "home", name: "Home & Trade Services", icon: "home" },
  { slug: "family", name: "Family & Community", icon: "family" },
  { slug: "auto", name: "Automotive", icon: "auto" },
  { slug: "fashion", name: "Fashion & Lifestyle", icon: "fashion" },
  { slug: "tech", name: "Tech & Gaming", icon: "tech" },
  { slug: "local-lifestyle", name: "Local Lifestyle", icon: "lifestyle" },
  { slug: "regional-news", name: "Regional News", icon: "news" },
  { slug: "community-groups", name: "Community Groups", icon: "community" },
  { slug: "retail", name: "Retail & Shopping", icon: "retail" },
  { slug: "property", name: "Property & Real Estate", icon: "property" },
  { slug: "pets", name: "Pets & Animals", icon: "pets" },
  { slug: "events", name: "Events & Entertainment", icon: "events" },
  { slug: "social-followers", name: "Social Followers", icon: "social" },
];

export const PROVINCES = [
  "Western Cape", "Gauteng", "KwaZulu-Natal", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

export const PLATFORMS: Platform[] = ["Facebook Page", "Facebook Group", "Instagram", "TikTok", "WhatsApp Channel", "X", "LinkedIn", "YouTube"];

export const LANGUAGES = [
  "English", "Afrikaans", "Zulu", "Xhosa", "Sotho", "Tswana",
  "Venda", "Tsonga", "Ndebele", "Swati", "Portuguese", "French",
];

// Cape Town pilot only, matching the "Piloting in Cape Town" scope stated
// across the site (Home hero, footer). A free-text `suburb` still stores
// fine for publishers outside this list — this just powers the /suburbs
// browse page and its dropdown filter. Revisit as a per-city list if/when
// the pilot expands beyond Cape Town.
export const CAPE_TOWN_SUBURBS = [
  "City Bowl", "Sea Point", "Green Point", "Camps Bay", "Woodstock",
  "Observatory", "Claremont", "Rondebosch", "Newlands", "Constantia",
  "Century City", "Table View", "Milnerton", "Bellville", "Durbanville",
  "Parow", "Goodwood", "Muizenberg", "Somerset West", "Mitchells Plain",
];

// The publisher's cut of each payment — adjust this one line if the
// commission split changes. 75% matches what's been discussed for this
// project; double-check it's still current before relying on it.
export const PUBLISHER_SHARE = 0.75;

// Single source of truth for the WhatsApp contact number and site email.
// Previously hardcoded separately in Header, Contact, PublisherProfile,
// ComingSoon, and ChannelPage (five copies, easy to update four and miss
// one) — change it here and every "WhatsApp us" link updates together.
export const WHATSAPP_NUMBER = "27821234567";
export const CONTACT_EMAIL = "hello@microbillboards.co.za";

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// A booking is "unpaid too long" once a payment has been marked paid but
// the payout hasn't gone out after this many days — used to flag stale
// payouts in the admin UI rather than relying on someone remembering to
// check. Pricing's FAQ promises payouts "on a regular schedule"; this is
// what makes that promise something the UI actually surfaces, not just
// copy.
export const PAYOUT_DUE_DAYS = 7;

// How many days a "Featured" placement lasts once an admin grants it.
export const FEATURED_DURATION_DAYS = 14;

// ── Channel request escrow timing (influencer / website / podcast / radio) ──
// Mirrors the generated-column deadlines in schema_phase17 exactly — kept as
// named constants here so the UI copy (disclaimers, countdowns) never drifts
// from what the database actually enforces. See that migration's header
// comment for the full state-machine rationale.
export const CREATOR_APPROVAL_WINDOW_DAYS = 7;   // creator must approve/decline within this many days of a request
export const BUSINESS_PAYMENT_WINDOW_DAYS = 7;   // business must pay within this many days of creator approval
export const CREATOR_PAYOUT_WINDOW_HOURS = 48;   // creator is paid within this many hours of the post going live

// Preset cover-block gradients, kept in one place so the admin "add publisher"
// form can offer a visual picker instead of asking anyone to type Tailwind classes.
export const SWATCHES = [
  { label: "Yellow", value: "from-billboard-yellow to-billboard-yellowDeep" },
  { label: "Green", value: "from-billboard-green to-billboard-greenDeep" },
  { label: "Red → Yellow deep", value: "from-billboard-red to-billboard-yellowDeep" },
  { label: "Ink", value: "from-billboard-ink to-billboard-inkSoft" },
  { label: "Yellow → Red", value: "from-billboard-yellow to-billboard-red" },
  { label: "Green → Ink", value: "from-billboard-green to-billboard-ink" },
  { label: "Red → Yellow", value: "from-billboard-red to-billboard-yellow" },
  { label: "Ink → Green", value: "from-billboard-ink to-billboard-green" },
];
