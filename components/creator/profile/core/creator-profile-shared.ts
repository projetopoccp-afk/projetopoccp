import type {
  Creator,
  CreatorRank,
  CreatorRarity,
  CreatorStatus,
  SocialPlatform,
} from "@/types/creator";
import { supabase } from "@/lib/supabase/client";
import { addUserXp } from "@/lib/xp/user-xp";
import type {
  CreatorCardRow,
  CreatorProfileRow,
  SocialLink,
  CreatorProfileEditDraft,
  AutoClip,
  PartnershipBrand,
  CreatorPartnershipRow,
  ManualPartnershipDraft,
  LiveStatus,
  LiveStatusMap,
  CreatorLiveStatusRow,
  CreatorCollectionStats,
  VisibleYoutubeChannel,
  NotificationType,
  SupportConversationStatus,
  SupportConversationType
} from "./creator-profile-types";
export type {
  CreatorProfilePageProps,
  CreatorCardRow,
  CreatorProfileRow,
  SocialLink,
  CreatorProfileEditDraft,
  AutoClip,
  PartnershipBrand,
  CreatorPartnershipRow,
  ManualPartnershipDraft,
  LiveStatus,
  LiveStatusMap,
  CreatorLiveStatusRow,
  CreatorStats,
  CreatorCollectionStats,
  CreatorBattleCandidate,
  CreatorBattleStats,
  VisibleYoutubeChannel,
  NotificationType,
  SupportConversationStatus,
  SupportConversationType,
  SupportConversationRow,
  SupportMessageRow
} from "./creator-profile-types";
import {
  PLATFORM_LABELS,
  TRUSTED_EXTERNAL_METRIC_PLATFORMS,
  EMPTY_COLLECTION_STATS,
} from "./creator-profile-constants";
export {
  PLATFORM_LABELS,
  SOCIAL_PLATFORM_OPTIONS,
  LIVE_PLATFORMS,
  TRUSTED_EXTERNAL_METRIC_PLATFORMS,
  RARITY_SHOWCASE_CYCLE,
  RARITY_SHOWCASE_INTERVAL,
  EMPTY_COLLECTION_STATS,
} from "./creator-profile-constants";

export function translateExisting(t: unknown, key: string, fallback: string) {
  const value =
    typeof t === "function"
      ? (t as (translationKey: string) => string)(key)
      : (t as Record<string, string | undefined>)[key];

  return typeof value === "string" && value.trim().length > 0 && value !== key
    ? value
    : fallback;
}


