"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Gift,
  Globe2,
  Loader2,
  MessageCircle,
  Send,
  Plus,
  PlayCircle,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Trash2,
  UserPlus,
  Users,
  WifiOff,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { CreatorCard } from "@/components/cards/CreatorCard";
import { CREATOR_POPUP_IMAGE_EFFECT_STYLES } from "@/components/creator/CreatorPopupImageEffects";
import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { translate } from "@/lib/i18n/translate";
import { getRarityLabel } from "@/lib/rarity";
import { supabase } from "@/lib/supabase/client";
import { addUserXp } from "@/lib/xp/user-xp";
import { updateMissionProgress } from "@/lib/missions/user-missions";
import type {
  Creator,
  CreatorRank,
  CreatorRarity,
  CreatorStatus,
  SocialPlatform,
} from "@/types/creator";

const LiveDropsModal = dynamic(
  () =>
    import("@/components/modals/LiveDropsModal").then(
      (module) => module.LiveDropsModal,
    ),
  { ssr: false },
);

function translateExisting(t: unknown, key: string, fallback: string) {
  const value = (t as Record<string, string | undefined>)[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

type CreatorProfilePageProps = {
  username: string;
  startInEditMode?: boolean;
};

type CreatorCardRow = {
  rarity: string | null;
  rank: string | null;
  aura: string | null;
  evolution_stage: string | null;
  level: number | null;
  power_score: number | null;
};

type CreatorProfileRow = {
  id: string;
  user_id: string | null;
  username: string;
  nickname: string;
  title: string | null;
  category: string | null;
  status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  popup_animation_style: string | null;
  bio: string | null;
  description: string | null;
  tags: unknown;
  is_verified: boolean | null;
  created_at: string | null;
  trending_score: number | null;
  share_count?: number | null;
  creator_cards?: CreatorCardRow[] | CreatorCardRow | null;
};

type SocialLink = {
  platform: string;
  url: string;
};

type CreatorProfileEditDraft = {
  nickname: string;
  title: string;
  category: string;
  avatarUrl: string;
  bannerUrl: string;
  popupAnimationStyle: string;
  bio: string;
  description: string;
  tagsText: string;
  socialLinksText: string;
};

type AutoClip = {
  id: string;
  title: string;
  platform: "youtube" | "twitch" | "kick" | string;
  url: string;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  description?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  viewCount?: number | null;
  view_count?: number | null;
};

type PartnershipBrand = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
};

type CreatorPartnershipRow = {
  id: string;
  creator_id: string;
  brand_id: string | null;
  brand_name: string;
  partnership_type: string | null;
  source_platform: string | null;
  source_url: string | null;
  source_title: string | null;
  source_thumbnail: string | null;
  source_channel: string | null;
  source_published_at: string | null;
  campaign_name: string | null;
  public_description: string | null;
  website_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  is_active: boolean | null;
  brands?: PartnershipBrand | PartnershipBrand[] | null;
};

type ManualPartnershipDraft = {
  brandName: string;
  partnershipType: string;
  campaignName: string;
  websiteUrl: string;
  brandLogoUrl: string;
  brandWebsiteUrl: string;
  brandDescription: string;
  publicDescription: string;
  startDate: string;
  endDate: string;
};

type LiveStatus = {
  platform?: string;
  username?: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  startedAt?: string;
  thumbnail?: string;
  url?: string;
  followerCount?: number;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  externalCount?: number;
  memberCount?: number;
  onlineMemberCount?: number;
};

type LiveStatusMap = Partial<Record<string, LiveStatus>>;

type CreatorLiveStatusRow = {
  id: string;
  creator_id: string;
  platform: string;
  platform_username: string | null;
  is_live: boolean | null;
  title: string | null;
  viewer_count: number | null;
  game_name: string | null;
  started_at: string | null;
  thumbnail_url: string | null;
  live_url: string | null;
  raw_payload?: Partial<LiveStatus> | null;
  last_checked_at: string | null;
  updated_at: string | null;
};

function mergeLiveStatusPreservingMetrics(
  currentStatus: LiveStatus | undefined,
  nextStatus: LiveStatus,
): LiveStatus {
  return {
    ...currentStatus,
    ...nextStatus,
    followerCount:
      nextStatus.followerCount && nextStatus.followerCount > 0
        ? nextStatus.followerCount
        : currentStatus?.followerCount,
    subscriberCount:
      nextStatus.subscriberCount && nextStatus.subscriberCount > 0
        ? nextStatus.subscriberCount
        : currentStatus?.subscriberCount,
    memberCount:
      nextStatus.memberCount && nextStatus.memberCount > 0
        ? nextStatus.memberCount
        : currentStatus?.memberCount,
    onlineMemberCount:
      nextStatus.onlineMemberCount && nextStatus.onlineMemberCount > 0
        ? nextStatus.onlineMemberCount
        : currentStatus?.onlineMemberCount,
    externalCount:
      nextStatus.externalCount && nextStatus.externalCount > 0
        ? nextStatus.externalCount
        : currentStatus?.externalCount,
    viewCount:
      nextStatus.viewCount && nextStatus.viewCount > 0
        ? nextStatus.viewCount
        : currentStatus?.viewCount,
    videoCount:
      nextStatus.videoCount && nextStatus.videoCount > 0
        ? nextStatus.videoCount
        : currentStatus?.videoCount,
  };
}

function mapCreatorLiveStatusRowToLiveStatus(
  row: CreatorLiveStatusRow,
): LiveStatus {
  const rawPayload = row.raw_payload || {};

  return {
    ...rawPayload,
    platform: row.platform,
    username: row.platform_username ?? rawPayload.username,
    isLive: Boolean(row.is_live),
    title: row.title ?? rawPayload.title,
    viewerCount: Number(row.viewer_count ?? rawPayload.viewerCount ?? 0),
    gameName: row.game_name ?? rawPayload.gameName,
    startedAt: row.started_at ?? rawPayload.startedAt,
    thumbnail: row.thumbnail_url ?? rawPayload.thumbnail,
    url:
      row.live_url ??
      rawPayload.url ??
      getPlatformFallbackUrl(row.platform, row.platform_username ?? ""),
    followerCount: rawPayload.followerCount,
    subscriberCount: rawPayload.subscriberCount,
    viewCount: rawPayload.viewCount,
    videoCount: rawPayload.videoCount,
    externalCount: rawPayload.externalCount,
    memberCount: rawPayload.memberCount,
    onlineMemberCount: rawPayload.onlineMemberCount,
  };
}

type CreatorStats = {
  views: number;
  followers: number;
  shares: number;
};

type CreatorCollectionStats = {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  total: number;
  uniqueCollectors: number;
};

type CreatorBattleCandidate = {
  id: string;
  username: string;
  nickname: string;
  avatar_url: string | null;
  share_count: number | null;
  trending_score: number | null;
  creator_cards?: CreatorCardRow[] | CreatorCardRow | null;
};

type CreatorBattleStats = {
  views: number;
  followers: number;
  shares: number;
  globalReach: number;
  collectedCards: number;
  uniqueCollectors: number;
  highestRarity: CreatorRarity | null;
  isLive: boolean;
  liveViewers: number;
  level: number;
  powerScore: number;
};

type VisibleYoutubeChannel = {
  url: string;
  originalIndex: number;
  username: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  kick: "Kick",
  instagram: "Instagram",
  discord: "Discord",
  x: "X",
};

const SOCIAL_PLATFORM_OPTIONS = [
  { value: "twitch", label: "Twitch" },
  { value: "youtube", label: "YouTube" },
  { value: "kick", label: "Kick" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "discord", label: "Discord" },
  { value: "link", label: "Outro link" },
] as const;

const LIVE_PLATFORMS = ["twitch", "kick"] as const;
const TRUSTED_EXTERNAL_METRIC_PLATFORMS = new Set([
  "youtube",
  "twitch",
  "kick",
  "discord",
]);

const RARITY_SHOWCASE_CYCLE = [
  { rarity: "common" },
  { rarity: "rare" },
  { rarity: "epic" },
  { rarity: "legendary" },
] as const;

const RARITY_SHOWCASE_INTERVAL = 8500;

const EMPTY_COLLECTION_STATS: CreatorCollectionStats = {
  common: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
  total: 0,
  uniqueCollectors: 0,
};


function normalizeRarityValue(rarity: string | null | undefined): keyof Omit<CreatorCollectionStats, "total" | "uniqueCollectors"> {
  const normalizedRarity = String(rarity || "common").toLowerCase();

  if (normalizedRarity === "rare") return "rare";
  if (normalizedRarity === "epic") return "epic";
  if (normalizedRarity === "legendary" || normalizedRarity === "mythic") {
    return "legendary";
  }

  return "common";
}

function buildCreatorCollectionStats(
  rows: Array<{ rarity?: string | null; user_id?: string | null }> | null | undefined,
): CreatorCollectionStats {
  const nextStats: CreatorCollectionStats = { ...EMPTY_COLLECTION_STATS };
  const uniqueCollectorIds = new Set<string>();

  (rows || []).forEach((row) => {
    const rarity = normalizeRarityValue(row?.rarity);
    nextStats[rarity] += 1;
    nextStats.total += 1;

    if (row?.user_id) {
      uniqueCollectorIds.add(row.user_id);
    }
  });

  nextStats.uniqueCollectors = uniqueCollectorIds.size || nextStats.total;

  return nextStats;
}

function getHighestRarityFromStats(stats: CreatorCollectionStats): CreatorRarity | null {
  if (stats.legendary > 0) return "legendary";
  if (stats.epic > 0) return "epic";
  if (stats.rare > 0) return "rare";
  if (stats.common > 0) return "common";

  return null;
}

function getCreatorCardLevel(
  card: CreatorCardRow | null | undefined,
  profile: CreatorProfileRow | null | undefined,
) {
  return Number((profile as any)?.profile_level || card?.level || 1);
}

function getCreatorCardPower(card: CreatorCardRow | null | undefined) {
  return Number(card?.power_score || 0);
}

function normalizeCreatorTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags !== "string") return [];

  const trimmed = tags.trim();

  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag).trim()).filter(Boolean);
    }
  } catch {
    // Fallback below for comma-separated values.
  }

  return trimmed
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.replace(/"/g, "").trim())
    .filter(Boolean);
}

