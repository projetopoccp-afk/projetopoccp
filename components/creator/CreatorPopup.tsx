"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImagePlus, Save, Send, UserCheck, UserPlus } from "lucide-react";
import { getRarityLabel } from "@/lib/rarity";
import { supabase } from "@/lib/supabase/client";
import { addUserXp } from "@/lib/xp/user-xp";
import { updateMissionProgress } from "@/lib/missions/user-missions";
import { Creator } from "@/types/creator";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

type CreatorPopupProps = {
  creator: Creator | null;
  onClose: () => void;
  onCreatorUpdated?: (creator: Creator) => void;
};

const statusLabel = {
  online: "Online",
  offline: "Offline",
  live: "Live now",
  trending: "Trending",
  event: "In event",
};

const socialPlatforms = [
  "youtube",
  "twitch",
  "tiktok",
  "kick",
  "instagram",
  "discord",
  "x",
];


type SocialForm = Record<string, string>;

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

type VisibleYoutubeChannel = {
  url: string;
  originalIndex: number;
  username: string;
};

function getNormalizedYoutubeChannels(channels: string[]): VisibleYoutubeChannel[] {
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
  fallbackLabel: string
) {
  const username = channel.username.replace(/^@/, "").trim();

  if (username.length > 0) {
    return username.startsWith("UC") ? fallbackLabel : `@${username}`;
  }

  return fallbackLabel;
}


type AutoClip = {
  id: string;
  title: string;
  platform: "youtube" | "twitch" | "kick";
  url: string;
  thumbnailUrl: string;
  description?: string;
  createdAt?: string;
  viewCount?: number;
};


function isLikelyImageUrl(url: string) {
  const normalizedUrl = url.split("?")[0]?.toLowerCase() || "";

  return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(normalizedUrl);
}

function isLikelyDirectMediaUrl(url: string) {
  const normalizedUrl = url.split("?")[0]?.toLowerCase() || "";

  return /\.(m3u8|mp4|m4v|mov|webm|mkv|avi|ts|m4a|mp3|wav|ogg)$/.test(
    normalizedUrl,
  );
}

function getSafeClipHref(clip: AutoClip, socials: SocialForm) {
  const rawUrl = String(clip.url || "").trim();

  if (rawUrl && !isLikelyImageUrl(rawUrl) && !isLikelyDirectMediaUrl(rawUrl)) {
    return rawUrl;
  }

  return socials[clip.platform] || "#";
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

function getPlatformLiveStatus(
  liveStatus: LiveStatusMap,
  platform: string
) {
  return liveStatus[platform.toLowerCase()];
}

function getPlatformFallbackUrl(platform: string, username: string) {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform === "kick") {
    return `https://kick.com/${username}`;
  }

  if (normalizedPlatform === "youtube") {
    return `https://www.youtube.com/${username.replace("@", "")}`;
  }

  if (normalizedPlatform === "discord") {
    return username.startsWith("http")
      ? username
      : `https://discord.gg/${username}`;
  }

  if (normalizedPlatform === "instagram") {
    return `https://www.instagram.com/${username.replace("@", "")}`;
  }

  if (normalizedPlatform === "tiktok") {
    return `https://www.tiktok.com/@${username.replace("@", "")}`;
  }

  if (normalizedPlatform === "x") {
    return `https://x.com/${username.replace("@", "")}`;
  }

  return `https://twitch.tv/${username}`;
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

function getPlatformMetricLabel(
  t: (key: any) => string,
  platform: string,
) {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform === "youtube") {
    return translate(t, "creatorPopupYoutubeSubscribers", "inscritos");
  }

  if (normalizedPlatform === "discord") {
    return translate(t, "creatorPopupDiscordMembers", "membros");
  }

  return translate(t, "creatorPopupFollowersLabel", "seguidores");
}

function getPlatformDisplayName(platform: string) {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform === "youtube") return "YouTube";
  if (normalizedPlatform === "twitch") return "Twitch";
  if (normalizedPlatform === "tiktok") return "TikTok";
  if (normalizedPlatform === "kick") return "Kick";
  if (normalizedPlatform === "instagram") return "Instagram";
  if (normalizedPlatform === "discord") return "Discord";
  if (normalizedPlatform === "x") return "X";

  return platform;
}

const VIEW_INTERVAL_MS = 24 * 60 * 60 * 1000;

const CREATOR_LEVEL_SCORE_STEP = 250;
const CREATOR_LEVEL_MAX = 999;

function getCreatorExternalReachFromLiveStatus(liveStatus: LiveStatusMap) {
  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");
  const discordStatus = getPlatformLiveStatus(liveStatus, "discord");

  const twitchFollowers = twitchStatus?.followerCount ?? twitchStatus?.externalCount ?? 0;
  const kickFollowers = kickStatus?.followerCount ?? kickStatus?.externalCount ?? 0;
  const youtubeSubscribers = youtubeStatus?.subscriberCount ?? youtubeStatus?.externalCount ?? 0;
  const discordMembers = discordStatus?.memberCount ?? discordStatus?.externalCount ?? 0;

  return twitchFollowers + kickFollowers + youtubeSubscribers + discordMembers;
}

