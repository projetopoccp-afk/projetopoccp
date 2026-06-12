import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SocialPlatform = "twitch" | "kick" | "youtube" | "discord";

type LiveStatusResponse = {
  platform: SocialPlatform;
  username: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  startedAt?: string;
  thumbnail?: string;
  url: string;

  followerCount?: number;
  subscriberCount?: number;
  viewCount?: number;
  videoCount?: number;
  externalCount?: number;
  memberCount?: number;
  onlineMemberCount?: number;
  debug?: unknown;
};

async function getTwitchAccessToken() {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function getTwitchUserId(username: string, accessToken: string) {
  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json();
  return data.data?.[0]?.id as string | undefined;
}

async function getTwitchFollowerCount(
  broadcasterId: string,
  accessToken: string,
) {
  const response = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=1`,
    {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json();
  return Number(data.total ?? 0);
}

async function getTwitchLiveStatus(
  username: string,
): Promise<LiveStatusResponse> {
  const accessToken = await getTwitchAccessToken();
  const broadcasterId = await getTwitchUserId(username, accessToken);

  const followerCount = broadcasterId
    ? await getTwitchFollowerCount(broadcasterId, accessToken)
    : 0;

  const twitchResponse = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(
      username,
    )}`,
    {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const twitchData = await twitchResponse.json();
  const stream = twitchData.data?.[0];

  if (!stream) {
    return {
      platform: "twitch",
      username,
      isLive: false,
      followerCount,
      externalCount: followerCount,
      url: `https://twitch.tv/${username}`,
    };
  }

  return {
    platform: "twitch",
    username,
    isLive: true,
    title: stream.title,
    viewerCount: stream.viewer_count,
    gameName: stream.game_name,
    startedAt: stream.started_at,
    thumbnail: stream.thumbnail_url,
    followerCount,
    externalCount: followerCount,
    url: `https://twitch.tv/${username}`,
  };
}


function normalizeKickUsername(username: string) {
  const value = username.trim();

  if (!value) return "";

  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(`https://${value}`);

    if (url.hostname.includes("kick.com")) {
      const slug = url.pathname.split("/").filter(Boolean)[0];
      return (slug || "").replace(/^@/, "").toLowerCase();
    }
  } catch {
    // Continua com normalização manual abaixo.
  }

  return value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^kick\.com\//i, "")
    .replace(/^@/, "")
    .split("?")[0]
    .split("#")[0]
    .split("/")[0]
    .trim()
    .toLowerCase();
}

function readNestedValue(payload: any, path: string) {
  return path.split(".").reduce<any>((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, payload);
}

function readNumberFromPaths(payload: any, paths: string[]) {
  for (const path of paths) {
    const value = readNestedValue(payload, path);

    if (value === null || value === undefined || value === "") continue;

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return 0;
}

function readBooleanFromPaths(payload: any, paths: string[]) {
  for (const path of paths) {
    const value = readNestedValue(payload, path);

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "live"].includes(normalized)) return true;
      if (["false", "0", "no", "offline"].includes(normalized)) return false;
    }
  }

  return undefined;
}

type KickFetchDebug = {
  url: string;
  status: number;
  ok: boolean;
  contentType: string;
  bodyPreview?: string;
  error?: string;
};

async function fetchKickJsonDetailed(url: string): Promise<{
  data: any;
  debug: KickFetchDebug;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://kick.com/",
        Origin: "https://kick.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const bodyText = await response.text();
    const debug: KickFetchDebug = {
      url,
      status: response.status,
      ok: response.ok,
      contentType,
      bodyPreview: bodyText.slice(0, 1200),
    };

    if (!response.ok || !contentType.includes("application/json")) {
      return { data: null, debug };
    }

    try {
      return { data: JSON.parse(bodyText), debug };
    } catch (error) {
      return {
        data: null,
        debug: {
          ...debug,
          error: error instanceof Error ? error.message : "JSON inválido",
        },
      };
    }
  } catch (error) {
    return {
      data: null,
      debug: {
        url,
        status: 0,
        ok: false,
        contentType: "",
        error: error instanceof Error ? error.message : "Erro desconhecido no fetch da Kick",
      },
    };
  }
}

async function fetchKickJson(url: string) {
  const { data } = await fetchKickJsonDetailed(url);
  return data;
}

