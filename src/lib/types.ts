import type { ChannelSlug } from "./channelTypes";

export type Platform = "Facebook Page" | "Facebook Group" | "Instagram" | "TikTok" | "WhatsApp Channel" | "X" | "LinkedIn" | "YouTube";

export interface Publisher {
  id: string;
  name: string;
  city: string;
  province: string;
  // Cape Town pilot only — a free-text neighbourhood/area, shown and filterable
  // alongside city/province. Optional since not every publisher sets one and
  // publishers outside the pilot area have no fixed suburb list to pick from.
  suburb: string | null;
  category: string;
  platforms: Platform[];
  followers: number;
  engagement: number; // percent
  price_per_post: number; // Rand
  rating: number | null; // null = not enough reviews yet
  reviews: number;
  verified: boolean;
  bio: string;
  audience: string;
  initials: string;
  swatch: string; // tailwind gradient classes for the cover block
  created_at?: string;
  // Phase 5 — self-serve applications, trust & verification
  user_id: string | null; // null = added by hand via /admin, not self-serve
  email: string | null;
  mobile_number: string | null;
  monthly_reach: number | null;
  languages: string[];
  account_age_months: number | null;
  posting_frequency: string | null;
  business_name: string | null;
  company_registration: string | null;
  vat_number: string | null;
  status: PublisherStatus;
  level: PublisherLevel | null;
  trust_score: number;
  publisher_score: number;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  admin_notes: string | null;
  rejected_reason: string | null;
  featured: boolean;
  featured_until: string | null;
  reviewed_at: string | null;
  // Phase 17 — multi-channel marketplace. Defaults to "social-media" for every
  // row that existed before this column did, so the original directory/PayFast
  // flow keeps working unchanged for every publisher already in the database.
  channel_slug: ChannelSlug;
}

export type PublisherStatus = "pending_review" | "approved" | "rejected" | "suspended";
export type PublisherLevel = "rising" | "verified" | "premium" | "elite";

export interface Category {
  slug: string;
  name: string;
  icon: "food" | "fitness" | "beauty" | "home" | "family" | "auto" | "fashion" | "tech"
    | "lifestyle" | "news" | "community" | "retail" | "property" | "pets" | "events" | "social";
}

export type UserRole = "business" | "admin" | "publisher";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  // Phase 7 — business verification
  province: string | null;
  city: string | null;
  industry: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  business_verified: boolean;
}

export type RequestStatus = "pending" | "contacted" | "confirmed" | "declined" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";
export type PayoutStatus = "unpaid" | "paid";

export interface Payment {
  id: string;
  request_id: string;
  business_id: string;
  amount: number;
  status: PaymentStatus;
  payfast_payment_id: string | null;
  payout_status: PayoutStatus;
  payout_date: string | null;
  created_at: string;
  paid_at: string | null;
}

export type ReviewAuthorRole = "business" | "publisher";

export interface Review {
  id: string;
  request_id: string;
  publisher_id: string;
  business_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author_role: ReviewAuthorRole;
  communication_rating: number | null;
  professionalism_rating: number | null;
  quality_rating: number | null;
  timeliness_rating: number | null;
  value_rating: number | null;
  business?: Pick<Profile, "full_name" | "company_name"> | null;
}

export interface PublisherRequest {
  id: string;
  publisher_id: string;
  business_id: string;
  campaign_message: string;
  budget: number | null;
  agreed_amount: number | null;
  status: RequestStatus;
  created_at: string;
  // present when fetched with a join
  publisher?: Pick<Publisher, "id" | "name" | "city" | "province"> | null;
  business?: Pick<Profile, "full_name" | "company_name" | "phone" | "email_verified" | "phone_verified" | "business_verified"> | null;
  payments?: Payment[];
  reviews?: Review[];
}

export type SenderRole = "business" | "admin" | "publisher";

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  sender_role: SenderRole;
  body: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

// ─── Phase 17 — Channel request workflow (influencer / website / podcast / radio) ──
//
// A parallel, deliberately separate request model for the four "request only,
// no online checkout" channels. Kept apart from PublisherRequest/Payment (the
// PayFast-backed social-media flow) rather than merged into it, since the
// payment mechanics genuinely differ — see /areas escrow note in the schema
// migration for the full state machine this type mirrors.
export type ChannelRequestStatus =
  | "pending"            // awaiting the creator's approve/decline (7-day window)
  | "declined"           // creator declined, or an admin closed it as unresponsive
  | "cancelled"          // business withdrew before the creator responded
  | "awaiting_payment"   // creator approved; business must pay within 7 days
  | "payment_submitted"  // business self-reported payment; awaiting confirmation
  | "paid"               // platform confirmed funds received — post can now go live
  | "live"               // sponsored content is live; creator payout due within 48h
  | "completed";         // creator payout sent

export interface ChannelRequest {
  id: string;
  channel_slug: ChannelSlug;
  creator_id: string;
  business_id: string;
  campaign_message: string;
  advertising_method: string;
  proposed_amount: number;
  status: ChannelRequestStatus;
  created_at: string;
  approval_due_at: string;
  responded_at: string | null;
  payment_due_at: string | null;
  payment_submitted_at: string | null;
  paid_at: string | null;
  live_at: string | null;
  payout_due_at: string | null;
  completed_at: string | null;
  // present when fetched with a join
  creator?: Pick<Publisher, "id" | "name" | "city" | "province" | "channel_slug"> | null;
  business?: Pick<Profile, "full_name" | "company_name" | "phone"> | null;
}
