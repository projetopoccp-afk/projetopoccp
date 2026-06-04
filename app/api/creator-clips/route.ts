import { NextRequest, NextResponse } from "next/server";

type CreatorClip = {
  id: string;
  title: string;
  platform: "twitch" | "kick" | "youtube";
  url: string;
  thumbnailUrl: string;
  description?: string;
  createdAt?: string;
  viewCount?: number;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

function normalizeUsername(value: string | null) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .trim();
}

function parseYoutubeInput(value: string) {
  const rawValue = value.trim();

  if (!rawValue) return "";

  try {
    const withProtocol = /^https?:\/\//i.test(rawValue)
      ? rawValue
      : `https://${rawValue}`;
    const parsedUrl = new URL(withProtocol);
    const parts = parsedUrl.pathname.split("/").filter(Boolean);

    if (parts[0]?.startsWith("@")) return parts[0];
    if (parts[0] === "channel" && parts[1]) return parts[1];
    if (parts[0] === "c" && parts[1]) return parts[1];
    if (parts[0] === "user" && parts[1]) return parts[1];

    return parts[0] || rawValue.replace(/^@/, "");
  } catch {
    return rawValue.replace(/^@/, "");
  }
}

function parseIsoDurationToSeconds(duration: string) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return 0;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json,text/plain,*/*",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

let twitchTokenCache: { token: string; expiresAt: number } | null = null;

async function getTwitchToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  if (twitchTokenCache && twitchTokenCache.expiresAt > Date.now() + 60_000) {
    return twitchTokenCache.token;
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

  if (!response.ok) return null;

  const data = await response.json();
  const token = data?.access_token;

  if (!token) return null;

  twitchTokenCache = {
    token,
    expiresAt: Date.now() + Number(data?.expires_in || 3600) * 1000,
  };

  return token;
}

async function getTwitchClips(username: string): Promise<CreatorClip[]> {
  const login = normalizeUsername(username).toLowerCase();
  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = await getTwitchToken();

  if (!login || !clientId || !token) return [];

  const userData = await fetchJson<{ data?: Array<{ id: string }> }>(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`,
    {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const broadcasterId = userData?.data?.[0]?.id;

  if (!broadcasterId) return [];

  const startedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString();

  const clipsData = await fetchJson<{
    data?: Array<{
      id: string;
      url: string;
      title: string;
      thumbnail_url: string;
      created_at: string;
      view_count: number;
    }>;
  }>(
    `https://api.twitch.tv/helix/clips?broadcaster_id=${encodeURIComponent(
      broadcasterId
    )}&first=20&started_at=${encodeURIComponent(startedAt)}`,
    {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return (clipsData?.data || [])
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3)
    .map((clip) => ({
      id: `twitch-${clip.id}`,
      platform: "twitch" as const,
      title: clip.title || "Twitch clip",
      url: clip.url,
      thumbnailUrl: clip.thumbnail_url,
      createdAt: clip.created_at,
      viewCount: clip.view_count || 0,
    }));
}

function normalizeKickClip(rawClip: any, channel: string): CreatorClip | null {
  const id = rawClip?.id || rawClip?.uuid || rawClip?.slug || rawClip?.clip_id;

  const title =
    rawClip?.title || rawClip?.name || rawClip?.description || "Kick clip";

  const thumbnailUrl =
    rawClip?.thumbnail_url ||
    rawClip?.thumbnail ||
    rawClip?.thumbnailUrl ||
    rawClip?.preview ||
    rawClip?.image ||
    rawClip?.vod?.thumbnail ||
    "";

  const createdAt =
    rawClip?.created_at ||
    rawClip?.createdAt ||
    rawClip?.published_at ||
    rawClip?.date;

  const viewCount = Number(
    rawClip?.views || rawClip?.view_count || rawClip?.viewCount || 0,
  );

  const rawUrl = String(
    rawClip?.share_url ||
      rawClip?.clip_url ||
      rawClip?.link ||
      rawClip?.url ||
      "",
  ).trim();

  const normalizedRawUrl = rawUrl.toLowerCase();

  const isMediaUrl =
    normalizedRawUrl.includes(".m3u8") ||
    normalizedRawUrl.includes(".mp4") ||
    normalizedRawUrl.includes(".webm") ||
    normalizedRawUrl.includes(".jpg") ||
    normalizedRawUrl.includes(".jpeg") ||
    normalizedRawUrl.includes(".png") ||
    normalizedRawUrl.includes(".webp");

  const mediaClipId =
    rawUrl.match(/\/clips\/\d+\/(clip_[^/]+)/i)?.[1] ||
    thumbnailUrl.match(/\/clips\/\d+\/(clip_[^/]+)/i)?.[1];

  const explicitClipId =
    [rawClip?.slug, rawClip?.uuid, rawClip?.clip_id, rawClip?.id]
      .map((value) => String(value || "").trim())
      .find((value) => value.startsWith("clip_")) || "";

  const publicClipId = explicitClipId || mediaClipId || "";
  const publicClipUrl = publicClipId
    ? `https://kick.com/${encodeURIComponent(channel)}/clips/${publicClipId}`
    : "";

  const url = !isMediaUrl && rawUrl ? rawUrl : publicClipUrl;

  return {
    id: `kick-${publicClipId || id || thumbnailUrl || title}`,
    platform: "kick",
    title,
    url,
    thumbnailUrl,
    createdAt,
    viewCount,
  };
}

async function getKickClips(username: string): Promise<CreatorClip[]> {
  const channel = normalizeUsername(username).toLowerCase();

  if (!channel) return [];

  const endpointCandidates = [
    `https://kick.com/api/v2/channels/${encodeURIComponent(channel)}/clips`,
    `https://kick.com/api/v1/channels/${encodeURIComponent(channel)}/clips`,
    `https://kick.com/api/v2/channels/${encodeURIComponent(channel)}`,
  ];

  for (const endpoint of endpointCandidates) {
    const data = await fetchJson<any>(endpoint);
    const rawClips = Array.isArray(data)
      ? data
      : data?.clips?.data || data?.clips || data?.data?.clips || data?.data || [];

    if (!Array.isArray(rawClips)) continue;

    const clips = rawClips
      .map((clip) => normalizeKickClip(clip, channel))
      .filter(Boolean) as CreatorClip[];

    if (clips.length > 0) {
      return clips
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 3);
    }
  }

  return [];
}

async function resolveYoutubeChannelId(channelInput: string, apiKey: string) {
  const value = parseYoutubeInput(channelInput);

  if (!value) return "";

  if (value.startsWith("UC")) return value;

  if (value.startsWith("@")) {
    const byHandle = await fetchJson<{ items?: Array<{ id: string }> }>(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(
        value.replace("@", "")
      )}&key=${apiKey}`
    );

    if (byHandle?.items?.[0]?.id) return byHandle.items[0].id;
  }

  const search = await fetchJson<{ items?: Array<{ snippet?: { channelId?: string } }> }>(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(
      value
    )}&key=${apiKey}`
  );

  return search?.items?.[0]?.snippet?.channelId || "";
}

async function getYoutubeShorts(channelInput: string): Promise<CreatorClip[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || !channelInput.trim()) return [];

  const channelId = await resolveYoutubeChannelId(channelInput, apiKey);

  if (!channelId) return [];

  const searchData = await fetchJson<{
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        description?: string;
        publishedAt?: string;
        thumbnails?: Record<string, { url?: string }>;
      };
    }>;
  }>(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
      channelId
    )}&order=date&type=video&maxResults=25&key=${apiKey}`
  );

  const videoIds = (searchData?.items || [])
    .map((item) => item.id?.videoId)
    .filter(Boolean) as string[];

  if (videoIds.length === 0) return [];

  const videosData = await fetchJson<{
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        description?: string;
        publishedAt?: string;
        thumbnails?: Record<string, { url?: string }>;
      };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string };
    }>;
  }>(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(
      ","
    )}&key=${apiKey}`
  );

  return (videosData?.items || [])
    .filter((video) => {
      const durationSeconds = parseIsoDurationToSeconds(
        video.contentDetails?.duration || ""
      );

      return durationSeconds > 0 && durationSeconds <= 60;
    })
    .sort(
      (a, b) =>
        new Date(b.snippet?.publishedAt || 0).getTime() -
        new Date(a.snippet?.publishedAt || 0).getTime()
    )
    .slice(0, 3)
    .map((video) => ({
      id: `youtube-${video.id}`,
      platform: "youtube" as const,
      title: video.snippet?.title || "YouTube Short",
      description: video.snippet?.description || undefined,
      url: `https://www.youtube.com/shorts/${video.id}`,
      thumbnailUrl:
        video.snippet?.thumbnails?.maxres?.url ||
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
      createdAt: video.snippet?.publishedAt,
      viewCount: Number(video.statistics?.viewCount || 0),
    }));
}

export async function GET(request: NextRequest) {
  const twitch = request.nextUrl.searchParams.get("twitch");
  const kick = request.nextUrl.searchParams.get("kick");
  const youtubeChannels = request.nextUrl.searchParams.getAll("youtube");

  const results = await Promise.allSettled([
    twitch ? getTwitchClips(twitch) : Promise.resolve([]),
    kick ? getKickClips(kick) : Promise.resolve([]),
    ...youtubeChannels.map((channel) => getYoutubeShorts(channel)),
  ]);

  const clips = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((clip) => clip.url || clip.thumbnailUrl)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 9);

  return NextResponse.json({ clips });
}