function summarizeKickPayload(payload: any) {
  if (!payload || typeof payload !== "object") return payload ?? null;

  return {
    topLevelKeys: Object.keys(payload),
    id: payload.id ?? payload.channel_id ?? payload?.data?.id ?? null,
    slug: payload.slug ?? payload.username ?? payload?.data?.slug ?? null,
    hasLivestream: Boolean(payload.livestream || payload.recent_livestream || payload?.data?.livestream),
    followerCandidates: {
      followers_count: payload.followers_count,
      follower_count: payload.follower_count,
      followersCount: payload.followersCount,
      followers: payload.followers,
      user_followers_count: payload?.user?.followers_count,
      stats_followers: payload?.stats?.followers,
      streamer_channel_followers_count: payload?.streamer_channel?.followers_count,
    },
    liveCandidates: {
      is_live: payload.is_live,
      isLive: payload.isLive,
      livestream_is_live: payload?.livestream?.is_live,
      recent_livestream_is_live: payload?.recent_livestream?.is_live,
      data_is_live: payload?.data?.is_live,
    },
  };
}

function getKickLivestream(channel: any, livestreamPayload: any) {
  return (
    channel?.livestream ||
    channel?.recent_livestream ||
    livestreamPayload?.livestream ||
    livestreamPayload?.data ||
    livestreamPayload ||
    null
  );
}

function getKickFollowerCount(channel: any) {
  return readNumberFromPaths(channel, [
    "followers_count",
    "follower_count",
    "followersCount",
    "followers",
    "followers.total",
    "user.followers_count",
    "user.follower_count",
    "user.followersCount",
    "stats.followers",
    "stats.followers_count",
    "streamer_channel.followers_count",
  ]);
}

function getKickLiveFlag(channel: any, livestream: any) {
  const explicit = readBooleanFromPaths(
    { channel, livestream },
    [
      "channel.is_live",
      "channel.isLive",
      "channel.livestream.is_live",
      "channel.livestream.isLive",
      "channel.recent_livestream.is_live",
      "channel.recent_livestream.isLive",
      "livestream.is_live",
      "livestream.isLive",
      "livestream.live",
    ],
  );

  if (explicit !== undefined) return explicit;

  return Boolean(
    livestream &&
      (livestream.id ||
        livestream.session_title ||
        livestream.slug ||
        livestream.start_time ||
        livestream.viewer_count !== undefined),
  );
}

async function getKickFollowerCountByChannelId(channel: any) {
  const channelId = channel?.id || channel?.channel_id || channel?.streamer_channel?.id;

  if (!channelId) return 0;

  const payload = await fetchKickJson(
    `https://api.kick.com/channels/${encodeURIComponent(String(channelId))}/followers-count`,
  );

  return readNumberFromPaths(payload, [
    "count",
    "followers_count",
    "follower_count",
    "followersCount",
    "followers",
    "data.count",
    "data.followers_count",
  ]);
}

async function getKickLiveStatus(
  username: string,
  debugMode = false,
): Promise<LiveStatusResponse> {
  const cleanUsername = normalizeKickUsername(username);

  if (!cleanUsername) {
    return {
      platform: "kick",
      username: "",
      isLive: false,
      followerCount: 0,
      externalCount: 0,
      url: "https://kick.com",
    };
  }

  const channelUrl = `https://kick.com/api/v2/channels/${encodeURIComponent(cleanUsername)}`;
  const livestreamUrl = `https://kick.com/api/v2/channels/${encodeURIComponent(cleanUsername)}/livestream`;
  const { data: channel, debug: channelDebug } = await fetchKickJsonDetailed(channelUrl);

  if (!channel) {
    console.error("Erro Kick: canal não retornou JSON válido", cleanUsername, channelDebug);

    return {
      platform: "kick",
      username: cleanUsername,
      isLive: false,
      followerCount: 0,
      externalCount: 0,
      url: `https://kick.com/${cleanUsername}`,
      ...(debugMode
        ? {
            debug: {
              cleanUsername,
              channelRequest: channelDebug,
            },
          }
        : {}),
    };
  }

  const { data: livestreamPayload, debug: livestreamDebug } =
    await fetchKickJsonDetailed(livestreamUrl);

  const livestream = getKickLivestream(channel, livestreamPayload);
  const apiFollowerCount = getKickFollowerCount(channel);
  const fallbackFollowerCount = apiFollowerCount
    ? 0
    : await getKickFollowerCountByChannelId(channel).catch(() => 0);
  const followerCount = apiFollowerCount || fallbackFollowerCount;
  const isLive = getKickLiveFlag(channel, livestream);
  const kickDebugPayload = debugMode
    ? {
        cleanUsername,
        channelRequest: channelDebug,
        livestreamRequest: livestreamDebug,
        channelSummary: summarizeKickPayload(channel),
        livestreamSummary: summarizeKickPayload(livestreamPayload),
        selectedLivestreamSummary: summarizeKickPayload(livestream),
        computed: {
          apiFollowerCount,
          fallbackFollowerCount,
          followerCount,
          isLive,
        },
      }
    : undefined;

  if (!isLive) {
    return {
      platform: "kick",
      username: cleanUsername,
      isLive: false,
      followerCount,
      externalCount: followerCount,
      thumbnail:
        channel?.user?.profile_pic ||
        channel?.user?.profilepic ||
        channel?.banner_image?.url ||
        channel?.offline_banner_image?.url,
      url: `https://kick.com/${cleanUsername}`,
      ...(kickDebugPayload ? { debug: kickDebugPayload } : {}),
    };
  }

  return {
    platform: "kick",
    username: cleanUsername,
    isLive: true,
    title: livestream?.session_title || livestream?.slug || channel?.session_title,
    viewerCount: readNumberFromPaths(livestream, [
      "viewer_count",
      "viewers_count",
      "viewersCount",
      "viewers",
    ]),
    gameName:
      livestream?.categories?.[0]?.name ||
      livestream?.category?.name ||
      livestream?.subcategory?.name,
    startedAt:
      livestream?.start_time || livestream?.created_at || livestream?.started_at,
    thumbnail:
      livestream?.thumbnail?.url ||
      livestream?.thumbnail ||
      livestream?.categories?.[0]?.banner?.url ||
      livestream?.category?.banner?.url ||
      channel?.banner_image?.url ||
      channel?.offline_banner_image?.url ||
      channel?.user?.profile_pic ||
      channel?.user?.profilepic,
    followerCount,
    externalCount: followerCount,
    url: `https://kick.com/${cleanUsername}`,
    ...(kickDebugPayload ? { debug: kickDebugPayload } : {}),
  };
}