function getCreatorCard(
  profile: CreatorProfileRow | null,
): CreatorCardRow | null {
  if (!profile?.creator_cards) return null;

  if (Array.isArray(profile.creator_cards)) {
    return profile.creator_cards[0] || null;
  }

  return profile.creator_cards;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatProfileDate(value?: string | null) {
  if (!value) return "";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

function getPartnershipBrand(partnership: CreatorPartnershipRow) {
  if (Array.isArray(partnership.brands)) {
    return partnership.brands[0] || null;
  }

  return partnership.brands || null;
}

function getPartnershipDateValue(partnership: CreatorPartnershipRow) {
  return (
    partnership.start_date ||
    partnership.source_published_at ||
    partnership.end_date ||
    ""
  );
}

function getPartnershipTimestamp(partnership: CreatorPartnershipRow) {
  const dateValue = getPartnershipDateValue(partnership);
  const timestamp = dateValue ? new Date(dateValue).getTime() : 0;

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getPartnershipDisplayName(partnership: CreatorPartnershipRow) {
  return getPartnershipBrand(partnership)?.name || partnership.brand_name;
}

function getPartnershipLogo(partnership: CreatorPartnershipRow) {
  return getPartnershipBrand(partnership)?.logo_url || null;
}

function getPartnershipWebsite(partnership: CreatorPartnershipRow) {
  return (
    partnership.website_url ||
    getPartnershipBrand(partnership)?.website_url ||
    null
  );
}

function getPartnershipDescription(partnership: CreatorPartnershipRow) {
  return (
    partnership.public_description ||
    getPartnershipBrand(partnership)?.description ||
    ""
  );
}

function getPartnershipTypeLabel(type?: string | null) {
  const normalizedType = String(type || "").toLowerCase();

  const labels: Record<string, string> = {
    sponsorship: "Patrocínio",
    sponsor: "Patrocínio",
    ambassador: "Embaixador",
    ambassadorship: "Embaixador",
    campaign: "Campanha",
    event: "Evento",
    partnership: "Parceria",
    affiliate: "Afiliado",
  };

  return labels[normalizedType] || "Parceria";
}

function createBrandSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || `brand-${Date.now()}`;
}

function createEmptyManualPartnershipDraft(): ManualPartnershipDraft {
  return {
    brandName: "",
    partnershipType: "sponsorship",
    campaignName: "",
    websiteUrl: "",
    brandLogoUrl: "",
    brandWebsiteUrl: "",
    brandDescription: "",
    publicDescription: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  };
}

function getPlatformLabel(platform: string) {
  const normalizedPlatform = platform.toLowerCase();

  return PLATFORM_LABELS[normalizedPlatform] || platform;
}

function extractPlatformUsername(platform: string, url: string) {
  const normalizedPlatform = platform.toLowerCase();
  const normalizedUrl = url.trim();

  if (!normalizedUrl) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(normalizedUrl)
      ? normalizedUrl
      : `https://${normalizedUrl}`;

    const parsedUrl = new URL(withProtocol);
    const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (normalizedPlatform === "twitch" && !host.includes("twitch.tv")) {
      return "";
    }

    if (normalizedPlatform === "kick" && !host.includes("kick.com")) {
      return "";
    }

    if (
      normalizedPlatform === "youtube" &&
      !host.includes("youtube.com") &&
      !host.includes("youtu.be")
    ) {
      return "";
    }

    if (normalizedPlatform === "youtube") {
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      const handle = pathParts.find((part) => part.startsWith("@"));

      if (handle) {
        return handle.replace("@", "").trim();
      }

      return pathParts[0]?.replace("@", "").trim() || "";
    }

    if (normalizedPlatform === "discord") {
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

      if (host === "discord.gg") {
        return pathParts[0]?.trim() || "";
      }

      if (host.includes("discord.com") || host.includes("discordapp.com")) {
        const inviteIndex = pathParts.findIndex(
          (part) => part.toLowerCase() === "invite",
        );

        if (inviteIndex >= 0) {
          return pathParts[inviteIndex + 1]?.trim() || "";
        }

        return pathParts[0]?.trim() || "";
      }
    }

    const username = parsedUrl.pathname
      .split("/")
      .filter(Boolean)[0]
      ?.replace("@", "")
      .trim();

    return username || "";
  } catch {
    return normalizedUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/^twitch\.tv\//i, "")
      .replace(/^kick\.com\//i, "")
      .replace(/^youtube\.com\/@?/i, "")
      .replace(/^youtube\.com\//i, "")
      .replace(/^youtu\.be\//i, "")
      .split(/[/?#]/)[0]
      .replace("@", "")
      .trim();
  }
}

function getPlatformFallbackUrl(platform: string, username: string) {
  const normalizedPlatform = platform.toLowerCase();
  const cleanUsername = username.replace("@", "").trim();

  if (normalizedPlatform === "kick") {
    return `https://kick.com/${cleanUsername}`;
  }

  if (normalizedPlatform === "youtube") {
    return `https://www.youtube.com/${cleanUsername}`;
  }

  if (normalizedPlatform === "instagram") {
    return `https://www.instagram.com/${cleanUsername}`;
  }

  if (normalizedPlatform === "tiktok") {
    return `https://www.tiktok.com/@${cleanUsername}`;
  }

  if (normalizedPlatform === "discord") {
    return `https://discord.gg/${cleanUsername}`;
  }

  return `https://twitch.tv/${cleanUsername}`;
}

function getPlatformLiveStatus(liveStatus: LiveStatusMap, platform: string) {
  return liveStatus[platform.toLowerCase()];
}

function getNormalizedYoutubeChannels(
  channels: string[],
): VisibleYoutubeChannel[] {
  const seen = new Set<string>();

  return channels
    .map((rawUrl, originalIndex) => {
      const url = String(rawUrl || "").trim();
      const username = extractPlatformUsername("youtube", url);

      return {
        url,
        originalIndex,
        username,
      };
    })
    .filter((channel) => channel.url.length > 0 && channel.username.length > 0)
    .filter((channel) => {
      const key = `${channel.username.toLowerCase()}::${channel.url.toLowerCase()}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function getYoutubeChannelFallbackTitle(
  channel: VisibleYoutubeChannel,
  fallbackLabel: string,
) {
  const username = channel.username.replace(/^@/, "").trim();

  if (username.length > 0) {
    return username.startsWith("UC") ? fallbackLabel : `@${username}`;
  }

  return fallbackLabel;
}

function getLiveStatusExternalCount(status: LiveStatus | undefined) {
  return (
    status?.subscriberCount ??
    status?.followerCount ??
    status?.memberCount ??
    status?.externalCount ??
    0
  );
}

function getTrustedLiveStatusExternalCount(
  platform: string,
  status: LiveStatus | undefined,
) {
  const normalizedPlatform = platform.toLowerCase();

  if (!TRUSTED_EXTERNAL_METRIC_PLATFORMS.has(normalizedPlatform)) {
    return 0;
  }

  return getLiveStatusExternalCount(status);
}

function getYoutubeExternalReachFromLiveStatus(liveStatus: LiveStatusMap) {
  return Object.entries(liveStatus)
    .filter(([key]) => key.startsWith("youtube:"))
    .reduce(
      (total, [, status]) => total + getLiveStatusExternalCount(status),
      0,
    );
}

function getCreatorExternalReachFromLiveStatus(liveStatus: LiveStatusMap) {
  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const discordStatus = getPlatformLiveStatus(liveStatus, "discord");
  const youtubeSubscribers = getYoutubeExternalReachFromLiveStatus(liveStatus);

  const twitchFollowers = getTrustedLiveStatusExternalCount(
    "twitch",
    twitchStatus,
  );
  const kickFollowers = getTrustedLiveStatusExternalCount("kick", kickStatus);
  const discordMembers = getTrustedLiveStatusExternalCount(
    "discord",
    discordStatus,
  );

  return twitchFollowers + kickFollowers + discordMembers + youtubeSubscribers;
}

function getSocialUrl(socialLinks: SocialLink[], platform: string) {
  return (
    socialLinks.find((social) => social.platform.toLowerCase() === platform)
      ?.url || ""
  );
}

function normalizeCreatorStatus(
  status: string | null | undefined,
): CreatorStatus {
  const normalizedStatus = String(status || "offline").toLowerCase();

  if (
    normalizedStatus === "online" ||
    normalizedStatus === "offline" ||
    normalizedStatus === "live" ||
    normalizedStatus === "trending" ||
    normalizedStatus === "event"
  ) {
    return normalizedStatus;
  }

  return "offline";
}

function normalizeCreatorRarity(
  rarity: string | null | undefined,
): CreatorRarity {
  const normalizedRarity = String(rarity || "common").toLowerCase();

  if (
    normalizedRarity === "common" ||
    normalizedRarity === "rare" ||
    normalizedRarity === "epic" ||
    normalizedRarity === "legendary" ||
    normalizedRarity === "mythic"
  ) {
    return normalizedRarity;
  }

  return "common";
}

function normalizeCreatorRank(rank: string | null | undefined): CreatorRank {
  const normalizedRank = String(rank || "Bronze");

  if (
    normalizedRank === "Bronze" ||
    normalizedRank === "Silver" ||
    normalizedRank === "Gold" ||
    normalizedRank === "Platinum" ||
    normalizedRank === "Ascendant"
  ) {
    return normalizedRank;
  }

  return "Bronze";
}

function isLikelyImageUrl(url: string) {
  const normalizedUrl = url.split("?")[0]?.toLowerCase() || "";

  return /\.(apng|avif|gif|jpg|jpeg|png|svg|webp)$/.test(normalizedUrl);
}

function isLikelyDirectMediaUrl(url: string) {
  const normalizedUrl = url.split("?")[0]?.toLowerCase() || "";

  return /\.(m3u8|mp4|m4v|mov|webm|mkv|avi|ts|m4a|mp3|wav|ogg)$/.test(
    normalizedUrl,
  );
}

function getSafeClipUrl(clip: AutoClip, socialLinks: SocialLink[]) {
  const rawUrl = (clip.url || "").trim();

  if (rawUrl && !isLikelyImageUrl(rawUrl) && !isLikelyDirectMediaUrl(rawUrl)) {
    return rawUrl;
  }

  const platformUrl = getSocialUrl(
    socialLinks,
    String(clip.platform || "").toLowerCase() as SocialPlatform,
  );

  return platformUrl || "#";
}

function createProfileEditDraft(
  profile: CreatorProfileRow,
  socialLinks: SocialLink[],
): CreatorProfileEditDraft {
  return {
    nickname: profile.nickname || "",
    title: profile.title || "",
    category: profile.category || "",
    avatarUrl: profile.avatar_url || "",
    bannerUrl: profile.banner_url || "",
    popupAnimationStyle: profile.popup_animation_style || "none",
    bio: profile.bio || "",
    description: profile.description || "",
    tagsText: normalizeCreatorTags(profile.tags).join(", "),
    socialLinksText: socialLinks
      .map((social) => `${social.platform}: ${social.url}`)
      .join("\n"),
  };
}

function parseEditTags(tagsText: string) {
  return tagsText
    .split(/[,\n]/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function parseEditSocialLinks(socialLinksText: string): SocialLink[] {
  return socialLinksText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return {
          platform: "link",
          url: line,
        };
      }

      const platform = line.slice(0, separatorIndex).trim();
      const url = line.slice(separatorIndex + 1).trim();

      return {
        platform: platform || "link",
        url,
      };
    });
}

function getEditSocialLinkRows(socialLinksText: string): SocialLink[] {
  const parsedLinks = parseEditSocialLinks(socialLinksText);

  return parsedLinks.length > 0
    ? parsedLinks
    : [{ platform: "twitch", url: "" }];
}

function serializeEditSocialLinks(socialLinks: SocialLink[]) {
  return socialLinks
    .map((social) => {
      const platform = social.platform.trim() || "link";
      const url = social.url.trim();

      return `${platform}: ${url}`;
    })
    .join("\n");
}

function normalizeCreatorSocials(socialLinks: SocialLink[]) {
  const allowedPlatforms = new Set<SocialPlatform>([
    "twitch",
    "youtube",
    "tiktok",
    "kick",
    "instagram",
    "discord",
    "x",
  ]);

  return socialLinks
    .map((social) => ({
      platform: social.platform.toLowerCase(),
      url: social.url,
    }))
    .filter(
      (social): social is { platform: SocialPlatform; url: string } =>
        allowedPlatforms.has(social.platform as SocialPlatform) &&
        social.url.trim().length > 0,
    );
}

type NotificationType =
  | "card_unlocked"
  | "level_up"
  | "follow_creator"
  | "share_profile"
  | "generic";

async function createUserNotification({
  userId,
  type,
  title,
  message,
  metadata = {},
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("user_notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    metadata,
  });

  if (error) {
    console.error("Erro ao criar notificação:", error);
  }
}

async function getCurrentUserLevel(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar level atual:", error);
  }

  return data?.level || 1;
}

async function hasXpEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("user_xp_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .contains("metadata", metadata)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar evento de XP:", error);
    return false;
  }

  return Boolean(data);
}

async function addXpAndNotifyLevelUp({
  userId,
  eventType,
  metadata,
}: {
  userId: string;
  eventType: Parameters<typeof addUserXp>[0];
  metadata: Record<string, unknown>;
}) {
  const previousLevel = await getCurrentUserLevel(userId);
  const result = await addUserXp(eventType, metadata);

  if (result?.new_level && result.new_level > previousLevel) {
    await createUserNotification({
      userId,
      type: "level_up",
      title: `Você chegou ao nível ${result.new_level}!`,
      message: "Seu perfil evoluiu no Cardpoc.",
      metadata: {
        ...metadata,
        previous_level: previousLevel,
        new_level: result.new_level,
        new_xp: result.new_xp,
      },
    });
  }

  return result;
}

type SupportConversationStatus =
  | "open"
  | "waiting_admin"
  | "waiting_user"
  | "resolved"
  | "closed";
type SupportConversationType =
  | "bug"
  | "profile_correction"
  | "claim_profile"
  | "card_pack_problem"
  | "suggestion"
  | "other";

type SupportConversationRow = {
  id: string;
  user_id: string;
  creator_id: string | null;
  type: SupportConversationType;
  subject: string;
  status: SupportConversationStatus;
  priority: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

type SupportMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "user" | "admin" | "system";
  message: string;
  created_at: string;
  read_at: string | null;
};

const FINAL_SUPPORT_STATUSES: SupportConversationStatus[] = [
  "resolved",
  "closed",
];

function isSupportConversationFinal(status: SupportConversationStatus) {
  return FINAL_SUPPORT_STATUSES.includes(status);
}

const SUPPORT_CONVERSATION_TYPES: {
  id: SupportConversationType;
  labelKey: string;
  fallback: string;
}[] = [
  { id: "bug", labelKey: "supportTypeBug", fallback: "Reportar bug" },
  {
    id: "profile_correction",
    labelKey: "supportTypeProfileCorrection",
    fallback: "Corrigir perfil",
  },
  {
    id: "claim_profile",
    labelKey: "supportTypeClaimProfile",
    fallback: "Reivindicar perfil",
  },
  {
    id: "card_pack_problem",
    labelKey: "supportTypeCardPackProblem",
    fallback: "Problema com carta/pacote",
  },
  { id: "suggestion", labelKey: "supportTypeSuggestion", fallback: "Sugestão" },
  { id: "other", labelKey: "supportTypeOther", fallback: "Outro assunto" },
];

function getSupportStatusLabel(
  t: (key: any) => string,
  status: SupportConversationStatus,
) {
  const labels: Record<SupportConversationStatus, [string, string]> = {
    open: ["supportStatusOpen", "Aberto"],
    waiting_admin: ["supportStatusWaitingAdmin", "Aguardando equipe"],
    waiting_user: ["supportStatusWaitingUser", "Aguardando criador"],
    resolved: ["supportStatusResolved", "Resolvido"],
    closed: ["supportStatusClosed", "Encerrado"],
  };
  const [key, fallback] = labels[status] || labels.open;
  return translateExisting(t, key, fallback);
}

function getSupportTypeLabel(
  t: (key: any) => string,
  type: SupportConversationType,
) {
  const item = SUPPORT_CONVERSATION_TYPES.find((option) => option.id === type);
  return item
    ? translateExisting(t, item.labelKey, item.fallback)
    : translateExisting(t, "supportTypeOther", "Outro assunto");
}

type SupportChatModalProps = {
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
  creatorId: string;
  creatorName: string;
};

function SupportChatModal({
  open,
  onClose,
  currentUserId,
  creatorId,
  creatorName,
}: SupportChatModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<SupportConversationRow[]>(
    [],
  );
  const [messages, setMessages] = useState<SupportMessageRow[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] =
    useState<SupportConversationType>("profile_correction");
  const [subject, setSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) || null;

  async function loadConversations() {
    if (!currentUserId || !creatorId) return;
    setLoading(true);
    const { data } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", currentUserId)
      .eq("creator_id", creatorId)
      .order("last_message_at", { ascending: false });

    const rows = (data || []) as SupportConversationRow[];
    setConversations(rows);
    setSelectedConversationId((current) => current || rows[0]?.id || null);
    setCreating(rows.length === 0);
    setLoading(false);
  }

  async function loadMessages(conversationId: string | null) {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages((data || []) as SupportMessageRow[]);
  }

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open, currentUserId, creatorId]);

  useEffect(() => {
    if (open) {
      loadMessages(selectedConversationId);
    }
  }, [open, selectedConversationId]);

  async function handleCreateConversation() {
    if (!currentUserId || !creatorId || !newMessage.trim()) return;

    setSaving(true);
    const cleanSubject =
      subject.trim() ||
      `${getSupportTypeLabel(t, selectedType)} - ${creatorName}`;
    const { data: conversation, error } = await supabase
      .from("support_conversations")
      .insert({
        user_id: currentUserId,
        creator_id: creatorId,
        type: selectedType,
        subject: cleanSubject,
        status: "open",
        priority: "normal",
      })
      .select("*")
      .single();

    if (!error && conversation?.id) {
      await supabase.from("support_messages").insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        sender_role: "user",
        message: newMessage.trim(),
      });

      setSubject("");
      setNewMessage("");
      setCreating(false);
      setSelectedConversationId(conversation.id);
      await loadConversations();
      await loadMessages(conversation.id);
    }

    setSaving(false);
  }

  async function handleSendReply() {
    if (!currentUserId || !selectedConversation || !reply.trim()) return;
    if (isSupportConversationFinal(selectedConversation.status)) return;

    setSaving(true);
    await supabase.from("support_messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      sender_role: "user",
      message: reply.trim(),
    });
    setReply("");
    await loadConversations();
    await loadMessages(selectedConversation.id);
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label={translate(t, "close", "Fechar")}
      />

      <div className="relative grid h-[82vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#020617] text-white shadow-[0_0_90px_rgba(34,211,238,0.16)] lg:grid-cols-[310px_minmax(0,1fr)]">
        <div className="border-b border-white/10 bg-white/[0.035] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">
                {translateExisting(t, "supportCardpocTeam", "Equipe Cardpoc")}
              </p>
              <h3 className="mt-2 text-xl font-black">
                {translateExisting(t, "supportConversations", "Conversas")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/70 transition hover:bg-white/10"
            >
              {translate(t, "close", "Fechar")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setSelectedConversationId(null);
              setMessages([]);
            }}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/25"
          >
            <Plus className="h-4 w-4" />
            {translateExisting(t, "supportNewConversation", "Nova conversa")}
          </button>

          <div className="no-scrollbar mt-5 flex max-h-[56vh] flex-col gap-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                {translateExisting(
                  t,
                  "supportLoading",
                  "Carregando conversas...",
                )}
              </div>
            ) : null}

            {!loading && conversations.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/55">
                {translateExisting(
                  t,
                  "supportEmpty",
                  "Você ainda não abriu nenhuma conversa sobre este perfil.",
                )}
              </div>
            ) : null}

            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setCreating(false);
                  setSelectedConversationId(conversation.id);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedConversationId === conversation.id && !creating
                    ? "border-cyan-300/35 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-black text-white">
                    {conversation.subject}
                  </p>
                  <span className="shrink-0 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                    {getSupportStatusLabel(t, conversation.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold text-cyan-100/70">
                  {getSupportTypeLabel(t, conversation.type)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="border-b border-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/40">
              {creatorName}
            </p>
            <h4 className="mt-1 text-lg font-black">
              {creating
                ? translateExisting(
                    t,
                    "supportStartConversation",
                    "Abrir conversa",
                  )
                : selectedConversation?.subject ||
                  translateExisting(
                    t,
                    "supportSelectConversation",
                    "Selecione uma conversa",
                  )}
            </h4>
          </div>

          {creating ? (
            <div className="no-scrollbar flex-1 overflow-y-auto p-5">
              <div className="grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SUPPORT_CONVERSATION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                        selectedType === type.id
                          ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-50"
                          : "border-white/10 bg-white/[0.035] text-white/60 hover:bg-white/[0.06]"
                      }`}
                    >
                      {translateExisting(t, type.labelKey, type.fallback)}
                    </button>
                  ))}
                </div>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={translateExisting(
                    t,
                    "supportSubjectPlaceholder",
                    "Assunto da conversa",
                  )}
                  className="rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40"
                />

                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder={translateExisting(
                    t,
                    "supportMessagePlaceholder",
                    "Explique o que aconteceu ou o que precisa ser ajustado...",
                  )}
                  rows={7}
                  className="rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40"
                />

                <button
                  type="button"
                  onClick={handleCreateConversation}
                  disabled={saving || !newMessage.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {translateExisting(
                    t,
                    "supportSendToTeam",
                    "Enviar para a equipe",
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                    {translateExisting(
                      t,
                      "supportNoMessages",
                      "Nenhuma mensagem nesta conversa.",
                    )}
                  </div>
                ) : null}

                {messages.map((message) => {
                  const isUser = message.sender_role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[1.35rem] border px-4 py-3 ${
                          isUser
                            ? "border-cyan-300/25 bg-cyan-300/15 text-cyan-50"
                            : "border-white/10 bg-white/[0.055] text-white/75"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                          {isUser
                            ? translateExisting(t, "supportYou", "Você")
                            : translateExisting(
                                t,
                                "supportTeam",
                                "Equipe Cardpoc",
                              )}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/10 p-4">
                {selectedConversation &&
                isSupportConversationFinal(selectedConversation.status) ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
                    {translateExisting(
                      t,
                      "supportClosedConversation",
                      "Esta conversa foi finalizada pela equipe Cardpoc. Abra uma nova conversa se precisar continuar o assunto.",
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={translateExisting(
                        t,
                        "supportReplyPlaceholder",
                        "Escreva uma resposta...",
                      )}
                      rows={2}
                      className="min-h-[48px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40"
                    />
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={
                        saving || !reply.trim() || !selectedConversation
                      }
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/15 text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CreatorProfilePage({
  username,
  startInEditMode = false,
}: CreatorProfilePageProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const [profile, setProfile] = useState<CreatorProfileRow | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [clips, setClips] = useState<AutoClip[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [partnerships, setPartnerships] = useState<CreatorPartnershipRow[]>([]);
  const [manualPartnershipDraft, setManualPartnershipDraft] =
    useState<ManualPartnershipDraft>(() => createEmptyManualPartnershipDraft());
  const [manualPartnershipSaving, setManualPartnershipSaving] = useState(false);
  const [manualPartnershipError, setManualPartnershipError] = useState<
    string | null
  >(null);
  const [stats, setStats] = useState<CreatorStats>({
    views: 0,
    followers: 0,
    shares: 0,
  });
  const [collectionStats, setCollectionStats] =
    useState<CreatorCollectionStats>(EMPTY_COLLECTION_STATS);
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [liveStatusLoading, setLiveStatusLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editDraft, setEditDraft] = useState<CreatorProfileEditDraft | null>(
    null,
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [youtubeChannelsOpen, setYoutubeChannelsOpen] = useState(false);
  const [livePlatformsOpen, setLivePlatformsOpen] = useState(false);
  const [socialLinksOpen, setSocialLinksOpen] = useState(false);
  const [popupEffectDropdownOpen, setPopupEffectDropdownOpen] = useState(false);
  const [activeClipPlatform, setActiveClipPlatform] = useState<string>("");
  const socialLinksDropdownRef = useRef<HTMLDivElement | null>(null);
  const popupEffectDropdownRef = useRef<HTMLDivElement | null>(null);
  const [profileLinkCopied, setProfileLinkCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimPlatform, setClaimPlatform] = useState("youtube");
  const [claimUrl, setClaimUrl] = useState("");
  const [claimImageUsageConsent, setClaimImageUsageConsent] = useState(false);
  const [claimSending, setClaimSending] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [showcaseRarityIndex, setShowcaseRarityIndex] = useState(0);
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const [liveDropsOpen, setLiveDropsOpen] = useState(false);
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const creatorPanelDropdownRef = useRef<HTMLDivElement | null>(null);
  const [battleCandidates, setBattleCandidates] = useState<CreatorBattleCandidate[]>([]);
  const [selectedBattleCreatorId, setSelectedBattleCreatorId] = useState("");
  const [battleStats, setBattleStats] = useState<CreatorBattleStats | null>(null);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleModalOpen, setBattleModalOpen] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [revealedBattleRows, setRevealedBattleRows] = useState(0);
  const [battleSearchQuery, setBattleSearchQuery] = useState("");

  const decodedUsername = useMemo(() => {
    return decodeURIComponent(username || "")
      .replace("@", "")
      .trim();
  }, [username]);

  const creatorPublicPath = useMemo(() => {
    const targetUsername = profile?.username || decodedUsername || username;

    return `/creator/${encodeURIComponent(targetUsername)}`;
  }, [decodedUsername, profile?.username, username]);

  const claimCode = useMemo(() => {
    const source = profile?.id || decodedUsername || username || "cardpoc";

    return `CDP-${source
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 3)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }, [decodedUsername, profile?.id, username]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;

      setShowcaseRarityIndex(
        (current) => (current + 1) % RARITY_SHOWCASE_CYCLE.length,
      );
    }, RARITY_SHOWCASE_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!socialLinksOpen && !creatorPanelOpen && !popupEffectDropdownOpen) return;

    function handleOutsideInteraction(event: MouseEvent | TouchEvent) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (
        socialLinksOpen &&
        !socialLinksDropdownRef.current?.contains(target)
      ) {
        setSocialLinksOpen(false);
      }

      if (
        creatorPanelOpen &&
        !creatorPanelDropdownRef.current?.contains(target)
      ) {
        setCreatorPanelOpen(false);
      }

      if (
        popupEffectDropdownOpen &&
        !popupEffectDropdownRef.current?.contains(target)
      ) {
        setPopupEffectDropdownOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSocialLinksOpen(false);
        setCreatorPanelOpen(false);
        setPopupEffectDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [creatorPanelOpen, popupEffectDropdownOpen, socialLinksOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setCurrentUserId(null);
          setCurrentUserIsAdmin(false);
        }

        return;
      }

      const { data: accountProfile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setCurrentUserId(user.id);
        setCurrentUserIsAdmin(Boolean(accountProfile?.is_admin));
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCreatorProfile() {
      setLoading(true);

      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          user_id,
          username,
          nickname,
          title,
          category,
          status,
          avatar_url,
          banner_url,
          popup_animation_style,
          bio,
          description,
          tags,
          is_verified,
          created_at,
          trending_score,
          share_count,
          profile_level,
          profile_xp,
          creator_cards (
            rarity,
            rank,
            aura,
            evolution_stage,
            level,
            power_score
          )
        `,
        )
        .eq("is_public", true)
        .ilike("username", decodedUsername)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setProfile(null);
        setSocialLinks([]);
        setClips([]);
        setPartnerships([]);
        setLiveStatus({});
        setStats({
          views: 0,
          followers: 0,
          shares: 0,
        });
        setCollectionStats(EMPTY_COLLECTION_STATS);
        setLoading(false);
        return;
      }

      const typedProfile = data as CreatorProfileRow;

      setProfile(typedProfile);

      const [
        { data: socialData },
        { count: viewCount },
        { count: followerCount },
        { data: partnershipData },
        { data: collectionData },
      ] = await Promise.all([
        supabase
          .from("creator_social_links")
          .select("platform, url")
          .eq("creator_id", typedProfile.id)
          .order("platform", { ascending: true }),
        supabase
          .from("creator_views")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", typedProfile.id),
        supabase
          .from("creator_followers")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", typedProfile.id),
        supabase
          .from("creator_partnerships")
          .select(
            `
            id,
            creator_id,
            brand_id,
            brand_name,
            partnership_type,
            source_platform,
            source_url,
            source_title,
            source_thumbnail,
            source_channel,
            source_published_at,
            campaign_name,
            public_description,
            website_url,
            start_date,
            end_date,
            status,
            is_active,
            brands (
              id,
              name,
              slug,
              logo_url,
              website_url,
              description
            )
          `,
          )
          .eq("creator_id", typedProfile.id)
          .eq("is_active", true)
          .in("status", ["verified", "manual"]),
        supabase
          .from("user_cards")
          .select("rarity, user_id")
          .eq("creator_id", typedProfile.id),
      ]);

      if (cancelled) return;

      setSocialLinks((socialData || []) as SocialLink[]);
      setPartnerships(
        ((partnershipData || []) as CreatorPartnershipRow[]).sort(
          (partnershipA, partnershipB) =>
            getPartnershipTimestamp(partnershipB) -
            getPartnershipTimestamp(partnershipA),
        ),
      );
      setStats({
        views: viewCount || 0,
        followers: followerCount || 0,
        shares: typedProfile.share_count || 0,
      });
      setCollectionStats(
        buildCreatorCollectionStats(
          (collectionData || []) as Array<{ rarity?: string | null; user_id?: string | null }>,
        ),
      );
      setLoading(false);
    }

    if (decodedUsername) {
      loadCreatorProfile();
    } else {
      setProfile(null);
      setPartnerships([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [decodedUsername]);

  useEffect(() => {
    if (!profile) {
      setEditDraft(null);
      return;
    }

    setEditDraft(createProfileEditDraft(profile, socialLinks));
  }, [profile, socialLinks]);

  useEffect(() => {
    let cancelled = false;
    const currentCreatorId = profile?.id;

    async function loadFollowState() {
      if (!currentCreatorId || !currentUserId) {
        if (!cancelled) {
          setIsFollowing(false);
        }
        return;
      }

      const { data } = await supabase
        .from("creator_followers")
        .select("id")
        .eq("creator_id", currentCreatorId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (!cancelled) {
        setIsFollowing(Boolean(data));
      }
    }

    loadFollowState();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, currentUserId]);

  useEffect(() => {
    if (!profile) {
      setLiveStatus({});
      return;
    }

    const creatorId = profile.id;

    const youtubeChannels = socialLinks
      .filter((social) => social.platform.toLowerCase() === "youtube")
      .map((social) => social.url);

    const targets: Array<{
      platform: "twitch" | "kick" | "youtube" | "discord";
      username: string;
      index?: number;
    }> = [
      ...socialLinks
        .map((social) => {
          const platform = social.platform.toLowerCase();

          if (
            platform !== "twitch" &&
            platform !== "kick" &&
            platform !== "discord"
          ) {
            return null;
          }

          const platformUsername = extractPlatformUsername(
            platform,
            social.url,
          );

          return {
            platform,
            username: platformUsername,
          };
        })
        .filter(
          (
            target,
          ): target is {
            platform: "twitch" | "kick" | "discord";
            username: string;
          } => Boolean(target && target.username.length > 0),
        ),
      ...getNormalizedYoutubeChannels(youtubeChannels).map((channel) => ({
        platform: "youtube" as const,
        username: channel.username,
        index: channel.originalIndex,
      })),
    ];

    if (targets.length === 0) {
      setLiveStatus({});
      return;
    }

    let cancelled = false;

    function applyLiveStatusResults(
      results: Array<{
        platform: "twitch" | "kick" | "youtube" | "discord";
        index?: number;
        status: LiveStatus;
      }>,
    ) {
      setLiveStatus((currentLiveStatus) =>
        results.reduce<LiveStatusMap>(
          (accumulator, result) => {
            if (result.platform === "youtube") {
              accumulator[`youtube:${result.index ?? 0}`] =
                mergeLiveStatusPreservingMetrics(
                  accumulator[`youtube:${result.index ?? 0}`],
                  result.status,
                );

              const currentYoutube = accumulator.youtube;
              const currentSubscriberCount =
                currentYoutube?.subscriberCount ??
                currentYoutube?.externalCount ??
                0;
              const nextSubscriberCount =
                result.status.subscriberCount ??
                result.status.externalCount ??
                0;

              accumulator.youtube = mergeLiveStatusPreservingMetrics(
                currentYoutube,
                nextSubscriberCount >= currentSubscriberCount
                  ? result.status
                  : currentYoutube || result.status,
              );

              return accumulator;
            }

            accumulator[result.platform] = mergeLiveStatusPreservingMetrics(
              accumulator[result.platform],
              result.status,
            );
            return accumulator;
          },
          { ...currentLiveStatus },
        ),
      );
    }

    async function loadLiveStatuses() {
      setLiveStatusLoading(true);

      try {
        const results = await Promise.all(
          targets.map(async ({ platform, username: targetUsername, index }) => {
            try {
              const params = new URLSearchParams({
                platform,
                username: targetUsername,
                creatorId,
              });

              const response = await fetch(
                `/api/live-status?${params.toString()}`,
              );

              if (!response.ok) {
                throw new Error(`Unable to load ${platform} live status.`);
              }

              const data: LiveStatus = await response.json();

              return {
                platform,
                index,
                status: {
                  ...data,
                  url:
                    data.url ||
                    getPlatformFallbackUrl(platform, targetUsername),
                },
              };
            } catch {
              return {
                platform,
                index,
                status: {
                  platform,
                  username: targetUsername,
                  isLive: false,
                  url: getPlatformFallbackUrl(platform, targetUsername),
                },
              };
            }
          }),
        );

        if (!cancelled) {
          applyLiveStatusResults(results);
        }
      } finally {
        if (!cancelled) {
          setLiveStatusLoading(false);
        }
      }
    }

    async function loadCachedLiveStatuses() {
      const { data, error } = await supabase
        .from("creator_live_status")
        .select(
          "id, creator_id, platform, platform_username, is_live, title, viewer_count, game_name, started_at, thumbnail_url, live_url, raw_payload, last_checked_at, updated_at",
        )
        .eq("creator_id", creatorId)
        .in("platform", ["twitch", "kick"]);

      if (cancelled || error || !data) return;

      setLiveStatus((currentLiveStatus) => {
        const nextLiveStatus = { ...currentLiveStatus };

        (data as CreatorLiveStatusRow[]).forEach((row) => {
          nextLiveStatus[row.platform] = mergeLiveStatusPreservingMetrics(
            nextLiveStatus[row.platform],
            mapCreatorLiveStatusRowToLiveStatus(row),
          );
        });

        return nextLiveStatus;
      });
    }

    loadCachedLiveStatuses();
    loadLiveStatuses();

    function loadLiveStatusesWhenVisible() {
      if (document.visibilityState === "hidden") return;
      void loadLiveStatuses();
    }

    const pollingInterval = window.setInterval(loadLiveStatusesWhenVisible, 30000);
    document.addEventListener("visibilitychange", loadLiveStatusesWhenVisible);

    const liveStatusChannel = supabase
      .channel(`creator-live-status:${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_live_status",
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          if (cancelled) return;

          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as Partial<CreatorLiveStatusRow>;
            const deletedPlatform = oldRow.platform;

            if (!deletedPlatform) return;

            setLiveStatus((currentLiveStatus) => {
              const nextLiveStatus = { ...currentLiveStatus };
              delete nextLiveStatus[deletedPlatform];
              return nextLiveStatus;
            });

            return;
          }

          const row = payload.new as CreatorLiveStatusRow;

          if (row.platform !== "twitch" && row.platform !== "kick") return;

          setLiveStatus((currentLiveStatus) => ({
            ...currentLiveStatus,
            [row.platform]: mergeLiveStatusPreservingMetrics(
              currentLiveStatus[row.platform],
              mapCreatorLiveStatusRowToLiveStatus(row),
            ),
          }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(pollingInterval);
      document.removeEventListener("visibilitychange", loadLiveStatusesWhenVisible);
      void supabase.removeChannel(liveStatusChannel);
    };
  }, [profile, socialLinks]);

  useEffect(() => {
    if (!profile) {
      setClips([]);
      return;
    }

    const twitchUsername = extractPlatformUsername(
      "twitch",
      getSocialUrl(socialLinks, "twitch"),
    );
    const kickUsername = extractPlatformUsername(
      "kick",
      getSocialUrl(socialLinks, "kick"),
    );
    const youtubeUrls = socialLinks
      .filter((social) => social.platform.toLowerCase() === "youtube")
      .map((social) => social.url)
      .filter(Boolean);

    if (!twitchUsername && !kickUsername && youtubeUrls.length === 0) {
      setClips([]);
      return;
    }

    const params = new URLSearchParams();

    if (twitchUsername) {
      params.set("twitch", twitchUsername);
    }

    if (kickUsername) {
      params.set("kick", kickUsername);
    }

    youtubeUrls.forEach((url) => {
      params.append("youtube", url);
    });

    let cancelled = false;

    async function loadAutoClips() {
      setClipsLoading(true);

      try {
        const response = await fetch(`/api/creator-clips?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Unable to load creator clips.");
        }

        const data = await response.json();

        if (!cancelled) {
          setClips(Array.isArray(data?.clips) ? data.clips : []);
        }
      } catch {
        if (!cancelled) {
          setClips([]);
        }
      } finally {
        if (!cancelled) {
          setClipsLoading(false);
        }
      }
    }

    loadAutoClips();

    return () => {
      cancelled = true;
    };
  }, [profile, socialLinks]);

  const card = getCreatorCard(profile);
  const nickname =
    profile?.nickname ||
    decodedUsername ||
    translate(t, "creatorProfileFallbackName", "Criador Cardpoc");
  const title =
    profile?.title ||
    translate(t, "creatorProfileDefaultTitle", "Criador de conteúdo");
  const category =
    profile?.category ||
    translate(t, "creatorProfileDefaultCategory", "Criador");
  const bio =
    profile?.bio ||
    translate(
      t,
      "creatorProfileDefaultBio",
      "Perfil público de criador aprovado no Cardpoc.",
    );
  const description =
    profile?.description ||
    translate(
      t,
      "creatorProfileDefaultDescription",
      "Acompanhe cartas colecionáveis, presença digital, redes sociais e momentos em destaque deste criador no Cardpoc.",
    );
  const rarity = card?.rarity || "common";
  const tags = normalizeCreatorTags(profile?.tags);
  const visibleTags = tags;
  const externalReach = getCreatorExternalReachFromLiveStatus(liveStatus);
  const highestCollectedRarity = getHighestRarityFromStats(collectionStats);
  const cardLevel = getCreatorCardLevel(card, profile);
  const cardPowerScore = getCreatorCardPower(card);
  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");
  const discordStatus = getPlatformLiveStatus(liveStatus, "discord");
  const visibleYoutubeChannels = getNormalizedYoutubeChannels(
    socialLinks
      .filter((social) => social.platform.toLowerCase() === "youtube")
      .map((social) => social.url),
  );
  const youtubeExternalReach =
    getYoutubeExternalReachFromLiveStatus(liveStatus);
  const youtubeChannelItems = visibleYoutubeChannels.map((channel, index) => {
    const channelStatus = getPlatformLiveStatus(
      liveStatus,
      `youtube:${channel.originalIndex}`,
    );

    const fallbackTitle = getYoutubeChannelFallbackTitle(
      channel,
      `${translate(t, "creatorPopupYoutubeChannelFallback", "Canal")} ${index + 1}`,
    );

    return {
      url: channelStatus?.url || channel.url,
      title: channelStatus?.title || fallbackTitle,
      thumbnail: channelStatus?.thumbnail,
      subscriberCount:
        channelStatus?.subscriberCount ?? channelStatus?.externalCount ?? 0,
    };
  });
  const isLive = Boolean(twitchStatus?.isLive || kickStatus?.isLive);
  const currentCreatorBattleStats: CreatorBattleStats = {
    views: stats.views,
    followers: stats.followers,
    shares: stats.shares,
    globalReach: externalReach,
    collectedCards: collectionStats.total,
    uniqueCollectors: collectionStats.uniqueCollectors,
    highestRarity: highestCollectedRarity,
    isLive,
    liveViewers: Object.values(liveStatus).reduce(
      (total, status) => total + (status?.isLive ? Number(status.viewerCount || 0) : 0),
      0,
    ),
    level: cardLevel,
    powerScore: cardPowerScore,
  };
  const isOwner = Boolean(
    profile?.user_id && currentUserId === profile.user_id,
  );
  const canManageProfile = Boolean(isOwner || currentUserIsAdmin);
  const profileUrl = `/creator/${encodeURIComponent(
    profile?.username || decodedUsername,
  )}`;

  useEffect(() => {
    let cancelled = false;

    async function loadBattleCandidates() {
      if (!profile?.id) {
        setBattleCandidates([]);
        return;
      }

      const { data } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          username,
          nickname,
          avatar_url,
          share_count,
          trending_score,
          creator_cards (
            rarity,
            rank,
            aura,
            evolution_stage,
            level,
            power_score
          )
        `,
        )
        .eq("is_public", true)
        .neq("id", profile.id)
        .order("nickname", { ascending: true });

      if (!cancelled) {
        setBattleCandidates((data || []) as CreatorBattleCandidate[]);
      }
    }

    loadBattleCandidates();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadBattleStats() {
      const selectedCreator = battleCandidates.find(
        (candidate) => candidate.id === selectedBattleCreatorId,
      );

      if (!selectedCreator) {
        setBattleStats(null);
        return;
      }

      setBattleLoading(true);

      const [
        { count: viewCount },
        { count: followerCount },
        { data: collectionRows },
        { data: liveRows },
      ] = await Promise.all([
        supabase
          .from("creator_views")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", selectedCreator.id),
        supabase
          .from("creator_followers")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", selectedCreator.id),
        supabase
          .from("user_cards")
          .select("rarity, user_id")
          .eq("creator_id", selectedCreator.id),
        supabase
          .from("creator_live_status")
          .select("id, creator_id, platform, platform_username, is_live, title, viewer_count, game_name, started_at, thumbnail_url, live_url, raw_payload, last_checked_at, updated_at")
          .eq("creator_id", selectedCreator.id),
      ]);

      if (cancelled) return;

      const selectedCollectionStats = buildCreatorCollectionStats(
        (collectionRows || []) as Array<{ rarity?: string | null; user_id?: string | null }>,
      );
      const selectedLiveStatus = ((liveRows || []) as CreatorLiveStatusRow[]).reduce<LiveStatusMap>(
        (accumulator, row) => {
          accumulator[row.platform] = mapCreatorLiveStatusRowToLiveStatus(row);
          return accumulator;
        },
        {},
      );
      const selectedCard = Array.isArray(selectedCreator.creator_cards)
        ? selectedCreator.creator_cards[0] || null
        : selectedCreator.creator_cards || null;

      setBattleStats({
        views: viewCount || 0,
        followers: followerCount || 0,
        shares: Number(selectedCreator.share_count || 0),
        globalReach: getCreatorExternalReachFromLiveStatus(selectedLiveStatus),
        collectedCards: selectedCollectionStats.total,
        uniqueCollectors: selectedCollectionStats.uniqueCollectors,
        highestRarity: getHighestRarityFromStats(selectedCollectionStats),
        isLive: Object.values(selectedLiveStatus).some((status) => Boolean(status?.isLive)),
        liveViewers: Object.values(selectedLiveStatus).reduce(
          (total, status) => total + (status?.isLive ? Number(status.viewerCount || 0) : 0),
          0,
        ),
        level: getCreatorCardLevel(selectedCard, profile),
        powerScore: getCreatorCardPower(selectedCard),
      });
      setBattleLoading(false);
    }

    loadBattleStats().finally(() => {
      if (!cancelled) {
        setBattleLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [battleCandidates, selectedBattleCreatorId]);

  const selectedBattleCreator = battleCandidates.find(
    (candidate) => candidate.id === selectedBattleCreatorId,
  );

  const filteredBattleCandidates = battleCandidates.filter((candidate) => {
    const query = battleSearchQuery.trim().toLowerCase();
    if (!query) return true;

    return `${candidate.nickname || ""} ${candidate.username || ""}`
      .toLowerCase()
      .includes(query);
  });

  const openBattleModal = () => {
    setBattleStarted(false);
    setRevealedBattleRows(0);
    setBattleModalOpen(true);
  };

  const closeBattleModal = () => {
    setBattleModalOpen(false);
    setBattleStarted(false);
    setRevealedBattleRows(0);
  };

  const startBattleAnimation = () => {
    if (!selectedBattleCreator || !battleStats || battleLoading) return;

    setRevealedBattleRows(0);
    setBattleStarted(true);
  };

  const battleRows = battleStats
    ? [
        {
          key: "followers",
          label: translate(t, "creatorProfileBattleFollowers", "Seguidores Cardpoc"),
          current: currentCreatorBattleStats.followers,
          opponent: battleStats.followers,
        },
        {
          key: "views",
          label: translate(t, "creatorProfileBattleViews", "Visualizações"),
          current: currentCreatorBattleStats.views,
          opponent: battleStats.views,
        },
        {
          key: "globalReach",
          label: translate(t, "creatorProfileBattleGlobalReach", "Alcance global"),
          current: currentCreatorBattleStats.globalReach,
          opponent: battleStats.globalReach,
        },
        {
          key: "collectedCards",
          label: translate(t, "creatorProfileBattleCards", "Cartas coletadas"),
          current: currentCreatorBattleStats.collectedCards,
          opponent: battleStats.collectedCards,
        },
        {
          key: "shares",
          label: translate(t, "creatorProfileBattleShares", "Compartilhamentos"),
          current: currentCreatorBattleStats.shares,
          opponent: battleStats.shares,
        },
        {
          key: "level",
          label: translate(t, "creatorProfileBattleLevel", "Nível da carta"),
          current: currentCreatorBattleStats.level,
          opponent: battleStats.level,
        },
      ]
    : [];

  useEffect(() => {
    if (!battleModalOpen || !battleStarted || battleRows.length === 0) return;

    setRevealedBattleRows(0);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;

      setRevealedBattleRows((current) => {
        if (current >= battleRows.length) {
          window.clearInterval(interval);
          return current;
        }

        return current + 1;
      });
    }, 620);

    return () => window.clearInterval(interval);
  }, [battleModalOpen, battleStarted, battleRows.length]);

  const visibleBattleRows = battleStarted
    ? battleRows.slice(0, revealedBattleRows)
    : [];
  const battleAnimationComplete =
    battleStarted && battleRows.length > 0 && revealedBattleRows >= battleRows.length;
  const visibleBattleScore = visibleBattleRows.reduce(
    (score, row) => {
      if (row.current > row.opponent) return { ...score, current: score.current + 1 };
      if (row.opponent > row.current) return { ...score, opponent: score.opponent + 1 };
      return { ...score, draws: score.draws + 1 };
    },
    { current: 0, opponent: 0, draws: 0 },
  );
  const battleScore = battleRows.reduce(
    (score, row) => {
      if (row.current > row.opponent) return { ...score, current: score.current + 1 };
      if (row.opponent > row.current) return { ...score, opponent: score.opponent + 1 };
      return { ...score, draws: score.draws + 1 };
    },
    { current: 0, opponent: 0, draws: 0 },
  );
  const battleFinalWinner =
    battleScore.current > battleScore.opponent
      ? "current"
      : battleScore.opponent > battleScore.current
        ? "opponent"
        : "draw";

  const groupedClips = clips.reduce<Record<string, AutoClip[]>>(
    (accumulator, clip) => {
      const platform = String(clip.platform || "outros").toLowerCase();

      if (!accumulator[platform]) {
        accumulator[platform] = [];
      }

      accumulator[platform].push(clip);
      return accumulator;
    },
    {},
  );

  const clipPlatformSections = (
    Object.entries(groupedClips) as Array<[string, AutoClip[]]>
  ).sort(([platformA], [platformB]) => {
    const order = ["youtube", "twitch", "kick", "tiktok", "instagram"];
    const indexA = order.indexOf(platformA);
    const indexB = order.indexOf(platformB);

    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });

  const clipPlatformKey = clipPlatformSections
    .map(([platform]) => platform)
    .join("|");
  const selectedClipPlatform =
    activeClipPlatform && groupedClips[activeClipPlatform]
      ? activeClipPlatform
      : clipPlatformSections[0]?.[0] || "";
  const selectedPlatformClips = selectedClipPlatform
    ? groupedClips[selectedClipPlatform] || []
    : [];

  useEffect(() => {
    if (!clipPlatformSections.length) {
      if (activeClipPlatform) setActiveClipPlatform("");
      return;
    }

    if (!activeClipPlatform || !groupedClips[activeClipPlatform]) {
      setActiveClipPlatform(clipPlatformSections[0][0]);
    }
  }, [activeClipPlatform, clipPlatformKey]);

  const visiblePartnerships = partnerships
    .filter((partnership) =>
      Boolean(
        partnership.is_active !== false &&
        ["verified", "manual"].includes(String(partnership.status || "")),
      ),
    )
    .sort(
      (partnershipA, partnershipB) =>
        getPartnershipTimestamp(partnershipB) -
        getPartnershipTimestamp(partnershipA),
    )
    .slice(0, 12);

  const partnershipHistoryCount = partnerships.filter((partnership) =>
    Boolean(
      partnership.is_active !== false &&
      ["verified", "manual"].includes(String(partnership.status || "")),
    ),
  ).length;

  async function refreshCreatorProfile() {
    if (!decodedUsername) return;

    const { data, error } = await supabase
      .from("creator_profiles")
      .select(
        `
        id,
        user_id,
        username,
        nickname,
        title,
        category,
        status,
        avatar_url,
        banner_url,
        popup_animation_style,
        bio,
        description,
        tags,
        is_verified,
        created_at,
        trending_score,
        share_count,
        creator_cards (
          rarity,
          rank,
          aura,
          evolution_stage,
          level,
          power_score
        )
      `,
      )
      .eq("is_public", true)
      .ilike("username", decodedUsername)
      .maybeSingle();

    if (error || !data) return;

    const typedProfile = data as CreatorProfileRow;
    setProfile(typedProfile);

    const [
      { data: socialData },
      { count: viewCount },
      { count: followerCount },
      { data: partnershipData },
    ] = await Promise.all([
      supabase
        .from("creator_social_links")
        .select("platform, url")
        .eq("creator_id", typedProfile.id)
        .order("platform", { ascending: true }),
      supabase
        .from("creator_views")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", typedProfile.id),
      supabase
        .from("creator_followers")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", typedProfile.id),
      supabase
        .from("creator_partnerships")
        .select(
          `
          id,
          creator_id,
          brand_id,
          brand_name,
          partnership_type,
          source_platform,
          source_url,
          source_title,
          source_thumbnail,
          source_channel,
          source_published_at,
          campaign_name,
          public_description,
          website_url,
          start_date,
          end_date,
          status,
          is_active,
          brands (
            id,
            name,
            slug,
            logo_url,
            website_url,
            description
          )
        `,
        )
        .eq("creator_id", typedProfile.id)
        .eq("is_active", true)
        .in("status", ["verified", "manual"]),
    ]);

    setSocialLinks((socialData || []) as SocialLink[]);
    setPartnerships(
      ((partnershipData || []) as CreatorPartnershipRow[]).sort(
        (partnershipA, partnershipB) =>
          getPartnershipTimestamp(partnershipB) -
          getPartnershipTimestamp(partnershipA),
      ),
    );
    setStats({
      views: viewCount || 0,
      followers: followerCount || 0,
      shares: typedProfile.share_count || 0,
    });
  }

  function handleEditDraftChange(
    field: keyof CreatorProfileEditDraft,
    value: string,
  ) {
    setEditDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
    setProfileSaveError(null);
  }

  function handleEditSocialLinkChange(
    index: number,
    field: keyof SocialLink,
    value: string,
  ) {
    setEditDraft((current) => {
      if (!current) return current;

      const rows = getEditSocialLinkRows(current.socialLinksText);
      const nextRows = rows.map((social, socialIndex) =>
        socialIndex === index
          ? {
              ...social,
              [field]: value,
            }
          : social,
      );

      return {
        ...current,
        socialLinksText: serializeEditSocialLinks(nextRows),
      };
    });
    setProfileSaveError(null);
  }

  function handleAddEditSocialLink() {
    setEditDraft((current) => {
      if (!current) return current;

      const rows = getEditSocialLinkRows(current.socialLinksText);

      return {
        ...current,
        socialLinksText: serializeEditSocialLinks([
          ...rows,
          { platform: "youtube", url: "" },
        ]),
      };
    });
    setProfileSaveError(null);
  }

  function handleRemoveEditSocialLink(index: number) {
    setEditDraft((current) => {
      if (!current) return current;

      const rows = getEditSocialLinkRows(current.socialLinksText);
      const nextRows = rows.filter((_, socialIndex) => socialIndex !== index);

      return {
        ...current,
        socialLinksText: serializeEditSocialLinks(nextRows),
      };
    });
    setProfileSaveError(null);
  }

  function handleCancelEditMode() {
    if (profile) {
      setEditDraft(createProfileEditDraft(profile, socialLinks));
    }

    setProfileSaveError(null);
    setIsEditing(false);

    if (startInEditMode) {
      router.replace(creatorPublicPath);
    }
  }

  function handleManualPartnershipDraftChange(
    field: keyof ManualPartnershipDraft,
    value: string,
  ) {
    setManualPartnershipDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setManualPartnershipError(null);
  }

  async function handleAddManualPartnership() {
    if (!profile || !currentUserId || !canManageProfile) return;

    const brandName = manualPartnershipDraft.brandName.trim();

    if (!brandName) {
      setManualPartnershipError(
        translate(
          t,
          "creatorProfileManualPartnershipRequired",
          "Informe o nome da marca para adicionar a parceria.",
        ),
      );
      return;
    }

    setManualPartnershipSaving(true);
    setManualPartnershipError(null);

    const brandLogoUrl = manualPartnershipDraft.brandLogoUrl.trim();
    const brandWebsiteUrl = manualPartnershipDraft.brandWebsiteUrl.trim();
    const brandDescription = manualPartnershipDraft.brandDescription.trim();
    const partnershipUrl = manualPartnershipDraft.websiteUrl.trim();

    const { data: matchingBrand } = await supabase
      .from("brands")
      .select("id, name, logo_url, website_url, description")
      .ilike("name", brandName)
      .maybeSingle();

    let brandId = matchingBrand?.id || null;

    if (matchingBrand?.id) {
      const brandUpdates: Record<string, string> = {};

      if (brandLogoUrl && brandLogoUrl !== (matchingBrand.logo_url || "")) {
        brandUpdates.logo_url = brandLogoUrl;
      }

      if (
        brandWebsiteUrl &&
        brandWebsiteUrl !== (matchingBrand.website_url || "")
      ) {
        brandUpdates.website_url = brandWebsiteUrl;
      }

      if (
        brandDescription &&
        brandDescription !== (matchingBrand.description || "")
      ) {
        brandUpdates.description = brandDescription;
      }

      if (Object.keys(brandUpdates).length > 0) {
        await supabase
          .from("brands")
          .update(brandUpdates)
          .eq("id", matchingBrand.id);
      }
    } else if (brandLogoUrl || brandWebsiteUrl || brandDescription) {
      const { data: createdBrand } = await supabase
        .from("brands")
        .insert({
          name: brandName,
          slug: createBrandSlug(brandName),
          logo_url: brandLogoUrl || null,
          website_url: brandWebsiteUrl || null,
          description: brandDescription || null,
        })
        .select("id")
        .maybeSingle();

      brandId = createdBrand?.id || null;
    }

    const { error } = await supabase.from("creator_partnerships").insert({
      creator_id: profile.id,
      brand_id: brandId,
      brand_name: brandName,
      partnership_type: manualPartnershipDraft.partnershipType || "sponsorship",
      source_platform: "manual",
      source_url: partnershipUrl || brandWebsiteUrl || null,
      website_url: partnershipUrl || brandWebsiteUrl || null,
      campaign_name: manualPartnershipDraft.campaignName.trim() || null,
      public_description:
        manualPartnershipDraft.publicDescription.trim() || null,
      start_date: manualPartnershipDraft.startDate || null,
      end_date: manualPartnershipDraft.endDate || null,
      confidence_score: 100,
      detection_reason: "manual_creator_submission",
      status: "manual",
      is_active: true,
      created_by: currentUserId,
    });

    if (error) {
      setManualPartnershipSaving(false);
      setManualPartnershipError(error.message);
      return;
    }

    setManualPartnershipDraft(createEmptyManualPartnershipDraft());
    setManualPartnershipSaving(false);
    await refreshCreatorProfile();
  }

  async function handleSaveProfileEdit() {
    if (!profile || !editDraft || !canManageProfile) return;

    setIsSavingProfile(true);
    setProfileSaveError(null);

    const nextTags = parseEditTags(editDraft.tagsText);
    const nextSocialLinks = parseEditSocialLinks(editDraft.socialLinksText);

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        nickname: editDraft.nickname.trim() || profile.nickname,
        title: editDraft.title.trim() || null,
        category: editDraft.category.trim() || null,
        avatar_url: editDraft.avatarUrl.trim() || null,
        banner_url: editDraft.bannerUrl.trim() || null,
        popup_animation_style: editDraft.popupAnimationStyle || "none",
        bio: editDraft.bio.trim() || null,
        description: editDraft.description.trim() || null,
        tags: nextTags,
      })
      .eq("id", profile.id);

    if (error) {
      setIsSavingProfile(false);
      setProfileSaveError(error.message);
      return;
    }

    const { error: deleteSocialLinksError } = await supabase
      .from("creator_social_links")
      .delete()
      .eq("creator_id", profile.id);

    if (deleteSocialLinksError) {
      setIsSavingProfile(false);
      setProfileSaveError(deleteSocialLinksError.message);
      return;
    }

    if (nextSocialLinks.length > 0) {
      const { error: insertSocialLinksError } = await supabase
        .from("creator_social_links")
        .insert(
          nextSocialLinks.map((social) => ({
            creator_id: profile.id,
            platform: social.platform,
            url: social.url,
          })),
        );

      if (insertSocialLinksError) {
        setIsSavingProfile(false);
        setProfileSaveError(insertSocialLinksError.message);
        return;
      }
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            nickname: editDraft.nickname.trim() || current.nickname,
            title: editDraft.title.trim() || null,
            category: editDraft.category.trim() || null,
            avatar_url: editDraft.avatarUrl.trim() || null,
            banner_url: editDraft.bannerUrl.trim() || null,
            popup_animation_style: editDraft.popupAnimationStyle || "none",
            bio: editDraft.bio.trim() || null,
            description: editDraft.description.trim() || null,
            tags: nextTags,
          }
        : current,
    );
    setSocialLinks(nextSocialLinks);
    setIsSavingProfile(false);
    setIsEditing(false);

    await refreshCreatorProfile();

    if (startInEditMode) {
      router.replace(creatorPublicPath);
    }
  }

  function handleOpenClaimModal() {
    if (!currentUserId) {
      alert(
        translate(
          t,
          "creatorPopupLoginToClaim",
          "Faça login para reivindicar este perfil.",
        ),
      );
      return;
    }

    setClaimPlatform("youtube");
    setClaimUrl("");
    setClaimImageUsageConsent(false);
    setClaimSending(false);
    setClaimSuccess(false);
    setClaimModalOpen(true);
  }

  async function handleClaimProfile() {
    if (!profile || !currentUserId) {
      alert(
        translate(
          t,
          "creatorPopupLoginToClaim",
          "Faça login para reivindicar este perfil.",
        ),
      );
      return;
    }

    if (!claimUrl.trim()) {
      alert(
        translate(
          t,
          "creatorPopupClaimUrlRequired",
          "Informe o link do canal ou perfil usado para verificação.",
        ),
      );
      return;
    }

    if (!claimImageUsageConsent) {
      alert(
        translate(
          t,
          "creatorImageConsentRequired",
          "Para enviar a solicitação, você precisa autorizar o uso da sua imagem para criação das cartas personalizadas.",
        ),
      );
      return;
    }

    const consentAcceptedAt = new Date().toISOString();

    setClaimSending(true);

    const { error } = await supabase.from("creator_claims").insert({
      creator_id: profile.id,
      user_id: currentUserId,
      verification_platform: claimPlatform,
      verification_url: claimUrl.trim(),
      verification_code: claimCode,
      image_usage_consent: true,
      image_usage_consent_at: consentAcceptedAt,
      image_usage_consent_version: "v1.0",
      image_usage_consent_source: "claim_request",
      image_usage_consent_text:
        "Autorizo o Cardpoc a utilizar minha imagem, nome artístico, identidade pública e conteúdos enviados ou vinculados por mim para criar cartas digitais personalizadas dentro da plataforma.",
      status: "pending",
    });

    setClaimSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setClaimSuccess(true);
  }

  async function handleFollow() {
    if (!profile) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(
        translate(
          t,
          "creatorPopupLoginToFollow",
          "Faça login para seguir este creator.",
        ),
      );
      return;
    }

    setFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("creator_followers")
          .delete()
          .eq("creator_id", profile.id)
          .eq("user_id", user.id);

        if (error) {
          alert(error.message);
          return;
        }

        setIsFollowing(false);
        setStats((current) => ({
          ...current,
          followers: Math.max(0, current.followers - 1),
        }));
        return;
      }

      const { error } = await supabase.from("creator_followers").insert({
        creator_id: profile.id,
        user_id: user.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setIsFollowing(true);
      setStats((current) => ({
        ...current,
        followers: current.followers + 1,
      }));

      const metadata = {
        creator_id: profile.id,
        creator_username: profile.username,
        creator_nickname: nickname,
      };

      const followAlreadyRewarded = await hasXpEvent(
        user.id,
        "follow_creator",
        { creator_id: profile.id },
      );

      if (!followAlreadyRewarded) {
        await addXpAndNotifyLevelUp({
          userId: user.id,
          eventType: "follow_creator",
          metadata,
        });

        await createUserNotification({
          userId: user.id,
          type: "follow_creator",
          title: `${translate(
            t,
            "creatorPopupFollowNotificationPrefix",
            "Você seguiu",
          )} ${nickname}`,
          message: translate(
            t,
            "creatorPopupFollowXpMessage",
            "Você ganhou XP por seguir um creator.",
          ),
          metadata,
        });
      }

      await updateMissionProgress("follow_creator", 1, metadata);

      const { data: existingCard } = await supabase
        .from("user_cards")
        .select("id")
        .eq("creator_id", profile.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingCard) {
        const { data: newCard, error: cardError } = await supabase
          .from("user_cards")
          .insert({
            creator_id: profile.id,
            user_id: user.id,
            rarity: "common",
            source: "follow",
          })
          .select("id, rarity, source, obtained_at")
          .single();

        if (cardError) {
          console.error("Erro ao criar carta do usuário:", cardError);
        } else {
          await addXpAndNotifyLevelUp({
            userId: user.id,
            eventType: "collect_common_card",
            metadata: {
              creator_id: profile.id,
              creator_username: profile.username,
              creator_nickname: nickname,
              card_id: newCard?.id,
              rarity: newCard?.rarity,
              source: newCard?.source,
            },
          });

          await createUserNotification({
            userId: user.id,
            type: "card_unlocked",
            title: `${translate(
              t,
              "creatorPopupCardUnlockedNotificationTitle",
              "Carta desbloqueada:",
            )} ${nickname}`,
            message: translate(
              t,
              "creatorPopupCardUnlockedByFollow",
              "Você ganhou uma carta comum por seguir este creator.",
            ),
            metadata: {
              creator_id: profile.id,
              creator_username: profile.username,
              creator_nickname: nickname,
              card_id: newCard?.id,
              rarity: newCard?.rarity,
              source: newCard?.source,
            },
          });

          await updateMissionProgress("collect_card", 1, {
            creator_id: profile.id,
            creator_username: profile.username,
            creator_nickname: nickname,
            rarity: newCard?.rarity,
            source: newCard?.source,
          });
        }
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function copyProfileLink() {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://www.cardpoc.com";
    const fullProfileUrl = `${baseUrl}${profileUrl}`;

    try {
      await navigator.clipboard.writeText(fullProfileUrl);
      setProfileLinkCopied(true);
      window.setTimeout(() => setProfileLinkCopied(false), 1800);
    } catch {
      window.open(profileUrl, "_blank", "noopener,noreferrer");
    }
  }

  const socialDropdownItems = [
    ...socialLinks.filter(
      (social) => social.platform.toLowerCase() !== "youtube",
    ),
    ...(visibleYoutubeChannels.length > 0
      ? [
          {
            platform: "youtube",
            url: visibleYoutubeChannels[0].url,
          },
        ]
      : []),
  ].filter((social) => social.url.trim().length > 0);

  const twitchProfileUrl = getSocialUrl(socialLinks, "twitch");
  const kickProfileUrl = getSocialUrl(socialLinks, "kick");

  const livePlatformItems = [
    {
      key: "twitch" as const,
      label: "Twitch",
      status: twitchStatus,
      fallbackUrl: twitchProfileUrl,
    },
    {
      key: "kick" as const,
      label: "Kick",
      status: kickStatus,
      fallbackUrl: kickProfileUrl,
    },
  ].filter((item) => item.status?.isLive);

  const liveDropsPlatform =
    livePlatformItems[0] ||
    (twitchProfileUrl.trim().length > 0
      ? {
          key: "twitch" as const,
          label: "Twitch",
          status: twitchStatus,
          fallbackUrl: twitchProfileUrl,
        }
      : {
          key: "kick" as const,
          label: "Kick",
          status: kickStatus,
          fallbackUrl: kickProfileUrl,
        });

  const heroLiveStatus = livePlatformItems[0]?.status || null;

  const creatorForPopup: Creator | null = profile
    ? {
        id: profile.id,
        ownerId: profile.user_id || undefined,
        username: profile.username,
        nickname,
        title,
        faction: "",
        category,
        mainPlatform: "youtube",
        status: normalizeCreatorStatus(profile.status),
        avatarUrl: profile.avatar_url || "",
        bannerUrl: profile.banner_url || "",
        popupAnimationStyle: profile.popup_animation_style || "none",
        bio,
        description,
        tags,
        rank: normalizeCreatorRank(card?.rank),
        rarity: normalizeCreatorRarity(rarity),
        aura: card?.aura || "Origin Aura",
        evolutionStage: card?.evolution_stage || "Stage 1 — Rising Creator",
        powerScore: card?.power_score || 0,
        collectedBy: 0,
        level: (profile as any)?.profile_level || card?.level || 1,
        followers: stats.followers,
        likes: 0,
        views: stats.views,
        socials: normalizeCreatorSocials(socialLinks),
        traits: [],
        featuredMoment: {
          title: "",
          description: "",
        },
        achievements: [],
      }
    : null;

  const showcaseRarity =
    RARITY_SHOWCASE_CYCLE[showcaseRarityIndex]?.rarity || rarity;
  const creatorForCard: Creator | null = creatorForPopup
    ? {
        ...creatorForPopup,
        rarity: normalizeCreatorRarity(showcaseRarity),
      }
    : null;

  const selectedBattleCard = selectedBattleCreator
    ? Array.isArray(selectedBattleCreator.creator_cards)
      ? selectedBattleCreator.creator_cards[0] || null
      : selectedBattleCreator.creator_cards || null
    : null;

  const selectedBattleCreatorForCard: Creator | null = selectedBattleCreator
    ? {
        id: selectedBattleCreator.id,
        username: selectedBattleCreator.username,
        nickname: selectedBattleCreator.nickname,
        title: translate(t, "creatorProfileBattleOpponent", "Oponente"),
        faction: "",
        category: translate(t, "creatorProfileDefaultCategory", "Criador"),
        mainPlatform: "youtube",
        status: "offline" as CreatorStatus,
        avatarUrl: selectedBattleCreator.avatar_url || "",
        bannerUrl: selectedBattleCreator.avatar_url || "",
        popupAnimationStyle: "none",
        bio: "",
        description: "",
        tags: [],
        rank: normalizeCreatorRank(selectedBattleCard?.rank),
        rarity: normalizeCreatorRarity(selectedBattleCard?.rarity || "common"),
        aura: selectedBattleCard?.aura || "Origin Aura",
        evolutionStage: selectedBattleCard?.evolution_stage || "Stage 1 — Rising Creator",
        powerScore: selectedBattleCard?.power_score || 0,
        collectedBy: battleStats?.uniqueCollectors || 0,
        level: selectedBattleCard?.level || battleStats?.level || 1,
        followers: battleStats?.followers || 0,
        likes: 0,
        views: battleStats?.views || 0,
        socials: [],
        traits: [],
        featuredMoment: {
          title: "",
          description: "",
        },
        achievements: [],
      }
    : null;

  const isProfileClaimable = !profile?.user_id;

  if (loading) {
    return null;
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
            <Sparkles className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight md:text-5xl">
            {translate(
              t,
              "creatorProfileNotFoundTitle",
              "Criador não encontrado",
            )}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 md:text-base">
            {translate(
              t,
              "creatorProfileNotFoundDescription",
              "Este perfil ainda não está público ou não existe no Cardpoc.",
            )}
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <ArrowLeft className="h-4 w-4" />
            {translate(t, "creatorProfileBackHome", "Voltar para o Cardpoc")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <GlowBackground />
      <ParticleBackground />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      <div className="pointer-events-none absolute left-1/2 top-28 z-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-24 right-10 z-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8">
        <div className="flex min-h-[40px] flex-wrap items-center justify-end gap-3">
          {canManageProfile && !isEditing ? (
            <div ref={creatorPanelDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setCreatorPanelOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-fuchsia-100 backdrop-blur transition hover:bg-fuchsia-300/20"
                aria-expanded={creatorPanelOpen}
              >
                <Sparkles className="h-4 w-4" />
                {translate(
                  t,
                  "creatorProfileCreatorPanelButton",
                  "Painel do Criador",
                )}
                <ChevronDown
                  className={`h-4 w-4 transition ${creatorPanelOpen ? "rotate-180" : ""}`}
                />
              </button>

              {creatorPanelOpen ? (
                <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#100913]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatorPanelOpen(false);
                      setLiveDropsOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm font-bold text-amber-100 transition hover:bg-amber-300/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10">
                      <Gift className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="uppercase tracking-[0.18em]">
                        {translate(
                          t,
                          "creatorProfileLiveDropsButton",
                          "Drops de Live",
                        )}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreatorPanelOpen(false);
                      setSupportChatOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="uppercase tracking-[0.18em]">
                        {translate(
                          t,
                          "creatorProfileTalkToTeam",
                          "Falar com a equipe",
                        )}
                      </span>
                    </span>
                  </button>

                  <Link
                    href={`/creator/${encodeURIComponent(profile.username)}/dashboard`}
                    onClick={() => setCreatorPanelOpen(false)}
                    className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm font-bold text-fuchsia-100 transition hover:bg-fuchsia-300/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="uppercase tracking-[0.18em]">
                        {translate(
                          t,
                          "creatorProfileManageProfile",
                          "Gerenciar perfil",
                        )}
                      </span>
                    </span>
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-stretch xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="flex h-full min-h-full flex-col items-center px-0 py-0 lg:sticky lg:top-24 lg:self-stretch">
            {creatorForCard ? (
              <div className="relative z-10 w-fit origin-top scale-[1.1] sm:scale-[1.16] lg:scale-[1.18] xl:scale-[1.22]">
                <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_66%)] blur-2xl" />
                <CreatorCard
                  key={`${creatorForCard.id}-${creatorForCard.rarity}`}
                  creator={creatorForCard}
                  onClick={() => undefined}
                />
              </div>
            ) : null}

            {isEditing && editDraft ? (
              <div
                ref={popupEffectDropdownRef}
                className="relative z-40 mt-10 w-full max-w-[300px] px-2 sm:max-w-[330px] lg:mt-12 lg:px-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    setPopupEffectDropdownOpen((current) => !current)
                  }
                  className="flex w-full items-center justify-between gap-3 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] text-cyan-100 shadow-lg shadow-cyan-500/10 backdrop-blur transition hover:border-cyan-300/45 hover:bg-cyan-300/15"
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {translate(
                      t,
                      "creatorProfilePopupThemeTitle",
                      "Efeitos de apresentação",
                    )}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition ${
                      popupEffectDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {popupEffectDropdownOpen ? (
                  <div className="absolute left-2 right-2 top-full z-50 mt-3 max-h-[360px] overflow-y-auto rounded-[1.5rem] border border-cyan-300/20 bg-[#05070d]/95 p-2 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:left-0 sm:right-0">
                    <div className="px-2 pb-2 pt-1">
                      <p className="text-[11px] font-bold leading-relaxed text-white/45">
                        {translate(
                          t,
                          "creatorProfilePopupThemeDescription",
                          "Escolha a animação que aparece apenas dentro da imagem do popup do criador.",
                        )}
                      </p>
                    </div>

                    <div className="grid gap-1.5">
                      {CREATOR_POPUP_IMAGE_EFFECT_STYLES.map((effectStyle) => {
                        const isSelected =
                          (editDraft.popupAnimationStyle || "none") ===
                          effectStyle.value;

                        return (
                          <button
                            key={effectStyle.value}
                            type="button"
                            onClick={() => {
                              handleEditDraftChange(
                                "popupAnimationStyle",
                                effectStyle.value,
                              );
                              setPopupEffectDropdownOpen(false);
                            }}
                            className={`rounded-[1rem] border px-3 py-2.5 text-left transition ${
                              isSelected
                                ? "border-cyan-300/55 bg-cyan-300/15 shadow-lg shadow-cyan-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
                            }`}
                          >
                            <span className="block text-xs font-black uppercase tracking-[0.18em] text-white/85">
                              {translateExisting(
                                t,
                                effectStyle.labelKey,
                                effectStyle.fallback,
                              )}
                            </span>
                            <span className="mt-1 block text-[11px] font-semibold leading-relaxed text-white/45">
                              {translateExisting(
                                t,
                                effectStyle.descriptionKey,
                                effectStyle.descriptionFallback,
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isEditing ? (
              <div className="relative z-20 mt-10 w-full max-w-[340px] rounded-[1.65rem] border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-fuchsia-500/5 backdrop-blur-xl sm:max-w-[360px] lg:mt-auto">
                <div className="flex items-center gap-2 text-cyan-100/70">
                  <Users className="h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.24em]">
                    {translate(t, "creatorProfileCommunityCollection", "Coleção da comunidade")}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-2 py-3">
                    <p className="text-xl font-black text-white">{formatNumber(collectionStats.uniqueCollectors)}</p>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-cyan-100/55">
                      {translate(t, "creatorProfileCollectors", "Colecionadores")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.06] px-2 py-3">
                    <p className="text-xl font-black text-white">{formatNumber(collectionStats.total)}</p>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-fuchsia-100/55">
                      {translate(t, "creatorProfileCollectedCards", "Cartas")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-yellow-300/15 bg-yellow-300/[0.07] px-2 py-3">
                    <p className="truncate text-xl font-black text-white">
                      {highestCollectedRarity ? getRarityLabel(highestCollectedRarity) : "-"}
                    </p>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-yellow-100/55">
                      {translate(t, "creatorProfileHighestRarity", "Maior")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {RARITY_SHOWCASE_CYCLE.map((item) => {
                    const rarityKey = item.rarity as keyof Omit<CreatorCollectionStats, "total" | "uniqueCollectors">;
                    const amount = collectionStats[rarityKey] || 0;
                    const percentage = collectionStats.total > 0 ? Math.round((amount / collectionStats.total) * 100) : 0;

                    return (
                      <div key={item.rarity} className="grid grid-cols-[74px_1fr_42px] items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                          {getRarityLabel(item.rarity as CreatorRarity)}
                        </span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-cyan-300/60" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-right text-[10px] font-black text-cyan-100/70">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 self-start rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl lg:min-h-[626px] lg:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
                {translate(t, "creatorProfilePublicProfile", "Perfil público")}
              </span>

              {isLive ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-red-100 shadow-lg shadow-red-500/10">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  {translate(t, "creatorProfileLiveNow", "Ao vivo agora")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white/45 backdrop-blur">
                  <WifiOff className="h-3.5 w-3.5" />
                  {translate(t, "creatorProfileOffline", "Offline")}
                </span>
              )}

              {profile.is_verified ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-yellow-100 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {translate(t, "creatorProfileVerified", "Verificado")}
                </span>
              ) : null}
            </div>

            {isEditing && editDraft ? (
              <div className="mt-6 rounded-[1.8rem] border border-cyan-300/15 bg-black/30 p-4 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/65">
                      {translate(t, "creatorProfileInlineEditTitle", "Editando perfil público")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-white/42">
                      {translate(t, "creatorProfileInlineEditDescription", "Edite no mesmo contexto em que o público vê a página.")}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                    {translate(t, "creatorProfileEditModeBadge", "Modo edição")}
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                <label className="block xl:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                    {translate(
                      t,
                      "creatorProfileEditNickname",
                      "Nome de exibição",
                    )}
                  </span>
                  <input
                    value={editDraft.nickname}
                    onChange={(event) =>
                      handleEditDraftChange("nickname", event.target.value)
                    }
                    className="mt-2 w-full rounded-[1.2rem] border border-cyan-300/20 bg-black/35 px-4 py-3 text-3xl font-black tracking-[-0.04em] text-white outline-none transition focus:border-cyan-300/55 md:text-5xl"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(t, "creatorProfileEditTitle", "Título")}
                    </span>
                    <input
                      value={editDraft.title}
                      onChange={(event) =>
                        handleEditDraftChange("title", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base font-semibold text-cyan-100 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(t, "creatorProfileEditCategory", "Categoria")}
                    </span>
                    <input
                      value={editDraft.category}
                      onChange={(event) =>
                        handleEditDraftChange("category", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base font-semibold text-white/85 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>
                </div>

                <label className="block xl:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                    {translate(t, "creatorProfileEditBio", "Bio curta")}
                  </span>
                  <textarea
                    value={editDraft.bio}
                    onChange={(event) =>
                      handleEditDraftChange("bio", event.target.value)
                    }
                    rows={3}
                    className="mt-2 w-full resize-none rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base leading-7 text-white/80 outline-none transition focus:border-cyan-300/45"
                  />
                </label>
                </div>
              </div>
            ) : (
              <>
                <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white drop-shadow-[0_0_32px_rgba(34,211,238,0.16)] md:text-7xl">
                  {nickname}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-cyan-100/90 md:text-2xl">
                    {title}
                  </p>
                  <span className="text-sm font-bold text-white/38">
                    @{profile.username}
                  </span>
                </div>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/68 md:text-lg">
                  {bio}
                </p>
              </>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleFollow}
                disabled={followLoading}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {isFollowing
                  ? translate(t, "creatorPopupFollowing", "Seguindo")
                  : translate(t, "creatorPopupFollow", "Seguir")}
              </button>

              <button
                type="button"
                onClick={copyProfileLink}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/70 transition hover:border-cyan-300/25 hover:text-cyan-100"
              >
                <Share2 className="h-4 w-4" />
                {profileLinkCopied
                  ? translate(
                      t,
                      "creatorProfileProfileLinkCopied",
                      "Link copiado",
                    )
                  : translate(
                      t,
                      "creatorProfileCopyProfileLink",
                      "Copiar link do perfil",
                    )}
              </button>

              {!isEditing && isProfileClaimable ? (
                <button
                  type="button"
                  onClick={handleOpenClaimModal}
                  className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-5 py-3 text-sm font-black text-yellow-100 transition hover:bg-yellow-300/20"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {translate(
                    t,
                    "creatorPopupClaimProfileBadge",
                    "Reivindicar Perfil",
                  )}
                </button>
              ) : null}

              <div ref={socialLinksDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSocialLinksOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  <Globe2 className="h-4 w-4" />
                  {translate(t, "creatorProfileSocialLinks", "Redes sociais")}
                </button>

                {socialLinksOpen ? (
                  <div className="absolute left-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#100913]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
                    {socialDropdownItems.length > 0 ? (
                      <div className="space-y-2">
                        {socialDropdownItems.map((social) => {
                          const normalizedPlatform =
                            social.platform.toLowerCase();
                          const isYoutube = normalizedPlatform === "youtube";
                          const platformStatus = getPlatformLiveStatus(
                            liveStatus,
                            normalizedPlatform,
                          );
                          const platformCount = isYoutube
                            ? youtubeExternalReach
                            : getTrustedLiveStatusExternalCount(
                                normalizedPlatform,
                                platformStatus,
                              );
                          const platformSuffix =
                            normalizedPlatform === "discord"
                              ? "membros"
                              : isYoutube
                                ? translate(
                                    t,
                                    "creatorProfileSubscribers",
                                    "inscritos",
                                  )
                                : translate(
                                    t,
                                    "creatorProfileFollowersShort",
                                    "seguidores",
                                  );
                          const platformLabel = isYoutube
                            ? visibleYoutubeChannels.length > 1
                              ? `YouTube (${visibleYoutubeChannels.length})`
                              : "YouTube"
                            : getPlatformLabel(normalizedPlatform);

                          const counterLabel =
                            platformCount > 0
                              ? `${formatNumber(platformCount)} ${platformSuffix}`
                              : "";

                          if (isYoutube) {
                            return (
                              <button
                                key="youtube-social-dropdown"
                                type="button"
                                onClick={() => {
                                  setSocialLinksOpen(false);

                                  if (visibleYoutubeChannels.length > 1) {
                                    setYoutubeChannelsOpen(true);
                                    return;
                                  }

                                  window.open(
                                    social.url,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/75 transition hover:border-cyan-300/30 hover:text-cyan-100"
                              >
                                <span>{platformLabel}</span>
                                {counterLabel ? (
                                  <span className="ml-auto text-xs font-black text-cyan-100/70">
                                    {counterLabel}
                                  </span>
                                ) : null}
                                <ExternalLink className="h-4 w-4 shrink-0" />
                              </button>
                            );
                          }

                          return (
                            <a
                              key={`${social.platform}-${social.url}`}
                              href={social.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setSocialLinksOpen(false)}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition hover:border-cyan-300/30 hover:text-cyan-100"
                            >
                              <span>{platformLabel}</span>
                              {counterLabel ? (
                                <span className="ml-auto text-xs font-black text-cyan-100/70">
                                  {counterLabel}
                                </span>
                              ) : null}
                              <ExternalLink className="h-4 w-4 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="px-3 py-2 text-sm font-semibold leading-6 text-white/50">
                        {translate(
                          t,
                          "creatorProfileNoSocialLinks",
                          "As redes sociais deste criador ainda não foram adicionadas.",
                        )}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {isEditing && editDraft ? (
              <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                    {translate(t, "creatorProfileEditTags", "Tags")}
                  </span>
                  <input
                    value={editDraft.tagsText}
                    onChange={(event) =>
                      handleEditDraftChange("tagsText", event.target.value)
                    }
                    placeholder="Streamer, MMORPG, Black Desert"
                    className="mt-2 w-full rounded-[1.2rem] border border-cyan-300/20 bg-black/35 px-4 py-3 text-sm font-semibold text-cyan-100 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                  />
                </label>
              </div>
            ) : visibleTags.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-2 text-sm font-bold text-cyan-100/85 backdrop-blur"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.4rem] border border-cyan-300/15 bg-cyan-300/[0.06] p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-cyan-100/55">
                  <Eye className="h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]">
                    {translate(t, "creatorProfileViews", "Visualizações")}
                  </p>
                </div>
                <p className="mt-3 text-3xl font-black">{formatNumber(stats.views)}</p>
              </div>

              <div className="rounded-[1.4rem] border border-fuchsia-300/15 bg-fuchsia-300/[0.06] p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-fuchsia-100/55">
                  <Users className="h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]">
                    {translate(t, "creatorProfileCardpocReach", "Alcance Cardpoc")}
                  </p>
                </div>
                <p className="mt-3 text-3xl font-black">{formatNumber(stats.followers)}</p>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-white/40">
                  <Globe2 className="h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]">
                    {translate(t, "creatorProfileGlobalReach", "Alcance global")}
                  </p>
                </div>
                <p className="mt-3 text-3xl font-black">
                  {liveStatusLoading ? "..." : formatNumber(externalReach)}
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-white/40">
                  <Share2 className="h-4 w-4" />
                  <p className="text-[9px] font-black uppercase leading-tight tracking-[0.16em] [overflow-wrap:anywhere]">
                    {translate(t, "creatorProfileSharedImpact", "Compartilhamentos")}
                  </p>
                </div>
                <p className="mt-3 text-3xl font-black">{formatNumber(stats.shares)}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-fuchsia-300/15 bg-[radial-gradient(circle_at_82%_50%,rgba(217,70,239,0.16),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(217,70,239,0.08),rgba(0,0,0,0.18))] p-5 shadow-2xl shadow-fuchsia-500/5 backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-fuchsia-100/80">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em]">
                      {translate(t, "creatorProfileBattleMode", "Batalha de criadores")}
                    </p>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/55">
                    {translate(t, "creatorProfileBattleModeDescription", "Desafie outro criador e veja a comparação em uma arena animada.")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openBattleModal}
                  disabled={battleCandidates.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] border border-fuchsia-300/30 bg-fuchsia-400/15 px-6 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-fuchsia-50 shadow-lg shadow-fuchsia-500/10 transition hover:bg-fuchsia-400/25 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Sparkles className="h-4 w-4" />
                  {translate(t, "creatorProfileBattleOpenArena", "Iniciar batalha")}
                </button>
              </div>
            </div>

          </div>
        </section>

        {battleModalOpen ? (
          <div className="fixed inset-x-0 bottom-0 top-[76px] z-[90] flex items-center justify-center bg-black/78 px-4 py-4 backdrop-blur-md" role="dialog" aria-modal="true">
            <div className="relative max-h-[calc(100vh-108px)] w-full max-w-7xl overflow-y-auto rounded-[2rem] border border-fuchsia-300/25 bg-[#07040b]/95 p-4 shadow-2xl shadow-fuchsia-500/20 [scrollbar-width:none] [-ms-overflow-style:none] sm:p-6 [&::-webkit-scrollbar]:hidden">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_40%,rgba(34,211,238,0.22),transparent_33%),radial-gradient(circle_at_82%_42%,rgba(248,113,113,0.18),transparent_33%),linear-gradient(90deg,rgba(34,211,238,0.08),transparent,rgba(217,70,239,0.08))]" />
              {battleStarted ? (
                <div className="pointer-events-none absolute inset-0 opacity-50 animate-[battleFriction_1100ms_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.12),transparent,rgba(244,63,94,0.12),transparent)]" />
              ) : null}

              <button
                type="button"
                onClick={closeBattleModal}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-2xl font-light text-white/70 transition hover:border-fuchsia-300/30 hover:text-white"
                aria-label="Fechar batalha"
              >
                ×
              </button>

              <div className="relative z-10">
                <div className="mb-5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.34em] text-fuchsia-100/60">
                    {translate(t, "creatorProfileBattleMode", "Batalha de criadores")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white md:text-4xl">
                    {battleStarted && selectedBattleCreator
                      ? `${nickname} VS ${selectedBattleCreator.nickname || selectedBattleCreator.username}`
                      : translate(t, "creatorProfileBattleChooseOpponent", "Escolha o oponente")}
                  </h2>
                </div>

                {!battleStarted ? (
                  <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_260px] lg:items-stretch">
                    <div className="flex items-center justify-center rounded-[1.7rem] border border-cyan-300/15 bg-cyan-300/[0.04] p-3 shadow-2xl shadow-cyan-500/10">
                      {creatorForCard ? (
                        <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86]">
                          <CreatorCard creator={creatorForCard} onClick={() => undefined} />
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[1.7rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
                      <div className="flex items-center justify-center gap-3">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
                        <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-1 text-sm font-black text-fuchsia-100 shadow-lg shadow-fuchsia-500/10">
                          VS
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-300/25 to-transparent" />
                      </div>

                      <label className="mt-5 block">
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                          {translate(t, "creatorProfileBattleSearchOpponent", "Pesquisar oponente")}
                        </span>
                        <input
                          value={battleSearchQuery}
                          onChange={(event) => setBattleSearchQuery(event.target.value)}
                          placeholder={translate(t, "creatorProfileBattleSearchPlaceholder", "Buscar criador pelo nome...")}
                          className="mt-2 w-full rounded-[1.15rem] border border-fuchsia-300/20 bg-black/45 px-4 py-3 text-sm font-bold text-fuchsia-50 outline-none transition placeholder:text-white/25 focus:border-fuchsia-300/45"
                        />
                      </label>

                      <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {filteredBattleCandidates.length > 0 ? (
                          filteredBattleCandidates.map((candidate) => {
                            const selected = candidate.id === selectedBattleCreatorId;
                            const candidateCard = Array.isArray(candidate.creator_cards)
                              ? candidate.creator_cards[0] || null
                              : candidate.creator_cards || null;

                            return (
                              <button
                                key={candidate.id}
                                type="button"
                                onClick={() => {
                                  setSelectedBattleCreatorId(candidate.id);
                                  setBattleStarted(false);
                                  setRevealedBattleRows(0);
                                }}
                                className={`flex w-full items-center gap-3 rounded-[1rem] border px-3 py-2.5 text-left transition ${
                                  selected
                                    ? "border-fuchsia-300/45 bg-fuchsia-300/15 shadow-lg shadow-fuchsia-500/10"
                                    : "border-white/10 bg-white/[0.035] hover:border-fuchsia-300/30 hover:bg-fuchsia-300/[0.08]"
                                }`}
                              >
                                <span className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/10">
                                  {candidate.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={candidate.avatar_url}
                                      alt=""
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : null}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-black text-white">
                                    {candidate.nickname || candidate.username}
                                  </span>
                                  <span className="block truncate text-xs font-semibold text-white/40">
                                    @{candidate.username}
                                  </span>
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                                  {getRarityLabel(normalizeCreatorRarity(candidateCard?.rarity || "common"))}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-3 py-4 text-sm font-semibold text-white/45">
                            {translate(t, "creatorProfileBattleNoOpponents", "Nenhum criador encontrado.")}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={startBattleAnimation}
                        disabled={!selectedBattleCreator || !battleStats || battleLoading}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1.15rem] border border-fuchsia-300/30 bg-fuchsia-400/15 px-5 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-fuchsia-50 shadow-lg shadow-fuchsia-500/10 transition hover:bg-fuchsia-400/25 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {battleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {translate(t, "creatorProfileBattleStart", "Iniciar batalha")}
                      </button>
                    </div>

                    <div className="flex items-center justify-center rounded-[1.7rem] border border-rose-300/15 bg-rose-300/[0.04] p-3 shadow-2xl shadow-rose-500/10">
                      {selectedBattleCreatorForCard ? (
                        <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86] animate-[battleSlideInRight_420ms_ease-out_both]">
                          <CreatorCard creator={selectedBattleCreatorForCard} onClick={() => undefined} />
                        </div>
                      ) : (
                        <div className="flex h-[360px] w-full flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.025] text-center">
                          <Sparkles className="h-8 w-8 text-fuchsia-100/35" />
                          <p className="mt-3 max-w-[180px] text-xs font-black uppercase tracking-[0.18em] text-white/35">
                            {translate(t, "creatorProfileBattleSelectOpponentCard", "Selecione um criador para revelar a carta")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)_230px] lg:items-center">
                    <div className="flex justify-center animate-[battleSlideInLeft_520ms_ease-out_both]">
                      {creatorForCard ? (
                        <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86] animate-[battleCardClashLeft_900ms_ease-in-out_1]">
                          <CreatorCard creator={creatorForCard} onClick={() => undefined} />
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
                      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                        <div>
                          <p className="truncate text-sm font-black text-cyan-100 md:text-base">{nickname}</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                            {translate(t, "creatorProfileBattleCurrent", "Atual")}
                          </p>
                        </div>
                        <span className="animate-[battleVsPulse_900ms_ease-in-out_infinite] rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2 text-sm font-black text-fuchsia-100 shadow-lg shadow-fuchsia-500/20">VS</span>
                        <div>
                          <p className="truncate text-sm font-black text-fuchsia-100 md:text-base">
                            {selectedBattleCreator?.nickname || selectedBattleCreator?.username}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                            {translate(t, "creatorProfileBattleOpponent", "Oponente")}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {visibleBattleRows.map((row, index) => {
                          const currentWins = row.current > row.opponent;
                          const opponentWins = row.opponent > row.current;
                          const draw = !currentWins && !opponentWins;

                          return (
                            <div key={row.key} className="grid animate-[battleRowReveal_460ms_ease-out_both] grid-cols-[84px_minmax(0,1fr)_84px] items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.035] px-3 py-2.5" style={{ animationDelay: `${index * 70}ms` }}>
                              <p className={`rounded-xl px-3 py-2 text-center text-lg font-black ${
                                draw
                                  ? "bg-yellow-300/10 text-yellow-100"
                                  : currentWins
                                    ? "bg-emerald-400/18 text-emerald-100 shadow-lg shadow-emerald-500/10"
                                    : "bg-red-500/16 text-red-100"
                              }`}>
                                {formatNumber(row.current)}
                              </p>
                              <div className="text-center">
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/55">{row.label}</p>
                                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                                  {currentWins
                                    ? translate(t, "creatorProfileBattleCurrentWins", "Você vence")
                                    : opponentWins
                                      ? translate(t, "creatorProfileBattleOpponentWins", "Oponente vence")
                                      : translate(t, "creatorProfileBattleDraw", "Empate")}
                                </p>
                              </div>
                              <p className={`rounded-xl px-3 py-2 text-center text-lg font-black ${
                                draw
                                  ? "bg-yellow-300/10 text-yellow-100"
                                  : opponentWins
                                    ? "bg-emerald-400/18 text-emerald-100 shadow-lg shadow-emerald-500/10"
                                    : "bg-red-500/16 text-red-100"
                              }`}>
                                {formatNumber(row.opponent)}
                              </p>
                            </div>
                          );
                        })}

                        {revealedBattleRows < battleRows.length ? (
                          <div className="rounded-[1rem] border border-fuchsia-300/15 bg-fuchsia-300/[0.05] px-3 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-fuchsia-100/60 animate-pulse">
                            {translate(t, "creatorProfileBattleCalculating", "Calculando próximo impacto...")}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2">
                          <p className="text-xl font-black text-cyan-100">{visibleBattleScore.current}</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/50">
                            {translate(t, "creatorProfileBattleCurrentWins", "Você vence")}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                          <p className="text-xl font-black text-white">{visibleBattleScore.draws}</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                            {translate(t, "creatorProfileBattleDraw", "Empate")}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.06] px-3 py-2">
                          <p className="text-xl font-black text-fuchsia-100">{visibleBattleScore.opponent}</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-fuchsia-100/50">
                            {translate(t, "creatorProfileBattleOpponentWins", "Oponente vence")}
                          </p>
                        </div>
                      </div>

                      {battleAnimationComplete ? (
                        <div className={`mt-4 rounded-[1.2rem] border px-4 py-4 text-center ${
                          battleFinalWinner === "current"
                            ? "border-emerald-300/25 bg-emerald-400/10"
                            : battleFinalWinner === "opponent"
                              ? "border-rose-300/25 bg-rose-400/10"
                              : "border-yellow-300/25 bg-yellow-300/10"
                        }`}>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                            {translate(t, "creatorProfileBattleFinalResult", "Resultado final")}
                          </p>
                          <p className="mt-1 text-2xl font-black text-white">
                            {battleFinalWinner === "current"
                              ? translate(t, "creatorProfileBattleYouWon", "Você venceu")
                              : battleFinalWinner === "opponent"
                                ? `${selectedBattleCreator?.nickname || selectedBattleCreator?.username} ${translate(t, "creatorProfileBattleWon", "venceu")}`
                                : translate(t, "creatorProfileBattleFinalDraw", "Empate geral")}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex justify-center animate-[battleSlideInRight_520ms_ease-out_both]">
                      {selectedBattleCreatorForCard ? (
                        <div className="scale-[0.82] sm:scale-[0.9] lg:scale-[0.86] animate-[battleCardClashRight_900ms_ease-in-out_1]">
                          <CreatorCard creator={selectedBattleCreatorForCard} onClick={() => undefined} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <style jsx>{`
                @keyframes battleSlideInLeft {
                  from { opacity: 0; transform: translateX(-48px) rotate(-4deg) scale(0.92); }
                  to { opacity: 1; transform: translateX(0) rotate(0deg) scale(1); }
                }
                @keyframes battleSlideInRight {
                  from { opacity: 0; transform: translateX(48px) rotate(4deg) scale(0.92); }
                  to { opacity: 1; transform: translateX(0) rotate(0deg) scale(1); }
                }
                @keyframes battleCardClashLeft {
                  0% { transform: translateX(0) rotate(0deg) scale(1); }
                  42% { transform: translateX(34px) rotate(2deg) scale(1.03); filter: brightness(1.25); }
                  58% { transform: translateX(18px) rotate(-1deg) scale(0.99); filter: brightness(1.05); }
                  100% { transform: translateX(0) rotate(0deg) scale(1); }
                }
                @keyframes battleCardClashRight {
                  0% { transform: translateX(0) rotate(0deg) scale(1); }
                  42% { transform: translateX(-34px) rotate(-2deg) scale(1.03); filter: brightness(1.25); }
                  58% { transform: translateX(-18px) rotate(1deg) scale(0.99); filter: brightness(1.05); }
                  100% { transform: translateX(0) rotate(0deg) scale(1); }
                }
                @keyframes battleVsPulse {
                  0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(217,70,239,0); }
                  50% { transform: scale(1.12); box-shadow: 0 0 32px rgba(217,70,239,0.38); }
                }
                @keyframes battleRowReveal {
                  from { opacity: 0; transform: translateY(12px) scale(0.98); filter: blur(4px); }
                  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
                @keyframes battleFriction {
                  0%, 100% { transform: translateX(-6%); opacity: 0.25; }
                  50% { transform: translateX(6%); opacity: 0.55; }
                }
              `}</style>
            </div>
          </div>
        ) : null}

        {heroLiveStatus ? (
          <button
            type="button"
            onClick={() => {
              if (livePlatformItems.length > 1) {
                setLivePlatformsOpen(true);
                return;
              }

              window.open(
                heroLiveStatus.url || "#",
                "_blank",
                "noopener,noreferrer",
              );
            }}
            className="mt-8 flex w-full items-center gap-3 rounded-[1.6rem] border border-red-300/20 bg-red-500/10 px-5 py-4 text-left text-sm font-bold text-red-50 backdrop-blur-xl transition hover:bg-red-500/15"
          >
            <Radio className="h-5 w-5 animate-pulse" />
            <span className="line-clamp-1">
              {livePlatformItems.length > 1
                ? translate(
                    t,
                    "creatorProfileChooseLivePlatform",
                    "Este criador está ao vivo em mais de uma plataforma. Escolha onde assistir.",
                  )
                : heroLiveStatus.title ||
                  translate(
                    t,
                    "creatorProfileLiveFallbackTitle",
                    "Live em andamento",
                  )}
            </span>
            {heroLiveStatus.viewerCount ? (
              <span className="ml-auto whitespace-nowrap text-red-100/70">
                {formatNumber(heroLiveStatus.viewerCount)}{" "}
                {translate(t, "creatorProfileViewers", "assistindo")}
              </span>
            ) : null}
          </button>
        ) : null}

        <section className="mt-8">
          <div className="space-y-6">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-cyan-200" />
                <h2 className="text-2xl font-black tracking-tight">
                  {translate(t, "creatorProfileAboutTitle", "Sobre o criador")}
                </h2>
              </div>

              {isEditing && editDraft ? (
                <textarea
                  value={editDraft.description}
                  onChange={(event) =>
                    handleEditDraftChange("description", event.target.value)
                  }
                  rows={7}
                  className="mt-5 w-full resize-none rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-base leading-8 text-white/75 outline-none transition focus:border-cyan-300/45"
                />
              ) : (
                <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/68">
                  {description}
                </p>
              )}
            </article>

            <article className="rounded-[2rem] border border-fuchsia-300/15 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-fuchsia-200" />
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">
                      {translate(
                        t,
                        "creatorProfilePartnershipsTitle",
                        "Parcerias Verificadas",
                      )}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-white/45">
                      {translate(
                        t,
                        "creatorProfilePartnershipsDescription",
                        "Parcerias, patrocínios, campanhas e marcas verificadas no Cardpoc.",
                      )}
                    </p>
                  </div>
                </div>

                {partnershipHistoryCount > 12 ? (
                  <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-black text-fuchsia-100">
                    +{partnershipHistoryCount - 12}
                  </span>
                ) : null}
              </div>

              {visiblePartnerships.length > 0 ? (
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visiblePartnerships.map((partnership) => {
                    const brandName = getPartnershipDisplayName(partnership);
                    const logo = getPartnershipLogo(partnership);
                    const website = getPartnershipWebsite(partnership);
                    const startDate =
                      partnership.start_date || partnership.source_published_at;

                    const cardContent = (
                      <div className="group relative flex min-h-[92px] overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/25 p-3 transition hover:border-fuchsia-300/25 hover:bg-fuchsia-300/[0.04]">
                        <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-fuchsia-500/10 blur-2xl" />

                        <div className="relative flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/60">
                            {logo ? (
                              <img
                                src={logo}
                                alt={brandName}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              brandName.slice(0, 2).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="truncate text-sm font-black text-white">
                                {brandName}
                              </h3>
                              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-fuchsia-100">
                                {getPartnershipTypeLabel(
                                  partnership.partnership_type,
                                )}
                              </span>
                            </div>

                            {startDate ? (
                              <p className="mt-1.5 truncate text-[11px] font-bold text-white/42">
                                {translate(
                                  t,
                                  "creatorProfilePartnershipSince",
                                  "Desde",
                                )}{" "}
                                {formatProfileDate(startDate)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );

                    return website ? (
                      <a
                        key={partnership.id}
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        {cardContent}
                      </a>
                    ) : (
                      <div key={partnership.id}>{cardContent}</div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-white/50">
                  {translate(
                    t,
                    "creatorProfileNoPartnerships",
                    "Nenhuma parceria verificada publicada ainda.",
                  )}
                </p>
              )}

              {isEditing && editDraft ? (
                <div className="mt-5 rounded-[1.35rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100/80">
                        {translate(
                          t,
                          "creatorProfileManualPartnershipTitle",
                          "Adicionar parceria manual",
                        )}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-white/45">
                        {translate(
                          t,
                          "creatorProfileManualPartnershipDescription",
                          "Parcerias adicionadas pelo criador aparecem publicamente sem passar pela fila automática.",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      value={manualPartnershipDraft.brandName}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "brandName",
                          event.target.value,
                        )
                      }
                      placeholder={translate(
                        t,
                        "creatorProfileManualPartnershipBrand",
                        "Nome da marca",
                      )}
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                    />

                    <select
                      value={manualPartnershipDraft.partnershipType}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "partnershipType",
                          event.target.value,
                        )
                      }
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-cyan-100 outline-none transition focus:border-cyan-300/45"
                    >
                      <option value="sponsorship">
                        {translate(
                          t,
                          "creatorProfilePartnershipTypeSponsorship",
                          "Patrocínio",
                        )}
                      </option>
                      <option value="ambassador">
                        {translate(
                          t,
                          "creatorProfilePartnershipTypeAmbassador",
                          "Embaixador",
                        )}
                      </option>
                      <option value="campaign">
                        {translate(
                          t,
                          "creatorProfilePartnershipTypeCampaign",
                          "Campanha",
                        )}
                      </option>
                      <option value="event">
                        {translate(
                          t,
                          "creatorProfilePartnershipTypeEvent",
                          "Evento",
                        )}
                      </option>
                      <option value="partnership">
                        {translate(
                          t,
                          "creatorProfilePartnershipTypePartnership",
                          "Parceria",
                        )}
                      </option>
                    </select>

                    <input
                      value={manualPartnershipDraft.brandLogoUrl}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "brandLogoUrl",
                          event.target.value,
                        )
                      }
                      placeholder={translate(
                        t,
                        "creatorProfileManualPartnershipLogoUrl",
                        "Logo da marca (URL da imagem)",
                      )}
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                    />

                    <input
                      value={manualPartnershipDraft.brandWebsiteUrl}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "brandWebsiteUrl",
                          event.target.value,
                        )
                      }
                      placeholder={translate(
                        t,
                        "creatorProfileManualPartnershipBrandWebsite",
                        "Site oficial da marca",
                      )}
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                    />

                    <input
                      value={manualPartnershipDraft.campaignName}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "campaignName",
                          event.target.value,
                        )
                      }
                      placeholder={translate(
                        t,
                        "creatorProfileManualPartnershipCampaign",
                        "Campanha ou ação",
                      )}
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                    />

                    <input
                      value={manualPartnershipDraft.websiteUrl}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "websiteUrl",
                          event.target.value,
                        )
                      }
                      placeholder={translate(
                        t,
                        "creatorProfileManualPartnershipPublicLink",
                        "Link público da parceria",
                      )}
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                    />

                    <textarea
                      value={manualPartnershipDraft.brandDescription}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "brandDescription",
                          event.target.value,
                        )
                      }
                      rows={2}
                      placeholder={translate(
                        t,
                        "creatorProfileManualPartnershipBrandDescription",
                        "Descrição da marca",
                      )}
                      className="resize-none rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45 md:col-span-2"
                    />

                    <input
                      type="date"
                      value={manualPartnershipDraft.startDate}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "startDate",
                          event.target.value,
                        )
                      }
                      title={translate(
                        t,
                        "creatorProfileManualPartnershipStartDate",
                        "Data de início",
                      )}
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
                    />

                    <input
                      type="date"
                      value={manualPartnershipDraft.endDate}
                      onChange={(event) =>
                        handleManualPartnershipDraftChange(
                          "endDate",
                          event.target.value,
                        )
                      }
                      title={translate(
                        t,
                        "creatorProfileManualPartnershipEndDate",
                        "Data de fim",
                      )}
                      className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
                    />
                  </div>

                  <textarea
                    value={manualPartnershipDraft.publicDescription}
                    onChange={(event) =>
                      handleManualPartnershipDraftChange(
                        "publicDescription",
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder={translate(
                      t,
                      "creatorProfileManualPartnershipPublicDescription",
                      "Descrição pública da parceria",
                    )}
                    className="mt-3 w-full resize-none rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                  />

                  {manualPartnershipError ? (
                    <p className="mt-3 text-sm font-bold text-red-200">
                      {manualPartnershipError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleAddManualPartnership}
                    disabled={manualPartnershipSaving}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {manualPartnershipSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {translate(
                      t,
                      "creatorProfileManualPartnershipSave",
                      "Adicionar parceria",
                    )}
                  </button>
                </div>
              ) : null}
            </article>

            {isEditing && editDraft ? (
              <article className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl md:p-8">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-cyan-200" />
                  <h2 className="text-2xl font-black tracking-tight">
                    {translate(
                      t,
                      "creatorProfileEditMediaTitle",
                      "Mídia e links",
                    )}
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(
                        t,
                        "creatorProfileEditAvatarUrl",
                        "URL do avatar",
                      )}
                    </span>
                    <input
                      value={editDraft.avatarUrl}
                      onChange={(event) =>
                        handleEditDraftChange("avatarUrl", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(
                        t,
                        "creatorProfileEditBannerUrl",
                        "URL do banner",
                      )}
                    </span>
                    <input
                      value={editDraft.bannerUrl}
                      onChange={(event) =>
                        handleEditDraftChange("bannerUrl", event.target.value)
                      }
                      className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
                      {translate(
                        t,
                        "creatorProfileEditSocialLinks",
                        "Links sociais",
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEditSocialLink}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {translate(
                        t,
                        "creatorProfileEditAddSocialLink",
                        "Adicionar link",
                      )}
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {getEditSocialLinkRows(editDraft.socialLinksText).map(
                      (social, index) => (
                        <div
                          key={`social-link-${index}`}
                          className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-black/25 p-3 md:grid-cols-[180px_minmax(0,1fr)_auto]"
                        >
                          <select
                            value={social.platform || "link"}
                            onChange={(event) =>
                              handleEditSocialLinkChange(
                                index,
                                "platform",
                                event.target.value,
                              )
                            }
                            className="rounded-[1rem] border border-white/10 bg-black/35 px-3 py-3 text-sm font-bold text-cyan-100 outline-none transition focus:border-cyan-300/45"
                          >
                            {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <input
                            value={social.url}
                            onChange={(event) =>
                              handleEditSocialLinkChange(
                                index,
                                "url",
                                event.target.value,
                              )
                            }
                            placeholder="https://..."
                            className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveEditSocialLink(index)}
                            className="inline-flex items-center justify-center rounded-[1rem] border border-red-300/15 bg-red-500/10 px-4 py-3 text-red-100 transition hover:bg-red-500/15"
                            aria-label={translate(
                              t,
                              "creatorProfileEditRemoveSocialLink",
                              "Remover link",
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </article>
            ) : null}

            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-5 w-5 text-fuchsia-200" />
                  <h2 className="text-2xl font-black tracking-tight">
                    {translate(
                      t,
                      "creatorProfileFeaturedClips",
                      "Clipes em destaque",
                    )}
                  </h2>
                </div>

                {clipsLoading ? (
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-white/45">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-100" />
                    {translate(
                      t,
                      "creatorProfileLoadingClips",
                      "Carregando clipes...",
                    )}
                  </span>
                ) : null}
              </div>

              {clipsLoading ? (
                <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white/50">
                  {translate(
                    t,
                    "creatorProfileLoadingClips",
                    "Carregando clipes...",
                  )}
                </div>
              ) : clips.length > 0 ? (
                <div className="mt-5">
                  {clipPlatformSections.length > 1 ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {clipPlatformSections.map(([platform, platformClips]) => (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => setActiveClipPlatform(platform)}
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                            selectedClipPlatform === platform
                              ? "border-fuchsia-300/40 bg-fuchsia-300/15 text-fuchsia-100 shadow-lg shadow-fuchsia-500/10"
                              : "border-white/10 bg-white/[0.04] text-white/50 hover:border-cyan-300/25 hover:text-cyan-100"
                          }`}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          {getPlatformLabel(platform)}
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">
                            {platformClips.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {selectedClipPlatform && selectedPlatformClips.length > 0 ? (
                    <section>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/60">
                          {getPlatformLabel(selectedClipPlatform)}
                        </p>
                        <span className="text-xs font-bold text-white/35">
                          {selectedPlatformClips.length}{" "}
                          {selectedPlatformClips.length === 1
                            ? translate(t, "creatorProfileClipSingular", "clip")
                            : translate(t, "creatorProfileClipPlural", "clips")}
                        </span>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            document
                              .getElementById(
                                `creator-profile-clips-${selectedClipPlatform}`,
                              )
                              ?.scrollBy({ left: -320, behavior: "smooth" });
                          }}
                          className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-fuchsia-300/20 bg-black/80 text-fuchsia-100 shadow-2xl backdrop-blur transition hover:border-fuchsia-300/45 hover:bg-fuchsia-300/15 sm:flex"
                          aria-label={translate(
                            t,
                            "creatorProfilePreviousClips",
                            "Clipes anteriores",
                          )}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        <div
                          id={`creator-profile-clips-${selectedClipPlatform}`}
                          className="flex snap-x gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                          {selectedPlatformClips.map((clip) => {
                            const thumbnail =
                              clip.thumbnailUrl || clip.thumbnail_url;
                            const viewCount =
                              clip.viewCount ?? clip.view_count ?? 0;
                            const clipHref = getSafeClipUrl(clip, socialLinks);

                            return (
                              <a
                                key={clip.id}
                                href={clipHref}
                                target="_blank"
                                rel="noreferrer"
                                className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/30 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.04] sm:w-[260px] lg:w-[290px]"
                              >
                                <div className="aspect-[16/8.5] bg-white/[0.04]">
                                  {thumbnail ? (
                                    <img
                                      src={thumbnail}
                                      alt={clip.title}
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-white/30">
                                      <PlayCircle className="h-8 w-8" />
                                    </div>
                                  )}
                                </div>

                                <div className="p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/60">
                                      {getPlatformLabel(clip.platform)}
                                    </p>

                                    {viewCount > 0 ? (
                                      <span className="text-[11px] font-bold text-white/40">
                                        {formatNumber(viewCount)}
                                      </span>
                                    ) : null}
                                  </div>

                                  <h3 className="mt-1.5 line-clamp-2 text-xs font-black leading-5 text-white sm:text-sm">
                                    {clip.title}
                                  </h3>
                                </div>
                              </a>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            document
                              .getElementById(
                                `creator-profile-clips-${selectedClipPlatform}`,
                              )
                              ?.scrollBy({ left: 320, behavior: "smooth" });
                          }}
                          className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-fuchsia-300/20 bg-black/80 text-fuchsia-100 shadow-2xl backdrop-blur transition hover:border-fuchsia-300/45 hover:bg-fuchsia-300/15 sm:flex"
                          aria-label={translate(
                            t,
                            "creatorProfileNextClips",
                            "Próximos clipes",
                          )}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-7 text-white/50">
                  {translate(
                    t,
                    "creatorProfileNoClips",
                    "Este criador ainda não possui clipes públicos em destaque.",
                  )}
                </p>
              )}
            </article>
          </div>
        </section>
      </div>

      {profile && liveDropsOpen ? (
        <LiveDropsModal
          open={liveDropsOpen}
          onClose={() => setLiveDropsOpen(false)}
          creatorId={profile.id}
          creatorName={profile.nickname || profile.username}
          platform={liveDropsPlatform.key}
          isLive={Boolean(liveDropsPlatform.status?.isLive)}
          viewerCount={liveDropsPlatform.status?.viewerCount || 0}
          liveTitle={liveDropsPlatform.status?.title || null}
        />
      ) : null}

      {livePlatformsOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 px-4 py-6 sm:px-6">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setLivePlatformsOpen(false)}
            aria-label={translate(
              t,
              "creatorProfileCloseLivePlatforms",
              "Fechar plataformas ao vivo",
            )}
          />

          <div className="relative w-[min(92vw,760px)] rounded-[28px] border border-white/15 bg-zinc-950/95 p-5 text-white shadow-[0_0_90px_rgba(0,0,0,0.95)] sm:p-6">
            <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-red-500/20 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-[80px]" />

            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-200">
                {translate(t, "creatorProfileLiveNow", "Ao vivo agora")}
              </p>

              <h3 className="mt-3 text-xl font-black sm:text-2xl">
                {translate(
                  t,
                  "creatorProfileLivePlatformsTitle",
                  "Escolha onde assistir",
                )}
              </h3>

              <p className="mt-2 text-sm text-white/45">
                {translate(
                  t,
                  "creatorProfileLivePlatformsDescription",
                  "Este criador está online em mais de uma plataforma.",
                )}
              </p>

              <div className="mt-5 grid gap-3">
                {livePlatformItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.status?.url || item.fallbackUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setLivePlatformsOpen(false)}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-red-300/30 hover:bg-red-300/10"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-xs font-black text-red-100">
                      <Radio className="h-5 w-5 animate-pulse" />
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-black text-white">{item.label}</p>
                      <p className="break-words text-sm leading-snug text-white/45">
                        {item.status?.title ||
                          translate(
                            t,
                            "creatorProfileLiveFallbackTitle",
                            "Live em andamento",
                          )}
                      </p>
                    </div>

                    {item.status?.viewerCount ? (
                      <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-bold text-red-100/70 sm:inline-flex">
                        {formatNumber(item.status.viewerCount)}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setLivePlatformsOpen(false)}
                className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
              >
                {translate(t, "creatorProfileClose", "Fechar")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {youtubeChannelsOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setYoutubeChannelsOpen(false)}
            aria-label={translate(
              t,
              "creatorPopupCloseYoutubeChannels",
              "Fechar canais do YouTube",
            )}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/15 bg-zinc-950 p-5 text-white shadow-[0_0_70px_rgba(0,0,0,0.9)] sm:p-6">
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-red-500/20 blur-[70px]" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-[70px]" />

            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
                YouTube
              </p>

              <h3 className="mt-3 text-xl font-black sm:text-2xl">
                {translate(
                  t,
                  "creatorPopupYoutubeChannelsTitle",
                  "Canais do YouTube",
                )}
              </h3>

              <p className="mt-2 text-sm text-white/45">
                {translate(
                  t,
                  "creatorPopupYoutubeChannelsDescription",
                  "Escolha qual canal você quer abrir.",
                )}
              </p>

              <div className="mt-5 grid gap-3">
                {youtubeChannelItems.map((channel, index) => (
                  <a
                    key={`${channel.url}-${index}`}
                    href={channel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  >
                    {channel.thumbnail ? (
                      <img
                        src={channel.thumbnail}
                        alt={channel.title}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-xs font-bold text-cyan-100">
                        YT
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">
                        {channel.title}
                      </p>

                      <p className="text-sm text-white/45">
                        {formatNumber(channel.subscriberCount)}{" "}
                        {translate(
                          t,
                          "creatorPopupYoutubeSubscribers",
                          "inscritos",
                        )}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setYoutubeChannelsOpen(false)}
                className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
              >
                {translate(t, "creatorProfileClose", "Fechar")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {claimModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <button
            type="button"
            aria-label={translate(t, "creatorProfileClose", "Fechar")}
            className="absolute inset-0"
            onClick={() => setClaimModalOpen(false)}
          />

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-300/20 bg-[#08050d]/95 p-6 text-white shadow-2xl shadow-yellow-500/10 sm:p-8">
            <button
              type="button"
              onClick={() => setClaimModalOpen(false)}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              {translate(t, "creatorProfileClose", "Fechar")}
            </button>

            {claimSuccess ? (
              <div className="pr-10">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                  {translate(t, "creatorPopupClaimSentBadge", "Claim Sent")}
                </p>

                <h3 className="mt-3 text-3xl font-black">
                  {translate(
                    t,
                    "creatorPopupClaimSentTitle",
                    "Solicitação enviada",
                  )}
                </h3>

                <p className="mt-4 text-sm leading-6 text-white/60">
                  {translate(
                    t,
                    "creatorPopupClaimSentDescription",
                    "Agora coloque o código abaixo na bio, descrição ou sobre da plataforma informada. Um administrador irá revisar sua solicitação.",
                  )}
                </p>

                <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5 text-center text-2xl font-black tracking-[0.25em] text-cyan-100">
                  {claimCode}
                </div>

                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="mt-6 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08]"
                >
                  {translate(t, "creatorProfileClose", "Fechar")}
                </button>
              </div>
            ) : (
              <div className="pr-10">
                <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
                  {translate(
                    t,
                    "creatorPopupClaimProfileBadge",
                    "Claim Profile",
                  )}
                </p>

                <h3 className="mt-3 text-3xl font-black">
                  {translate(t, "creatorPopupClaimMine", "Este perfil é meu")}
                </h3>

                <p className="mt-4 text-sm leading-6 text-white/60">
                  {translate(
                    t,
                    "creatorPopupClaimDescription",
                    "Para provar que este perfil pertence a você, informe uma plataforma oficial e coloque temporariamente o código abaixo na bio/descrição do canal.",
                  )}
                </p>

                <div className="mt-6 rounded-3xl border border-yellow-300/15 bg-yellow-300/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-yellow-200/70">
                    {translate(
                      t,
                      "creatorPopupClaimCode",
                      "Código de verificação",
                    )}
                  </p>

                  <p className="mt-2 text-xl font-black tracking-[0.25em] text-white">
                    {claimCode}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr]">
                  <select
                    value={claimPlatform}
                    onChange={(event) => setClaimPlatform(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/40"
                  >
                    {SOCIAL_PLATFORM_OPTIONS.filter(
                      (platform) => platform.value !== "link",
                    ).map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>

                  <input
                    value={claimUrl}
                    onChange={(event) => setClaimUrl(event.target.value)}
                    placeholder={translate(
                      t,
                      "creatorPopupClaimUrlPlaceholder",
                      "Link do canal ou perfil oficial",
                    )}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-300/40"
                  />
                </div>

                <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-sm leading-relaxed text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]">
                  <input
                    type="checkbox"
                    checked={claimImageUsageConsent}
                    onChange={(event) =>
                      setClaimImageUsageConsent(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
                  />

                  <span>
                    <strong className="block text-cyan-100">
                      {translate(
                        t,
                        "creatorImageConsentTitle",
                        "Autorização para cartas personalizadas",
                      )}
                    </strong>
                    {translate(
                      t,
                      "creatorImageConsentDescription",
                      "Autorizo o Cardpoc a utilizar minha imagem, nome artístico, identidade pública e conteúdos enviados ou vinculados por mim para criar cartas digitais personalizadas dentro da plataforma.",
                    )}
                  </span>
                </label>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleClaimProfile}
                    disabled={claimSending || !claimImageUsageConsent}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {claimSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {claimSending
                      ? translate(t, "creatorPopupSending", "Enviando...")
                      : translate(
                          t,
                          "creatorPopupSendClaim",
                          "Enviar reivindicação",
                        )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08]"
                  >
                    {translate(t, "creatorProfileCancelEdit", "Cancelar")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {profile && canManageProfile ? (
        <SupportChatModal
          open={supportChatOpen}
          onClose={() => setSupportChatOpen(false)}
          currentUserId={currentUserId}
          creatorId={profile.id}
          creatorName={profile.nickname || profile.username}
        />
      ) : null}

      {isEditing && canManageProfile ? (
        <div className="fixed inset-x-0 bottom-4 z-[80] px-4 sm:bottom-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-[1.7rem] border border-cyan-300/20 bg-[#020617]/90 p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-white">
                {translate(
                  t,
                  "creatorProfileUnsavedChanges",
                  "Alterações não salvas",
                )}
              </p>
              <p className="mt-1 text-xs leading-5 text-white/50">
                {translate(
                  t,
                  "creatorProfileUnsavedChangesDescription",
                  "Salve para publicar as mudanças no perfil ou cancele para voltar ao modo de visualização.",
                )}
              </p>
              {profileSaveError ? (
                <p className="mt-2 text-xs font-bold text-red-200">
                  {profileSaveError}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={handleCancelEditMode}
                disabled={isSavingProfile}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {translate(t, "creatorProfileCancelEdit", "Cancelar")}
              </button>

              <button
                type="button"
                onClick={handleSaveProfileEdit}
                disabled={isSavingProfile}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-5 py-3 text-sm font-black text-cyan-50 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {translate(t, "creatorProfileSaveEdit", "Salvar")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
