import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreatorDetectorPlatform = "kick" | "twitch";

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

function normalizePlatform(value: unknown): CreatorDetectorPlatform | null {
  const platform = cleanText(value).toLowerCase();

  if (platform === "kick" || platform === "twitch") {
    return platform;
  }

  return null;
}

function buildPlatformUrl(platform: CreatorDetectorPlatform, slug: string) {
  if (platform === "twitch") {
    return `https://www.twitch.tv/${slug}`;
  }

  return `https://kick.com/${slug}`;
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

export async function POST(request: NextRequest) {
  try {
    const admin = await assertAdmin(request);

    if (!admin.ok) {
      return admin.response;
    }

    const body = await request.json().catch(() => ({}));

    const creatorId = cleanText(body?.creator_id);
    const platform = normalizePlatform(body?.platform);
    const slug = normalizeSlug(body?.slug);
    const explicitUrl = cleanText(body?.url);
    const followersCount =
      body?.followers_count === null || typeof body?.followers_count === "undefined"
        ? null
        : Number(body.followers_count);

    if (!creatorId) {
      return NextResponse.json(
        { error: "Informe o perfil existente para vincular." },
        { status: 400 },
      );
    }

    if (!platform) {
      return NextResponse.json(
        { error: "Plataforma inválida para vincular." },
        { status: 400 },
      );
    }

    if (!slug && !explicitUrl) {
      return NextResponse.json(
        { error: "Informe o canal detectado para vincular." },
        { status: 400 },
      );
    }

    const { data: existingCreator, error: creatorError } =
      await admin.supabaseAdmin
        .from("creator_profiles")
        .select("id, username, nickname")
        .eq("id", creatorId)
        .maybeSingle();

    if (creatorError) {
      throw creatorError;
    }

    if (!existingCreator) {
      return NextResponse.json(
        { error: "Perfil existente não encontrado." },
        { status: 404 },
      );
    }

    const url = explicitUrl || buildPlatformUrl(platform, slug);

    const { error: deleteError } = await admin.supabaseAdmin
      .from("creator_social_links")
      .delete()
      .eq("creator_id", creatorId)
      .eq("platform", platform);

    if (deleteError) {
      throw deleteError;
    }

    const baseRow = {
      creator_id: creatorId,
      platform,
      url,
      updated_at: new Date().toISOString(),
    };

    const rowWithFollowers = {
      ...baseRow,
      followers_count:
        Number.isFinite(followersCount) && followersCount !== null
          ? followersCount
          : null,
    };

    let insertResult = await admin.supabaseAdmin
      .from("creator_social_links")
      .insert(rowWithFollowers)
      .select("id, creator_id, platform, url")
      .maybeSingle();

    if (
      insertResult.error &&
      insertResult.error.message.toLowerCase().includes("followers_count")
    ) {
      insertResult = await admin.supabaseAdmin
        .from("creator_social_links")
        .insert(baseRow)
        .select("id, creator_id, platform, url")
        .maybeSingle();
    }

    if (insertResult.error) {
      throw insertResult.error;
    }

    return NextResponse.json({
      ok: true,
      link: insertResult.data,
      creator: existingCreator,
    });
  } catch (error) {
    console.error("link-detected-creator error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível vincular o criador detectado.",
      },
      { status: 500 },
    );
  }
}
