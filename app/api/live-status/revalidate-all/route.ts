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

function getAllowedCronSecrets() {
  return [
    process.env.LIVE_STATUS_CRON_SECRET,
    process.env.CRON_SECRET,
    DEFAULT_LIVE_STATUS_CRON_SECRET,
  ].filter((secret): secret is string => Boolean(secret && secret.trim()));
}

function readBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) return "";

  const value = authorizationHeader.trim();

  if (value.toLowerCase().startsWith("bearer ")) {
    return value.slice(7).trim();
  }

  return value;
}

function isAuthorized(request: NextRequest) {
  const allowedSecrets = getAllowedCronSecrets();

  const receivedSecrets = [
    request.nextUrl.searchParams.get("cron_secret"),
    request.headers.get("x-cron-secret"),
    readBearerToken(request.headers.get("authorization")),
  ].filter((secret): secret is string => Boolean(secret && secret.trim()));

  const vercelCronHeader = request.headers.get("x-vercel-cron");

  return (
    vercelCronHeader === "1" ||
    receivedSecrets.some((receivedSecret) =>
      allowedSecrets.includes(receivedSecret),
    )
  );
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

function readStringFromPaths(payload: any, paths: string[]) {
  for (const path of paths) {
    const value = readNestedValue(payload, path);

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return undefined;
}

function readBooleanFromPaths(payload: any, paths: string[]) {
  for (const path of paths) {
    const value = readNestedValue(payload, path);

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "live", "online"].includes(normalized)) return true;
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
};

type KickFetchResult<T = any> = {
  data: T | null;
  debug: KickFetchDebug;
};

async function fetchJsonWithDebug<T = any>(
  url: string,
  init?: RequestInit,
): Promise<KickFetchResult<T>> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const debug: KickFetchDebug = {
    url,
    status: response.status,
    ok: response.ok,
    contentType,
    bodyPreview: text.slice(0, 500),
  };

  if (!response.ok || !contentType.includes("application/json")) {
    return { data: null, debug };
  }

  try {
    return { data: JSON.parse(text) as T, debug };
  } catch {
    return { data: null, debug };
  }
}

let cachedKickAppToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

async function getKickAppAccessToken() {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const now = Date.now();

  if (cachedKickAppToken && cachedKickAppToken.expiresAt > now + 60_000) {
    return cachedKickAppToken.accessToken;
  }

  const { data, debug } = await fetchJsonWithDebug<{
    access_token?: string;
    expires_in?: number;
  }>("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!data?.access_token) {
    console.error("Erro Kick OAuth app token:", debug);
    return null;
  }

  cachedKickAppToken = {
    accessToken: data.access_token,
    expiresAt: now + Number(data.expires_in ?? 3600) * 1000,
  };

  return cachedKickAppToken.accessToken;
}

async function fetchKickOfficialJson<T = any>(
  path: string,
  accessToken: string,
): Promise<KickFetchResult<T>> {
  return fetchJsonWithDebug<T>(`https://api.kick.com/public/v1${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function fetchKickLegacyJson<T = any>(url: string) {
  return fetchJsonWithDebug<T>(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
      Referer: "https://kick.com/",
      Origin: "https://kick.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });
}

function extractFirstDataItem(payload: any) {
  if (Array.isArray(payload?.data)) return payload.data[0] ?? null;
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (Array.isArray(payload)) return payload[0] ?? null;
  return payload ?? null;
}

function getKickLivestream(channel: any, livestreamPayload: any) {
  const livestreamData = extractFirstDataItem(livestreamPayload);

  return (
    channel?.livestream ||
    channel?.recent_livestream ||
    livestreamData?.livestream ||
    livestreamData ||
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
    "broadcaster.followers_count",
  ]);
}

function getKickChannelId(channel: any) {
  return readStringFromPaths(channel, [
    "broadcaster_user_id",
    "user_id",
    "id",
    "channel_id",
    "streamer_channel.id",
    "user.id",
    "broadcaster.id",
  ]);
}

function getKickLiveFlag(channel: any, livestream: any) {
  const explicit = readBooleanFromPaths(
    { channel, livestream },
    [
      "channel.is_live",
      "channel.isLive",
      "channel.live",
      "channel.livestream.is_live",
      "channel.livestream.isLive",
      "channel.recent_livestream.is_live",
      "channel.recent_livestream.isLive",
      "livestream.is_live",
      "livestream.isLive",
      "livestream.live",
      "livestream.is_active",
    ],
  );

  if (explicit !== undefined) return explicit;

  return Boolean(
    livestream &&
      (livestream.id ||
        livestream.session_title ||
        livestream.title ||
        livestream.slug ||
        livestream.start_time ||
        livestream.started_at ||
        livestream.viewer_count !== undefined ||
        livestream.viewers_count !== undefined),
  );
}

async function getKickFollowerCountByChannelId(channel: any, accessToken?: string | null) {
  const channelId = getKickChannelId(channel);

  if (!channelId) return 0;

  if (accessToken) {
    const officialCandidates = [
      `/channels/${encodeURIComponent(String(channelId))}/followers-count`,
      `/channels/${encodeURIComponent(String(channelId))}/followers`,
    ];

    for (const candidate of officialCandidates) {
      const { data } = await fetchKickOfficialJson(candidate, accessToken).catch(() => ({
        data: null,
        debug: { url: candidate, status: 0, ok: false, contentType: "" },
      }));

      const count = readNumberFromPaths(data, [
        "count",
        "followers_count",
        "follower_count",
        "followersCount",
        "followers",
        "data.count",
        "data.followers_count",
      ]);

      if (count > 0) return count;
    }
  }

  const { data } = await fetchKickLegacyJson(
    `https://api.kick.com/channels/${encodeURIComponent(String(channelId))}/followers-count`,
  );

  return readNumberFromPaths(data, [
    "count",
    "followers_count",
    "follower_count",
    "followersCount",
    "followers",
    "data.count",
    "data.followers_count",
  ]);
}

