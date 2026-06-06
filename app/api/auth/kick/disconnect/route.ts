import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DisconnectBody = {
  accessToken?: string;
  platform?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createSupabaseAnonClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function createSupabaseServiceClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

async function revokeKickToken(token: string | null) {
  if (!token) return;

  try {
    await fetch("https://id.kick.com/oauth/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        token,
        client_id: getRequiredEnv("KICK_CLIENT_ID"),
        client_secret: getRequiredEnv("KICK_CLIENT_SECRET"),
      }),
    });
  } catch (error) {
    console.error("Kick revoke token error:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as DisconnectBody;

    if (body.platform !== "kick") {
      return NextResponse.json(
        { error: "unsupported_platform" },
        { status: 400 }
      );
    }

    if (!body.accessToken) {
      return NextResponse.json(
        { error: "missing_supabase_access_token" },
        { status: 401 }
      );
    }

    const anonSupabase = createSupabaseAnonClient();
    const {
      data: { user },
      error: userError,
    } = await anonSupabase.auth.getUser(body.accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "invalid_supabase_session" },
        { status: 401 }
      );
    }

    const serviceSupabase = createSupabaseServiceClient();
    const { data: account, error: accountError } = await serviceSupabase
      .from("user_social_accounts")
      .select("access_token, refresh_token")
      .eq("user_id", user.id)
      .eq("platform", "kick")
      .maybeSingle();

    if (accountError) {
      console.error("Social account fetch error:", accountError);
      return NextResponse.json(
        { error: "database_fetch_failed" },
        { status: 500 }
      );
    }

    await revokeKickToken(account?.access_token ?? null);
    await revokeKickToken(account?.refresh_token ?? null);

    const { error: deleteError } = await serviceSupabase
      .from("user_social_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", "kick");

    if (deleteError) {
      console.error("Social account delete error:", deleteError);
      return NextResponse.json(
        { error: "database_delete_failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Kick disconnect error:", error);

    return NextResponse.json(
      { error: "kick_disconnect_failed" },
      { status: 500 }
    );
  }
}
