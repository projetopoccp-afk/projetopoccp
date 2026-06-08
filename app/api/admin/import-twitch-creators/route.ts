import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DetectedTwitchCreator = {
  id?: string | number | null;
  platform?: "twitch";
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
    .replace(/[^a-z0-9_.-]/g, "");
}

function normalizeUsernameForCompare(value: unknown) {
  return cleanText(value).replace(/^@/, "").toLowerCase();
}

const COMMON_CREATOR_SUFFIXES = [
  "tv",
  "live",
  "oficial",
  "official",
  "gaming",
  "games",
  "game",
  "stream",
  "streams",
  "yt",
  "youtube",
  "kick",
  "twitch",
  "br",
  "real",
];

function normalizeIdentity(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/https?:\/\//g, "")
    .replace(/^www\./, "")
    .replace(/^(kick\.com|twitch\.tv|youtube\.com|youtu\.be)\//, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .replace(/[^a-z0-9]/g, "");
}

function stripCommonCreatorSuffix(value: unknown) {
  let normalized = normalizeIdentity(value);

  for (const suffix of COMMON_CREATOR_SUFFIXES) {
    if (normalized.length > suffix.length + 3 && normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length);
      break;
    }
  }

  return normalized;
}

function extractUsernameFromSocialUrl(value: unknown) {
  const text = cleanText(value);

  if (!text) return "";

  try {
    const url = text.startsWith("http") ? new URL(text) : new URL(`https://${text}`);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    const segments = url.pathname.split("/").filter(Boolean);

    if (hostname.includes("kick.com") || hostname.includes("twitch.tv")) {
      return segments[0] || "";
    }

    if (hostname.includes("youtube.com")) {
      if (segments[0]?.startsWith("@")) return segments[0];
      if (["c", "channel", "user"].includes(segments[0] || "")) return segments[1] || "";
    }

    return segments[0] || "";
  } catch {
    return text;
  }
}

function addIdentity(set: Set<string>, value: unknown) {
  const normalized = normalizeIdentity(value);
  const stripped = stripCommonCreatorSuffix(value);

  if (normalized) set.add(normalized);
  if (stripped) set.add(stripped);
}

async function buildExistingCreatorIdentitySet(supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>) {
  const existingSet = new Set<string>();

  const { data: existingCreators, error: existingCreatorsError } =
    await supabaseAdmin.from("creator_profiles").select("username, nickname");

  if (existingCreatorsError) {
    throw existingCreatorsError;
  }

  for (const creator of existingCreators || []) {
    addIdentity(existingSet, creator.username);
    addIdentity(existingSet, creator.nickname);
  }

  const { data: socialLinks, error: socialLinksError } = await supabaseAdmin
    .from("creator_social_links")
    .select("url");

  if (socialLinksError) {
    throw socialLinksError;
  }

  for (const link of socialLinks || []) {
    addIdentity(existingSet, link.url);
    addIdentity(existingSet, extractUsernameFromSocialUrl(link.url));
  }

  return existingSet;
}

function creatorMatchesExistingIdentity(
  existingSet: Set<string>,
  values: unknown[],
) {
  for (const value of values) {
    const normalized = normalizeIdentity(value);
    const stripped = stripCommonCreatorSuffix(value);

    if (normalized && existingSet.has(normalized)) return true;
    if (stripped && existingSet.has(stripped)) return true;
  }

  return false;
}

function dedupeNormalizedCreators<T extends { slug: string; displayName: string; source: { url?: string | null } }>(creators: T[]) {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const creator of creators) {
    const key = normalizeIdentity(creator.slug) || normalizeIdentity(creator.displayName) || normalizeIdentity(creator.source.url);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    deduped.push(creator);
  }

  return deduped;
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

