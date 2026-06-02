"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Pencil, Save, Send, UserCheck, UserPlus } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { addUserXp } from "@/lib/xp/user-xp";
import { updateMissionProgress } from "@/lib/missions/user-missions";
import { Creator } from "@/types/creator";

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

      socialPlatforms.forEach((platform) => {
        nextSocials[platform] = "";
      });

      socialData?.forEach((item: any) => {
        nextSocials[item.platform] = item.url;
      });

      setSocials(nextSocials);

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
      alert("Faça login para seguir este creator.");
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
        title: `Você seguiu ${creator.nickname}`,
        message: "Você ganhou XP por seguir um creator.",
        metadata: {
          creator_id: creator.id,
          creator_username: creator.username,
          creator_nickname: creator.nickname,
        },
      });

      console.log("TESTE MISSÃO FOLLOW: chamou updateMissionProgress");

      await updateMissionProgress("follow_creator", 1, {
        creator_id: creator.id,
        creator_username: creator.username,
        creator_nickname: creator.nickname,
      });
    }

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
          message: `Você ganhou a carta de ${creator.nickname}.`,
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

    const socialRows = Object.entries(socials)
      .filter(([, url]) => url.trim().length > 0)
      .map(([platform, url]) => ({
        creator_id: creator.id,
        platform,
        url,
      }));

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
    alert("Perfil atualizado com sucesso!");
  }

  async function handleClaimProfile() {
    if (!creator || !currentUserId) {
      alert("Faça login para reivindicar este perfil.");
      return;
    }

    if (!claimUrl) {
      alert("Informe o link do canal ou perfil usado para verificação.");
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
          aria-label="Fechar popup"
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
              {creator.rarity}
            </div>

            <div className="absolute right-5 top-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs text-cyan-100 backdrop-blur">
              Lv. {creator.level}
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                {statusLabel[creator.status]}
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
                  {isFollowing ? "Seguindo" : "Seguir"}
                </button>

                <button
                  onClick={handleShare}
                  className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                >
                  Compartilhar
                </button>

                {canClaim && (
                  <button
                    onClick={() => setClaimMode(true)}
                    className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/20"
                  >
                    Este perfil é meu
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
                  {editMode ? "Visualizar" : "Editar"}
                </button>
              )}

              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
              >
                Fechar
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
    Carregando perfil...
  </div>
) : claimMode ? (
                <ClaimPanel
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
  creator={creator}
  bio={bio}
  title={title}
  description={description}
  tagsText={tagsText}
  socials={socials}
  clips={clips}
  viewCount={viewCount}
  followerCount={followerCount}
  shareCount={shareCount}
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
            aria-label="Fechar compartilhamento"
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
                Share Profile
              </div>

              <h3 className="mt-5 text-2xl font-black">
                Compartilhar perfil
              </h3>

              <p className="mt-2 text-sm text-white/50">
                Compartilhe o perfil de {creator.nickname} usando o link com preview do Creator Nexus.
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
                  label={copied ? "Link copiado!" : "Copiar link"}
                  onClick={() => shareTo("copy")}
                  full
                />
              </div>

              <button
                onClick={() => setShareOpen(false)}
                className="mt-5 w-full rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]"
              >
                Fechar
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
  clips,
  setClips,
  uploadingAvatar,
  uploadingBanner,
  uploadImage,
  saving,
  handleSave,
}: {
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

  return (
    <div className="pb-10 pr-16">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
        Edit Mode
      </p>

      <h3 className="mt-3 text-3xl font-bold">Editar perfil</h3>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <EditInput label="Nickname" value={nickname} onChange={setNickname} />
        <EditInput label="Title" value={title} onChange={setTitle} />
        <EditInput label="Categoria" value={category} onChange={setCategory} />
        <EditInput label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} />

        <UploadField
          label="Upload Avatar"
          uploading={uploadingAvatar}
          uploadingText="Enviando avatar..."
          onFile={(file) => uploadImage(file, "avatar")}
        />

        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="Avatar preview"
            className="h-28 w-28 rounded-2xl border border-white/10 object-cover"
          />
        )}

        <div className="sm:col-span-2">
          <EditInput label="Banner URL" value={bannerUrl} onChange={setBannerUrl} />
        </div>

        <div className="sm:col-span-2">
          <UploadField
            label="Upload Banner"
            uploading={uploadingBanner}
            uploadingText="Enviando banner..."
            onFile={(file) => uploadImage(file, "banner")}
          />
        </div>

        {bannerUrl && (
          <div className="sm:col-span-2">
            <img
              src={bannerUrl}
              alt="Banner preview"
              className="h-32 w-full rounded-2xl border border-white/10 object-cover"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <EditTextarea label="Bio curta" value={bio} onChange={setBio} />
        </div>

        <div className="sm:col-span-2">
          <EditTextarea
            label="Descrição completa"
            value={description}
            onChange={setDescription}
          />
        </div>

        <div className="sm:col-span-2">
          <EditInput
            label="Tags separadas por vírgula"
            value={tagsText}
            onChange={setTagsText}
            placeholder="Streamer, MMORPG, Black Desert"
          />
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
        <h4 className="font-bold text-white">Social Links</h4>

        <p className="mt-2 text-sm text-white/45">
          Adicione os links oficiais do creator.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {socialPlatforms.map((platform) => (
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
              placeholder={`Link do ${platform}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-purple-300/15 bg-purple-300/[0.04] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="font-bold text-white">Clips em destaque</h4>

            <p className="mt-2 text-sm text-white/45">
              Adicione até 3 clips ou shorts para aparecerem no perfil. A capa
              será buscada automaticamente pelo link quando possível.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setClipsExpanded((current) => !current)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.08]"
          >
            {clipsExpanded ? "Recolher clips" : "Expandir clips"}
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
                    Clip {index + 1}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <EditInput
                      label="Título"
                      value={clip.title}
                      onChange={(value) => updateClip(index, "title", value)}
                      placeholder="Melhor momento da live"
                    />

                    <label className="block">
                      <span className="text-xs uppercase tracking-[0.2em] text-white/35">
                        Plataforma
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
                        label="URL do clip"
                        value={clip.url}
                        onChange={(value) => updateClip(index, "url", value)}
                        placeholder="https://..."
                      />
                    </div>

                    {previewThumbnail && (
                      <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <img
                          src={previewThumbnail}
                          alt={clip.title || `Preview do clip ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <EditTextarea
                        label="Descrição"
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
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}

function ClaimPanel({
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
          Claim Sent
        </p>

        <h3 className="mt-3 text-3xl font-bold">Solicitação enviada</h3>

        <p className="mt-4 text-white/60">
          Agora coloque o código abaixo na bio, descrição ou sobre da plataforma
          informada. Um administrador irá revisar sua solicitação.
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
        Claim Profile
      </p>

      <h3 className="mt-3 text-3xl font-bold">Este perfil é meu</h3>

      <p className="mt-4 text-white/60">
        Para provar que este perfil pertence a você, informe uma plataforma oficial
        e coloque temporariamente o código abaixo na bio/descrição do canal.
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
          placeholder="Link do canal ou perfil oficial"
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
          Código de verificação
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
          {claimSending ? "Enviando..." : "Enviar reivindicação"}
        </button>

        <button
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white/70 hover:bg-white/[0.08]"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}

function ViewPanel({
  creator,
  bio,
  title,
  description,
  tagsText,
  socials,
  clips,
  viewCount,
  followerCount,
  shareCount,
}: {
  creator: Creator;
  bio: string;
  title: string;
  description: string;
  tagsText: string;
  socials: SocialForm;
  clips: ClipForm[];
  viewCount: number;
  followerCount: number;
  shareCount: number;
}) {
  const visibleClips = clips.filter((clip) => clip.url.trim().length > 0);

  return (
    <>
      <div className="pr-16">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Creator Profile
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

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoCard label="Views" value={viewCount.toLocaleString("pt-BR")} color="text-cyan-200" />
        <InfoCard label="Seguidores" value={followerCount.toLocaleString("pt-BR")} color="text-purple-200" />
        <InfoCard label="Compartilhamentos" value={shareCount.toLocaleString("pt-BR")} color="text-yellow-200" />
      </div>

      <div className="mt-8">
        <h4 className="font-bold">Tags</h4>

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
          <h4 className="font-bold">Clips em destaque</h4>

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
                      {clip.title || "Featured clip"}
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
        <h4 className="font-bold">Social Links</h4>

        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(socials)
            .filter(([, url]) => url.trim().length > 0)
            .map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:scale-105 hover:bg-cyan-300/20"
              >
                {platform}
              </a>
            ))}
        </div>
      </div>
    </>
  );
}

function UploadField({
  label,
  uploading,
  uploadingText,
  onFile,
}: {
  label: string;
  uploading: boolean;
  uploadingText: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>

      <div className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]">
        <ImagePlus size={18} />
        Escolher arquivo
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
