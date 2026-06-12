import type { CreatorCollectionStats } from "./creator-profile-types";

export const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  kick: "Kick",
  instagram: "Instagram",
  discord: "Discord",
  x: "X",
};

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: "twitch", label: "Twitch" },
  { value: "youtube", label: "YouTube" },
  { value: "kick", label: "Kick" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "discord", label: "Discord" },
  { value: "link", label: "Outro link" },
] as const;

export const LIVE_PLATFORMS = ["twitch", "kick"] as const;
export const TRUSTED_EXTERNAL_METRIC_PLATFORMS = new Set([
  "youtube",
  "twitch",
  "kick",
  "discord",
]);

export const RARITY_SHOWCASE_CYCLE = [
  { rarity: "common" },
  { rarity: "rare" },
  { rarity: "epic" },
  { rarity: "legendary" },
] as const;

export const RARITY_SHOWCASE_INTERVAL = 8500;

export const EMPTY_COLLECTION_STATS: CreatorCollectionStats = {
  common: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
  total: 0,
  uniqueCollectors: 0,
};
