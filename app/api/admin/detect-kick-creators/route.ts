import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DetectedKickCreator = {
  id?: string | number | null;
  slug: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  category?: string | null;
  stream_title?: string | null;
  viewer_count?: number | null;
  followers_count?: number | null;
  language?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  already_exists?: boolean;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createSupabaseAdminClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlug(value: unknown) {
  return cleanText(value)
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_\\-.]/g, "");
}

function getNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

async function assertAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\\s+/i, "").trim();

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Acesso restrito ao administrador." },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, supabaseAdmin, user };
}

async function getKickAppAccessToken() {
  const clientId = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    return null;
  }

  return String(payload.access_token);
}

async function kickFetch(path: string, accessToken: string | null) {
  const response = await fetch(`https://api.kick.com${path}`, {
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let payload: any = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `Erro Kick API ${response.status}: ${text || "sem resposta"}`,
    );
  }

  return payload;
}

function getArray(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.livestreams)) return payload.livestreams;
  return [];
}

function getCategoryId(category: any) {
  return category?.id ?? category?.category_id ?? category?.slug ?? null;
}

function getCategoryName(category: any) {
  return (
    cleanText(category?.name) ||
    cleanText(category?.category_name) ||
    cleanText(category?.slug)
  );
}

function normalizeLivestream(item: any): DetectedKickCreator | null {
  const channel = item?.channel || item?.user || item?.broadcaster || item;

  const slug = normalizeSlug(
    channel?.slug ||
      channel?.username ||
      channel?.name ||
      item?.slug ||
      item?.channel_slug ||
      item?.username,
  );

  if (!slug) return null;

  const category =
    getCategoryName(item?.category) ||
    cleanText(item?.category_name) ||
    cleanText(item?.game_name);

  return {
    id: channel?.id || item?.id || null,
    slug,
    username: slug,
    display_name:
      cleanText(channel?.name) ||
      cleanText(channel?.username) ||
      cleanText(item?.channel_name) ||
      slug,
    avatar_url:
      cleanText(channel?.profile_picture) ||
      cleanText(channel?.profile_pic) ||
      cleanText(channel?.avatar_url) ||
      cleanText(item?.profile_picture) ||
      null,
    banner_url:
      cleanText(channel?.banner_image) ||
      cleanText(channel?.banner_url) ||
      cleanText(item?.thumbnail) ||
      cleanText(item?.thumbnail_url) ||
      null,
    category: category || null,
    stream_title:
      cleanText(item?.stream_title) ||
      cleanText(item?.session_title) ||
      cleanText(item?.title) ||
      null,
    viewer_count:
      getNumber(item?.viewer_count) ||
      getNumber(item?.viewers) ||
      getNumber(item?.viewerCount),
    followers_count:
      typeof channel?.followers_count !== "undefined"
        ? getNumber(channel.followers_count)
        : null,
    language:
      cleanText(item?.language) ||
      cleanText(item?.lang) ||
      cleanText(channel?.language) ||
      null,
    thumbnail_url:
      cleanText(item?.thumbnail) ||
      cleanText(item?.thumbnail_url) ||
      cleanText(item?.livestream?.thumbnail) ||
      null,
    url: `https://kick.com/${slug}`,
    already_exists: false,
  };
}

async function findCategoryId(categoryName: string, accessToken: string | null) {
  const query = encodeURIComponent(categoryName);

  const attempts = [
    `/public/v1/categories?q=${query}`,
    `/public/v1/categories?query=${query}`,
    `/public/v1/categories?search=${query}`,
  ];

  for (const path of attempts) {
    try {
      const payload = await kickFetch(path, accessToken);
      const categories = getArray(payload);

      const exact =
        categories.find(
          (category: any) =>
            getCategoryName(category).toLowerCase() ===
            categoryName.toLowerCase(),
        ) || categories[0];

      const categoryId = exact ? getCategoryId(exact) : null;

      if (categoryId) {
        return {
          id: categoryId,
          name: getCategoryName(exact) || categoryName,
        };
      }
    } catch {
      // tenta o próximo formato
    }
  }

  return null;
}

async function fetchLivestreams(params: {
  categoryId: string | number | null;
  categoryName: string;
  language: string | null;
  limit: number;
  accessToken: string | null;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set("limit", String(params.limit));

  if (params.categoryId) {
    searchParams.set("category_id", String(params.categoryId));
  }

  if (params.language) {
    searchParams.set("language", params.language);
  }

  const attempts = [
    `/public/v1/livestreams?${searchParams.toString()}`,
    `/public/v2/livestreams?${searchParams.toString()}`,
  ];

  for (const path of attempts) {
    try {
      const payload = await kickFetch(path, params.accessToken);
      return getArray(payload);
    } catch {
      // tenta v2 se v1 falhar
    }
  }

  throw new Error("Não foi possível buscar livestreams na Kick.");
}

export async function POST(request: NextRequest) {
  try {
    const admin = await assertAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    const body = await request.json().catch(() => ({}));

    const category = cleanText(body?.category);
    const language = cleanText(body?.language) || null;
    const minViewers = Math.max(0, Number(body?.minViewers || 0));
    const limit = Math.min(100, Math.max(1, Number(body?.limit || 50)));

    if (!category) {
      return NextResponse.json(
        { error: "Informe uma categoria para buscar na Kick." },
        { status: 400 },
      );
    }

    const accessToken = await getKickAppAccessToken();
    const categoryMatch = await findCategoryId(category, accessToken);

    if (!categoryMatch?.id) {
      return NextResponse.json(
        {
          error:
            "Categoria não encontrada na Kick. Tente o nome exato da categoria.",
          creators: [],
        },
        { status: 404 },
      );
    }

    const livestreams = await fetchLivestreams({
      categoryId: categoryMatch.id,
      categoryName: categoryMatch.name,
      language,
      limit,
      accessToken,
    });

    const detectedMap = new Map<string, DetectedKickCreator>();

    for (const item of livestreams) {
      const creator = normalizeLivestream(item);

      if (!creator?.slug) continue;
      if (Number(creator.viewer_count || 0) < minViewers) continue;

      detectedMap.set(creator.slug.toLowerCase(), creator);
    }

    const detected = Array.from(detectedMap.values());

    const usernames = detected.map((creator) => creator.slug.toLowerCase());

    if (usernames.length > 0) {
      const { data: existingCreators } = await admin.supabaseAdmin
        .from("creator_profiles")
        .select("username")
        .in("username", usernames);

      const existingSet = new Set(
        (existingCreators || []).map((creator) =>
          String(creator.username || "").toLowerCase(),
        ),
      );

      for (const creator of detected) {
        creator.already_exists = existingSet.has(creator.slug.toLowerCase());
      }
    }

    detected.sort((a, b) => Number(b.viewer_count || 0) - Number(a.viewer_count || 0));

    return NextResponse.json({
      ok: true,
      category: categoryMatch,
      creators: detected,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível detectar criadores da Kick agora.",
      },
      { status: 500 },
    );
  }
}