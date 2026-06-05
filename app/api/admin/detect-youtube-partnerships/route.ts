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

type DetectedLink = {
  url: string;
  hostname: string;
  domain: string;
  brandName?: string;
  campaignName?: string;
  score: number;
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
  detectedLinks: DetectedLink[];
  primaryDetectedLink?: string;
  primaryDetectedDomain?: string;
  campaignName?: string;
  couponCodes: string[];
};

const PARTNERSHIP_KEYWORDS = [
  "patrocinado",
  "patrocinada",
  "publi",
  "publicidade",
  "parceria",
  "parceria paga",
  "promoção paga",
  "promocao paga",
  "cupom",
  "desconto",
  "use o cupom",
  "use meu cupom",
  "código",
  "codigo",
  "sponsor",
  "sponsored",
  "paid promotion",
  "paid product placement",
  "partner",
  "partnership",
  "use code",
  "cupom de desconto",
  "link na descrição",
  "link na descricao",
  "baixe o jogo",
  "download",
  "exitlag",
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
  "linktree",
  "beacons",
  "bio",
  "carrd",
  "solo",
  "streamlabs",
  "streamelements",
  "nightbot",
  "moobot",
  "bitly",
  "tinyurl",
  "onelink",
  "cuttly",
  "cutt",
  "owly",
  "isgd",
  "rebrandly",
  "tco",
  "goo",
  "lnk",
  "whatsapp",
  "telegram",
];

const KNOWN_DOMAIN_BRANDS: Record<
  string,
  { brandName: string; campaignName?: string; score?: number }
> = {
  "neteasegames.com": { brandName: "NetEase", campaignName: "NetEase Games", score: 98 },
  "netease.com": { brandName: "NetEase", score: 98 },
  "oncehuman.game": { brandName: "NetEase", campaignName: "Once Human", score: 96 },
  "oncehuman.com": { brandName: "NetEase", campaignName: "Once Human", score: 96 },
  "marvelrivals.com": { brandName: "NetEase", campaignName: "Marvel Rivals", score: 96 },
  "narakathegame.com": { brandName: "NetEase", campaignName: "Naraka: Bladepoint", score: 96 },
  "identityvgame.com": { brandName: "NetEase", campaignName: "Identity V", score: 96 },
  "seguranca.gg": { brandName: "Kaspersky", campaignName: "Segurança Gamer", score: 98 },
  "kaspersky.com": { brandName: "Kaspersky", score: 98 },
  "kaspersky.com.br": { brandName: "Kaspersky", score: 98 },
  "usereserva.com": { brandName: "Reserva", score: 96 },
  "reserva.com": { brandName: "Reserva", score: 94 },
  "exitlag.com": { brandName: "ExitLag", score: 98 },
  "www.exitlag.com": { brandName: "ExitLag", score: 98 },
  "logitech.com": { brandName: "Logitech", score: 96 },
  "kabum.com.br": { brandName: "KaBuM", score: 96 },
  "hyperx.com": { brandName: "HyperX", score: 96 },
  "razer.com": { brandName: "Razer", score: 96 },
  "redragon.com.br": { brandName: "Redragon", score: 94 },
  "nvidia.com": { brandName: "NVIDIA", score: 96 },
  "intel.com": { brandName: "Intel", score: 96 },
  "amd.com": { brandName: "AMD", score: 96 },
  "samsung.com": { brandName: "Samsung", score: 96 },
  "opera.com": { brandName: "Opera GX", score: 92 },
  "steelseries.com": { brandName: "SteelSeries", score: 96 },
  "corsair.com": { brandName: "Corsair", score: 96 },
  "riotgames.com": { brandName: "Riot Games", score: 96 },
  "ubisoft.com": { brandName: "Ubisoft", score: 96 },
  "bandainamcoent.com": { brandName: "Bandai Namco", score: 96 },
  "pearlabyss.com": { brandName: "Pearl Abyss", score: 96 },
  "blackdesertonline.com": { brandName: "Pearl Abyss", campaignName: "Black Desert", score: 96 },
  "playblackdesert.com": { brandName: "Pearl Abyss", campaignName: "Black Desert", score: 96 },
  "steampowered.com": { brandName: "Steam", campaignName: "Steam", score: 65 },
  "epicgames.com": { brandName: "Epic Games", score: 75 },
};

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

