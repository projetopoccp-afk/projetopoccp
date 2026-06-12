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
  return username.trim().replace(/^@/, "").toLowerCase();
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

  const response = await fetch(
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

  if (!response.ok) {
    return {
      platform: "kick",
      username: cleanUsername,
      isLive: false,
      followerCount: 0,
      externalCount: 0,
      url: `https://kick.com/${cleanUsername}`,
    };
  }

  const channel = await response.json();
  const livestream = channel?.livestream;
  const followerCount = Number(channel?.followers_count ?? 0);

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

async function upsertCreatorLiveStatus(
  adminSupabase: ReturnType<typeof createClient>,
  creatorId: string,
  status: LiveStatusResponse,
) {
  const checkedAt = new Date().toISOString();

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
      last_checked_at: checkedAt,
      updated_at: checkedAt,
    },
    {
      onConflict: "creator_id,platform",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function loadKnownLiveStatusRows(
  adminSupabase: ReturnType<typeof createClient>,
) {
  const rows: LiveStatusRow[] = [];
  let from = 0;

  while (true) {
    const to = from + REVALIDATE_PAGE_SIZE - 1;

    const { data, error } = await adminSupabase
      .from("creator_live_status")
      .select("creator_id,platform,platform_username")
      .in("platform", ["twitch", "kick"])
      .not("platform_username", "is", null)
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...((data || []) as LiveStatusRow[]));

    if (!data || data.length < REVALIDATE_PAGE_SIZE) break;

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
