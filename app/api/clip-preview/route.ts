import { NextRequest, NextResponse } from "next/server";

function decode(value: string | null) {
  if (!value) return null;

  return value
    .replace(/&amp;/g, "&")
    .replace(/\\u002F/g, "/")
    .replace(/\\/g, "");
}

function getMeta(content: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }

  return null;
}

function getJsonImage(content: string) {
  const patterns = [
    /"thumbnailUrl"\s*:\s*"([^"]+)"/i,
    /"thumbnail_url"\s*:\s*"([^"]+)"/i,
    /"thumbnail"\s*:\s*"([^"]+)"/i,
    /"poster"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*"([^"]+)"/i,
    /"ogImage"\s*:\s*"([^"]+)"/i,
    /"preview"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }

  return null;
}

function getJsonTitle(content: string) {
  const patterns = [
    /"title"\s*:\s*"([^"]+)"/i,
    /"ogTitle"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }

  return null;
}

function getYoutubeId(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || null;
    }

    const videoId = parsedUrl.searchParams.get("v");
    if (videoId) return videoId;

    const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) return shortsMatch[1];

    const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch?.[1]) return embedMatch[1];
  } catch {
    return null;
  }

  return null;
}

function getYoutubeThumbnail(url: string) {
  const youtubeId = getYoutubeId(url);
  if (!youtubeId) return null;

  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

async function getTiktokOEmbed(url: string) {
  try {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return {
      thumbnail: data?.thumbnail_url || null,
      title: data?.title || "TikTok Clip",
    };
  } catch {
    return null;
  }
}

async function getHtmlPreview(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
      Referer: "https://www.google.com/",
    },
    cache: "no-store",
  });

  const html = await response.text();

  const thumbnail =
    getMeta(html, "og:image") ||
    getMeta(html, "twitter:image") ||
    getMeta(html, "twitter:image:src") ||
    getMeta(html, "thumbnail") ||
    getJsonImage(html);

  const title =
    getMeta(html, "og:title") ||
    getMeta(html, "twitter:title") ||
    getJsonTitle(html) ||
    "Clip";

  return {
    thumbnail,
    title,
  };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const youtubeThumbnail = getYoutubeThumbnail(url);

    if (youtubeThumbnail) {
      return NextResponse.json({
        thumbnail: youtubeThumbnail,
        title: "YouTube Clip",
      });
    }

    if (url.includes("tiktok.com")) {
      const tiktokPreview = await getTiktokOEmbed(url);

      if (tiktokPreview?.thumbnail) {
        return NextResponse.json(tiktokPreview);
      }
    }

    const htmlPreview = await getHtmlPreview(url);

    return NextResponse.json(htmlPreview);
  } catch {
    return NextResponse.json({
      thumbnail: null,
      title: "Clip",
    });
  }
}