function normalizeYouTubeUsername(username: string) {
  const value = username.trim();

  if (!value) return "";

  if (!value.startsWith("http")) {
    return value
      .replace(/^@/, "")
      .replace(/^youtube\.com\//i, "")
      .replace(/^www\.youtube\.com\//i, "")
      .replace(/^c\//i, "")
      .replace(/^channel\//i, "")
      .replace(/^user\//i, "")
      .replace(/^@/, "")
      .split("?")[0]
      .split("/")[0]
      .trim();
  }

  try {
    const url = new URL(value);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts[0] === "channel" && pathParts[1]) return pathParts[1];

    if ((pathParts[0] === "c" || pathParts[0] === "user") && pathParts[1]) {
      return pathParts[1].replace(/^@/, "");
    }

    if (pathParts[0]) return pathParts[0].replace(/^@/, "");

    return "";
  } catch {
    return value.replace(/^@/, "");
  }
}

function getYouTubeFallbackUrl(username: string) {
  const value = username.trim();

  if (!value) return "https://www.youtube.com";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const cleanUsername = normalizeYouTubeUsername(value);

  if (!cleanUsername) return "https://www.youtube.com";

  if (cleanUsername.startsWith("UC")) {
    return `https://www.youtube.com/channel/${cleanUsername}`;
  }

  if (cleanUsername.startsWith("@")) {
    return `https://www.youtube.com/${cleanUsername}`;
  }

  return `https://www.youtube.com/${cleanUsername}`;
}

async function fetchYouTubeChannelByHandle(username: string, apiKey: string) {
  const cleanUsername = normalizeYouTubeUsername(username);

  if (!cleanUsername || cleanUsername.startsWith("UC")) return null;

  const params = new URLSearchParams({
    part: "snippet,statistics",
    forHandle: cleanUsername,
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    {
      next: {
        revalidate: 3600,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro YouTube forHandle:", data);
    throw new Error("Erro ao buscar dados do YouTube por handle");
  }

  return data.items?.[0] ?? null;
}

async function fetchYouTubeChannelById(channelId: string, apiKey: string) {
  const params = new URLSearchParams({
    part: "snippet,statistics",
    id: channelId,
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    {
      next: {
        revalidate: 3600,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro YouTube channelId:", data);
    throw new Error("Erro ao buscar dados do YouTube por channelId");
  }

  return data.items?.[0] ?? null;
}

async function fetchYouTubeChannelByCustomUrl(
  username: string,
  apiKey: string,
) {
  const cleanUsername = normalizeYouTubeUsername(username);

  if (!cleanUsername || cleanUsername.startsWith("UC")) return null;

  const candidates = [
    getYouTubeFallbackUrl(cleanUsername),
    `https://www.youtube.com/${cleanUsername}`,
    `https://www.youtube.com/c/${cleanUsername}`,
    `https://www.youtube.com/user/${cleanUsername}`,
  ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        next: {
          revalidate: 3600,
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; CardpocBot/1.0; +https://www.cardpoc.com)",
        },
        redirect: "follow",
      });

      if (!response.ok) continue;

      const finalUrl = response.url || candidate;
      const html = await response.text();

      const channelIdMatch =
        html.match(/"channelId"\s*:\s*"(UC[^"]+)"/) ||
        html.match(/"externalId"\s*:\s*"(UC[^"]+)"/) ||
        html.match(
          /<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[^"']+)["']/i,
        ) ||
        html.match(
          /<meta[^>]+content=["'](UC[^"']+)["'][^>]+itemprop=["']channelId["']/i,
        ) ||
        finalUrl.match(/\/channel\/(UC[^/?#]+)/i);

      if (channelIdMatch?.[1]) {
        const channelById = await fetchYouTubeChannelById(
          channelIdMatch[1],
          apiKey,
        );

        if (channelById) return channelById;
      }

      const canonicalMatch =
        html.match(
          /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i,
        ) ||
        finalUrl.match(/(https?:\/\/(?:www\.)?youtube\.com\/@[^/?#]+)/i);

      const canonicalUrl = canonicalMatch?.[1];

      if (canonicalUrl) {
        const handleMatch = canonicalUrl.match(/youtube\.com\/@([^/?#]+)/i);

        if (handleMatch?.[1]) {
          const channelByHandle = await fetchYouTubeChannelByHandle(
            handleMatch[1],
            apiKey,
          );

          if (channelByHandle) return channelByHandle;
        }

        const canonicalChannelMatch = canonicalUrl.match(
          /youtube\.com\/channel\/(UC[^/?#]+)/i,
        );

        if (canonicalChannelMatch?.[1]) {
          const channelById = await fetchYouTubeChannelById(
            canonicalChannelMatch[1],
            apiKey,
          );

          if (channelById) return channelById;
        }
      }
    } catch (error) {
      console.error("Erro ao resolver URL customizada do YouTube:", error);
    }
  }

  return null;
}

async function searchYouTubeChannel(username: string, apiKey: string) {
  const cleanUsername = normalizeYouTubeUsername(username);

  if (!cleanUsername) return null;

  const params = new URLSearchParams({
    part: "snippet",
    type: "channel",
    maxResults: "1",
    q: cleanUsername,
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    {
      next: {
        revalidate: 3600,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro YouTube search:", data);
    throw new Error("Erro ao pesquisar canal no YouTube");
  }

  const channelId = data.items?.[0]?.snippet?.channelId;

  if (!channelId) return null;

  return fetchYouTubeChannelById(channelId, apiKey);
}

async function getYouTubeChannelStatus(
  username: string,
): Promise<LiveStatusResponse> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY não configurada");
  }

  const cleanUsername = normalizeYouTubeUsername(username);

  let channel = null;

  if (cleanUsername.startsWith("UC")) {
    channel = await fetchYouTubeChannelById(cleanUsername, apiKey);
  }

  if (!channel) {
    channel = await fetchYouTubeChannelByHandle(cleanUsername, apiKey);
  }

  if (!channel) {
    channel = await fetchYouTubeChannelByCustomUrl(cleanUsername, apiKey);
  }

  if (!channel) {
    channel = await searchYouTubeChannel(cleanUsername, apiKey);
  }

  if (!channel) {
    return {
      platform: "youtube",
      username,
      isLive: false,
      title: username,
      subscriberCount: 0,
      externalCount: 0,
      url: getYouTubeFallbackUrl(username),
    };
  }

  const subscriberCount = Number(channel.statistics?.subscriberCount ?? 0);
  const channelId = channel.id as string;

  return {
    platform: "youtube",
    username: channel.snippet?.title || username,
    isLive: false,
    title: channel.snippet?.title,
    thumbnail: channel.snippet?.thumbnails?.high?.url,
    subscriberCount,
    viewCount: Number(channel.statistics?.viewCount ?? 0),
    videoCount: Number(channel.statistics?.videoCount ?? 0),
    externalCount: subscriberCount,
    url: channelId
      ? `https://www.youtube.com/channel/${channelId}`
      : getYouTubeFallbackUrl(username),
  };
}

function normalizeDiscordInviteCode(input: string) {
  const value = input.trim();

  if (!value) return "";

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (
      hostname === "discord.gg" ||
      hostname === "discord.com" ||
      hostname === "discordapp.com"
    ) {
      if (hostname === "discord.gg" && pathParts[0]) {
        return pathParts[0].split("?")[0].trim();
      }

      const inviteIndex = pathParts.findIndex((part) => part === "invite");

      if (inviteIndex >= 0 && pathParts[inviteIndex + 1]) {
        return pathParts[inviteIndex + 1].split("?")[0].trim();
      }
    }
  } catch {
    // Se não for uma URL válida, trata como código puro do convite.
  }

  return value
    .replace(/^@/, "")
    .replace(/^discord\.gg\//i, "")
    .replace(/^discord\.com\/invite\//i, "")
    .replace(/^discordapp\.com\/invite\//i, "")
    .split("?")[0]
    .split("/")[0]
    .trim();
}

async function getDiscordServerStatus(
  invite: string,
): Promise<LiveStatusResponse> {
  const inviteCode = normalizeDiscordInviteCode(invite);

  if (!inviteCode) {
    return {
      platform: "discord",
      username: invite,
      isLive: false,
      memberCount: 0,
      onlineMemberCount: 0,
      externalCount: 0,
      url: "https://discord.com",
    };
  }

  const discordResponse = await fetch(
    `https://discord.com/api/v10/invites/${encodeURIComponent(
      inviteCode,
    )}?with_counts=true&with_expiration=true`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "CardpocBot/1.0 (+https://www.cardpoc.com)",
      },
      next: {
        revalidate: 3600,
      },
    },
  );

  if (!discordResponse.ok) {
    console.error("Erro Discord invite:", discordResponse.status);

    return {
      platform: "discord",
      username: inviteCode,
      isLive: false,
      memberCount: 0,
      onlineMemberCount: 0,
      externalCount: 0,
      url: `https://discord.gg/${inviteCode}`,
    };
  }

  const data = await discordResponse.json();

  const memberCount = Number(data?.approximate_member_count ?? 0);
  const onlineMemberCount = Number(data?.approximate_presence_count ?? 0);
  const guildName = data?.guild?.name || inviteCode;
  const guildIcon = data?.guild?.icon
    ? `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png`
    : undefined;

  return {
    platform: "discord",
    username: guildName,
    isLive: false,
    title: guildName,
    thumbnail: guildIcon,
    memberCount,
    onlineMemberCount,
    externalCount: memberCount,
    url: `https://discord.gg/${inviteCode}`,
  };
}

async function upsertCreatorLiveStatus(
  creatorId: string | null,
  status: LiveStatusResponse,
) {
  if (!creatorId) return;

  if (status.platform !== "twitch" && status.platform !== "kick") return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn(
      "Supabase service role env missing. Skipping creator_live_status upsert.",
    );
    return;
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await adminSupabase.from("creator_live_status").upsert(
    {
      creator_id: creatorId,
      platform: status.platform,
      platform_username: status.username,
      is_live: Boolean(status.isLive),
      title: status.title ?? null,
      viewer_count: Number(status.viewerCount ?? 0),
      game_name: status.gameName ?? null,
      started_at: status.startedAt ?? null,
      thumbnail_url: status.thumbnail ?? null,
      live_url: status.url ?? null,
      raw_payload: status,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "creator_id,platform",
    },
  );

  if (error) {
    console.error("Erro ao salvar creator_live_status:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const platform =
      (request.nextUrl.searchParams.get("platform") as SocialPlatform) ||
      "twitch";

    const username = request.nextUrl.searchParams.get("username");
    const creatorId = request.nextUrl.searchParams.get("creatorId");

    if (!username) {
      return NextResponse.json(
        {
          error: "username is required",
        },
        {
          status: 400,
        },
      );
    }

    if (platform === "kick") {
      const debugMode =
        request.nextUrl.searchParams.get("debug") === "1" ||
        process.env.KICK_DEBUG === "true";
      const status = await getKickLiveStatus(username, debugMode);
      await upsertCreatorLiveStatus(creatorId, status);
      return NextResponse.json(status);
    }

    if (platform === "youtube") {
      const status = await getYouTubeChannelStatus(username);
      return NextResponse.json(status);
    }

    if (platform === "discord") {
      const status = await getDiscordServerStatus(username);
      return NextResponse.json(status);
    }

    const status = await getTwitchLiveStatus(username);
    await upsertCreatorLiveStatus(creatorId, status);
    return NextResponse.json(status);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        isLive: false,
        externalCount: 0,
        error:
          error instanceof Error ? error.message : "Erro desconhecido na API",
      },
      {
        status: 500,
      },
    );
  }
}
