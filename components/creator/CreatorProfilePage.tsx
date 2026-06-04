"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  PlayCircle,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  WifiOff,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { getRarityLabel } from "@/lib/rarity";
import { supabase } from "@/lib/supabase/client";

type CreatorProfilePageProps = {
  username: string;
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
  faction: string | null;
  category: string | null;
  status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
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

type CreatorStats = {
  views: number;
  followers: number;
  shares: number;
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

const LIVE_PLATFORMS = ["twitch", "kick"] as const;

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

function getCreatorCard(profile: CreatorProfileRow | null): CreatorCardRow | null {
  if (!profile?.creator_cards) return null;

  if (Array.isArray(profile.creator_cards)) {
    return profile.creator_cards[0] || null;
  }

  return profile.creator_cards;
}

function getInitials(name: string) {
  const cleanName = name.trim();

  if (!cleanName) return "CP";

  return cleanName.slice(0, 2).toUpperCase();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
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

  if (normalizedPlatform === "kick") {
    return `https://kick.com/${username}`;
  }

  if (normalizedPlatform === "youtube") {
    return `https://www.youtube.com/${username.replace("@", "")}`;
  }

  return `https://twitch.tv/${username}`;
}

function getPlatformLiveStatus(liveStatus: LiveStatusMap, platform: string) {
  return liveStatus[platform.toLowerCase()];
}

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

function getCreatorExternalReachFromLiveStatus(liveStatus: LiveStatusMap) {
  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");

  const twitchFollowers =
    twitchStatus?.followerCount ?? twitchStatus?.externalCount ?? 0;
  const kickFollowers =
    kickStatus?.followerCount ?? kickStatus?.externalCount ?? 0;
  const youtubeSubscribers =
    youtubeStatus?.subscriberCount ?? youtubeStatus?.externalCount ?? 0;

  return twitchFollowers + kickFollowers + youtubeSubscribers;
}

function getSocialUrl(socialLinks: SocialLink[], platform: string) {
  return (
    socialLinks.find((social) => social.platform.toLowerCase() === platform)
      ?.url || ""
  );
}

export function CreatorProfilePage({ username }: CreatorProfilePageProps) {
  const { t } = useLanguage();

  const [profile, setProfile] = useState<CreatorProfileRow | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [clips, setClips] = useState<AutoClip[]>([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [stats, setStats] = useState<CreatorStats>({
    views: 0,
    followers: 0,
    shares: 0,
  });
  const [liveStatus, setLiveStatus] = useState<LiveStatusMap>({});
  const [liveStatusLoading, setLiveStatusLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const decodedUsername = useMemo(() => {
    return decodeURIComponent(username || "").replace("@", "").trim();
  }, [username]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!cancelled) {
        setCurrentUserId(user?.id || null);
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
          faction,
          category,
          status,
          avatar_url,
          banner_url,
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
        `
        )
        .eq("is_public", true)
        .ilike("username", decodedUsername)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setProfile(null);
        setSocialLinks([]);
        setClips([]);
        setLiveStatus({});
        setStats({
          views: 0,
          followers: 0,
          shares: 0,
        });
        setLoading(false);
        return;
      }

      const typedProfile = data as CreatorProfileRow;

      setProfile(typedProfile);

      const [
        { data: socialData },
        { count: viewCount },
        { count: followerCount },
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
      ]);

      if (cancelled) return;

      setSocialLinks((socialData || []) as SocialLink[]);
      setStats({
        views: viewCount || 0,
        followers: followerCount || 0,
        shares: typedProfile.share_count || 0,
      });
      setLoading(false);
    }

    if (decodedUsername) {
      loadCreatorProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [decodedUsername]);

  useEffect(() => {
    if (!profile) {
      setLiveStatus({});
      return;
    }

    const youtubeChannels = socialLinks
      .filter((social) => social.platform.toLowerCase() === "youtube")
      .map((social) => social.url);

    const targets: Array<{
      platform: "twitch" | "kick" | "youtube";
      username: string;
      index?: number;
    }> = [
      ...LIVE_PLATFORMS.map((platform) => {
        const url = getSocialUrl(socialLinks, platform);
        const platformUsername = extractPlatformUsername(platform, url);

        return {
          platform,
          username: platformUsername,
        };
      }).filter((target) => target.username.length > 0),
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

    async function loadLiveStatuses() {
      setLiveStatusLoading(true);

      try {
        const results = await Promise.all(
          targets.map(async ({ platform, username: targetUsername, index }) => {
            try {
              const response = await fetch(
                `/api/live-status?platform=${platform}&username=${encodeURIComponent(
                  targetUsername
                )}`
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
          })
        );

        if (!cancelled) {
          setLiveStatus(
            results.reduce<LiveStatusMap>((accumulator, result) => {
              if (result.platform === "youtube") {
                accumulator[`youtube:${result.index ?? 0}`] = result.status;

                const currentYoutube = accumulator.youtube;
                const currentSubscriberCount =
                  currentYoutube?.subscriberCount ??
                  currentYoutube?.externalCount ??
                  0;
                const nextSubscriberCount =
                  result.status.subscriberCount ??
                  result.status.externalCount ??
                  0;

                accumulator.youtube =
                  nextSubscriberCount >= currentSubscriberCount
                    ? result.status
                    : currentYoutube || result.status;

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
  }, [profile, socialLinks]);

  useEffect(() => {
    if (!profile) {
      setClips([]);
      return;
    }

    const twitchUsername = extractPlatformUsername(
      "twitch",
      getSocialUrl(socialLinks, "twitch")
    );
    const kickUsername = extractPlatformUsername(
      "kick",
      getSocialUrl(socialLinks, "kick")
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
  const faction =
    profile?.faction ||
    translate(t, "creatorProfileDefaultFaction", "Cardpoc");
  const bio =
    profile?.bio ||
    translate(
      t,
      "creatorProfileDefaultBio",
      "Perfil público de criador aprovado no Cardpoc."
    );
  const description =
    profile?.description ||
    translate(
      t,
      "creatorProfileDefaultDescription",
      "Acompanhe cartas colecionáveis, presença digital, redes sociais e momentos em destaque deste criador no Cardpoc."
    );
  const rarity = card?.rarity || "common";
  const tags = normalizeCreatorTags(profile?.tags);
  const externalReach = getCreatorExternalReachFromLiveStatus(liveStatus);
  const twitchStatus = getPlatformLiveStatus(liveStatus, "twitch");
  const kickStatus = getPlatformLiveStatus(liveStatus, "kick");
  const youtubeStatus = getPlatformLiveStatus(liveStatus, "youtube");
  const isLive = Boolean(twitchStatus?.isLive || kickStatus?.isLive);
  const isOwner = Boolean(profile?.user_id && currentUserId === profile.user_id);
  const ogCardUrl = `/api/og/card/${encodeURIComponent(
    profile?.username || decodedUsername
  )}`;

  const platformCounters = [
    {
      key: "youtube",
      label: "YouTube",
      value:
        youtubeStatus?.subscriberCount ??
        youtubeStatus?.externalCount ??
        0,
      suffix: translate(t, "creatorProfileSubscribers", "inscritos"),
      url: youtubeStatus?.url || getSocialUrl(socialLinks, "youtube"),
      isLive: false,
    },
    {
      key: "twitch",
      label: "Twitch",
      value:
        twitchStatus?.followerCount ??
        twitchStatus?.externalCount ??
        0,
      suffix: translate(t, "creatorProfileFollowersShort", "seguidores"),
      url: twitchStatus?.url || getSocialUrl(socialLinks, "twitch"),
      isLive: Boolean(twitchStatus?.isLive),
    },
    {
      key: "kick",
      label: "Kick",
      value:
        kickStatus?.followerCount ??
        kickStatus?.externalCount ??
        0,
      suffix: translate(t, "creatorProfileFollowersShort", "seguidores"),
      url: kickStatus?.url || getSocialUrl(socialLinks, "kick"),
      isLive: Boolean(kickStatus?.isLive),
    },
  ].filter((item) => item.url || item.value > 0);

  const heroLiveStatus = twitchStatus?.isLive
    ? twitchStatus
    : kickStatus?.isLive
      ? kickStatus
      : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-white/70 shadow-2xl shadow-cyan-500/10">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
            {translate(t, "creatorProfileLoading", "Carregando perfil do criador...")}
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
            <Sparkles className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight md:text-5xl">
            {translate(t, "creatorProfileNotFoundTitle", "Criador não encontrado")}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 md:text-base">
            {translate(
              t,
              "creatorProfileNotFoundDescription",
              "Este perfil ainda não está público ou não existe no Cardpoc."
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
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.20),transparent_42%)]" />

        {profile.banner_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url(${profile.banner_url})`,
            }}
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/60 via-[#020617]/86 to-[#020617]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/65 transition hover:border-cyan-300/30 hover:text-cyan-100"
            >
              <ArrowLeft className="h-4 w-4" />
              {translate(t, "creatorProfileExploreCreators", "Explorar criadores")}
            </Link>

            {isOwner ? (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-fuchsia-100 transition hover:bg-fuchsia-300/20"
              >
                <Sparkles className="h-4 w-4" />
                {translate(t, "creatorProfileManageProfile", "Gerenciar perfil")}
              </Link>
            ) : null}
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
                  {translate(t, "creatorProfilePublicProfile", "Perfil público")}
                </span>

                {isLive ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-red-100 shadow-lg shadow-red-500/10">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    {translate(t, "creatorProfileLiveNow", "Ao vivo agora")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white/45">
                    <WifiOff className="h-3.5 w-3.5" />
                    {translate(t, "creatorProfileOffline", "Offline")}
                  </span>
                )}

                {profile.is_verified ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-yellow-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {translate(t, "creatorProfileVerified", "Verificado")}
                  </span>
                ) : null}

                <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-100">
                  {getRarityLabel(rarity)}
                </span>
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">
                {nickname}
              </h1>

              <p className="mt-4 text-lg font-semibold text-cyan-100/90 md:text-2xl">
                {title}
              </p>

              <p className="mt-3 text-sm font-medium text-white/50 md:text-base">
                @{profile.username}
              </p>

              {heroLiveStatus ? (
                <a
                  href={heroLiveStatus.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex max-w-2xl items-center gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-50 transition hover:bg-red-500/15"
                >
                  <Radio className="h-4 w-4 animate-pulse" />
                  <span className="line-clamp-1">
                    {heroLiveStatus.title ||
                      translate(t, "creatorProfileLiveFallbackTitle", "Live em andamento")}
                  </span>
                  {heroLiveStatus.viewerCount ? (
                    <span className="ml-auto whitespace-nowrap text-red-100/70">
                      {formatNumber(heroLiveStatus.viewerCount)}{" "}
                      {translate(t, "creatorProfileViewers", "assistindo")}
                    </span>
                  ) : null}
                </a>
              ) : null}

              <p className="mt-7 max-w-3xl text-base leading-8 text-white/68 md:text-lg">
                {bio}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/75">
                  {category}
                </span>

                <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/75">
                  {faction}
                </span>

                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-2 text-sm font-bold text-cyan-100/85"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="group perspective-[1200px]">
              <div className="relative rounded-[2.2rem] border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur transition duration-500 group-hover:-translate-y-2 group-hover:rotate-[0.8deg] group-hover:shadow-cyan-400/20">
                <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-cyan-400/10 blur-3xl transition duration-500 group-hover:bg-fuchsia-400/15" />

                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.7rem] border border-cyan-300/25 bg-gradient-to-br from-cyan-300/20 via-fuchsia-400/10 to-black">
                  <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_25%_15%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.20),transparent_35%)]" />

                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={nickname}
                      className="relative h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center text-7xl font-black text-cyan-100">
                      {getInitials(nickname)}
                    </div>
                  )}

                  <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
                    {getRarityLabel(rarity)}
                  </div>

                  <div className="absolute right-4 top-4 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
                    Nv. {card?.level || 1}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-5">
                    <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-100/80">
                      {translate(t, "creatorProfileCardLabel", "Carta Cardpoc")}
                    </p>
                    <p className="mt-1 text-3xl font-black">{nickname}</p>
                    <p className="mt-1 text-xs font-bold text-white/55">
                      {title}
                    </p>
                  </div>
                </div>

                <a
                  href={ogCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  <Star className="h-4 w-4" />
                  {translate(t, "creatorProfileViewShareCard", "Ver carta compartilhável")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-4">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center gap-2 text-white/40">
            <Eye className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-[0.24em]">
              {translate(t, "creatorProfileViews", "Visualizações")}
            </p>
          </div>
          <p className="mt-3 text-4xl font-black">{formatNumber(stats.views)}</p>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center gap-2 text-white/40">
            <UserCheck className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-[0.24em]">
              {translate(t, "creatorProfileFollowers", "Seguidores")}
            </p>
          </div>
          <p className="mt-3 text-4xl font-black">{formatNumber(stats.followers)}</p>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center gap-2 text-white/40">
            <Globe2 className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-[0.24em]">
              {translate(t, "creatorProfileExternalReach", "Alcance externo")}
            </p>
          </div>
          <p className="mt-3 text-4xl font-black">
            {liveStatusLoading ? "..." : formatNumber(externalReach)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center gap-2 text-white/40">
            <Share2 className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-[0.24em]">
              {translate(t, "creatorProfileShares", "Compartilhamentos")}
            </p>
          </div>
          <p className="mt-3 text-4xl font-black">{formatNumber(stats.shares)}</p>
        </div>
      </section>

      {platformCounters.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 pb-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/55">
                  {translate(t, "creatorProfilePlatformsTitle", "Plataformas")}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {translate(t, "creatorProfileExternalAudience", "Audiência externa")}
                </h2>
              </div>

              {liveStatusLoading ? (
                <span className="inline-flex items-center gap-2 text-sm font-bold text-white/45">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {translate(t, "creatorProfileUpdatingPlatforms", "Atualizando plataformas...")}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {platformCounters.map((platform) => (
                <a
                  key={platform.key}
                  href={platform.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-[1.4rem] border border-white/10 bg-black/20 p-5 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-white/55">
                      {platform.label}
                    </p>

                    {platform.isLive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-100">
                        <Radio className="h-3 w-3 animate-pulse" />
                        Live
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-3xl font-black">
                    {formatNumber(platform.value)}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-white/45">
                    {platform.suffix}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-200" />
              <h2 className="text-2xl font-black tracking-tight">
                {translate(t, "creatorProfileAboutTitle", "Sobre o criador")}
              </h2>
            </div>

            <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/68">
              {description}
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <PlayCircle className="h-5 w-5 text-fuchsia-200" />
              <h2 className="text-2xl font-black tracking-tight">
                {translate(t, "creatorProfileFeaturedClips", "Clipes em destaque")}
              </h2>
            </div>

            {clipsLoading ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/50">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-100" />
                {translate(t, "creatorProfileLoadingClips", "Carregando clipes...")}
              </div>
            ) : clips.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {clips.map((clip) => {
                  const thumbnail = clip.thumbnailUrl || clip.thumbnail_url;
                  const viewCount = clip.viewCount ?? clip.view_count ?? 0;

                  return (
                    <a
                      key={clip.id}
                      href={clip.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/25 transition hover:border-cyan-300/30"
                    >
                      <div className="aspect-video bg-white/[0.04]">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={clip.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/30">
                            <PlayCircle className="h-10 w-10" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/60">
                            {getPlatformLabel(clip.platform)}
                          </p>

                          {viewCount > 0 ? (
                            <span className="text-xs font-bold text-white/40">
                              {formatNumber(viewCount)}
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6 text-white">
                          {clip.title}
                        </h3>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/50">
                {translate(
                  t,
                  "creatorProfileNoClips",
                  "Este criador ainda não possui clipes públicos em destaque."
                )}
              </p>
            )}
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-cyan-200" />
              <h2 className="text-xl font-black tracking-tight">
                {translate(t, "creatorProfileSocialLinks", "Redes sociais")}
              </h2>
            </div>

            {socialLinks.length > 0 ? (
              <div className="mt-5 space-y-3">
                {socialLinks.map((social) => (
                  <a
                    key={`${social.platform}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition hover:border-cyan-300/30 hover:text-cyan-100"
                  >
                    <span>{getPlatformLabel(social.platform)}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/50">
                {translate(
                  t,
                  "creatorProfileNoSocialLinks",
                  "As redes sociais deste criador ainda não foram adicionadas."
                )}
              </p>
            )}
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-fuchsia-200" />
              <h2 className="text-xl font-black tracking-tight">
                {translate(t, "creatorProfileCardStats", "Carta do criador")}
              </h2>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {translate(t, "creatorProfileCardRarity", "Raridade")}
                </span>
                <strong>{getRarityLabel(rarity)}</strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {translate(t, "creatorProfileCardRank", "Rank")}
                </span>
                <strong>
                  {card?.rank || translate(t, "creatorProfileDefaultRank", "Bronze")}
                </strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {translate(t, "creatorProfileCardLevel", "Nível")}
                </span>
                <strong>{card?.level || 1}</strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {translate(t, "creatorProfileCardPower", "Poder")}
                </span>
                <strong>{formatNumber(card?.power_score || 0)}</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