function buildKickStatusFromPayloads(
  username: string,
  channel: any,
  livestreamPayload: any,
  followerCount: number,
): LiveStatusResponse {
  const livestream = getKickLivestream(channel, livestreamPayload);
  const isLive = getKickLiveFlag(channel, livestream);

  const thumbnail =
    readStringFromPaths(livestream, [
      "thumbnail.url",
      "thumbnail",
      "thumbnail_url",
      "category.banner.url",
      "categories.0.banner.url",
    ]) ||
    readStringFromPaths(channel, [
      "thumbnail.url",
      "thumbnail",
      "thumbnail_url",
      "banner_image.url",
      "offline_banner_image.url",
      "user.profile_pic",
      "user.profilepic",
    ]);

  if (!isLive) {
    return {
      platform: "kick",
      username,
      isLive: false,
      followerCount,
      externalCount: followerCount,
      thumbnail,
      url: `https://kick.com/${username}`,
    };
  }

  return {
    platform: "kick",
    username,
    isLive: true,
    title:
      readStringFromPaths(livestream, ["session_title", "title", "slug"]) ||
      readStringFromPaths(channel, ["session_title", "title"]),
    viewerCount: readNumberFromPaths(livestream, [
      "viewer_count",
      "viewers_count",
      "viewersCount",
      "viewers",
    ]),
    gameName: readStringFromPaths(livestream, [
      "categories.0.name",
      "category.name",
      "subcategory.name",
      "category",
    ]),
    startedAt: readStringFromPaths(livestream, [
      "start_time",
      "created_at",
      "started_at",
    ]),
    thumbnail,
    followerCount,
    externalCount: followerCount,
    url: `https://kick.com/${username}`,
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

  const accessToken = await getKickAppAccessToken();

  if (accessToken) {
    const channelResult = await fetchKickOfficialJson(
      `/channels?slug=${encodeURIComponent(cleanUsername)}`,
      accessToken,
    );
    const officialChannel = extractFirstDataItem(channelResult.data);

    if (officialChannel) {
      const channelId = getKickChannelId(officialChannel);
      const livestreamCandidates = [
        `/livestreams?broadcaster_user_id=${encodeURIComponent(String(channelId || ""))}`,
        `/livestreams?slug=${encodeURIComponent(cleanUsername)}`,
      ];

      let officialLivestreamPayload: any = null;
      for (const candidate of livestreamCandidates) {
        if (candidate.includes("broadcaster_user_id=") && !channelId) continue;

        const result = await fetchKickOfficialJson(candidate, accessToken);
        if (extractFirstDataItem(result.data)) {
          officialLivestreamPayload = result.data;
          break;
        }
      }

      const apiFollowerCount = getKickFollowerCount(officialChannel);
      const followerCount =
        apiFollowerCount ||
        (await getKickFollowerCountByChannelId(officialChannel, accessToken).catch(
          () => 0,
        ));

      const status = buildKickStatusFromPayloads(
        cleanUsername,
        officialChannel,
        officialLivestreamPayload,
        followerCount,
      );

      return status;
    }
  }

  const legacyChannelResult = await fetchKickLegacyJson(
    `https://kick.com/api/v2/channels/${encodeURIComponent(cleanUsername)}`,
  );
  const legacyChannel = legacyChannelResult.data;

  if (!legacyChannel) {
    return {
      platform: "kick",
      username: cleanUsername,
      isLive: false,
      followerCount: 0,
      externalCount: 0,
      url: `https://kick.com/${cleanUsername}`,
    };
  }

  const legacyLivestreamResult = await fetchKickLegacyJson(
    `https://kick.com/api/v2/channels/${encodeURIComponent(cleanUsername)}/livestream`,
  );
  const apiFollowerCount = getKickFollowerCount(legacyChannel);
  const followerCount =
    apiFollowerCount ||
    (await getKickFollowerCountByChannelId(legacyChannel, accessToken).catch(() => 0));

  const status = buildKickStatusFromPayloads(
    cleanUsername,
    legacyChannel,
    legacyLivestreamResult.data,
    followerCount,
  );

  return status;
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