function sanitizeRawUrl(rawUrl: string) {
  return rawUrl
    .trim()
    .replace(/[),.;\]}>]+$/g, "")
    .replace(/^[({\[<]+/g, "");
}

function normalizeHostname(hostname: string) {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function getRegistrableDomain(hostname: string) {
  const cleanHostname = normalizeHostname(hostname);
  const parts = cleanHostname.split(".").filter(Boolean);

  if (parts.length <= 2) return cleanHostname;

  const lastTwo = parts.slice(-2).join(".");
  const lastThree = parts.slice(-3).join(".");

  if (lastTwo === "com.br" || lastTwo === "co.uk" || lastTwo === "com.au") {
    return lastThree;
  }

  return lastTwo;
}

function isIgnoredDomain(hostname: string) {
  const domain = getRegistrableDomain(hostname);
  const base = domain.split(".")[0];

  return IGNORED_DOMAINS.some(
    (ignored) => base === ignored || domain.includes(`${ignored}.`)
  );
}

function normalizePossibleUrl(rawUrl: string) {
  const sanitized = sanitizeRawUrl(rawUrl);

  if (!sanitized) return null;

  if (/^https?:\/\//i.test(sanitized)) return sanitized;

  if (/^www\./i.test(sanitized)) return `https://${sanitized}`;

  return null;
}

function formatBrandName(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b(game|games|oficial|official|brasil|brazil)\b/gi, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferKnownBrandFromDomain(hostname: string, registrableDomain: string) {
  const normalizedHost = hostname.toLowerCase();
  const normalizedDomain = registrableDomain.toLowerCase();
  const baseDomain = normalizedDomain.split(".")[0];

  const directMatch =
    KNOWN_DOMAIN_BRANDS[normalizedHost] ||
    KNOWN_DOMAIN_BRANDS[normalizedDomain] ||
    KNOWN_DOMAIN_BRANDS[baseDomain];

  if (directMatch) return directMatch;

  if (
    normalizedHost.includes("netease") ||
    normalizedHost.includes("oncehuman") ||
    normalizedHost.includes("marvelrivals") ||
    normalizedHost.includes("narakathegame") ||
    normalizedHost.includes("identityv")
  ) {
    return {
      brandName: "NetEase",
      campaignName: normalizedHost.includes("marvelrivals")
        ? "Marvel Rivals"
        : normalizedHost.includes("oncehuman")
          ? "Once Human"
          : normalizedHost.includes("narakathegame")
            ? "Naraka: Bladepoint"
            : normalizedHost.includes("identityv")
              ? "Identity V"
              : "NetEase Games",
      score: 96,
    };
  }

  if (normalizedHost.includes("exitlag")) {
    return { brandName: "ExitLag", score: 98 };
  }

  if (normalizedHost.includes("kaspersky") || normalizedHost.includes("seguranca.gg")) {
    return { brandName: "Kaspersky", campaignName: "Segurança Gamer", score: 98 };
  }

  return null;
}

function inferCampaignNameFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const path = parsedUrl.pathname.toLowerCase();

    if (host.includes("marvelrivals")) return "Marvel Rivals";
    if (host.includes("oncehuman")) return "Once Human";
    if (host.includes("netease")) return "NetEase Games";

    if (host.includes("store.steampowered.com")) {
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      const appIndex = parts.findIndex((part) => part === "app");

      if (appIndex >= 0 && parts[appIndex + 2]) {
        return formatBrandName(parts[appIndex + 2].replace(/_/g, " "));
      }
    }

    const meaningfulPath = path
      .split("/")
      .filter(Boolean)
      .find((part) => part.length > 3 && !/^\d+$/.test(part));

    if (meaningfulPath) {
      return formatBrandName(meaningfulPath.replace(/[-_]/g, " "));
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function extractLinks(text: string): DetectedLink[] {
  const matches = text.match(/https?:\/\/[^\s)\]}>'"]+/gi) ?? [];
  const uniqueUrls = Array.from(new Set(matches.map(sanitizeRawUrl)));
  const detectedLinks: DetectedLink[] = [];

  for (const rawUrl of uniqueUrls) {
    const normalizedUrl = normalizePossibleUrl(rawUrl);

    if (!normalizedUrl) continue;

    try {
      const url = new URL(normalizedUrl);
      const hostname = normalizeHostname(url.hostname);
      const registrableDomain = getRegistrableDomain(hostname);
      const baseDomain = registrableDomain.split(".")[0];

      if (!registrableDomain || !baseDomain) continue;

      if (isIgnoredDomain(hostname)) {
        continue;
      }

      const knownBrand = inferKnownBrandFromDomain(hostname, registrableDomain);
      const campaignName =
        knownBrand?.campaignName || inferCampaignNameFromUrl(normalizedUrl);

      detectedLinks.push({
        url: normalizedUrl,
        hostname,
        domain: registrableDomain,
        brandName: knownBrand?.brandName || formatBrandName(baseDomain),
        campaignName,
        score: knownBrand?.score || scoreDetectedLink(normalizedUrl, registrableDomain),
      });
    } catch {
      continue;
    }
  }

  return detectedLinks.sort((a, b) => b.score - a.score);
}

function scoreDetectedLink(url: string, domain: string) {
  const normalizedUrl = url.toLowerCase();
  const normalizedDomain = domain.toLowerCase();

  let score = 70;

  if (normalizedDomain.endsWith(".game") || normalizedUrl.includes("/campaign")) score += 16;
  if (normalizedDomain.includes("exitlag")) score += 22;
  if (normalizedDomain.includes("seguranca.gg") || normalizedDomain.includes("kaspersky")) score += 22;
  if (normalizedDomain.includes("netease") || normalizedDomain.includes("oncehuman") || normalizedDomain.includes("marvelrivals")) score += 22;
  if (normalizedUrl.includes("steam") || normalizedUrl.includes("epicgames")) score += 8;
  if (normalizedUrl.includes("ref=") || normalizedUrl.includes("utm_")) score += 8;
  if (normalizedUrl.includes("coupon") || normalizedUrl.includes("cupom")) score += 6;
  if (normalizedUrl.includes("discord") || normalizedUrl.includes("invite")) score -= 20;

  return Math.max(0, Math.min(score, 98));
}

function extractDomains(text: string) {
  return Array.from(new Set(extractLinks(text).map((link) => link.brandName).filter(Boolean))) as string[];
}

function extractCouponCodes(text: string) {
  const patterns = [
    /(?:cupom|coupon|c[oó]digo|codigo|code)[:\s-]+([a-zA-Z0-9_-]{4,32})/gi,
    /(?:use\s+(?:o\s+)?(?:cupom|coupon|c[oó]digo|codigo|code))[:\s-]+([a-zA-Z0-9_-]{4,32})/gi,
  ];

  const codes = new Set<string>();

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const code = match[1]?.trim();

      if (!code) continue;

      const normalized = code.replace(/[.,;:!?]+$/g, "");

      if (/^https?$/i.test(normalized)) continue;
      if (/^(cupom|coupon|codigo|código|code)$/i.test(normalized)) continue;

      codes.add(normalized);
    }
  }

  return Array.from(codes);
}

function detectBrandNearKeywords(text: string) {
  const patterns = [
    /(?:parceria com|patrocinado por|patrocinada por|sponsored by|partnered with|presented by|apresentado por|powered by)\s+([a-zA-Z0-9À-ÿ\s._-]{3,60})/i,
    /(?:em parceria com|em collab com|collab com)\s+([a-zA-Z0-9À-ÿ\s._-]{3,60})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const rawBrand = match[1]
        .split("\n")[0]
        .split(".")[0]
        .split("|")[0]
        .trim();

      if (/^[a-zA-Z0-9_-]{4,32}$/.test(rawBrand) && /\d/.test(rawBrand)) {
        return null;
      }

      return formatBrandName(rawBrand);
    }
  }

  return null;
}

function pickPrimaryDetectedLink(links: DetectedLink[]) {
  return links[0] ?? null;
}

function buildEvidenceText(video: YouTubeVideo, text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const relevantLines = lines.filter((line) => hasPartnershipKeyword(line) || /https?:\/\/|www\./i.test(line));

  const evidence = relevantLines.length > 0 ? relevantLines.join("\n") : video.title;

  return evidence.slice(0, 900);
}

function detectPartnershipsFromVideo(video: YouTubeVideo): DetectedPartnership[] {
  const text = `${video.title}\n${video.description}`.trim();
  const detected: DetectedPartnership[] = [];

  const hasKeyword = hasPartnershipKeyword(text);
  const explicitBrand = detectBrandNearKeywords(text);
  const detectedLinks = extractLinks(text);
  const primaryLink = pickPrimaryDetectedLink(detectedLinks);
  const couponCodes = extractCouponCodes(text);

  const inferredBrandName =
    primaryLink?.brandName || explicitBrand || "Marca não identificada";

  const inferredCampaignName = primaryLink?.campaignName;
  const evidenceText = buildEvidenceText(video, text);

  if (video.hasPaidProductPlacement) {
    detected.push({
      brandName: inferredBrandName,
      partnershipType: inferredCampaignName ? "campaign" : "sponsorship",
      detectionReason: primaryLink
        ? "paid_product_placement_with_campaign_link"
        : "paid_product_placement",
      confidenceScore: primaryLink ? Math.max(90, primaryLink.score) : explicitBrand ? 88 : 82,
      evidenceText,
      sourceUrl: video.url,
      videoId: video.id,
      videoTitle: video.title,
      publishedAt: video.publishedAt,
      sourceChannel: video.sourceChannel,
      sourceThumbnail: video.sourceThumbnail,
      detectedLinks,
      primaryDetectedLink: primaryLink?.url,
      primaryDetectedDomain: primaryLink?.domain,
      campaignName: inferredCampaignName,
      couponCodes,
    });
  }

  if (hasKeyword && (primaryLink || explicitBrand)) {
    detected.push({
      brandName: inferredBrandName,
      partnershipType:
        inferredCampaignName || text.toLowerCase().includes("cupom")
          ? "campaign"
          : "sponsorship",
      detectionReason: primaryLink ? "campaign_link_keyword_match" : "keyword_match",
      confidenceScore: primaryLink ? Math.max(78, primaryLink.score) : 68,
      evidenceText,
      sourceUrl: video.url,
      videoId: video.id,
      videoTitle: video.title,
      publishedAt: video.publishedAt,
      sourceChannel: video.sourceChannel,
      sourceThumbnail: video.sourceThumbnail,
      detectedLinks,
      primaryDetectedLink: primaryLink?.url,
      primaryDetectedDomain: primaryLink?.domain,
      campaignName: inferredCampaignName,
      couponCodes,
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

    const isCronRequest = cronSecret && cronHeader && cronHeader === cronSecret;

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
              .in("status", ["suggested", "verified", "manual", "rejected"])
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
                campaign_name: detection.campaignName || null,
                website_url: detection.primaryDetectedLink || null,
                source_platform: "youtube",
                source_url: detection.sourceUrl,
                evidence_text: detection.evidenceText,
                evidence_payload: {
                  video_id: detection.videoId,
                  video_title: detection.videoTitle,
                  published_at: detection.publishedAt,
                  detection_reason: detection.detectionReason,
                  detected_links: detection.detectedLinks,
                  primary_detected_link: detection.primaryDetectedLink,
                  primary_detected_domain: detection.primaryDetectedDomain,
                  coupon_codes: detection.couponCodes,
                  inferred_campaign_name: detection.campaignName,
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
