import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DetectedTwitchCreator = {
  id?: string | number | null;
  platform: "twitch";
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

type TwitchTokenResponse = {
  access_token?: string;
  error?: string;
  message?: string;
};

type TwitchCategory = {
  id: string;
  name: string;
  box_art_url?: string;
};

type TwitchStream = {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at?: string;
  language?: string;
  thumbnail_url?: string;
};

type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url?: string;
  offline_image_url?: string;
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
    .replace(/[^a-z0-9_.-]/g, "");
}

function normalizeUsernameForCompare(value: unknown) {
  return cleanText(value).replace(/^@/, "").toLowerCase();
}

function getNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

async function assertAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Sessão inválida. Token não enviado." },
        { status: 401 },
      ),
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
      response: NextResponse.json(
        {
          error: `Sessão inválida: ${
            userError?.message || "usuário não encontrado"
          }`,
        },
        { status: 401 },
      ),
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

async function getTwitchAppAccessToken() {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: getRequiredEnv("TWITCH_CLIENT_ID"),
      client_secret: getRequiredEnv("TWITCH_CLIENT_SECRET"),
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as TwitchTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.message ||
        payload.error ||
        "Não foi possível autenticar na Twitch.",
    );
  }

  return payload.access_token;
}

async function twitchFetch<T>(
  path: string,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: {
      "Client-Id": getRequiredEnv("TWITCH_CLIENT_ID"),
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `Erro Twitch API ${response.status}`,
    );
  }

  return payload as T;
}

async function findTwitchCategory(categoryName: string, accessToken: string) {
  const payload = await twitchFetch<{ data?: TwitchCategory[] }>(
    `/search/categories?query=${encodeURIComponent(categoryName)}&first=20`,
    accessToken,
  );

  const categories = Array.isArray(payload.data) ? payload.data : [];

  const exact =
    categories.find(
      (category) =>
        category.name.toLowerCase() === categoryName.toLowerCase(),
    ) || categories[0];

  if (!exact?.id) return null;

  return {
    id: exact.id,
    name: exact.name,
  };
}

async function fetchTwitchStreams(params: {
  categoryId: string;
  language: string | null;
  limit: number;
  accessToken: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("game_id", params.categoryId);
  searchParams.set("first", String(params.limit));

  if (params.language) {
    searchParams.set("language", params.language);
  }

  const payload = await twitchFetch<{ data?: TwitchStream[] }>(
    `/streams?${searchParams.toString()}`,
    params.accessToken,
  );

  return Array.isArray(payload.data) ? payload.data : [];
}

async function fetchTwitchUsers(userIds: string[], accessToken: string) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean))).slice(0, 100);

  if (uniqueIds.length === 0) {
    return new Map<string, TwitchUser>();
  }

  const searchParams = new URLSearchParams();

  for (const id of uniqueIds) {
    searchParams.append("id", id);
  }

  const payload = await twitchFetch<{ data?: TwitchUser[] }>(
    `/users?${searchParams.toString()}`,
    accessToken,
  );

  const users = Array.isArray(payload.data) ? payload.data : [];

  return new Map(users.map((user) => [user.id, user]));
}

function buildThumbnailUrl(value: unknown) {
  const thumbnail = cleanText(value);

  if (!thumbnail) return null;

  return thumbnail
    .replace("{width}", "640")
    .replace("{height}", "360");
}

function normalizeStream(
  stream: TwitchStream,
  user: TwitchUser | undefined,
): DetectedTwitchCreator | null {
  const slug = normalizeSlug(user?.login || stream.user_login);

  if (!slug) return null;

  return {
    id: user?.id || stream.user_id || stream.id || null,
    platform: "twitch",
    slug,
    username: slug,
    display_name:
      cleanText(user?.display_name) ||
      cleanText(stream.user_name) ||
      slug,
    avatar_url: cleanText(user?.profile_image_url) || null,
    banner_url:
      cleanText(user?.offline_image_url) ||
      buildThumbnailUrl(stream.thumbnail_url) ||
      null,
    category: cleanText(stream.game_name) || null,
    stream_title: cleanText(stream.title) || null,
    viewer_count: getNumber(stream.viewer_count),
    followers_count: null,
    language: cleanText(stream.language) || null,
    thumbnail_url: buildThumbnailUrl(stream.thumbnail_url),
    url: `https://www.twitch.tv/${slug}`,
    already_exists: false,
  };
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
        { error: "Informe uma categoria para buscar na Twitch." },
        { status: 400 },
      );
    }

    const accessToken = await getTwitchAppAccessToken();
    const categoryMatch = await findTwitchCategory(category, accessToken);

    if (!categoryMatch?.id) {
      return NextResponse.json(
        {
          error:
            "Categoria não encontrada na Twitch. Tente o nome exato da categoria.",
          creators: [],
        },
        { status: 404 },
      );
    }

    const streams = await fetchTwitchStreams({
      categoryId: categoryMatch.id,
      language,
      limit,
      accessToken,
    });

    const usersById = await fetchTwitchUsers(
      streams.map((stream) => stream.user_id),
      accessToken,
    );

    const detectedMap = new Map<string, DetectedTwitchCreator>();

    for (const stream of streams) {
      const creator = normalizeStream(stream, usersById.get(stream.user_id));

      if (!creator?.slug) continue;
      if (Number(creator.viewer_count || 0) < minViewers) continue;

      detectedMap.set(creator.slug.toLowerCase(), creator);
    }

    const detected = Array.from(detectedMap.values());

    if (detected.length > 0) {
      const { data: existingCreators, error: existingError } =
        await admin.supabaseAdmin
          .from("creator_profiles")
          .select("username, nickname");

      if (existingError) {
        throw existingError;
      }

      const existingSet = new Set(
        (existingCreators || [])
          .flatMap((creator) => [
            normalizeUsernameForCompare(creator.username),
            normalizeUsernameForCompare(creator.nickname),
          ])
          .filter(Boolean),
      );

      for (const creator of detected) {
        const slug = normalizeUsernameForCompare(creator.slug);
        const username = normalizeUsernameForCompare(creator.username);
        const displayName = normalizeUsernameForCompare(creator.display_name);

        creator.already_exists =
          Boolean(slug && existingSet.has(slug)) ||
          Boolean(username && existingSet.has(username)) ||
          Boolean(displayName && existingSet.has(displayName));
      }
    }

    detected.sort(
      (a, b) => Number(b.viewer_count || 0) - Number(a.viewer_count || 0),
    );

    return NextResponse.json({
      ok: true,
      platform: "twitch",
      category: categoryMatch,
      creators: detected,
    });
  } catch (error) {
    console.error("Twitch creator detector error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível detectar criadores da Twitch agora.",
      },
      { status: 500 },
    );
  }
}
