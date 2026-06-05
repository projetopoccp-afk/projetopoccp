import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type BrandEnrichmentResult = {
  name: string;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  enrichment_source: string;
  enrichment_confidence: number;
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

function cleanBrandName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDomainName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]/g, "");
}

function extractMeta(content: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return null;
}

function extractTitle(content: string) {
  const match = content.match(/<title[^>]*>(.*?)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1].trim()) : null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeUrl(input: string, baseUrl: string) {
  try {
    return new URL(input, baseUrl).toString();
  } catch {
    return null;
  }
}

function faviconForDomain(websiteUrl: string) {
  try {
    const domain = new URL(websiteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

async function fetchSiteMetadata(url: string) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CardpocBrandBot/1.0; +https://www.cardpoc.com)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const title =
      extractMeta(html, "og:site_name") ||
      extractMeta(html, "application-name") ||
      extractTitle(html);

    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      null;

    const ogImage = extractMeta(html, "og:image");
    const logoUrl = ogImage ? normalizeUrl(ogImage, response.url) : faviconForDomain(response.url);

    return {
      website_url: response.url,
      title,
      description,
      logo_url: logoUrl,
    };
  } catch {
    return null;
  }
}

function buildCandidateUrls(brandName: string) {
  const normalized = normalizeDomainName(brandName);

  return [
    `https://www.${normalized}.com`,
    `https://${normalized}.com`,
    `https://www.${normalized}.com.br`,
    `https://${normalized}.com.br`,
    `https://www.${normalized}.gg`,
    `https://${normalized}.gg`,
  ];
}

async function tryCandidateSites(brandName: string): Promise<BrandEnrichmentResult | null> {
  const candidates = buildCandidateUrls(brandName);

  for (const candidate of candidates) {
    const metadata = await fetchSiteMetadata(candidate);

    if (!metadata?.website_url) continue;

    return {
      name: metadata.title || brandName,
      website_url: metadata.website_url,
      logo_url: metadata.logo_url,
      description: metadata.description,
      enrichment_source: "website_guess_open_graph",
      enrichment_confidence: metadata.description ? 72 : 58,
    };
  }

  return null;
}

async function searchWikipedia(brandName: string): Promise<BrandEnrichmentResult | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "extracts|pageimages|info",
      generator: "search",
      gsrsearch: brandName,
      gsrlimit: "1",
      exintro: "1",
      explaintext: "1",
      piprop: "thumbnail",
      pithumbsize: "300",
      inprop: "url",
    });

    const response = await fetch(
      `https://pt.wikipedia.org/w/api.php?${params.toString()}`,
      { cache: "no-store" },
    );

    if (!response.ok) return null;

    const data = await response.json();
    const pages = data?.query?.pages;

    if (!pages) return null;

    const page = Object.values(pages)[0] as any;

    if (!page?.title) return null;

    return {
      name: page.title,
      website_url: page.fullurl || null,
      logo_url: page.thumbnail?.source || null,
      description: page.extract ? String(page.extract).slice(0, 600) : null,
      enrichment_source: "wikipedia",
      enrichment_confidence: 55,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_admin !== true) {
      return NextResponse.json(
        { error: "Apenas administradores podem executar esta ação." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    const brandName = cleanBrandName(body?.brandName || body?.brand_name || "");

    if (!brandName) {
      return NextResponse.json(
        { error: "Nome da marca não informado." },
        { status: 400 },
      );
    }

    const siteResult = await tryCandidateSites(brandName);
    const wikipediaResult = siteResult ? null : await searchWikipedia(brandName);

    const result: BrandEnrichmentResult = siteResult ||
      wikipediaResult || {
        name: brandName,
        website_url: null,
        logo_url: null,
        description: null,
        enrichment_source: "not_found",
        enrichment_confidence: 0,
      };

    return NextResponse.json({
      ok: true,
      brand: result,
    });
  } catch (error) {
    console.error("enrich-brand error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao pesquisar marca.",
      },
      { status: 500 },
    );
  }
}