function buildDescription(creator: DetectedTwitchCreator) {
  const parts = [
    "Criador detectado automaticamente pela integração Twitch do Cardpoc.",
  ];

  if (creator.stream_title) {
    parts.push(`Live detectada: ${creator.stream_title}`);
  }

  if (typeof creator.viewer_count === "number") {
    parts.push(`Viewers no momento da detecção: ${creator.viewer_count}`);
  }

  if (creator.url) {
    parts.push(`Canal: ${creator.url}`);
  }

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const admin = await assertAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    const body = await request.json().catch(() => ({}));
    const creators = Array.isArray(body?.creators)
      ? (body.creators as DetectedTwitchCreator[])
      : [];

    if (creators.length === 0) {
      return NextResponse.json(
        { error: "Nenhum criador selecionado para importar." },
        { status: 400 },
      );
    }

    const normalizedCreators = creators
      .map((creator) => {
        const slug = normalizeSlug(
          creator.slug || creator.username || creator.display_name,
        );

        if (!slug) return null;

        const displayName =
          cleanText(creator.display_name) ||
          cleanText(creator.username) ||
          slug;

        const category = cleanText(creator.category) || "Twitch";

        return {
          source: creator,
          slug,
          displayName,
          category,
        };
      })
      .filter(Boolean) as {
      source: DetectedTwitchCreator;
      slug: string;
      displayName: string;
      category: string;
    }[];

    if (normalizedCreators.length === 0) {
      return NextResponse.json(
        { error: "Nenhum criador válido para importar." },
        { status: 400 },
      );
    }

    const dedupedCreators = dedupeNormalizedCreators(normalizedCreators);
    const existingSet = await buildExistingCreatorIdentitySet(admin.supabaseAdmin);

    const rows = dedupedCreators
      .filter((creator) => !creatorMatchesExistingIdentity(existingSet, [
        creator.slug,
        creator.displayName,
        creator.source.username,
        creator.source.display_name,
        creator.source.url,
      ]))
      .map(({ source, slug, displayName, category }) => {
        const tags = Array.from(
          new Set(
            [
              "Twitch",
              category,
              cleanText(source.language) ? `Idioma: ${source.language}` : null,
            ].filter(Boolean) as string[],
          ),
        );

        const twitchUrl = cleanText(source.url) || `https://www.twitch.tv/${slug}`;

        return {
          user_id: null,
          request_id: null,
          nickname: displayName,
          username: slug,
          title: "Criador Twitch detectado",
          faction: "Twitch",
          category,
          status: "offline",
          avatar_url: cleanText(source.avatar_url) || null,
          banner_url:
            cleanText(source.banner_url) ||
            cleanText(source.thumbnail_url) ||
            null,
          bio: "Criador da Twitch detectado pelo Cardpoc. Aguardando curadoria e criação da carta oficial.",
          description: buildDescription({
            ...source,
            url: twitchUrl,
          }),
          tags,
          is_public: false,
          is_verified: false,
          owner_status: "unclaimed",
          share_count: 0,
          trending_score: 0,
          image_usage_consent: false,
          image_usage_consent_at: null,
          image_usage_consent_version: null,
          image_usage_consent_source: "twitch_detector",
          image_usage_consent_text: null,
          profile_xp: 0,
          profile_level: 1,
          profile_level_updated_at: null,
          updated_at: new Date().toISOString(),
        };
      });

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        imported: 0,
        skipped: dedupedCreators.length,
        message: "Todos os criadores selecionados já existem ou já possuem link social cadastrado.",
      });
    }

    const { data: inserted, error: insertError } = await admin.supabaseAdmin
      .from("creator_profiles")
      .insert(rows)
      .select("id, username, nickname");

    if (insertError) {
      console.error("Twitch detector insertError:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });

      return NextResponse.json(
        {
          error: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        },
        { status: 500 },
      );
    }

    const insertedByUsername = new Map(
      (inserted || []).map((creator) => [
        normalizeSlug(creator.username),
        creator,
      ]),
    );

    const socialRows = dedupedCreators
      .map((creator) => {
        const insertedCreator = insertedByUsername.get(creator.slug);

        if (!insertedCreator?.id) return null;

        return {
          creator_id: insertedCreator.id,
          platform: "twitch",
          url:
            cleanText(creator.source.url) ||
            `https://www.twitch.tv/${creator.slug}`,
        };
      })
      .filter(Boolean) as {
      creator_id: string;
      platform: "twitch";
      url: string;
    }[];

    if (socialRows.length > 0) {
      const { data: existingSocialRows, error: existingSocialRowsError } = await admin.supabaseAdmin
        .from("creator_social_links")
        .select("creator_id, platform, url");

      if (existingSocialRowsError) {
        throw existingSocialRowsError;
      }

      const existingSocialSet = new Set(
        (existingSocialRows || []).map((row) =>
          `${row.creator_id}:${normalizeIdentity(row.platform)}:${normalizeIdentity(row.url)}`,
        ),
      );

      const socialRowsToInsert = socialRows.filter(
        (row) =>
          !existingSocialSet.has(
            `${row.creator_id}:${normalizeIdentity(row.platform)}:${normalizeIdentity(row.url)}`,
          ),
      );

      const { error: socialError } = socialRowsToInsert.length > 0
        ? await admin.supabaseAdmin.from("creator_social_links").insert(socialRowsToInsert)
        : { error: null };

      if (socialError) {
        console.error("Twitch detector social link insertError:", {
          message: socialError.message,
          details: socialError.details,
          hint: socialError.hint,
          code: socialError.code,
        });

        return NextResponse.json(
          {
            error: socialError.message,
            details: socialError.details,
            hint: socialError.hint,
            code: socialError.code,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      imported: inserted?.length || 0,
      skipped: dedupedCreators.length - (inserted?.length || 0),
      creators: inserted || [],
    });
  } catch (error) {
    console.error("Twitch creator import error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível importar os criadores da Twitch.",
      },
      { status: 500 },
    );
  }
}
