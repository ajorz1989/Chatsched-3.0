/**
 * Feature Flags — Advertising Channels
 *
 * Each non-core channel is gated behind a Vite environment variable, but the
 * *meaning* of that variable differs by channel maturity:
 *
 *   - social-media  — always on, not a flag at all (the core marketplace).
 *   - influencer / podcast / website / radio — launched. Default ON. Their
 *     env var is a kill switch: set it to "false" to pull one back into
 *     "coming soon" without a code deploy. Leaving it unset means live.
 *
 * Adding a new (not-yet-launched) channel:
 *   1. Add the slug to ChannelSlug in channelTypes.ts
 *   2. Add its env key to FLAG_ENV_KEYS below (it will default OFF —
 *      only slugs listed in DEFAULT_ON default to true when unset)
 *   3. Create the channel module in src/channels/<slug>/index.ts
 *   4. Register it in src/lib/channelRegistry.ts
 *   Done — no other file needs to change.
 */

import type { ChannelSlug } from "./channelTypes";

/**
 * Maps each channel slug to the Vite env variable that controls it.
 * null = channel is always on (the core social-media marketplace).
 */
const FLAG_ENV_KEYS: Record<ChannelSlug, string | null> = {
  "social-media": null, // always enabled — this is the live marketplace
  "influencer":   "VITE_CHANNEL_INFLUENCER_ENABLED",
  "podcast":      "VITE_CHANNEL_PODCAST_ENABLED",
  "website":      "VITE_CHANNEL_WEBSITE_ENABLED",
  "radio":        "VITE_CHANNEL_RADIO_ENABLED",
};

/**
 * Channels that default to ON when their env var is unset or empty — i.e.
 * live by default the moment this code ships, no deploy-environment env var
 * required. Everything else defaults OFF until explicitly turned on.
 */
const DEFAULT_ON: ChannelSlug[] = ["influencer", "podcast", "website", "radio"];

/** Returns true if the channel is ready for public use. */
export function isChannelEnabled(slug: ChannelSlug): boolean {
  const key = FLAG_ENV_KEYS[slug];
  if (key === null) return true; // always-on channel

  const raw = import.meta.env[key];
  if (raw === undefined || raw === "") return DEFAULT_ON.includes(slug);
  return raw === "true";
}

/**
 * Returns a map of all channel slugs and their enabled state.
 * Useful for the admin panel and channel hub overview.
 */
export function getAllChannelFlags(): Record<ChannelSlug, boolean> {
  return Object.fromEntries(
    (Object.keys(FLAG_ENV_KEYS) as ChannelSlug[]).map((slug) => [
      slug,
      isChannelEnabled(slug),
    ])
  ) as Record<ChannelSlug, boolean>;
}
