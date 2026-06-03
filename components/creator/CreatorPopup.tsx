"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Pencil, Save, Send, UserCheck, UserPlus } from "lucide-react";
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

const clipPlatforms = ["youtube", "twitch", "tiktok", "kick"];

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
};

type LiveStatusMap = Partial<Record<string, LiveStatus>>;

type ClipForm = {
  title: string;
  platform: string;
  url: string;
  thumbnailUrl: string;
  description: string;
};

const emptyClip = (): ClipForm => ({
  title: "",
  platform: "youtube",
  url: "",
  thumbnailUrl: "",
  description: "",
});

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

  return `https://twitch.tv/${username}`;
}

const VIEW_INTERVAL_MS = 24 * 60 * 60 * 1000;


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
      message: "Seu perfil evoluiu no Creator Nexus.",
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

function getYouTubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "");
    }

    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }

    const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) {
      return shortsMatch[1];
    }

    const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch?.[1]) {
      return embedMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

function getClipPreviewThumbnail(url: string) {
  const youtubeId = getYouTubeVideoId(url);

  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  return "";
}

async function resolveClipThumbnail(url: string) {
  const youtubeThumbnail = getClipPreviewThumbnail(url);

  if (youtubeThumbnail) {
    return youtubeThumbnail;
  }

  try {
    const response = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      return "";
    }

    const data = await response.json();

    return data?.thumbnail_url || "";
  } catch {
    return "";
  }
}


