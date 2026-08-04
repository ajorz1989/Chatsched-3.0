# Micro Billboards

A South African marketplace connecting small businesses with publishers and creators — social media pages/groups, influencers, websites, podcasts, and radio — to book advertising.

## Stack
Vite + React 19 + TypeScript + React Router + Tailwind CSS, backed by Supabase (Postgres + Auth + Edge Functions). Payments via PayFast, notification emails via Resend, audience matching via the Anthropic API — all three called only from Edge Functions, never from the browser.

## Setup (one-time)
1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard: **SQL Editor → New query** → paste the contents of `supabase/schema.sql` → **Run**.
3. Optional but recommended, so the site isn't empty: run `supabase/seed.sql` the same way — it loads the 8 pilot publishers the prototype shipped with.
4. In **Project Settings → API**, copy your **Project URL** and **anon public key**.
5. Copy `.env.example` to `.env` and paste those two values in.
6. `npm install`, then `npm run dev`.

Without step 5, the app still runs — pages that need live data show a small "connect the database" notice instead of crashing.

### Making yourself an admin
1. Register a normal account at `/register`.
2. Supabase dashboard → **Authentication → Users** → copy your user's UUID.
3. SQL Editor: `update public.profiles set role = 'admin' where id = 'paste-uuid-here';`
4. Log out and back in on the site — you'll land on `/admin` instead of `/dashboard`.

### A note on email confirmation
By default, new Supabase projects require confirming a signup email before login works. For faster local testing, you can turn this off: **Authentication → Providers → Email → Confirm email**. Worth turning back on before real businesses sign up.

## Setup — Phase 2 (payments, payouts, reviews)
1. SQL Editor → run `supabase/schema_phase2.sql` (after `schema.sql` — it adds `payments`, `reviews`, and an `agreed_amount` column on `requests`).
2. Follow `supabase/DEPLOY.md` to deploy the two PayFast Edge Functions and set their secrets. This part needs the Supabase CLI — it can't be done from the dashboard alone.
3. Until the Edge Functions are deployed, "Pay now" on the dashboard will fail — everything else in the app works fine without them.

