import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type YouTubeVideo = {
  id: string;
  title: string;
  description: string;

  publishedAt?: string;

  sourceChannel?: string;
  sourceThumbnail?: string;

  hasPaidProductPlacement?: boolean;

  url: string;
};

type DetectedPartnership = {
  brandName: string;
  partnershipType: string;
  sourceChannel?: string;
  sourceThumbnail?: string;
  detectionReason: string;
  confidenceScore: number;
  evidenceText: string;
  sourceUrl: string;
  videoId: string;
  videoTitle: string;
  publishedAt?: string;
};

const PARTNERSHIP_KEYWORDS = [
  "patrocinado",
  "patrocinada",
  "publi",
  "publicidade",
  "parceria",
  "cupom",
  "desconto",
  "use o cupom",
  "use meu cupom",
  "código",
  "sponsor",
  "sponsored",
  "partner",
  "partnership",
];

const IGNORED_DOMAINS = [
  "youtube",
  "youtu",
  "google",
  "instagram",
  "facebook",
  "twitch",
  "kick",
  "discord",
  "twitter",
  "x",
  "tiktok",
  "linktr",
  "beacons",
  "streamlabs",
  "streamelements",
];

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin env vars não configuradas.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeYouTubeInput(input: string) {
  const value = input.trim();

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

async function fetchYouTubeChannelByHandle(input: string, apiKey: string) {
  const cleanInput = normalizeYouTubeInput(input);

  if (!cleanInput || cleanInput.startsWith("UC")) return null;

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    forHandle: cleanInput,
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    { cache: "no-store" }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro YouTube forHandle:", data);
    return null;
  }

  return data.items?.[0] ?? null;
}

async function fetchYouTubeChannelById(channelId: string, apiKey: string) {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: channelId,
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
    { cache: "no-store" }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro YouTube channelId:", data);
    return null;
  }

  return data.items?.[0] ?? null;
}

async function searchYouTubeChannel(input: string, apiKey: string) {
  const cleanInput = normalizeYouTubeInput(input);

  if (!cleanInput) return null;

  const params = new URLSearchParams({
    part: "snippet",
    type: "channel",
    maxResults: "1",
    q: cleanInput,
    key: apiKey,
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    { cache: "no-store" }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro YouTube search:", data);
    return null;
  }

  const channelId = data.items?.[0]?.snippet?.channelId;

  if (!channelId) return null;

  return fetchYouTubeChannelById(channelId, apiKey);
}

async function resolveYouTubeChannel(input: string, apiKey: string) {
  const cleanInput = normalizeYouTubeInput(input);

  if (!cleanInput) return null;

  if (cleanInput.startsWith("UC")) {
    const byId = await fetchYouTubeChannelById(cleanInput, apiKey);
    if (byId) return byId;
  }

  const byHandle = await fetchYouTubeChannelByHandle(cleanInput, apiKey);
  if (byHandle) return byHandle;

  const bySearch = await searchYouTubeChannel(cleanInput, apiKey);
  if (bySearch) return bySearch;

  return null;
}

async function fetchRecentVideosFromUploadsPlaylist(
  uploadsPlaylistId: string,
  apiKey: string
): Promise<YouTubeVideo[]> {
  const playlistParams = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: "20",
    key: apiKey,
  });

  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams.toString()}`,
    { cache: "no-store" }
  );

  const playlistData = await playlistResponse.json();

  if (!playlistResponse.ok) {
    console.error("Erro YouTube playlistItems:", playlistData);
    return [];
  }

  const videoIds = (playlistData.items ?? [])
    .map((item: any) => item?.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) return [];

  const videosParams = new URLSearchParams({
    part: "snippet,paidProductPlacementDetails",
    id: videoIds.join(","),
    key: apiKey,
  });

  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`,
    { cache: "no-store" }
  );

  const videosData = await videosResponse.json();

  if (!videosResponse.ok) {
    console.error("Erro YouTube videos:", videosData);
    return [];
  }

  return (videosData.items ?? []).map((item: any) => ({
  id: item.id,
  title: item.snippet?.title ?? "",
  description: item.snippet?.description ?? "",
  publishedAt: item.snippet?.publishedAt,

  sourceChannel: item.snippet?.channelTitle ?? "",

  sourceThumbnail:
    item.snippet?.thumbnails?.maxres?.url ||
    item.snippet?.thumbnails?.high?.url ||
    item.snippet?.thumbnails?.medium?.url ||
    item.snippet?.thumbnails?.default?.url ||
    "",

  hasPaidProductPlacement:
    item.paidProductPlacementDetails?.hasPaidProductPlacement === true,

  url: `https://www.youtube.com/watch?v=${item.id}`,
}));
}

function hasPartnershipKeyword(text: string) {
  const normalized = text.toLowerCase();

  return PARTNERSHIP_KEYWORDS.some((keyword) =>
    normalized.includes(keyword.toLowerCase())
  );
}

