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

async function getKickLiveStatus(
  username: string,
): Promise<LiveStatusResponse> {
  const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();

  const kickResponse = await fetch(
    `https://kick.com/api/v2/channels/${encodeURIComponent(cleanUsername)}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      cache: "no-store",
    },
  );

  if (!kickResponse.ok) {
    console.error("Erro Kick V2:", kickResponse.status);

    return {
      platform: "kick",
      username: cleanUsername,
      isLive: false,
      followerCount: 0,
      externalCount: 0,
      url: `https://kick.com/${cleanUsername}`,
    };
  }

  const channel = await kickResponse.json();

  const livestream = channel?.livestream;
  const followerCount = getKickFollowerCount(channel);

  if (!livestream?.is_live) {
    return {
      platform: "kick",
      username: cleanUsername,
      isLive: false,
      followerCount,
      externalCount: followerCount,
      thumbnail: channel?.user?.profile_pic || channel?.banner_image?.url,
      url: `https://kick.com/${cleanUsername}`,
    };
  }

  return {
    platform: "kick",
    username: cleanUsername,
    isLive: true,
    title: livestream?.session_title,
    viewerCount: Number(livestream?.viewer_count ?? 0),
    gameName: livestream?.categories?.[0]?.name,
    startedAt: livestream?.start_time,
    thumbnail:
      livestream?.categories?.[0]?.banner?.url ||
      channel?.banner_image?.url ||
      channel?.user?.profile_pic,
    followerCount,
    externalCount: followerCount,
    url: `https://kick.com/${cleanUsername}`,
  };
}


function toSafeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getKickFollowerCount(channel: any) {
  return Math.max(
    toSafeNumber(channel?.followers_count),
    toSafeNumber(channel?.follower_count),
    toSafeNumber(channel?.followersCount),
    toSafeNumber(channel?.followers),
    toSafeNumber(channel?.user?.followers_count),
    toSafeNumber(channel?.user?.follower_count),
    toSafeNumber(channel?.user?.followersCount),
    toSafeNumber(channel?.user?.followers),
    toSafeNumber(channel?.stats?.followers_count),
    toSafeNumber(channel?.stats?.followers),
  );
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
      const status = await getKickLiveStatus(username);
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
