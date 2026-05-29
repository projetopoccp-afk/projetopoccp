import { NextRequest, NextResponse } from "next/server";

function getMeta(content: string, property: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );

  return content.match(regex)?.[1] || null;
}

function getYoutubeThumbnail(url: string) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/clip\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match?.[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url" },
      { status: 400 }
    );
  }

  try {
    const youtubeThumbnail = getYoutubeThumbnail(url);

    if (youtubeThumbnail) {
      return NextResponse.json({
        thumbnail: youtubeThumbnail,
        title: "YouTube Clip",
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html",
      },
      next: {
        revalidate: 60 * 60,
      },
    });

    const html = await response.text();

    const thumbnail =
      getMeta(html, "og:image") ||
      getMeta(html, "twitter:image") ||
      getMeta(html, "twitter:image:src");

    const title =
      getMeta(html, "og:title") ||
      getMeta(html, "twitter:title") ||
      "Clip";

    return NextResponse.json({
      thumbnail,
      title,
    });
  } catch {
    return NextResponse.json({
      thumbnail: null,
      title: "Clip",
    });
  }
}