function extractDomains(text: string) {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) ?? [];

  return matches
    .map((rawUrl) => {
      try {
        const url = new URL(rawUrl);
        const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
        const parts = hostname.split(".");
        const domain = parts.length >= 2 ? parts[parts.length - 2] : parts[0];

        if (!domain) return null;

        if (IGNORED_DOMAINS.some((ignored) => domain.includes(ignored))) {
          return null;
        }

        return domain;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as string[];
}

function formatBrandName(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function detectBrandNearKeywords(text: string) {
  const patterns = [
    /(?:cupom|código|code)\s+([a-zA-Z0-9_-]{3,30})/i,
    /(?:parceria com|patrocinado por|patrocinada por|sponsored by|partnered with)\s+([a-zA-Z0-9À-ÿ\s._-]{3,40})/i,
    /(?:use o cupom|use meu cupom|use code)\s+([a-zA-Z0-9_-]{3,30})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return formatBrandName(match[1].split("\n")[0].trim());
    }
  }

  return null;
}

function detectPartnershipsFromVideo(video: YouTubeVideo): DetectedPartnership[] {
  const text = `${video.title}\n${video.description}`.trim();
  const detected: DetectedPartnership[] = [];

  const hasKeyword = hasPartnershipKeyword(text);
  const brandFromKeyword = detectBrandNearKeywords(text);
  const domains = Array.from(new Set(extractDomains(text)));

  if (video.hasPaidProductPlacement) {
    detected.push({
      brandName: brandFromKeyword || domains[0] ? formatBrandName(brandFromKeyword || domains[0]) : "Marca não identificada",
      partnershipType: "sponsorship",
      detectionReason: "paid_product_placement",
      confidenceScore: brandFromKeyword || domains[0] ? 90 : 82,
      evidenceText: video.title,
      sourceUrl: video.url,
      videoId: video.id,
      videoTitle: video.title,
      publishedAt: video.publishedAt,
      sourceChannel: video.sourceChannel,
      sourceThumbnail: video.sourceThumbnail,
    });
  }

  if (hasKeyword) {
    const brandName =
      brandFromKeyword ||
      (domains[0] ? formatBrandName(domains[0]) : "Marca não identificada");

    detected.push({
      brandName,
      partnershipType: text.toLowerCase().includes("cupom")
        ? "campaign"
        : "sponsorship",
      detectionReason: "keyword_match",
      confidenceScore: brandFromKeyword || domains[0] ? 78 : 60,
      evidenceText: text.slice(0, 600),
      sourceUrl: video.url,
      videoId: video.id,
      videoTitle: video.title,
      publishedAt: video.publishedAt,
      sourceChannel: video.sourceChannel,
      sourceThumbnail: video.sourceThumbnail,
    });
  }

  return detected;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();

    const cronSecret = process.env.CRON_SECRET;
const cronHeader =
  request.headers.get("x-cron-secret") ||
  request.nextUrl.searchParams.get("cron_secret");

const isCronRequest =
  cronSecret &&
  cronHeader &&
  cronHeader === cronSecret;

if (!isCronRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      { error: "Usuário não autenticado." },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json(
      { error: "Sessão inválida." },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_admin !== true) {
    return NextResponse.json(
      { error: "Apenas administradores podem executar esta ação." },
      { status: 403 }
    );
  }
}

    const { data: youtubeLinks, error: linksError } = await supabase
      .from("creator_social_links")
      .select("id, creator_id, platform, url")
      .eq("platform", "youtube");

    if (linksError) {
      throw linksError;
    }

    let scannedCreators = 0;
    let scannedVideos = 0;
    let suggestionsCreated = 0;
    let duplicatesSkipped = 0;
    const errors: string[] = [];

    for (const link of youtubeLinks ?? []) {
      try {
        scannedCreators += 1;

        const channel = await resolveYouTubeChannel(link.url, apiKey);
        const uploadsPlaylistId =
          channel?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
          errors.push(`Canal não encontrado: ${link.url}`);
          continue;
        }

        const videos = await fetchRecentVideosFromUploadsPlaylist(
          uploadsPlaylistId,
          apiKey
        );

        scannedVideos += videos.length;

        for (const video of videos) {
          const detections = detectPartnershipsFromVideo(video);

          for (const detection of detections) {
            const { data: existing } = await supabase
              .from("creator_partnerships")
              .select("id")
              .eq("creator_id", link.creator_id)
              .eq("source_platform", "youtube")
              .eq("brand_name", detection.brandName)
              .in("status", ["suggested", "verified", "manual"])
              .maybeSingle();

            if (existing?.id) {
              duplicatesSkipped += 1;
              continue;
            }

            const { error: insertError } = await supabase
              .from("creator_partnerships")
              .insert({
                creator_id: link.creator_id,
                brand_name: detection.brandName,
                source_title: detection.videoTitle,
                source_thumbnail: detection.sourceThumbnail,
                source_channel: detection.sourceChannel,
                source_published_at: detection.publishedAt,
                partnership_type: detection.partnershipType,
                source_platform: "youtube",
                source_url: detection.sourceUrl,
                evidence_text: detection.evidenceText,
                evidence_payload: {
                  video_id: detection.videoId,
                  video_title: detection.videoTitle,
                  published_at: detection.publishedAt,
                  detection_reason: detection.detectionReason,
                },
                detection_reason: detection.detectionReason,
                confidence_score: detection.confidenceScore,
                status: "suggested",
                is_active: true,
                created_by: null,
              });

            if (insertError) {
              errors.push(insertError.message);
              continue;
            }

            suggestionsCreated += 1;
          }
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    return NextResponse.json({
      ok: true,
      scannedCreators,
      scannedVideos,
      suggestionsCreated,
      duplicatesSkipped,
      errors,
    });
  } catch (error) {
    console.error("detect-youtube-partnerships error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao detectar parcerias.",
      },
      { status: 500 }
    );
  }
}