## Setup — Phase 3 (messaging, notifications, Audience Finder)
1. SQL Editor → run `supabase/schema_phase3.sql` (adds a `messages` table for the per-request thread between a business and admin).
2. `supabase/DEPLOY.md` now also covers the `notify` and `audience-match` functions and the secrets they need (`ADMIN_EMAIL`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`).
3. Everything degrades gracefully without those secrets set: messaging still works without `notify` deployed (you just won't get emailed about it), and `/match` explains plainly that it isn't configured yet rather than erroring.

## Phase 4 (SEO) — and what's deliberately not here
No new setup steps — everything below is static files and per-page code, nothing to deploy or configure.

- **Meta tags, Open Graph, Twitter Cards, JSON-LD** in `index.html` — what non-JS crawlers and generic link shares see. Swap the placeholder `microbillboards.co.za` domain for your real one (search-replace across `index.html`, `robots.txt`, `sitemap.xml`), and add a 1200×630 `/public/og-image.png` when you have one — there's a commented-out tag waiting for it.
- **Per-page titles and descriptions** via `src/components/Seo.tsx`, using React 19's native `<title>`/`<meta>` hoisting — no react-helmet dependency needed. Helps the browser tab/history and JS-executing crawlers (Google). Auth-only pages (dashboard, admin, login, register, payment result) are marked `noindex`.
- **`robots.txt` and `sitemap.xml`** in `/public`, covering the fixed public routes. Doesn't include individual `/browse/:id` publisher pages yet — see the comment in `sitemap.xml` for why, and what adding that later would look like.

**Worth knowing:** this is a client-rendered SPA with no server-side rendering, so per-page Open Graph tags only exist after JavaScript runs. Most social-preview bots (Facebook, WhatsApp, X, LinkedIn) fetch raw HTML and never execute JavaScript — they'll always see `index.html`'s static tags, never a specific publisher's. A real fix means server-side rendering or a prerendering layer, which is a bigger architectural change than fits here (and contradicts the original "don't change the tech stack" brief) — worth knowing about, not worth building today.

**Deliberately not built this pass, and why:**
- **Blog** — the original brief wanted a full CMS with categories. Building an editor and taxonomy before there's a single post to publish, or a content plan, is backwards. Worth revisiting once there's actually something to write and someone to write it.
- **Fraud detection** — at pilot volume, with every request going through an admin who reviews it by hand, a human already *is* the fraud detection. A bolted-on automated risk score with a handful of transactions would be decoration, not protection — the kind of thing this whole build has tried to avoid.
- **The "future modules" list** (WhatsApp/podcast/newsletter inventory, agency dashboard, white-label, public API, mobile apps, CRM) — the original brief's own instruction here was to architect so these could be *added later without a rewrite*, not to build them now. The type/table/Edge-Function boundaries already in place (one concern per file, RLS per table) are what keeps that door open — there isn't a specific piece of code this pass needed to add for it.

## Phase 17 (multi-channel marketplace: new channels, Suburbs, and the request workflow)
Note on numbering: several phases of work happened in this codebase between Phase 4 and this one without a matching README section — this one picks up the existing `schema_phase<N>.sql` numbering in the repo, not the README's.

Covers: retiring 8 unused channel placeholders, launching 4 real ones (influencer, website, podcast, radio) with their own dedicated pages and a no-online-checkout request → approve/decline workflow, merging Browse and Search into one page, adding a Suburbs browse dimension, and 3 new platform options (X, LinkedIn, YouTube).

1. SQL Editor → run `supabase/schema_phase17_channel_marketplace.sql` (after every prior `schema_phase*.sql`). Adds `channel_slug`/`suburb` to `publishers` and the new `channel_requests` table — see that file's header comment for the full escrow/payment state machine, and why the two 7-day windows are sequenced rather than run concurrently.
2. No new Edge Functions, secrets, or env vars required to launch — the 4 channel flags in `.env.example` now default to **on** even left blank (they're kill switches, not opt-ins; see `src/lib/featureFlags.ts`), so the new channels go live the moment this deploys.

**What's real:** the whole loop — a creator applies to a specific channel (from a channel page's "Apply as a creator" link, or `/register?role=publisher`), goes through the same by-hand admin review as any other publisher, appears in the directory (filterable by channel and suburb from the merged `/browse`), a business finds them and submits a request with a proposed budget from their profile, the creator approves or declines it from their own dashboard — self-serve, no admin relay needed for that step — and Admin's role narrows to the two moments that need a human confirming money actually moved: payment received, and payout sent.

**Deliberately not built this pass:**
- **No automatic expiry job.** The 7-day/48-hour deadlines are real (Postgres-generated columns, always correct), shown in both dashboards and in Admin's "Overdue" filter — but nothing runs on a schedule to auto-close an unresponsive request yet. Closing one is a manual admin action, same "a human is the safety net at pilot volume" reasoning as the fraud-detection note above.
- **No in-thread messaging on channel_requests** — `MessageThread`/`messages` stays scoped to the original `requests` table. A business and creator work from the campaign message + proposed amount only; wiring messaging in here would mean a real schema change beyond what this pass needed.
- **Suburb data is Cape Town-only, and not yet in Admin's manual "add publisher" form** — `CAPE_TOWN_SUBURBS` in `src/lib/constants.ts` is a fixed list; a creator can set their own suburb when they self-serve apply, admin just can't set it by hand yet for a manually-added row.

## Build for production
```
npm run build
```
Outputs a static `dist/` folder — deployable to Netlify, Vercel, or any static host with zero config. Remember to set the two `VITE_SUPABASE_*` env vars in whatever host you use, the same way you did locally.

## What's real vs. placeholder
- Home, Browse (with working filters), Publisher Profile, Categories, Pricing, How It Works, and About are all built against **real Supabase data** — no more mock data in the repo.
- Login and Register are real (Supabase Auth). Businesses can create an account and log in.
- The Contact form saves to the database instead of opening an email draft.
- A business can request a campaign directly from a Publisher Profile page — it's saved to `requests` and shows up on their `/dashboard` and in `/admin`.
- `/admin` is a real, authenticated panel (not a demo): manage incoming requests and their status, add publishers to the directory, and read Contact form submissions.
- Once an admin confirms a request and sets an **agreed amount**, the business can pay for real through PayFast from their dashboard. Payment status only ever changes via PayFast's server-to-server confirmation (the ITN webhook) — never from the page the browser happens to land on, so it can't be faked by just navigating to a "success" URL.
- Payouts to publishers are tracked, not automated — once a payment is marked `paid`, `/admin` shows what's owed (75% of the payment — see `PUBLISHER_SHARE` in `src/lib/constants.ts` if that split changes) and lets an admin mark it as sent once the real bank transfer happens.
- Reviews are real: a business can rate and comment on a campaign once an admin marks its request `completed`, and it shows up on the publisher's public profile.
- Publishers/creators self-serve apply at `/apply` (channel-aware since Phase 17 — see below) and go through admin review from there; the directory only ever shows approved ones.
- Every request on the original social-media flow has a real message thread between the business and an admin (relaying anything that needs to reach the publisher). The 4 request-flow channels added in Phase 17 skip this — see that section for why.
- New requests, new messages, and status changes each trigger a real email via Resend — not simulated, and it fails silently (never blocking the action that triggered it) if Resend isn't configured yet.
- `/audience-finder` (formerly "AI Match") is a real matching tool, not a static filter: a business describes who they want to reach in plain language, and a ranking pass scores the actual publisher directory against it with a specific, grounded reason per match — not a canned response. Worth knowing: with a small directory this is closer to "a well-explained filter" than a mature ranking model; it gets more useful as the directory grows past what someone would comfortably scan by eye themselves.

## Before going live
- Swap the WhatsApp number (`27821234567`) for the real one — it appears in `Header.tsx`, `Contact.tsx`, and `PublisherProfile.tsx`.
- Turn email confirmation back on in Supabase Auth if you turned it off for testing.
- Replace or add to the seeded pilot publishers with real ones via `/admin`.
- Double-check Row Level Security is enabled on all tables (schema.sql and schema_phase2.sql both turn it on, but worth confirming in Table Editor before anyone's real data goes in).
- Confirm the commission split — `PUBLISHER_SHARE` in `src/lib/constants.ts` is set to 75%. Check it's still what you want before real payouts depend on it.
- Switch `PAYFAST_MODE` to `live` and redeploy the Edge Functions with live PayFast credentials (see `supabase/DEPLOY.md`) — everything defaults to PayFast's sandbox until you do.
- Verify a real sending domain in Resend and set `RESEND_FROM` — until then, notification emails send from a shared sandbox address that won't reliably land in a stranger's inbox.
- Swap the placeholder `microbillboards.co.za` domain in `index.html`, `robots.txt`, and `sitemap.xml` for your real one, and add `/public/og-image.png` if you want link shares to show a preview image.
- Sanity-check the Phase 17 numbers that were judgment calls, not given figures: radio's eligibility minimum (`10,000` weekly listener reach — the brief had numbers for podcast/website/influencer but not radio, so this is an estimate in `src/channels/radio/index.ts`), and the `CAPE_TOWN_SUBURBS` list in `src/lib/constants.ts` (add/remove suburbs to match where you actually have coverage).
