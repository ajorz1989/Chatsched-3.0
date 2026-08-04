# Deploying the Edge Functions

I couldn't deploy or test-run these myself — this sandbox can't reach
supabase.com, deno.land, payfast.co.za, or resend.com. Everything below is
written from each service's current documentation, but the first real test
of this will be in your project, not mine. That's normal for integrations
like these, not a sign something's wrong — see "If the first test fails"
below. (I could reach api.anthropic.com from here, so I did at least confirm
the audience-match function's request shape against the real endpoint —
details in the main README.)

## 1. Install the Supabase CLI and link your project
```
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```
Your project ref is in the Supabase dashboard URL: `supabase.com/dashboard/project/<this-part>`.

## 2. Get PayFast sandbox credentials
Sign up at https://sandbox.payfast.co.za (free) for your own sandbox merchant
ID, key, and passphrase. PayFast also publishes shared test credentials
(merchant ID `10000100`, key `46f0cd694581a`) used across most of their
tutorials and sandboxes — fine for a first smoke test, but your own sandbox
account will let you set a passphrase and see transactions in a dashboard
that's actually yours. Either way, double-check current values on PayFast's
site — sandbox credentials aren't something I can verify from here.

## 3. Set secrets
```
supabase secrets set PAYFAST_MERCHANT_ID=your-merchant-id
supabase secrets set PAYFAST_MERCHANT_KEY=your-merchant-key
supabase secrets set PAYFAST_PASSPHRASE=your-passphrase
supabase secrets set PAYFAST_MODE=sandbox
supabase secrets set SITE_URL=http://localhost:5173
supabase secrets set ADMIN_EMAIL=you@example.com
supabase secrets set RESEND_API_KEY=your-resend-api-key
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
```
`SITE_URL` should be wherever the site is actually reachable — swap it to
your real domain once deployed. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
don't need setting — Supabase injects those into every Edge Function
automatically. `ADMIN_EMAIL`, `RESEND_API_KEY`, and `ANTHROPIC_API_KEY` are
Phase 3 additions — see the bottom of this file if you're only deploying
Phase 2's payment functions for now.

## 4. Deploy
```
supabase functions deploy payfast-checkout
supabase functions deploy payfast-notify --no-verify-jwt
supabase functions deploy notify
supabase functions deploy audience-match
```
The `--no-verify-jwt` on `payfast-notify` is not optional — PayFast's server
calls this one directly, with no Supabase login, so if JWT verification is
left on, Supabase rejects the call with a 401 before your code ever runs and
payments will look like they silently vanish. Every other function here
expects a logged-in user and should keep normal JWT verification.

## 5. Test in the sandbox
1. Make sure `PAYFAST_MODE=sandbox` is set (step 3).
2. As an admin, confirm a request and set an agreed amount.
3. As that business, click "Pay now" and complete a test payment on PayFast's
   sandbox checkout.
4. Check the payment shows `paid` on the dashboard and in `/admin` — this
   confirms the ITN round-trip actually worked, not just the redirect.
5. Function logs (`supabase functions logs payfast-notify`) will show
   exactly where anything failed — signature, PayFast's validate check, or
   the amount cross-check.

## 6. Test the Phase 3 pieces
- **Messages & notifications**: post a message from a business's dashboard,
  then check the admin inbox tied to `ADMIN_EMAIL` got an email — and the
  reverse, a message from `/admin` should email the business. Until you
  verify your own sending domain with Resend, emails send from
  `onboarding@resend.dev`, which works immediately but only actually lands
  for addresses you've confirmed in your Resend dashboard — verify a real
  domain before expecting a stranger's inbox to receive one. If
  `RESEND_API_KEY` isn't set at all, `notify` just skips sending rather than
  breaking the request/message it was attached to.
- **Audience match**: log in as a business, go to `/match`, describe a
  business and target customer, and check the ranked results reference real
  specifics from your publisher directory rather than generic-sounding
  reasons. If `ANTHROPIC_API_KEY` isn't set, the page explains that plainly
  instead of erroring oddly.

## If the first test fails
A "signature mismatch" on the first attempt is the single most common PayFast
integration issue, documented extensively in PayFast's own troubleshooting
guides — it almost always means one field's value differs by a stray space,
or the account has a passphrase configured that a secret above doesn't match
(or vice versa). It is not a sign of a deeper problem, and PayFast's
knowledge base has a specific troubleshooting page for exactly this.

If instead you get a 401 straight away, it's almost certainly the
`--no-verify-jwt` flag from step 4. And if your project uses Supabase's newer
"secret / publishable" API keys rather than the legacy anon/service_role
keys, there's a known interaction where Edge Function JWT verification needs
extra configuration — worth checking Supabase's current Edge Functions docs
if you're on that newer key system.

## Going live
Switch `PAYFAST_MODE` to `live`, swap in your live PayFast credentials, verify
your sending domain in Resend and set `RESEND_FROM` to an address on it (e.g.
`Micro Billboards <notifications@yourdomain.co.za>` — without this it keeps
using the sandbox `onboarding@resend.dev` address), and set `SITE_URL` to
your real domain — then redeploy all four functions so they pick up the new
secrets.