function calculateCreatorCardProgress({
  views,
  followers,
  shares,
  externalReach,
}: {
  views: number;
  followers: number;
  shares: number;
  externalReach: number;
}) {
  const safeViews = Math.max(0, Math.floor(views || 0));
  const safeFollowers = Math.max(0, Math.floor(followers || 0));
  const safeShares = Math.max(0, Math.floor(shares || 0));
  const safeExternalReach = Math.max(0, Math.floor(externalReach || 0));

  const powerScore =
    safeViews +
    safeFollowers * 100 +
    safeShares * 50 +
    Math.floor(safeExternalReach / 100);

  const level = Math.min(
    CREATOR_LEVEL_MAX,
    Math.max(1, Math.floor(powerScore / CREATOR_LEVEL_SCORE_STEP) + 1)
  );

  return {
    powerScore,
    level,
  };
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
  metadata: Record<string, unknown>
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

export function CreatorPopup({
  creator,
  onClose,
  onCreatorUpdated,
}: CreatorPopupProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [preparedCreatorId, setPreparedCreatorId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [claimMode, setClaimMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nickname, setNickname] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [socials, setSocials] = useState<SocialForm>({});
  const [youtubeChannels, setYoutubeChannels] = useState<string[]>([""]);
  const [clips, setClips] = useState<AutoClip[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [creatorCardLevel, setCreatorCardLevel] = useState(creator?.level || 1);
  const [syncedCardProgressKey, setSyncedCardProgressKey] = useState("");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [viewCount, setViewCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [liveStatusLoading, setLiveStatusLoading] = useState(false);

  const [claimPlatform, setClaimPlatform] = useState("youtube");
  const [claimUrl, setClaimUrl] = useState("");
  const [claimImageUsageConsent, setClaimImageUsageConsent] = useState(false);
  const [claimSending, setClaimSending] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const claimCode = useMemo(() => {
    return `CNX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }, [creator?.id]);

  const isOwner = Boolean(
    creator?.ownerId && currentUserId && creator.ownerId === currentUserId
  );

  const canClaim = Boolean(
    creator && currentUserId && !creator.ownerId && !isOwner
  );

  const creatorId = creator?.id ?? "";

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);
    }

    loadUser();
  }, []);

  useEffect(() => {
    if (!creator) return;

    setPreparedCreatorId(null);
    setClaimMode(false);
    setClaimSuccess(false);
    setClaimUrl("");
    setShareOpen(false);
    setLiveStatus({});
    setCreatorCardLevel(creator.level || 1);
    setSyncedCardProgressKey("");

    setNickname(creator.nickname);
    setTitle(creator.title || "");
    setCategory(creator.category || "");
    setBio(creator.bio || "");
    setDescription(creator.description || "");
    setAvatarUrl(creator.avatarUrl || "");
    setBannerUrl(creator.bannerUrl || "");
    setTagsText((creator.tags || []).join(", "));

    async function loadCreatorData() {
      if (!creator) return;

      const creatorId = creator.id;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const viewerId = user?.id || null;

      const viewKey = `creator-view:${creatorId}:${viewerId || "guest"}`;
      const lastViewAt = Number(localStorage.getItem(viewKey) || 0);
      const now = Date.now();

      if (!lastViewAt || now - lastViewAt > VIEW_INTERVAL_MS) {
        const { error: viewError } = await supabase.from("creator_views").insert({
          creator_id: creatorId,
          viewer_id: viewerId,
        });

        if (!viewError) {
          localStorage.setItem(viewKey, String(now));
        }
      }

      const { count: views } = await supabase
        .from("creator_views")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId);

      const { count: followers } = await supabase
        .from("creator_followers")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId);

      const { data: creatorStats } = await supabase
        .from("creator_profiles")
        .select("share_count")
        .eq("id", creatorId)
        .maybeSingle();

      setViewCount(views || 0);
      setFollowerCount(followers || 0);
      setShareCount(creatorStats?.share_count || 0);

      if (viewerId) {
        const { data: followData } = await supabase
          .from("creator_followers")
          .select("id")
          .eq("creator_id", creatorId)
          .eq("user_id", viewerId)
          .maybeSingle();

        setIsFollowing(Boolean(followData));
      } else {
        setIsFollowing(false);
      }

      const { data: socialData } = await supabase
        .from("creator_social_links")
        .select("platform, url")
        .eq("creator_id", creatorId);

      const nextSocials: SocialForm = {};
      const nextYoutubeChannels: string[] = [];

      socialPlatforms.forEach((platform) => {
        nextSocials[platform] = "";
      });

      socialData?.forEach((item: any) => {
        const platform = String(item.platform || "").toLowerCase();
        const url = String(item.url || "");

        if (platform === "youtube") {
          if (url.trim().length > 0) {
            nextYoutubeChannels.push(url);
          }

          return;
        }

        nextSocials[platform] = url;
      });

      nextSocials.youtube = nextYoutubeChannels[0] || "";

      setSocials(nextSocials);
      setYoutubeChannels(nextYoutubeChannels.length > 0 ? nextYoutubeChannels : [""]);

      setClips([]);
      setPreparedCreatorId(creator.id);
    }

    loadCreatorData();
  }, [creator]);

  useEffect(() => {
    if (!creator) {
      setLiveStatus({});
      return;
    }

    const liveTargets = ["twitch", "kick", "discord"] as const;

    const targets: Array<{
      platform: "twitch" | "kick" | "youtube" | "discord";
      username: string;
      url?: string;
      index?: number;
    }> = [
      ...liveTargets
        .map((platform) => {
          const url = socials[platform] || "";
          const username = extractPlatformUsername(platform, url);

          return {
            platform,
            username,
            url,
          };
        })
        .filter((target) => target.username.length > 0),
      ...getNormalizedYoutubeChannels(youtubeChannels).map((channel) => ({
        platform: "youtube" as const,
        username: channel.username,
        url: channel.url,
        index: channel.originalIndex,
      })),
    ];

    if (targets.length === 0) {
      setLiveStatus({});
      return;
    }

    let cancelled = false;

    async function loadLiveStatuses() {
      setLiveStatusLoading(true);

      try {
        const results = await Promise.all(
          targets.map(async ({ platform, username, index }) => {
            try {
              const response = await fetch(
                `/api/live-status?platform=${platform}&username=${encodeURIComponent(username)}`
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
                  url: data.url || getPlatformFallbackUrl(platform, username),
                },
              };
            } catch (error) {
              console.error(`Erro ao carregar status da ${platform}:`, error);

              return {
                platform,
                index,
                status: {
                  platform,
                  username,
                  isLive: false,
                  url: getPlatformFallbackUrl(platform, username),
                },
              };
            }
          })
        );

        if (!cancelled) {
          setLiveStatus(
            results.reduce<LiveStatusMap>((accumulator, result) => {
              if (result.platform === "youtube") {
                accumulator[`youtube:${result.index ?? 0}`] = result.status;

                const currentYoutube = accumulator.youtube;
                const currentSubscriberCount =
                  currentYoutube?.subscriberCount ?? currentYoutube?.externalCount ?? 0;
                const nextSubscriberCount =
                  result.status.subscriberCount ?? result.status.externalCount ?? 0;

                accumulator.youtube = {
                  platform: "youtube",
                  username: "youtube",
                  isLive: false,
                  url: currentYoutube?.url || result.status.url,
                  subscriberCount: currentSubscriberCount + nextSubscriberCount,
                  externalCount: currentSubscriberCount + nextSubscriberCount,
                  title:
                    getNormalizedYoutubeChannels(youtubeChannels).length > 1
                      ? `${getNormalizedYoutubeChannels(youtubeChannels).length} ${translate(t, "creatorPopupYoutubeChannels", "channels")}`
                      : result.status.title,
                };

                return accumulator;
              }

              accumulator[result.platform] = result.status;

              return accumulator;
            }, {})
          );
        }
      } finally {
        if (!cancelled) {
          setLiveStatusLoading(false);
        }
      }
    }

    loadLiveStatuses();

    return () => {
      cancelled = true;
    };
  }, [creator, socials.twitch, socials.kick, socials.discord, youtubeChannels]);

  useEffect(() => {
    if (!creator) return;

    const twitchUsername = extractPlatformUsername("twitch", socials.twitch || "");
    const kickUsername = extractPlatformUsername("kick", socials.kick || "");
    const hasYoutubeChannels = getNormalizedYoutubeChannels(youtubeChannels).length > 0;
    const hasExternalTargets = Boolean(twitchUsername || kickUsername || hasYoutubeChannels);

    if (hasExternalTargets && Object.keys(liveStatus).length === 0) {
      return;
    }

    if (liveStatusLoading) {
      return;
    }

    const creatorId = creator.id;

    const externalReach = getCreatorExternalReachFromLiveStatus(liveStatus);
    const { powerScore, level } = calculateCreatorCardProgress({
      views: viewCount,
      followers: followerCount,
      shares: shareCount,
      externalReach,
    });

    setCreatorCardLevel(level);

    const progressKey = `${creatorId}:${powerScore}:${level}`;

    if (syncedCardProgressKey === progressKey) {
      return;
    }

    let cancelled = false;

    async function syncCreatorCardProgress() {
      const { error } = await supabase
        .from("creator_cards")
        .update({
          power_score: powerScore,
          level,
        })
        .eq("creator_id", creatorId);

      if (error) {
        console.error("Erro ao atualizar level da carta do criador:", error);
        return;
      }

      if (!cancelled) {
        setSyncedCardProgressKey(progressKey);
      }
    }

    syncCreatorCardProgress();

    return () => {
      cancelled = true;
    };
  }, [
    creator,
    viewCount,
    followerCount,
    shareCount,
    liveStatus,
    liveStatusLoading,
    socials.twitch,
    socials.kick,
    youtubeChannels,
    syncedCardProgressKey,
  ]);

  useEffect(() => {
    if (!creator) {
      setClips([]);
      return;
    }

    const twitchUsername = extractPlatformUsername("twitch", socials.twitch || "");
    const kickUsername = extractPlatformUsername("kick", socials.kick || "");
    const youtubeUrls = getNormalizedYoutubeChannels(youtubeChannels).map(
      (channel) => channel.url
    );

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
      } catch (error) {
        console.error("Erro ao carregar clips automáticos:", error);

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
  }, [creator, socials.twitch, socials.kick, youtubeChannels]);

  function getCreatorShareUrl() {
    if (!creator) return "";

    return `${window.location.origin}/creator/${creator.username}`;
  }

  async function copyCreatorLink() {
    const url = getCreatorShareUrl();

    if (!url) return;

    await navigator.clipboard.writeText(url);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  async function shareTo(platform: string) {
    if (!creator) return;

    const url = getCreatorShareUrl();
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(
      `Confira ${creator.nickname} no Cardpoc ✦`
    );

    const shareLinks: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    if (platform === "copy") {
      await registerShare();
      copyCreatorLink();
      return;
    }

    if (platform === "discord") {
      await registerShare();
      copyCreatorLink();
      window.open("https://discord.com/channels/@me", "_blank");
      return;
    }

    if (platform === "instagram") {
      await registerShare();
      copyCreatorLink();
      window.open("https://www.instagram.com/", "_blank");
      return;
    }

    const shareUrl = shareLinks[platform];

    if (shareUrl) {
      await registerShare();
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function registerShare() {
    if (!creator) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      await supabase.rpc("increment_creator_share_count", {
        creator_id_input: creator.id,
      });

      setShareCount((current) => current + 1);

      if (user) {
        await addXpAndNotifyLevelUp({
          userId: user.id,
          eventType: "share_profile",
          metadata: {
            creator_id: creatorId,
            creator_username: creator.username,
            creator_nickname: creator.nickname,
            shared_at: new Date().toISOString(),
          },
        });

        await updateMissionProgress("share_profile", 1, {
          creator_id: creatorId,
          creator_username: creator.username,
          creator_nickname: creator.nickname,
        });
      }
    } catch (error) {
      console.error("Erro ao registrar compartilhamento:", error);
    }
  }
  
  function handleShare() {
    setShareOpen(true);
  }

  async function handleFollow() {
    if (!creator) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(translate(t, "creatorPopupLoginToFollow", "Faça login para seguir este creator."));
      return;
    }

    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("creator_followers")
        .delete()
        .eq("creator_id", creatorId)
        .eq("user_id", user.id);

      if (error) {
        setFollowLoading(false);
        alert(error.message);
        return;
      }

      setIsFollowing(false);
      setFollowerCount((current) => Math.max(0, current - 1));
      setFollowLoading(false);
      return;
    }

    const { error } = await supabase.from("creator_followers").insert({
      creator_id: creatorId,
      user_id: user.id,
    });

    if (error) {
      setFollowLoading(false);
      alert(error.message);
      return;
    }

    const followAlreadyRewarded = await hasXpEvent(user.id, "follow_creator", {
      creator_id: creatorId,
    });

    if (!followAlreadyRewarded) {
      await addXpAndNotifyLevelUp({
        userId: user.id,
        eventType: "follow_creator",
        metadata: {
          creator_id: creatorId,
          creator_username: creator.username,
          creator_nickname: creator.nickname,
        },
      });

      await createUserNotification({
        userId: user.id,
        type: "follow_creator",
        title: `${translate(t, "creatorPopupFollowNotificationPrefix", "Você seguiu")} ${creator.nickname}`,
        message: translate(t, "creatorPopupFollowXpMessage", "Você ganhou XP por seguir um creator."),
        metadata: {
          creator_id: creatorId,
          creator_username: creator.username,
          creator_nickname: creator.nickname,
        },
      });

    }

    console.log("MISSÃO FOLLOW: follow salvo, atualizando progresso");

    await updateMissionProgress("follow_creator", 1, {
      creator_id: creatorId,
      creator_username: creator.username,
      creator_nickname: creator.nickname,
    });

    const { data: existingCard } = await supabase
      .from("user_cards")
      .select("id")
      .eq("creator_id", creatorId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingCard) {
      const { data: newCard, error: cardError } = await supabase
        .from("user_cards")
        .insert({
          creator_id: creatorId,
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
            creator_id: creatorId,
            creator_username: creator.username,
            creator_nickname: creator.nickname,
            card_id: newCard.id,
            rarity: "common",
            source: "follow",
          },
        });

        await createUserNotification({
          userId: user.id,
          type: "card_unlocked",
          title: "Nova carta conquistada!",
          message: `${translate(t, "creatorPopupCardNotificationPrefix", "Você ganhou a carta de")} ${creator.nickname}.`,
          metadata: {
            creator_id: creatorId,
            creator_username: creator.username,
            creator_nickname: creator.nickname,
            card_id: newCard.id,
            rarity: "common",
            source: "follow",
          },
        });

        await updateMissionProgress("collect_card", 1, {
          creator_id: creatorId,
          creator_username: creator.username,
          creator_nickname: creator.nickname,
          card_id: newCard.id,
          rarity: "common",
          source: "follow",
        });
      }
    }

    setIsFollowing(true);
    setFollowerCount((current) => current + 1);
    setFollowLoading(false);
  }

  async function uploadImage(file: File, type: "avatar" | "banner") {
    try {
      if (type === "avatar") {
        setUploadingAvatar(true);
      } else {
        setUploadingBanner(true);
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("creator-profiles")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("creator-profiles")
        .getPublicUrl(filePath);

      if (type === "avatar") {
        setAvatarUrl(data.publicUrl);
      } else {
        setBannerUrl(data.publicUrl);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingAvatar(false);
      setUploadingBanner(false);
    }
  }

  async function handleSave() {
    if (!creator || !isOwner) return;

    setSaving(true);

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const { error: profileError } = await supabase
      .from("creator_profiles")
      .update({
        nickname,
        title,
        category,
        bio,
        description,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creatorId);

    if (profileError) {
      setSaving(false);
      alert(profileError.message);
      return;
    }

    await supabase.from("creator_social_links").delete().eq("creator_id", creatorId);

    const socialRows = [
      ...Object.entries(socials)
        .filter(([platform, url]) => platform !== "youtube" && url.trim().length > 0)
        .map(([platform, url]) => ({
          creator_id: creatorId,
          platform,
          url,
        })),
      ...youtubeChannels
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({
          creator_id: creatorId,
          platform: "youtube",
          url,
        })),
    ];

    if (socialRows.length > 0) {
      const { error: socialError } = await supabase
        .from("creator_social_links")
        .insert(socialRows);

      if (socialError) {
        setSaving(false);
        alert(socialError.message);
        return;
      }
    }

    const updatedCreator: Creator = {
      ...creator,
      nickname,
      title,
      category,
      bio,
      description,
      avatarUrl,
      bannerUrl,
      tags,
    };

    onCreatorUpdated?.(updatedCreator);

    setSaving(false);
    alert(translate(t, "creatorPopupProfileUpdated", "Perfil atualizado com sucesso!"));
  }

  async function handleClaimProfile() {
    if (!creator || !currentUserId) {
      alert(translate(t, "creatorPopupLoginToClaim", "Faça login para reivindicar este perfil."));
      return;
    }

    if (!claimUrl) {
      alert(translate(t, "creatorPopupClaimUrlRequired", "Informe o link do canal ou perfil usado para verificação."));
      return;
    }

    if (!claimImageUsageConsent) {
      alert(
        translate(
          t,
          "creatorImageConsentRequired",
          "Para enviar a solicitação, você precisa autorizar o uso da sua imagem para criação das cartas personalizadas."
        )
      );
      return;
    }

    const consentAcceptedAt = new Date().toISOString();

    setClaimSending(true);

    const { error } = await supabase.from("creator_claims").insert({
      creator_id: creatorId,
      user_id: currentUserId,
      verification_platform: claimPlatform,
      verification_url: claimUrl,
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

  if (!creator) return null;

  const isPreparingCreator = preparedCreatorId !== creator.id;
  const twitchLiveStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickLiveStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");
  const isLiveOnAnyPlatform = Boolean(
    twitchLiveStatus?.isLive || kickLiveStatus?.isLive
  );
  const displayedStatus = isLiveOnAnyPlatform ? "live" : creator.status;

  function getTranslatedStatusLabel(status: keyof typeof statusLabel) {
    if (status === "online") return translate(t, "creatorPopupStatusOnline", "Online");
    if (status === "offline") return translate(t, "creatorPopupStatusOffline", "Offline");
    if (status === "live") return translate(t, "creatorPopupStatusLive", "Live now");
    if (status === "trending") return translate(t, "creatorPopupStatusTrending", "Trending");
    if (status === "event") return translate(t, "creatorPopupStatusEvent", "In event");

    return statusLabel[status];
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      >
        <button
          onClick={onClose}
          className="absolute inset-0"
          aria-label={translate(t, "creatorPopupCloseAria", "Fechar popup")}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative grid h-[88vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.9)] md:grid-cols-[360px_1fr]"
        >
          <div className="relative hidden overflow-hidden bg-black md:block">
            <motion.img
              src={avatarUrl || creator.avatarUrl}
              alt={nickname || creator.nickname}
              initial={{ scale: 1.08, x: 0, y: 0 }}
              animate={{
                scale: [1.08, 1.14, 1.1, 1.08],
                x: [0, -10, 8, 0],
                y: [0, -8, 6, 0],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 h-full w-full object-cover object-center opacity-80"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

            <div className="absolute left-5 top-5 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-yellow-100 backdrop-blur">
              {getRarityLabel(creator.rarity)}
            </div>

            <div className="absolute right-5 top-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs text-cyan-100 backdrop-blur">
              {translate(t, "creatorPopupLevelPrefix", "Lv.")} {creatorCardLevel}
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <div
                className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur ${
                  displayedStatus === "live"
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : displayedStatus === "offline"
                      ? "border-white/10 bg-white/[0.04] text-white/55"
                      : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    displayedStatus === "live"
                      ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]"
                      : displayedStatus === "offline"
                        ? "bg-white/35"
                        : "bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                  }`}
                />
                {getTranslatedStatusLabel(displayedStatus)}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-black transition hover:scale-105 disabled:opacity-50"
                >
                  {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  {isFollowing
                    ? translate(t, "creatorPopupFollowing", "Seguindo")
                    : translate(t, "creatorPopupFollow", "Seguir")}
                </button>

                <button
                  onClick={handleShare}
                  className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                >
                  {translate(t, "creatorPopupShare", "Compartilhar")}
                </button>

                <Link
                  href={`/creator/${encodeURIComponent(creator.username)}`}
                  onClick={onClose}
                  prefetch
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:scale-105 hover:bg-cyan-300/20"
                >
                  {translate(t, "creatorPopupFullPage", "Ir para a página completa")}
                </Link>

                {canClaim && (
                  <button
                    onClick={() => setClaimMode(true)}
                    className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/20"
                  >
                    {translate(t, "creatorPopupClaimMine", "Este perfil é meu")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative h-full overflow-hidden text-white">
            <div className="absolute right-5 top-5 z-20 flex gap-2">
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
                >
                {translate(t, "creatorPopupClose", "Fechar")}
              </button>
            </div>

            <div
              className="no-scrollbar h-full overflow-y-auto p-6 pr-10 md:p-8 md:pr-12"
              style={{
                width: "calc(100% - 18px)",
                marginRight: "18px",
              }}
            >
              {isPreparingCreator ? (
  <div className="flex h-full items-center justify-center text-white/50">
    {translate(t, "creatorPopupLoadingProfile", "Carregando perfil...")}
  </div>
) : claimMode ? (
                <ClaimPanel
                  t={t}
                  claimPlatform={claimPlatform}
                  setClaimPlatform={setClaimPlatform}
                  claimUrl={claimUrl}
                  setClaimUrl={setClaimUrl}
                  claimImageUsageConsent={claimImageUsageConsent}
                  setClaimImageUsageConsent={setClaimImageUsageConsent}
                  claimCode={claimCode}
                  claimSending={claimSending}
                  claimSuccess={claimSuccess}
                  onSubmit={handleClaimProfile}
                  onBack={() => setClaimMode(false)}
                />
              ) : (
                <ViewPanel
                  t={t}
  creator={creator}
  bio={bio}
  title={title}
  description={description}
  tagsText={tagsText}
  socials={socials}
  youtubeChannels={youtubeChannels}
  clips={clips}
  clipsLoading={clipsLoading}
  viewCount={viewCount}
  followerCount={followerCount}
  shareCount={shareCount}
  liveStatus={liveStatus}
  liveStatusLoading={liveStatusLoading}
/>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {shareOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
        >
          <button
            onClick={() => setShareOpen(false)}
            className="absolute inset-0"
            aria-label={translate(t, "creatorPopupCloseShareAria", "Fechar compartilhamento")}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_0_70px_rgba(0,0,0,0.9)]"
          >
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-[70px]" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-purple-500/20 blur-[70px]" />

            <div className="relative z-10">
              <div className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
                {translate(t, "creatorPopupShareBadge", "Share Profile")}
              </div>

              <h3 className="mt-5 text-2xl font-black">
                {translate(t, "creatorPopupShare", "Compartilhar")} perfil
              </h3>

              <p className="mt-2 text-sm text-white/50">
                {translate(t, "creatorPopupShareDescriptionPrefix", "Compartilhe o perfil de")}{" "}
                {creator.nickname}{" "}
                {translate(t, "creatorPopupShareDescriptionSuffix", "usando o link com preview do Cardpoc.")}
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/45">
                {getCreatorShareUrl()}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <ShareButton label="WhatsApp" onClick={() => shareTo("whatsapp")} />
                <ShareButton label="X / Twitter" onClick={() => shareTo("x")} />
                <ShareButton label="Telegram" onClick={() => shareTo("telegram")} />
                <ShareButton label="Facebook" onClick={() => shareTo("facebook")} />
                <ShareButton label="LinkedIn" onClick={() => shareTo("linkedin")} />
                <ShareButton label="Discord" onClick={() => shareTo("discord")} />
                <ShareButton label="Instagram" onClick={() => shareTo("instagram")} />
                <ShareButton
                  label={copied
                    ? translate(t, "creatorPopupLinkCopied", "Link copiado!")
                    : translate(t, "creatorPopupCopyLink", "Copiar link")}
                  onClick={() => shareTo("copy")}
                  full
                />
              </div>

              <button
                onClick={() => setShareOpen(false)}
                className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
                >
                {translate(t, "creatorPopupClose", "Fechar")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShareButton({
  label,
  onClick,
  full = false,
}: {
  label: string;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10 ${
        full ? "col-span-2" : ""
      }`}
    >
      {label}
    </button>
  );
}

function EditPanel({
  t,
  nickname,
  setNickname,
  title,
  setTitle,
  category,
  setCategory,
  bio,
  setBio,
  description,
  setDescription,
  avatarUrl,
  setAvatarUrl,
  bannerUrl,
  setBannerUrl,
  tagsText,
  setTagsText,
  socials,
  setSocials,
  youtubeChannels,
  setYoutubeChannels,
  uploadingAvatar,
  uploadingBanner,
  uploadImage,
  saving,
  handleSave,
}: {
  t: (key: any) => string;
  nickname: string;
  setNickname: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  avatarUrl: string;
  setAvatarUrl: (value: string) => void;
  bannerUrl: string;
  setBannerUrl: (value: string) => void;
  tagsText: string;
  setTagsText: (value: string) => void;
  socials: SocialForm;
  setSocials: React.Dispatch<React.SetStateAction<SocialForm>>;
  youtubeChannels: string[];
  setYoutubeChannels: React.Dispatch<React.SetStateAction<string[]>>;
  uploadingAvatar: boolean;
  uploadingBanner: boolean;
  uploadImage: (file: File, type: "avatar" | "banner") => void;
  saving: boolean;
  handleSave: () => void;
}) {
  function updateYoutubeChannel(index: number, value: string) {
    setYoutubeChannels((current) =>
      current.map((channel, channelIndex) =>
        channelIndex === index ? value : channel
      )
    );

    if (index === 0) {
      setSocials((current) => ({
        ...current,
        youtube: value,
      }));
    }
  }

  function addYoutubeChannel() {
    setYoutubeChannels((current) => [...current, ""]);
  }

  function removeYoutubeChannel(index: number) {
    setYoutubeChannels((current) => {
      const nextChannels = current.filter((_, channelIndex) => channelIndex !== index);
      const safeChannels = nextChannels.length > 0 ? nextChannels : [""];

      setSocials((currentSocials) => ({
        ...currentSocials,
        youtube: safeChannels[0] || "",
      }));

      return safeChannels;
    });
  }

  return (
    <div className="pb-10 pr-16">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
        {translate(t, "creatorPopupEditModeBadge", "Edit Mode")}
      </p>

      <h3 className="mt-3 text-3xl font-bold">{translate(t, "creatorPopupEditProfileTitle", "Editar perfil")}</h3>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <EditInput label={translate(t, "creatorPopupFieldNickname", "Nickname")} value={nickname} onChange={setNickname} />
        <EditInput label={translate(t, "creatorPopupFieldTitle", "Title")} value={title} onChange={setTitle} />
        <EditInput label={translate(t, "creatorPopupFieldCategory", "Categoria")} value={category} onChange={setCategory} />
        <EditInput label={translate(t, "creatorPopupFieldAvatarUrl", "Avatar URL")} value={avatarUrl} onChange={setAvatarUrl} />

        <UploadField
          label={translate(t, "creatorPopupFieldUploadAvatar", "Upload Avatar")}
          uploading={uploadingAvatar}
          uploadingText={translate(t, "creatorPopupUploadingAvatar", "Enviando avatar...")}
          chooseFileText={translate(t, "creatorPopupChooseFile", "Escolher arquivo")}
          onFile={(file) => uploadImage(file, "avatar")}
        />

        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={translate(t, "creatorPopupAvatarPreviewAlt", "Avatar preview")}
            className="h-28 w-28 rounded-2xl border border-white/10 object-cover"
          />
        )}

        <div className="sm:col-span-2">
          <EditInput label={translate(t, "creatorPopupFieldBannerUrl", "Banner URL")} value={bannerUrl} onChange={setBannerUrl} />
        </div>

        <div className="sm:col-span-2">
          <UploadField
            label={translate(t, "creatorPopupFieldUploadBanner", "Upload Banner")}
            uploading={uploadingBanner}
            uploadingText={translate(t, "creatorPopupUploadingBanner", "Enviando banner...")}
            chooseFileText={translate(t, "creatorPopupChooseFile", "Escolher arquivo")}
            onFile={(file) => uploadImage(file, "banner")}
          />
        </div>

        {bannerUrl && (
          <div className="sm:col-span-2">
            <img
              src={bannerUrl}
              alt={translate(t, "creatorPopupBannerPreviewAlt", "Banner preview")}
              className="h-32 w-full rounded-2xl border border-white/10 object-cover"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <EditTextarea label={translate(t, "creatorPopupFieldShortBio", "Bio curta")} value={bio} onChange={setBio} />
        </div>

        <div className="sm:col-span-2">
          <EditTextarea
            label={translate(t, "creatorPopupFieldFullDescription", "Descrição completa")}
            value={description}
            onChange={setDescription}
          />
        </div>

        <div className="sm:col-span-2">
          <EditInput
            label={translate(t, "creatorPopupFieldTags", "Tags separadas por vírgula")}
            value={tagsText}
            onChange={setTagsText}
            placeholder="Streamer, MMORPG, Black Desert"
          />
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
        <h4 className="font-bold text-white">{translate(t, "creatorPopupSocialLinksTitle", "Redes Sociais")}</h4>

        <p className="mt-2 text-sm text-white/45">
          {translate(t, "creatorPopupSocialLinksDescription", "Adicione os links oficiais do creator.")}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                youtube
              </p>

              <button
                type="button"
                onClick={addYoutubeChannel}
                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
              >
                {translate(t, "creatorPopupAddYoutubeChannel", "+ Add channel")}
              </button>
            </div>

            <div className="mt-3 grid gap-3">
              {youtubeChannels.map((channelUrl, index) => (
                <div key={`youtube-channel-${index}`} className="flex gap-2">
                  <input
                    value={channelUrl}
                    onChange={(event) =>
                      updateYoutubeChannel(index, event.target.value)
                    }
                    placeholder={`${translate(t, "creatorPopupSocialLinkPlaceholderPrefix", "Link do")} youtube ${index + 1}`}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                  />

                  {youtubeChannels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeYoutubeChannel(index)}
                      className="shrink-0 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20"
                      aria-label={translate(t, "creatorPopupRemoveYoutubeChannel", "Remove YouTube channel")}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {socialPlatforms
            .filter((platform) => platform !== "youtube")
            .map((platform) => (
              <EditInput
                key={platform}
                label={platform}
                value={socials[platform] || ""}
                onChange={(value) =>
                  setSocials((current) => ({
                    ...current,
                    [platform]: value,
                  }))
                }
                placeholder={`${translate(t, "creatorPopupSocialLinkPlaceholderPrefix", "Link do")} ${platform}`}
              />
            ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-purple-300/15 bg-purple-300/[0.04] p-5">
        <h4 className="font-bold text-white">
          {translate(t, "creatorPopupAutoClipsTitle", "Clips automáticos")}
        </h4>

        <p className="mt-2 text-sm text-white/45">
          {translate(t, "creatorPopupAutoClipsDescription", "Os clips agora são puxados automaticamente da Twitch, Kick e YouTube Shorts com base nos links das redes sociais cadastradas.")}
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-50"
      >
        <Save size={16} />
        {saving
          ? translate(t, "creatorPopupSaving", "Salvando...")
          : translate(t, "creatorPopupSaveChanges", "Salvar alterações")}
      </button>
    </div>
  );
}

function ClaimPanel({
  t,
  claimPlatform,
  setClaimPlatform,
  claimUrl,
  setClaimUrl,
  claimImageUsageConsent,
  setClaimImageUsageConsent,
  claimCode,
  claimSending,
  claimSuccess,
  onSubmit,
  onBack,
}: {
  t: (key: any) => string;
  claimPlatform: string;
  setClaimPlatform: (value: string) => void;
  claimUrl: string;
  setClaimUrl: (value: string) => void;
  claimImageUsageConsent: boolean;
  setClaimImageUsageConsent: (value: boolean) => void;
  claimCode: string;
  claimSending: boolean;
  claimSuccess: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  if (claimSuccess) {
    return (
      <div className="pb-10 pr-16">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          {translate(t, "creatorPopupClaimSentBadge", "Claim Sent")}
        </p>

        <h3 className="mt-3 text-3xl font-bold">{translate(t, "creatorPopupClaimSentTitle", "Solicitação enviada")}</h3>

        <p className="mt-4 text-white/60">
          {translate(t, "creatorPopupClaimSentDescription", "Agora coloque o código abaixo na bio, descrição ou sobre da plataforma informada. Um administrador irá revisar sua solicitação.")}
        </p>

        <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 text-center text-2xl font-black tracking-[0.25em] text-cyan-100">
          {claimCode}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 pr-16">
      <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
        {translate(t, "creatorPopupClaimProfileBadge", "Claim Profile")}
      </p>

      <h3 className="mt-3 text-3xl font-bold">{translate(t, "creatorPopupClaimMine", "Este perfil é meu")}</h3>

      <p className="mt-4 text-white/60">
        {translate(t, "creatorPopupClaimDescription", "Para provar que este perfil pertence a você, informe uma plataforma oficial e coloque temporariamente o código abaixo na bio/descrição do canal.")}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr]">
        <select
          value={claimPlatform}
          onChange={(event) => setClaimPlatform(event.target.value)}
          className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
        >
          {socialPlatforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        <input
          value={claimUrl}
          onChange={(event) => setClaimUrl(event.target.value)}
          placeholder={translate(t, "creatorPopupClaimUrlPlaceholder", "Link do canal ou perfil oficial")}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
          {translate(t, "creatorPopupVerificationCode", "Código de verificação")}
        </p>

        <p className="mt-2 text-xl font-black tracking-[0.25em] text-white">
          {claimCode}
        </p>
      </div>

      <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-sm leading-relaxed text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]">
        <input
          type="checkbox"
          checked={claimImageUsageConsent}
          onChange={(event) => setClaimImageUsageConsent(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
        />

        <span>
          <strong className="block text-cyan-100">
            {translate(t, "creatorImageConsentTitle", "Autorização de uso de imagem")}
          </strong>

          <span className="mt-1 block text-white/55">
            {translate(
              t,
              "creatorImageConsentDescription",
              "Autorizo o Cardpoc a utilizar minha imagem, nome artístico, identidade pública e conteúdos enviados ou vinculados por mim para criar cartas digitais personalizadas dentro da plataforma."
            )}
          </span>
        </span>
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onSubmit}
          disabled={claimSending || !claimImageUsageConsent}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-50"
        >
          <Send size={16} />
          {claimSending
            ? translate(t, "creatorPopupSending", "Enviando...")
            : translate(t, "creatorPopupSendClaim", "Enviar reivindicação")}
        </button>

        <button
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white/70 hover:bg-white/[0.08]"
        >
          {translate(t, "creatorPopupBack", "Voltar")}
        </button>
      </div>
    </div>
  );
}

function ViewPanel({
  t,
  creator,
  bio,
  title,
  description,
  tagsText,
  socials,
  youtubeChannels,
  clips,
  clipsLoading,
  viewCount,
  followerCount,
  shareCount,
  liveStatus,
  liveStatusLoading,
}: {
  t: (key: any) => string;
  creator: Creator;
  bio: string;
  title: string;
  description: string;
  tagsText: string;
  socials: SocialForm;
  youtubeChannels: string[];
  clips: AutoClip[];
  clipsLoading: boolean;
  viewCount: number;
  followerCount: number;
  shareCount: number;
  liveStatus: LiveStatusMap;
  liveStatusLoading: boolean;
}) {
  const visibleClips = clips.filter((clip) => Boolean(clip.url?.trim() || clip.thumbnailUrl?.trim() || clip.title?.trim()));
  const [clipPage, setClipPage] = useState(0);
  const clipsPerPage = 3;
  const totalClipPages = Math.ceil(visibleClips.length / clipsPerPage);
  const hasClipCarousel = visibleClips.length > clipsPerPage;
  const visibleCarouselClips = visibleClips.slice(
    clipPage * clipsPerPage,
    clipPage * clipsPerPage + clipsPerPage
  );

  useEffect(() => {
    if (clipPage > Math.max(totalClipPages - 1, 0)) {
      setClipPage(0);
    }
  }, [clipPage, totalClipPages]);

  function goToPreviousClips() {
    setClipPage((current) =>
      current === 0 ? Math.max(totalClipPages - 1, 0) : current - 1
    );
  }

  function goToNextClips() {
    setClipPage((current) =>
      current >= totalClipPages - 1 ? 0 : current + 1
    );
  }

  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");

  const externalTotal = getCreatorExternalReachFromLiveStatus(liveStatus);
  const profileTitle = title || creator.title;
  const rawProfileDescription = bio || creator.bio || description || creator.description || "";
  const profileDescription =
    rawProfileDescription.trim() ===
    "Este perfil foi aprovado e poderá ser personalizado pelo criador em breve."
      ? ""
      : rawProfileDescription.trim();
  const tagItems = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const [youtubeChannelsOpen, setYoutubeChannelsOpen] = useState(false);

  const visibleYoutubeChannels = getNormalizedYoutubeChannels(youtubeChannels);

  const youtubeChannelItems = visibleYoutubeChannels.map((channel, index) => {
    const channelStatus = getPlatformLiveStatus(
      liveStatus,
      `youtube:${channel.originalIndex}`
    );

    const fallbackTitle = getYoutubeChannelFallbackTitle(
      channel,
      `${translate(t, "creatorPopupYoutubeChannelFallback", "Channel")} ${index + 1}`
    );

    return {
      url: channelStatus?.url || channel.url,
      title: channelStatus?.title || fallbackTitle,
      thumbnail: channelStatus?.thumbnail,
      subscriberCount:
        channelStatus?.subscriberCount ?? channelStatus?.externalCount ?? 0,
    };
  });

  return (
    <>
      <div className="pr-16">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
          {creator.category}
        </p>

        <h3 className="mt-3 text-3xl font-black leading-tight text-white">
          {creator.nickname}
        </h3>

        <p className="mt-1 text-sm text-white/45">@{creator.username}</p>

        {profileTitle && (
          <p className="mt-4 text-sm font-semibold text-cyan-100">
            {profileTitle}
          </p>
        )}

        {profileDescription && (
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-white/65">
            {profileDescription}
          </p>
        )}
      </div>

      {tagItems.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-white/85">
            {translate(t, "creatorPopupTags", "Tags")}
          </h4>

          <div className="mt-3 flex flex-wrap gap-2">
            {tagItems.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-xs font-semibold text-cyan-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard label={translate(t, "creatorPopupViews", "Views")} value={viewCount.toLocaleString("pt-BR")} color="text-cyan-200" />
        <InfoCard label={translate(t, "creatorPopupFollowers", "Seguidores do site")} value={followerCount.toLocaleString("pt-BR")} color="text-purple-200" />
        <InfoCard label={translate(t, "creatorProfileGlobalFollowers", "Seguidores Globais")} value={externalTotal.toLocaleString("pt-BR")} color="text-emerald-200" />
        <InfoCard label={translate(t, "creatorPopupShares", "Compartilhamentos")} value={shareCount.toLocaleString("pt-BR")} color="text-yellow-200" />
      </div>

      {(clipsLoading || visibleClips.length > 0) && (
        <div className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-bold">
              {translate(t, "creatorPopupFeaturedClipsViewTitle", "Clips em destaque")}
            </h4>

            {hasClipCarousel && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousClips}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
                  aria-label={translate(t, "creatorPopupPreviousClips", "Clips anteriores")}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={goToNextClips}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
                  aria-label={translate(t, "creatorPopupNextClips", "Próximos clips")}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {clipsLoading ? (
            <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/45">
              {translate(t, "creatorPopupClipsLoading", "Carregando clips automáticos...")}
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {visibleCarouselClips.map((clip, index) => {
              const previewThumbnail = clip.thumbnailUrl;
              const clipHref = getSafeClipHref(clip, socials);

              return (
                <a
                  key={`${clip.id || clip.url || clip.title}-${clipPage}-${index}`}
                  href={clipHref}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:bg-white/[0.07]"
                >
                  <div className="aspect-video bg-black/40">
                    {previewThumbnail ? (
                      <img
                        src={previewThumbnail}
                        alt={clip.title || translate(t, "creatorPopupClipAlt", "Clip")}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.25em] text-white/35">
                        {translate(t, `creatorPopupPlatform${clip.platform.charAt(0).toUpperCase()}${clip.platform.slice(1)}` as any, clip.platform)}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                      {translate(t, `creatorPopupPlatform${clip.platform.charAt(0).toUpperCase()}${clip.platform.slice(1)}` as any, clip.platform)}
                    </p>

                    <p className="mt-2 font-bold text-white">
                      {clip.title || translate(t, "creatorPopupFeaturedClipFallback", "Clip automático")}
                    </p>

                    {clip.description && (
                      <p className="mt-2 line-clamp-3 text-xs text-white/45">
                        {clip.description}
                      </p>
                    )}
                  </div>
                </a>
              );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-7 pb-10">
        <h4 className="font-bold">{translate(t, "creatorPopupSocialNetworks", "Redes Sociais")}</h4>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {[
            ...Object.entries(socials).filter(
              ([platform, url]) => platform !== "youtube" && url.trim().length > 0
            ),
            ...(visibleYoutubeChannels.length > 0
              ? [["youtube", visibleYoutubeChannels[0].url] as [string, string]]
              : []),
          ].map(([platform, url]) => {
              const normalizedPlatform = platform.toLowerCase();
              const platformLiveStatus = getPlatformLiveStatus(
                liveStatus,
                normalizedPlatform
              );
              const supportsLiveStatus =
                normalizedPlatform === "twitch" ||
                normalizedPlatform === "kick";
              const supportsExternalCount =
                normalizedPlatform === "twitch" ||
                normalizedPlatform === "kick" ||
                normalizedPlatform === "youtube" ||
                normalizedPlatform === "discord";
              const isPlatformLive = Boolean(platformLiveStatus?.isLive);
              const platformUrl = platformLiveStatus?.url || url;
              const platformExternalCount = getLiveStatusExternalCount(platformLiveStatus);
              const platformExternalLabel = getPlatformMetricLabel(
                t,
                normalizedPlatform
              );
              const platformName = getPlatformDisplayName(normalizedPlatform);

              if (normalizedPlatform === "youtube") {
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => {
                      if (visibleYoutubeChannels.length > 1) {
                        setYoutubeChannelsOpen(true);
                        return;
                      }

                      window.open(platformUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="flex min-h-[78px] min-w-0 flex-col justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-left text-sm text-cyan-100 transition hover:scale-[1.02] hover:bg-cyan-300/20"
                  >
                    <span className="block truncate font-bold uppercase tracking-[0.18em]">
                      {visibleYoutubeChannels.length > 1
                        ? `YOUTUBE (${visibleYoutubeChannels.length})`
                        : "YOUTUBE"}
                    </span>

                    <span className="mt-2 block min-h-[16px] truncate text-xs text-white/55">
                      {liveStatusLoading && !platformLiveStatus
                        ? translate(t, "creatorPopupLoading", "Loading...")
                        : visibleYoutubeChannels.length > 1
                          ? `${visibleYoutubeChannels.length} ${translate(t, "creatorPopupYoutubeChannels", "channels")}`
                          : " "}
                    </span>

                    <span className="mt-1 block min-h-[16px] truncate text-xs text-white/40">
                      {platformLiveStatus
                        ? `${platformExternalCount.toLocaleString("pt-BR")} ${platformExternalLabel}`
                        : " "}
                    </span>
                  </button>
                );
              }

              return (
                <a
                  key={platform}
                  href={platformUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex min-h-[78px] min-w-0 flex-col justify-center rounded-2xl border px-3 py-3 text-sm transition hover:scale-[1.02] ${
                    isPlatformLive
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20"
                      : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
                  }`}
                >
                  <span className="block truncate font-bold uppercase tracking-[0.18em]">
                    {platformName}
                  </span>

                  <span className="mt-2 block min-h-[16px] truncate text-xs text-white/55">
                    {supportsLiveStatus
                      ? liveStatusLoading && !platformLiveStatus
                        ? translate(t, "creatorPopupCheckingLive", "Checking live...")
                        : isPlatformLive
                          ? `${(platformLiveStatus?.viewerCount || 0).toLocaleString("pt-BR")} ${translate(t, "creatorPopupViewers", "viewers")}`
                          : translate(t, "creatorPopupStatusOffline", "Offline")
                      : supportsExternalCount && liveStatusLoading && !platformLiveStatus
                        ? translate(t, "creatorPopupLoading", "Loading...")
                        : " "}
                  </span>

                  <span className="mt-1 block min-h-[16px] truncate text-xs text-white/40">
                    {supportsExternalCount && platformLiveStatus
                      ? `${platformExternalCount.toLocaleString("pt-BR")} ${platformExternalLabel}`
                      : supportsLiveStatus &&
                        isPlatformLive &&
                        platformLiveStatus?.gameName
                        ? platformLiveStatus.gameName
                        : " "}
                  </span>
                </a>
              );
            })}
        </div>
      </div>
      {youtubeChannelsOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4">
          <button
            className="absolute inset-0"
            onClick={() => setYoutubeChannelsOpen(false)}
            aria-label={translate(t, "creatorPopupCloseYoutubeChannels", "Close YouTube channels")}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-zinc-950 p-6 text-white shadow-[0_0_70px_rgba(0,0,0,0.9)]">
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-red-500/20 blur-[70px]" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-[70px]" />

            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
                YouTube
              </p>

              <h3 className="mt-3 text-2xl font-black">
                {translate(t, "creatorPopupYoutubeChannelsTitle", "YouTube Channels")}
              </h3>

              <p className="mt-2 text-sm text-white/45">
                {translate(t, "creatorPopupYoutubeChannelsDescription", "Choose which channel you want to open.")}
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
                        {channel.subscriberCount.toLocaleString("pt-BR")} {translate(t, "creatorPopupYoutubeSubscribers", "subscribers")}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              <button
                onClick={() => setYoutubeChannelsOpen(false)}
                className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
              >
                {translate(t, "creatorPopupClose", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UploadField({
  label,
  uploading,
  uploadingText,
  chooseFileText,
  onFile,
}: {
  label: string;
  uploading: boolean;
  uploadingText: string;
  chooseFileText: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>

      <div className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]">
        <ImagePlus size={18} />
        {chooseFileText}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />

      {uploading && <p className="mt-2 text-xs text-cyan-300">{uploadingText}</p>}
    </label>
  );
}

function InfoCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="break-words text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/35">{label}</p>
      <p className={`mt-2 truncate text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
      />
    </label>
  );
}

function EditTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
      />
    </label>
  );
}