export function CreatorPopup({ creator, onClose }: CreatorPopupProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [preparedCreatorId, setPreparedCreatorId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
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
  const [clips, setClips] = useState<ClipForm[]>([
    emptyClip(),
    emptyClip(),
    emptyClip(),
  ]);

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
    setEditMode(false);
    setClaimMode(false);
    setClaimSuccess(false);
    setClaimUrl("");
    setShareOpen(false);
    setLiveStatus({});

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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const viewerId = user?.id || null;

      const viewKey = `creator-view:${creator.id}:${viewerId || "guest"}`;
      const lastViewAt = Number(localStorage.getItem(viewKey) || 0);
      const now = Date.now();

      if (!lastViewAt || now - lastViewAt > VIEW_INTERVAL_MS) {
        const { error: viewError } = await supabase.from("creator_views").insert({
          creator_id: creator.id,
          viewer_id: viewerId,
        });

        if (!viewError) {
          localStorage.setItem(viewKey, String(now));
        }
      }

      const { count: views } = await supabase
        .from("creator_views")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creator.id);

      const { count: followers } = await supabase
        .from("creator_followers")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creator.id);

      const { data: creatorStats } = await supabase
        .from("creator_profiles")
        .select("share_count")
        .eq("id", creator.id)
        .maybeSingle();

      setViewCount(views || 0);
      setFollowerCount(followers || 0);
      setShareCount(creatorStats?.share_count || 0);

      if (viewerId) {
        const { data: followData } = await supabase
          .from("creator_followers")
          .select("id")
          .eq("creator_id", creator.id)
          .eq("user_id", viewerId)
          .maybeSingle();

        setIsFollowing(Boolean(followData));
      } else {
        setIsFollowing(false);
      }

      const { data: socialData } = await supabase
        .from("creator_social_links")
        .select("platform, url")
        .eq("creator_id", creator.id);

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

      const { data: clipData } = await supabase
        .from("creator_featured_moments")
        .select("title, platform, url, thumbnail_url, description")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: true })
        .limit(3);

      const nextClips = [emptyClip(), emptyClip(), emptyClip()];

      clipData?.forEach((clip: any, index: number) => {
        nextClips[index] = {
          title: clip.title || "",
          platform: clip.platform || "youtube",
          url: clip.url || "",
          thumbnailUrl: clip.thumbnail_url || "",
          description: clip.description || "",
        };
      });

      setClips(nextClips);
      setPreparedCreatorId(creator.id);
    }

    loadCreatorData();
  }, [creator]);

  useEffect(() => {
    if (!creator) {
      setLiveStatus({});
      return;
    }

    const liveTargets = ["twitch", "kick"] as const;

    const targets: Array<{
      platform: "twitch" | "kick" | "youtube";
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
      ...youtubeChannels
        .map((url, index) => {
          const username = extractPlatformUsername("youtube", url);

          return {
            platform: "youtube" as const,
            username,
            url,
            index,
          };
        })
        .filter((target) => target.username.length > 0),
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
                    youtubeChannels.filter((channel) => channel.trim().length > 0)
                      .length > 1
                      ? `${youtubeChannels.filter((channel) => channel.trim().length > 0).length} canais`
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
      `Confira ${creator.nickname} no Creator Nexus ✦`
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
            creator_id: creator.id,
            creator_username: creator.username,
            creator_nickname: creator.nickname,
            shared_at: new Date().toISOString(),
          },
        });

        await updateMissionProgress("share_profile", 1, {
          creator_id: creator.id,
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
        .eq("creator_id", creator.id)
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
      creator_id: creator.id,
      user_id: user.id,
    });

    if (error) {
      setFollowLoading(false);
      alert(error.message);
      return;
    }

    const followAlreadyRewarded = await hasXpEvent(user.id, "follow_creator", {
      creator_id: creator.id,
    });

    if (!followAlreadyRewarded) {
      await addXpAndNotifyLevelUp({
        userId: user.id,
        eventType: "follow_creator",
        metadata: {
          creator_id: creator.id,
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
          creator_id: creator.id,
          creator_username: creator.username,
          creator_nickname: creator.nickname,
        },
      });

    }

    console.log("MISSÃO FOLLOW: follow salvo, atualizando progresso");

    await updateMissionProgress("follow_creator", 1, {
      creator_id: creator.id,
      creator_username: creator.username,
      creator_nickname: creator.nickname,
    });

    const { data: existingCard } = await supabase
      .from("user_cards")
      .select("id")
      .eq("creator_id", creator.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingCard) {
      const { data: newCard, error: cardError } = await supabase
        .from("user_cards")
        .insert({
          creator_id: creator.id,
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
            creator_id: creator.id,
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
            creator_id: creator.id,
            creator_username: creator.username,
            creator_nickname: creator.nickname,
            card_id: newCard.id,
            rarity: "common",
            source: "follow",
          },
        });

        await updateMissionProgress("collect_card", 1, {
          creator_id: creator.id,
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
      .eq("id", creator.id);

    if (profileError) {
      setSaving(false);
      alert(profileError.message);
      return;
    }

    await supabase.from("creator_social_links").delete().eq("creator_id", creator.id);

    const socialRows = [
      ...Object.entries(socials)
        .filter(([platform, url]) => platform !== "youtube" && url.trim().length > 0)
        .map(([platform, url]) => ({
          creator_id: creator.id,
          platform,
          url,
        })),
      ...youtubeChannels
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({
          creator_id: creator.id,
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

    await supabase
      .from("creator_featured_moments")
      .delete()
      .eq("creator_id", creator.id);

    const clipRows = await Promise.all(
      clips
        .filter((clip) => clip.url.trim().length > 0)
        .slice(0, 3)
        .map(async (clip) => {
          const thumbnailUrl =
            clip.thumbnailUrl || (await resolveClipThumbnail(clip.url));

          return {
            creator_id: creator.id,
            platform: clip.platform,
            title: clip.title || "Featured clip",
            description: clip.description || null,
            url: clip.url,
            thumbnail_url: thumbnailUrl || null,
            is_featured: true,
          };
        })
    );

    if (clipRows.length > 0) {
      const { error: clipError } = await supabase
        .from("creator_featured_moments")
        .insert(clipRows);

      if (clipError) {
        setSaving(false);
        alert(clipError.message);
        return;
      }
    }

    setSaving(false);
    setEditMode(false);
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

    setClaimSending(true);

    const { error } = await supabase.from("creator_claims").insert({
      creator_id: creator.id,
      user_id: currentUserId,
      verification_platform: claimPlatform,
      verification_url: claimUrl,
      verification_code: claimCode,
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
              {translate(t, "creatorPopupLevelPrefix", "Lv.")} {creator.level}
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

              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                {category || creator.category}
              </p>

              <h2 className="mt-2 text-4xl font-black text-white">
                {nickname || creator.nickname}
              </h2>

              <p className="mt-1 text-sm font-semibold text-cyan-100">
                {title || creator.title}
              </p>

              <p className="mt-2 text-sm text-white/60">@{creator.username}</p>

              <div className="mt-5 flex flex-wrap gap-3">
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
              {isOwner && (
                <button
                  onClick={() => setEditMode((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100 hover:bg-cyan-300/20"
                >
                  <Pencil size={14} />
                  {editMode
                    ? translate(t, "creatorPopupView", "Visualizar")
                    : translate(t, "creatorPopupEdit", "Editar")}
                </button>
              )}

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
                  claimCode={claimCode}
                  claimSending={claimSending}
                  claimSuccess={claimSuccess}
                  onSubmit={handleClaimProfile}
                  onBack={() => setClaimMode(false)}
                />
              ) : editMode ? (
                <EditPanel
                  t={t}
                  nickname={nickname}
                  setNickname={setNickname}
                  title={title}
                  setTitle={setTitle}
                  category={category}
                  setCategory={setCategory}
                  bio={bio}
                  setBio={setBio}
                  description={description}
                  setDescription={setDescription}
                  avatarUrl={avatarUrl}
                  setAvatarUrl={setAvatarUrl}
                  bannerUrl={bannerUrl}
                  setBannerUrl={setBannerUrl}
                  tagsText={tagsText}
                  setTagsText={setTagsText}
                  socials={socials}
                  setSocials={setSocials}
                  youtubeChannels={youtubeChannels}
                  setYoutubeChannels={setYoutubeChannels}
                  clips={clips}
                  setClips={setClips}
                  uploadingAvatar={uploadingAvatar}
                  uploadingBanner={uploadingBanner}
                  uploadImage={uploadImage}
                  saving={saving}
                  handleSave={handleSave}
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
                {translate(t, "creatorPopupShareDescriptionSuffix", "usando o link com preview do Creator Nexus.")}
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
  clips,
  setClips,
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
  clips: ClipForm[];
  setClips: React.Dispatch<React.SetStateAction<ClipForm[]>>;
  uploadingAvatar: boolean;
  uploadingBanner: boolean;
  uploadImage: (file: File, type: "avatar" | "banner") => void;
  saving: boolean;
  handleSave: () => void;
}) {
  const [clipsExpanded, setClipsExpanded] = useState(false);

  function updateClip(index: number, field: keyof ClipForm, value: string) {
    setClips((current) =>
      current.map((clip, clipIndex) =>
        clipIndex === index ? { ...clip, [field]: value } : clip
      )
    );
  }

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
                + Adicionar canal
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
                      aria-label="Remover canal do YouTube"
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="font-bold text-white">{translate(t, "creatorPopupFeaturedClipsTitle", "Clips em destaque")}</h4>

            <p className="mt-2 text-sm text-white/45">
              {translate(t, "creatorPopupFeaturedClipsDescription", "Adicione até 3 clips ou shorts para aparecerem no perfil. A capa será buscada automaticamente pelo link quando possível.")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setClipsExpanded((current) => !current)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.08]"
          >
            {clipsExpanded
              ? translate(t, "creatorPopupCollapseClips", "Recolher clips")
              : translate(t, "creatorPopupExpandClips", "Expandir clips")}
          </button>
        </div>

        {clipsExpanded && (
          <div className="mt-5 grid gap-4">
            {clips.map((clip, index) => {
              const previewThumbnail =
                clip.thumbnailUrl || getClipPreviewThumbnail(clip.url);

              return (
                <div
                  key={index}
                  className="rounded-3xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/35">
                    {translate(t, "creatorPopupClipPrefix", "Clip")} {index + 1}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <EditInput
                      label={translate(t, "creatorPopupFieldClipTitle", "Título")}
                      value={clip.title}
                      onChange={(value) => updateClip(index, "title", value)}
                      placeholder={translate(t, "creatorPopupClipTitlePlaceholder", "Melhor momento da live")}
                    />

                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.2em] text-white/35">
                        {translate(t, "creatorPopupFieldPlatform", "Plataforma")}
                      </span>

                      <select
                        value={clip.platform}
                        onChange={(event) =>
                          updateClip(index, "platform", event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                      >
                        {clipPlatforms.map((platform) => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="sm:col-span-2">
                      <EditInput
                        label={translate(t, "creatorPopupFieldClipUrl", "URL do clip")}
                        value={clip.url}
                        onChange={(value) => updateClip(index, "url", value)}
                        placeholder="https://..."
                      />
                    </div>

                    {previewThumbnail && (
                      <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <img
                          src={previewThumbnail}
                          alt={clip.title || `${translate(t, "creatorPopupClipPreviewAltPrefix", "Preview do clip")} ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <EditTextarea
                        label={translate(t, "creatorPopupFieldDescription", "Descrição")}
                        value={clip.description}
                        onChange={(value) =>
                          updateClip(index, "description", value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onSubmit}
          disabled={claimSending}
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
  clips: ClipForm[];
  viewCount: number;
  followerCount: number;
  shareCount: number;
  liveStatus: LiveStatusMap;
  liveStatusLoading: boolean;
}) {
  const visibleClips = clips.filter((clip) => clip.url.trim().length > 0);
  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");

  const twitchFollowers = twitchStatus?.followerCount ?? twitchStatus?.externalCount ?? 0;
  const kickFollowers = kickStatus?.followerCount ?? kickStatus?.externalCount ?? 0;
  const youtubeSubscribers = youtubeStatus?.subscriberCount ?? youtubeStatus?.externalCount ?? 0;
  const externalTotal = twitchFollowers + kickFollowers + youtubeSubscribers;

  return (
    <>
      <div className="pr-16">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          {translate(t, "creatorPopupCreatorProfileBadge", "Perfil do Criador")}
        </p>

        <h3 className="mt-3 text-3xl font-bold leading-tight">
          {bio || creator.bio}
        </h3>

        <p className="mt-3 text-sm font-semibold text-cyan-100">
          {title || creator.title}
        </p>

        <p className="mt-4 text-white/65">
          {description || creator.description}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label={translate(t, "creatorPopupViews", "Views")} value={viewCount.toLocaleString("pt-BR")} color="text-cyan-200" />
        <InfoCard label={translate(t, "creatorPopupFollowers", "Seguidores do site")} value={followerCount.toLocaleString("pt-BR")} color="text-purple-200" />
        <InfoCard label={translate(t, "creatorPopupExternalReach", "Alcance externo")} value={externalTotal.toLocaleString("pt-BR")} color="text-emerald-200" />
        <InfoCard label={translate(t, "creatorPopupShares", "Compartilhamentos")} value={shareCount.toLocaleString("pt-BR")} color="text-yellow-200" />
      </div>

      <div className="mt-8">
        <h4 className="font-bold">{translate(t, "creatorPopupTags", "Tags")}</h4>

        <div className="mt-3 flex flex-wrap gap-2">
          {tagsText
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/70"
              >
                {tag}
              </span>
            ))}
        </div>
      </div>

      {visibleClips.length > 0 && (
        <div className="mt-8">
          <h4 className="font-bold">{translate(t, "creatorPopupFeaturedClipsViewTitle", "Clips em destaque")}</h4>

          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {visibleClips.map((clip, index) => {
              const previewThumbnail =
                clip.thumbnailUrl || getClipPreviewThumbnail(clip.url);

              return (
                <a
                  key={`${clip.url}-${index}`}
                  href={clip.url}
                  target="_blank"
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:bg-white/[0.07]"
                >
                  <div className="aspect-video bg-black/40">
                    {previewThumbnail ? (
                      <img
                        src={previewThumbnail}
                        alt={clip.title || "Clip"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.25em] text-white/35">
                        {clip.platform}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                      {clip.platform}
                    </p>

                    <p className="mt-2 font-bold text-white">
                      {clip.title || translate(t, "creatorPopupFeaturedClipFallback", "Featured clip")}
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
        </div>
      )}

      <div className="mt-8 pb-10">
        <h4 className="font-bold">{translate(t, "creatorPopupSocialNetworks", "Redes Sociais")}</h4>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {[
            ...Object.entries(socials).filter(
              ([platform, url]) => platform !== "youtube" && url.trim().length > 0
            ),
            ...(youtubeChannels.filter((url) => url.trim().length > 0).length > 0
              ? [["youtube", youtubeChannels[0]] as [string, string]]
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
                normalizedPlatform === "youtube";
              const isPlatformLive = Boolean(platformLiveStatus?.isLive);
              const platformUrl = platformLiveStatus?.url || url;
              const platformExternalCount =
                normalizedPlatform === "youtube"
                  ? platformLiveStatus?.subscriberCount ?? platformLiveStatus?.externalCount ?? 0
                  : platformLiveStatus?.followerCount ?? platformLiveStatus?.externalCount ?? 0;
              const platformExternalLabel =
                normalizedPlatform === "youtube" ? "inscritos" : "seguidores";

              return (
                <a
                  key={platform}
                  href={platformUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex h-[104px] min-w-0 flex-col justify-center rounded-2xl border px-4 py-3 text-sm transition hover:scale-105 ${
                    isPlatformLive
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20"
                      : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
                  }`}
                >
                  <span className="block truncate font-bold uppercase tracking-[0.18em]">
                    {normalizedPlatform === "youtube" &&
                    youtubeChannels.filter((channel) => channel.trim().length > 0).length > 1
                      ? `YOUTUBE (${youtubeChannels.filter((channel) => channel.trim().length > 0).length})`
                      : platform}
                  </span>

                  <span className="mt-2 block min-h-[16px] truncate text-xs text-white/55">
                    {supportsLiveStatus
                      ? liveStatusLoading && !platformLiveStatus
                        ? "Checking live..."
                        : isPlatformLive
                          ? `${(platformLiveStatus?.viewerCount || 0).toLocaleString("pt-BR")} viewers`
                          : "Offline"
                      : supportsExternalCount && liveStatusLoading && !platformLiveStatus
                        ? "Carregando..."
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`mt-1 font-bold ${color}`}>{value}</p>
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
