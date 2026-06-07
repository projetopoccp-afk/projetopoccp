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
    .replace(/[^a-z0-9_.-]/g, "");
}

async function assertAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  console.log("Kick detector token recebido?", Boolean(token));

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

  console.log("Kick detector userError:", userError?.message || null);
  console.log("Kick detector userId:", user?.id || null);

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: `Sessão inválida: ${userError?.message || "usuário não encontrado"}`,
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

function buildDescription(creator: DetectedKickCreator) {
  const parts = [
    "Criador detectado automaticamente pela integração Kick do Cardpoc.",
  ];

  if (creator.stream_title) {
    parts.push(`Live detectada: ${creator.stream_title}`);
  }

  if (typeof creator.viewer_count === "number") {
    parts.push(`Viewers no momento da detecção: ${creator.viewer_count}`);
  }

  if (typeof creator.followers_count === "number") {
    parts.push(`Seguidores na Kick: ${creator.followers_count}`);
  }

  if (creator.url) {
    parts.push(`Canal: ${creator.url}`);
  }

  return parts.join("\\n");
}

export async function POST(request: NextRequest) {
  try {
    const admin = await assertAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    const body = await request.json().catch(() => ({}));
    const creators = Array.isArray(body?.creators)
      ? (body.creators as DetectedKickCreator[])
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

        const category = cleanText(creator.category) || "Kick";

        return {
          source: creator,
          slug,
          displayName,
          category,
        };
      })
      .filter(Boolean) as {
      source: DetectedKickCreator;
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

    const usernames = Array.from(
      new Set(normalizedCreators.map((creator) => creator.slug)),
    );

    const { data: existingCreators, error: existingError } =
      await admin.supabaseAdmin
        .from("creator_profiles")
        .select("username")
        .in("username", usernames);

    if (existingError) {
      throw existingError;
    }

    const existingSet = new Set(
      (existingCreators || []).map((creator) =>
        String(creator.username || "").toLowerCase(),
      ),
    );

    const rows = normalizedCreators
      .filter((creator) => !existingSet.has(creator.slug.toLowerCase()))
      .map(({ source, slug, displayName, category }) => {
        const tags = Array.from(
          new Set(
            [
              "Kick",
              category,
              cleanText(source.language) ? `Idioma: ${source.language}` : null,
            ].filter(Boolean) as string[],
          ),
        );

        return {
          user_id: null,
          request_id: null,
          nickname: displayName,
          username: slug,
          title: "Criador Kick detectado",
          faction: "Kick",
          category,
          status: "offline",
          avatar_url: cleanText(source.avatar_url) || null,
          banner_url:
            cleanText(source.banner_url) ||
            cleanText(source.thumbnail_url) ||
            null,
          bio: `Criador da Kick detectado pelo Cardpoc. Aguardando curadoria e criação da carta oficial.`,
          description: buildDescription({
            ...source,
            url: source.url || `https://kick.com/${slug}`,
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
          image_usage_consent_source: "kick_detector",
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
        skipped: normalizedCreators.length,
        message: "Todos os criadores selecionados já existem.",
      });
    }

    const { data: inserted, error: insertError } = await admin.supabaseAdmin
      .from("creator_profiles")
      .insert(rows)
      .select("id, username, nickname");

    if (insertError) {
  console.error("Kick detector insertError:", {
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

    return NextResponse.json({
      ok: true,
      imported: inserted?.length || 0,
      skipped: normalizedCreators.length - (inserted?.length || 0),
      creators: inserted || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível importar os criadores da Kick.",
      },
      { status: 500 },
    );
  }
}