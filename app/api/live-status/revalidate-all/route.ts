import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type LivePlatform = "twitch" | "kick";

type LiveStatusResponse = {
  platform: LivePlatform;
  username: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  startedAt?: string;
  thumbnail?: string;
  url: string;
  followerCount?: number;
  externalCount?: number;
};

type LiveStatusRow = {
  creator_id: string | null;
  platform: string | null;
  platform_username: string | null;
};

const DEFAULT_LIVE_STATUS_CRON_SECRET =
  "cardpoc_cron_live_status_2026_v1_9kL4mN72pQ";

const REVALIDATE_PAGE_SIZE = 500;
const REVALIDATE_CONCURRENCY = 5;

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase service role env missing.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isAuthorized(request: NextRequest) {
  const configuredSecret =
    process.env.LIVE_STATUS_CRON_SECRET ||
    process.env.CRON_SECRET ||
    DEFAULT_LIVE_STATUS_CRON_SECRET;

  const receivedSecret =
    request.nextUrl.searchParams.get("cron_secret") ||
    request.headers.get("x-cron-secret") ||
    "";

  const vercelCronHeader = request.headers.get("x-vercel-cron");

  return receivedSecret === configuredSecret || vercelCronHeader === "1";
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

async function fetchKickJson(url: string) {
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

  if (!response.ok || !contentType.includes("application/json")) {
    return null;
  }

  return response.json();
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

async function getTwitchAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Twitch env missing.");
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error("Erro ao gerar token da Twitch.");
  }

  return String(data.access_token);
}

async function getTwitchLiveStatus(
  username: string,
  accessToken: string,
): Promise<LiveStatusResponse> {
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID não configurado.");
  }

  const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();

  const response = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(
      cleanUsername,
    )}`,
    {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Erro ao consultar live da Twitch.");
  }

  const stream = data.data?.[0];

  if (!stream) {
    return {
      platform: "twitch",
      username: cleanUsername,
      isLive: false,
      viewerCount: 0,
      externalCount: 0,
      url: `https://twitch.tv/${cleanUsername}`,
    };
  }

  return {
    platform: "twitch",
    username: cleanUsername,
    isLive: true,
    title: stream.title,
    viewerCount: Number(stream.viewer_count ?? 0),
    gameName: stream.game_name,
    startedAt: stream.started_at,
    thumbnail: stream.thumbnail_url,
    externalCount: Number(stream.viewer_count ?? 0),
    url: `https://twitch.tv/${cleanUsername}`,
  };
}

async function getKickLiveStatus(username: string): Promise<LiveStatusResponse> {
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

  const channel = await fetchKickJson(
    `https://kick.com/api/v2/channels/${encodeURIComponent(cleanUsername)}`,
  );

  if (!channel) {
    return {
      platform: "kick",
      username: cleanUsername,
      isLive: false,
      followerCount: 0,
      externalCount: 0,
      url: `https://kick.com/${cleanUsername}`,
    };
  }

  const livestreamPayload = await fetchKickJson(
    `https://kick.com/api/v2/channels/${encodeURIComponent(cleanUsername)}/livestream`,
  );

  const livestream = getKickLivestream(channel, livestreamPayload);
  const apiFollowerCount = getKickFollowerCount(channel);
  const fallbackFollowerCount = apiFollowerCount
    ? 0
    : await getKickFollowerCountByChannelId(channel).catch(() => 0);
  const followerCount = apiFollowerCount || fallbackFollowerCount;
  const isLive = getKickLiveFlag(channel, livestream);

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
  };
}

async function upsertCreatorLiveStatus(
  adminSupabase: any,
  creatorId: string,
  status: LiveStatusResponse,
) {
  const checkedAt = new Date().toISOString();

  const liveStatusPayload = {
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
    last_checked_at: checkedAt,
    updated_at: checkedAt,
  };

  const { error } = await (adminSupabase as any)
    .from("creator_live_status")
    .upsert(liveStatusPayload, {
      onConflict: "creator_id,platform",
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function loadKnownLiveStatusRows(
  adminSupabase: any,
) {
  const rows: LiveStatusRow[] = [];
  let from = 0;

  while (true) {
    const to = from + REVALIDATE_PAGE_SIZE - 1;

    const { data, error } = await (adminSupabase as any)
      .from("creator_live_status")
      .select("creator_id,platform,platform_username")
      .in("platform", ["twitch", "kick"])
      .not("platform_username", "is", null)
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const pageRows = (Array.isArray(data) ? data : []) as LiveStatusRow[];

    rows.push(...pageRows);

    if (pageRows.length < REVALIDATE_PAGE_SIZE) break;

    from += REVALIDATE_PAGE_SIZE;
  }

  const unique = new Map<string, LiveStatusRow>();

  for (const row of rows) {
    const creatorId = row.creator_id ? String(row.creator_id) : "";
    const platform = row.platform ? String(row.platform).toLowerCase() : "";
    const username = row.platform_username ? String(row.platform_username) : "";

    if (!creatorId || !username) continue;
    if (platform !== "twitch" && platform !== "kick") continue;

    unique.set(`${creatorId}:${platform}`, {
      creator_id: creatorId,
      platform,
      platform_username: username,
    });
  }

  return Array.from(unique.values());
}

async function runLimited<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
) {
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;

      await task(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const startedAt = Date.now();
  const adminSupabase = getSupabaseAdminClient();
  const rows = await loadKnownLiveStatusRows(adminSupabase);

  let twitchAccessToken: string | null = null;
  let checked = 0;
  let updated = 0;
  let live = 0;
  let offline = 0;
  let failed = 0;

  const errors: Array<{
    creatorId: string;
    platform: string;
    username: string;
    error: string;
  }> = [];

  await runLimited(rows, REVALIDATE_CONCURRENCY, async (row) => {
    const creatorId = String(row.creator_id);
    const platform = String(row.platform) as LivePlatform;
    const username = String(row.platform_username || "");

    try {
      checked += 1;

      let status: LiveStatusResponse;

      if (platform === "twitch") {
        if (!twitchAccessToken) {
          twitchAccessToken = await getTwitchAccessToken();
        }

        status = await getTwitchLiveStatus(username, twitchAccessToken);
      } else {
        status = await getKickLiveStatus(username);
      }

      await upsertCreatorLiveStatus(adminSupabase, creatorId, status);

      updated += 1;

      if (status.isLive) {
        live += 1;
      } else {
        offline += 1;
      }
    } catch (error) {
      failed += 1;

      errors.push({
        creatorId,
        platform,
        username,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  return NextResponse.json({
    ok: true,
    checked,
    updated,
    live,
    offline,
    failed,
    errors: errors.slice(0, 25),
    durationMs: Date.now() - startedAt,
  });
}