export function mergeLiveStatusPreservingMetrics(
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

export function mapCreatorLiveStatusRowToLiveStatus(
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


export function normalizeRarityValue(rarity: string | null | undefined): keyof Omit<CreatorCollectionStats, "total" | "uniqueCollectors"> {
  const normalizedRarity = String(rarity || "common").toLowerCase();

  if (normalizedRarity === "rare") return "rare";
  if (normalizedRarity === "epic") return "epic";
  if (normalizedRarity === "legendary" || normalizedRarity === "mythic") {
    return "legendary";
  }

  return "common";
}

export function buildCreatorCollectionStats(
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

export function getHighestRarityFromStats(stats: CreatorCollectionStats): CreatorRarity | null {
  if (stats.legendary > 0) return "legendary";
  if (stats.epic > 0) return "epic";
  if (stats.rare > 0) return "rare";
  if (stats.common > 0) return "common";

  return null;
}

export function getCreatorCardLevel(
  card: CreatorCardRow | null | undefined,
  profile: CreatorProfileRow | null | undefined,
) {
  return Number((profile as any)?.profile_level || card?.level || 1);
}

export function getCreatorCardPower(card: CreatorCardRow | null | undefined) {
  return Number(card?.power_score || 0);
}

export function normalizeCreatorTags(tags: unknown): string[] {
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

export function getCreatorCard(
  profile: CreatorProfileRow | null,
): CreatorCardRow | null {
  if (!profile?.creator_cards) return null;

  if (Array.isArray(profile.creator_cards)) {
    return profile.creator_cards[0] || null;
  }

  return profile.creator_cards;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatProfileDate(value?: string | null) {
  if (!value) return "";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

export function getPartnershipBrand(partnership: CreatorPartnershipRow) {
  if (Array.isArray(partnership.brands)) {
    return partnership.brands[0] || null;
  }

  return partnership.brands || null;
}

export function getPartnershipDateValue(partnership: CreatorPartnershipRow) {
  return (
    partnership.start_date ||
    partnership.source_published_at ||
    partnership.end_date ||
    ""
  );
}

export function getPartnershipTimestamp(partnership: CreatorPartnershipRow) {
  const dateValue = getPartnershipDateValue(partnership);
  const timestamp = dateValue ? new Date(dateValue).getTime() : 0;

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getPartnershipDisplayName(partnership: CreatorPartnershipRow) {
  return getPartnershipBrand(partnership)?.name || partnership.brand_name;
}

export function getPartnershipLogo(partnership: CreatorPartnershipRow) {
  return getPartnershipBrand(partnership)?.logo_url || null;
}

export function getPartnershipWebsite(partnership: CreatorPartnershipRow) {
  return (
    partnership.website_url ||
    getPartnershipBrand(partnership)?.website_url ||
    null
  );
}

export function getPartnershipDescription(partnership: CreatorPartnershipRow) {
  return (
    partnership.public_description ||
    getPartnershipBrand(partnership)?.description ||
    ""
  );
}

export function getPartnershipTypeLabel(type?: string | null) {
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

export function createBrandSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || `brand-${Date.now()}`;
}

export function createEmptyManualPartnershipDraft(): ManualPartnershipDraft {
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

export function getPlatformLabel(platform: string) {
  const normalizedPlatform = platform.toLowerCase();

  return PLATFORM_LABELS[normalizedPlatform] || platform;
}

export function extractPlatformUsername(platform: string, url: string) {
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

export function getPlatformFallbackUrl(platform: string, username: string) {
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

export function getPlatformLiveStatus(liveStatus: LiveStatusMap, platform: string) {
  return liveStatus[platform.toLowerCase()];
}

export function getNormalizedYoutubeChannels(
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

export function getYoutubeChannelFallbackTitle(
  channel: VisibleYoutubeChannel,
  fallbackLabel: string,
) {
  const username = channel.username.replace(/^@/, "").trim();

  if (username.length > 0) {
    return username.startsWith("UC") ? fallbackLabel : `@${username}`;
  }

  return fallbackLabel;
}

export function getLiveStatusExternalCount(status: LiveStatus | undefined) {
  return (
    status?.subscriberCount ??
    status?.followerCount ??
    status?.memberCount ??
    status?.externalCount ??
    0
  );
}

export function getTrustedLiveStatusExternalCount(
  platform: string,
  status: LiveStatus | undefined,
) {
  const normalizedPlatform = platform.toLowerCase();

  if (!TRUSTED_EXTERNAL_METRIC_PLATFORMS.has(normalizedPlatform)) {
    return 0;
  }

  return getLiveStatusExternalCount(status);
}

export function getYoutubeExternalReachFromLiveStatus(liveStatus: LiveStatusMap) {
  return Object.entries(liveStatus)
    .filter(([key]) => key.startsWith("youtube:"))
    .reduce(
      (total, [, status]) => total + getLiveStatusExternalCount(status),
      0,
    );
}

export function getCreatorExternalReachFromLiveStatus(liveStatus: LiveStatusMap) {
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

export function getSocialUrl(socialLinks: SocialLink[], platform: string) {
  return (
    socialLinks.find((social) => social.platform.toLowerCase() === platform)
      ?.url || ""
  );
}

export function normalizeCreatorStatus(
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

export function normalizeCreatorRarity(
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

export function normalizeCreatorRank(rank: string | null | undefined): CreatorRank {
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

export function isLikelyImageUrl(url: string) {
  const normalizedUrl = url.split("?")[0]?.toLowerCase() || "";

  return /\.(apng|avif|gif|jpg|jpeg|png|svg|webp)$/.test(normalizedUrl);
}

export function isLikelyDirectMediaUrl(url: string) {
  const normalizedUrl = url.split("?")[0]?.toLowerCase() || "";

  return /\.(m3u8|mp4|m4v|mov|webm|mkv|avi|ts|m4a|mp3|wav|ogg)$/.test(
    normalizedUrl,
  );
}

export function getSafeClipUrl(clip: AutoClip, socialLinks: SocialLink[]) {
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

export function createProfileEditDraft(
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

export function parseEditTags(tagsText: string) {
  return tagsText
    .split(/[,\n]/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export function parseEditSocialLinks(socialLinksText: string): SocialLink[] {
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

export function getEditSocialLinkRows(socialLinksText: string): SocialLink[] {
  const parsedLinks = parseEditSocialLinks(socialLinksText);

  return parsedLinks.length > 0
    ? parsedLinks
    : [{ platform: "twitch", url: "" }];
}

export function serializeEditSocialLinks(socialLinks: SocialLink[]) {
  return socialLinks
    .map((social) => {
      const platform = social.platform.trim() || "link";
      const url = social.url.trim();

      return `${platform}: ${url}`;
    })
    .join("\n");
}

export function normalizeCreatorSocials(socialLinks: SocialLink[]) {
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


export async function createUserNotification({
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

export async function getCurrentUserLevel(userId: string) {
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

export async function hasXpEvent(
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

export async function addXpAndNotifyLevelUp({
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


export const FINAL_SUPPORT_STATUSES: SupportConversationStatus[] = [
  "resolved",
  "closed",
];

export function isSupportConversationFinal(status: SupportConversationStatus) {
  return FINAL_SUPPORT_STATUSES.includes(status);
}

export const SUPPORT_CONVERSATION_TYPES: {
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

export function getSupportStatusLabel(
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

export function getSupportTypeLabel(
  t: (key: any) => string,
  type: SupportConversationType,
) {
  const item = SUPPORT_CONVERSATION_TYPES.find((option) => option.id === type);
  return item
    ? translateExisting(t, item.labelKey, item.fallback)
    : translateExisting(t, "supportTypeOther", "Outro assunto");
}
