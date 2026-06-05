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

type KnownBrandDefinition = {
  name: string;
  aliases: string[];
  website_url: string;
  logo_domain?: string;
  description: string;
};

const KNOWN_BRANDS: KnownBrandDefinition[] = [
  {
    name: "NetEase",
    aliases: ["netease", "netease games", "neteasegames", "once human", "marvel rivals", "naraka", "identity v"],
    website_url: "https://www.neteasegames.com/",
    logo_domain: "neteasegames.com",
    description: "Desenvolvedora e publisher global de jogos, responsável por títulos como Marvel Rivals, Once Human, Naraka: Bladepoint e Identity V.",
  },
  {
    name: "ExitLag",
    aliases: ["exitlag", "exit lag"],
    website_url: "https://www.exitlag.com/",
    logo_domain: "exitlag.com",
    description: "Serviço de otimização de rotas para reduzir latência, perda de pacote e instabilidade em jogos online.",
  },
  {
    name: "Kaspersky",
    aliases: ["kaspersky", "seguranca", "segurança", "seguranca gg", "segurança gg", "seguranca.gg"],
    website_url: "https://www.kaspersky.com.br/",
    logo_domain: "kaspersky.com.br",
    description: "Empresa global de cibersegurança, conhecida por soluções de proteção digital para pessoas e empresas.",
  },
  {
    name: "Reserva",
    aliases: ["reserva", "usereserva"],
    website_url: "https://www.usereserva.com/",
    logo_domain: "usereserva.com",
    description: "Marca brasileira de moda e lifestyle.",
  },
  {
    name: "Logitech",
    aliases: ["logitech", "logi"],
    website_url: "https://www.logitech.com/",
    logo_domain: "logitech.com",
    description: "Marca global de periféricos, acessórios e equipamentos para produtividade, games e criação de conteúdo.",
  },
  {
    name: "HyperX",
    aliases: ["hyperx"],
    website_url: "https://hyperx.com/",
    logo_domain: "hyperx.com",
    description: "Marca de periféricos gamer, headsets, microfones e acessórios para jogos e criação de conteúdo.",
  },
  {
    name: "Razer",
    aliases: ["razer"],
    website_url: "https://www.razer.com/",
    logo_domain: "razer.com",
    description: "Marca global de hardware, periféricos e lifestyle gamer.",
  },
  {
    name: "NVIDIA",
    aliases: ["nvidia", "geforce"],
    website_url: "https://www.nvidia.com/",
    logo_domain: "nvidia.com",
    description: "Empresa global de tecnologia conhecida por GPUs, soluções de IA e ecossistema GeForce para games e criação.",
  },
  {
    name: "Discord",
    aliases: ["discord"],
    website_url: "https://discord.com/",
    logo_domain: "discord.com",
    description: "Plataforma de comunicação para comunidades, criadores, jogadores e equipes.",
  },
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

function normalizeBrandKey(value: string) {
  return normalizeDomainName(
    value
      .replace(/games?\b/gi, "")
      .replace(/oficial\b/gi, "")
      .replace(/official\b/gi, "")
      .replace(/brasil\b/gi, "")
      .replace(/brazil\b/gi, ""),
  );
}

function hasBrokenEncoding(value: string | null | undefined) {
  if (!value) return false;
  return value.includes(" ") || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

function safeText(value: string | null | undefined) {
  if (!value || hasBrokenEncoding(value)) return null;
  return value.trim().replace(/\s+/g, " ");
}

function cleanSiteTitle(title: string | null | undefined, fallback: string) {
  const safe = safeText(title);
  if (!safe) return fallback;

  const firstPart = safe
    .split("|")[0]
    .split("—")[0]
    .split("-")[0]
    .trim();

  return firstPart || fallback;
}

function findKnownBrand(brandName: string) {
  const key = normalizeBrandKey(brandName);

  return KNOWN_BRANDS.find((brand) =>
    brand.aliases.some((alias) => {
      const aliasKey = normalizeBrandKey(alias);
      return key === aliasKey || key.includes(aliasKey) || aliasKey.includes(key);
    }),
  );
}

async function findExistingBrand(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  brandName: string,
): Promise<BrandEnrichmentResult | null> {
  const key = normalizeBrandKey(brandName);

  if (!key) return null;

  const { data, error } = await supabase
    .from("brands")
    .select("name, logo_url, website_url, description, enrichment_confidence")
    .limit(500);

  if (error || !data) return null;

  const existing = data.find((brand: any) => {
    const existingKey = normalizeBrandKey(brand.name || "");
    return existingKey === key || existingKey.includes(key) || key.includes(existingKey);
  });

  if (!existing) return null;

  return {
    name: existing.name || brandName,
    website_url: existing.website_url || null,
    logo_url: existing.logo_url || null,
    description: existing.description || null,
    enrichment_source: "local_brand",
    enrichment_confidence: existing.enrichment_confidence || 100,
  };
}

function knownBrandResult(brand: KnownBrandDefinition): BrandEnrichmentResult {
  return {
    name: brand.name,
    website_url: brand.website_url,
    logo_url: faviconForDomain(brand.logo_domain ? `https://${brand.logo_domain}` : brand.website_url),
    description: brand.description,
    enrichment_source: "known_brand",
    enrichment_confidence: 99,
  };
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

    const confidence = metadata.description ? 72 : 58;

    return {
      name: confidence >= 70 ? cleanSiteTitle(metadata.title, brandName) : brandName,
      website_url: metadata.website_url,
      logo_url: confidence >= 70 ? metadata.logo_url : null,
      description: safeText(metadata.description),
      enrichment_source: "website_guess_open_graph",
      enrichment_confidence: confidence,
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
      name: brandName,
      website_url: page.fullurl || null,
      logo_url: null,
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

    const existingBrand = await findExistingBrand(supabase, brandName);
    const knownBrand = existingBrand ? null : findKnownBrand(brandName);
    const siteResult = existingBrand || knownBrand ? null : await tryCandidateSites(brandName);
    const wikipediaResult = existingBrand || knownBrand || siteResult ? null : await searchWikipedia(brandName);

    const result: BrandEnrichmentResult =
      existingBrand ||
      (knownBrand ? knownBrandResult(knownBrand) : null) ||
      siteResult ||
      wikipediaResult || {
        name: brandName,
        website_url: null,
        logo_url: null,
        description: null,
        enrichment_source: "not_found",
        enrichment_confidence: 0,
      };

    if (hasBrokenEncoding(result.name)) {
      result.name = brandName;
    }

    if (result.enrichment_confidence < 70) {
      result.name = brandName;
      result.logo_url = null;
    }

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